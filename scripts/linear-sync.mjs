import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const workspaceRoot = process.cwd();
const settingsPath = path.join(workspaceRoot, 'linear-setting.json');
const mode = process.argv[2] ?? 'sync';
const showJson = process.argv.includes('--json');
const DEFAULT_LINEAR_TEAM_NAME = 'Sidney';
const DEFAULT_LABEL_COLOR = '#0f766e';

function readMultiValueOption(flag) {
  const values = [];
  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] !== flag) {
      continue;
    }
    const nextValue = process.argv[index + 1];
    if (
      typeof nextValue === 'string' &&
      nextValue.trim() !== '' &&
      !nextValue.startsWith('--')
    ) {
      values.push(nextValue.trim());
    }
  }
  return values;
}

function fail(message) {
  throw new Error(message);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function compactText(value) {
  return String(value).replaceAll('\r\n', '\n').trim();
}

function ensureArray(value, label) {
  if (!Array.isArray(value)) {
    fail(`Expected ${label} to be an array.`);
  }
  return value;
}

function ensureString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    fail(`Expected ${label} to be a non-empty string.`);
  }
  return value.trim();
}

function optionalString(value) {
  return typeof value === 'string' && value.trim() !== ''
    ? value.trim()
    : undefined;
}

function normalizeLabelName(value) {
  return ensureString(value, 'label name').toLowerCase();
}

function normalizeEnvValue(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseEnvText(text) {
  const result = new Map();
  const lines = text.split(/\r?\n/u);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const normalizedLine = line.startsWith('export ')
      ? line.slice('export '.length).trim()
      : line;
    const separatorIndex = normalizedLine.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = normalizedLine.slice(0, separatorIndex).trim();
    const value = normalizedLine.slice(separatorIndex + 1);
    result.set(key, normalizeEnvValue(value));
  }

  return result;
}

async function readTokenFromEnvFiles() {
  const envFilePaths = [
    path.join(workspaceRoot, '.env'),
    path.join(workspaceRoot, '.env.local'),
  ];

  let token = '';
  for (const envFilePath of envFilePaths) {
    try {
      const text = await readFile(envFilePath, 'utf8');
      const parsed = parseEnvText(text);
      const nextToken = parsed.get('LINEAR_API_TOKEN');
      if (nextToken) {
        token = nextToken;
      }
    } catch (error) {
      if (error && typeof error === 'object' && error.code === 'ENOENT') {
        continue;
      }
      throw error;
    }
  }

  return token;
}

async function resolveLinearToken() {
  const tokenFromProcess = process.env.LINEAR_API_TOKEN?.trim();
  if (tokenFromProcess) {
    return tokenFromProcess;
  }

  const tokenFromFile = await readTokenFromEnvFiles();
  if (tokenFromFile) {
    return tokenFromFile;
  }

  fail(
    'Missing Linear token. Set LINEAR_API_TOKEN in the shell or root .env.local file.',
  );
}

async function loadSettings() {
  const raw = await readFile(settingsPath, 'utf8');
  const settings = JSON.parse(raw);

  if (!isObject(settings)) {
    fail('linear-setting.json must contain a JSON object.');
  }

  const token = await resolveLinearToken();
  const apiUrl = ensureString(settings['linear-api-url'], 'linear-api-url');
  const team = isObject(settings['linear-team']) ? settings['linear-team'] : {};
  const project = isObject(settings['linear-project'])
    ? settings['linear-project']
    : {};
  const labels = Array.isArray(settings['linear-labels'])
    ? settings['linear-labels']
    : [
        {
          color: DEFAULT_LABEL_COLOR,
          name: ensureString(
            settings['linear-backend-label'],
            'linear-backend-label',
          ),
        },
      ];
  const plan = ensureArray(settings['linear-plan'], 'linear-plan');

  return {
    raw: settings,
    token,
    apiUrl,
    team: {
      id: optionalString(team?.id),
      key: optionalString(team?.key),
      name:
        optionalString(team?.name) ||
        optionalString(settings['linear-team-name']) ||
        DEFAULT_LINEAR_TEAM_NAME,
    },
    project: {
      id: optionalString(project?.id),
      name:
        optionalString(project?.name) ||
        ensureString(settings['linear-project-name'], 'linear-project-name'),
      slugId: optionalString(project?.slugId),
    },
    labels: labels.map((label, index) => ({
      id: typeof label?.id === 'string' ? label.id : undefined,
      name: ensureString(label?.name, `linear-labels[${index}].name`),
      description:
        typeof label?.description === 'string' ? label.description : '',
      color: typeof label?.color === 'string' ? label.color : '#0f766e',
    })),
    plan: plan.map((item, index) => ({
      phase: ensureString(item?.phase, `linear-plan[${index}].phase`),
      domain: ensureString(item?.domain, `linear-plan[${index}].domain`),
      title: ensureString(item?.title, `linear-plan[${index}].title`),
      description: ensureString(
        item?.description,
        `linear-plan[${index}].description`,
      ),
      dueDate:
        typeof item?.dueDate === 'string' && item.dueDate.trim() !== ''
          ? item.dueDate.trim()
          : undefined,
      labels: Array.isArray(item?.labels)
        ? item.labels.map((label, labelIndex) =>
            ensureString(label, `linear-plan[${index}].labels[${labelIndex}]`),
          )
        : [],
    })),
    sync: isObject(settings['linear-sync']) ? settings['linear-sync'] : {},
  };
}

