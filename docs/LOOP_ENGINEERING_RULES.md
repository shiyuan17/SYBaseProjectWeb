# LOOP_ENGINEERING_RULES.md — Loop Engineering 协作规则

## 目标与适用范围

本文件是 `SYBaseProjectWeb` 的 Loop Engineering 入口，只定义可复用闭环，不替代既有规范。

- `AGENTS.md` 仍是协作边界、风险升级、交付要求的最高优先级规范
- `docs/DYNAMIC_WORKFLOW_RULES.md` 仍是选择主 Workflow、强制修饰器、动态测试和 Red Team 的唯一来源
- 本文件只把任务从“一次性 prompt”组织成可审计、可验证、可暂停的 loop

## Loop Packet

每个进入 loop 的任务都必须明确以下字段，并映射到已有 Workflow Packet：

- Loop Type: `Task Intake / Implementation / Review / Triage`
- Stop Condition: 可验证的停止条件，例如测试命令通过、PR Packet 合格、人工确认完成
- Verification Command: 本轮可运行的最小验证命令；纯文档任务写明人工核对项
- State Sink: `PROJECT_STATE.md` / `TECH_DEBT.md` / `KNOWN_BUGS.md` / `DECISIONS.md` / `ARCHITECTURE.md` / Linear
- Escalation Condition: 命中红区、业务规则不明、验证失败无法修复、跨仓证据缺失等暂停条件

Loop Packet 不替代 Workflow Packet；它回答“这一轮如何循环和何时停”，Workflow Packet 回答“按哪类工程风险执行”。

## Task Intake Loop

用途：把用户需求、Linear issue、计划文档或故障报告变成可执行任务。

步骤：

1. 读取 `AGENTS.md`、命中的专项规范、相关 issue / spec / 现有实现。
2. 输出任务确认：目标、影响范围、主 Workflow、修饰器、依赖、风险等级、关键假设。
3. 明确验收标准、非目标、风险区和停止条件。
4. 若验收标准缺失且不同理解会改变页面行为、接口联调或权限边界，暂停请求人工确认。

输出：

- 任务确认
- Loop Packet
- Workflow Packet 草案
- 必须人工确认项

## Implementation Loop

用途：在受控范围内完成一个可验证的实现切片。

步骤：

1. 检查 `git status`，不得覆盖用户已有改动。
2. Linear 任务或并行任务使用独立 worktree；非 Linear 小任务可在当前工作区执行，但必须避开无关改动。
3. 先补或更新相关测试，再做最小实现。
4. 运行 Loop Packet 中的验证命令；失败时读取输出，修复后重新运行。
5. 交付前检查五类 Memory 文件是否需要更新。

停止条件：

- 验收标准全部有证据支持
- 相关验证命令通过，或未验证项有明确原因
- Memory Update 已完成或说明未更新原因

## Review Loop

用途：避免实现者自己给自己打分，尤其适用于高风险、跨层、权限、接口、CI、发布和生产问题。

角色：

- Maker: 负责实现、测试和初始交付说明。
- Checker: 只读审查 diff、验证输出、Workflow Packet、Memory Update 和 Red Team 路径。

规则：

- 高风险任务必须启用 Checker；中风险任务按影响范围选择。
- Checker 不直接修改代码；若发现问题，回到 Implementation Loop 由 Maker 修复。
- Checker 必须尝试证明实现会失败：权限绕过、数据泄露、错误吞噬、回滚缺口、验证缺失、模板字段空转。

输出：

- 审查结论
- 阻塞项 / 非阻塞风险
- 是否允许进入提交或 PR 阶段

## Triage Loop

用途：定期发现可执行工作，而不是等待人工逐条提示。

输入：

- GitHub Actions / CI 失败
- `.logs/backend.log`、`.logs/frontend.log`、`.logs/build.log`、`.logs/test.log`
- `TECH_DEBT.md`、`KNOWN_BUGS.md` 中 Open 项
- 脏工作区和未完成交接
- Linear backlog

步骤：

1. 汇总新增失败、重复失败、开放债务和阻塞项。
2. 去重并判断是否已有 Memory / Linear 记录。
3. 对可执行项生成 Linear issue 草案或文档任务。
4. 对红区、跨仓、权限/数据/报告相关项标记必须人工确认。

输出：

- Triage 摘要
- 候选任务列表
- 建议 Loop Type、Workflow、验证命令和 State Sink

## 禁用项

- 不用 loop 逃避人工理解；高风险交付仍需人工审查。
- 不引入自动 dispatcher 覆盖 `DYNAMIC_WORKFLOW_RULES.md`。
- 不让自动化绕过红区确认、后端核对、Memory Update 或真实验证。
- 不把多个无关任务塞进同一 loop，除非它们只是 Triage 汇总项。

## 关联文档

- [../AGENTS.md](../AGENTS.md)
- [./DYNAMIC_WORKFLOW_RULES.md](./DYNAMIC_WORKFLOW_RULES.md)
- [./AGENT_SKILL_ROUTING.md](./AGENT_SKILL_ROUTING.md)
- [./GIT_RULES.md](./GIT_RULES.md)
- [./LINEAR_TASK.md](./LINEAR_TASK.md)
- [./AI-CODE-HEALTH.md](./AI-CODE-HEALTH.md)
