# PROJECT_STATE.md

## Current State

- Last updated: 2026-06-16
- Repository: `SYBaseProjectWeb`
- Current phase: M6 statistics full-stack delivery with governance workflow executability pass (Phase E)
- Active focus: `apps/web-ele/src/modules/m6-statistics` consumes sibling backend `../SYBaseProject/bl-center` statistics APIs. `/m6/dashboard` composes `POST /api/v1/stat-reports/query` for `QUALITY` / `OPERATION` / `WORKLOAD`; current frontend architecture must not reintroduce `POST /api/v1/stat-dashboard/query`. `POST /api/v1/stat-reports/query` uses `workloadUserId` for workload/personnel filtering, accepts `periodMode=month|quarter|year`, and may return metric metadata such as `metricStatus`, numerator/denominator, trend/breakdown, and source notes. `/m6/custom-analysis` is the single-entry statistics report workbench with tabs for workload, quality/safety, key quality, frozen timeliness, report-change, unqualified-specimen, and custom analysis reports. Current sibling backend exposes quality detail drilldown/export through `POST /api/v1/stat-reports/details/query` and `/details/export`; do not use the old mistaken `/api/v1/stat-report-details/*` path.
- Backend sibling repo: `../SYBaseProject` (parallel memory files confirmed present: `PROJECT_STATE.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `TECH_DEBT.md`, `KNOWN_BUGS.md`)

## Active Work

- Governance closure pass completed on 2026-06-12: `docs/memory/ARCHITECTURE.md` reflects the current M6 dashboard contract, `docs/memory/DECISIONS.md` duplicate IDs were reconciled, `docs/README.md` includes `docs/rules/LOOP_ENGINEERING_RULES.md`, `docs/rules/STATE_RULES.md` matches the real `apps/web-ele/src/store` path, and `pnpm run check:governance` now validates those baseline invariants locally.
- Governance Phase A/B/C closure is now active: `AGENTS.md`, `docs/rules/DYNAMIC_WORKFLOW_RULES.md`, `docs/rules/LOOP_ENGINEERING_RULES.md`, `docs/rules/AI-CODE-HEALTH.md`, and the PR template explicitly separate Workflow, worktree, loop, and Memory ownership; low-risk docs/audit tasks may use simplified delivery; `.github/workflows/governance-quality.yml` runs narrow governance checks on governance-only path changes.
- Governance audit-driven optimization (Phase D, 2026-06-12, `DEC-20260612-009`) completed: the modifier taxonomy全集 is single-sourced in `docs/rules/DYNAMIC_WORKFLOW_RULES.md` and `docs/rules/GIT_RULES.md` §8 is now a pointer; validation commands + UTF-8 rules single-sourced in `docs/rules/CODING_RULES.md`; `docs/rules/AI-CODE-HEALTH.md` compressed to a checklist and dropped from the first-read full-read list; a green-zone Fast Path was added to `AGENTS.md` + PR template (validated by `validate-pr-packet.mjs`); `validate-governance.mjs` gained BUG/TD duplicate-ID and relative-link checks; `pr-packet.yml` runs from the base ref; `cspell` covers `docs/**/*.md` and root memory files; `lefthook` pre-push runs `check:governance`. Closes `TD-20260610-002` and `TD-20260611-001`.
- Backend `../SYBaseProject` now has symmetric governance: `scripts/ci/validate-governance.sh` + `.gitlab/ci/verify.yml` `verify_governance`, a trimmed ≤120-line `PROJECT_STATE.md`, and a de-duplicated decision ledger (backend `DEC-20260612-002` ↔ frontend `DEC-20260612-009`).
- Governance workflow executability pass (Phase E, 2026-06-12, `DEC-20260612-010`) completed: `docs/rules/AGENT_SKILL_ROUTING.md` maps only actually-installed skills (Superpowers marked optional with fallbacks); `docs/rules/DYNAMIC_WORKFLOW_RULES.md` has a decision flowchart and a cross-repo mirror clause; filled template examples live in `docs/templates/workflow-packet-examples.md`; new `docs/TESTING_RULES.md` owns test layering and mock contract sync; ledgers have a 200-line soft budget in `check:governance`; `frontend-quality.yml` also runs `check:governance`. Backend mirror: health docs consolidated into one checklist `docs/rules/AI-CODE-HEALTH.md`, backend `docs/rules/DYNAMIC_WORKFLOW_RULES.md` gained a trigger quick-reference + mirror clause, `validate-governance.sh` gained the same ledger budget (backend `DEC-20260612-003`).
- Governance ergonomics patch active on 2026-06-12: `docs/rules/GIT_RULES.md` now matches the real lefthook `pre-push` `check:governance`; `AGENTS.md` defines red-zone confirmation protocol plus `codegraph` / `rtk` fallback; `docs/rules/DYNAMIC_WORKFLOW_RULES.md` and `docs/rules/LOOP_ENGINEERING_RULES.md` allow lightweight packets for low-risk implementation tasks; `docs/rules/UI_RULES.md` points to the actual Vben style/token entrypoints instead of a nonexistent `apps/web-ele/src/styles`.
- Governance packet-tier enforcement active on 2026-06-12 (`DEC-20260612-012`): `AGENTS.md` and the PR template expose Fast Path / Lightweight / Full as the main execution tiers; `validate-pr-packet.mjs` enforces tier-specific minimum evidence; `validate-governance.mjs` protects single-source anchors and workflow-example anchors.
- Complex-task sub-agent collaboration governance active on 2026-06-13 (`DEC-20260613-001`): `AGENTS.md`, `docs/rules/LOOP_ENGINEERING_RULES.md`, `docs/rules/DYNAMIC_WORKFLOW_RULES.md`, `docs/rules/GIT_RULES.md`, and the PR template now define when to use sub-agents, how to bound exploration / implementation / review work, and how the main Agent records merged results.
- `pnpm run check:governance` now also protects `docs/memory/PROJECT_STATE.md` itself: the file must retain its required summary sections and stay within a generous line budget so future sessions can keep using it as a short first-read entrypoint.
- Loop Engineering governance remains active: `docs/rules/LOOP_ENGINEERING_RULES.md` defines Task Intake / Implementation / Review / Triage loops; PR/Linear/Codex Goal templates include Loop Packet fields; `.github/workflows/pr-packet.yml` still focuses on PR packet completeness and now only adds a narrow Red Team minimum-evidence check when Red Team is explicitly declared.
- Governance Phase F Phase 0 closure active on 2026-06-15 (`DEC-20260615-003`): repaired duplicated `docs/rules/` paths in this file; `validate-governance.mjs` now rejects that typo pattern; `docs/rules/QUICKSTART.md` replaces the mechanical 16-doc first-read list with entry/task/foundation tiers in `AGENTS.md` §1.
- M6 statistics closure is validated for real pages and menu wiring: `/m6/dashboard`, `/m6/quality-indicators`, `/m6/management-indicators`, and `/m6/custom-analysis` map to real pages; dashboard/quality/management statistics all rely on the stable report-query contract rather than a phantom dashboard aggregate endpoint.
- M6 statistics report workbench implementation active on 2026-06-16: `/m6/custom-analysis` now acts as the single-entry multi-tab report workbench while keeping the route name/path compatible; it uses existing M6 report query/export contracts and quality detail drilldown contracts without adding backend menu or permission seeds. Goal 2 foundation is split into module-local report workbench utilities plus reusable filter, metric-card, chart, result-table, and detail-drawer components, so all workbench tabs share the same query/export/empty/error pattern. Workload tab export is now a local merged CSV so the exported file matches the combined `OPERATION + WORKLOAD` display. Goal 4/5 adds quality trend/breakdown/details and key-quality critical-value read-only indicators (`QC_CRITICAL_VALUE_COUNT`, `QC_CRITICAL_VALUE_REPORT_TIMELINESS_RATE`, `QC_CRITICAL_VALUE_REASON_ANALYSIS_COUNT`) backed by sibling backend `user_notifications.topic_code=CRITICAL_VALUE` proxy data. Goal 6-8 adds frozen timeliness/timeout, report-change, and unqualified-specimen read-only analysis indicators through sibling backend migration `V98__seed_m6_goal6_8_stat_indicators.sql`; frontend tabs now use those specific codes instead of older placeholder quality indicators. Cross-module attachment items (technical work-number range display, notification confirmation, critical-value notification/reason entry) remain explicitly deferred.
- M5 operation-support work remains stable on the current contract split: `/operation-support/archive` owns application-form / wax-block / slide / specimen / cabinet / archive-record work; `/operation-support/borrow` owns slide / wax-block borrow and return work. Specimen archive uses `POST /api/v1/archive/specimens` and `GET /api/v1/archive-objects?objectType=SPECIMEN`.
- M5 equipment management old-system alignment landed on 2026-06-16: sibling backend `../SYBaseProject/bl-center` now serves expanded equipment archive fields plus `POST /api/v1/equipment-records/batch-status`, and `/operation-resources/equipment` now uses the legacy-style wide table, rebuilt equipment dialog, batch restore/disable, and frontend export/print helpers. Browser verification could confirm the app boot path after fixing a broken placeholder medical-waste route import, but login-gated in-page device checks remain blocked by the slider captcha component in the in-app browser.
- M5 medical waste management landed on 2026-06-16: `/operation-resources/medical-waste` is now a real `MedicalWasteManagementView` with fixed `人体标本` / `药物试剂` tabs instead of a placeholder. The page reuses `M5_RESOURCE_PAGE_AUTHORITIES`, consumes sibling backend `../SYBaseProject/bl-center` medical-waste APIs for specimen batch preview/print/destroy and reagent bag save/handover, and keeps specimen label sourcing tied to existing grossing/label data instead of adding a standalone medical-waste label master.

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
- Latest M5 equipment old-system alignment on 2026-06-16:
  - Frontend targeted Vitest for equipment service/view/utils: passed
  - Frontend targeted ESLint for touched equipment files: passed
  - Frontend project `pnpm lint`: blocked by unrelated existing style-order errors in `apps/web-ele/src/modules/operation-support/components/ReagentStockDialog.vue`
  - Frontend project `pnpm check:type`: initially passed before the browser-fix follow-up, later blocked by unrelated existing type errors in `ReagentWasteHandoverDialog.vue` and `ReagentWastePrintDialog.vue`
  - Sibling backend `../SYBaseProject/bl-center` targeted Maven tests `OperationSupportIntegrationTest,M5SingleApiIntegrationTest`: passed
  - Browser verification: app boot recovered after fixing the broken medical-waste route import; login-page rendering verified, but post-login equipment-page interaction remained unverified because the slider captcha could not be completed in the in-app browser automation surface
- Latest M5 medical waste management on 2026-06-16:
  - Frontend targeted Vitest for medical-waste view/service/access/menu/route wiring: passed
  - Frontend targeted ESLint for touched medical-waste files: passed
  - Frontend `pnpm check:type --filter=@vben/web-ele`: passed
  - Sibling backend `../SYBaseProject/bl-center` targeted Maven test `MedicalWasteIntegrationTest`: passed
  - Browser verification: route navigation to `http://localhost:5778/operation-resources/medical-waste` succeeded and confirmed the app no longer crashes on the route import, but authenticated in-page validation of tabs/dialogs remained blocked by the login slider captcha in the in-app browser
- Historical feature-level validation details are intentionally kept out of this file now; recover them from targeted tests, `docs/memory/KNOWN_BUGS.md`, `docs/memory/TECH_DEBT.md`, PRs, or git history when needed.

## Cross-Repo Dependencies

- M6 statistics frontend depends on sibling backend `../SYBaseProject/bl-center` report-query contracts:
  - `POST /api/v1/stat-reports/query`
  - `POST /api/v1/stat-reports/export`
  - `POST /api/v1/stat-reports/details/query`
  - `POST /api/v1/stat-reports/details/export`
- M5 archive/borrow frontend pages depend on sibling backend archive contracts for application-form / `EMBEDDING_BOX` / slide / specimen archive, archive cabinet maintenance, archive object pagination, and material-loan pending/create/return.
- M5 reagent management depends on sibling backend reagent template / stock / stock-event contracts and keeps CSV-compatible import/export semantics.
- M5 medical waste management depends on sibling backend `../SYBaseProject/bl-center` `medical-waste` contracts for specimen batch list/options/preview/print/destroy and reagent bag list/save/handover, while specimen label preview data is still sourced from the grossing workflow rather than a new medical-waste label table.
- Specimen workflow progression depends on sibling backend resolving workflow requests by `specimenId > specimenBarcode > specimenNo`; barcode binding remains nullable until explicit binding.
- System-management role displays depend on sibling backend `../SYBaseProject/bl-center` returning canonical no-prefix workflow `roleName` values for built-in `ROLE_M2_*`, `ROLE_M3_*`, and `ROLE_M4_*` roles; frontend should consume backend `roleName` directly rather than trimming `M2/M3/M4` locally.
- Cross-repo API, permission, database, patient, and report contract changes must update memory files in both repos when durable context changes.

## Handoff Notes

- Start future sessions by reading this file, `docs/memory/DECISIONS.md`, and `docs/memory/KNOWN_BUGS.md`, then inspect `git status`.
- Do not rely on this file for current dirty-worktree state; always run `git status --short` and inspect relevant diffs before taking ownership of changes.
- Keep `docs/memory/PROJECT_STATE.md` short and current. Long validation logs, superseded implementation history, and one-off recovery notes belong in PRs, `KNOWN_BUGS.md`, `TECH_DEBT.md`, or git history instead of growing this file again.
