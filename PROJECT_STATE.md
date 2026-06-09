# PROJECT_STATE.md

## Current State

- Last updated: 2026-06-09
- Repository: `SYBaseProjectWeb`
- Current phase: frontend M2 specimen barcode binding semantics aligned with backend nullable-barcode workflow
- Active focus: specimen registration rows remain unbound until barcode binding writes a target barcode; barcode binding table/export now place “标本条码” immediately after “标本编号”.
- Backend sibling repo: `../SYBaseProject` (parallel memory files confirmed present: PROJECT_STATE/ARCHITECTURE/DECISIONS/TECH_DEBT/KNOWN_BUGS)

## Active Work

- Embedding workstation remark persistence fixed on 2026-06-09: `EmbeddingWorkstationView` now sends the pending-row `remarks` as `POST /api/v1/embeddings/complete` remarks, so completed records return and display it as `embeddingRemarks`; operator remarks remain a fallback when the row remark is empty.
- Dehydration workstation row status colors fixed on 2026-06-09: `DehydrationWorkstationView` now applies local row tone classes aligned with the specimen confirmation page semantics while keeping technical workflow independent from specimen workflow styles.
- Dehydration workstation scan-enter start fixed on 2026-06-09: `DehydrationWorkstationView` now treats Enter in the pathology number input as scan confirmation, queries the current dehydration rows, and automatically starts the current/default first `PENDING` task without changing the existing button batch behavior.
- Grossing workstation historical completed-task query fixed on 2026-06-09: `GrossingWorkstationView` now shows a “数据状态” column and skips grossing workbench context initialization for non-`IN_PROGRESS` query results, so pressing Enter on a completed pathology/task lookup does not surface “技术任务未处于激活状态”.
- Diagnosis assignment filter selector width fixed on 2026-06-09: `DiagnosisAssignmentView` keeps the “任务类型” and “任务状态” filter selects at a non-shrinking 176px minimum width so selected filter text remains visible.
- Grossing workstation specimen selector width fixed on 2026-06-09: `GrossingEmbeddingBoxTable` keeps the “标本名称” select at a non-shrinking 288px minimum width so selected specimen names remain visible in the header.
- Barcode binding semantics fixed on 2026-06-09: `SpecimenBarcodeBindingPanel` displays and exports “标本条码” immediately after “标本编号”; frontend specimen workflow mock registration no longer auto-generates barcodes when none are provided, and transport-order creation excludes unbound specimens without a barcode. Backend sibling `../SYBaseProject/bl-center` now persists new no-barcode registrations as `UNBOUND`.
- Specimen outbound completed-row display fixed on 2026-06-09: `TransportHandoverView` still displays specimens already in outbound/transported state for operator confirmation, but leaves them non-selectable/non-operable and keeps scan warnings based on the backend-returned row state.
- Specimen check-in / transport operator fix on 2026-06-09: `SpecimenCheckInPanel` and `TransportHandoverView` no longer require selected current-login operators to have a secondary verification token; payloads omit `operatorVerificationToken` only for the current user, and non-current users still call the operator verification prompt.
- Barcode binding fixed on 2026-06-08: `SpecimenBarcodeBindingPanel` now loads all specimen management rows by default and after reset; the existing “仅显示未绑定” checkbox remains a manual filter that sends `barcodeBindingStatus=UNBOUND`.
- Application registration auto-create patient age fixed on 2026-06-08: `POST /api/v1/applications` now receives a backend-parseable numeric `patientAge` from the frontend auto-create path, while the workbench patient-info payload keeps the display age text; missing application-number lookup suppresses both the lookup 404 toast and the auto-create success toast, then directly hydrates the generated workbench data.
- Application registration auto-create fixed on 2026-06-08: missing `APPLICATION_NO` lookup now creates an application with backend-parseable ISO `specimenRemovalTime` in `POST /api/v1/applications`, then saves simulated workbench patient/contagious/surgery/gynecology/special-condition data while keeping `specimenItems` empty.
- Historical-status query support changed on 2026-06-08: `FixationVerifyView`, fixation time, specimen confirmation, specimen check-in, specimen receipt workbench, transport handover, grossing workstation, and dehydration workstation all distinguish ordinary empty entry from explicit condition queries.
- M2 specimen workflow historical queries changed on 2026-06-08: explicit application/specimen/barcode queries reuse all-status specimen data where possible; receipt/outbound pages no longer auto-load pending rows on ordinary entry; old rows remain visible with status/reason text and existing operation gates.
- M3 technical workflow historical queries changed on 2026-06-08: grossing and dehydration workstations pass `includeAllStatuses=true` only for explicit `pathologyNo`/`taskId` lookups or exception route context; completed tasks remain visible but cannot be started/completed again.
- Technical specimen registration changed on 2026-06-08: frontend list rows now consume `patientGender` and `patientAge` from backend technical registration list APIs; the workspace loads `getTechnicalSpecimenRegistrationApplicationWorkbench` for every selected case so surgery and gynecology sections can be shown alongside base patient/application info.
- Technical specimen registration completion changed on 2026-06-08: `CompleteTechnicalSpecimenRegistrationRequest` accepts optional `pathologyNo`; the workstation maintains a per-case draft, previews prefixes by selected application type, and submits `pathologyNo` only on “完成登记”.
- Diagnosis workstation changed on 2026-06-08: `apps/web-ele/src/modules/doctor-workflow/views/DiagnosisWorkbenchView.vue` now uses resizable three-column panes; `DiagnosisWorkbenchTabs.vue` places “医嘱信息” first and embeds capture under “患者信息”; shared `WorkbenchCapturedImagePanel.vue` guards camera startup against late `getUserMedia` streams after preview close/unmount.
- Tracking and abnormal list changed on 2026-06-08: `ApplicationListItem` accepts optional `pathologyNo`; `TrackingApplicationListTable` renders a “病理号” column after “申请单号”; `formatCurrentNode` covers M3/M4 nodes such as `GROSSING`, `SLICING`, `DIAGNOSIS_ASSIGN`, and `MEDICAL_ORDER_CREATE`.
- Slicing workstation changed on 2026-06-08: `apps/web-ele/src/modules/technical-workflow/views/SlicingWorkstationView.vue` now separates `玻片打印` and `切片` tabs; it calls backend `POST /api/v1/slicings/slide-print` before a task enters the slicing tab, supports adjacent merge print requests, and passes `applicationType=ROUTINE/FROZEN` to the backend workbench query.
- Slicing completion UI changed on 2026-06-08: `apps/web-ele/src/modules/technical-workflow/components/SlicingProcessDialog.vue` no longer submits `slideCount`; completion works against already printed slides returned by the backend.
- AI memory files are the durable repo-local state layer for future agents and must be checked before final delivery.
- The worktree contains unrelated business/menu/registration changes; future agents must separate this technical registration display/API task from existing application and specimen workflow edits.

