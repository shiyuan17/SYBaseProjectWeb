import { readFileSync } from 'node:fs';

const DECISION_ID_PATTERN = /\|\s*(DEC-\d{8}-\d{3})\s*\|/g;
const PROJECT_STATE_REQUIRED_SECTIONS = [
  '## Current State',
  '## Active Work',
  '## Validation Baseline',
  '## Cross-Repo Dependencies',
  '## Handoff Notes',
];
const PROJECT_STATE_MAX_LINES = 120;
const REQUIRED_TOP_LEVEL_DOCS = [
  'PROJECT_DIRECTORY.md',
  'CODING_RULES.md',
  'VUE_TS_RULES.md',
  'UI_RULES.md',
  'STATE_RULES.md',
  'ROUTER_RULES.md',
  'API_RULES.md',
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

function collectDuplicateDecisionIds(decisionsBody) {
  const seen = new Set();
  const duplicates = new Set();

  for (const match of decisionsBody.matchAll(DECISION_ID_PATTERN)) {
    const id = match[1];
    if (seen.has(id)) {
      duplicates.add(id);
      continue;
    }
    seen.add(id);
  }

  return [...duplicates].sort();
}

function extractBulletLinks(body) {
  const matches = body.match(/- \[([^\]]+)\]\(([^)]+)\)/g) ?? [];
  return matches.map((line) => {
    const match = line.match(/- \[([^\]]+)\]\(([^)]+)\)/);
    return match
      ? {
          label: match[1],
          target: match[2],
        }
      : null;
  }).filter(Boolean);
}

function validateDocsIndex(docsReadmeBody) {
  const links = extractBulletLinks(docsReadmeBody);
  const linkedLabels = new Set(links.map((entry) => entry.label));

  return REQUIRED_TOP_LEVEL_DOCS
    .filter((entry) => !linkedLabels.has(entry))
    .map((entry) => `Missing docs/README.md top-level entry: ${entry}`);
}

function validateAgentsIndex(agentsBody) {
  const links = extractBulletLinks(agentsBody);
  const topLevelDocTargets = new Set(
    links
      .filter((entry) => entry.target.startsWith('./docs/'))
      .map((entry) => entry.label.replace(/^docs\//, '')),
  );

  return REQUIRED_TOP_LEVEL_DOCS
    .filter((entry) => !topLevelDocTargets.has(entry))
    .map((entry) => `Missing AGENTS.md related-doc entry: docs/${entry}`);
}

function validateArchitectureCurrentContract(architectureBody) {
  const errors = [];

  if (
    architectureBody.includes('/m6/dashboard uses `POST /api/v1/stat-dashboard/query`') ||
    architectureBody.includes('/m6/dashboard` uses `POST /api/v1/stat-dashboard/query`')
  ) {
    errors.push(
      'ARCHITECTURE.md still describes /m6/dashboard as using POST /api/v1/stat-dashboard/query.',
    );
  }

  return errors;
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
} = {}) {
  const errors = [];

  if (decisionsBody) {
    for (const id of collectDuplicateDecisionIds(decisionsBody)) {
      errors.push(`Duplicate decision ID: ${id}`);
    }
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

function main() {
  const result = validateGovernance({
    agentsBody: readText('AGENTS.md'),
    decisionsBody: readText('DECISIONS.md'),
    docsReadmeBody: readText('docs/README.md'),
    architectureBody: readText('ARCHITECTURE.md'),
    projectStateBody: readText('PROJECT_STATE.md'),
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
