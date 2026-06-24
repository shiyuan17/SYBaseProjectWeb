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
const REQUIRED_RULE_DOCS = [
  'QUICKSTART.md',
  'PROJECT_DIRECTORY.md',
  'CODING_RULES.md',
  'FRONTEND_RULES.md',
  'GIT_RULES.md',
  'DYNAMIC_WORKFLOW_RULES.md',
  'LOOP_ENGINEERING_RULES.md',
  'AGENT_SKILL_ROUTING.md',
  'TASK_INTAKE.md',
  'RELEASE.md',
];
const REQUIRED_MEMORY_DOCS = [
  'PROJECT_STATE.md',
  'TECH_DEBT.md',
  'KNOWN_BUGS.md',
  'DECISIONS.md',
  'ARCHITECTURE.md',
];
const REQUIRED_GOVERNANCE_ANCHORS = {
  'AGENTS.md': [
    '## 一页式执行入口',
    '### 规范单一来源矩阵',
    '## 快速命令',
    '三层阅读路径',
    '### 4. 任务开始模板',
    '红区确认协议',
    '### 8. AI Memory Update',
  ],
  'docs/rules/QUICKSTART.md': [
    '## 三层阅读路径',
    '## 场景最小阅读',
    '## 协作底座（底座层分包）',
  ],
  'docs/rules/CODING_RULES.md': ['标准验证命令'],
  'docs/rules/DYNAMIC_WORKFLOW_RULES.md': [
    '主 Workflow',
    '轻量 Workflow Packet',
    '完整 Workflow Packet',
    'Red Team',
  ],
  'docs/rules/GIT_RULES.md': [
    '### 3.1 AI 主动提交规范',
    '### 3.2 Commit Message 细则',
    '### 3.3 Tag 规范',
    '### 6. 工作树（Worktree）与任务隔离',
    '#### 6.1 Merge-Back 完成定义',
    '### 7. 自动化护栏（lefthook）',
  ],
  'docs/rules/RELEASE.md': [
    '### 1.1 版本号与 Tag 映射',
    '### 3.1 发布 Tag 闭环',
    '### 6.1 基于稳定版本 Tag 回滚',
  ],
  'docs/rules/LOOP_ENGINEERING_RULES.md': [
    '## Loop Packet',
    '最小 Loop Packet',
  ],
  '.github/PULL_REQUEST_TEMPLATE.md': [
    'Packet tier:',
    'Fast Path:',
    'Lightweight:',
    'Full:',
    'Commits created:',
    'Tags created:',
    'Red-zone confirmation:',
  ],
  'docs/templates/workflow-packet-examples.md': [
    '范例：轻量 Workflow Packet',
    '坏例子',
    '修正后',
  ],
};

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
  const linkedTargets = new Set(links.map((entry) => entry.target));

  const errors = [];
  if (!linkedTargets.has('./rules/README.md')) {
    errors.push('Missing docs/README.md rules index entry: ./rules/README.md');
  }
  if (!linkedTargets.has('./memory/README.md')) {
    errors.push(
      'Missing docs/README.md memory index entry: ./memory/README.md',
    );
  }

  return errors;
}

function validateRulesIndex(rulesReadmeBody) {
  const links = extractBulletLinks(rulesReadmeBody);
  const linkedLabels = new Set(links.map((entry) => entry.label));

  return REQUIRED_RULE_DOCS.filter((entry) => !linkedLabels.has(entry)).map(
    (entry) => `Missing docs/rules/README.md entry: ${entry}`,
  );
}

function validateMemoryIndex(memoryReadmeBody) {
  const links = extractBulletLinks(memoryReadmeBody);
  const linkedLabels = new Set(links.map((entry) => entry.label));

  return REQUIRED_MEMORY_DOCS.filter((entry) => !linkedLabels.has(entry)).map(
    (entry) => `Missing docs/memory/README.md entry: ${entry}`,
  );
}

