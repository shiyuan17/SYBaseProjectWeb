# M1 核查与 M2 功能界面/接口对接文档计划

## 1. 摘要

- 本文档记录 M1 系统管理模块实现核查结论，并规划 M2 临床标本送检工作流的界面完善与接口对接。
- M1 当前已覆盖 10 个系统管理页面，已注册 `/system/*` 路由，并通过业务服务层对接后端 M1 接口。
- M2 当前保留 `apps/web-ele/src/modules/specimen-workflow` 模块结构，不重写页面，按最小改动补齐统一响应解包、第三方临床申请导入入口、页面校验与验证用例。
- 本轮不修改全局 Axios 拦截器、认证流程、权限模型、路由守卫、构建配置或发布脚本。

## 2. M1 实现现状

### 2.1 页面与路由覆盖

| 页面 | 路由 | 查询权限码 | 当前结论 |
| --- | --- | --- | --- |
| 系统用户 | `/system/users` | `PERM_SYS_USER_QUERY` | 已实现列表、创建、更新、启停、角色分配、登录日志、导入导出与登录标签打印入口 |
| 角色授权 | `/system/roles` | `PERM_SYS_ROLE_QUERY` | 已实现角色维护、菜单权限、接口权限、消息主题与统计分类授权 |
| 部位字典 | `/system/body-parts` | `PERM_SYS_BODY_PART_QUERY` | 已实现树形字典维护与启停 |
| 医嘱字典 | `/system/medical-order-dicts` | `PERM_SYS_ORDER_DICT_QUERY` | 已实现分类与项目维护 |
| 医嘱收费 | `/system/medical-order-charges` | `PERM_SYS_ORDER_CHARGE_QUERY` | 已实现分页、维护、启停、导入导出 |
| 医嘱套餐 | `/system/medical-order-packages` | `PERM_SYS_PACKAGE_QUERY` | 已实现套餐维护、启停与明细配置 |
| 描写模板 | `/system/sampling-templates` | `PERM_SYS_TEMPLATE_QUERY` | 已实现分类、模板维护与详情编辑 |
| 取材规范 | `/system/sampling-guidelines` | `PERM_SYS_GUIDELINE_QUERY` | 已实现分类、规范维护与详情编辑 |
| 系统配置 | `/system/configs` | `PERM_SYS_CONFIG_QUERY` | 已实现配置分类与配置项维护 |
| 编号规则 | `/system/numbering-rules` | `PERM_SYS_NUMBERING_QUERY` | 已实现编号规则查询与更新 |

### 2.2 接口与测试状态

- M1 前端服务层位于 `apps/web-ele/src/modules/system-management/api/system-management-service.ts`，已覆盖系统用户、角色授权、部位字典、医嘱字典、医嘱收费、医嘱套餐、描写模板、取材规范、系统配置、编号规则等接口。
- M1 路由位于 `apps/web-ele/src/router/routes/modules/system.ts`，根路由聚合 10 类查询权限，子路由按页面查询权限控制。
- 已验证 `system-management-service.test.ts`、`tree.test.ts` 等 M1 相关用例通过，并已纳入 M1/M2 完整回归命令。

### 2.3 仍需人工确认项

- 取材规范、描写模板的富文本能力是否满足真实业务编辑要求。
- 系统用户、医嘱收费等导入导出是否已经用真实模板和后端文件流完成联调。
- 登录标签、业务打印模板是否经过目标打印机与国产浏览器环境验证。
- 系统配置、编号规则的变更是否需要二次确认、审计记录或更细粒度权限。

## 3. M2 范围确认

M2 以临床标本送检模块为范围，覆盖以下业务页面与流程：

| 页面 | 路由 | 权限码 | 目标能力 |
| --- | --- | --- | --- |
| 工作流入口 | `/workflow/entry` | 工作流任一权限 | 展示 M2 功能入口与当前权限可达路径 |
| 临床登记 | `/workflow/clinical-register` | `PERM_SPECIMEN_REGISTER` | 创建申请单、第三方申请导入、申请单详情加载、标本登记、标签补打 |
| 固定核对 | `/workflow/fixation-verify` | `PERM_FIXATION_VERIFY` | 查询待固定标本、开始固定、完成固定 |
| 转运交接 | `/workflow/transport-handover` | `PERM_TRANSPORT_HANDOVER` | 创建转运单、打印转运单、交接确认 |
| 标本接收 | `/workflow/specimen-receipt` | `PERM_SPECIMEN_RECEIVE` | 待接收查询、转运单接收、条码直收、拒收/退回原因提示 |
| 追踪查询 | `/workflow/tracking-query` | `PERM_SPECIMEN_TRACKING_QUERY` | 按申请单或条码追踪节点事件 |

`PERM_CLINICAL_IMPORT` 作为临床申请导入按钮权限，仅控制临床登记页内的“第三方申请导入”入口，不单独注册菜单路由。

## 4. M2 接口矩阵

前端 baseURL 已包含 `/api`，业务服务继续使用 `/v1/...` 路径。后端统一响应由 `ApiResponseReturnValueHandler` 包裹为 `{ code, message, traceId, data }`，前端业务层应使用 `requestClient` 接收已解包的 `data`。

| 业务能力 | 前端服务函数 | 前端路径 | 后端控制器路径 | 对接状态 |
| --- | --- | --- | --- | --- |
| 创建申请单 | `createApplication` | `POST /v1/applications` | `/api/v1/applications` | 已对接，使用 `requestClient` |
| 申请单详情 | `getApplicationDetail` | `GET /v1/applications/{id}` | `/api/v1/applications/{id}` | 已对接，补齐缺省数组归一化 |
| 申请单追踪 | `getApplicationTracking` | `GET /v1/applications/{id}/tracking` | `/api/v1/applications/{id}/tracking` | 已对接 |
| 标本登记 | `registerSpecimens` | `POST /v1/specimens/register` | `/api/v1/specimens/register` | 已对接 |
| 标签补打 | `retryLabelPrint` | `POST /v1/specimens/label-batches/{batchNo}/retry` | `/api/v1/specimens/label-batches/{batchNo}/retry` | 已对接 |
| 条码追踪 | `getSpecimenTrackingByBarcode` | `GET /v1/specimens/barcodes/{barcode}/tracking` | `/api/v1/specimens/barcodes/{barcode}/tracking` | 已对接 |
| 待固定列表 | `listPendingFixations` | `GET /v1/specimen-fixations/pending` | `/api/v1/specimen-fixations/pending` | 已对接 |
| 开始固定 | `startFixation` | `POST /v1/specimen-fixations/start` | `/api/v1/specimen-fixations/start` | 已对接 |
| 完成固定 | `completeFixation` | `POST /v1/specimen-fixations/complete` | `/api/v1/specimen-fixations/complete` | 已对接 |
| 待转运列表 | `listPendingTransportOrders` | `GET /v1/transport-orders/pending` | `/api/v1/transport-orders/pending` | 已对接 |
| 创建转运单 | `createTransportOrder` | `POST /v1/transport-orders` | `/api/v1/transport-orders` | 已对接 |
| 打印转运单 | `printTransportOrder` | `POST /v1/transport-orders/{id}/print` | `/api/v1/transport-orders/{id}/print` | 已对接 |
| 转运交接 | `handoverTransportOrder` | `POST /v1/transport-orders/{id}/handover` | `/api/v1/transport-orders/{id}/handover` | 已对接 |
| 待接收列表 | `listPendingReceipts` | `GET /v1/specimen-receipts/pending` | `/api/v1/specimen-receipts/pending` | 已对接 |
| 转运单接收 | `receiveSpecimens` | `POST /v1/specimen-receipts` | `/api/v1/specimen-receipts` | 已对接 |
| 条码直收 | `directReceiveSpecimens` | `POST /v1/specimen-receipts/by-barcodes` | `/api/v1/specimen-receipts/by-barcodes` | 已对接，已补接收人前端必填提示 |
| 第三方申请导入 | `importClinicalApplication` | `POST /v1/clinical-applications/import` | `/api/v1/clinical-applications/import` | 本轮补齐 |

## 5. M2 当前差距与处理计划

### 5.1 已处理

- 将 `specimen-workflow-service.ts` 从 `bodyRequestClient` 调整为 `requestClient`，避免后端统一响应包裹与前端 DTO 不匹配。
- 新增 `ImportClinicalApplicationRequest` 类型与 `importClinicalApplication` 服务函数。
- 临床登记页新增“第三方申请导入”入口，输入 `thirdPartySource` 与 `externalOrderNo` 后调用导入接口，成功后自动切换申请单上下文并按权限加载详情。
- 申请单详情 mapper 对 `recentEvents`、`specimens` 缺省值统一归一化为 `[]`，降低后端字段缺省导致页面异常的风险。
- 标本接收页条码直收补齐接收人必填校验，避免无效请求直接打到服务端。

