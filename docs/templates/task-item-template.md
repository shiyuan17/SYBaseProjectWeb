# Task Item Template

Use this template when converting a local plan or specification into task items. Keep each item small enough to verify independently, and treat unclear acceptance criteria as a blocker before implementation.

## Title

`<Short actionable title>`

## Description

```markdown
## Background

来自 `<计划 / spec / issue / PR / 外部任务系统 / 其他来源>`。

若来源为本地 `backlog.json`，补充记录：`任务 ID` 与 `AI 执行单元文件路径`。

推荐同步到 `backlog.json` 的字段：`risk`、`packetTier`、`validation`、`blockedReason`、`updatedAt`（字段含义见 `docs/rules/TASK_MANAGEMENT_RULES.md`）。

## Goal

本任务项只完成：`<单一目标>`。

## Acceptance Criteria

- [ ] `<可验证标准 1>`
- [ ] `<可验证标准 2>`
- [ ] `<测试、联调或浏览器验证标准>`

## Non-goals

- `<本任务项明确不做的事项>`

## Impact Scope

- Frontend: `<路径 / 页面 / 模块；无则写 N/A>`
- Backend: `<接口 / service / migration / test；无则写 N/A>`
- Tests: `<需要新增或更新的测试>`
- Docs / Memory: `<需要更新的文档或记忆层；无则写 N/A>`

## Dynamic Workflow

- Primary Workflow: `<UI / API / DB / Security / Architecture / Production Debug / Workflow-Infra / 不适用>`
- Trigger signals: `<命中路径 / 行为 / 风险信号>`
- Required Modifiers: `<Security / DB / Red Team / Backend Cross-check / Browser Verification / 无>`
- Risk Level: `<低 / 中 / 高>`
- Human Confirmation Required: `<是 / 否；若是，说明触发点>`

## Memory

- Memory: `<no durable context change / 需更新文件 + ID / 待确认>`

## Evidence

- Validation commands: `<命令；无则写人工核对项>`
- Browser / API / backend evidence: `<如需填写；无则写 N/A>`
- Unverified items and risks: `<未验证项及原因；无则写 N/A>`

## Loop Packet（仅显式 loop 任务填写）

- Loop Type: `<Task Intake / Implementation / Review / Triage>`
- Stop Condition: `<可验证停止条件>`
- Verification Command: `<本任务项必跑命令；无则说明人工核对项>`
- State Sink: `<PROJECT_STATE.md / TECH_DEBT.md / KNOWN_BUGS.md / DECISIONS.md / ARCHITECTURE.md>`
- Escalation Condition: `<命中即暂停的条件>`
- Not used: `未启用 loop 时填写：Not used（普通任务，按 Dynamic Workflow 交付）`

## Required Reading

- `AGENTS.md`
- `docs/rules/TASK_INTAKE.md`
- `docs/rules/DYNAMIC_WORKFLOW_RULES.md`
- `docs/rules/LOOP_ENGINEERING_RULES.md`（仅显式 loop 任务必读）
- `<按任务类型补充专项规范>`

## Stop Conditions

遇到以下情况必须暂停并请求人工确认：

- 权限模型、菜单鉴权、路由守卫策略不明确
- 接口响应模型、字段兼容策略或错误码协议不明确
- 后端 migration / seed / SQL 回滚策略不明确
- 业务规则、统计口径、数据源或验收标准不明确
- 不同实现会改变页面行为、接口联调方式或权限边界

## Verification

- Frontend: `<命令；无则写 N/A>`
- Backend: `<命令；无则写 N/A>`
- Browser: `<验证页面 / 视口 / 角色；无则写 N/A>`
- Unverified: `<未验证项及原因；无则写 N/A>`
```
