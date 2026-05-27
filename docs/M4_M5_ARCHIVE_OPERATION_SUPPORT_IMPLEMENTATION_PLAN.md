# M4 核查与 M5 归档运营支撑前端实施计划

## 1. 摘要

- 本文档记录 M4 医生诊断工作流当前完成情况，并规划 M5 归档管理、试剂台账、设备台账的前端页面、接口、路由、菜单映射与测试任务。
- M4 当前已在前端形成 `doctor-workflow` 模块，覆盖医生端核心诊断、报告、修订与会诊链路。
- M5 前端计划新增 `operation-support` 模块，先覆盖后端已落地的 `归档管理 / 试剂台账 / 设备台账` 三类菜单。
- 本轮文档不改全局 Axios、权限模型、路由守卫、构建配置、发布脚本或主题变量。
- 统计分析、历史报告、集成任务、收费管理已在后端归入 `MENU_M6_SUPPORT`，不混入本次 M5 范围。

## 2. M4 完成情况核查

### 2.1 前端页面与路由

M4 前端模块目录为 `apps/web-ele/src/modules/doctor-workflow`，当前已覆盖以下页面：

| 页面 | 路由 | 主要能力 | 当前结论 |
| --- | --- | --- | --- |
| 医生流程入口 | `/doctor-workflow/entry` | 按权限跳转到可访问的医生工作流页面 | 已实现 |
| 诊断分配 | `/doctor-workflow/assignment` | 待诊断任务查询、分派医生 | 已实现 |
| 诊断工作台 | `/doctor-workflow/workbench` | 病例诊断上下文、标本/蜡块/玻片、修订/会诊/医嘱摘要 | 已实现 |
| 病理报告 | `/doctor-workflow/report` | 报告创建、保存草稿、提交、审核、签发、发布 | 已实现 |
| 报告追踪 | `/doctor-workflow/tracking` | 诊断任务链、报告版本链、事件链、修订链、会诊链、医嘱链 | 已实现 |
| 报告修订 | `/doctor-workflow/revision` | 修订申请、审批、驳回 | 已实现 |
| 会诊管理 | `/doctor-workflow/consultation` | 创建会诊、会诊意见、完成会诊 | 已实现 |

路由文件 `apps/web-ele/src/router/routes/modules/doctor-workflow.ts` 已注册根路由 `/doctor-workflow`，并为子路由绑定 M4 权限码。

### 2.2 接口与服务层

M4 服务层位于 `apps/web-ele/src/modules/doctor-workflow/api/doctor-workflow-service.ts`，已对接以下后端能力：

| 能力 | 前端服务函数 | 前端路径 | 后端控制器路径 | 当前结论 |
| --- | --- | --- | --- | --- |
| 待诊断任务 | `listPendingDiagnosticTasks` | `GET /v1/diagnostic-tasks/pending` | `/api/v1/diagnostic-tasks/pending` | 已对接 |
| 诊断任务分派 | `assignDiagnosticTask` | `POST /v1/diagnostic-tasks/{id}/assign` | `/api/v1/diagnostic-tasks/{id}/assign` | 已对接 |
| 诊断任务接单 | `acceptDiagnosticTask` | `POST /v1/diagnostic-tasks/{id}/accept` | `/api/v1/diagnostic-tasks/{id}/accept` | 已对接 |
| 诊断任务开始 | `startDiagnosticTask` | `POST /v1/diagnostic-tasks/{id}/start` | `/api/v1/diagnostic-tasks/{id}/start` | 已对接 |
| 诊断工作台 | `getDiagnosticWorkbench` | `GET /v1/pathology-cases/{id}/diagnostic-workbench` | `/api/v1/pathology-cases/{id}/diagnostic-workbench` | 已对接 |
| 报告追踪 | `getReportTracking` | `GET /v1/pathology-cases/{id}/report-tracking` | `/api/v1/pathology-cases/{id}/report-tracking` | 已对接 |
| 报告生命周期 | `createPathologyReport` 等 | `POST /v1/pathology-reports*` | `/api/v1/pathology-reports*` | 已对接 |
| 报告修订 | `createReportRevisionRequest` 等 | `POST /v1/report-revision-requests*` | `/api/v1/report-revision-requests*` | 已对接 |
| 会诊管理 | `createConsultation` 等 | `POST /v1/consultations*` | `/api/v1/consultations*` | 已对接 |

服务层已对 `PendingDiagnosticTaskPage`、`DiagnosticWorkbenchView`、`ReportTrackingView` 做缺省数组与可空字段归一化，避免后端字段缺省导致页面异常。

### 2.3 已有测试与菜单映射

