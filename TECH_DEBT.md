# TECH_DEBT.md

## Purpose

Track durable frontend technical debt discovered during implementation, review, testing, or red-team analysis.

## Entry Format

| ID | Severity | Source | Impact | Suggested Action | Status |
| --- | --- | --- | --- | --- | --- |
| TD-20260608-001 | Medium | `pnpm lint` during technical specimen registration and diagnosis workstation deliveries | Full frontend lint was previously blocked by unrelated formatting issues in specimen/doctor workflow files and `unicorn/no-object-as-default-parameter` in `apps/web-ele/src/modules/technical-workflow/views/DehydrationWorkstationView.test.ts`. | No further action for this specific blocker; keep watching for recurrence in future lint runs. | Resolved |
| TD-20260608-002 | Medium | `pnpm check:type` during diagnosis workstation layout delivery | Full frontend typecheck was previously blocked by unrelated unused symbol `isVisibleInConfirmationScene` in `apps/web-ele/src/modules/specimen-workflow/composables/useSpecimenConfirmationPanel.ts`. | No further action for this specific blocker; keep watching for recurrence in future typecheck runs. | Resolved |
| TD-20260608-003 | Medium | `pnpm check:type` during tracking-list pathology number delivery | Full frontend typecheck was blocked by unrelated dirty slicing workflow errors in `technical-workflow` tests/types (`slideCount`, `combinedSlide`, `printedSlideCount`). | No further action for this specific blocker; slicing workflow type/test fixtures were reconciled during the print-before-slice delivery. | Resolved |

## Update Rules

- ID prefix is `TD-`, format `TD-YYYYMMDD-NNN` (e.g. `TD-20260608-001`), matching `AGENTS.md` section 8 and the PR Memory Update Packet.
- Add a new entry only when the debt is durable and actionable.
- Update `Status` instead of deleting resolved items.
- Reference tests, files, PRs, or backend evidence when applicable.
