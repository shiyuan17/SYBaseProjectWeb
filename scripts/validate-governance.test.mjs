import { describe, expect, it } from 'vitest';

import { validateGovernance } from './validate-governance.mjs';

const validDecisionsBody = `
| ID | Date | Context | Decision | Rationale | Impact | Revisit When |
| --- | --- | --- | --- | --- | --- | --- |
| DEC-20260608-001 | 2026-06-08 | Test | First decision | Reason | Impact | Revisit |
| DEC-20260608-002 | 2026-06-08 | Test | Second decision | Reason | Impact | Revisit |
`;

const validDocsReadmeBody = `
## 核心入口

- [rules/README.md](./rules/README.md): 项目级规范正文索引
- [memory/README.md](./memory/README.md): 长期记忆文件索引
`;

const validRulesReadmeBody = `
## 工程基础

- [PROJECT_DIRECTORY.md](./PROJECT_DIRECTORY.md)
- [CODING_RULES.md](./CODING_RULES.md)
- [FRONTEND_RULES.md](./FRONTEND_RULES.md)
- [API_RULES.md](./API_RULES.md)
- [DB_RULES.md](./DB_RULES.md)
- [TEST_RULES.md](./TEST_RULES.md)
- [REVIEW_RULES.md](./REVIEW_RULES.md)
- [GIT_RULES.md](./GIT_RULES.md)
- [DYNAMIC_WORKFLOW_RULES.md](./DYNAMIC_WORKFLOW_RULES.md)
- [TASK_LIFECYCLE_RULES.md](./TASK_LIFECYCLE_RULES.md)
- [LOOP_ENGINEERING_RULES.md](./LOOP_ENGINEERING_RULES.md)
- [QUICKSTART.md](./QUICKSTART.md)
- [AGENT_SKILL_ROUTING.md](./AGENT_SKILL_ROUTING.md)
- [TASK_INTAKE.md](./TASK_INTAKE.md)
- [TASK_MANAGEMENT_RULES.md](./TASK_MANAGEMENT_RULES.md)
- [RELEASE.md](./RELEASE.md)
`;

const legacyTemplatesReadmeBody = `
## 模板清单

- [agents-governance-audit-prompt-template.md](./agents-governance-audit-prompt-template.md)
- [codex-goal-prompt-template.md](./codex-goal-prompt-template.md)
- [plan-to-task-goals-prompt-template.md](./plan-to-task-goals-prompt-template.md)
- [task-item-template.md](./task-item-template.md)
- [workflow-packet-examples.md](./workflow-packet-examples.md)
`;

const validTemplatesReadmeBody = `
## 模板清单

- [agents-governance-audit-prompt-template.md](./agents-governance-audit-prompt-template.md)
- [clarification-template.md](./clarification-template.md)
- [codex-goal-prompt-template.md](./codex-goal-prompt-template.md)
- [handoff-template.md](./handoff-template.md)
- [plan-to-task-goals-prompt-template.md](./plan-to-task-goals-prompt-template.md)
- [retrospective-template.md](./retrospective-template.md)
- [spec-template.md](./spec-template.md)
- [task-item-template.md](./task-item-template.md)
- [workflow-packet-examples.md](./workflow-packet-examples.md)
`;

const validMemoryReadmeBody = `
## 记忆文件

- [PROJECT_STATE.md](./PROJECT_STATE.md)
- [TECH_DEBT.md](./TECH_DEBT.md)
- [KNOWN_BUGS.md](./KNOWN_BUGS.md)
- [DECISIONS.md](./DECISIONS.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
`;

