# T-002 冰冻流程后端真实闭环

Execution Mode: orchestrator

Run Policy: single-child

## Goal

通过一组 5 分钟可验证的子任务，补齐冰冻流程的真实后端闭环，替代当前前端 mock 所依赖的占位服务。

## Inputs

- 来源：`docs/reviews/full-process-remediation-plan-2026-07-01.html`
- 审计依据：`docs/reviews/full-process-audit-2026-07-01.html`
- 现有资产：`frozen_flag`、病理号规则 `FROZEN`、`diagnostic_tasks.task_type=FROZEN`、`pathology_reports.frozen_diagnosis_result`
- 依赖前置：同级后端仓库 `../SYBaseProject/bl-center` 的真实实现与字段契约

## Outputs

- 冰冻流程后端真实闭环的可执行子任务集合
- 每个子任务的验证、回滚和交接边界
- 汇总后的接口清单、状态流转矩阵、权限与审计清单、实施切片顺序

## Constraints

- 父任务只允许编排子任务，不得直接实现运行时代码。
- 优先复用现有病例、标本、诊断任务、报告表与统计口径，不单独再造平行领域。
- 不保留 mock 作为生产 fallback。
- 必须同步考虑 tracking、审计日志和非法跳转拦截。

## Acceptance Criteria

- 所有必须的子任务都被拆成可验证、可回滚、5 分钟内可判定的 Goal 单元。
- 子任务顺序能支撑 `T-003` 前端接入真实接口，不再依赖平铺大任务直接进入 loop。
- 父任务完成校验能明确说明后端契约、状态校验、事件追踪和权限边界是否都已准备就绪。

## Parent Completion Check

- `task.json` 中不再存在 `ready` 或 `in_progress` 的必需子任务。
- 后端接口清单、状态流转矩阵、权限与审计清单、实施切片顺序都有对应子任务 Evidence。
- 父任务交接中已记录跨仓证据、剩余风险和 `T-003` 的接线前提。
