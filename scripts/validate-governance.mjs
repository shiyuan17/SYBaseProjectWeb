import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';

const DECISION_ID_PATTERN = /\|\s*(DEC-\d{8}-\d{3})\s*\|/g;
const BUG_ID_PATTERN = /\|\s*(BUG-\d{8}-\d{3})\s*\|/g;
const TECH_DEBT_ID_PATTERN = /\|\s*(TD-\d{8}-\d{3})\s*\|/g;
const MARKDOWN_LINK_PATTERN = /\[[^\]]*\]\(([^)\s]+)\)/g;
const PROJECT_STATE_REQUIRED_SECTIONS = [
  '## Current State',
  '## Active Work',
  '## Validation Baseline',
  '## Cross-Repo Dependencies',
  '## Handoff Notes',
];
const PROJECT_STATE_MAX_LINES = 120;
// 台账软上限：超限说明该归档历史/已关闭条目（迁入 docs/reviews/ 归档文件），不是删除历史
const LEDGER_MAX_LINES = 200;
const REQUIRED_TOP_LEVEL_DOCS = [
  'PROJECT_DIRECTORY.md',
  'CODING_RULES.md',
  'VUE_TS_RULES.md',
  'UI_RULES.md',
  'STATE_RULES.md',
  'ROUTER_RULES.md',
  'API_RULES.md',
  'TESTING_RULES.md',
  'COMPATIBILITY_RULES.md',
  'GIT_RULES.md',
  'DYNAMIC_WORKFLOW_RULES.md',
  'LOOP_ENGINEERING_RULES.md',
  'AGENT_SKILL_ROUTING.md',
  'LINEAR_TASK.md',
  'RELEASE.md',
  'AI-CODE-HEALTH.md',
];

function readText(path) {
  return readFileSync(path, 'utf8');
}

function collectDuplicateLedgerIds(body, idPattern) {
  const seen = new Set();
  const duplicates = new Set();

  for (const match of body.matchAll(idPattern)) {
    const id = match[1];
    if (seen.has(id)) {
      duplicates.add(id);
      continue;
    }
    seen.add(id);
  }

  return [...duplicates].toSorted();
}

function isCheckableLinkTarget(target) {
  if (/^(https?:|mailto:|#)/i.test(target)) {
    return false;
  }
  // 模板占位（如 <issue url>）不做存在性检查
  if (target.includes('<') || target.includes('>')) {
    return false;
  }
  return true;
}

function collectBrokenLinks({ sourcePath, body, repoRoot, fileExists }) {
  const errors = [];
  const sourceDir = dirname(resolve(repoRoot, sourcePath));

  for (const match of body.matchAll(MARKDOWN_LINK_PATTERN)) {
    const rawTarget = match[1];
    if (!isCheckableLinkTarget(rawTarget)) {
      continue;
    }

    const targetWithoutAnchor = rawTarget.split('#')[0];
    if (targetWithoutAnchor.length === 0) {
      continue;
    }

    const resolvedTarget = isAbsolute(targetWithoutAnchor)
      ? targetWithoutAnchor
      : resolve(sourceDir, decodeURIComponent(targetWithoutAnchor));

    // 跨仓引用（解析到仓库根之外）由人工/跨仓核对，不在本仓校验
    const relativeToRoot = relative(resolve(repoRoot), resolvedTarget);
    if (relativeToRoot.startsWith('..') || isAbsolute(relativeToRoot)) {
      continue;
    }

    if (!fileExists(resolvedTarget)) {
      errors.push(`Broken link in ${sourcePath}: ${rawTarget}`);
    }
  }

  return errors;
}

function extractBulletLinks(body) {
  const matches = body.match(/- \[([^\]]+)\]\(([^)]+)\)/g) ?? [];
  return matches
    .map((line) => {
      const match = line.match(/- \[([^\]]+)\]\(([^)]+)\)/);
      return match
        ? {
            label: match[1],
            target: match[2],
          }
        : null;
    })
    .filter(Boolean);
}

function validateDocsIndex(docsReadmeBody) {
  const links = extractBulletLinks(docsReadmeBody);
  const linkedLabels = new Set(links.map((entry) => entry.label));

  return REQUIRED_TOP_LEVEL_DOCS.filter(
    (entry) => !linkedLabels.has(entry),
  ).map((entry) => `Missing docs/README.md top-level entry: ${entry}`);
}

