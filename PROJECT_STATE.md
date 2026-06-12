# PROJECT_STATE.md

## Current State

- Last updated: 2026-06-12
- Repository: `SYBaseProjectWeb`
- Current phase: M6 statistics full-stack delivery with governance closure follow-up
- Active focus: `apps/web-ele/src/modules/m6-statistics` consumes sibling backend `../SYBaseProject/bl-center` statistics APIs. `/m6/dashboard` composes `POST /api/v1/stat-reports/query` for `QUALITY` / `OPERATION` / `WORKLOAD`; current frontend architecture must not reintroduce `POST /api/v1/stat-dashboard/query`. `POST /api/v1/stat-reports/query` uses `workloadUserId` for workload/personnel filtering and may return metric metadata such as `metricStatus`, numerator/denominator, trend/breakdown, and source notes. Quality drilldowns use `POST /api/v1/stat-report-details/query` and `/export` with non-sensitive detail rows only.
- Backend sibling repo: `../SYBaseProject` (parallel memory files confirmed present: `PROJECT_STATE.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `TECH_DEBT.md`, `KNOWN_BUGS.md`)

## Active Work

- Governance closure pass completed on 2026-06-12: `ARCHITECTURE.md` reflects the current M6 dashboard contract, `DECISIONS.md` duplicate IDs were reconciled, `docs/README.md` includes `LOOP_ENGINEERING_RULES.md`, `docs/STATE_RULES.md` matches the real `apps/web-ele/src/store` path, and `pnpm run check:governance` now validates those baseline invariants locally.
- Governance Phase A/B/C closure is now active: `AGENTS.md`, `docs/DYNAMIC_WORKFLOW_RULES.md`, `docs/LOOP_ENGINEERING_RULES.md`, `docs/AI-CODE-HEALTH.md`, and the PR template explicitly separate Workflow, worktree, loop, and Memory ownership; low-risk docs/audit tasks may use simplified delivery; `.github/workflows/governance-quality.yml` runs narrow governance checks on governance-only path changes.
- `pnpm run check:governance` now also protects `PROJECT_STATE.md` itself: the file must retain its required summary sections and stay within a generous line budget so future sessions can keep using it as a short first-read entrypoint.
- Loop Engineering governance remains active: `docs/LOOP_ENGINEERING_RULES.md` defines Task Intake / Implementation / Review / Triage loops; PR/Linear/Codex Goal templates include Loop Packet fields; `.github/workflows/pr-packet.yml` still focuses on PR packet completeness and now only adds a narrow Red Team minimum-evidence check when Red Team is explicitly declared.
- M6 statistics closure is validated for real pages and menu wiring: `/m6/dashboard`, `/m6/quality-indicators`, `/m6/management-indicators`, and `/m6/custom-analysis` map to real pages; dashboard/quality/management statistics all rely on the stable report-query contract rather than a phantom dashboard aggregate endpoint.
- M5 operation-support work remains stable on the current contract split: `/operation-support/archive` owns application-form / wax-block / slide / specimen / cabinet / archive-record work; `/operation-support/borrow` owns slide / wax-block borrow and return work. Specimen archive uses `POST /api/v1/archive/specimens` and `GET /api/v1/archive-objects?objectType=SPECIMEN`.

## Validation Baseline

- Governance closure validation on 2026-06-12:
  - `pnpm run check:governance`: passed
  - `pnpm exec vitest run scripts/validate-governance.test.mjs scripts/validate-pr-packet.test.mjs`: passed
- Latest M6 closure validation on 2026-06-12:
  - Targeted M6/menu Vitest: passed
  - `pnpm check:type`: passed
  - `pnpm lint`: passed
  - `pnpm build:ele`: passed
  - Playwright desktop/mobile smoke for `/m6/dashboard`, `/m6/quality-indicators`, `/m6/management-indicators`, `/m6/custom-analysis`: passed with mocked APIs and no console errors
  - Sibling backend `../SYBaseProject/bl-center` M6 integration / authorization / observability tests: passed
- Historical feature-level validation details are intentionally kept out of this file now; recover them from targeted tests, `KNOWN_BUGS.md`, `TECH_DEBT.md`, PRs, or git history when needed.

## Cross-Repo Dependencies

- M6 statistics frontend depends on sibling backend `../SYBaseProject/bl-center` report-query contracts:
  - `POST /api/v1/stat-reports/query`
  - `POST /api/v1/stat-reports/export`
  - `POST /api/v1/stat-report-details/query`
  - `POST /api/v1/stat-report-details/export`
- M5 archive/borrow frontend pages depend on sibling backend archive contracts for application-form / `EMBEDDING_BOX` / slide / specimen archive, archive cabinet maintenance, archive object pagination, and material-loan pending/create/return.
- M5 reagent management depends on sibling backend reagent template / stock / stock-event contracts and keeps CSV-compatible import/export semantics.
- Specimen workflow progression depends on sibling backend resolving workflow requests by `specimenId > specimenBarcode > specimenNo`; barcode binding remains nullable until explicit binding.
- Cross-repo API, permission, database, patient, and report contract changes must update memory files in both repos when durable context changes.

## Handoff Notes

- Start future sessions by reading this file, `DECISIONS.md`, and `KNOWN_BUGS.md`, then inspect `git status`.
- The current worktree is dirty; do not assume ownership of unrelated doctor-workflow or M6 edits without checking `git diff`.
- Keep `PROJECT_STATE.md` short and current. Long validation logs, superseded implementation history, and one-off recovery notes belong in PRs, `KNOWN_BUGS.md`, `TECH_DEBT.md`, or git history instead of growing this file again.
