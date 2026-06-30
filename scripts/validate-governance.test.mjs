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
  codingRulesBody: '标准验证命令',
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
        '- [LOOP_ENGINEERING_RULES.md](./LOOP_ENGINEERING_RULES.md)\n',
        '',
      ),
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Missing docs/rules/README.md entry: LOOP_ENGINEERING_RULES.md',
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
