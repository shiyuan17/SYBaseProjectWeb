# T-003 冰冻工作台前端接入真实接口

## Goal

将冰冻工作台从 mock 服务切换到真实后端接口，保持现有页面交互模型可用。

## Inputs

- 来源：`docs/reviews/full-process-remediation-plan-2026-07-01.html`
- 依赖任务：`T-002`
- 现有页面：`apps/web-ele/src/modules/technical-workflow/views/FrozenWorkstationView.vue`

## Outputs

- 基于 `requestClient` 的真实冰冻 API service
- 移除 `USE_FROZEN_WORKFLOW_MOCK = true` 依赖
- 冰冻工作台页面、错误反馈和测试更新

## Constraints

- 尽量复用现有 `FrozenSession` / `FrozenSessionDetail` 前端类型
- 不保留“真实接口不可用时自动回落 mock”的隐藏分支
- 页面交互反馈、加载态和错误提示需与现有体验保持一致

## Acceptance Criteria

- 冰冻工作台所有主动作走真实接口
- 页面不再出现 “Frozen workflow real API is not connected yet.”
- 相关前端测试更新后能覆盖真实接口路径和失败反馈