function validateAgentsIndex(agentsBody) {
  const links = extractBulletLinks(agentsBody);
  const topLevelDocTargets = new Set(
    links
      .filter((entry) => entry.target.startsWith('./docs/'))
      .map((entry) => entry.label.replace(/^docs\//, '')),
  );

  return REQUIRED_TOP_LEVEL_DOCS.filter(
    (entry) => !topLevelDocTargets.has(entry),
  ).map((entry) => `Missing AGENTS.md related-doc entry: docs/${entry}`);
}

function validateArchitectureCurrentContract(architectureBody) {
  const errors = [];

  if (
    architectureBody.includes(
      '/m6/dashboard uses `POST /api/v1/stat-dashboard/query`',
    ) ||
    architectureBody.includes(
      '/m6/dashboard` uses `POST /api/v1/stat-dashboard/query`',
    )
  ) {
    errors.push(
      'ARCHITECTURE.md still describes /m6/dashboard as using POST /api/v1/stat-dashboard/query.',
    );
  }

  return errors;
}

function validateLedgerSize(name, body) {
  const lineCount = body.split(/\r?\n/).length;

  if (lineCount > LEDGER_MAX_LINES) {
    return [
      `${name} is too long: ${lineCount} lines (limit ${LEDGER_MAX_LINES}). ` +
        'Archive resolved/historical entries into docs/reviews/ instead of deleting them.',
    ];
  }

  return [];
}

function validateProjectState(projectStateBody) {
  const errors = [];
  const lines = projectStateBody.split(/\r?\n/);

  if (lines.length > PROJECT_STATE_MAX_LINES) {
    errors.push(
      `PROJECT_STATE.md is too long: ${lines.length} lines (limit ${PROJECT_STATE_MAX_LINES}).`,
    );
  }

  for (const section of PROJECT_STATE_REQUIRED_SECTIONS) {
    if (!projectStateBody.includes(section)) {
      errors.push(`PROJECT_STATE.md is missing required section: ${section}`);
    }
  }

  return errors;
}

export function validateGovernance({
  agentsBody,
  decisionsBody,
  docsReadmeBody,
  architectureBody,
  projectStateBody,
  knownBugsBody,
  techDebtBody,
  linkedDocuments = [],
  repoRoot = process.cwd(),
  fileExists = existsSync,
} = {}) {
  const errors = [];

  if (decisionsBody) {
    for (const id of collectDuplicateLedgerIds(
      decisionsBody,
      DECISION_ID_PATTERN,
    )) {
      errors.push(`Duplicate decision ID: ${id}`);
    }
    errors.push(...validateLedgerSize('DECISIONS.md', decisionsBody));
  }

  if (knownBugsBody) {
    for (const id of collectDuplicateLedgerIds(knownBugsBody, BUG_ID_PATTERN)) {
      errors.push(`Duplicate bug ID: ${id}`);
    }
    errors.push(...validateLedgerSize('KNOWN_BUGS.md', knownBugsBody));
  }

  if (techDebtBody) {
    for (const id of collectDuplicateLedgerIds(
      techDebtBody,
      TECH_DEBT_ID_PATTERN,
    )) {
      errors.push(`Duplicate tech debt ID: ${id}`);
    }
    errors.push(...validateLedgerSize('TECH_DEBT.md', techDebtBody));
  }

  for (const document of linkedDocuments) {
    errors.push(
      ...collectBrokenLinks({
        sourcePath: document.path,
        body: document.body,
        repoRoot,
        fileExists,
      }),
    );
  }

  if (docsReadmeBody) {
    errors.push(...validateDocsIndex(docsReadmeBody));
  }

  if (agentsBody) {
    errors.push(...validateAgentsIndex(agentsBody));
  }

  if (architectureBody) {
    errors.push(...validateArchitectureCurrentContract(architectureBody));
  }

  if (projectStateBody) {
    errors.push(...validateProjectState(projectStateBody));
  }

  return {
    errors,
    isValid: errors.length === 0,
  };
}

const LINK_CHECKED_DOCUMENTS = [
  'AGENTS.md',
  'README.md',
  'docs/README.md',
  'PROJECT_STATE.md',
  'DECISIONS.md',
  'KNOWN_BUGS.md',
  'TECH_DEBT.md',
  'ARCHITECTURE.md',
  'docs/CODING_RULES.md',
  'docs/GIT_RULES.md',
  'docs/DYNAMIC_WORKFLOW_RULES.md',
  'docs/LOOP_ENGINEERING_RULES.md',
  'docs/AGENT_SKILL_ROUTING.md',
  'docs/LINEAR_TASK.md',
  'docs/AI-CODE-HEALTH.md',
  'docs/TESTING_RULES.md',
  'docs/templates/workflow-packet-examples.md',
];

function main() {
  const result = validateGovernance({
    agentsBody: readText('AGENTS.md'),
    decisionsBody: readText('DECISIONS.md'),
    docsReadmeBody: readText('docs/README.md'),
    architectureBody: readText('ARCHITECTURE.md'),
    projectStateBody: readText('PROJECT_STATE.md'),
    knownBugsBody: readText('KNOWN_BUGS.md'),
    techDebtBody: readText('TECH_DEBT.md'),
    linkedDocuments: LINK_CHECKED_DOCUMENTS.map((path) => ({
      path,
      body: readText(path),
    })),
  });

  if (result.isValid) {
    console.log('Governance validation passed.');
    return;
  }

  console.error('Governance validation failed:');
  for (const error of result.errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
}

if (process.argv[1]?.endsWith('validate-governance.mjs')) {
  main();
}
