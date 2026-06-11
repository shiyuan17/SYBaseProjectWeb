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

describe('validatePullRequestPacket', () => {
  it('accepts a PR body with required workflow, validation, risk, and memory fields', () => {
    const result = validatePullRequestPacket(validBody);

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
});
