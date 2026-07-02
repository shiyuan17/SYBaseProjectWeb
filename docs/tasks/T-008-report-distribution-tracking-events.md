# T-008 正式报告分发事件接入 tracking

## Goal

为正式报告打印、发放、计划发放、回收补齐标准流程事件，并接入统一 tracking。

## Inputs

- 来源：`docs/reviews/full-process-remediation-plan-2026-07-01.html`
- 目标动作：print / issue / scheduled issue / recall

## Outputs

- 报告分发动作的 workflow event 写入
- tracking 对分发时间线的读取和展示支持
- 与 `report_versions` 分发字段协同的规则

## Constraints

- 不替换现有 `report_versions` 字段，而是在其之上补统一事件
- 需要区分“报告内容生命周期”和“报告交付生命周期”
- 批量动作需要保留逐项成功/失败语义

## Acceptance Criteria

- 正式报告 print / issue / scheduled issue / recall 可在 tracking 中查看
- tracking 能清晰区分报告主状态与分发状态
- 批量动作不会因为部分失败而丢失成功项的追踪记录

