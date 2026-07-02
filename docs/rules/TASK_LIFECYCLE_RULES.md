# TASK_LIFECYCLE_RULES.md — 可选生命周期产物

本文件只回答：什么时候需要 Clarify、Spec、Plan、Tasks、Handoff、Retrospective 等产物。普通 Fast Path / Lightweight 任务不需要套满所有阶段。

## 生命周期与 Workflow 的关系

- 生命周期产物回答“需求和交接是否足够清楚”。
- Workflow Packet 回答“风险、修饰器和验证证据是否足够”。
- 二者互不替代：有 Spec 不代表可以少验证；有 Full Packet 不代表可以跳过必要澄清。
- 红区、权限、接口、患者/报告、构建发布、生产问题从严使用 Clarify / Spec / Plan / Review。

## 阶段速查

| 阶段 | 何时需要 | 最低产出 | 退出条件 |
| --- | --- | --- | --- |
| Clarify | 目标、验收、业务规则不清 | 澄清总结 | 目标、成功标准、非目标清楚 |
| Spec | 新功能、接口契约、权限/数据规则、复杂 UI | 行为规格 | 行为、接口、边界、验收可执行 |
| Plan | 多步实现、跨文件、复杂验证、要交给其他人/Agent | 实施计划 | 文件范围、步骤、风险、验证明确 |
| Tasks | 需要拆到 backlog、Goal 或并行执行 | 可独立验收任务项 | 每项可验证、可回滚、依赖清楚 |
| Execute | 进入具体修改 | 小步改动 + 证据 | 未扩大范围 |
| Verify | 准备声称完成前 | 命令、浏览器、接口或日志结果 | 成功标准被真实验证或列明未验证 |
| Review | 高风险、子 Agent 产出、重要重构、PR 前 | 合规/质量结论 | 阻塞问题已修复或记录为风险 |
| Handoff | 暂停、换 Agent、跨天继续、交给人类 | 交接摘要 + 未完成事项 + Git / worktree / merge-back 状态 | 下一位执行者能继续，且未完成项可追踪 |
| Retrospective | 重复错误、规则被误解、验证漏跑 | 复盘结论 + 最小防复发动作 | 经验进入规则、模板、校验或 `FAILURE_LEARNINGS.md` |

## 多 Agent 协作模型

多 Agent 不是“把工作拆碎后谁都能收尾”，而是让不同职责各守边界。唯一能给出最终可交付/可合并判断的是主 Agent。

### 角色定义

| 角色 | 主要职责 | 不能替代的边界 |
| --- | --- | --- |
| 主 Agent | 任务澄清、风险判断、计划拆解、Agent 分派、结果汇总、是否可交付 / 可合并判断 | 不能把最终放行责任外包给实现者 |
| 实现 Agent | 在指定文件边界内实现变更，补齐实现证据 | 不能擅自扩大范围，不能自证通过 |
| 测试 Agent | 运行测试、补测试、报告验证结果与缺口 | 不能代替主 Agent 做范围决策 |
| 审查 Agent | 只读检查回归风险、遗漏测试、越权修改和证据质量 | 不能顺手改实现后再给自己放行 |
| 文档 Agent | 更新规则、交接、Memory、复盘与经验沉淀 | 不能替代实现或审查结论 |
| 安全 Agent | 权限、认证、敏感接口、导出、配置、审计等专项检查 | 只在命中安全触发条件时强制启用 |

### 启用矩阵

| 档位 | 默认组合 | 触发补充 |
| --- | --- | --- |
| Fast Path | 主 Agent | 文档变更较多时可补文档 Agent |
| Lightweight | 主 Agent + 实现 Agent | 共享逻辑改动时补测试 Agent 或审查 Agent |
| Full | 主 Agent + 实现 Agent + 审查 Agent | 命中权限 / 认证 / 敏感数据 / 导出时加安全 Agent；规则或契约变更加文档 Agent |

### 硬规则

- 同一任务只允许一个主 Agent。
- 子 Agent 只能在主 Agent 指定的文件边界、停止条件和验证范围内工作。
- 实现 Agent 不能把“我本地看起来没问题”当成最终结论。
- 中高风险任务的最终放行结论不能只来自实现者。
- 安全 Agent 只在命中触发条件时强制启用，不对低风险任务全量运行。

## 收尾强制项

进入 Handoff 或最终回复前，必须把“完成了什么”和“还没完成什么”分开写清楚。只要出现下面任一情况，就不能口头宣称“完成”：

- 未提交 git。
- 有未合并的 worktree 或分支。
- merge-back 未完成。
- 测试未跑、失败或只做了口头判断。
- review 未完成。
- 红区确认未拿到。
- 父任务 `Parent Completion Check` 未通过。
- 当前任务存在 `blockedReason`。

收尾时至少满足以下要求：

- `已完成事项` 与 `未完成事项` 必须分开写。
- `Git 状态`、`Worktree / 分支状态`、`Merge-back 状态` 必填。
- 只是中断而非真正结束时，不得省略 `续接提示词`。
- 需要 durable 沉淀时，把决策、失败模式、技术债或缺陷分别写入对应 memory，而不是混在交接正文里。

## 产物落位

| 产物 | 推荐位置 |
| --- | --- |
| Clarification | 任务来源、PR 描述或 `docs/templates/clarification-template.md` |
| Spec | `docs/templates/spec-template.md`；长期方案可放专题目录 |
| Plan | `docs/plans/` 或 `docs/superpowers/plans/` |
| Tasks | `backlog.json` + `docs/tasks/*.md`，字段见 `TASK_MANAGEMENT_RULES.md` |
| Handoff | 最终回复、agentmemory 或 `docs/templates/handoff-template.md` |
| Retrospective | PR / review 结论、`docs/templates/retrospective-template.md`；durable context 按 Memory 规则沉淀 |

## 禁用项

- 不把所有任务强制套满九个阶段。
- 不新增平行于 `AGENTS.md`、`docs/rules/`、`docs/memory/` 的治理来源。
- 不用 Handoff、Memory 或 Retrospective 逃避验证、审查或红区确认。
- 不把外部 skill 名称写成硬依赖；以当前环境和 `AGENT_SKILL_ROUTING.md` 为准。

## 关联文档

- [../../AGENTS.md](../../AGENTS.md)
- [./DYNAMIC_WORKFLOW_RULES.md](./DYNAMIC_WORKFLOW_RULES.md)
- [./TASK_INTAKE.md](./TASK_INTAKE.md)
- [./TASK_MANAGEMENT_RULES.md](./TASK_MANAGEMENT_RULES.md)
- [../templates/clarification-template.md](../templates/clarification-template.md)
- [../templates/spec-template.md](../templates/spec-template.md)
- [../templates/handoff-template.md](../templates/handoff-template.md)
- [../templates/retrospective-template.md](../templates/retrospective-template.md)