- `apps/web-ele/src/modules/doctor-workflow/api/doctor-workflow-service.test.ts` 已覆盖 mapper 与接口路径。
- `apps/web-ele/src/router/routes/modules/doctor-workflow.test.ts` 已覆盖 M4 路由、路径与权限。
- `apps/web-ele/src/api/core/menu.test.ts` 已包含 M4 菜单映射断言。
- `apps/web-ele/src/api/core/menu-mapper.ts` 已包含 `M4_WORKFLOW / M4_ASSIGN / M4_WORKBENCH / M4_REPORT / M4_TRACKING / M4_REVISION / M4_CONSULTATION` 映射。

### 2.4 M4 历史缺口复盘

- 后端已具备 M4 医嘱执行能力，包括 `/api/v1/medical-orders`、`/api/v1/medical-orders/pending`、`/api/v1/medical-orders/{id}/accept`、`/api/v1/medical-orders/{id}/complete`、`/api/v1/medical-orders/{id}/cancel`。
- 后端菜单已存在 `M4_MEDICAL_ORDER`，权限码包括 `PERM_M4_MEDICAL_ORDER_CREATE`、`PERM_M4_MEDICAL_ORDER_CANCEL`、`PERM_M4_MEDICAL_ORDER_QUERY`、`PERM_M4_MEDICAL_ORDER_ACCEPT`、`PERM_M4_MEDICAL_ORDER_COMPLETE`。
- 当前前端已补齐独立医嘱执行页面、权限常量、service 与入口跳转，诊断工作台和报告追踪页也已与医嘱状态联动。
- 本节保留为历史核查说明：M4 医嘱执行缺口已关闭，不再作为独立待补事项。

## 3. M5 范围确认

### 3.1 前端模块与路由

M5 前端新增模块：

```text
apps/web-ele/src/modules/operation-support/
├── api/
├── components/
├── types/
├── utils/
└── views/
```

路由根路径为 `/operation-support`，建议新增：

| 页面 | 路由 | 后端菜单代码 | 页面职责 |
| --- | --- | --- | --- |
| 运营支撑入口 | `/operation-support/entry` | `M5_SUPPORT` | 按权限跳转到归档、试剂或设备页面 |
| 归档管理 | `/operation-support/archive` | `M5_ARCHIVE` | 归档柜、库位、申请单归档、蜡块/玻片归档、借阅归还 |
| 试剂台账 | `/operation-support/reagents` | `M5_REAGENT` | 试剂维护、库存批次、低库存与近效期预警 |
| 设备台账 | `/operation-support/equipment` | `M5_EQUIPMENT` | 设备档案、维修保养记录、到期与逾期预警 |

### 3.2 本轮不做

- 不建设 M6 的统计分析、历史报告、集成任务、收费管理页面。
- 不修改全局请求封装、鉴权流程、权限守卫、菜单权限模型或环境变量读取逻辑。
- 不接入真实高拍仪、扫码枪、打印机、设备 SDK，只按后端已有字段完成前端页面和接口对接。
- 不新增前端全局状态；页面查询、表单、弹窗临时态优先留在页面或模块内组合式函数。

## 4. M5 页面与功能规划

### 4.1 归档管理

归档管理页面使用多区块工作台形态，建议包含：

- 归档柜维护：查询、创建、更新归档柜，展示柜编码、名称、类型、层数、每层位数、状态、位置说明。
- 可用库位：按归档柜类型或归档柜 ID 查询可用库位，用于归档动作前选择位置。
- 归档操作：支持申请单、包埋盒、玻片三类对象归档。
- 归档记录查询：按关键字、对象类型、病例 ID 查询归档记录，展示对象编号、归档位置、状态、归档人、归档时间。
- 材料借阅：查询待归还借阅记录，支持创建借阅和归还。

归档页面需明确处理以下状态：

- 归档柜无可用库位时显示空态。
- 归档对象重复占位时展示后端冲突提示。
- 已借出材料重复借阅、已归还借阅再次归还时展示业务冲突提示。
- 申请单归档涉及图片 URL 和文件名字段，真实拍照能力后续接入。

### 4.2 试剂台账

试剂台账页面建议包含：

- 试剂主数据维护：按关键字和启停状态查询，支持创建、更新试剂。
- 库存批次维护：按关键字和库存状态查询，支持创建、更新库存批次。
- 预警列表：展示低库存、近效期预警，支持刷新。

页面重点字段：

- 试剂：`reagentCode`、`reagentName`、`specification`、`unit`、`manufacturer`、`defaultLowStockThreshold`、`defaultNearExpiryDays`、`enabled`。
- 库存：`reagentId`、`batchNo`、`stockQuantity`、`stockStatus`、`expiryDate`、`storageLocation`、`nearExpiryDays`。

### 4.3 设备台账

