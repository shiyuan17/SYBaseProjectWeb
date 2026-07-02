# LOOP_ENGINEERING_RULES.md — Loop Engineering

Loop 是显式 opt-in：长期、多轮、生产故障、maker/checker 或用户明确要求 loop 时才启用。普通任务按 `AGENTS.md` + `DYNAMIC_WORKFLOW_RULES.md` 交付即可。

- Workflow 分类与修饰器 → `DYNAMIC_WORKFLOW_RULES.md`
- worktree / 任务来源 → `GIT_RULES.md` §6
- Memory 职责 → `AGENTS.md` §8

## Loop Packet

每个 loop 任务须明确：

| 字段 | 说明 |
| --- | --- |
| Loop Type | `Task Intake` / `Implementation` / `Review` / `Triage` |
| Stop Condition | 可验证停止条件（测试通过、Packet 合格、人工确认等） |
| Verification Command | 本轮最小验证命令 |
| State Sink | 写入的 memory 文件 |
| Escalation Condition | 红区、规则不明、验证失败、跨仓证据缺失等暂停条件 |

Loop Packet 回答「如何循环、何时停」；Workflow Packet 回答「按哪类风险执行」。二者不互相替代。

**最小 Loop Packet**（低风险）：至少 Loop Type + Stop Condition + Verification Command；State Sink 默认 `PROJECT_STATE.md`，Escalation 默认「红区或验证失败无法修复时暂停」。中高风险或触发 Security/DB/Red Team 等修饰器须填完整五字段。

## Goal 防失控规则

Codex Goal 只能执行有明确边界的任务项。目录化父任务可以作为 Orchestrator Goal 执行，但只能编排子任务和执行父任务完成校验；目录化子任务才是实际修改代码或产出业务改动的 Goal 执行单元。

进入 Loop 前必须确认：

- 父任务声明 `Execution Mode: orchestrator`，并声明 `Run Policy: single-child` 或受限 `batch`。
- 子任务声明 `Execution Mode: goal`，并包含 `Stop Condition`、`Verification Command` 和 `Rollback Plan`。
- 目录化子任务包含 `Timebox: <= 5 minutes`。
- 验证失败、发现新缺口、超过 timebox、范围扩大或无法回滚时，停止并记录阻塞/后续子任务。

Orchestrator Goal 默认每轮只推进一个子任务，然后停止交付。只有 `runPolicy: "batch"` 且 `maxChildrenPerRun` 为 1 到 3 时，才允许连续推进多个子任务；batch 遇到第一个失败、阻塞、红区、timebox 超时或新缺口必须立即停止。

Loop 不允许把「继续寻找下一个缺口」作为默认下一步。子任务 `Stop Condition` 达成后必须交付；额外发现只能进入 Evidence / Handoff / 新子任务草案。

## Loop 类型

| 类型 | 用途 | 核心步骤 |
| --- | --- | --- |
| **Task Intake** | 需求/issue → 可执行任务 | 读规范与现状 → 任务确认 → 验收标准/非目标 → 缺规格则暂停 |
| **Implementation** | 受控实现切片 | 查 `git status` → worktree 决策 → 先测后实现 → 跑验证 → Memory 判定 |
| **Review** | maker/checker 分离 | Checker 只读审查 diff/验证/Packet；高风险必须启用；不直接改代码 |
| **Triage** | 定期发现可执行工作 | CI 失败、`.logs/`、Open 债务/bug、脏工作区、任务 backlog → 去重 → task 草案 |

### Sub-Agent 协作

主 Agent 定义子任务目标、边界、停止条件。子 Agent 不得扩大范围或绕过红区。

| 类型 | 权限          | 输出                           |
| ---- | ------------- | ------------------------------ |
| 探索 | 只读          | 事实、证据路径、影响面、未知项 |
| 实现 | 指定文件/模块 | 摘要、改动、验证、剩余风险     |
| 审查 | 只读          | 阻塞项、风险、放行理由         |

主 Agent 汇总：采纳/驳回结论、冲突处理、最终验证。

范例见 `docs/templates/workflow-packet-examples.md`。

## 禁用项

不用 loop 逃避人工审查；不引入自动 dispatcher 覆盖 Workflow 规则；不让自动化绕过红区/验证/Memory；不把无关任务塞进同一 loop。

## 关联文档

- [../../AGENTS.md](../../AGENTS.md)
- [./DYNAMIC_WORKFLOW_RULES.md](./DYNAMIC_WORKFLOW_RULES.md)
- [./AGENT_SKILL_ROUTING.md](./AGENT_SKILL_ROUTING.md)
- [./GIT_RULES.md](./GIT_RULES.md)
