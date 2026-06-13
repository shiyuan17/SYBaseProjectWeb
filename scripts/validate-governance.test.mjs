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
- [VUE_TS_RULES.md](./VUE_TS_RULES.md)
- [UI_RULES.md](./UI_RULES.md)
- [STATE_RULES.md](./STATE_RULES.md)
- [ROUTER_RULES.md](./ROUTER_RULES.md)
- [API_RULES.md](./API_RULES.md)
- [TESTING_RULES.md](./TESTING_RULES.md)
- [COMPATIBILITY_RULES.md](./COMPATIBILITY_RULES.md)
- [GIT_RULES.md](./GIT_RULES.md)
- [DYNAMIC_WORKFLOW_RULES.md](./DYNAMIC_WORKFLOW_RULES.md)
- [LOOP_ENGINEERING_RULES.md](./LOOP_ENGINEERING_RULES.md)
- [AGENT_SKILL_ROUTING.md](./AGENT_SKILL_ROUTING.md)
- [LINEAR_TASK.md](./LINEAR_TASK.md)
- [RELEASE.md](./RELEASE.md)
- [AI-CODE-HEALTH.md](./AI-CODE-HEALTH.md)
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

- [PROJECT_STATE.md](./docs/memory/PROJECT_STATE.md)
- [TECH_DEBT.md](./docs/memory/TECH_DEBT.md)
- [KNOWN_BUGS.md](./docs/memory/KNOWN_BUGS.md)
- [DECISIONS.md](./docs/memory/DECISIONS.md)
- [ARCHITECTURE.md](./docs/memory/ARCHITECTURE.md)
- [docs/rules/PROJECT_DIRECTORY.md](./docs/rules/PROJECT_DIRECTORY.md)
- [docs/rules/CODING_RULES.md](./docs/rules/CODING_RULES.md)
- [docs/rules/VUE_TS_RULES.md](./docs/rules/VUE_TS_RULES.md)
- [docs/rules/UI_RULES.md](./docs/rules/UI_RULES.md)
- [docs/rules/STATE_RULES.md](./docs/rules/STATE_RULES.md)
- [docs/rules/ROUTER_RULES.md](./docs/rules/ROUTER_RULES.md)
- [docs/rules/API_RULES.md](./docs/rules/API_RULES.md)
- [docs/rules/TESTING_RULES.md](./docs/rules/TESTING_RULES.md)
- [docs/rules/COMPATIBILITY_RULES.md](./docs/rules/COMPATIBILITY_RULES.md)
- [docs/rules/GIT_RULES.md](./docs/rules/GIT_RULES.md)
- [docs/rules/DYNAMIC_WORKFLOW_RULES.md](./docs/rules/DYNAMIC_WORKFLOW_RULES.md)
- [docs/rules/LOOP_ENGINEERING_RULES.md](./docs/rules/LOOP_ENGINEERING_RULES.md)
- [docs/rules/AGENT_SKILL_ROUTING.md](./docs/rules/AGENT_SKILL_ROUTING.md)
- [docs/rules/LINEAR_TASK.md](./docs/rules/LINEAR_TASK.md)
- [docs/rules/RELEASE.md](./docs/rules/RELEASE.md)
- [docs/rules/AI-CODE-HEALTH.md](./docs/rules/AI-CODE-HEALTH.md)
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
### 6. 工作树（Worktree）与 Linear 任务
### 7. 自动化护栏（lefthook）
`,
  loopEngineeringBody: `
## Loop Packet
最小 Loop Packet
`,
  prTemplateBody: `
Packet tier:
Fast Path:
Lightweight:
Full:
Red-zone confirmation:
`,
  workflowPacketExamplesBody: `
范例 3.1：轻量 Workflow Packet
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
            '- [Linear](https://linear.app)',
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

  it('rejects missing compatibility stubs when anchors are enforced', () => {
    const result = validateGovernance({
      ...governanceAnchorFixtures,
      enforceGovernanceAnchors: true,
      repoRoot: '/repo',
      fileExists: (target) =>
        !target.replaceAll('\\', '/').endsWith('/docs/CODING_RULES.md'),
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Missing compatibility rule stub: docs/CODING_RULES.md',
    );
  });
});