设备台账页面建议包含：

- 设备档案维护：按关键字和设备状态查询，支持创建、更新设备。
- 维修保养记录：按设备查询维护日志，支持新增维护日志并回写下次保养时间。
- 设备预警：展示即将到期和已逾期维护设备，支持刷新。

页面重点字段：

- 设备：`equipmentCode`、`equipmentName`、`equipmentCategory`、`modelNo`、`equipmentStatus`、`locationDescription`、`enabledAt`、`nextMaintenanceAt`。
- 维护记录：`maintenanceType`、`maintenanceStatus`、`performedAt`、`nextMaintenanceAt`、`description`。

## 5. 权限、菜单与接口矩阵

### 5.1 权限码常量

建议新增 `M5_PERMISSION_CODES`：

- `ARCHIVE_CABINET_QUERY`
- `ARCHIVE_CABINET_CREATE`
- `ARCHIVE_CABINET_UPDATE`
- `APPLICATION_FORM_ARCHIVE`
- `EMBEDDING_BOX_ARCHIVE`
- `SLIDE_ARCHIVE`
- `ARCHIVE_QUERY`
- `LOAN_CREATE`
- `LOAN_RETURN`
- `LOAN_QUERY`
- `REAGENT_QUERY`
- `REAGENT_CREATE`
- `REAGENT_UPDATE`
- `REAGENT_STOCK_QUERY`
- `REAGENT_STOCK_UPDATE`
- `REAGENT_WARNING_QUERY`
- `EQUIPMENT_QUERY`
- `EQUIPMENT_CREATE`
- `EQUIPMENT_UPDATE`
- `EQUIPMENT_MAINTENANCE_CREATE`
- `EQUIPMENT_WARNING_QUERY`

常量值必须与后端 `PERM_M5_*` 保持一致。

### 5.2 菜单映射

`apps/web-ele/src/api/core/menu-mapper.ts` 需要补齐 M5 映射：

| 后端菜单代码 | 后端组件名 | 后端当前路径 | 前端规范路由 |
| --- | --- | --- | --- |
| `M5_SUPPORT` | `OperationSupportRoot` | `/operation-support` | `/operation-support` |
| `M5_ARCHIVE` | `ArchiveManagement` | `/api/v1/archive-records/search` | `/operation-support/archive` |
| `M5_REAGENT` | `ReagentLedger` | `/api/v1/reagents` | `/operation-support/reagents` |
| `M5_EQUIPMENT` | `EquipmentLedger` | `/api/v1/equipment-records` | `/operation-support/equipment` |

映射需兼容 `menuCode`、`componentName` 和 `pathAliases` 三类线索，避免 API 地址直接作为前端菜单路径渲染。

### 5.3 归档接口

统一通过 `requestClient` 使用 `/v1` 路径：

| 能力 | 方法 | 路径 |
| --- | --- | --- |
| 查询归档柜 | `GET` | `/v1/archive-cabinets` |
| 创建归档柜 | `POST` | `/v1/archive-cabinets` |
| 更新归档柜 | `PATCH` | `/v1/archive-cabinets/{id}` |
| 查询可用库位 | `GET` | `/v1/archive-positions/available` |
| 申请单归档 | `POST` | `/v1/archive/application-forms` |
| 包埋盒归档 | `POST` | `/v1/archive/embedding-boxes` |
| 玻片归档 | `POST` | `/v1/archive/slides` |
| 查询归档记录 | `GET` | `/v1/archive-records/search` |
| 查询待归还借阅 | `GET` | `/v1/material-loans/pending` |
| 创建材料借阅 | `POST` | `/v1/material-loans` |
| 归还材料 | `POST` | `/v1/material-loans/{id}/return` |

### 5.4 试剂接口

| 能力 | 方法 | 路径 |
| --- | --- | --- |
| 查询试剂 | `GET` | `/v1/reagents` |
| 创建试剂 | `POST` | `/v1/reagents` |
| 更新试剂 | `PATCH` | `/v1/reagents/{id}` |
| 查询库存批次 | `GET` | `/v1/reagent-stocks` |
| 创建库存批次 | `POST` | `/v1/reagent-stocks` |
| 更新库存批次 | `PATCH` | `/v1/reagent-stocks/{id}` |
| 查询库存预警 | `GET` | `/v1/reagent-stocks/warnings` |

### 5.5 设备接口

| 能力 | 方法 | 路径 |
| --- | --- | --- |
| 查询设备档案 | `GET` | `/v1/equipment-records` |
| 创建设备档案 | `POST` | `/v1/equipment-records` |
| 更新设备档案 | `PATCH` | `/v1/equipment-records/{id}` |
| 查询维修保养记录 | `GET` | `/v1/equipment-records/{id}/maintenance-logs` |
| 新增维修保养记录 | `POST` | `/v1/equipment-records/{id}/maintenance-logs` |
| 查询设备预警 | `GET` | `/v1/equipment-records/warnings` |