function validateAgentsIndex(agentsBody) {
  const links = extractBulletLinks(agentsBody);
  const ruleDocTargets = new Set(
    links
      .filter((entry) => entry.target.startsWith('./docs/rules/'))
      .map((entry) => entry.label.replace(/^docs\/rules\//, '')),
  );
  const memoryDocTargets = new Set(
    links
      .filter((entry) => entry.target.startsWith('./docs/memory/'))
      .map((entry) => entry.label.replace(/^docs\/memory\//, '')),
  );

  const errors = REQUIRED_RULE_DOCS.filter(
    (entry) => !ruleDocTargets.has(entry),
  ).map((entry) => `Missing AGENTS.md related-doc entry: docs/rules/${entry}`);

  errors.push(
    ...REQUIRED_MEMORY_DOCS.filter((entry) => !memoryDocTargets.has(entry)).map(
      (entry) => `Missing AGENTS.md related-doc entry: docs/memory/${entry}`,
    ),
  );

  return errors;
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

const FORBIDDEN_PATH_LITERAL = 'docs/rules/docs/rules';

function collectForbiddenPathLiterals(documents = []) {
  const errors = [];

  for (const document of documents) {
    if (
      typeof document?.body === 'string' &&
      document.body.includes(FORBIDDEN_PATH_LITERAL)
    ) {
      errors.push(
        `Forbidden doubled docs/rules path in ${document.path}: ${FORBIDDEN_PATH_LITERAL}`,
      );
    }
  }

  return errors;
}

function validateGovernanceAnchors(documentsByPath) {
  const errors = [];

  for (const [path, anchors] of Object.entries(REQUIRED_GOVERNANCE_ANCHORS)) {
    const body = documentsByPath[path];
    if (typeof body !== 'string') {
      errors.push(`Missing governance anchor source: ${path}`);
      continue;
    }

    for (const anchor of anchors) {
      if (!body.includes(anchor)) {
        errors.push(`Missing governance anchor in ${path}: ${anchor}`);
      }
    }
  }

  return errors;
}

export function validateGovernance({
  agentsBody,
  codingRulesBody,
  decisionsBody,
  dynamicWorkflowBody,
  docsReadmeBody,
  rulesReadmeBody,
  memoryReadmeBody,
  gitRulesBody,
  loopEngineeringBody,
  quickstartBody,
  prTemplateBody,
  releaseBody,
  workflowPacketExamplesBody,
  architectureBody,
  projectStateBody,
  knownBugsBody,
  techDebtBody,
  linkedDocuments = [],
  repoRoot = process.cwd(),
  fileExists = existsSync,
  enforceGovernanceAnchors = false,
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

  if (rulesReadmeBody) {
    errors.push(...validateRulesIndex(rulesReadmeBody));
  }

  if (memoryReadmeBody) {
    errors.push(...validateMemoryIndex(memoryReadmeBody));
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

  const documentsForPathLiteralScan = [
    ...(linkedDocuments ?? []),
    agentsBody ? { path: 'AGENTS.md', body: agentsBody } : null,
    projectStateBody
      ? { path: 'docs/memory/PROJECT_STATE.md', body: projectStateBody }
      : null,
    decisionsBody
      ? { path: 'docs/memory/DECISIONS.md', body: decisionsBody }
      : null,
    docsReadmeBody ? { path: 'docs/README.md', body: docsReadmeBody } : null,
    rulesReadmeBody
      ? { path: 'docs/rules/README.md', body: rulesReadmeBody }
      : null,
  ].filter(Boolean);
  errors.push(...collectForbiddenPathLiterals(documentsForPathLiteralScan));

  if (enforceGovernanceAnchors) {
    errors.push(
      ...validateGovernanceAnchors({
        '.github/PULL_REQUEST_TEMPLATE.md': prTemplateBody,
        'AGENTS.md': agentsBody,
        'docs/rules/CODING_RULES.md': codingRulesBody,
        'docs/rules/DYNAMIC_WORKFLOW_RULES.md': dynamicWorkflowBody,
        'docs/rules/GIT_RULES.md': gitRulesBody,
        'docs/rules/LOOP_ENGINEERING_RULES.md': loopEngineeringBody,
        'docs/rules/QUICKSTART.md': quickstartBody,
        'docs/rules/RELEASE.md': releaseBody,
        'docs/templates/workflow-packet-examples.md':
          workflowPacketExamplesBody,
      }),
    );
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
  'docs/rules/README.md',
  'docs/memory/README.md',
  '.github/PULL_REQUEST_TEMPLATE.md',
  'docs/rules/CODING_RULES.md',
  'docs/rules/GIT_RULES.md',
  'docs/rules/DYNAMIC_WORKFLOW_RULES.md',
  'docs/rules/LOOP_ENGINEERING_RULES.md',
  'docs/rules/QUICKSTART.md',
  'docs/rules/AGENT_SKILL_ROUTING.md',
  'docs/rules/TASK_INTAKE.md',
  'docs/rules/PROJECT_DIRECTORY.md',
  'docs/rules/RELEASE.md',
  'docs/rules/FRONTEND_RULES.md',
  'docs/memory/PROJECT_STATE.md',
  'docs/memory/DECISIONS.md',
  'docs/memory/KNOWN_BUGS.md',
  'docs/memory/TECH_DEBT.md',
  'docs/memory/ARCHITECTURE.md',
  'docs/templates/README.md',
  'docs/templates/agents-governance-audit-prompt-template.md',
  'docs/templates/codex-goal-prompt-template.md',
  'docs/templates/plan-to-task-goals-prompt-template.md',
  'docs/templates/task-item-template.md',
  'docs/templates/workflow-packet-examples.md',
];

function main() {
  const result = validateGovernance({
    agentsBody: readText('AGENTS.md'),
    codingRulesBody: readText('docs/rules/CODING_RULES.md'),
    decisionsBody: readText('docs/memory/DECISIONS.md'),
    dynamicWorkflowBody: readText('docs/rules/DYNAMIC_WORKFLOW_RULES.md'),
    docsReadmeBody: readText('docs/README.md'),
    rulesReadmeBody: readText('docs/rules/README.md'),
    memoryReadmeBody: readText('docs/memory/README.md'),
    gitRulesBody: readText('docs/rules/GIT_RULES.md'),
    loopEngineeringBody: readText('docs/rules/LOOP_ENGINEERING_RULES.md'),
    quickstartBody: readText('docs/rules/QUICKSTART.md'),
    prTemplateBody: readText('.github/PULL_REQUEST_TEMPLATE.md'),
    releaseBody: readText('docs/rules/RELEASE.md'),
    workflowPacketExamplesBody: readText(
      'docs/templates/workflow-packet-examples.md',
    ),
    architectureBody: readText('docs/memory/ARCHITECTURE.md'),
    projectStateBody: readText('docs/memory/PROJECT_STATE.md'),
    knownBugsBody: readText('docs/memory/KNOWN_BUGS.md'),
    techDebtBody: readText('docs/memory/TECH_DEBT.md'),
    enforceGovernanceAnchors: true,
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
