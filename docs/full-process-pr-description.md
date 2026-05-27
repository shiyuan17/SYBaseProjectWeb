# 全流程闭环补齐 PR 说明

## PR 标题建议

`feat(full-process): close M4 medical orders and deliver M6 management frontend`

## 背景

本次 PR 对应全流程审查报告中的高风险断层关闭项，目标不是补文档口径，而是把当前代码中的真实落地状态补齐到可交付层。

本轮主要关闭三类问题：

- `M4` 医嘱执行链路后端已具备、前端缺独立工作台，导致执行角色无法形成闭环。
- `M6` 集成任务、收费管理、历史报告后端已具备、前端仍落在 `coming-soon`，导致支持链路停留在占位页。
- 审查结论、菜单映射、角色可达性清单与当前代码事实需要统一，避免继续沿用过期结论。

## 改动范围

### 1. `M4` 医嘱执行闭环

- 新增医生流程路由：`/doctor-workflow/medical-orders`
- 补齐执行角色从 `/doctor-workflow/entry` 到医嘱工作台的可达路径
- 补齐医嘱相关 service、types、权限常量和页面动作
- 支持 `pending / accept / complete / cancel`
- 打通诊断工作台、报告追踪页与医嘱状态联动

关键前端文件：

- `apps/web-ele/src/router/routes/modules/doctor-workflow.ts`
- `apps/web-ele/src/modules/doctor-workflow/views/DoctorWorkflowEntryView.vue`
- `apps/web-ele/src/modules/doctor-workflow/views/DiagnosisWorkbenchView.vue`
- `apps/web-ele/src/modules/doctor-workflow/views/ReportTrackingView.vue`
- `apps/web-ele/src/modules/doctor-workflow/views/MedicalOrderWorkbenchView.vue`
- `apps/web-ele/src/modules/doctor-workflow/api/doctor-workflow-service.ts`

### 2. `M6` 前台真实页面补齐

- 新增 `M6` 入口页：`/m6/entry`
- `M6` 根路由改为跳转入口页，不再固定跳统计页
- 用真实页面替换以下占位页：
  - `/m6/integration`
  - `/m6/billing`
  - `/m6/history`
- 补齐 `M6` 管理模块的 service、types、访问控制与页面交互

关键前端文件：

- `apps/web-ele/src/router/routes/modules/m6.ts`
- `apps/web-ele/src/modules/m6-management/views/M6EntryView.vue`
- `apps/web-ele/src/modules/m6-management/views/IntegrationManagementView.vue`
- `apps/web-ele/src/modules/m6-management/views/BillingManagementView.vue`
- `apps/web-ele/src/modules/m6-management/views/HistoricalReportsView.vue`
- `apps/web-ele/src/modules/m6-management/api/m6-management-service.ts`

### 3. 治理与验收收口

- 更新菜单映射，避免菜单继续落到旧路径、接口路径或占位页
- 回写角色可达性清单，显式覆盖：
  - `ROLE_M4_MEDICAL_ORDER_EXECUTE`
  - `ROLE_ARCHIVE_MANAGER`
  - `ROLE_QUALITY_MANAGER`
  - `ROLE_PATHOLOGY_ADMIN`
- 回写审查报告与治理文档，确保 `M5`、`M4`、`M6` 结论与当前代码一致

关键文档/治理文件：

- `apps/web-ele/src/api/core/menu-mapper.ts`
- `apps/web-ele/src/api/core/menu.test.ts`
- `docs/full-process-role-accessibility-checklist.md`
- `docs/full-process-audit-review.html`

## 用户影响

- 医嘱执行岗不再是“有权限、无前台入口”的空角色。
- 管理员、归档岗、质量岗进入 `M6` 后不再落到占位页。
- `M2 -> M3 -> M4 -> M5` 主链路在前后端当前代码层面已形成可验证闭环。
- `M6` 已从“后端能力存在、前端未闭环”提升为“前端工作面已交付，待目标环境联调验收”。

## 风险点

- 本次改动涉及路由、菜单映射、权限可达性，属于高回归敏感区。
- `M4` 与 `M6` 页面已补齐，但外围系统联调结果仍取决于目标环境配置与账号授权。
- 若目标环境菜单、角色种子或网关配置与当前代码基线不一致，仍可能出现“页面存在但不可达”。

## 本地已验证

### 1. 定向自动化

已执行：

```powershell
pnpm exec vitest run apps/web-ele/src/router/routes/modules/m6.test.ts apps/web-ele/src/modules/m6-management/access.test.ts apps/web-ele/src/modules/m6-management/api/m6-management-service.test.ts apps/web-ele/src/api/core/menu.test.ts apps/web-ele/src/modules/m6-management/views/m6-management-views.test.ts --dom
```

结果：

- `5 files, 31 tests passed`

代表性覆盖：

- `M6` 路由入口与真实页面路由
- `M6` 入口页首个授权页面跳转
- `M6` service 数据访问
- 菜单映射
- `M6` 真实页面交互

### 2. 代码侧已存在的补充测试资产

- `apps/web-ele/src/router/routes/modules/doctor-workflow.test.ts`
- `apps/web-ele/src/modules/doctor-workflow/api/doctor-workflow-service.test.ts`
- `apps/web-ele/src/modules/doctor-workflow/views/doctor-workflow-visibility.test.ts`
- `apps/web-ele/src/router/routes/modules/operation-support.test.ts`
- `apps/web-ele/src/router/routes/modules/m6.test.ts`
- `apps/web-ele/src/modules/m6-management/views/m6-management-views.test.ts`
- `apps/web-ele/src/api/core/menu.test.ts`

### 3. 已知非阻断项

- `vue-tsc` 仍存在仓库既有问题，不是本次引入：
  - `packages/@core/preferences/src/types.ts` 缺少 `@vben-core/typings`

## 目标环境待验证

本次 PR 不应宣称“目标环境已通过”。以下项目必须在联调或预发布环境单独验收：

- `ROLE_M4_MEDICAL_ORDER_EXECUTE` 从 `/doctor-workflow/entry` 进入医嘱工作台并完成 `accept / complete / cancel`
- `/m6/integration` 真实查询联调
- `/m6/billing` 的 `retry / receipt / reconcile` 与外围收费系统联调
- `/m6/history` 的真实历史数据源导入与历史报告查询
- `CSV` 编码、中文文件名、浏览器下载行为
- 四类重点角色菜单可见性与实际权限一致性

## 回滚关注点

- `M4` 回滚关注：医生入口页跳转、医嘱状态联动、执行岗菜单可达性
- `M6` 回滚关注：`/m6` 根入口、三张真实页面路由、菜单映射路径
- 治理回滚关注：菜单映射不得回退到占位页或接口路径

## 附件建议

- `M4` 医嘱工作台截图
- `M6` 入口页、集成任务页、收费页、历史页截图
- 角色菜单可见性截图
- 审查报告链接：`docs/full-process-audit-review.html`
- 角色可达性清单：`docs/full-process-role-accessibility-checklist.md`

## 合并前检查

- [ ] `M4` 医嘱入口与执行工作台可访问
- [ ] `M6` 三张真实页面不再落到 `coming-soon`
- [ ] `menu-mapper.ts` 未回退到旧映射
- [ ] PR 已附本地验证结果
- [ ] 目标环境待验项已明确，不混写成“已通过”
