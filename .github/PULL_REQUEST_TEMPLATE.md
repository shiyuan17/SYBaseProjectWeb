# PR Workflow Packet

Choose the smallest packet tier that matches the change. Workflow selection, required modifiers, Red Team obligations, and packet tiers use `AGENTS.md` plus `docs/rules/DYNAMIC_WORKFLOW_RULES.md` as the source of truth.

Packet tier:

- Fast Path: pure docs, audit, read-only analysis, test-only, or low-risk static wording with no runtime behavior change.
- Lightweight: low-risk implementation with no forced Security / DB / Red Team / Backend Cross-check / Browser Verification modifier.
- Full: required for Security / DB / Production Debug, Red Team / Backend Cross-check / Browser Verification, red-zone, cross-layer, permissions/data/report, build/release, or production issues.

## Summary

- Purpose:
- Impact:
- Validation:
- Risks:

## Commit And Tag Traceability

- Commits created:
- Tags created:
- Tag purpose / release-note link:

## Dynamic Workflow

- Primary Workflow: `Not applicable (<reason>) / UI / API / DB / Security / Architecture / Production Debug / Workflow-Infra`
- Trigger signals:
- Required modifiers: `None / Security / DB / Red Team / Backend Cross-check / Browser Verification`
- Red-zone confirmation: `Not triggered / <source + approved scope + rollback or verification note>`

## Memory Update Packet

Optional for Fast Path and Lightweight when there is **no durable context change**. Required for Full packets when memory files were updated.

- Memory: `no durable context change / <updated files + memory IDs + cross-repo references>`

---

## Lightweight Details

Use only for low-risk implementation tasks when the Summary validation line is not enough to understand the evidence.

- Dynamic tests:
- Unverified items and reasons:
- Expert Agent(s): `Not used / <role>`
- Sub-agent collaboration: `Not used / <subtasks + source + how main agent handled results>`

---

## Full Packet Evidence

Use the blocks below only when the packet tier is Full or when a reviewer asks for extra evidence.

## Loop Packet

Use this only when the task was actually run as a loop. `docs/rules/LOOP_ENGINEERING_RULES.md` defines loop semantics only; worktree and Memory trigger rules still come from `docs/rules/GIT_RULES.md` and `AGENTS.md`.

- Loop Type: `Task Intake / Implementation / Review / Triage`
- Stop Condition:
- Verification Command:
- State Sink: `docs/memory/PROJECT_STATE.md / docs/memory/TECH_DEBT.md / docs/memory/KNOWN_BUGS.md / docs/memory/DECISIONS.md / docs/memory/ARCHITECTURE.md`
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

## Full Memory Details

- Updated memory files:
- Not updated memory files and reasons:
- Related memory IDs: `TD-* / BUG-* / DEC-*`
- Cross-repo memory references:
- Residual risk / follow-up owner:

## PR Packet Evidence Quality Review Checklist

For human reviewers only; this checklist does not add a machine gate and should not be used to force complex automation for subjective evidence quality.

- [ ] Workflow choice matches the changed files, trigger signals, and risk tier; Fast Path / Lightweight / Full is not used to hide required evidence.
- [ ] Required modifiers are complete for Security, DB, Red Team, Backend Cross-check, Browser Verification, red-zone, cross-layer, permission/data/report, build/release, or production-debug signals.
- [ ] Red Team evidence is substantive when triggered: attack path, expected failure point, actual result, and residual risk are all present and tied to real verification.
- [ ] Checker / reviewer source is clear for high-risk work, including whether it was human, sub-agent, reviewer, or not used with a valid reason.
- [ ] Sub-agent conclusions, if used, show what the main agent adopted, rejected, or deferred, and why.
- [ ] Validation results are real command/browser/API outcomes, not future plans or "should pass" statements.
- [ ] Memory Update judgment is credible: durable context changes have IDs or update notes, and skipped memory files have concise reasons.
- [ ] Cross-repo evidence is present when backend contracts, permissions, migrations, logs, or API behavior are part of the claim.
- [ ] Red-zone confirmation, when triggered, records the source, approved scope, external impact, verification or rollback note, and does not exceed the approved scope.
