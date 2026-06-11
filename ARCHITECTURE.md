# ARCHITECTURE.md

## Architecture Snapshot

- Repository: `SYBaseProjectWeb`
- Shape: Vben Admin based frontend monorepo
- Main application: `apps/web-ele`
- Shared packages: `packages/*`, `internal/*`
- Backend sibling: `../SYBaseProject`

## Frontend Boundaries

- `apps/web-ele/src/modules/<domain>` owns domain pages, module components, module stores, module APIs, types, and mappers.
- `apps/web-ele/src/router` owns route registration, guards, and navigation metadata.
- `apps/web-ele/src/api` owns application-level request integration and core APIs.
- `packages/*` and `internal/*` own shared capabilities and tooling, not single-domain business logic.

## Cross-Repo Interfaces

- API and permission changes must be checked against backend `SYBaseProject`.
- Patient, report, permission, and database-driven flows must use both frontend and backend memory files when durable context changes.
- System log management lives at `/system/logs` with 登录日志 / 操作日志 tabs. Frontend calls sibling backend `../SYBaseProject/bl-center` `/api/v1/system/logs/login`, `/login/{id}`, `/operations`, and `/operations/{id}`; route/menu visibility uses `PERM_SYS_LOG_QUERY`, while detail requests are protected server-side by `PERM_SYS_LOG_DETAIL`.
- Operation audit is a backend cross-cutting concern: all authenticated permission-protected write APIs are audited by interceptor, and sensitive GET APIs opt in with `@AuditOperation(sensitiveQuery = true)`. Frontend must not assume ordinary read/list queries are audited unless the backend annotates them.
- M5 operation support keeps archive and borrow as separate frontend pages: `/operation-support/archive` owns application-form, `EMBEDDING_BOX`/蜡块, slide, cabinet/position, and archive-record tabs; `/operation-support/borrow` owns slide/蜡块 borrow and pending-return/return tabs. These pages reuse existing backend archive/material-loan APIs and must not add specimen archive, photo archive, white-slide borrow, scan, print, or export behavior until backend/API/device contracts exist.
- M5 archive cabinet maintenance uses sibling backend `../SYBaseProject/bl-center` APIs `POST /api/v1/archive-cabinets/batch` and `DELETE /api/v1/archive-cabinets/{id}`. Batch creation reuses create permission; delete requires `PERM_M5_ARCHIVE_CABINET_DELETE` and is allowed only for empty cabinets with no storage/loan position references.
- M5 reagent management lives at `/operation-resources/reagents` with two tabs: `试剂库存` and `试剂模板`. Frontend treats sibling backend `../SYBaseProject/bl-center` `reagents` rows as templates, `reagent_stocks` rows as batch inventory, and `reagent_stock_events` rows as the stock action/detail trail; CSV import/export is UTF-8 BOM CSV labeled as Excel in the UI. Reagent request bodies must not send legacy `operatorName` / `operatorUserId`; backend authentication resolves operators.
- M6 statistics lives under `apps/web-ele/src/modules/m6-statistics` and consumes sibling backend `../SYBaseProject/bl-center` `/api/v1/stat-*` APIs. `/m6/dashboard` uses `POST /api/v1/stat-dashboard/query` and dashboard cards grouped as summary/quality/operation/workload; backend-menu mapping recognizes `M6_SUPPORT` root plus `M6_DASHBOARD` child. Statistic report query filters use `workloadUserId`; report rows may include optional metric metadata and availability status, but legacy sparse rows remain valid. CSV export for reports stays UTF-8 BOM CSV with `indicatorCode,indicatorName,metricValue,metricUnit`.
- `GET /api/v1/applications` returns optional `items[].pathologyNo`; specimen workflow tracking tables may display it directly and should fall back to `-` when no pathology case exists yet.
- Technical specimen registration completion sends optional `pathologyNo` on `POST /api/v1/technical-specimen-registrations/{caseId}/complete`; frontend preview is non-authoritative and backend validates selected type and uniqueness.
- Slicing workstation flow requires backend-confirmed slide printing through `POST /api/v1/slicings/slide-print` before `POST /api/v1/slicings/complete`; completion does not submit `slideCount`.
- `GET /api/v1/slicings/workbench` accepts optional `applicationType=ROUTINE/FROZEN` and returns split `pendingPrintList`, `pendingSliceList`, `completedTodayList`, plus slide print and merge display fields; slicing print rows also expose `embeddingBoxNo`, `embeddingRemarks`, and `submittingDepartmentName`, with frontend `embeddingClearRemark` fallback kept for compatibility. Pending slide-print merge rows additionally expose `printGroupId`, `mergedPrintGroup`, `taskIds`, and `embeddingBoxIds`; merged `embeddingBoxNo` is displayed with `+`, for example `A1+A2`.
- Pending slide-print merge operations are backend-persisted through `POST /api/v1/slicings/slide-print-merge-groups`, `/slide-print-merge-groups/cancel`, and `/slide-print-merge-groups/print`; frontend merge actions must only target unprinted ordinary rows or unprinted merged rows returned by the workbench.
- M3 embedding box numbers are unique within the pathology case only; frontend grossing submits short box numbers such as `A1/B1/C1`, and backend enforces `case_id + embedding_box_no` uniqueness.
- Embedding workflow is two-step with a narrow rollback before final completion: `POST /api/v1/embeddings/start` persists `EMBEDDING_CONFIRM_PENDING` / “包埋确认待完成”, `POST /api/v1/embeddings/cancel` can return only that middle state to `PENDING` / 待包埋, and only `POST /api/v1/embeddings/complete` writes final embedding records and creates slicing pending tasks; legacy `IN_PROGRESS` embedding tasks remain completable but are not cancellable through the rollback endpoint.
- `GET /api/v1/technical-tasks/pending` accepts optional `includeAllStatuses` and `taskId`; frontend M3 workstations should request all statuses only for explicit query/deep-link contexts, not ordinary entry.
- `GET /api/v1/specimen-outbounds` treats `applicationId`, `specimenNo`, or `identifier` as explicit historical lookup conditions and may return rows outside the outbound-ready subset; `identifier` is an exact specimen-number-or-barcode lookup, and frontend outbound actions must still gate by row status.
- M2 specimen check-in and transport outbound payloads may omit `operatorVerificationToken` only when the selected operator user ID equals the current logged-in user; non-current selected operators still require verification tokens, and specimen confirmation keeps its existing verification requirement.
- M2 specimen `barcode` is nullable after registration; frontend treats null/blank barcode as `UNBOUND`, and only `POST /api/v1/specimens/{specimenId}/barcode-binding` writes the first target barcode for downstream barcode-based operations.
- M2 fixation, specimen confirmation, check-in, receipt, and outbound transport progression must not require barcode binding; frontend row actions prefer `specimenId`, keep optional barcode/specimen-number fields for scan and legacy compatibility, receipt sends all available identifiers, and transport creation sends `specimenIds` for selected rows.

## Constraints

- Do not bypass existing auth, request, error handling, degradation, or browser compatibility logic.
- Do not move business-specific logic into shared packages unless the reuse is proven across domains.
- Do not record temporary implementation details here; use `PROJECT_STATE.md` for current phase and `DECISIONS.md` for durable choices.
