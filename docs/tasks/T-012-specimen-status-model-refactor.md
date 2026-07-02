# T-012 M2 标本状态与异常流转模型重构

## Goal

重构 M2 标本主状态与异常流转表达，补齐待接收、取消、撤回、返工等关键中间态或等价历史模型。

## Inputs

- 来源：`docs/reviews/full-process-remediation-plan-2026-07-01.html`
- 审计依据：当前 `SpecimenStatus` / `FixationStatus` 表达过粗

## Outputs

- 更新后的状态定义、状态历史或兼容映射策略
- 关键状态守卫、查询映射和展示规则
- 相关接口与页面的状态解释调整

## Constraints

- 需要兼顾历史数据、既有流程和迁移兼容性
- 不能只在前端补文字解释，必须让后端状态模型可表达真实流转
- 要明确撤回、取消、返工与异常的区别

## Acceptance Criteria

- 标本状态能表达关键中间态和异常流转
- 前后端对同一状态含义一致
- 状态迁移后 tracking、列表筛选和页面展示不出现语义冲突
