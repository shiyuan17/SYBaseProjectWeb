import { existsSync, readdirSync, readFileSync } from 'node:fs';
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
  'API_RULES.md',
  'DB_RULES.md',
  'TEST_RULES.md',
  'REVIEW_RULES.md',
  'GIT_RULES.md',
  'DYNAMIC_WORKFLOW_RULES.md',
  'TASK_LIFECYCLE_RULES.md',
  'LOOP_ENGINEERING_RULES.md',
  'AGENT_SKILL_ROUTING.md',
  'TASK_INTAKE.md',
  'TASK_MANAGEMENT_RULES.md',
  'RELEASE.md',
];
const REQUIRED_MEMORY_DOCS = [
  'PROJECT_STATE.md',
  'TECH_DEBT.md',
  'KNOWN_BUGS.md',
  'DECISIONS.md',
  'ARCHITECTURE.md',
];
const REQUIRED_TEMPLATE_DOCS = [
  'agents-governance-audit-prompt-template.md',
  'clarification-template.md',
  'codex-goal-prompt-template.md',
  'handoff-template.md',
  'plan-to-task-goals-prompt-template.md',
  'retrospective-template.md',
  'spec-template.md',
  'task-item-template.md',
  'workflow-packet-examples.md',
];
const BACKLOG_ID_PATTERN = /^T-\d{3}$/;
const BACKLOG_STATUSES = new Set([
  'blocked',
  'cancelled',
  'done',
  'in_progress',
  'ready',
  'review',
  'todo',
]);
const BACKLOG_RISKS = new Set(['high', 'low', 'medium']);
const BACKLOG_PACKET_TIERS = new Set(['Fast Path', 'Full', 'Lightweight']);
const TASK_DOCUMENT_REQUIRED_SECTIONS = [
  '## Goal',
  '## Inputs',
  '## Outputs',
  '## Constraints',
  '## Acceptance Criteria',
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
  'docs/rules/API_RULES.md': [
    '## 单一来源',
    '## Mapper 与兼容',
    '## AI Agent 禁止项',
  ],
  'docs/rules/DB_RULES.md': ['## 触发条件', '## 跨仓证据', '## 回滚与发布'],
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
  'docs/rules/REVIEW_RULES.md': [
    '## Review 五轴',
    '## 阻塞条件',
    '## 证据质量',
  ],
  '.github/PULL_REQUEST_TEMPLATE.md': [
    'Packet tier:',
    'Fast Path:',
    'Lightweight:',
    'Full:',
    'Commits created:',
    'Tags created:',
    'Lifecycle artifacts:',
    'Red-zone confirmation:',
  ],
  'docs/rules/TASK_LIFECYCLE_RULES.md': [
    '## 生命周期与 Workflow 的关系',
    '## 阶段速查',
    'Clarify',
    'Retrospective',
  ],
  'docs/rules/TEST_RULES.md': ['## 测试分层', '## 触发矩阵', '## 强制规则'],
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

function validateTemplatesIndex(templatesReadmeBody) {
  const links = extractBulletLinks(templatesReadmeBody);
  const linkedLabels = new Set(links.map((entry) => entry.label));

  return REQUIRED_TEMPLATE_DOCS.filter((entry) => !linkedLabels.has(entry)).map(
    (entry) => `Missing docs/templates/README.md entry: ${entry}`,
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

function parseBacklog(backlogBody, errors) {
  if (!backlogBody) {
    return [];
  }

  let parsed;
  try {
    parsed = JSON.parse(backlogBody);
  } catch (error) {
    errors.push(`Invalid backlog.json: ${error.message}`);
    return [];
  }

  if (!Array.isArray(parsed)) {
    errors.push('Invalid backlog.json: expected top-level array');
    return [];
  }

  return parsed;
}

function collectTaskDocumentId(document) {
  const fromPath = document.path.match(/(?:^|[\\/])(T-\d{3})-[^\\/]+\.md$/);
  if (fromPath) {
    return fromPath[1];
  }

  const fromHeading = document.body.match(/^#\s+(T-\d{3})\b/m);
  return fromHeading?.[1] ?? null;
}

function extractTaskDocumentHeading(document) {
  const heading = document.body.match(/^#\s+(T-\d{3})\s+(.+?)\s*$/m);
  if (!heading) {
    return null;
  }

  return {
    id: heading[1],
    title: heading[2].trim(),
  };
}

function hasIsoLikeDate(value) {
  return /^\d{4}-\d{2}-\d{2}(?:[T ][0-2]\d:[0-5]\d(?::[0-5]\d)?(?:Z|[+-][0-2]\d:[0-5]\d)?)?$/.test(
    value,
  );
}

function validateBacklogAndTasks({ backlogBody, taskDocuments = [] } = {}) {
  const errors = [];
  const backlogEntries = parseBacklog(backlogBody, errors);
  const seenIds = new Set();
  const backlogIds = new Set();
  const backlogEntriesById = new Map();

  for (const entry of backlogEntries) {
    const id = entry?.id;
    if (typeof id !== 'string' || !BACKLOG_ID_PATTERN.test(id)) {
      errors.push(`Invalid backlog task ID: ${id} (expected T-001 style)`);
      continue;
    }

    if (seenIds.has(id)) {
      errors.push(`Duplicate backlog task ID: ${id}`);
    }
    seenIds.add(id);
    backlogIds.add(id);
    backlogEntriesById.set(id, entry);

    if (typeof entry.title !== 'string' || entry.title.trim().length === 0) {
      errors.push(`Missing backlog title for ${id}`);
    }

    if (!BACKLOG_STATUSES.has(entry.status)) {
      errors.push(`Invalid backlog status for ${id}: ${entry.status}`);
    }

    if (!Array.isArray(entry.dependencies)) {
      errors.push(`Invalid backlog dependencies for ${id}: expected array`);
    }

    if (typeof entry.scope !== 'string' || entry.scope.trim().length === 0) {
      errors.push(`Missing backlog scope for ${id}`);
    }

    if (entry.risk !== undefined && !BACKLOG_RISKS.has(entry.risk)) {
      errors.push(`Invalid backlog risk for ${id}: ${entry.risk}`);
    }

    if (
      entry.packetTier !== undefined &&
      !BACKLOG_PACKET_TIERS.has(entry.packetTier)
    ) {
      errors.push(`Invalid backlog packetTier for ${id}: ${entry.packetTier}`);
    }

    if (
      entry.validation !== undefined &&
      !(
        Array.isArray(entry.validation) &&
        entry.validation.every(
          (item) => typeof item === 'string' && item.trim().length > 0,
        )
      )
    ) {
      errors.push(
        `Invalid backlog validation for ${id}: expected array of commands or evidence strings`,
      );
    }

    if (
      entry.blockedReason !== undefined &&
      typeof entry.blockedReason !== 'string'
    ) {
      errors.push(`Invalid backlog blockedReason for ${id}: expected string`);
    }

    if (
      entry.status === 'blocked' &&
      typeof entry.blockedReason === 'string' &&
      entry.blockedReason.trim().length === 0
    ) {
      errors.push(`Blocked backlog task ${id} requires blockedReason`);
    }

    if (
      entry.updatedAt !== undefined &&
      (typeof entry.updatedAt !== 'string' || !hasIsoLikeDate(entry.updatedAt))
    ) {
      errors.push(`Invalid backlog updatedAt for ${id}: ${entry.updatedAt}`);
    }
  }

  for (const entry of backlogEntries) {
    if (!Array.isArray(entry?.dependencies) || typeof entry?.id !== 'string') {
      continue;
    }

    for (const dependency of entry.dependencies) {
      if (!backlogIds.has(dependency)) {
        errors.push(
          `Unknown backlog dependency for ${entry.id}: ${dependency}`,
        );
      }
    }
  }

  const taskDocumentsById = new Map();
  for (const document of taskDocuments) {
    const id = collectTaskDocumentId(document);
    if (!id) {
      errors.push(`Task document has no valid ID: ${document.path}`);
      continue;
    }

    if (taskDocumentsById.has(id)) {
      errors.push(`Duplicate task document for ID: ${id}`);
    }
    taskDocumentsById.set(id, document);

    if (!backlogIds.has(id)) {
      errors.push(
        `Task document has no backlog entry: ${id} (${document.path})`,
      );
    }

    const heading = extractTaskDocumentHeading(document);
    if (heading === null) {
      errors.push(`Task document ${document.path} is missing title heading`);
    } else {
      if (heading.id !== id) {
        errors.push(
          `Task document ${document.path} heading ID mismatch: expected ${id}, found ${heading.id}`,
        );
      }

      const backlogEntry = backlogEntriesById.get(id);
      if (
        backlogEntry &&
        heading.title.trim().toLowerCase() !==
          backlogEntry.title.trim().toLowerCase()
      ) {
        errors.push(
          `Task document ${document.path} heading title mismatch for ${id}: expected "${backlogEntry.title}", found "${heading.title}"`,
        );
      }
    }

    for (const section of TASK_DOCUMENT_REQUIRED_SECTIONS) {
      if (!document.body.includes(section)) {
        errors.push(
          `Task document ${document.path} is missing required section: ${section}`,
        );
      }
    }
  }

  for (const id of backlogIds) {
    if (!taskDocumentsById.has(id)) {
      errors.push(`Missing task document for backlog ID: ${id}`);
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
  apiRulesBody,
  dbRulesBody,
  codingRulesBody,
  decisionsBody,
  dynamicWorkflowBody,
  docsReadmeBody,
  rulesReadmeBody,
  templatesReadmeBody,
  memoryReadmeBody,
  gitRulesBody,
  reviewRulesBody,
  loopEngineeringBody,
  quickstartBody,
  testRulesBody,
  taskLifecycleBody,
  prTemplateBody,
  releaseBody,
  workflowPacketExamplesBody,
  architectureBody,
  projectStateBody,
  knownBugsBody,
  techDebtBody,
  backlogBody,
  taskDocuments = [],
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

  if (templatesReadmeBody) {
    errors.push(...validateTemplatesIndex(templatesReadmeBody));
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

  if (backlogBody || taskDocuments.length > 0) {
    errors.push(...validateBacklogAndTasks({ backlogBody, taskDocuments }));
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
    templatesReadmeBody
      ? { path: 'docs/templates/README.md', body: templatesReadmeBody }
      : null,
  ].filter(Boolean);
  errors.push(...collectForbiddenPathLiterals(documentsForPathLiteralScan));

  if (enforceGovernanceAnchors) {
    errors.push(
      ...validateGovernanceAnchors({
        '.github/PULL_REQUEST_TEMPLATE.md': prTemplateBody,
        'AGENTS.md': agentsBody,
        'docs/rules/API_RULES.md': apiRulesBody,
        'docs/rules/CODING_RULES.md': codingRulesBody,
        'docs/rules/DB_RULES.md': dbRulesBody,
        'docs/rules/DYNAMIC_WORKFLOW_RULES.md': dynamicWorkflowBody,
        'docs/rules/GIT_RULES.md': gitRulesBody,
        'docs/rules/LOOP_ENGINEERING_RULES.md': loopEngineeringBody,
        'docs/rules/QUICKSTART.md': quickstartBody,
        'docs/rules/REVIEW_RULES.md': reviewRulesBody,
        'docs/rules/RELEASE.md': releaseBody,
        'docs/rules/TASK_LIFECYCLE_RULES.md': taskLifecycleBody,
        'docs/rules/TEST_RULES.md': testRulesBody,
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
  'docs/rules/API_RULES.md',
  'docs/rules/DB_RULES.md',
  'docs/rules/TEST_RULES.md',
  'docs/rules/REVIEW_RULES.md',
  'docs/rules/GIT_RULES.md',
  'docs/rules/DYNAMIC_WORKFLOW_RULES.md',
  'docs/rules/TASK_LIFECYCLE_RULES.md',
  'docs/rules/LOOP_ENGINEERING_RULES.md',
  'docs/rules/QUICKSTART.md',
  'docs/rules/AGENT_SKILL_ROUTING.md',
  'docs/rules/TASK_INTAKE.md',
  'docs/rules/TASK_MANAGEMENT_RULES.md',
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
  'docs/templates/clarification-template.md',
  'docs/templates/codex-goal-prompt-template.md',
  'docs/templates/handoff-template.md',
  'docs/templates/plan-to-task-goals-prompt-template.md',
  'docs/templates/retrospective-template.md',
  'docs/templates/spec-template.md',
  'docs/templates/task-item-template.md',
  'docs/templates/workflow-packet-examples.md',
];

function collectTaskDocumentsFromDisk() {
  const tasksDir = 'docs/tasks';
  if (!existsSync(tasksDir)) {
    return [];
  }

  return readdirSync(tasksDir)
    .filter((name) => /^T-\d{3}-.*\.md$/.test(name))
    .map((name) => {
      const path = `${tasksDir}/${name}`;
      return {
        path,
        body: readText(path),
      };
    });
}

function main() {
  const result = validateGovernance({
    agentsBody: readText('AGENTS.md'),
    apiRulesBody: readText('docs/rules/API_RULES.md'),
    dbRulesBody: readText('docs/rules/DB_RULES.md'),
    codingRulesBody: readText('docs/rules/CODING_RULES.md'),
    decisionsBody: readText('docs/memory/DECISIONS.md'),
    dynamicWorkflowBody: readText('docs/rules/DYNAMIC_WORKFLOW_RULES.md'),
    docsReadmeBody: readText('docs/README.md'),
    rulesReadmeBody: readText('docs/rules/README.md'),
    templatesReadmeBody: readText('docs/templates/README.md'),
    memoryReadmeBody: readText('docs/memory/README.md'),
    gitRulesBody: readText('docs/rules/GIT_RULES.md'),
    reviewRulesBody: readText('docs/rules/REVIEW_RULES.md'),
    loopEngineeringBody: readText('docs/rules/LOOP_ENGINEERING_RULES.md'),
    quickstartBody: readText('docs/rules/QUICKSTART.md'),
    testRulesBody: readText('docs/rules/TEST_RULES.md'),
    taskLifecycleBody: readText('docs/rules/TASK_LIFECYCLE_RULES.md'),
    prTemplateBody: readText('.github/PULL_REQUEST_TEMPLATE.md'),
    releaseBody: readText('docs/rules/RELEASE.md'),
    workflowPacketExamplesBody: readText(
      'docs/templates/workflow-packet-examples.md',
    ),
    architectureBody: readText('docs/memory/ARCHITECTURE.md'),
    projectStateBody: readText('docs/memory/PROJECT_STATE.md'),
    knownBugsBody: readText('docs/memory/KNOWN_BUGS.md'),
    techDebtBody: readText('docs/memory/TECH_DEBT.md'),
    backlogBody: readText('backlog.json'),
    taskDocuments: collectTaskDocumentsFromDisk(),
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