## 6. 实施任务拆分

### 6.1 模块骨架

- 新增 `apps/web-ele/src/modules/operation-support/constants.ts`，收敛 M5 权限码、路由项、状态选项。
- 新增 `types/operation-support.ts`，分层定义请求、响应 DTO 与页面 ViewModel。
- 新增 `api/operation-support-service.ts`，集中 M5 接口调用与 mapper。
- 新增 `components/OperationSectionCard.vue` 或复用既有模块内卡片模式，避免提升到共享层。

### 6.2 路由与入口

- 新增 `apps/web-ele/src/router/routes/modules/operation-support.ts`。
- 根路由 `/operation-support` 聚合 M5 权限，并重定向到 `/operation-support/entry`。
- 入口页根据 `M5_OPERATION_ROUTE_ITEMS` 匹配首个可访问页面。
- 子页面分别绑定归档、试剂、设备对应查询权限。

### 6.3 页面实现

- `OperationSupportEntryView.vue`：按权限跳转，无权限显示 `403`。
- `ArchiveManagementView.vue`：完成归档柜、库位、归档记录、归档动作、借阅归还工作区。
- `ReagentLedgerView.vue`：完成试剂列表、试剂表单、库存列表、库存表单、预警列表。
- `EquipmentLedgerView.vue`：完成设备列表、设备表单、维护日志、预警列表。

### 6.4 菜单映射与测试

- 在 `menu-mapper.ts` 增加 M5 静态 fallback 菜单和映射规则。
- 在 `menu.test.ts` 增加后端 M5 菜单可映射到 `/operation-support/*` 的断言。
- 增加 `operation-support-service.test.ts` 覆盖接口路径、请求体、缺省数组归一化。
- 增加 `operation-support.test.ts` 覆盖路由路径、权限与入口跳转。

## 7. 验证计划

### 7.1 前端单元验证

建议实现完成后执行：

```bash
pnpm.cmd exec vitest run apps/web-ele/src/modules/operation-support/api/operation-support-service.test.ts apps/web-ele/src/router/routes/modules/operation-support.test.ts apps/web-ele/src/api/core/menu.test.ts
```

### 7.2 类型检查

```bash
pnpm.cmd -F @vben/web-ele run typecheck
```

### 7.3 联调 Happy Path

1. 创建归档柜并查询可用库位。
2. 对申请单、包埋盒、玻片执行归档。
3. 查询归档记录并确认归档位置回显。
4. 创建材料借阅，确认医生工作台或报告追踪中的借阅状态变化。
5. 归还材料，确认状态恢复为在库。
6. 创建试剂和库存批次，确认低库存和近效期预警。
7. 创建设备，新增维护日志，确认下次维护时间和预警状态变化。

### 7.4 异常场景

- 归档库位被占用时返回冲突提示。
- 同一材料重复借阅时返回冲突提示。
- 已归还借阅再次归还时返回业务不可操作提示。
- 试剂库存数量为空、负数或失效日期缺省时前端拦截。
- 设备维护时间格式不合法或下次维护时间早于执行时间时前端拦截或提示。

## 8. 风险与边界

- M5 会新增业务路由、菜单映射和模块服务层，但不改变全局路由守卫与权限模型。
- 后端 M5 菜单当前仍有 API 路径，需要前端映射为规范页面路由，否则菜单会跳到接口地址。
- 归档拍照、高拍仪、扫码枪、打印能力未纳入本轮真实设备接入，需要后续兼容性专项验证。
- M4 医嘱执行缺口已在当前代码中关闭，后续只保留目标环境联调与角色菜单验收。
- M6 统计、历史数据、集成、收费前台已补齐，后续重点转为外围系统联调与现场验收。

## 9. 移交摘要

- 已完成: M4 完成情况核查、M5 范围确认、页面规划、接口矩阵、权限菜单规划、测试与联调方案。
- 进行中: 治理文档与现场验收清单同步更新。
- 待处理: 目标环境验收，包括真实拍照/扫码/设备能力、角色菜单配置、外部收费回执与历史导入数据源核验。
- 关键决策: M5 仅覆盖归档管理、试剂台账、设备台账；M6 能力不混入本轮。
- 已知风险: 后端菜单路径为 API 地址，需要前端映射；真实拍照、扫码、设备能力仍需目标环境验证。
- 建议下一步: 执行角色可达性与现场验收清单，重点核对外部收费回执、历史导入真实数据源、CSV 编码 / 文件名与角色菜单可见性。
