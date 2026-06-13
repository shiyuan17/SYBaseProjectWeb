# LOOP_ENGINEERING_RULES.md — Loop Engineering 协作规则

## 目标与适用范围

本文件是 `SYBaseProjectWeb` 的 Loop Engineering 入口，只定义可复用闭环，不替代既有规范。

- `AGENTS.md` 仍是协作边界、风险升级、交付要求的最高优先级规范
- `docs/rules/DYNAMIC_WORKFLOW_RULES.md` 仍是选择主 Workflow、强制修饰器、动态测试和 Red Team 的唯一来源
- 本文件只把任务从“一次性 prompt”组织成可审计、可验证、可暂停的 loop

边界收口：

- 是否需要 Loop Packet，由任务执行方式决定；不是所有低风险任务都必须为了形式合规补完整 Loop Packet
- Worktree / Linear / 脏工作区隔离规则不在本文件定义，统一引用 `docs/rules/GIT_RULES.md` 第 6 节
- 五类 Memory 文件职责与通用触发条件不在本文件定义，统一引用 `AGENTS.md` 第 8 节

## Loop Packet

每个进入 loop 的任务都必须明确以下字段，并映射到已有 Workflow Packet：

- Loop Type: `Task Intake / Implementation / Review / Triage`
- Stop Condition: 可验证的停止条件，例如测试命令通过、PR Packet 合格、人工确认完成
- Verification Command: 本轮可运行的最小验证命令；纯文档任务写明人工核对项
- State Sink: `docs/memory/PROJECT_STATE.md` / `docs/memory/TECH_DEBT.md` / `docs/memory/KNOWN_BUGS.md` / `docs/memory/DECISIONS.md` / `docs/memory/ARCHITECTURE.md` / Linear
- Escalation Condition: 命中红区、业务规则不明、验证失败无法修复、跨仓证据缺失等暂停条件

Loop Packet 不替代 Workflow Packet；它回答“这一轮如何循环和何时停”，Workflow Packet 回答“按哪类工程风险执行”。

最小 Loop Packet（低风险任务适用）：

- 低风险任务（绿区小改动、纯文档、规范审计、只读分析）进入 loop 时，至少写明 Loop Type、Stop Condition、Verification Command 三项即可
- State Sink 与 Escalation Condition 可标注「默认」：默认 State Sink 为 `docs/memory/PROJECT_STATE.md`，默认 Escalation 为「命中红区或验证失败无法修复时暂停」
- 命中实现类主 Workflow 但仍为低风险、未触发强制修饰器时，可继续使用最小 Loop Packet；中高风险任务或触发 Security / DB / Red Team / Backend Cross-check / Browser 验证时须填写完整五字段

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
2. Linear 任务或并行任务是否必须独立 worktree，统一按 `docs/rules/GIT_RULES.md` 第 6 节决策；本 loop 不额外加码。
3. 先补或更新相关测试，再做最小实现。
4. 运行 Loop Packet 中的验证命令；失败时读取输出，修复后重新运行。
5. 交付前检查五类 Memory 文件是否需要更新。

停止条件：

- 验收标准全部有证据支持
- 相关验证命令通过，或未验证项有明确原因
- Memory Update 已完成或说明未更新原因

## Sub-Agent Collaboration Template

用途：当任务需要探索、并行实现或独立审查时，把子 Agent 工作变成可汇总、可验证、可追责的输入。

通用规则：

- 主 Agent 必须先定义子任务目标、输入上下文、权限边界、停止条件和预期输出。
- 子 Agent 只承担被分配的切片；不得扩大范围、绕过红区确认、替代主 Agent 的最终判断。
- 子 Agent 输出必须由主 Agent 汇总、去重、冲突处理并完成最终验证后，才可进入交付或 PR。

| 子任务类型 | 输入 | 权限边界 | 输出 | 停止条件 |
| --- | --- | --- | --- | --- |
| 探索 | 具体问题、相关路径、需要确认的事实 | 只读；不得改文件、不得做实现决策 | 事实结论、证据路径、影响面、未知项 | 问题已回答，或列明无法确认的阻塞 |
| 实现 | 明确验收点、独立写作用域、验证命令 | 只改指定文件 / 模块；不得改他人工作或共享规则 | 修改摘要、改动文件、验证结果、剩余风险 | 验收点完成且局部验证有结论 |
| 审查 | diff、验证输出、Workflow / Loop / Memory Packet 草案 | 只读；不得直接修复 | 阻塞项、非阻塞风险、放行理由、攻击路径 | 审查结论足以决定返工或放行 |

主 Agent 汇总时必须记录：

- 子任务名称与产出来源
- 采纳、驳回或延后处理的结论
- 冲突如何解决
- 最终验证命令与结果

## Review Loop

用途：避免实现者自己给自己打分，尤其适用于高风险、跨层、权限、接口、CI、发布和生产问题。

角色：

- Maker: 负责实现、测试和初始交付说明。
- Checker: 只读审查 diff、验证输出、Workflow Packet、Memory Update 和 Red Team 路径。

规则：

- 高风险任务必须启用 Checker；中风险任务按影响范围选择。
- Checker 不直接修改代码；若发现问题，回到 Implementation Loop 由 Maker 修复。
- Checker 必须尝试证明实现会失败：权限绕过、数据泄露、错误吞噬、回滚缺口、验证缺失、模板字段空转。
- Checker 结论至少包含：审查来源（人工 / 子 Agent / reviewer）、主要攻击路径或审查重点、阻塞项或放行理由。

输出：

- 审查结论
- 阻塞项 / 非阻塞风险
- 是否允许进入提交或 PR 阶段

## Triage Loop

用途：定期发现可执行工作，而不是等待人工逐条提示。

输入：

- GitHub Actions / CI 失败
- `.logs/backend.log`、`.logs/frontend.log`、`.logs/build.log`、`.logs/test.log`
- `docs/memory/TECH_DEBT.md`、`docs/memory/KNOWN_BUGS.md` 中 Open 项
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

填写范例见 `docs/templates/workflow-packet-examples.md` 的「Triage Loop 真实输出样例」；示例只用于降低误填概率，不新增自动 dispatcher 或机器门禁。

## 禁用项

- 不用 loop 逃避人工理解；高风险交付仍需人工审查。
- 不引入自动 dispatcher 覆盖 `DYNAMIC_WORKFLOW_RULES.md`。
- 不让自动化绕过红区确认、后端核对、Memory Update 或真实验证。
- 不把多个无关任务塞进同一 loop，除非它们只是 Triage 汇总项。

## 关联文档

- [../../AGENTS.md](../../AGENTS.md)
- [./DYNAMIC_WORKFLOW_RULES.md](./DYNAMIC_WORKFLOW_RULES.md)
- [./AGENT_SKILL_ROUTING.md](./AGENT_SKILL_ROUTING.md)
- [./GIT_RULES.md](./GIT_RULES.md)
- [./LINEAR_TASK.md](./LINEAR_TASK.md)
- [./AI-CODE-HEALTH.md](./AI-CODE-HEALTH.md)