## Validation Baseline

- Latest embedding workstation remark validation in this thread:
  - `pnpm test:unit -- apps/web-ele/src/modules/technical-workflow/views/EmbeddingWorkstationView.test.ts`: passed on 2026-06-09 (1 file, 13 tests).
  - `pnpm lint`: passed on 2026-06-09 after the embedding remark payload fix.
  - `pnpm check:type`: passed on 2026-06-09 after the embedding remark payload fix.
- Latest dehydration workstation row status color validation in this thread:
  - `pnpm test:unit -- --run apps/web-ele/src/modules/technical-workflow/views/DehydrationWorkstationView.test.ts`: passed on 2026-06-09 (1 file, 15 tests).
  - `pnpm lint`: passed on 2026-06-09 after the dehydration row color fix.
  - `pnpm check:type`: passed on 2026-06-09 after the dehydration row color fix.
- Latest dehydration workstation scan-enter validation in this thread:
  - `pnpm test:unit -- --run apps/web-ele/src/modules/technical-workflow/views/DehydrationWorkstationView.test.ts`: passed on 2026-06-09 (1 file, 14 tests).
  - `pnpm lint`: passed on 2026-06-09 after the dehydration scan-enter fix.
  - `pnpm check:type`: passed on 2026-06-09 after the dehydration scan-enter fix.
- Latest grossing workstation historical completed-task query validation in this thread:
  - `pnpm test:unit -- --run apps/web-ele/src/modules/technical-workflow/views/GrossingWorkstationView.test.ts`: passed on 2026-06-09 (1 file, 15 tests).
  - `pnpm lint`: passed on 2026-06-09 after the data-status column / inactive-context fix.
  - `pnpm check:type`: passed on 2026-06-09 after the data-status column / inactive-context fix.
