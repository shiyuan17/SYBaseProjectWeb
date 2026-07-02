# T-009 敏感接口统一权限与审计治理

## Goal

统一 `OperatorVerificationController`、`MyNotificationController` 等敏感接口的认证、授权与审计策略。

## Inputs

- 来源：`docs/reviews/full-process-remediation-plan-2026-07-01.html`
- 依赖任务：`T-006`
- 目标控制器：操作人核验、个人通知与偏好相关接口

## Outputs

- 对“仅认证 + 本人隔离”与“必须权限码”的统一规则
- 对应控制器注解或主动审计接入调整
- 相关文档或规范说明

## Constraints

- 不允许继续依赖“默认行为不明确”的隐式安全策略
- 必须让这类接口进入可解释的统一审计口径
- 不能因为收敛治理而放松现有登录态要求

## Acceptance Criteria

- 目标控制器都具有明确的认证/授权/审计归属
- 关键敏感动作和敏感查询能够被统一审计记录
- 审计口径可以说明“为什么该接口不使用 / 使用 `@RequirePermission`”