async function saveSettings(settings) {
  const nextRaw = {
    ...settings.raw,
    'linear-labels': settings.raw['linear-labels'],
  };
  await writeFile(
    settingsPath,
    `${JSON.stringify(nextRaw, null, 2)}\n`,
    'utf8',
  );
}

function graphqlDocument(strings, ...values) {
  return String.raw({ raw: strings }, ...values);
}

async function requestLinear(settings, document, variables = {}) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: settings.token,
  };

  const body = JSON.stringify({
    query: compactText(document),
    variables,
  });

  const response = await fetch(settings.apiUrl, {
    method: 'POST',
    headers,
    body,
  });

  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text || '{}');
  } catch {
    fail(`Linear response was not JSON: ${text.slice(0, 200)}`);
  }
  if (!isObject(payload)) {
    fail(`Linear response was not JSON: ${text.slice(0, 200)}`);
  }

  if (!response.ok || payload.errors?.length) {
    const message =
      payload.errors?.map((error) => error.message).join('; ') ||
      `Linear request failed with status ${response.status}`;
    fail(message);
  }

  return payload.data;
}

function buildIssueFilter(settings, titles, projectOnly = false) {
  return {
    team: {
      id: {
        eq: settings.team.id,
      },
    },
    ...(projectOnly
      ? {
          project: {
            id: {
              eq: settings.project.id,
            },
          },
        }
      : {}),
    or: titles.map((title) => ({
      title: {
        eq: title,
      },
    })),
  };
}

function buildProjectIssueFilter(settings) {
  return {
    team: {
      id: {
        eq: settings.team.id,
      },
    },
    project: {
      id: {
        eq: settings.project.id,
      },
    },
  };
}

function buildLabelFilter(settings, labelNames) {
  return {
    team: {
      id: {
        eq: settings.team.id,
      },
    },
    or: labelNames.map((labelName) => ({
      name: {
        eqIgnoreCase: labelName,
      },
    })),
  };
}

async function ensureLabel(settings, labelInput, teamLabelsByName) {
  const existing = teamLabelsByName.get(normalizeLabelName(labelInput.name));
  if (existing) {
    return existing;
  }

  const data = await requestLinear(
    settings,
    graphqlDocument`
      mutation CreateLabel($input: IssueLabelCreateInput!) {
        issueLabelCreate(input: $input) {
          success
          issueLabel {
            id
            name
            color
            description
          }
        }
      }
    `,
    {
      input: {
        teamId: settings.team.id,
        name: labelInput.name,
        description: labelInput.description || undefined,
        color: labelInput.color,
      },
    },
  );

  const created = data.issueLabelCreate.issueLabel;
  if (!created?.id) {
    fail(`Failed to create Linear label: ${labelInput.name}`);
  }

  teamLabelsByName.set(normalizeLabelName(created.name), created);
  return created;
}