- Latest diagnosis assignment filter selector validation in this thread:
  - `pnpm test:unit -- apps/web-ele/src/modules/doctor-workflow/views/doctor-workflow-visibility.test.ts`: passed on 2026-06-09 (1 file, 17 tests).
  - `pnpm lint`: passed on 2026-06-09 after the diagnosis assignment selector width fix.
  - `pnpm check:type`: passed on 2026-06-09 after the diagnosis assignment selector width fix.
- Latest grossing workstation specimen selector validation in this thread:
  - `pnpm test:unit -- apps/web-ele/src/modules/technical-workflow/components/GrossingEmbeddingBoxTable.test.ts apps/web-ele/src/modules/technical-workflow/views/GrossingWorkstationView.test.ts`: passed on 2026-06-09 (2 files, 17 tests).
  - `pnpm lint`: passed on 2026-06-09 after the selector width fix.
  - `pnpm check:type`: passed on 2026-06-09 after the selector width fix.
- Latest barcode binding semantics validation in this thread:
  - `pnpm test:unit -- --run apps/web-ele/src/modules/specimen-workflow/components/SpecimenBarcodeBindingPanel.test.ts apps/web-ele/src/modules/specimen-workflow/composables/useSpecimenBarcodeBindingPanel.test.ts apps/web-ele/src/modules/specimen-workflow/api/specimen-workflow-service.test.ts`: passed on 2026-06-09 (3 files, 22 tests).
  - `pnpm check:type`: passed on 2026-06-09 after making specimen tracking barcodes nullable for unbound registrations.
  - `pnpm lint`: passed on 2026-06-09 after the barcode binding semantics fix.
  - Backend sibling validation in `../SYBaseProject`: `.\mvnw.cmd -pl bl-center -Dtest=M2CollectionAndLabelIntegrationTest test` passed on 2026-06-09 (8 tests).
- Latest specimen outbound completed-row display validation in this thread:
  - `pnpm test:unit -- --run apps/web-ele/src/modules/specimen-workflow/utils/transport-handover.test.ts apps/web-ele/src/modules/specimen-workflow/views/TransportHandoverView.test.ts`: passed on 2026-06-09 (2 files, 14 tests).
  - `pnpm lint`: passed on 2026-06-09 after the outbound completed-row display fix.
  - `pnpm check:type`: passed on 2026-06-09 after the outbound completed-row display fix.
  - Backend sibling check: `../SYBaseProject/bl-center` search confirmed `POST /api/v1/specimen-outbounds/*/outbound` transitions specimens/applications to `IN_TRANSIT`, and `GET /api/v1/specimen-outbounds` may return `outboundAt` / `IN_TRANSIT` rows for scoped lookups; no backend changes were made.
- Latest specimen operator validation in this thread:
  - `pnpm test:unit -- --run apps/web-ele/src/modules/specimen-workflow/composables/useSpecimenCheckInPanel.test.ts apps/web-ele/src/modules/specimen-workflow/components/SpecimenCheckInPanel.test.ts apps/web-ele/src/modules/specimen-workflow/components/SpecimenOutboundTable.test.ts apps/web-ele/src/modules/specimen-workflow/views/TransportHandoverView.test.ts`: passed on 2026-06-09 (4 files, 28 tests).
  - `pnpm lint`: passed on 2026-06-09 after the specimen operator fix.
  - `pnpm check:type`: passed on 2026-06-09 after the specimen operator fix.
  - `pnpm exec oxfmt --check` for the touched specimen workflow frontend files passed on 2026-06-09.
  - Backend sibling validation in `../SYBaseProject`: `.\mvnw.cmd -pl bl-center -Dtest=SpecimenWorkflowClosureIntegrationTest test` passed on 2026-06-09 (21 tests).
- Latest barcode binding validation in this thread:
  - `pnpm test:unit -- --run apps/web-ele/src/modules/specimen-workflow/composables/useSpecimenBarcodeBindingPanel.test.ts apps/web-ele/src/modules/specimen-workflow/components/SpecimenBarcodeBindingPanel.test.ts`: passed on 2026-06-08 (2 files, 4 tests).
  - `pnpm check:type`: passed on 2026-06-08 after the barcode binding default-load fix.
  - `pnpm lint`: passed on 2026-06-08 after the barcode binding default-load fix.
