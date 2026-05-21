# M3 技术组核心生产线界面与对接实施方案

## 1. 背景与边界

### 1.1 目标

- 本文档用于指导 `M3` 技术组核心生产线的前端界面建设、后端接口对接、路由权限配置、菜单映射与联调验收。
- 当前前端实现范围只覆盖后端已落地的核心链路：`任务池 / 取材 / 脱水 / 包埋 / 切片 / 染色 / 返工 / 技术追踪`。
- 本轮不重复建设“登记接收工作站”，继续复用 `M2` 标本接收作为 M3 的上游前置。

### 1.2 前后端基线

- 前端模块目录：`apps/web-ele/src/modules/technical-workflow`
- 路由根路径：`/technical-workflow`
- 菜单映射文件：`apps/web-ele/src/api/core/menu-mapper.ts`
- 后端 M3 能力基线来源：
  - `D:\Github\JW\SYBaseProject\README.md`
  - `D:\Github\JW\SYBaseProject\bl-center\src\test\java\com\company\bl\interfaces\TechnicalWorkflowIntegrationTest.java`
  - `D:\Github\JW\SYBaseProject\bl-center\src\test\java\com\company\bl\interfaces\TechnicalWorkflowQueryEnhancementIntegrationTest.java`
  - `D:\Github\JW\SYBaseProject\bl-center\src\main\resources\db\migration\V7__seed_m3_workflow_authorization.sql`

### 1.3 本轮明确不做

- 不修改全局 Axios 实例、统一响应协议、认证流程、权限守卫或环境变量方案。
- 不接真实打印机、打号机、高拍仪、病理摄像机等设备，只保留字段与反馈占位。
- 不扩写后端尚未落地的接口与页面契约。
- 不将细胞学、液基细胞学、免疫组化、常规医嘱、特检医嘱纳入本轮界面实现。

## 2. 页面与路由设计

### 2.1 路由结构

- 根路由：`/technical-workflow`
- 入口页：`/technical-workflow/entry`
- 任务池：`/technical-workflow/tasks`
- 取材描写：`/technical-workflow/grossing`
- 脱水工作站：`/technical-workflow/dehydration`
- 包埋工作站：`/technical-workflow/embedding`
- 切片工作站：`/technical-workflow/slicing`
- 染色出片：`/technical-workflow/staining`
- 返工工作站：`/technical-workflow/rework`
- 技术追踪：`/technical-workflow/tracking`

### 2.2 入口策略

- `entry` 页复用 M2 入口模式。
- 根据 `accessCodes` 在 `M3_WORKFLOW_ROUTE_ITEMS` 中匹配第一个可访问路径并自动跳转。
- 当前账号不具备任一 M3 权限时显示 `403`。

### 2.3 页面职责

#### 任务池

- 展示当前账号可见的全部技术待办。
- 支持按 `taskType / taskStatus / applicationNo / pathologyNo / objectType / createdFrom / createdTo / timedOutOnly` 查询。
- 每行支持“进入工作站”和“查看追踪”。

#### 取材描写

- 支持从待办任务承接取材。
- 支持加载病例技术追踪摘要。
- 支持录入多标本、多蜡块与附件占位。
- 完成后显示生成的脱水任务数量。

#### 脱水工作站

- 采用“三段式”：待脱水任务列表、脱水批次创建、批次开始/完成。
- 支持通过蜡块任务带入批次创建表单。
- 批次完成支持附件回传占位。

#### 包埋工作站

- 支持待包埋任务承接。
- 重点录入 `samplingBlockId / embeddingBoxNo / blockCount / sliceNotice / evaluationLevel / samplingEvaluation / deviceCode`。
- 展示打号成功与失败反馈。

#### 切片工作站

- 支持待切片任务承接。
- 重点录入 `embeddingBoxId / slideCount / sliceCountPerSlide / sliceThickness / qualityIssue / deviceCode`。
- 完成后返回生成玻片数量。

#### 染色出片

- 支持待染色任务承接。
- 重点录入 `slideId / stainingType / qualityIssue`。
- 完成后展示病例状态反馈。

#### 返工工作站

- 拆分“创建返工单”和“执行返工单”两个区块。
- 支持病例、标本、蜡块、包埋盒、玻片五种对象层级发起返工。
- 可通过病例追踪回看返工单和质控记录，并将返工单 ID 带入执行表单。

#### 技术追踪

- 仅按 `caseId` 查询。
- 固定展示八块数据：
  - 技术任务
  - 标本
  - 蜡块
  - 包埋盒
  - 玻片
  - 质控历史
  - 返工单
  - 事件轨迹

### 2.4 界面模式