async function resolveRegisterIdentity(settings) {
  if (settings.team.id && settings.project.id && settings.project.slugId) {
    return false;
  }

  const data = await requestLinear(
    settings,
    graphqlDocument`
      query LinearRegisterIdentity {
        teams(first: 250) {
          nodes {
            id
            key
            name
          }
        }
        projects(first: 250) {
          nodes {
            id
            name
            slugId
            url
          }
        }
      }
    `,
  );

  const expectedTeamName = settings.team.name.toLowerCase();
  const team = (data.teams?.nodes ?? []).find(
    (item) =>
      item.id === settings.team.id ||
      item.key?.toLowerCase() === settings.team.key?.toLowerCase() ||
      item.name?.toLowerCase() === expectedTeamName,
  );
  if (!team?.id) {
    fail(`Linear team not found by name/key: ${settings.team.name}`);
  }

  const expectedProjectName = settings.project.name.toLowerCase();
  const project = (data.projects?.nodes ?? []).find(
    (item) =>
      item.id === settings.project.id ||
      item.slugId === settings.project.slugId ||
      item.name?.toLowerCase() === expectedProjectName,
  );
  if (!project?.id) {
    fail(`Linear project not found by name/slug: ${settings.project.name}`);
  }

  settings.team = {
    id: team.id,
    key: team.key,
    name: team.name,
  };
  settings.project = {
    id: project.id,
    name: project.name,
    slugId: project.slugId,
  };
  settings.raw['linear-team'] = settings.team;
  settings.raw['linear-project'] = settings.project;
  settings.raw['linear-labels'] =
    settings.raw['linear-labels'] ?? settings.labels;

  return true;
}

async function ensureRegister(settings) {
  const identityChanged = await resolveRegisterIdentity(settings);
  const context = await requestLinear(
    settings,
    graphqlDocument`
      query RegisterContext(
        $teamId: String!
        $projectId: String!
        $labelFilter: IssueLabelFilter!
      ) {
        team(id: $teamId) {
          id
          name
          key
        }
        project(id: $projectId) {
          id
          name
          slugId
          url
        }
        issueLabels(first: 100, includeArchived: true, filter: $labelFilter) {
          nodes {
            id
            name
            color
            description
          }
        }
      }
    `,
    {
      teamId: settings.team.id,
      projectId: settings.project.id,
      labelFilter: buildLabelFilter(
        settings,
        settings.labels.map((label) => label.name),
      ),
    },
  );

  const team = context.team;
  const project = context.project;

  if (!team) {
    fail(`Linear team not found: ${settings.team.name} (${settings.team.id})`);
  }

  if (!project) {
    fail(
      `Linear project not found: ${settings.project.name} (${settings.project.id})`,
    );
  }

  if (project.name !== settings.project.name) {
    fail(
      `Linear project name mismatch: expected ${settings.project.name}, got ${project.name}`,
    );
  }

  if (project.slugId !== settings.project.slugId) {
    fail(
      `Linear project slug mismatch: expected ${settings.project.slugId}, got ${project.slugId}`,
    );
  }

  const teamLabels = context.issueLabels?.nodes ?? [];
  const teamLabelMap = new Map(
    teamLabels.map((label) => [normalizeLabelName(label.name), label]),
  );

  let labelChanged = false;

  for (const labelInput of settings.labels) {
    const existing = teamLabelMap.get(normalizeLabelName(labelInput.name));
    const label =
      existing ?? (await ensureLabel(settings, labelInput, teamLabelMap));

    const sourceLabel = settings.raw['linear-labels'].find(
      (item) =>
        normalizeLabelName(item.name) === normalizeLabelName(labelInput.name),
    );
    if (sourceLabel?.id !== label.id) {
      sourceLabel.id = label.id;
      labelChanged = true;
    }
  }

  if (labelChanged) {
    await saveSettings(settings);
  } else if (identityChanged) {
    await saveSettings(settings);
  }

  return {
    team,
    project,
    labels: settings.raw['linear-labels'],
  };
}

function buildIssueLabelIds(existingIssue, defaultLabelIds) {
  const currentIds = new Set(
    (existingIssue?.labels?.nodes ?? []).map((label) => label.id),
  );
  for (const labelId of defaultLabelIds) {
    currentIds.add(labelId);
  }
  return [...currentIds];
}

async function listIssues(settings, titles, projectOnly = false) {
  if (titles.length === 0) {
    return [];
  }

  const data = await requestLinear(
    settings,
    graphqlDocument`
      query IssuesByTitle($filter: IssueFilter!) {
        issues(first: 100, includeArchived: true, filter: $filter) {
          nodes {
            id
            number
            identifier
            title
            url
            updatedAt
            description
            dueDate
            project {
              id
              name
            }
            labels {
              nodes {
                id
                name
              }
            }
          }
        }
      }
    `,
    {
      filter: buildIssueFilter(settings, titles, projectOnly),
    },
  );

  return data.issues?.nodes ?? [];
}

