# T-007 申请单统一流程事件接入 tracking

## Goal

让申请单 create / update / void 进入统一流程追踪链，消除当前主对象生命周期断链问题。

## Inputs

- 来源：`docs/reviews/full-process-remediation-plan-2026-07-01.html`
- 目标范围：申请单创建、编辑、作废

## Outputs

- 申请单主对象的标准 workflow event 写入
- tracking 查询与展示对申请单事件的支持
- 相关测试或联调验证

## Constraints

- 优先复用现有 `workflow_events` 主线
- 事件命名、对象标识、时间线顺序要与现有 tracking 风格一致
- 不能只记观察指标，必须进入业务可追踪链

## Acceptance Criteria

- 申请单 create / update / void 可在统一 tracking 中回放
- tracking 中申请单事件能和后续标本、技术、报告节点串起来
- 事件写入失败不会 silently 丢失而无人感知
