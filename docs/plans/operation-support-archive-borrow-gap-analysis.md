# 归档与借记旧系统缺口调研

## Context

- Linear issue: `SID-79` 归档与借记旧系统缺口调研
- Date: 2026-06-10
- Scope: M5 `归档管理` and `借记管理`
- Frontend repo: `SYBaseProjectWeb`
- Backend sibling repo checked: `../SYBaseProject`

This document records the contract-first boundary after the archive/borrow tab split. It is intentionally a gap analysis only; it does not add UI controls, routes, API calls, DB changes, device SDKs, print, or export behavior.

## Current Supported Contract

The current frontend and backend contract supports these M5 archive/borrow capabilities:

| Capability | Frontend call | Backend endpoint | Permission |
| --- | --- | --- | --- |
| Archive cabinets | `listArchiveCabinets`, `createArchiveCabinet`, `updateArchiveCabinet` | `GET/POST/PATCH /api/v1/archive-cabinets` | `ARCHIVE_CABINET_QUERY/CREATE/UPDATE` |
| Available archive positions | `listAvailableArchivePositions` | `GET /api/v1/archive-positions/available` | `ARCHIVE_CABINET_QUERY` |
| Application-form archive | `archiveApplicationForm` | `POST /api/v1/archive/application-forms` | `APPLICATION_FORM_ARCHIVE` |
| Wax-block archive | `archiveEmbeddingBox` | `POST /api/v1/archive/embedding-boxes` | `EMBEDDING_BOX_ARCHIVE` |
| Slide archive | `archiveSlide` | `POST /api/v1/archive/slides` | `SLIDE_ARCHIVE` |
| Archive-record search | `searchArchiveRecords` | `GET /api/v1/archive-records/search` | `ARCHIVE_RECORD_QUERY` |
| Material loan pending list | `listPendingMaterialLoans` | `GET /api/v1/material-loans/pending` | `LOAN_QUERY` |
| Wax-block/slide loan create | `createMaterialLoan` | `POST /api/v1/material-loans` | `LOAN_CREATE` |
| Material loan return | `returnMaterialLoan` | `POST /api/v1/material-loans/{id}/return` | `LOAN_RETURN` |

Important naming boundary:

- UI uses `蜡块`.
- API object/material type remains `EMBEDDING_BOX`.
- This phase does not introduce new archive object types beyond `APPLICATION_FORM`, `EMBEDDING_BOX`, and `SLIDE`.

## Gap Matrix