- 所有页面统一采用 `Page + WorkflowSectionCard + 表单/表格` 模式。
- 延续 M2 的桌面工作台交互风格，不额外引入新的全局布局层。

## 3. 接口与数据模型

### 3.1 权限码

- `PERM_M3_TECH_TASK_QUERY`
- `PERM_M3_GROSSING`
- `PERM_M3_DEHYDRATION`
- `PERM_M3_EMBEDDING`
- `PERM_M3_SLICING`
- `PERM_M3_STAINING`
- `PERM_M3_REWORK`
- `PERM_M3_TECH_TRACKING_QUERY`

### 3.2 前端常量

- `M3_PERMISSION_CODES`
- `M3_WORKFLOW_ROUTE_ITEMS`
- `TECHNICAL_TASK_TYPE_OPTIONS`
- `TECHNICAL_TASK_STATUS_OPTIONS`
- `TECHNICAL_OBJECT_TYPE_OPTIONS`
- `REWORK_TYPE_OPTIONS`
- `QC_TYPE_OPTIONS`
- `EVALUATION_LEVEL_OPTIONS`
- `TASK_TYPE_ROUTE_MAP`

### 3.3 核心类型分层

- `PendingTechnicalTaskQuery`
- `PendingTechnicalTaskItem`
- `PendingTechnicalTaskPage`
- `TechnicalTrackingView`
- `TechnicalTrackingSpecimenSummary`
- `TechnicalTrackingBlockSummary`
- `TechnicalTrackingEmbeddingBoxSummary`
- `TechnicalTrackingSlideSummary`
- `TechnicalTrackingQcEvaluationSummary`
- `TechnicalTrackingReworkSummary`
- `TechnicalTrackingEventSummary`
- `TechnicalTaskStartRequest`
- `GrossingCompleteRequest`
- `CreateDehydrationBatchRequest`
- `CompleteDehydrationBatchRequest`
- `EmbeddingCompleteRequest`
- `SlicingCompleteRequest`
- `SlideStainingCompleteRequest`
- `CreateReworkOrderRequest`
- `ExecuteReworkOrderRequest`

### 3.4 服务函数

统一通过 `requestClient` 调用并接收已解包的 `data`：

- `listPendingTechnicalTasks`
- `getTechnicalTracking`
- `startGrossing`
- `completeGrossing`
- `createDehydrationBatch`
- `startDehydrationBatch`
- `completeDehydrationBatch`
- `startEmbedding`
- `completeEmbedding`
- `startSlicing`
- `completeSlicing`
- `startSlideStaining`
- `completeSlideStaining`
- `createReworkOrder`
- `executeReworkOrder`

### 3.5 已对齐的后端接口

| 前端服务函数 | 方法 | 路径 |
| --- | --- | --- |
| `listPendingTechnicalTasks` | `GET` | `/v1/technical-tasks/pending` |
| `getTechnicalTracking` | `GET` | `/v1/pathology-cases/{id}/technical-tracking` |
| `startGrossing` | `POST` | `/v1/grossings/start` |
| `completeGrossing` | `POST` | `/v1/grossings/complete` |
| `createDehydrationBatch` | `POST` | `/v1/dehydration-batches` |
| `startDehydrationBatch` | `POST` | `/v1/dehydration-batches/{id}/start` |
| `completeDehydrationBatch` | `POST` | `/v1/dehydration-batches/{id}/complete` |
| `startEmbedding` | `POST` | `/v1/embeddings/start` |
| `completeEmbedding` | `POST` | `/v1/embeddings/complete` |
| `startSlicing` | `POST` | `/v1/slicings/start` |
| `completeSlicing` | `POST` | `/v1/slicings/complete` |
| `startSlideStaining` | `POST` | `/v1/slide-stainings/start` |
| `completeSlideStaining` | `POST` | `/v1/slide-stainings/complete` |
| `createReworkOrder` | `POST` | `/v1/rework-orders` |
| `executeReworkOrder` | `POST` | `/v1/rework-orders/{id}/execute` |

### 3.6 深链参数

各工作站统一接受以下可选预填参数：

- `taskId`
- `caseId`
- `pathologyNo`
- `objectId`
- `objectType`

## 4. 权限与菜单映射

### 4.1 路由权限绑定

- 任务池：`PERM_M3_TECH_TASK_QUERY`
- 取材描写：`PERM_M3_GROSSING`
- 脱水工作站：`PERM_M3_DEHYDRATION`
- 包埋工作站：`PERM_M3_EMBEDDING`
- 切片工作站：`PERM_M3_SLICING`
- 染色出片：`PERM_M3_STAINING`
- 返工工作站：`PERM_M3_REWORK`
- 技术追踪：`PERM_M3_TECH_TRACKING_QUERY`

