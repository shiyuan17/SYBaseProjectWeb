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
5. 读取任务来源内容与关联计划 / spec。
6. 检查 `git status`，不得覆盖用户已有改动。
7. 如需编码，使用独立 worktree / 分支。
8. 如涉及后端接口、字段、权限、菜单、统计口径或业务规则，必须对照同级后端仓库 `SYBaseProject`。
9. **仅当用户或任务来源明确要求 loop** 时，再读 `docs/rules/LOOP_ENGINEERING_RULES.md` 并填写 Loop Packet。

## 任务内容

### Goal

`<粘贴任务 Goal>`

### Acceptance Criteria

`<粘贴任务 Acceptance Criteria>`

### Non-goals

`<粘贴任务 Non-goals>`

### Impact Scope

`<粘贴任务 Impact Scope>`

### Workflow Packet

`<粘贴任务 Workflow Packet>`

### Loop Packet（仅显式 loop 任务填写）

- Loop Type: `<Task Intake / Implementation / Review / Triage>`
- Stop Condition: `<可验证停止条件>`
- Verification Command: `<本 Goal 必跑命令；无则说明人工核对项>`
- State Sink: `<PROJECT_STATE.md / TECH_DEBT.md / KNOWN_BUGS.md / DECISIONS.md / ARCHITECTURE.md>`
- Escalation Condition: `<命中即暂停的条件>`

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

## Workflow 默认补充

如果任务来源没有给出更具体要求，按以下默认项补齐 Loop Packet 和验证范围：

- UI: 读取 `docs/rules/FRONTEND_RULES.md`、相关页面/组件；默认验证 `pnpm lint`、`pnpm check:type`、相关 `pnpm test:unit`，必要时 Browser 验证桌面/移动视口；停止条件为页面状态、交互和测试证据齐备。
- API: 读取 `docs/rules/FRONTEND_RULES.md`（API 节）、前端 service/mapper/test、同级后端接口实现；默认验证相关 service/mapper 单测、`pnpm check:type`，跨仓时引用后端测试；停止条件为字段映射、错误分支和兼容策略有证据。
- Security: 读取 `docs/rules/FRONTEND_RULES.md`（路由/API 节）、权限/敏感数据相关实现；默认验证权限/路由/request 相关测试和 Red Team；停止条件为越权、泄露、日志/导出暴露路径已检查。
- Production Debug: 先读取 `.logs/` 最近日志和 `KNOWN_BUGS.md`；默认先复现，再修复，再跑回归测试；停止条件为原始故障有修复前后证据和回滚说明。
- Workflow-Infra: 读取 `docs/rules/GIT_RULES.md`、相关 workflow/hook/script；默认验证脚本单测、`pnpm lint`、`pnpm check:type`；停止条件为门禁行为、误伤风险和回滚方式明确。

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