const validAgentsBody = `
## 关联文档

- [docs/memory/PROJECT_STATE.md](./docs/memory/PROJECT_STATE.md)
- [docs/memory/ARCHITECTURE.md](./docs/memory/ARCHITECTURE.md)
- [docs/memory/TECH_DEBT.md](./docs/memory/TECH_DEBT.md)
- [docs/memory/KNOWN_BUGS.md](./docs/memory/KNOWN_BUGS.md)
- [docs/memory/DECISIONS.md](./docs/memory/DECISIONS.md)
- [docs/rules/PROJECT_DIRECTORY.md](./docs/rules/PROJECT_DIRECTORY.md)
- [docs/rules/CODING_RULES.md](./docs/rules/CODING_RULES.md)
- [docs/rules/FRONTEND_RULES.md](./docs/rules/FRONTEND_RULES.md)
- [docs/rules/API_RULES.md](./docs/rules/API_RULES.md)
- [docs/rules/DB_RULES.md](./docs/rules/DB_RULES.md)
- [docs/rules/TEST_RULES.md](./docs/rules/TEST_RULES.md)
- [docs/rules/REVIEW_RULES.md](./docs/rules/REVIEW_RULES.md)
- [docs/rules/GIT_RULES.md](./docs/rules/GIT_RULES.md)
- [docs/rules/DYNAMIC_WORKFLOW_RULES.md](./docs/rules/DYNAMIC_WORKFLOW_RULES.md)
- [docs/rules/TASK_LIFECYCLE_RULES.md](./docs/rules/TASK_LIFECYCLE_RULES.md)
- [docs/rules/LOOP_ENGINEERING_RULES.md](./docs/rules/LOOP_ENGINEERING_RULES.md)
- [docs/rules/QUICKSTART.md](./docs/rules/QUICKSTART.md)
- [docs/rules/AGENT_SKILL_ROUTING.md](./docs/rules/AGENT_SKILL_ROUTING.md)
- [docs/rules/TASK_INTAKE.md](./docs/rules/TASK_INTAKE.md)
- [docs/rules/TASK_MANAGEMENT_RULES.md](./docs/rules/TASK_MANAGEMENT_RULES.md)
- [docs/rules/RELEASE.md](./docs/rules/RELEASE.md)
`;

const validArchitectureBody = `
- M6 statistics lives under \`apps/web-ele/src/modules/m6-statistics\`.
- \`/m6/dashboard\` must compose existing \`POST /api/v1/stat-reports/query\` calls.
`;

const validProjectStateBody = `
# PROJECT_STATE.md

## Current State

- Summary

## Active Work

- Active item

## Validation Baseline

- Validation item

## Cross-Repo Dependencies

- Dependency item

## Handoff Notes

- Handoff item
`;

const validBacklogBody = JSON.stringify(
  [
    {
      id: 'T-001',
      title: 'auth system',
      status: 'todo',
      dependencies: [],
      scope: 'modules/auth',
      risk: 'medium',
      packetTier: 'Full',
      validation: ['pnpm test:unit -- auth'],
      blockedReason: '',
      updatedAt: '2026-07-01',
    },
    {
      id: 'T-002',
      title: 'auth mapper tests',
      status: 'blocked',
      dependencies: ['T-001'],
      scope: 'apps/web-ele/src/modules/auth',
      risk: 'low',
      packetTier: 'Lightweight',
      validation: ['pnpm test:unit -- auth-mapper'],
      blockedReason: 'Waiting for backend contract sample.',
      updatedAt: '2026-07-01T10:00:00+08:00',
    },
  ],
  null,
  2,
);

const validTaskDocuments = [
  {
    path: 'docs/tasks/T-001-auth-system.md',
    body: `
# T-001 Auth System

## Goal

Implement auth.

## Inputs

- Backend contract

## Outputs

- Frontend auth flow

## Constraints

- Follow API_RULES.md

## Acceptance Criteria

- Login success returns token.
`,
  },
  {
    path: 'docs/tasks/T-002-auth-mapper-tests.md',
    body: `
# T-002 Auth Mapper Tests

## Goal

Cover auth mapper.

## Inputs

- T-001

## Outputs

- Mapper tests

## Constraints

- No runtime behavior change

## Acceptance Criteria

- Mapper handles missing optional fields.
`,
  },
];

const validTaskDirectoryBacklogBody = JSON.stringify(
  [
    {
      id: 'T-010',
      title: 'Directory Task Parent',
      status: 'ready',
      dependencies: [],
      scope: 'docs/tasks/T-010-directory-task-parent',
      taskDir: 'docs/tasks/T-010-directory-task-parent',
    },
  ],
  null,
  2,
);

