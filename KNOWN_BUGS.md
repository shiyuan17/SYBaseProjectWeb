# KNOWN_BUGS.md

## Purpose

Track known frontend bugs and reproducible failures that future agents should not rediscover from scratch.

## Entry Format

| ID | Status | Reproduction | Impact | Workaround | Verification |
| --- | --- | --- | --- | --- | --- |
| BUG-20260608-001 | Resolved | 染色出片工作站选中病例后，已完成出片表格的“切片操作”“出片操作”在无操作人/时间时会把后端追踪状态 `qualityStatus=CREATED`、`slideStatus=PENDING` 原样显示为英文。后端来源核对：`../SYBaseProject/bl-center/src/main/java/com/company/bl/application/service/TechnicalProcessingWorkflowService.java` 创建玻片时写入 `PENDING`/`CREATED`。 | 操作列出现英文枚举，影响工作站中文界面一致性和用户识读。 | 无需后端规避；前端展示层通过状态映射本地化。 | Fixed in `apps/web-ele/src/modules/technical-workflow/utils/format.ts` and covered by `apps/web-ele/src/modules/technical-workflow/views/StainingWorkstationView.test.ts`; `pnpm test:unit -- --run apps/web-ele/src/modules/technical-workflow/views/StainingWorkstationView.test.ts`, `pnpm check:type`, `pnpm lint` passed on 2026-06-08. |
| BUG-20260608-002 | Resolved | 诊断分片页选择左侧用户并勾选右侧待分派任务后点击“初步分片”，当任务本身尚无责任医生/审核医生时，前端提示“选中任务缺少接口必填医生字段，已全部跳过”。后端契约核对：`../SYBaseProject/bl-center/src/main/java/com/company/bl/interfaces/dto/AssignDiagnosticTaskRequest.java` 对责任诊断医生、初诊医生、审核医生三组字段均要求 `@NotBlank`。 | 空白待分派任务无法完成初步分片，批量操作被前端本地校验全部拦截。 | 无需后端规避；前端分片请求在保留已有医生的同时，用左侧选中医生补齐缺失必填医生字段。 | Fixed in `apps/web-ele/src/modules/doctor-workflow/views/DiagnosisAssignmentView.vue` and covered by `apps/web-ele/src/modules/doctor-workflow/views/doctor-workflow-visibility.test.ts`; `pnpm test:unit -- --run apps/web-ele/src/modules/doctor-workflow/views/doctor-workflow-visibility.test.ts`, `pnpm check:type`, `pnpm lint` passed on 2026-06-08. |
| BUG-20260608-003 | Resolved | 医生工作站中 HE 染色医嘱执行收费后，右侧医嘱区显示“已收费”，但常规医嘱工作站列表未显示该记录。后端核对：`../SYBaseProject/bl-center/src/main/resources/db/migration/V2__seed_m1_reference_data.sql` 中旧字典 `ODI_HE` 位于 `ODC_ROUTINE`，分类码为 `ROUTINE`；`../SYBaseProject/bl-center/src/main/resources/db/migration/V77__seed_medical_order_dictionary_catalog.sql` 中新字典 `ODI_CGRS_HE_STAIN` 位于 `CGRS`。前端常规工作站原查询 `EXAM,CGRS,BLOCK,QP` 漏掉旧分类 `ROUTINE`；后端 `JdbcMedicalOrderRepository` 默认查询 `PENDING/IN_PROGRESS`，收费只更新 `billing_status`，不应从常规待办消失。 | 旧字典“常规医嘱”下创建的 HE 染色医嘱被常规工作站查询参数排除，影响收费后执行确认。 | 无需后端规避；前端常规医嘱工作站同时查询 `ROUTINE,EXAM,CGRS,BLOCK,QP`，并展示 `billingStatus`。 | Fixed in `apps/web-ele/src/modules/technical-workflow/utils/medical-order-workstation.ts` and `apps/web-ele/src/modules/technical-workflow/utils/technical-order-workstations.ts`; covered by `apps/web-ele/src/modules/technical-workflow/utils/medical-order-workstation.test.ts` and `apps/web-ele/src/modules/technical-workflow/views/TechnicalOrderWorkstationsView.test.ts`; targeted vitest, `pnpm lint`, and `pnpm check:type` passed on 2026-06-08. |
| BUG-20260608-004 | Resolved | 常规医嘱工作站“医嘱时间”列显示不完整，秒级时间被前端映射截断或因列宽不足换行；其他医嘱页面的 `orderDate` 展示格式也不统一。 | 医嘱执行人员无法直接读取完整开单时间，跨页面查看同一医嘱时间时格式不一致。 | 无需后端规避；前端统一将 `orderDate` 展示为 `YYYY-MM-DD HH:mm:ss`，并加宽常规医嘱工作站“医嘱时间”列。 | Fixed in `apps/web-ele/src/modules/technical-workflow/utils/medical-order-workstation.ts`, `apps/web-ele/src/modules/technical-workflow/utils/technical-order-workstations.ts`, `apps/web-ele/src/modules/doctor-workflow/utils/format.ts`, and `apps/web-ele/src/modules/doctor-workflow/views/ReportTrackingView.vue`; covered by technical order workstation tests and doctor workflow visibility tests. |

## Update Rules

- Record only concrete, reproducible, or user-reported bugs.
- Keep production issues linked to logs, reproduction steps, and regression tests.
- Move fixed bugs to a resolved status instead of deleting them.
