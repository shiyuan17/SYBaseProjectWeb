# PROJECT_STATE.md

## Current State

- Last updated: 2026-06-08
- Repository: `SYBaseProjectWeb`
- Current phase: frontend governance hardening with AI memory layer enabled
- Active focus: governance doc consistency audit — dynamic workflow + memory layer wired into AGENTS reading order/mapping table, memory-update rules single-sourced to AGENTS section 8, doc-vs-config gaps (cspell scope, lefthook code-workspace step, Linear sync commands) reconciled
- Backend sibling repo: `../SYBaseProject` (parallel memory files confirmed present: PROJECT_STATE/ARCHITECTURE/DECISIONS/TECH_DEBT/KNOWN_BUGS)

## Active Work

- Dynamic workflow rules now route tasks into execution packets that include expert agents, tests, simulation, security/DB checks, red-team questions, and memory updates.
- AI memory files are now the durable repo-local state layer for future agents and must be checked before final delivery.
- Governance docs audited 2026-06-08: `docs/DYNAMIC_WORKFLOW_RULES.md` added to AGENTS reading order, mapping table, related-docs, and `docs/README.md`; memory-update enumeration de-duplicated to AGENTS section 8 (DYNAMIC/GIT now cross-reference); `check:cspell` glob widened to `.ts/.tsx/.vue`; `LINEAR_TASK.md` now documents `pnpm linear:*`. See `DECISIONS.md` DEC-20260608-003.
- The worktree contains unrelated business changes; future agents must separate governance edits from existing application edits.

## Validation Baseline

- Latest frontend governance validation known in this thread:
  - `pnpm lint`: passed on 2026-06-08 after memory-layer rule updates
  - `pnpm exec lefthook run pre-push --no-tty --force`: passed before the memory-layer changes

## Cross-Repo Dependencies

- Backend governance and memory files live in sibling repo `../SYBaseProject`.
- Cross-repo API, permission, database, patient, and report changes must update memory files in both repos when relevant.

## Handoff Notes

- Start future sessions by reading this file, `DECISIONS.md`, and `KNOWN_BUGS.md`, then inspect `git status`.
- Update memory files only when the task changes state, debt, bugs, decisions, or architecture.
