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
4. 读取 `docs/LOOP_ENGINEERING_RULES.md`。
5. 读取本 issue 命中的专项规范。
6. 读取 Linear issue 内容与关联计划 / spec。
7. 检查 `git status`，不得覆盖用户已有改动。
8. 如需编码，使用独立 worktree / 分支。
9. 如涉及后端接口、字段、权限、菜单、统计口径或业务规则，必须对照同级后端仓库 `SYBaseProject`。

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

### Loop Packet

- Loop Type: `<Task Intake / Implementation / Review / Triage>`
- Stop Condition: `<可验证停止条件>`
- Verification Command: `<本 Goal 必跑命令；无则说明人工核对项>`
- State Sink: `<PROJECT_STATE.md / TECH_DEBT.md / KNOWN_BUGS.md / DECISIONS.md / ARCHITECTURE.md / Linear>`
- Escalation Condition: `<命中即暂停的条件>`

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

## Workflow 默认补充

如果 issue 没有给出更具体要求，按以下默认项补齐 Loop Packet 和验证范围：

- UI: 读取 `docs/UI_RULES.md`、`docs/VUE_TS_RULES.md`、相关页面/组件；默认验证 `pnpm lint`、`pnpm check:type`、相关 `pnpm test:unit`，必要时 Browser 验证桌面/移动视口；停止条件为页面状态、交互和测试证据齐备。
- API: 读取 `docs/API_RULES.md`、前端 service/mapper/test、同级后端接口实现；默认验证相关 service/mapper 单测、`pnpm check:type`，跨仓时引用后端测试；停止条件为字段映射、错误分支和兼容策略有证据。
- Security: 读取 `docs/ROUTER_RULES.md`、`docs/API_RULES.md`、权限/敏感数据相关实现；默认验证权限/路由/request 相关测试和 Red Team；停止条件为越权、泄露、日志/导出暴露路径已检查。
- Production Debug: 先读取 `.logs/` 最近日志和 `KNOWN_BUGS.md`；默认先复现，再修复，再跑回归测试；停止条件为原始故障有修复前后证据和回滚说明。
- Workflow-Infra: 读取 `docs/GIT_RULES.md`、相关 workflow/hook/script；默认验证脚本单测、`pnpm lint`、`pnpm check:type`；停止条件为门禁行为、误伤风险和回滚方式明确。

## 交付格式

请最终输出：

- 变更摘要
- 影响说明
- Loop Packet
- Workflow Packet
- 验证结果
- AI Memory Update
- 风险提示
- 移交摘要
```
