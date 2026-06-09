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
- `GET /api/v1/applications` returns optional `items[].pathologyNo`; specimen workflow tracking tables may display it directly and should fall back to `-` when no pathology case exists yet.
- Technical specimen registration completion sends optional `pathologyNo` on `POST /api/v1/technical-specimen-registrations/{caseId}/complete`; frontend preview is non-authoritative and backend validates selected type and uniqueness.
- Slicing workstation flow requires backend-confirmed slide printing through `POST /api/v1/slicings/slide-print` before `POST /api/v1/slicings/complete`; completion does not submit `slideCount`.
- `GET /api/v1/slicings/workbench` accepts optional `applicationType=ROUTINE/FROZEN` and returns split `pendingPrintList`, `pendingSliceList`, `completedTodayList`, plus slide print and merge display fields.
- `GET /api/v1/technical-tasks/pending` accepts optional `includeAllStatuses` and `taskId`; frontend M3 workstations should request all statuses only for explicit query/deep-link contexts, not ordinary entry.
- `GET /api/v1/specimen-outbounds` treats `applicationId` or `specimenNo` as explicit historical lookup conditions and may return rows outside the outbound-ready subset; frontend outbound actions must still gate by row status.
- M2 specimen check-in and transport outbound payloads may omit `operatorVerificationToken` only when the selected operator user ID equals the current logged-in user; non-current selected operators still require verification tokens, and specimen confirmation keeps its existing verification requirement.
- M2 specimen `barcode` is nullable after registration; frontend treats null/blank barcode as `UNBOUND`, and only `POST /api/v1/specimens/{specimenId}/barcode-binding` writes the first target barcode for downstream barcode-based operations.

## Constraints

- Do not bypass existing auth, request, error handling, degradation, or browser compatibility logic.
- Do not move business-specific logic into shared packages unless the reuse is proven across domains.
- Do not record temporary implementation details here; use `PROJECT_STATE.md` for current phase and `DECISIONS.md` for durable choices.
