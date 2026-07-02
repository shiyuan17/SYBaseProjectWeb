import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { validatePullRequestPacket } from './validate-pr-packet.mjs';

const validFastPathBody = `
# PR Workflow Packet

## Summary

- Purpose: Tighten governance wording for docs-only audit tasks.
- Impact: AGENTS.md and docs only.
- Validation: node scripts/validate-governance.mjs passed.
- Risks: Low-risk wording drift if future docs are not kept aligned.

## Lifecycle Artifacts

Lifecycle artifacts:

- Clarification: N/A
- Spec: N/A
- Plan: docs/reviews/ai-coding-governance-workflow-audit-2026-07-01.html
- Tasks: N/A
- Handoff: N/A
- Retrospective: N/A

## Dynamic Workflow

- Primary Workflow: Not applicable (docs-only governance update)
- Trigger signals: Pure docs and governance wording changes only
- Required modifiers: None
- Red-zone confirmation: Not triggered

## Memory

- Memory: no durable context change

## Evidence

### Lightweight Evidence

- Dynamic tests / validation: node scripts/validate-governance.mjs passed.
- Unverified items and reasons: Full lint not run because runtime code was not changed.
- Expert Agent(s): Not used
- Sub-agent collaboration: Not used
`;

const validLightweightBody = `
# PR Workflow Packet

## Summary

- Purpose: Update a low-risk component label.
- Impact: One module-local UI component.
- Validation: pnpm test:unit -- StatusLabel passed.
- Risks: Low; no layout, API, permission, or shared contract impact.

## Lifecycle Artifacts

Lifecycle artifacts:

- Clarification: N/A
- Spec: N/A
- Plan: N/A
- Tasks: N/A
- Handoff: N/A
- Retrospective: N/A

## Dynamic Workflow

- Primary Workflow: UI
- Trigger signals: Module-local display text only
- Required modifiers: None
- Red-zone confirmation: Not triggered

## Memory

- Memory: no durable context change

## Evidence

### Lightweight Evidence

- Dynamic tests / validation: pnpm test:unit -- StatusLabel passed.
- Unverified items and reasons: E2E not run; static label covered by unit test.
- Expert Agent(s): Not used
- Sub-agent collaboration: Not used
`;

const validFullSecurityBody = `
# PR Workflow Packet

## Summary

- Purpose: Adjust report export permission behavior.
- Impact: Report export UI and permission handling.
- Validation: pnpm test:unit -- report-export passed.
- Risks: Medium; report data export requires security review.

## Lifecycle Artifacts

Lifecycle artifacts:

- Clarification: docs/tasks/report-export.md
- Spec: docs/plans/report-export-spec.md
- Plan: docs/plans/report-export-plan.md
- Tasks: docs/tasks/report-export.md
- Handoff: N/A
- Retrospective: N/A

## Dynamic Workflow

- Primary Workflow: Security
- Trigger signals: Report data export permission behavior
- Required modifiers: Security / Red Team
- Red-zone confirmation: Security owner approved report export permission scope; rollback by reverting the permission gate change.

## Memory

- Memory: updated DECISIONS.md DEC-20260701-001; no TECH_DEBT or KNOWN_BUGS update needed.

## Evidence

### Full Evidence

- Required test commands: pnpm test:unit -- report-export
- Actual results: Passed.
- Dynamic simulation: Browser export button hidden for low-permission role.
- Dynamic security: Direct export action without permission returns 403 and shows a denial message.
- Dynamic database: No database migration.
- Cross-repo evidence: Backend authorization verified in sibling backend MR !999.

### Red Team

- Attack path: Attempt report export with a role lacking export permission.
- Expected failure point: Backend export endpoint rejects before returning report data.
- Attack result: Direct export action without permission returns 403 and shows a denial message.
- Residual risk: Backend audit-log completeness remains owned by the backend MR.
- Checker / reviewer source: Security reviewer
`;

