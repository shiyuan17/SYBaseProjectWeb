# DECISIONS.md

## Purpose

**Index** of active business and cross-repo decisions. Full contract text: [docs/reviews/decisions-business-detail.md](../reviews/decisions-business-detail.md). Governance-process history: [docs/reviews/decisions-archive.md](../reviews/decisions-archive.md).

## Active Decisions (index)

| ID | Date | Topic | Summary |
| --- | --- | --- | --- |
| DEC-20260608-004 | 2026-06-08 | M2 application registration workbench | When an `APPLICATION_NO` lookup misses, the frontend reuses the existing application create API, generates editable pla… |
| DEC-20260608-005 | 2026-06-08 | Technical specimen registration pathology number editing | The frontend sends an optional completion-time `pathologyNo` candidate with `applicationType`; non-empty candidates are… |
| DEC-20260608-006 | 2026-06-08 | Slicing workstation print-before-slice flow | The slicing workstation treats backend-confirmed slide printing (`POST /api/v1/slicings/slide-print`) as the required t… |
| DEC-20260608-007 | 2026-06-08 | Tracking and abnormal application list pathology number display | Use backend `GET /api/v1/applications` `items[].pathologyNo` as the single source for the “病理号” column; frontend does n… |
| DEC-20260608-008 | 2026-06-08 | Historical-status lookup in M2/M3 workflow pages | Ordinary page entry remains empty, while explicit business-key queries may return all-status historical rows; action av… |
| DEC-20260609-001 | 2026-06-09 | M2 specimen check-in and transport operator identity | The selected current login user may act as the check-in / outbound / handover operator without an `operatorVerification… |
| DEC-20260609-002 | 2026-06-09 | M2 specimen barcode binding semantics | A specimen registered without an explicit barcode remains `UNBOUND` with `barcode=null`; `POST /api/v1/specimens/{speci… |
| DEC-20260609-003 | 2026-06-09 | M3 embedding confirmation workflow | `POST /api/v1/embeddings/start` is the confirmation action and must persist `EMBEDDING_CONFIRM_PENDING` / “包埋确认待完成”; `P… |
| DEC-20260609-004 | 2026-06-09 | M3 slicing workstation print controls | `SlicingWorkstationView` no longer exposes the marked print-parameter controls for slide count, adjacent merge/cancel m… |
| DEC-20260609-005 | 2026-06-09 | M3 slicing workstation slide print handoff | Clicking `打印玻片` opens a browser print window, supports multiple selected rows, writes generated slide labels into one p… |
| DEC-20260609-006 | 2026-06-09 | M2 specimen workflow identifiers | 标本固定、标本确认、标本入库、标本签收、标本出库推进动作以 `specimenId` 为行级首选标识，保留 `specimenBarcode` / `specimenNo` 兼容扫码和旧调用；条码绑定仅是关联与扫码便利，不是这些流程的前置… |
| DEC-20260609-007 | 2026-06-09 | M3 slicing pending slide-print merge groups | Pending slide-print merge is persisted server-side and scoped to same patient + same case/pathology number + same embed… |
| DEC-20260610-002 | 2026-06-10 | M5 archive and borrow page organization | Keep `归档管理` and `借记管理` as separate menu pages and organize each page internally with tabs; the archive page owns applic… |
| DEC-20260610-003 | 2026-06-10 | 全站页面级标题头样式 | `@vben/common-ui` `Page` 新增显式 `showHeader` 开关，`apps/web-ele` 现有页面统一传 `show-header=false`，移除页面级大标题/说明头，仅保留正文、卡片内标题、面包屑、标… |
| DEC-20260610-004 | 2026-06-10 | 系统日志管理与操作审计 | 系统管理只新增单菜单 `/system/logs`，页面内用 登录日志 / 操作日志 两个 tab；前端查询入口统一走 sibling backend `../SYBaseProject/bl-center` 的 `/api/v1/sys… |
| DEC-20260611-002 | 2026-06-11 | M5 archive cabinet maintenance | `归档柜列表` is a real full-stack tree-table workflow, not a screenshot-only placeholder: frontend calls sibling backend `PO… |
| DEC-20260611-003 | 2026-06-11 | M5 reagent inventory/template contract | `/operation-resources/reagents` is organized as two tabs: `试剂库存` for stock batches and `试剂模板` for reusable reagent defi… |
| DEC-20260611-004 | 2026-06-11 | M5 archive object list contract | `/operation-support/archive` object tabs must use sibling backend `GET /api/v1/archive-objects` for paged object全集 by `… |
| DEC-20260611-005 | 2026-06-11 | AI automatic commit granularity | AI commits use acceptance-point grouping plus low/medium/high risk ratings. AI must explain proposed commit groups befo… |
| DEC-20260611-007 | 2026-06-11 | M5 specimen archive contract | `SPECIMEN` is now a supported M5 archive object type with independent permission `PERM_M5_SPECIMEN_ARCHIVE`, frontend t… |
| DEC-20260611-008 | 2026-06-11 | M6 statistics report contract | Frontend statistic report queries use `workloadUserId` for workload/operator filtering and must not send legacy `operat… |
| DEC-20260611-009 | 2026-06-11 | M6 statistics dashboard contract | `/m6/dashboard` is the default M6 statistics landing page. It reuses the existing statistic report query permission sco… |
| DEC-20260611-010 | 2026-06-11 | M6 quality indicator overview and export | `/m6/quality-indicators` is a real quality-statistics overview page, not a placeholder. It queries `POST /api/v1/stat-r… |
| DEC-20260611-012 | 2026-06-11 | M6 management indicator statistics | `/m6/management-indicators` is a real management-statistics page that composes two report queries: `category=OPERATION`… |
| DEC-20260613-004 | 2026-06-13 | Pathology receipt route ownership | `PathologyReceipt` is owned by the M2 specimen workflow route module at `/workflow/pathology-receipt`; M3 technical wor… |
| DEC-20260615-004 | 2026-06-15 | M5 material loan status query | `/operation-support/borrow` uses a single borrow-record list filtered by `loanStatus=BORROWED` or `loanStatus=RETURNED`… |
| DEC-20260615-005 | 2026-06-15 | M5 material loan abnormal registration | `/operation-support/borrow` registers wax-block/slide abnormal-loan records through sibling backend `../SYBaseProject/b… |
| DEC-20260615-006 | 2026-06-15 | M5 physical archive batch contract | `/operation-support/archive` treats 蜡块、玻片、标本 archive tabs as multi-select batch workflows. The frontend submits `archiv… |
| DEC-20260615-007 | 2026-06-15 | M5 archive cabinet node contract | `/operation-support/archive` `归档柜列表` consumes sibling backend `../SYBaseProject/bl-center` `GET/POST/PATCH /api/v1/arch… |
| DEC-20260615-008 | 2026-06-15 | M5 archive-page material loan shortcut | `/operation-support/archive` may expose a selected-row `借记` shortcut for `EMBEDDING_BOX` and `SLIDE` only, reusing the … |
| DEC-20260615-009 | 2026-06-15 | M4 pathology report list workflow page | `/doctor-workflow/report` is now a case-scoped report list workflow page rather than a draft editor. Users query by `ca… |
| DEC-20260615-010 | 2026-06-15 | M4 revision/consultation workbench query contract | `/doctor-workflow/report-revision` and `/doctor-workflow/consultation` now both use case-scoped `GET /api/v1/pathology-… |
| DEC-20260616-001 | 2026-06-16 | M5 仪器设备管理旧系统对齐 | `/operation-resources/equipment` 按旧系统宽表契约扩展为“设备档案宽表 + 批量状态操作 + 前端导出/打印”页面：前端统一把 `equipmentCode` 展示为“资产编号”，复用现有设备详情/保养与预… |
| DEC-20260616-002 | 2026-06-16 | M5 白片借记独立合同 | `/operation-support/borrow` 新增 `白片借记` tab，并通过 sibling backend `../SYBaseProject/bl-center` 独立消费 `GET /api/v1/white-slid… |
| DEC-20260616-004 | 2026-06-16 | M6 统计报表工作台与明细合同 | `/m6/custom-analysis` 保持现有路径和 `CustomStatisticsAnalysis` route name，但作为“统计报表工作台”单入口承载工作量、质量与安全、关键质控、冰冻时效、更改报告、不合格标本、自定义… |
| DEC-20260616-005 | 2026-06-16 | M6 工作量报表周期趋势合同 | `/m6/custom-analysis` 工作量 tab 通过同一个 `POST /api/v1/stat-reports/query` 合同传递 `periodMode=month |
| DEC-20260616-006 | 2026-06-16 | M6 质量指标趋势、分布与明细合同 | `/m6/custom-analysis` 质量相关 tab 优先消费后端质量指标行上的 `trendPoints` 和 `breakdowns`，并通过 `POST /api/v1/stat-reports/details/query`… |
| DEC-20260616-007 | 2026-06-16 | M6 工作量导出与展示一致性 | `/m6/custom-analysis` 工作量 tab 的导出必须与页面当前合并结果一致，因此前端使用本地合并 rows 生成 CSV，而不是只导出单一 `WORKLOAD` 后端结果。质量与自定义统计继续使用后端 `stat-rep… |
| DEC-20260616-008 | 2026-06-16 | M6 关键质控危急值只读统计合同 | `/m6/custom-analysis` 关键质控 tab 固定展示 `QC_FROZEN_PARAFFIN_MATCH_RATE`、`QC_CRITICAL_VALUE_COUNT`、`QC_CRITICAL_VALUE_REPORT… |
| DEC-20260616-009 | 2026-06-16 | M6 Goal 6-8 report workbench indicators | `/m6/custom-analysis` 的冰冻时效、更改报告、不合格标本 tabs 固定消费 sibling backend `../SYBaseProject/bl-center` `V98\_\_seed_m6_goal6_8_sta… |
| DEC-20260616-003 | 2026-06-16 | M5 医疗废物管理双 Tab 与最小闭环合同 | `/operation-resources/medical-waste` 不再使用占位页，而是固定为 `人体标本` / `药物试剂` 双 Tab 的真实页面，并继续复用 `M5_RESOURCE_PAGE_AUTHORITIES`，不新增… |
| DEC-20260616-010 | 2026-06-16 | 系统用户角色展示依赖后端无前缀角色主数据 | 系统管理里的“分配角色”弹窗、用户列表角色列、角色管理页等角色名称展示继续直接使用 sibling backend `../SYBaseProject/bl-center` `/api/v1/roles` 和 `/api/v1/syste… |
| DEC-20260617-003 | 2026-06-17 | M2 标本下游与 M5 归档患者信息语义 | 后续流程页面中的“病人ID”一律表示患者身份标识 `patientId`，不得再回退或展示 `caseId`；标本下游患者成组信息统一按 `patientId / inpatientNo / wardName / patientGende… |
| DEC-20260617-005 | 2026-06-17 | M2 条码首次绑定脱离流程闸门 | 固定与转运页的首次 `条码绑定` 不再受标本当前流程状态限制：只要该标本当前未绑定且目标条码合法唯一，前端仍可在任意时点提交 `POST /api/v1/specimens/{specimenId}/barcode-binding`。`取… |
| DEC-20260617-006 | 2026-06-17 | M3 制片管理日期范围统一合同 | 制片管理当前可见菜单页统一改为参照 `SpecimenReceiptView` 的 `daterange` 查询控件：默认空范围、不预填当天、仅在用户显式选择后才发送日期条件；任务列表类继续发 `createdFrom/createdTo… |
| DEC-20260617-007 | 2026-06-17 | M2 申请登记工作台标本字典科室过滤合同 | `/workflow/application-registration-workbench` 的标本字典统一改为消费 sibling backend `../SYBaseProject/bl-center` `GET /api/v1/ap… |
| DEC-20260617-008 | 2026-06-17 | 全站可见“病人ID / ID号”展示口径 | Visible patient ID labels now prefer application-registration workbench `patientInfo.idNo`, surfaced as `patientIdDispl… |
| DEC-20260618-001 | 2026-06-18 | 标本字典主数据迁移到系统配置 | `/system/configs` 现在内置“标本字典”专用管理区，前端通过 sibling backend `../SYBaseProject/bl-center` `GET /api/v1/system-configs/specime… |
| DEC-20260618-002 | 2026-06-18 | 手术楼/手术室选项统一改为系统配置主数据 | `标本采集` 相关页面继续调用 `GET /api/v1/application-registration-workbench/operating-options`，但该接口的语义改为读取 sibling backend `../SYBa… |
| DEC-20260618-003 | 2026-06-18 | Specimen workbench frozen reminder UI/polling | The top "冰冻提醒" checkbox in the specimen collection workbench changes from a read-only display field to a per-session re… |

## Update Rules

- Add decisions only when they change future behavior; append full row to `decisions-business-detail.md` and a summary line here.
- Superseded decisions move to `docs/reviews/decisions-archive.md`; do not delete IDs.
- Cross-repo items must reference sibling backend paths in the detail file.
