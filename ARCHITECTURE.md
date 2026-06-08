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

## Constraints

- Do not bypass existing auth, request, error handling, degradation, or browser compatibility logic.
- Do not move business-specific logic into shared packages unless the reuse is proven across domains.
- Do not record temporary implementation details here; use `PROJECT_STATE.md` for current phase and `DECISIONS.md` for durable choices.