const validFullDbBody = `
# PR Workflow Packet

## Summary

- Purpose: Add specimen dictionary migration support.
- Impact: Backend migration contract and frontend field display compatibility.
- Validation: Backend migration test and frontend mapper tests passed.
- Risks: Medium; DB migration requires rollback and compatibility evidence.

## Lifecycle Artifacts

Lifecycle artifacts:

- Clarification: docs/tasks/specimen-dictionary.md
- Spec: docs/plans/specimen-dictionary-spec.md
- Plan: docs/plans/specimen-dictionary-plan.md
- Tasks: docs/tasks/specimen-dictionary.md
- Handoff: N/A
- Retrospective: N/A

## Dynamic Workflow

- Primary Workflow: DB
- Trigger signals: Backend migration and frontend field compatibility.
- Required modifiers: DB / Backend Cross-check / Red Team
- Red-zone confirmation: Not triggered

## Memory

- Memory: updated ARCHITECTURE.md with specimen dictionary contract.

## Evidence

### Full Evidence

- Required test commands: backend migration test, pnpm test:unit -- specimen-dictionary
- Actual results: Passed.
- Dynamic simulation: Frontend displays legacy and migrated dictionary rows.
- Dynamic security: No permission surface changed.
- Dynamic database: Migration V120 applies and rollback SQL restores prior table shape.
- Cross-repo evidence: Sibling backend migration V120 and integration test passed.

### Red Team

- Attack path: Load rows created before and after migration.
- Expected failure point: Mapper should degrade missing optional fields to display placeholders.
- Attack result: Legacy row render test passed without dropping dictionary items.
- Residual risk: Production data volume rollback timing remains release-owner responsibility.
- Checker / reviewer source: DB reviewer
`;

const validBrowserVerificationBody = `
# PR Workflow Packet

## Summary

- Purpose: Adjust dashboard responsive layout.
- Impact: One dashboard page.
- Validation: Unit tests and browser viewport check passed.
- Risks: Medium; visual regression risk on small screens.

## Lifecycle Artifacts

Lifecycle artifacts:

- Clarification: N/A
- Spec: docs/plans/dashboard-layout-spec.md
- Plan: docs/plans/dashboard-layout-plan.md
- Tasks: N/A
- Handoff: N/A
- Retrospective: N/A

## Dynamic Workflow

- Primary Workflow: UI
- Trigger signals: Layout and viewport change.
- Required modifiers: Browser Verification
- Red-zone confirmation: Not triggered

## Memory

- Memory: no durable context change

## Evidence

### Full Evidence

- Required test commands: pnpm test:unit -- dashboard; browser screenshot at 1366x768 and 390x844
- Actual results: Passed.
- Dynamic simulation: Playwright screenshots show no overlap at desktop or mobile viewports.
- Dynamic security: No sensitive data or permission surface changed.
- Dynamic database: No database change.
- Cross-repo evidence: N/A; no API contract changed.
`;

const currentPrTemplateBody = readFileSync(
  '.github/PULL_REQUEST_TEMPLATE.md',
  'utf8',
);

