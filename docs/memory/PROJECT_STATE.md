# PROJECT_STATE.md

## Current State

- Last updated: 2026-07-02
- Repository: `SYBaseProjectWeb`
- Phase: Governance baseline convergence on top of active delivery across specimen-workflow, M6 statistics, operation-support, technical-workflow
- Active focus: converge AI governance rules into the shared baseline, then migrate one historical large task to the directory-based parent/child Goal model; sibling backend `../SYBaseProject/bl-center`
- Cross-repo contracts: see `docs/memory/ARCHITECTURE.md` (not duplicated here)

## Active Work

- Governance Phase 1: multi-Agent collaboration model, mandatory handoff closeout fields, failure learnings, and governance audit/report indexes are being converged into the shared baseline
- Governance Phase 2: `T-002` is the first historical large task migrated to the parent `orchestrator` + child `goal` directory model; next step is executing `T-002.001` and validating the pattern with real work
- Quality baseline: governance validation and typecheck have fresh pass evidence; fresh `pnpm lint` is currently blocked by `oxfmt --check` findings, `oxlint` rule violations, and an `oxlint` allocator panic recorded during lint execution
- Runtime feature work remains active in specimen-workflow, technical-workflow, and M6 custom analysis; verify dirty-worktree truth with `git status --short`

## Validation Baseline

- After governance / memory edits: `pnpm exec vitest run scripts/validate-governance.test.mjs`, `node scripts/validate-governance.mjs`, `pnpm run check:governance`, `git diff --check`
- Feature validation: targeted `pnpm test:unit` + `pnpm check:type` on touched modules
- Treat fresh `pnpm lint` failures as an open quality blocker until formatter, stylelint / oxlint findings, and allocator instability are triaged or fixed

## Cross-Repo Dependencies

- Durable API and permission contracts live in `docs/memory/ARCHITECTURE.md`
- Specimen actions resolve `specimenId > specimenBarcode > specimenNo`
- M6 must not call `POST /api/v1/stat-dashboard/query`

## Handoff Notes

- **Entry read**: this file + `ARCHITECTURE.md`
- **On demand**: `DECISIONS.md`（索引；契约全文 `docs/reviews/decisions-business-detail.md`）、`KNOWN_BUGS.md`、`TECH_DEBT.md` when task touches contracts, bugs, or debt
- **Governance follow-up**: read `AGENTS.md`, `TASK_LIFECYCLE_RULES.md`, `TASK_MANAGEMENT_RULES.md`, and `FAILURE_LEARNINGS.md` before continuing task-model or handoff work
- **Session handoff**: agentmemory `handoff` / `recall` / `session-history`, or `agent-transcripts/` — not duplicated in this file
- **Never** use this file for dirty-worktree truth — run `git status --short`
- Historical detail: `docs/reviews/*-archive.md`, git history, PRs