const validTaskDirectory = {
  path: 'docs/tasks/T-010-directory-task-parent',
  readmeBody: `
# T-010 Directory Task Parent

Executable: false

## Goal

Coordinate child tasks.

## Inputs

- Plan

## Outputs

- Child tasks

## Constraints

- Parent task is not a Codex Goal execution unit.

## Acceptance Criteria

- Child tasks complete independently.
`,
  manifestBody: JSON.stringify(
    {
      id: 'T-010',
      title: 'Directory Task Parent',
      status: 'ready',
      executable: false,
      dependencies: [],
      validation: ['node scripts\\validate-governance.mjs'],
      rollback: 'Revert the parent task directory changes.',
      updatedAt: '2026-07-02',
      children: [
        {
          id: 'T-010.001',
          title: 'Contract Inventory',
          status: 'ready',
          dependencies: [],
          validation: ['node scripts\\validate-governance.mjs'],
          rollback: 'Revert this child task changes.',
          updatedAt: '2026-07-02',
        },
      ],
    },
    null,
    2,
  ),
  childDocuments: [
    {
      path: 'docs/tasks/T-010-directory-task-parent/children/T-010.001-contract-inventory.md',
      body: `
# T-010.001 Contract Inventory

Timebox: <= 5 minutes

## Goal

Record one contract inventory.

## Acceptance Criteria

- Inventory evidence is recorded.

## Non-goals

- Do not implement runtime code.

## Stop Condition

Inventory evidence is written or the source is missing.

## Verification Command

\`node scripts\\validate-governance.mjs\`

## Rollback Plan

Revert this child task change.

## Evidence

- Validation command output.
`,
    },
  ],
};

const governanceAnchorFixtures = {
  agentsBody: `${validAgentsBody}
## 一页式执行入口
### 规范单一来源矩阵
## 快速命令
三层阅读路径
### 4. 任务开始模板
红区确认协议
### 8. AI Memory Update
`,
  apiRulesBody: `
## 单一来源
## Mapper 与兼容
## AI Agent 禁止项
`,
  codingRulesBody: '标准验证命令',
  dbRulesBody: `
## 触发条件
## 跨仓证据
## 回滚与发布
`,
  dynamicWorkflowBody: `
主 Workflow
轻量 Workflow Packet
完整 Workflow Packet
Red Team
`,
  gitRulesBody: `
### 3.1 AI 主动提交规范
### 3.2 Commit Message 细则
### 3.3 Tag 规范
### 6. 工作树（Worktree）与任务隔离
#### 6.1 Merge-Back 完成定义
### 7. 自动化护栏（lefthook）
`,
  loopEngineeringBody: `
## Loop Packet
最小 Loop Packet
`,
  reviewRulesBody: `
## Review 五轴
## 阻塞条件
## 证据质量
`,
  releaseBody: `
### 1.1 版本号与 Tag 映射
### 3.1 发布 Tag 闭环
### 6.1 基于稳定版本 Tag 回滚
`,
  quickstartBody: `
## 三层阅读路径
## 场景最小阅读
## 协作底座（底座层分包）
`,
  testRulesBody: `
## 测试分层
## 触发矩阵
## 强制规则
`,
  prTemplateBody: `
Packet tier:
Fast Path:
Lightweight:
Full:
Commits created:
Tags created:
Lifecycle artifacts:
Red-zone confirmation:
`,
  taskLifecycleBody: `
## 生命周期与 Workflow 的关系
## 阶段速查
Clarify
Retrospective
`,
  templatesReadmeBody: validTemplatesReadmeBody,
  workflowPacketExamplesBody: `
范例：轻量 Workflow Packet
坏例子
修正后
`,
};

