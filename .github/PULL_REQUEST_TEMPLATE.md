# PR Workflow Packet

## Summary

- Purpose:
- Impact:
- Validation:
- Risks:

## Dynamic Workflow

Choose one primary Workflow and add required modifiers. Workflow selection, required modifiers, and Red Team obligations use `docs/DYNAMIC_WORKFLOW_RULES.md` as the single source of truth. Low-risk pure docs / audit tasks may mark this section `Not applicable` with a brief reason instead of expanding a full implementation packet.

- Primary Workflow: `UI / API / DB / Security / Architecture / Production Debug / Workflow-Infra`
- Trigger signals:
- Expert Agent(s):
- Required modifiers: `Security / DB / Red Team / Backend Cross-check / Browser Verification`

## Loop Packet

Use this only when the task was actually run as a loop. `docs/LOOP_ENGINEERING_RULES.md` defines loop semantics only; worktree and Memory trigger rules still come from `docs/GIT_RULES.md` and `AGENTS.md`.

- Loop Type: `Task Intake / Implementation / Review / Triage`
- Stop Condition:
- Verification Command:
- State Sink: `PROJECT_STATE.md / TECH_DEBT.md / KNOWN_BUGS.md / DECISIONS.md / ARCHITECTURE.md / Linear`
- Escalation Condition:

## Dynamic Tests

- Required test commands:
- Actual results:
- Unverified items and reasons:

## Dynamic Simulation

- Roles / permissions:
- Browser / viewport:
- API payloads / failure responses:
- Empty / loading / error / retry states:
- Logs / replay artifacts, if production debug:

## Dynamic Security

- [ ] Not applicable
- [ ] Permission, patient, report, login, audit, export, or sensitive-log impact checked
- Evidence:

## Dynamic Database

- [ ] Not applicable
- [ ] Backend migration, seed, SQL, compatibility, or rollback impact checked
- Backend evidence:

## Red Team

- [ ] Tried to prove the change can bypass route/menu/API permission checks.
- [ ] Tried to prove patient/report/business data can leak, corrupt, duplicate, or disappear.
- [ ] Tried to prove errors are swallowed or users see misleading success.
- [ ] Tried to prove rollback, fallback, or target-environment validation is missing.
- Checker / reviewer source:
- Attack result:
- Residual risk:

## Cross-Repo Evidence

- Frontend evidence:
- Backend evidence:
- Linked PR/MR:

## Memory Update Packet

Required before merge. Update memory files only when the task changes durable context; list skipped files with reasons.

- Updated memory files:
- Not updated memory files and reasons:
- Related memory IDs: `TD-* / BUG-* / DEC-*`
- Cross-repo memory references:
- Residual risk / follow-up owner:
