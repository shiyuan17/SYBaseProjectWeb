# 全流程角色可达性与现场验收清单

## 1. 目的

本清单用于把“代码已补齐”与“现场已可用”分开管理，避免再次出现“有角色、无页面”或“页面存在、目标环境不可用”的验收盲区。

适用基线：

- 前端仓库：`SYBaseProjectWeb`，以 `2026-05-26` 当前代码为准
- 当前重点角色：
  - `ROLE_M4_MEDICAL_ORDER_EXECUTE`
  - `ROLE_ARCHIVE_MANAGER`
  - `ROLE_QUALITY_MANAGER`
  - `ROLE_PATHOLOGY_ADMIN`

## 2. 角色可达性清单

### 2.1 `ROLE_M4_MEDICAL_ORDER_EXECUTE`

- 入口页面：`/doctor-workflow/entry`
- 目标页面：`/doctor-workflow/medical-orders`
- 核心动作：
  - 查询待执行医嘱
  - 接单
  - 完成
  - 取消
- 前端证据：
  - `apps/web-ele/src/router/routes/modules/doctor-workflow.ts`
  - `apps/web-ele/src/modules/doctor-workflow/views/MedicalOrderWorkbenchView.vue`
  - `apps/web-ele/src/modules/doctor-workflow/views/DoctorWorkflowEntryView.vue`
- 测试证据：
  - `apps/web-ele/src/router/routes/modules/doctor-workflow.test.ts`
  - `apps/web-ele/src/modules/doctor-workflow/api/doctor-workflow-service.test.ts`
  - `apps/web-ele/src/modules/doctor-workflow/views/doctor-workflow-visibility.test.ts`
- 现场检查项：
  - 角色登录后可见医生流程入口
  - 从入口页可跳转到医嘱工作台
  - `pending / accept / complete / cancel` 四个动作可操作
  - 执行结果可回流到诊断工作台与报告追踪页

### 2.2 `ROLE_ARCHIVE_MANAGER`

- 入口页面：
  - `/operation-support/entry`
  - `/m6/entry`
- 目标页面：
  - `/operation-support/archive`
  - `/m6/history`
- 核心动作：
  - 归档管理 / 借阅归还
  - 历史导入任务查询
  - 历史报告查询
  - 发起历史导入
- 前端证据：
  - `apps/web-ele/src/router/routes/modules/operation-support.ts`
  - `apps/web-ele/src/router/routes/modules/m6.ts`
  - `apps/web-ele/src/modules/operation-support/views/ArchiveManagementView.vue`
  - `apps/web-ele/src/modules/m6-management/views/HistoricalReportsView.vue`
- 测试证据：
  - `apps/web-ele/src/router/routes/modules/operation-support.test.ts`
  - `apps/web-ele/src/router/routes/modules/m6.test.ts`
  - `apps/web-ele/src/modules/m6-management/views/m6-management-views.test.ts`
- 现场检查项：
  - 归档岗菜单中可见 M5 与 M6 历史页入口
  - 可正常发起历史导入
  - 可查询历史导入作业和历史报告结果
  - 历史页不再跳到占位页或 403

### 2.3 `ROLE_QUALITY_MANAGER`

- 入口页面：`/m6/entry`
- 目标页面：
  - `/m6/statistics`
  - `/m6/integration`（若授予集成任务查询权限）
- 核心动作：
  - 统计查询与导出
  - 集成任务查询
- 前端证据：
  - `apps/web-ele/src/router/routes/modules/m6.ts`
  - `apps/web-ele/src/modules/m6-statistics/views/StatisticsAnalysisView.vue`
  - `apps/web-ele/src/modules/m6-management/views/IntegrationManagementView.vue`
- 测试证据：
  - `apps/web-ele/src/router/routes/modules/m6.test.ts`
  - `apps/web-ele/src/modules/m6-management/views/m6-management-views.test.ts`
- 现场检查项：
  - 质量岗可通过 `/m6/entry` 进入其首个授权页面
  - 已授权统计功能时可见统计页
  - 已授权集成查询时可见集成任务页
  - 菜单不出现空链路或错误跳转

### 2.4 `ROLE_PATHOLOGY_ADMIN`

- 入口页面：
  - `/system/*`
  - `/workflow/*`
  - `/technical-workflow/*`
  - `/doctor-workflow/*`
  - `/operation-support/*`
  - `/m6/*`
- 核心动作：
  - 系统治理
  - 全链路巡检
  - M6 四页访问与动作验证
- 前端证据：
  - `apps/web-ele/src/api/core/menu-mapper.ts`
  - `apps/web-ele/src/api/core/menu.test.ts`
  - 各模块路由测试
- 现场检查项：
  - 管理员角色菜单完整
  - `M4` 医嘱页与 `M6` 四页均可见
  - 后端菜单映射不会落到旧路径或占位页

## 3. 现场验收清单

### 3.1 外部收费回执

- 检查对象：`/m6/billing`
- 必查项：
  - 回执登记动作可提交到真实外围系统或联调环境
  - 回执成功后状态回写正确
  - 失败提示可读，不是空白或通用报错

### 3.2 历史导入真实数据源

- 检查对象：`/m6/history`
- 必查项：
  - 导入动作指向真实历史数据源或可用联调源
  - 可返回导入作业状态
  - 查询结果与真实源数据一致

### 3.3 CSV 编码与文件名

- 检查对象：M6 统计与后续导出链路
- 必查项：
  - 中文文件名无乱码
  - `CSV` 以 `UTF-8` 打开无错码
  - 导出内容列头与数据格式正确

### 3.4 角色菜单可见性

- 检查对象：四类重点角色
- 必查项：
  - 菜单与权限一致
  - 有权限的页面可见且可进入
  - 无权限页面不应误显
  - 不出现“有菜单、落空页”或“有权限、无入口”

## 4. 最低验收结论

以下四项全部满足，才可认定“代码闭环已转化为可交付闭环”：

- 重点角色都能从入口页进入自己的真实工作面
- `M4` 医嘱执行与 `M6` 三个管理页可完成主操作
- 菜单映射不再落到占位页、接口地址或错误页面
- 外围系统与导出链路完成目标环境核验