async function listProjectIssues(settings) {
  const data = await requestLinear(
    settings,
    graphqlDocument`
      query IssuesByProject($filter: IssueFilter!) {
        issues(first: 250, includeArchived: false, filter: $filter) {
          nodes {
            id
            number
            identifier
            title
            url
            updatedAt
            dueDate
            labels {
              nodes {
                id
                name
              }
            }
          }
        }
      }
    `,
    {
      filter: buildProjectIssueFilter(settings),
    },
  );

  return data.issues?.nodes ?? [];
}

async function createIssue(settings, item, labelIds) {
  const data = await requestLinear(
    settings,
    graphqlDocument`
      mutation CreateIssue($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue {
            id
            number
            identifier
            title
            url
          }
        }
      }
    `,
    {
      input: {
        teamId: settings.team.id,
        projectId: settings.project.id,
        title: item.title,
        description: item.description,
        labelIds,
        dueDate: item.dueDate,
      },
    },
  );

  return data.issueCreate.issue;
}

async function updateIssue(settings, issueId, item, labelIds) {
  const data = await requestLinear(
    settings,
    graphqlDocument`
      mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
        issueUpdate(id: $id, input: $input) {
          success
          issue {
            id
            number
            identifier
            title
            url
          }
        }
      }
    `,
    {
      id: issueId,
      input: {
        projectId: settings.project.id,
        title: item.title,
        description: item.description,
        labelIds,
        dueDate: item.dueDate,
      },
    },
  );

  return data.issueUpdate.issue;
}

async function archiveIssue(settings, issueId) {
  try {
    const data = await requestLinear(
      settings,
      graphqlDocument`
        mutation ArchiveIssue($id: String!) {
          issueArchive(id: $id) {
            success
            issue {
              id
              identifier
              title
              url
            }
          }
        }
      `,
      {
        id: issueId,
      },
    );

    return data.issueArchive.issue;
  } catch {
    const data = await requestLinear(
      settings,
      graphqlDocument`
        mutation ArchiveIssue($id: String!, $archived: Boolean!) {
          issueArchive(id: $id, archived: $archived) {
            success
            issue {
              id
              identifier
              title
              url
            }
          }
        }
      `,
      {
        id: issueId,
        archived: true,
      },
    );

    return data.issueArchive.issue;
  }
}

async function registerCommand() {
  const settings = await loadSettings();
  const registerResult = await ensureRegister(settings);
  const labelSummary = registerResult.labels
    .map((label) => `${label.name}${label.id ? ` (${label.id})` : ''}`)
    .join(', ');

  console.log(
    `Registered project ${settings.project.name} and labels: ${labelSummary}`,
  );
}

async function syncCommand() {
  const settings = await loadSettings();
  const registerResult = await ensureRegister(settings);
  const issues = await listIssues(
    settings,
    settings.plan.map((item) => item.title),
  );
  const issueByTitle = new Map(issues.map((issue) => [issue.title, issue]));
  const defaultLabelIds = registerResult.labels.map((label) => label.id);

  const created = [];
  const updated = [];

  for (const item of settings.plan) {
    const labelNames =
      item.labels.length > 0
        ? item.labels
        : (settings.sync['default-labels'] ?? []);
    const labelIds = labelNames
      .map(
        (labelName) =>
          registerResult.labels.find(
            (label) =>
              normalizeLabelName(label.name) === normalizeLabelName(labelName),
          )?.id,
      )
      .filter(Boolean);

    const existingIssue = issueByTitle.get(item.title);
    if (existingIssue) {
      const nextLabelIds = buildIssueLabelIds(existingIssue, [
        ...defaultLabelIds,
        ...labelIds,
      ]);
      const currentLabelIds = (existingIssue.labels?.nodes ?? []).map(
        (label) => label.id,
      );
      const currentDescription = existingIssue.description ?? '';
      const shouldUpdate =
        currentDescription.trim() !== item.description.trim() ||
        (existingIssue.dueDate ?? '') !== (item.dueDate ?? '') ||
        nextLabelIds.length !== currentLabelIds.length ||
        nextLabelIds.some((labelId) => !currentLabelIds.includes(labelId));

      if (shouldUpdate) {
        const issue = await updateIssue(
          settings,
          existingIssue.id,
          item,
          nextLabelIds,
        );
        updated.push(issue);
      }
      continue;
    }

    const issue = await createIssue(settings, item, [
      ...new Set([...defaultLabelIds, ...labelIds]),
    ]);
    created.push(issue);
  }

  const summary = {
    created: created.map((issue) => ({
      identifier: issue.identifier,
      title: issue.title,
      url: issue.url,
    })),
    updated: updated.map((issue) => ({
      identifier: issue.identifier,
      title: issue.title,
      url: issue.url,
    })),
  };

  if (showJson) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  console.log(
    `Sync complete: ${created.length} created, ${updated.length} updated.`,
  );
  for (const issue of [...created, ...updated]) {
    console.log(`- ${issue.identifier}: ${issue.title} ${issue.url}`);
  }
}

