# TECH_DEBT.md

## Purpose

Track **Open** technical debt. Resolved history: [docs/reviews/tech-debt-archive.md](../reviews/tech-debt-archive.md).

## Open Items

| ID | Severity | Source | Impact | Suggested Action |
| --- | --- | --- | --- | --- |
| TD-20260609-006 | Medium | `pnpm lint` during slicing pending slide-print merge delive… | Full frontend lint is blocked by unrelated dirty formatting in `apps/web-ele/src/modules/doctor-workflow/views/Diagnosi… | Format or otherwise reconcile `DiagnosisWorkbenchView.vue`, then rerun `pnpm lint`. |
| TD-20260610-001 | Medium | `pnpm lint` during embedding workstation direct remark edit… | Full frontend lint is blocked by unrelated `apps/web-ele/src/modules/technical-workflow/views/SlicingWorkstationView.vu… | Parenthesize or simplify the nested ternary and reorder the style properties in `SlicingWorkstation… |
| TD-20260611-003 | Medium | Full validation during Loop Engineering governance delivery | Full `pnpm lint` is blocked by unrelated dirty formatting in `apps/web-ele/src/modules/operation-support/views/ArchiveM… | Reconcile or remove the unrelated archive-specimen dirty changes, format `ArchiveManagementView.tes… |
| TD-20260613-002 | Low | Static system overview report `docs/system-overview.html` | M5 operation resource routes `/operation-resources/hazardous-chemicals` and `/operation-resources/medical-waste` are vi… | Either keep the entries hidden/clearly marked as reserved until backend/API scope exists, or implem… |
| TD-20260613-003 | Medium | Static system overview report `docs/system-overview.html` a… | Sibling backend `../SYBaseProject/bl-center` still exposes Stub implementations for external gateways including clinica… | Maintain an environment readiness matrix that states which gateway implementations are stubbed, int… |
| TD-20260613-004 | Medium | Route duplicate fix follow-up and M2 specimen-workflow size… | `specimen-workflow` still has large workbench/composable/test/fixture files, including `ApplicationRegistrationWorkbenc… | Split one workbench boundary at a time into composable/service/mapper/test-fixture units, starting … |
| TD-20260615-001 | Low | `pnpm lint` during M5 archive cabinet list UI trim | Full lint is blocked by pre-existing repository formatting issues in `scripts/validate-pr-packet.mjs` and `scripts/vali… | Format those two governance script files, then rerun `pnpm lint`. |

## Update Rules

- ID format: `TD-YYYYMMDD-NNN`.
- Update status instead of deleting; archive Resolved rows when the ledger grows.
