# PR Review

## Summary

- Purpose:
- Impact:
- Validation:
- Risks:

## Dynamic Workflow Router

Select the primary review workflow that matches this task. Red Team Review is required for every high-risk change and must not be replaced by another workflow.

- [ ] UI Review: UI, interaction, layout, visual regression, screenshots or recordings
- [ ] API Review: request/response contract, error model, pagination, backend field mapping
- [ ] DB Review: schema, migration, seed data, rollback, data compatibility
- [ ] Security Review: permissions, authentication, patient data, report data, sensitive logs
- [ ] Architecture Review: shared contracts, route/store/request boundaries, large-file refactor
- [ ] Execution Driven Debug: production issue, log-first diagnosis, reproduction, rollback path
- [ ] Red Team Review: adversarial review for bypasses, data loss, broken assumptions, rollback gaps

## Red Team Review

- [ ] Tried to prove the change can bypass permission or route guards.
- [ ] Tried to prove patient/report/business data can be leaked, corrupted, duplicated, or lost.
- [ ] Tried to prove error handling hides failures or makes recovery ambiguous.
- [ ] Tried to prove rollback or fallback steps are missing.
- [ ] Documented any rejected attack path or remaining residual risk.

## Workflow Evidence

- [ ] Relevant `AGENTS.md` and scoped rules were read.
- [ ] Required backend/frontend cross-checks were completed, if the change crosses repos.
- [ ] Required validation commands are listed with real results.
- [ ] Unverified items are explicitly marked with reasons.
