# Templates 模板索引

本目录存放可复用提示词、任务拆分模板和治理 Packet 示例。模板只承接规则，不定义新的强制规则；若模板与 `AGENTS.md` 或 `docs/rules/` 冲突，以规则正文为准。

本地任务清单与 AI 执行单元字段以 [`docs/rules/TASK_MANAGEMENT_RULES.md`](../rules/TASK_MANAGEMENT_RULES.md) 为准；模板只能复用这些字段，不能新增一套平行任务模型。

任务生命周期阶段以 [`docs/rules/TASK_LIFECYCLE_RULES.md`](../rules/TASK_LIFECYCLE_RULES.md) 为准；Clarification / Spec / Handoff / Retrospective 模板只提供填写结构。

PR、任务项和 Goal 模板统一使用 `Summary / Lifecycle Artifacts / Dynamic Workflow / Memory / Evidence` 字段名；具体强制程度以 [`DYNAMIC_WORKFLOW_RULES.md`](../rules/DYNAMIC_WORKFLOW_RULES.md) 为准。

## 模板清单

- [agents-governance-audit-prompt-template.md](./agents-governance-audit-prompt-template.md): 只读审计 `AGENTS.md` 与治理文档时使用，输出结构化审计报告和改进路线图。
- [clarification-template.md](./clarification-template.md): Clarify 阶段澄清目标、成功标准、非目标和缺失信息时使用。
- [codex-goal-prompt-template.md](./codex-goal-prompt-template.md): 将单个任务项交给 Codex Goal 执行时使用。
- [handoff-template.md](./handoff-template.md): Handoff 阶段交接上下文、验证结果、风险和下一步时使用。
- [plan-to-task-goals-prompt-template.md](./plan-to-task-goals-prompt-template.md): 将本地计划拆成可独立验收的任务项和 Goal 提示词时使用。
- [retrospective-template.md](./retrospective-template.md): Retrospective 阶段沉淀重复错误和规则缺口时使用。
- [spec-template.md](./spec-template.md): Spec 阶段定义目标、边界、契约、错误处理和验收标准时使用。
- [task-item-template.md](./task-item-template.md): 从计划、spec、issue 或 PR 拆出单个可执行任务项时使用。
- [workflow-packet-examples.md](./workflow-packet-examples.md): 查看 Fast Path、Lightweight、Full Packet 和 Memory Update 的填写范例时使用。

## 维护约定

- Loop 是显式 opt-in：只有用户、任务来源或计划明确要求 loop 时，模板才要求填写 Loop Packet。
- Worktree 决策引用 [GIT_RULES.md](../rules/GIT_RULES.md) §6；模板不得把低风险例外写成必须使用 worktree。
- Workflow、修饰器和 Packet 档位引用 [DYNAMIC_WORKFLOW_RULES.md](../rules/DYNAMIC_WORKFLOW_RULES.md)。
- Memory Update 触发条件引用 [AGENTS.md](../../AGENTS.md) §8；绿区 Fast Path / Lightweight 且无 durable 变更时默认不更新 memory。
