# Codex Goal Prompt Template

Use this template to execute exactly one Linear issue with Codex Goal. Replace placeholders before starting the goal.

```markdown
目标：执行 Linear issue `<ISSUE_ID>`：`<标题>`。

请在当前仓库中工作，并严格遵守 `AGENTS.md`。

本 Goal 只处理这个 Linear issue，不扩展到其他任务。

## 开始前必须

1. 读取 `AGENTS.md`。
2. 读取 `docs/LINEAR_TASK.md`。
3. 读取 `docs/DYNAMIC_WORKFLOW_RULES.md`。
4. 读取本 issue 命中的专项规范。
5. 读取 Linear issue 内容与关联计划 / spec。
6. 检查 `git status`，不得覆盖用户已有改动。
7. 如需编码，使用独立 worktree / 分支。
8. 如涉及后端接口、字段、权限、菜单、统计口径或业务规则，必须对照同级后端仓库 `SYBaseProject`。

## Issue 内容

### Goal

`<粘贴 issue Goal>`

### Acceptance Criteria

`<粘贴 issue Acceptance Criteria>`

### Non-goals

`<粘贴 issue Non-goals>`

### Impact Scope

`<粘贴 issue Impact Scope>`

### Workflow Packet

`<粘贴 issue Workflow Packet>`

### Stop Conditions

`<粘贴 issue Stop Conditions>`

### Verification

`<粘贴 issue Verification>`

## 执行要求

- 先输出 `AGENTS.md` 要求的任务确认。
- 先读现有实现，再决定新增或复用。
- 优先做最小可验证改动。
- 红区或停止条件命中时暂停请求人工确认。
- 修改后实际运行验证命令；失败则先修复再重新验证。
- 交付前检查 AI Memory Update 是否需要更新。

## 交付格式

请最终输出：

- 变更摘要
- 影响说明
- Workflow Packet
- 验证结果
- AI Memory Update
- 风险提示
- 移交摘要
```