- Latest application registration auto-create validation in this thread:
  - `pnpm vitest run --dom --run apps/web-ele/src/modules/specimen-workflow/utils/application-registration-auto-create.test.ts apps/web-ele/src/modules/specimen-workflow/api/application-registration-workbench-service.test.ts apps/web-ele/src/modules/specimen-workflow/components/ApplicationRegistrationWorkbenchPanel.test.ts`: passed on 2026-06-08 (3 files, 22 tests) after the auto-create patient-age and lookup-toast fix.
  - `pnpm check:type`: passed on 2026-06-08 after the auto-create patient-age and lookup-toast fix.
  - `pnpm lint`: passed on 2026-06-08 after the auto-create patient-age and lookup-toast fix.
  - `pnpm vitest run --dom --run apps/web-ele/src/modules/specimen-workflow/utils/application-registration-auto-create.test.ts apps/web-ele/src/modules/specimen-workflow/components/ApplicationRegistrationWorkbenchPanel.test.ts apps/web-ele/src/modules/specimen-workflow/api/application-registration-workbench-service.test.ts apps/web-ele/src/modules/specimen-workflow/api/application-registration-workbench-mock.test.ts`: passed on 2026-06-08 (4 files, 29 tests).
  - `pnpm check:type`: passed on 2026-06-08 after the auto-create time-format fix.
  - `pnpm lint`: passed on 2026-06-08 after the auto-create time-format fix.
- Latest historical-status query validation in this thread:
  - `pnpm vitest run --dom --run apps/web-ele/src/modules/specimen-workflow/views/FixationVerifyView.test.ts apps/web-ele/src/modules/specimen-workflow/components/SpecimenFixationTimePanel.test.ts apps/web-ele/src/modules/specimen-workflow/composables/useSpecimenConfirmationPanel.test.ts apps/web-ele/src/modules/specimen-workflow/composables/useSpecimenCheckInPanel.test.ts apps/web-ele/src/modules/specimen-workflow/composables/useSpecimenReceiptWorkbench.test.ts apps/web-ele/src/modules/specimen-workflow/views/SpecimenReceiptView.test.ts apps/web-ele/src/modules/specimen-workflow/views/TransportHandoverView.test.ts apps/web-ele/src/modules/technical-workflow/views/GrossingWorkstationView.test.ts apps/web-ele/src/modules/technical-workflow/views/DehydrationWorkstationView.test.ts`: passed on 2026-06-08 (9 files, 73 tests).
  - `pnpm check:type`: passed on 2026-06-08 after the historical-status query changes.
  - Targeted ESLint, oxfmt, stylelint, and oxlint checks for the historical-status query touched files passed on 2026-06-08.
  - `pnpm lint`: passed on 2026-06-08 after the historical-status query and memory-file updates.
- Latest technical specimen registration validation in this thread:
  - `pnpm vitest run --dom --run apps/web-ele/src/modules/technical-workflow/views/TechnicalSpecimenRegistrationView.test.ts apps/web-ele/src/router/routes/modules/technical-workflow.test.ts apps/web-ele/src/api/core/menu.test.ts apps/web-ele/src/modules/technical-workflow/components/specimen-registration/TechnicalSpecimenRegistrationApplicationSummaryCard.test.ts`: passed on 2026-06-08 (4 files, 44 tests).
  - `pnpm test:unit -- --run apps/web-ele/src/modules/technical-workflow/views/TechnicalSpecimenRegistrationView.test.ts`: passed on 2026-06-08 (28 tests) after adding pathology number draft coverage.
  - `pnpm check:type`: passed on 2026-06-08.
  - Targeted ESLint/oxfmt checks for changed technical workflow files passed on 2026-06-08.
  - `pnpm lint`: blocked by an unrelated existing formatting issue in `apps/web-ele/src/modules/specimen-workflow/composables/useSpecimenFixationTimePanel.ts`.
- Latest diagnosis workstation validation in this thread:
  - `pnpm test:unit -- DiagnosisWorkbenchView.test.ts`: passed on 2026-06-08 (27 tests).
  - `pnpm exec oxfmt --check apps/web-ele/src/modules/doctor-workflow/components/DiagnosisWorkbenchDetailPane.vue apps/web-ele/src/modules/doctor-workflow/components/DiagnosisWorkbenchReportEditor.vue apps/web-ele/src/modules/doctor-workflow/components/DiagnosisWorkbenchTabs.vue apps/web-ele/src/modules/doctor-workflow/views/DiagnosisWorkbenchView.vue apps/web-ele/src/modules/doctor-workflow/views/DiagnosisWorkbenchView.test.ts apps/web-ele/src/modules/doctor-workflow/types/doctor-workflow.ts`: passed on 2026-06-08.
  - `pnpm exec stylelint apps/web-ele/src/modules/doctor-workflow/components/DiagnosisWorkbenchTabs.vue apps/web-ele/src/modules/doctor-workflow/views/DiagnosisWorkbenchView.vue`: passed on 2026-06-08.
  - `pnpm check:type`: passed on 2026-06-08.
