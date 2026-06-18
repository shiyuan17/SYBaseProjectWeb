# PROJECT_STATE.md

## Current State

- Last updated: 2026-06-18
- Repository: `SYBaseProjectWeb`
- Phase: Active delivery across specimen-workflow, M6 statistics, operation-support, technical-workflow
- Active focus: Specimen collection workbench (frozen reminder, operating-room options, dictionary); sibling backend `../SYBaseProject/bl-center`
- Cross-repo contracts: see `docs/memory/ARCHITECTURE.md` (not duplicated here)

## Active Work

- Specimen workflow: frozen reminder polling, operating-room master data via `operating-options`, application registration workbench
- M6 statistics report workbench at `/m6/custom-analysis` (stable; dashboard composes `stat-reports/query`)
- M3 technical-workflow daterange controls aligned with specimen receipt pattern
- Governance P2: green-zone default skip Memory; Loop opt-in; `PROJECT_STATE` stays slim
- Dirty worktree in repo may include in-flight specimen-workflow changes — verify with `git status`

## Validation Baseline

- After governance/memory edits: `pnpm run check:governance`
- Feature validation: targeted `pnpm test:unit` + `pnpm check:type` on touched modules
- Full `pnpm lint` / `pnpm check:type` may be blocked by unrelated Open items in `docs/memory/TECH_DEBT.md`

## Cross-Repo Dependencies

- Durable API and permission contracts live in `docs/memory/ARCHITECTURE.md`
- Specimen actions resolve `specimenId > specimenBarcode > specimenNo`
- M6 must not call `POST /api/v1/stat-dashboard/query`

## Handoff Notes

- **Entry read**: this file + `ARCHITECTURE.md`
- **On demand**: `DECISIONS.md`（索引；契约全文 `docs/reviews/decisions-business-detail.md`）、`KNOWN_BUGS.md`、`TECH_DEBT.md` when task touches contracts, bugs, or debt
- **Session handoff**: agentmemory `handoff` / `recall` / `session-history`, or `agent-transcripts/` — not duplicated in this file
- **Never** use this file for dirty-worktree truth — run `git status --short`
- Historical detail: `docs/reviews/*-archive.md`, git history, PRs
