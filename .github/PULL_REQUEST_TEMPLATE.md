# PR Workflow Packet

Choose the smallest packet tier that matches the change. Workflow selection, modifiers, Red Team obligations, and packet tiers use `AGENTS.md` plus `docs/rules/DYNAMIC_WORKFLOW_RULES.md` as the source of truth.

Packet tier:

- Fast Path: pure docs, audit, read-only analysis, test-only, or low-risk static wording with no runtime behavior change.
- Lightweight: low-risk implementation without forced Security / DB / Red Team / Backend Cross-check.
- Full: required for Security / DB / Production Debug, Red Team / Backend Cross-check / Browser Verification, red-zone, cross-layer, permissions/data/report, build/release, or production issues.

## Summary

- Purpose:
- Impact:
- Validation:
- Risks:

## Lifecycle Artifacts

Lifecycle artifacts:

- Clarification: `N/A / <link>`
- Spec: `N/A / <link>`
- Plan: `N/A / <link>`
- Tasks: `N/A / <link>`
- Handoff: `N/A / <link>`
- Retrospective: `N/A / <link>`

## Dynamic Workflow

- Primary Workflow: `Not applicable (<reason>) / UI / API / DB / Security / Architecture / Production Debug / Workflow-Infra`
- Trigger signals:
- Required modifiers: `None / Security / DB / Red Team / Backend Cross-check / Browser Verification`
- Red-zone confirmation: `Not triggered / <source + approved scope + rollback or verification note>`

## Memory

Fast Path and Lightweight may use `no durable context change` when no Memory rule is triggered. Full packets must list updated files or explain why no durable context changed.

- Memory: `no durable context change / <updated files + memory IDs + cross-repo references>`

## Evidence

Fill only the evidence needed for the selected tier.

### Commit And Tag Traceability

- Commits created:
- Tags created:
- Tag purpose / release-note link:

### Lightweight Evidence

- Dynamic tests / validation:
- Unverified items and reasons:
- Expert Agent(s): `Not used / <role>`
- Sub-agent collaboration: `Not used / <subtasks + source + how main agent handled results>`

### Full Evidence

- Required test commands:
- Actual results:
- Dynamic simulation:
- Dynamic security:
- Dynamic database:
- Cross-repo evidence:

### Loop Packet

Use only when the task explicitly used loop.

- Loop Type: `Task Intake / Implementation / Review / Triage`
- Stop Condition:
- Verification Command:
- State Sink: `PROJECT_STATE.md / TECH_DEBT.md / KNOWN_BUGS.md / DECISIONS.md / ARCHITECTURE.md`
- Escalation Condition:

### Red Team

- Attack path:
- Expected failure point:
- Attack result:
- Residual risk:
- Checker / reviewer source:

### PR Packet Evidence Quality Review Checklist

- [ ] Workflow choice matches changed files, trigger signals, and risk tier.
- [ ] Required modifiers are complete for Security, DB, Red Team, Backend Cross-check, Browser Verification, red-zone, cross-layer, permission/data/report, build/release, or production-debug signals.
- [ ] Validation results are real command/browser/API outcomes, not future plans or "should pass" statements.
- [ ] Red Team evidence is substantive when triggered.
- [ ] Memory judgment is credible and cross-repo evidence is present when contracts require it.
