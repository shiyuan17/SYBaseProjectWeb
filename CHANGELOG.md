# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project follows Semantic Versioning.

## [1.0.0] - 2026-06-30

### Added

- Delivered the workflow workstation baseline across specimen, technical, doctor, operation-support, dashboard, notification-center, and M6 statistics modules.
- Added governance, release, verification, task-management, and memory documentation needed for sustained AI and developer collaboration.

### Changed

- Consolidated the repository into the current monorepo structure with `apps/web-ele`, shared packages, internal tooling, and governed release workflows.
- Standardized the first formal release line onto `main`, `develop`, and `release/1.0.0`.

### Fixed

- Carried forward workflow workstation alignment fixes from the active delivery branch, including diagnosis workbench, pathology dashboard, specimen workflow, and technical workflow refinements.

### Verification

- Release verification is expected to include `pnpm lint`, `pnpm check:type`, `pnpm run check:governance`, `pnpm test:unit`, and `pnpm build`.
