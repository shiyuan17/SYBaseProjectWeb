# M4 诊断管理

诊断分配、诊断平台工作站、病理报告、报告追踪、病理医嘱执行、报告修订、会诊管理。

> 本模块截图未捕获。请先运行 `pnpm manual:capture`（需本地联调环境在线）。

## /doctor-workflow/assignment

- 主要操作：查询待分派任务；选择医生；勾选任务后「初步分片」或「签发分片」。

## /doctor-workflow/workbench

- 主要操作：查询队列并选择任务；编辑报告；「保存/初步/复核/签发」并选择发放模式；采图、查看医嘱/会诊/历史病理。

## /doctor-workflow/report

- 主要操作：按病例/病理号查询报告；对已审核报告「驳回」；对已签发报告「发布」；批量打印/发放/回收正式版本。

## /doctor-workflow/tracking

- 主要操作：查询病例；查看全局生命周期时间线与对象追踪明细；跳转诊断工作台/报告/医嘱。

## /doctor-workflow/medical-orders

- 主要操作：按病理号/状态查询医嘱；「确认」「打印玻片」「出片」「取消」。

## /doctor-workflow/revision

- 主要操作：查询病例；对当前报告「发起修订申请」；对修订申请「审批通过/驳回」。

## /doctor-workflow/consultation

- 主要操作：查询病例；「发起会诊」添加参与人；「录入参与人意见」；「完成会诊」。