async function pullCommand() {
  const settings = await loadSettings();
  const registerResult = await ensureRegister(settings);
  const issues = await listIssues(
    settings,
    settings.plan.map((item) => item.title),
    true,
  );
  const plannedTitles = new Set(settings.plan.map((item) => item.title));
  const relevantIssues = issues.filter((issue) =>
    plannedTitles.has(issue.title),
  );

  const items = settings.plan.map((item) => {
    const issue = relevantIssues.find((entry) => entry.title === item.title);
    return {
      phase: item.phase,
      domain: item.domain,
      title: item.title,
      issue: issue
        ? {
            identifier: issue.identifier,
            url: issue.url,
            updatedAt: issue.updatedAt,
            dueDate: issue.dueDate ?? null,
          }
        : null,
    };
  });

  if (showJson) {
    console.log(
      JSON.stringify({ project: registerResult.project, items }, null, 2),
    );
    return;
  }

  console.log(
    `Pulled ${items.length} planned issues from ${settings.project.name}.`,
  );
  for (const item of items) {
    if (item.issue) {
      const dueDateText = item.issue.dueDate ? ` @ ${item.issue.dueDate}` : '';
      console.log(`- ${item.issue.identifier}: ${item.title}${dueDateText}`);
    } else {
      console.log(`- MISSING: ${item.title}`);
    }
  }
}

function normalizeNameSet(values) {
  return new Set(values.map((value) => value.trim().toLowerCase()));
}

async function cleanupFrontendCommand() {
  const settings = await loadSettings();
  await ensureRegister(settings);

  const keepDomains = normalizeNameSet(readMultiValueOption('--keep-domain'));
  const explicitKeepTitles = new Set(readMultiValueOption('--keep-title'));
  const frontendLabelNames =
    readMultiValueOption('--label').length > 0
      ? readMultiValueOption('--label')
      : (settings.sync['default-labels'] ?? []).map(String);

  const planKeepTitles = settings.plan
    .filter((item) => keepDomains.has(item.domain.toLowerCase()))
    .map((item) => item.title);
  const keepTitles = new Set([...explicitKeepTitles, ...planKeepTitles]);

  const frontendLabelNameSet = normalizeNameSet(frontendLabelNames);
  const projectIssues = await listProjectIssues(settings);
  const frontendIssues = projectIssues.filter((issue) =>
    (issue.labels?.nodes ?? []).some((label) =>
      frontendLabelNameSet.has(label.name.toLowerCase()),
    ),
  );

  const kept = [];
  const archived = [];
  const targets = frontendIssues.filter((issue) => {
    const shouldKeep = keepTitles.has(issue.title);
    if (shouldKeep) {
      kept.push(issue);
    }
    return !shouldKeep;
  });

  for (const issue of targets) {
    const archivedIssue = await archiveIssue(settings, issue.id);
    archived.push(archivedIssue ?? issue);
  }

  const summary = {
    archived: archived.map((issue) => ({
      identifier: issue.identifier,
      title: issue.title,
      url: issue.url,
    })),
    kept: kept.map((issue) => ({
      identifier: issue.identifier,
      title: issue.title,
      url: issue.url,
    })),
    totalFrontendIssues: frontendIssues.length,
  };

  if (showJson) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  console.log(
    `Cleanup complete: archived ${archived.length}, kept ${kept.length}, matched ${frontendIssues.length} frontend issues.`,
  );
  for (const issue of archived) {
    console.log(`- ARCHIVED ${issue.identifier}: ${issue.title}`);
  }
  for (const issue of kept) {
    console.log(`- KEPT ${issue.identifier}: ${issue.title}`);
  }
}

async function main() {
  if (mode === 'register') {
    await registerCommand();
    return;
  }

  if (mode === 'pull') {
    await pullCommand();
    return;
  }

  if (mode === 'sync') {
    await syncCommand();
    return;
  }

  if (mode === 'cleanup-frontend') {
    await cleanupFrontendCommand();
    return;
  }

  fail(`Unsupported mode: ${mode}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