describe('validateGovernance', () => {
  it('accepts governance docs without duplicate decision IDs or stale dashboard contract', () => {
    const result = validateGovernance({
      agentsBody: validAgentsBody,
      decisionsBody: validDecisionsBody,
      docsReadmeBody: validDocsReadmeBody,
      rulesReadmeBody: validRulesReadmeBody,
      templatesReadmeBody: validTemplatesReadmeBody,
      memoryReadmeBody: validMemoryReadmeBody,
      architectureBody: validArchitectureBody,
      projectStateBody: validProjectStateBody,
      backlogBody: validBacklogBody,
      taskDocuments: validTaskDocuments,
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects duplicate decision IDs', () => {
    const result = validateGovernance({
      decisionsBody: `${validDecisionsBody}| DEC-20260608-002 | 2026-06-09 | Test | Duplicate | Reason | Impact | Revisit |`,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Duplicate decision ID: DEC-20260608-002');
  });

  it('rejects missing docs index entries', () => {
    const result = validateGovernance({
      docsReadmeBody: validDocsReadmeBody.replace(
        '- [rules/README.md](./rules/README.md): 项目级规范正文索引\n',
        '',
      ),
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Missing docs/README.md rules index entry: ./rules/README.md',
    );
  });

  it('rejects missing rules index entries', () => {
    const result = validateGovernance({
      rulesReadmeBody: validRulesReadmeBody.replace(
        '- [API_RULES.md](./API_RULES.md)\n',
        '',
      ),
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Missing docs/rules/README.md entry: API_RULES.md',
    );
  });

  it('rejects missing task lifecycle governance entries', () => {
    const result = validateGovernance({
      ...governanceAnchorFixtures,
      agentsBody: validAgentsBody.replace(
        '- [docs/rules/TASK_LIFECYCLE_RULES.md](./docs/rules/TASK_LIFECYCLE_RULES.md)\n',
        '',
      ),
      rulesReadmeBody: validRulesReadmeBody.replace(
        '- [TASK_LIFECYCLE_RULES.md](./TASK_LIFECYCLE_RULES.md)\n',
        '',
      ),
      templatesReadmeBody: legacyTemplatesReadmeBody,
      prTemplateBody: governanceAnchorFixtures.prTemplateBody.replace(
        'Lifecycle artifacts:\n',
        '',
      ),
      taskLifecycleBody: undefined,
      enforceGovernanceAnchors: true,
      fileExists: () => true,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Missing docs/rules/README.md entry: TASK_LIFECYCLE_RULES.md',
    );
    expect(result.errors).toContain(
      'Missing AGENTS.md related-doc entry: docs/rules/TASK_LIFECYCLE_RULES.md',
    );
    expect(result.errors).toContain(
      'Missing docs/templates/README.md entry: clarification-template.md',
    );
    expect(result.errors).toContain(
      'Missing governance anchor in .github/PULL_REQUEST_TEMPLATE.md: Lifecycle artifacts:',
    );
    expect(result.errors).toContain(
      'Missing governance anchor source: docs/rules/TASK_LIFECYCLE_RULES.md',
    );
  });

  it('rejects missing memory index entries', () => {
    const result = validateGovernance({
      memoryReadmeBody: validMemoryReadmeBody.replace(
        '- [TECH_DEBT.md](./TECH_DEBT.md)\n',
        '',
      ),
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Missing docs/memory/README.md entry: TECH_DEBT.md',
    );
  });

  it('rejects missing AGENTS.md related-doc entries', () => {
    const result = validateGovernance({
      agentsBody: validAgentsBody.replace(
        '- [docs/rules/LOOP_ENGINEERING_RULES.md](./docs/rules/LOOP_ENGINEERING_RULES.md)\n',
        '',
      ),
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Missing AGENTS.md related-doc entry: docs/rules/LOOP_ENGINEERING_RULES.md',
    );
  });

  it('rejects stale stat-dashboard contract in architecture snapshot', () => {
    const result = validateGovernance({
      architectureBody:
        '- `/m6/dashboard` uses `POST /api/v1/stat-dashboard/query`.',
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'ARCHITECTURE.md still describes /m6/dashboard as using POST /api/v1/stat-dashboard/query.',
    );
  });

  it('rejects PROJECT_STATE.md when required sections are missing', () => {
    const result = validateGovernance({
      projectStateBody: validProjectStateBody.replace(
        '## Validation Baseline',
        '',
      ),
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'PROJECT_STATE.md is missing required section: ## Validation Baseline',
    );
  });

  it('rejects PROJECT_STATE.md when it grows beyond the line budget', () => {
    const bloatedBody = Array.from(
      { length: 130 },
      () => '- history line',
    ).join('\n');
    const result = validateGovernance({
      projectStateBody: bloatedBody,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'PROJECT_STATE.md is too long: 130 lines (limit 120).',
    );
  });

  it('rejects ledgers that grow beyond the soft line budget', () => {
    const bloatedLedger = `${validDecisionsBody}${Array.from({ length: 210 }, () => '| note |').join('\n')}`;
    const result = validateGovernance({
      decisionsBody: bloatedLedger,
    });

    expect(result.isValid).toBe(false);
    expect(
      result.errors.some(
        (error) =>
          error.startsWith('DECISIONS.md is too long:') &&
          error.includes('Archive resolved/historical entries'),
      ),
    ).toBe(true);
  });

  it('rejects duplicate bug and tech debt IDs', () => {
    const result = validateGovernance({
      knownBugsBody: `
| BUG-20260612-001 | repro | scope | workaround | Open |
| BUG-20260612-001 | repro again | scope | workaround | Open |
`,
      techDebtBody: `
| TD-20260610-002 | High | source | impact | action | Open |
| TD-20260610-002 | High | source | impact | action | Open |
`,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Duplicate bug ID: BUG-20260612-001');
    expect(result.errors).toContain('Duplicate tech debt ID: TD-20260610-002');
  });

  it('rejects broken relative links in governance documents', () => {
    const result = validateGovernance({
      linkedDocuments: [
        {
          path: 'docs/README.md',
          body: '- [MISSING.md](./MISSING.md)\n- [CODING_RULES.md](./CODING_RULES.md)',
        },
      ],
      repoRoot: '/repo',
      fileExists: (target) =>
        target.replaceAll('\\', '/').endsWith('docs/CODING_RULES.md'),
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Broken link in docs/README.md: ./MISSING.md',
    );
    expect(result.errors).not.toContain(
      'Broken link in docs/README.md: ./CODING_RULES.md',
    );
  });

  it('skips external, anchor, placeholder, and cross-repo links', () => {
    const result = validateGovernance({
      linkedDocuments: [
        {
          path: 'AGENTS.md',
          body: [
            '- [External](https://example.com)',
            '- [anchor](#section)',
            '- [template](<issue url>)',
            '- [backend](../SYBaseProject/DECISIONS.md)',
          ].join('\n'),
        },
      ],
      repoRoot: '/repo',
      fileExists: () => false,
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('accepts governance docs that retain the single-source anchor set', () => {
    const result = validateGovernance({
      ...governanceAnchorFixtures,
      enforceGovernanceAnchors: true,
      fileExists: () => true,
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects governance docs when a required anchor is missing', () => {
    const result = validateGovernance({
      ...governanceAnchorFixtures,
      agentsBody: governanceAnchorFixtures.agentsBody.replace(
        '### 规范单一来源矩阵',
        '',
      ),
      enforceGovernanceAnchors: true,
      fileExists: () => true,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Missing governance anchor in AGENTS.md: ### 规范单一来源矩阵',
    );
  });

  it('rejects doubled docs/rules path literals in scanned governance documents', () => {
    const result = validateGovernance({
      projectStateBody:
        'See docs/rules/docs/rules/DYNAMIC_WORKFLOW_RULES.md for details.',
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Forbidden doubled docs/rules path in docs/memory/PROJECT_STATE.md: docs/rules/docs/rules',
    );
  });

  it('rejects duplicate and malformed backlog IDs', () => {
    const result = validateGovernance({
      backlogBody: JSON.stringify([
        {
          id: 'T-001',
          title: 'auth system',
          status: 'todo',
          dependencies: [],
          scope: 'modules/auth',
        },
        {
          id: 'TASK-001',
          title: 'bad id',
          status: 'todo',
          dependencies: [],
          scope: 'modules/auth',
        },
        {
          id: 'T-001',
          title: 'duplicate',
          status: 'todo',
          dependencies: [],
          scope: 'modules/auth',
        },
      ]),
      taskDocuments: validTaskDocuments,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Duplicate backlog task ID: T-001');
    expect(result.errors).toContain(
      'Invalid backlog task ID: TASK-001 (expected T-001 style)',
    );
  });

  it('rejects invalid backlog task status and dependencies', () => {
    const backlog = JSON.parse(validBacklogBody);
    backlog[1].status = 'waiting';
    backlog[1].dependencies = ['T-999'];
    const result = validateGovernance({
      backlogBody: JSON.stringify(backlog),
      taskDocuments: validTaskDocuments,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Invalid backlog status for T-002: waiting',
    );
    expect(result.errors).toContain(
      'Unknown backlog dependency for T-002: T-999',
    );
  });

  it('rejects missing task files and orphan task documents', () => {
    const result = validateGovernance({
      backlogBody: validBacklogBody,
      taskDocuments: [
        validTaskDocuments[0],
        {
          path: 'docs/tasks/T-999-orphan.md',
          body: validTaskDocuments[1].body.replace('T-002', 'T-999'),
        },
      ],
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Missing task document for backlog ID: T-002',
    );
    expect(result.errors).toContain(
      'Task document has no backlog entry: T-999 (docs/tasks/T-999-orphan.md)',
    );
  });

  it('rejects task documents missing required sections', () => {
    const result = validateGovernance({
      backlogBody: JSON.stringify([JSON.parse(validBacklogBody)[0]]),
      taskDocuments: [
        {
          ...validTaskDocuments[0],
          body: validTaskDocuments[0].body.replace(
            '## Acceptance Criteria',
            '',
          ),
        },
      ],
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Task document docs/tasks/T-001-auth-system.md is missing required section: ## Acceptance Criteria',
    );
  });

  it('rejects task documents whose heading does not match backlog metadata', () => {
    const result = validateGovernance({
      backlogBody: JSON.stringify([JSON.parse(validBacklogBody)[0]]),
      taskDocuments: [
        {
          ...validTaskDocuments[0],
          body: validTaskDocuments[0].body.replace(
            '# T-001 Auth System',
            '# T-002 Different Title',
          ),
        },
      ],
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Task document docs/tasks/T-001-auth-system.md heading ID mismatch: expected T-001, found T-002',
    );
    expect(result.errors).toContain(
      'Task document docs/tasks/T-001-auth-system.md heading title mismatch for T-001: expected "auth system", found "Different Title"',
    );
  });

  it('rejects invalid optional backlog governance fields when present', () => {
    const backlog = JSON.parse(validBacklogBody);
    backlog[0].risk = 'urgent';
    backlog[0].packetTier = 'Heavy';
    backlog[0].validation = 'pnpm test:unit';
    backlog[0].updatedAt = 'tomorrow';
    const result = validateGovernance({
      backlogBody: JSON.stringify(backlog),
      taskDocuments: validTaskDocuments,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid backlog risk for T-001: urgent');
    expect(result.errors).toContain(
      'Invalid backlog packetTier for T-001: Heavy',
    );
    expect(result.errors).toContain(
      'Invalid backlog validation for T-001: expected array of commands or evidence strings',
    );
    expect(result.errors).toContain(
      'Invalid backlog updatedAt for T-001: tomorrow',
    );
  });

  it('accepts directory task model without requiring child tasks in root backlog', () => {
    const result = validateGovernance({
      backlogBody: validTaskDirectoryBacklogBody,
      taskDirectories: [validTaskDirectory],
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects directory parents that are executable Codex Goal units', () => {
    const result = validateGovernance({
      backlogBody: validTaskDirectoryBacklogBody,
      taskDirectories: [
        {
          ...validTaskDirectory,
          readmeBody: validTaskDirectory.readmeBody.replace(
            'Executable: false',
            'Executable: true',
          ),
          manifestBody: validTaskDirectory.manifestBody.replace(
            '"executable": false',
            '"executable": true',
          ),
        },
      ],
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Task directory docs/tasks/T-010-directory-task-parent parent must declare Executable: false',
    );
    expect(result.errors).toContain(
      'Task directory docs/tasks/T-010-directory-task-parent task.json executable must be false',
    );
  });

  it('rejects child tasks missing five-minute Goal guardrails', () => {
    const result = validateGovernance({
      backlogBody: validTaskDirectoryBacklogBody,
      taskDirectories: [
        {
          ...validTaskDirectory,
          childDocuments: [
            {
              ...validTaskDirectory.childDocuments[0],
              body: validTaskDirectory.childDocuments[0].body
                .replace('Timebox: <= 5 minutes', 'Timebox: <= 20 minutes')
                .replace('## Stop Condition', '## Stop Notes')
                .replace('## Verification Command', '## Verification Notes')
                .replace('## Rollback Plan', '## Rollback Notes'),
            },
          ],
        },
      ],
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Child task docs/tasks/T-010-directory-task-parent/children/T-010.001-contract-inventory.md must declare Timebox: <= 5 minutes',
    );
    expect(result.errors).toContain(
      'Child task docs/tasks/T-010-directory-task-parent/children/T-010.001-contract-inventory.md is missing required section: ## Stop Condition',
    );
    expect(result.errors).toContain(
      'Child task docs/tasks/T-010-directory-task-parent/children/T-010.001-contract-inventory.md is missing required section: ## Verification Command',
    );
    expect(result.errors).toContain(
      'Child task docs/tasks/T-010-directory-task-parent/children/T-010.001-contract-inventory.md is missing required section: ## Rollback Plan',
    );
  });

  it('rejects child task documents placed directly under docs/tasks', () => {
    const result = validateGovernance({
      backlogBody: JSON.stringify([]),
      taskDocuments: [
        {
          path: 'docs/tasks/T-010.001-contract-inventory.md',
          body: '# T-010.001 Contract Inventory',
        },
      ],
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Child task document must live under a task directory children folder: docs/tasks/T-010.001-contract-inventory.md',
    );
  });

  it('accepts removed compatibility stubs when anchors are enforced', () => {
    const result = validateGovernance({
      ...governanceAnchorFixtures,
      enforceGovernanceAnchors: true,
      repoRoot: '/repo',
      fileExists: (target) => {
        const normalized = target.replaceAll('\\', '/');
        return (
          !normalized.endsWith('/docs/CODING_RULES.md') &&
          !normalized.endsWith('/TECH_DEBT.md')
        );
      },
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});
