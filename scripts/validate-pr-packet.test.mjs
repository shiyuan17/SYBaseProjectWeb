import { describe, expect, it } from 'vitest';

import { validatePullRequestPacket } from './validate-pr-packet.mjs';

const validBody = `
# PR Workflow Packet

## Summary

- Purpose: Add loop engineering governance.
- Impact: Docs, PR template, and CI validation.
- Validation: pnpm lint passed.
- Risks: PR body validation may block incomplete PRs.

## Dynamic Workflow

- Primary Workflow: Workflow-Infra
- Trigger signals: CI and PR template changes
- Expert Agent(s): Workflow-Infra Agent, Red Team Agent
- Required modifiers: Red Team

## Dynamic Tests

- Required test commands: pnpm test:unit scripts/validate-pr-packet.test.mjs
- Actual results: Passed
- Unverified items and reasons: None

## Red Team

- Attack result: Empty required packet fields are rejected.
- Residual risk: Content quality still needs human review.

## Memory Update Packet

- Updated memory files: DECISIONS.md, TECH_DEBT.md
- Not updated memory files and reasons: N/A
- Related memory IDs: TD-20260610-002
- Cross-repo memory references: N/A
- Residual risk / follow-up owner: Maintainers monitor false positives.
`;

const validDocsOnlyBody = `
# PR Workflow Packet

## Summary

- Purpose: Tighten governance wording for docs-only audit tasks.
- Impact: AGENTS.md and docs only.
- Validation: pnpm run check:governance passed.
- Risks: Low-risk wording drift if future docs are not kept aligned.

## Dynamic Workflow

- Primary Workflow: Not applicable (docs-only governance update)
- Trigger signals: Pure docs and governance wording changes only
- Expert Agent(s): N/A
- Required modifiers: N/A

## Dynamic Tests

- Required test commands: pnpm run check:governance
- Actual results: Passed
- Unverified items and reasons: None

## Red Team

- [ ] Tried to prove the change can bypass route/menu/API permission checks.
- [ ] Tried to prove patient/report/business data can leak, corrupt, duplicate, or disappear.
- [ ] Tried to prove errors are swallowed or users see misleading success.
- [ ] Tried to prove rollback, fallback, or target-environment validation is missing.
- Checker / reviewer source:
- Attack result:
- Residual risk:

## Memory Update Packet

- Updated memory files: DECISIONS.md
- Not updated memory files and reasons: TECH_DEBT.md, KNOWN_BUGS.md, ARCHITECTURE.md unchanged; no durable context change beyond governance decision.
- Related memory IDs: DEC-20260612-008
- Cross-repo memory references: N/A
- Residual risk / follow-up owner: Maintainers monitor future governance drift.
`;

describe('validatePullRequestPacket', () => {
  it('accepts a PR body with required workflow, validation, risk, and memory fields', () => {
    const result = validatePullRequestPacket(validBody);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('accepts docs-only PR bodies that mark the workflow as not applicable', () => {
    const result = validatePullRequestPacket(validDocsOnlyBody);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects a PR body missing the Dynamic Workflow packet', () => {
    const result = validatePullRequestPacket(
      validBody.replace(
        /## Dynamic Workflow[\s\S]*?## Dynamic Tests/,
        '## Dynamic Tests',
      ),
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Missing section: Dynamic Workflow');
  });

  it('rejects a PR body missing the Memory Update Packet', () => {
    const result = validatePullRequestPacket(
      validBody.replace(/## Memory Update Packet[\s\S]*/, ''),
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Missing section: Memory Update Packet');
  });

  it('rejects blank validation and risk fields', () => {
    const result = validatePullRequestPacket(
      validBody
        .replace('- Validation: pnpm lint passed.', '- Validation:')
        .replace(
          '- Risks: PR body validation may block incomplete PRs.',
          '- Risks:',
        ),
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Empty field: Summary > Validation');
    expect(result.errors).toContain('Empty field: Summary > Risks');
  });

  it('rejects missing red-team evidence when Red Team is declared as a required modifier', () => {
    const result = validatePullRequestPacket(
      validBody
        .replace('- Attack result: Empty required packet fields are rejected.', '- Attack result:')
        .replace(
          '- Residual risk: Content quality still needs human review.',
          '- Residual risk:',
        ),
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Red Team evidence missing: Attack result');
    expect(result.errors).toContain('Red Team evidence missing: Residual risk');
  });

  it('rejects checked red-team items when evidence fields stay empty', () => {
    const result = validatePullRequestPacket(
      validDocsOnlyBody
        .replace(
          '- [ ] Tried to prove the change can bypass route/menu/API permission checks.',
          '- [x] Tried to prove the change can bypass route/menu/API permission checks.',
        ),
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Red Team evidence missing: Attack result');
    expect(result.errors).toContain('Red Team evidence missing: Residual risk');
  });
});
