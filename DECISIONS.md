# DECISIONS.md

## Purpose

Track durable frontend and cross-repo decisions that future agents must preserve.

## Decisions

| ID | Date | Context | Decision | Rationale | Impact | Revisit When |
| --- | --- | --- | --- | --- | --- | --- |
| DEC-20260608-001 | 2026-06-08 | AI memory layer | Maintain repo-local memory files in both frontend and backend repos; update them at task delivery time on demand. | Keeps durable context close to the code while avoiding noisy hook-enforced updates. | Future AI tasks must check and update memory files before final handoff. | If automatic agent dispatch or external memory sync is introduced. |
| DEC-20260608-002 | 2026-06-08 | Dynamic workflow | Use Workflow Packet templates instead of an automatic dispatcher. | Keeps the workflow auditable and low-maintenance while still routing tasks by type. | PRs must explain chosen Workflow, agents, tests, simulation, security/DB checks, and Red Team outcome. | If team asks for script-assisted routing. |
| DEC-20260608-003 | 2026-06-08 | Governance doc consistency audit | `AGENTS.md` section 8 is the single source of truth for memory-file roles and generic update triggers; `DYNAMIC_WORKFLOW_RULES.md` and `GIT_RULES.md` cross-reference it instead of restating. `DYNAMIC_WORKFLOW_RULES.md` is now a first-class governance doc in the AGENTS reading order, mapping table, related-docs, and `docs/README.md`. `check:cspell` glob widened to `.ts/.tsx/.vue`. | Triple-maintained memory rules drifted; the dynamic workflow doc was undiscoverable; cspell silently skipped `.vue/.tsx`. | Future memory-rule edits change only AGENTS section 8; other docs keep references. Widened cspell may surface new spelling warnings needing the project dictionary. | If memory rules move out of AGENTS or a routing dispatcher is added. |

## Update Rules

- Add decisions only when they change future behavior or prevent repeated debate.
- Include options/rationale in the `Context` and `Rationale` columns when concise.
- Do not delete decisions; mark superseded in `Impact` or add a new decision.
