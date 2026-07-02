# T-002 冰冻流程后端真实闭环

## Goal

补齐冰冻流程的真实后端闭环，提供会话列表、详情和关键动作接口，替代当前前端 mock。

## Inputs

- 来源：`docs/reviews/full-process-remediation-plan-2026-07-01.html`
- 审计依据：`docs/reviews/full-process-audit-2026-07-01.html`
- 现有资产：`frozen_flag`、病理号规则 `FROZEN`、`diagnostic_tasks.task_type=FROZEN`、`pathology_reports.frozen_diagnosis_result`

## Outputs

- 冰冻会话主线的 controller / service / repository / DTO / VO
- 真实接口：列表、详情、工作台、接收完成、取材完成、切片完成、初步结果保存、电话回报完成、报告确认、石蜡对照、剩余组织处理
- 对应 workflow event、权限与状态校验

## Constraints

- 优先复用现有病例、标本、诊断任务、报告表与统计口径，不单独再造平行领域
- 不保留 mock 作为生产 fallback
- 必须同步考虑 tracking、审计日志和非法跳转拦截

## Acceptance Criteria

- 冰冻工作台所需后端接口可用且返回稳定契约
- 冰冻关键动作存在后端状态校验，非法跳转返回业务错误
- 关键动作写入统一流程事件或等价可追踪记录