### 4.2 静态回退菜单

在 `menu-mapper.ts` 中补齐 M3 静态 fallback 菜单树：

- `TechnicalWorkflowRoot`
- `TechnicalTasks`
- `GrossingWorkstation`
- `DehydrationWorkstation`
- `EmbeddingWorkstation`
- `SlicingWorkstation`
- `StainingWorkstation`
- `ReworkWorkstation`
- `TechnicalTracking`

### 4.3 后端菜单定义映射

需要将以下后端菜单代码、组件名与接口路径映射到前端规范路由：

| 后端菜单代码 | 后端组件名 | 前端规范路由 |
| --- | --- | --- |
| `M3_WORKFLOW` | `TechnicalWorkflowRoot` | `/technical-workflow` |
| `M3_TASKS` | `TechnicalTasks` | `/technical-workflow/tasks` |
| `M3_GROSSING` | `Grossing` | `/technical-workflow/grossing` |
| `M3_DEHYDRATION` | `Dehydration` | `/technical-workflow/dehydration` |
| `M3_EMBEDDING` | `Embedding` | `/technical-workflow/embedding` |
| `M3_SLICING` | `Slicing` | `/technical-workflow/slicing` |
| `M3_STAINING` | `Staining` | `/technical-workflow/staining` |
| `M3_REWORK` | `Rework` | `/technical-workflow/rework` |
| `M3_TRACKING` | `TechnicalTracking` | `/technical-workflow/tracking` |

### 4.4 设计原则

- 菜单映射必须优先指向前端工作站页面，不直接显示 `/api/v1/*` 接口地址。
- 兼容三种映射线索：`menuCode`、`componentName`、`pathAliases`。

## 5. 联调与测试方案

### 5.1 已落地的前端测试

- `apps/web-ele/src/modules/technical-workflow/api/technical-workflow-service.test.ts`
- `apps/web-ele/src/router/routes/modules/technical-workflow.test.ts`
- `apps/web-ele/src/api/core/menu.test.ts`

### 5.2 验证目标

#### 路由与权限

- 每个 M3 页面都带有正确的 `meta.authority`
- 入口页可按权限自动跳转
- 无权限时显示 `403`

#### 菜单映射

- 后端 M3 菜单定义可映射到 `/technical-workflow/*`
- 后端 API 路径不再被当作前端菜单路径直接渲染

#### 服务层

- 所有 M3 接口路径与请求体已覆盖
- 统一响应解包可正常工作
- `PendingTechnicalTaskPage` 和 `TechnicalTrackingView` 的数组缺省值已归一化

#### Happy Path

前后端联调建议按如下顺序执行：

1. `任务池` 查询取材任务
2. `取材描写` 开始并完成任务
3. `脱水工作站` 创建、开始、完成批次
4. `包埋工作站` 开始并完成包埋
5. `切片工作站` 开始并完成切片
6. `染色出片` 开始并完成染色
7. `技术追踪` 校验病例状态、蜡块、包埋盒、玻片和事件轨迹

#### 关键异常

- 超时任务筛选
- 无权限访问任务池或追踪页
- 返工单创建与执行
- 质控历史展示
- 设备失败反馈展示，例如包埋打号失败、切片设备编码失败占位

### 5.3 当前验证命令

已执行并通过：

```bash
pnpm.cmd exec vitest run apps/web-ele/src/modules/technical-workflow/api/technical-workflow-service.test.ts apps/web-ele/src/router/routes/modules/technical-workflow.test.ts apps/web-ele/src/api/core/menu.test.ts
```

类型检查需通过：

```bash
pnpm.cmd -F @vben/web-ele run typecheck
```

## 6. 扩展蓝图附录

以下能力只保留后续扩展方向，不纳入本轮界面与接口实现：

### 6.1 细胞学 / 液基细胞学

- 独立任务入口
- 按送检类型自动生成蜡块和玻片规则
- 特殊脱落细胞场景的检索、打印和提醒

### 6.2 免疫组化 / 免疫细胞学

- 独立医嘱待办
- 蜡块归档位置回显
- 交接班与交接单打印

### 6.3 常规医嘱 / 特检医嘱

- 医嘱任务执行台
- 标签打印、终止原因、导出列表
- 从医生端回流到技术端的统一执行状态追踪

### 6.4 设备深度集成

- 包埋盒打号机
- 玻片打号机
- 高拍仪
- 病理摄像机
- 标签打印机

### 6.5 未来补充接口前提

- 以后端新增控制器、DTO、VO、权限码和菜单种子为准
- 未形成真实接口前，不在前端文档中提前固化字段契约
