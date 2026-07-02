# T-005 技术医嘱工作站前端动作接线

## Goal

将特检、IHC、细胞学、液基细胞学工作站接入真实查询与动作链，移除“功能待接入”占位行为。

## Inputs

- 来源：`docs/reviews/full-process-remediation-plan-2026-07-01.html`
- 依赖任务：`T-004`、`T-006`
- 现有组件：`TechnicalWorkbenchPage.vue`

## Outputs

- 四类工作站的 `query-action` / `toolbar-action` 处理器
- 权限感知的按钮可用性和动作反馈
- 对应前端测试更新

## Constraints

- 前端行为要匹配后端状态和权限规则
- 不允许保留点击后只提示“功能待接入”的关键动作
- 需要统一成功刷新、失败提示和选择态管理

## Acceptance Criteria

- 四类工作站关键动作都能执行真实调用
- 工作站不再触发默认占位提示
- 前端测试覆盖查询、执行、无权限和失败回退场景
