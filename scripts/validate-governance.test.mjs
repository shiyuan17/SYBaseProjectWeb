import { describe, expect, it } from 'vitest';

import { validateGovernance } from './validate-governance.mjs';

const validDecisionsBody = `
| ID | Date | Context | Decision | Rationale | Impact | Revisit When |
| --- | --- | --- | --- | --- | --- | --- |
| DEC-20260608-001 | 2026-06-08 | Test | First decision | Reason | Impact | Revisit |
| DEC-20260608-002 | 2026-06-08 | Test | Second decision | Reason | Impact | Revisit |
`;

const validDocsReadmeBody = `
## 顶层规范文档

- [PROJECT_DIRECTORY.md](./PROJECT_DIRECTORY.md)
- [CODING_RULES.md](./CODING_RULES.md)
- [VUE_TS_RULES.md](./VUE_TS_RULES.md)
- [UI_RULES.md](./UI_RULES.md)
- [STATE_RULES.md](./STATE_RULES.md)
- [ROUTER_RULES.md](./ROUTER_RULES.md)
- [API_RULES.md](./API_RULES.md)
- [COMPATIBILITY_RULES.md](./COMPATIBILITY_RULES.md)
- [GIT_RULES.md](./GIT_RULES.md)
- [DYNAMIC_WORKFLOW_RULES.md](./DYNAMIC_WORKFLOW_RULES.md)
- [LOOP_ENGINEERING_RULES.md](./LOOP_ENGINEERING_RULES.md)
- [AGENT_SKILL_ROUTING.md](./AGENT_SKILL_ROUTING.md)
- [LINEAR_TASK.md](./LINEAR_TASK.md)
- [RELEASE.md](./RELEASE.md)
- [AI-CODE-HEALTH.md](./AI-CODE-HEALTH.md)
`;

const validAgentsBody = `
## 关联文档

- [docs/PROJECT_DIRECTORY.md](./docs/PROJECT_DIRECTORY.md)
- [docs/CODING_RULES.md](./docs/CODING_RULES.md)
- [docs/VUE_TS_RULES.md](./docs/VUE_TS_RULES.md)
- [docs/UI_RULES.md](./docs/UI_RULES.md)
- [docs/STATE_RULES.md](./docs/STATE_RULES.md)
- [docs/ROUTER_RULES.md](./docs/ROUTER_RULES.md)
- [docs/API_RULES.md](./docs/API_RULES.md)
- [docs/COMPATIBILITY_RULES.md](./docs/COMPATIBILITY_RULES.md)
- [docs/GIT_RULES.md](./docs/GIT_RULES.md)
- [docs/DYNAMIC_WORKFLOW_RULES.md](./docs/DYNAMIC_WORKFLOW_RULES.md)
- [docs/LOOP_ENGINEERING_RULES.md](./docs/LOOP_ENGINEERING_RULES.md)
- [docs/AGENT_SKILL_ROUTING.md](./docs/AGENT_SKILL_ROUTING.md)
- [docs/LINEAR_TASK.md](./docs/LINEAR_TASK.md)
- [docs/RELEASE.md](./docs/RELEASE.md)
- [docs/AI-CODE-HEALTH.md](./docs/AI-CODE-HEALTH.md)
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

describe('validateGovernance', () => {
  it('accepts governance docs without duplicate decision IDs or stale dashboard contract', () => {
    const result = validateGovernance({
      agentsBody: validAgentsBody,
      decisionsBody: validDecisionsBody,
      docsReadmeBody: validDocsReadmeBody,
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
        '- [LOOP_ENGINEERING_RULES.md](./LOOP_ENGINEERING_RULES.md)\n',
        '',
      ),
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Missing docs/README.md top-level entry: LOOP_ENGINEERING_RULES.md',
    );
  });

  it('rejects missing AGENTS.md related-doc entries', () => {
    const result = validateGovernance({
      agentsBody: validAgentsBody.replace(
        '- [docs/LOOP_ENGINEERING_RULES.md](./docs/LOOP_ENGINEERING_RULES.md)\n',
        '',
      ),
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Missing AGENTS.md related-doc entry: docs/LOOP_ENGINEERING_RULES.md',
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
      projectStateBody: validProjectStateBody.replace('## Validation Baseline', ''),
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'PROJECT_STATE.md is missing required section: ## Validation Baseline',
    );
  });

  it('rejects PROJECT_STATE.md when it grows beyond the line budget', () => {
    const bloatedBody = new Array(130).fill('- history line').join('\n');
    const result = validateGovernance({
      projectStateBody: bloatedBody,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'PROJECT_STATE.md is too long: 130 lines (limit 120).',
    );
  });
});
