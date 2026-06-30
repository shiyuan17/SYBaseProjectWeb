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
| Handoff | 暂停、换 Agent、跨天继续、交给人类 | 交接摘要 | 下一位执行者能继续 |
| Retrospective | 重复错误、规则被误解、验证漏跑 | 复盘结论 | 有最小防复发动作 |

## 产物落位

| 产物 | 推荐位置 |
| --- | --- |
| Clarification | 任务来源、PR 描述或 `docs/templates/clarification-template.md` |
| Spec | `docs/templates/spec-template.md`；长期方案可放专题目录 |
| Plan | `docs/plans/` 或 `docs/superpowers/plans/` |
| Tasks | `backlog.json` + `docs/tasks/*.md`，字段见 `TASK_MANAGEMENT_RULES.md` |
| Handoff | 最终回复、agentmemory 或 `docs/templates/handoff-template.md` |
| Retrospective | PR / review 结论；durable context 按 Memory 规则沉淀 |

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
