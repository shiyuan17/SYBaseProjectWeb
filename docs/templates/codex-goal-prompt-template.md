# Codex Goal Prompt Template

Use this template to execute exactly one task item with Codex Goal. Replace placeholders before starting the goal.

```markdown
目标：执行单个任务项 `<TASK_ID>`：`<标题>`。

请在当前仓库中工作，并严格遵守 `AGENTS.md`。

本 Goal 只处理这个任务项，不扩展到其他任务。

## 开始前必须

1. 读取 `AGENTS.md`。
2. 读取 `docs/rules/TASK_INTAKE.md`。
3. 读取 `docs/rules/DYNAMIC_WORKFLOW_RULES.md`。
4. 读取本任务命中的专项规范。
5. 若任务来源属于本地任务体系，读取对应 AI 执行单元文件（见 `docs/rules/TASK_MANAGEMENT_RULES.md`）。
6. 读取任务来源内容与关联计划 / spec。
7. 检查 `git status`，不得覆盖用户已有改动。
8. 如需编码，按 `docs/rules/GIT_RULES.md` §6 完成 worktree 决策；命中必须使用 worktree 的条件时，使用独立 worktree / 分支。
9. 如涉及后端接口、字段、权限、菜单、统计口径或业务规则，必须对照同级后端仓库 `SYBaseProject`。
10. **仅当用户或任务来源明确要求 loop** 时，再读 `docs/rules/LOOP_ENGINEERING_RULES.md` 并填写 Loop Packet。

## 任务内容

### Goal

`<粘贴任务 Goal>`

### Acceptance Criteria

`<粘贴任务 Acceptance Criteria>`

### Non-goals

`<粘贴任务 Non-goals>`

### Impact Scope

`<粘贴任务 Impact Scope>`

### Dynamic Workflow

`<粘贴任务 Dynamic Workflow>`

### Memory

`<no durable context change / 粘贴任务 Memory 要求>`

### Evidence

`<粘贴任务验证、未验证项、风险要求>`

### Loop Packet（仅显式 loop 任务填写）

- Loop Type: `<Task Intake / Implementation / Review / Triage>`
- Stop Condition: `<可验证停止条件>`
- Verification Command: `<本 Goal 必跑命令；无则说明人工核对项>`
- State Sink: `<PROJECT_STATE.md / TECH_DEBT.md / KNOWN_BUGS.md / DECISIONS.md / ARCHITECTURE.md>`
- Escalation Condition: `<命中即暂停的条件>`
- Not used: `未启用 loop 时填写：Not used（普通任务，按 Dynamic Workflow 交付）`

### Stop Conditions

`<粘贴任务 Stop Conditions>`

### Verification

`<粘贴任务 Verification>`

## 执行要求

- 先输出 `AGENTS.md` 要求的任务确认。
- 先读现有实现，再决定新增或复用。
- 优先做最小可验证改动。
- 红区或停止条件命中时暂停请求人工确认。
- 修改后实际运行验证命令；失败则先修复再重新验证。
- 仅 durable context 变更时检查 AI Memory Update；绿区默认不写 memory。

## Dynamic Workflow 默认补充

如果任务来源没有给出更具体要求，按 `docs/rules/QUICKSTART.md` 选择最小阅读路径，按 `docs/rules/DYNAMIC_WORKFLOW_RULES.md` 补齐 Dynamic Workflow、修饰器和验证范围。任务项给出的更具体要求优先。

## 交付格式

请最终输出：

- 变更摘要
- 影响说明
- Loop Packet（仅显式 loop 任务填写；未启用时写 Not used）
- Dynamic Workflow
- Memory（无 durable context 变更时可写 no durable context change）
- Evidence / 验证结果
- 风险提示
- 移交摘要
```