| Old-system capability | Current status | Required frontend work | Backend/API work | DB/data work | Device/compatibility work | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| 标本归档 | Not supported in M5 archive contract. Current storage/archive flow archives application forms, wax blocks, and slides only. | New tab/page section, specimen lookup, cabinet-position selection, archive submit, record display, permission states. | Add specimen archive endpoint, query/read model fields, permission code, error contract, and workbench/report tracking aggregation if needed. | Add or extend storage record object type for specimens, migration/backfill rules, conflict rules with specimen workflow statuses. | None unless physical labels/scanner are included. | Split into backend+frontend feature issue; do not fake it as a frontend-only tab. |
| 拍照归档管理 | Partially adjacent only: application-form archive accepts an existing `fileUrl`; there is no M5 camera capture, upload, photo archive catalog, or photo query contract. | Camera/upload UI, photo metadata form, preview, retry/error states, photo archive search/list. | Add media upload or reuse a confirmed media asset API, add photo archive create/search endpoints, permissions, storage quota/error rules. | Photo archive table/index or attachment relation; retention policy; object relation to case/material/archive record. | Browser camera permission flow, fallback for no camera, file upload compatibility, image compression policy. | Split into contract/design issue first, then frontend implementation after API/media storage is confirmed. |
| 借白片 | Not supported. Existing material loan operates on archived `EMBEDDING_BOX` and `SLIDE` records. | White-slide borrow tab/form, pending-return list filters, return action, user-facing status text. | Define white-slide entity/material type, loan create/return contract, permission mapping, validation against stock/archive state. | White-slide inventory/archive/loan persistence and migration strategy. | Optional barcode/label integration if white slides have labels. | Needs backend/API/DB task before frontend; likely separate from wax-block/slide material loans. |
| 扫码 | Not implemented in M5 archive/borrow pages. Current pages use text inputs and selects only. | Keyboard-wedge scanner handling can be added as Enter-based lookup once lookup endpoints are defined; native scanner SDK requires an integration wrapper. | For true scanning, add lookup endpoints by barcode/material code and optional scan audit endpoint. | Scan audit/history table only if audit is required. | External scanner compatibility, browser focus behavior, debounce/repeated scan handling, Chinese IME/focus fallback. | Start with keyboard-wedge UX spec; create separate hardware integration issue for SDK/device support. |
| 打印 | Not implemented for M5 archive/borrow. Existing print code in other modules does not define M5 archive labels or borrow slips. | Print preview/actions for archive labels, cabinet labels, borrow slips, return receipts, and print failure states. | Optional server-generated template/print-job endpoint if browser print is not enough; permission/audit rules. | Print job/audit records if regulated output needs traceability. | Printer routing, browser print differences, page size, barcode/QR rendering, fallback to download. | Separate print-template design + compatibility issue; avoid adding buttons without confirmed templates. |
| 导出 | Not implemented for M5 archive/borrow records. Existing exports elsewhere do not cover archive/loan datasets. | Export buttons, disabled/no-permission states, file naming, progress/error messages. | Add archive-record export and loan-record export endpoints, permission codes, filters, content type. | Export audit/job persistence if needed; large dataset pagination/snapshot rules. | Browser download, Chinese filename encoding, CSV/XLSX compatibility. | Separate API+frontend issue, especially if export must include patient/pathology data. |

## Suggested Follow-up Linear Split

1. `M5 标本归档契约与前端入口`
   - Scope: specimen archive object type, endpoint, permissions, frontend tab, and archive-record display.
   - Requires: backend/API/DB + frontend.

2. `M5 拍照归档管理契约设计`
   - Scope: camera/upload source, media storage, photo archive metadata, search contract, retention policy.
   - Requires: backend/API/DB + browser/device compatibility.

3. `M5 借白片库存与借还闭环`
   - Scope: white-slide entity/material type, inventory/archive relation, borrow/return APIs, frontend tabs.
   - Requires: backend/API/DB + frontend.

4. `M5 扫码录入与材料快速定位`
   - Scope: keyboard-wedge scan UX, barcode lookup endpoints, duplicate scan handling, optional scan audit.
   - Requires: API + frontend; external-device work only if not keyboard-wedge.

5. `M5 归档与借记打印模板`
   - Scope: archive labels, cabinet labels, borrow slips, return receipts, templates, browser/printer fallback.
   - Requires: frontend + compatibility; backend print jobs if audit/server template is required.

6. `M5 归档与借记导出`
   - Scope: archive and loan export filters, permissions, audit, Chinese filename/download compatibility.
   - Requires: backend/API + frontend + security review.

## Non-goals For Current Tab Split

- Do not add unsupported tabs or buttons for 标本归档, 拍照归档, 借白片, 扫码, 打印, or 导出.
- Do not invent frontend-only mock persistence for missing backend contracts.
- Do not overload `EMBEDDING_BOX` or `SLIDE` to represent white slides or specimens.
- Do not put patient or pathology identifiers into URLs, logs, or unscoped error details.
- Do not modify global auth, route guards, Axios interceptors, build config, or release config for these gaps.

## Red Team Notes

- Hidden controls for unsupported gaps would create false operational confidence and invite data loss; keep them out until contracts exist.
- Export/print tasks carry patient/pathology data risk and require Security + Red Team review.
- Camera/scanner tasks require browser/device compatibility checks and explicit permission/fallback behavior.
- Backend authorization remains the source of truth; frontend menu/route gating is only the first layer.