- Latest tracking and abnormal list validation in this thread:
  - `pnpm test:unit -- --run apps/web-ele/src/modules/specimen-workflow/components/TrackingApplicationListTable.test.ts apps/web-ele/src/modules/specimen-workflow/utils/format.test.ts`: passed on 2026-06-08 (2 files, 5 tests).
  - `pnpm exec oxfmt --check` and `pnpm exec eslint` for the five changed specimen tracking files passed on 2026-06-08.
  - `pnpm check:type`: blocked by unrelated dirty slicing workflow test/type errors in `apps/web-ele/src/modules/technical-workflow`; see `TECH_DEBT.md` TD-20260608-003.
  - `pnpm lint`: blocked by unrelated existing formatting/import-order issues outside the tracking-list change.
  - `pnpm lint`: blocked by unrelated formatting/lint issues in specimen and technical workflow test files; see `TECH_DEBT.md` TD-20260608-001.
- Latest slicing workstation validation in this thread:
  - `pnpm test:unit -- --run apps/web-ele/src/modules/technical-workflow/views/SlicingWorkstationView.test.ts apps/web-ele/src/modules/technical-workflow/components/SlicingProcessDialog.test.ts apps/web-ele/src/modules/technical-workflow/api/technical-workflow-service.test.ts`: passed on 2026-06-08 (3 files, 29 tests).
  - `pnpm check:type`: passed on 2026-06-08.
  - Targeted ESLint on changed slicing workflow frontend files passed on 2026-06-08.
  - `pnpm lint`: blocked by unrelated existing issues tracked in `TECH_DEBT.md` TD-20260608-001.

## Cross-Repo Dependencies

- Backend governance and memory files live in sibling repo `../SYBaseProject`.
- Backend `ApplicationPatientIdentityResolver` in `../SYBaseProject/bl-center` now normalizes display-style patient ages to leading digits when auto-creating patient registry rows, preventing DM numeric conversion failures from frontend application-number auto-create.
- Backend application list response `GET /api/v1/applications` in `../SYBaseProject/bl-center` now exposes `items[].pathologyNo`, sourced from `pathology_cases.pathology_no`.
- Backend technical registration list responses in `../SYBaseProject/bl-center` now include patient sex and age for this frontend display contract.
- Backend completion API `POST /api/v1/technical-specimen-registrations/{caseId}/complete` in `../SYBaseProject/bl-center` now accepts optional `pathologyNo`; non-empty candidates are strictly validated for selected application type and uniqueness, while empty candidates are generated server-side.
- Backend slicing API in `../SYBaseProject/bl-center` now exposes `POST /api/v1/slicings/slide-print`; successful backend print confirmation is the durable transition from print tab to slicing tab.
- Backend slicing workbench response now includes split `pendingPrintList` / `pendingSliceList` / `completedTodayList`, `applicationType`, `slidePrintStatus`, `printedSlideCount`, and `combinedSlide`.
- Backend technical task query `GET /api/v1/technical-tasks/pending` in `../SYBaseProject/bl-center` accepts optional `includeAllStatuses` and `taskId`; grossing/dehydration only use all-status lookup for explicit query/deep-link contexts.
- Backend specimen outbound query `GET /api/v1/specimen-outbounds` in `../SYBaseProject/bl-center` returns all-status records when `applicationId` or `specimenNo` is provided; ordinary frontend entry still avoids empty-condition loading.
- Backend check-in / transport APIs in `../SYBaseProject/bl-center` accept an omitted `operatorVerificationToken` only when the submitted operator user ID is the current request user; selected non-current operators still require verification.
- Backend `../SYBaseProject/bl-center` treats `specimens.barcode` as nullable until `POST /api/v1/specimens/{specimenId}/barcode-binding` writes `targetBarcode`; frontend M2 pages must treat null/blank barcode as `UNBOUND` and must not submit unbound specimens to barcode-based downstream operations.
- Cross-repo API, permission, database, patient, and report changes must update memory files in both repos when relevant.

## Handoff Notes

- Start future sessions by reading this file, `DECISIONS.md`, and `KNOWN_BUGS.md`, then inspect `git status`.
- Update memory files only when the task changes state, debt, bugs, decisions, or architecture.