### 5.2 后续待处理

- 固定、转运、接收、追踪页面继续按后端校验规则补充更细粒度提示，例如状态不可逆、重复扫码、批量条码去重。
- 权限按钮显隐需结合真实角色菜单授权再做浏览器验证，尤其是 `PERM_CLINICAL_IMPORT` 是否已下发到前端 accessCodes。
- 打印、补打、转运单打印仍需真实打印机或模拟打印网关验证成功/失败反馈。
- 第三方申请导入需要与 HIS/EMR 测试数据联调，确认 `thirdPartySource`、`externalOrderNo` 的唯一性、重复导入策略与错误码文案。

## 6. 界面改造计划

### 6.1 临床登记

- 保留“工作上下文”和“申请单创建”卡片。
- 在工作上下文之后增加“第三方申请导入”卡片，仅 `PERM_CLINICAL_IMPORT` 可见。
- 导入成功后复用现有 `applyApplicationContext` 与 `loadApplication` 流程，不新增独立状态模型。
- 标本登记继续复用现有多行录入、标签结果回显与补打反馈。

### 6.2 固定核对

- 保留待固定分页查询与条码操作路径。
- 前端继续要求条码与操作人必填。
- 后续补充扫码回车后自动聚焦下一步、完成固定时固定液类型提示。

### 6.3 转运交接

- 保留创建转运单、打印、交接三段式操作。
- 前端继续要求申请单 ID、交接人、接收人、科室与条码清单。
- 后续补充条码去重与批量扫码反馈。

### 6.4 标本接收

- 保留转运单接收与条码直收两种路径。
- 转运单接收与条码直收均要求接收人。
- 拒收或退回继续要求原因，容器数量继续要求大于 0。

### 6.5 追踪查询

- 保留申请单追踪和条码追踪。
- 查询输入为空时前端拦截。
- 后续补充空态说明和异常节点高亮。

## 7. 验证计划

### 7.1 已验证

- `pnpm.cmd exec vitest run apps/web-ele/src/modules/system-management/api/system-management-service.test.ts apps/web-ele/src/modules/system-management/utils/tree.test.ts apps/web-ele/src/modules/specimen-workflow/api/specimen-workflow-service.test.ts apps/web-ele/src/router/routes/modules/workflow.test.ts` 通过，覆盖 4 个相关测试文件、13 个用例。
- `pnpm.cmd -F @vben/web-ele run typecheck` 通过。

### 7.2 本轮需补充验证

- M2 服务层 `requestClient` 调用测试已补充并通过。
- 临床申请导入服务函数路径与请求体测试已补充并通过。
- 申请单详情缺省数组 mapper 测试已补充并通过。
- workflow 路由权限测试回归已通过。
- `@vben/web-ele` 类型检查回归已通过。

### 7.3 后续联调 happy path

1. 创建或导入申请单。
2. 拉取申请单详情并确认当前上下文。
3. 登记标本并查看标签批次与标签打印结果。
4. 固定开始与固定完成。
5. 创建转运单并打印。
6. 转运交接。
7. 接收或拒收标本。
8. 按申请单与条码查询追踪事件。

## 8. 风险与边界

- 本阶段不调整全局请求封装，只在 M2 服务层改用既有 `requestClient`，因此不会改变其他模块接口行为。
- 本阶段不调整权限模型，只复用既有权限码控制按钮与路由。
- 后端字段、状态机、重复导入策略仍以 `D:\Github\JW\SYBaseProject\bl-center` 当前实现和后续联调结果为准。
- 打印、扫码枪、国产浏览器兼容性需要在真实设备或目标环境中补验。

## 9. 移交摘要

- 已完成: M1 实现核查记录、M2 范围确认、接口矩阵、差距清单、界面改造计划、验证计划与风险边界。
- 进行中: M2 业务模块按最小改动补齐统一响应解包、临床导入入口和关键前端校验。
- 待处理: 真实后端联调、打印设备验证、第三方申请导入重复策略确认、扫码体验优化。
- 关键决策: 保留现有 `specimen-workflow` 模块结构，不重写页面，不改全局请求层和权限模型。
- 已知风险: `PERM_CLINICAL_IMPORT` 权限下发、第三方测试数据、打印设备反馈仍需现场验证。
- 建议下一步: 先完成本轮单测和类型检查，再按 M2 happy path 做浏览器联调。