describe('validatePullRequestPacket', () => {
  it('accepts fast path packets with the current Memory and Evidence structure', () => {
    const result = validatePullRequestPacket(validFastPathBody);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('accepts lightweight packets with the current Lightweight Evidence structure', () => {
    const result = validatePullRequestPacket(validLightweightBody);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('accepts full security packets with full evidence and red-team evidence', () => {
    const result = validatePullRequestPacket(validFullSecurityBody);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('accepts full DB packets with database and cross-repo evidence', () => {
    const result = validatePullRequestPacket(validFullDbBody);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('accepts browser verification packets when dynamic simulation evidence is present', () => {
    const result = validatePullRequestPacket(validBrowserVerificationBody);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('does not treat the current PR template as missing legacy packet sections', () => {
    const result = validatePullRequestPacket(currentPrTemplateBody);

    expect(result.errors).not.toContain('Missing section: Dynamic Tests');
    expect(result.errors).not.toContain(
      'Missing section: Memory Update Packet',
    );
  });

  it('rejects a PR body missing the Dynamic Workflow packet', () => {
    const result = validatePullRequestPacket(
      validFastPathBody.replace(
        /## Dynamic Workflow[\s\S]*?## Memory/,
        '## Memory',
      ),
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Missing section: Dynamic Workflow');
  });

  it('rejects blank validation and risk fields', () => {
    const result = validatePullRequestPacket(
      validFastPathBody
        .replace(
          '- Validation: node scripts/validate-governance.mjs passed.',
          '- Validation:',
        )
        .replace(
          '- Risks: Low-risk wording drift if future docs are not kept aligned.',
          '- Risks:',
        ),
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Empty field: Summary > Validation');
    expect(result.errors).toContain('Empty field: Summary > Risks');
  });

  it('rejects fast-path PR bodies that give no reason for not applicable', () => {
    const result = validatePullRequestPacket(
      validFastPathBody.replace(
        '- Primary Workflow: Not applicable (docs-only governance update)',
        '- Primary Workflow: Not applicable',
      ),
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Fast path requires a brief reason: Primary Workflow must be "Not applicable (<reason>)"',
    );
  });

  it('rejects packets with an empty Memory section judgment', () => {
    const result = validatePullRequestPacket(
      validFastPathBody.replace(
        '- Memory: no durable context change',
        '- Memory:',
      ),
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Memory section is present but has no substantive memory judgment',
    );
  });

  it('rejects full packets that omit Full Evidence', () => {
    const result = validatePullRequestPacket(
      validFullSecurityBody.replace(
        /### Full Evidence[\s\S]*?### Red Team/,
        '### Red Team',
      ),
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Missing section: Full Evidence');
  });

  it('rejects security packets that omit dynamic security evidence', () => {
    const result = validatePullRequestPacket(
      validFullSecurityBody.replace(
        '- Dynamic security: Direct export action without permission returns 403 and shows a denial message.',
        '- Dynamic security:',
      ),
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Empty field: Full Evidence > Dynamic security',
    );
  });

  it('rejects DB packets that omit dynamic database evidence', () => {
    const result = validatePullRequestPacket(
      validFullDbBody.replace(
        '- Dynamic database: Migration V120 applies and rollback SQL restores prior table shape.',
        '- Dynamic database:',
      ),
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Empty field: Full Evidence > Dynamic database',
    );
  });

  it('rejects backend cross-check packets that omit cross-repo evidence', () => {
    const result = validatePullRequestPacket(
      validFullDbBody.replace(
        '- Cross-repo evidence: Sibling backend migration V120 and integration test passed.',
        '- Cross-repo evidence:',
      ),
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Empty field: Full Evidence > Cross-repo evidence',
    );
  });

  it('rejects browser-verification packets that omit simulation evidence', () => {
    const result = validatePullRequestPacket(
      validBrowserVerificationBody.replace(
        '- Dynamic simulation: Playwright screenshots show no overlap at desktop or mobile viewports.',
        '- Dynamic simulation:',
      ),
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Empty field: Full Evidence > Dynamic simulation',
    );
  });

  it('rejects red-team packets that omit required red-team fields', () => {
    const result = validatePullRequestPacket(
      validFullSecurityBody
        .replace(
          '- Attack result: Direct export action without permission returns 403 and shows a denial message.',
          '- Attack result:',
        )
        .replace(
          '- Residual risk: Backend audit-log completeness remains owned by the backend MR.',
          '- Residual risk:',
        ),
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Red Team evidence missing: Attack result');
    expect(result.errors).toContain('Red Team evidence missing: Residual risk');
  });

  it('rejects red-zone full packets that omit red-team evidence', () => {
    const result = validatePullRequestPacket(
      validLightweightBody.replace(
        '- Red-zone confirmation: Not triggered',
        '- Red-zone confirmation: Maintainer approved build-script scope; rollback by reverting the script change.',
      ),
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Missing section: Red Team');
  });
});
