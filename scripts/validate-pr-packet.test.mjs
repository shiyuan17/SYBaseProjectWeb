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

- Memory: DECISIONS.md updated for governance decision DEC-20260612-008.
`;

const validLightweightBody = `
# PR Workflow Packet

## Summary

- Purpose: Update a low-risk component label.
- Impact: One module-local UI component.
- Validation: pnpm test:unit -- StatusLabel passed.
- Risks: Low; no layout, API, permission, or shared contract impact.

## Dynamic Workflow

- Primary Workflow: UI
- Trigger signals: Module-local display text only
- Expert Agent(s): N/A
- Required modifiers: N/A
- Red-zone confirmation: Not triggered

## Dynamic Tests

- Required test commands: pnpm test:unit -- StatusLabel
- Actual results: Passed
- Unverified items and reasons: E2E not run; static label covered by unit test.

## Memory Update Packet

- Memory: no durable context change.
`;

const validFullSecurityBody = `
# PR Workflow Packet

## Summary

- Purpose: Adjust report export permission behavior.
- Impact: Report export UI and permission handling.
- Validation: pnpm test:unit -- report-export passed.
- Risks: Medium; report data export requires security review.

## Dynamic Workflow

- Primary Workflow: Security
- Trigger signals: Report data export permission behavior
- Expert Agent(s): Security/Privacy Agent, Red Team Agent
- Required modifiers: Security / Red Team
- Red-zone confirmation: Product owner approved report export permission scope; rollback by reverting the permission gate change.

## Dynamic Tests

- Required test commands: pnpm test:unit -- report-export
- Actual results: Passed
- Unverified items and reasons: Backend authorization verified in linked MR.

## Dynamic Security

- [x] Permission, patient, report, login, audit, export, or sensitive-log impact checked
- Evidence: Low-permission role cannot see the export action.

## Red Team

- [x] Tried to prove patient/report/business data can leak, corrupt, duplicate, or disappear.
- Checker / reviewer source: Security reviewer
- Attack result: Direct export action without permission returns 403 and shows a denial message.
- Residual risk: Backend audit-log completeness remains owned by the backend MR.

## Memory Update Packet

- Updated memory files: DECISIONS.md
- Not updated memory files and reasons: TECH_DEBT.md and KNOWN_BUGS.md unchanged; no new durable debt or bug.
- Related memory IDs: DEC-20260612-999
- Cross-repo memory references: Backend MR !999
- Residual risk / follow-up owner: Backend owner verifies audit logs.
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

  it('accepts lightweight implementation PR bodies with core evidence only', () => {
    const result = validatePullRequestPacket(validLightweightBody);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('accepts full security PR bodies with required security and red-team evidence', () => {
    const result = validatePullRequestPacket(validFullSecurityBody);

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
        .replace(
          '- Attack result: Empty required packet fields are rejected.',
          '- Attack result:',
        )
        .replace(
          '- Residual risk: Content quality still needs human review.',
          '- Residual risk:',
        ),
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Red Team evidence missing: Attack result');
    expect(result.errors).toContain('Red Team evidence missing: Residual risk');
  });

  it('allows fast-path PR bodies to omit the Dynamic Tests section', () => {
    const result = validatePullRequestPacket(
      validDocsOnlyBody.replace(
        /## Dynamic Tests[\s\S]*?## Red Team/,
        '## Red Team',
      ),
    );

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('allows lightweight PR bodies to omit the Dynamic Tests section when validation summarizes the evidence', () => {
    const result = validatePullRequestPacket(
      validLightweightBody.replace(
        /## Dynamic Tests[\s\S]*?## Memory Update Packet/,
        '## Memory Update Packet',
      ),
    );

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects fast-path PR bodies that give no reason for not applicable', () => {
    const result = validatePullRequestPacket(
      validDocsOnlyBody.replace(
        '- Primary Workflow: Not applicable (docs-only governance update)',
        '- Primary Workflow: Not applicable',
      ),
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Fast path requires a brief reason: Primary Workflow must be "Not applicable (<reason>)"',
    );
  });

  it('still requires the Dynamic Tests section for full implementation workflows', () => {
    const result = validatePullRequestPacket(
      validBody.replace(/## Dynamic Tests[\s\S]*?## Red Team/, '## Red Team'),
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Missing section: Dynamic Tests');
  });

  it('rejects full packets that omit evidence sections required by workflow or modifiers', () => {
    const result = validatePullRequestPacket(
      validFullSecurityBody.replace(
        /## Dynamic Security[\s\S]*?## Red Team/,
        '## Red Team',
      ),
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Full packet evidence missing section: Dynamic Security',
    );
  });

  it('rejects fast-path PR bodies with no memory judgment', () => {
    const result = validatePullRequestPacket(
      validDocsOnlyBody.replace(
        '- Memory: DECISIONS.md updated for governance decision DEC-20260612-008.',
        '- Memory:',
      ),
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Fast path requires one-line memory judgment in Memory Update Packet',
    );
  });

  it('rejects browser-verification packets that omit simulation evidence', () => {
    const result = validatePullRequestPacket(
      validLightweightBody
        .replace(
          '- Required modifiers: N/A',
          '- Required modifiers: Browser Verification',
        )
        .replace(
          '- Validation: pnpm test:unit -- StatusLabel passed.',
          '- Validation: pnpm test:unit -- StatusLabel passed; browser check recorded.',
        ),
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Full packet evidence missing section: Dynamic Simulation',
    );
  });

  it('rejects red-zone full packets that omit red-team evidence', () => {
    const result = validatePullRequestPacket(
      validLightweightBody.replace(
        '- Red-zone confirmation: Not triggered',
        '- Red-zone confirmation: Maintainer approved build-script scope; rollback by reverting the script change.',
      ),
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Full packet evidence missing section: Red Team',
    );
  });

  it('rejects checked red-team items when evidence fields stay empty', () => {
    const result = validatePullRequestPacket(
      validDocsOnlyBody.replace(
        '- [ ] Tried to prove the change can bypass route/menu/API permission checks.',
        '- [x] Tried to prove the change can bypass route/menu/API permission checks.',
      ),
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Red Team evidence missing: Attack result');
    expect(result.errors).toContain('Red Team evidence missing: Residual risk');
  });
});
