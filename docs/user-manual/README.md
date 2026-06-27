# 用户操作手册

本手册由 Playwright 驱动 `apps/web-ele` 真实页面捕获截图后自动生成，覆盖病理系统全模块。

## 生成方式

```bash
# 1. 启动本地联调环境（web-ele + auth-center + bl-center）
#    pnpm dev:ele
#    ./scripts/dev/run-auth-center-dev.cmd
#    ./scripts/dev/run-bl-center-dev.cmd

# 2. 生成各岗位登录态（首次或 tests/e2e/.auth 过期时）
#    pnpm test:e2e 会自动跑 auth.setup 生成 .auth/*.json；
#    也可单独：pnpm exec playwright test -c playwright.config.ts --project=auth-setup

# 3. 捕获截图 + 生成手册
pnpm manual:build
```

也可分步执行：`pnpm manual:capture`（仅捕获）与 `pnpm manual:gen`（仅渲染 Markdown）。

> M2 临床送检走真实业务链路（含真实数据流转）；其余模块为登录后静态页截图，画面可能为空态。

## 模块索引

- [仪表盘](dashboard.md)：病理看板与个人工作台，聚合当日标本流转、诊断进度与异常指标。
- [M2 临床送检](m2-specimen-workflow.md)：临床标本送检全链路：申请创建 → 标本登记 → 固定核对 → 转运交接 → 标本接收 → 追踪查询，含部分接收/拒收异常链。
- [M4 诊断管理](m4-doctor-workflow.md)：诊断分配、诊断平台工作站、病理报告、报告追踪、病理医嘱执行、报告修订、会诊管理。
- [M5 归档与借记 / 设备及试剂](m5-operation-support.md)：归档管理、借记管理、仪器设备、试剂耗材、医疗废物管理。
- [M6 数据统计与分析](m6-statistics.md)：统计仪表盘、质控指标、管理指标、统计报表工作台。
- [M1 系统管理](m1-system.md)：用户、角色、科室/部位字典、医嘱字典/收费/套餐、描写模板、取材规范、系统配置、编号规则、日志。

## 维护约定

- 截图产物位于 `images/<module>/`（已 gitignore，可重新生成），手册正文位于各 `<module>.md`（入库）。
- 重跑 `pnpm manual:build` 会覆盖 Markdown 正文与截图，不保留历史；如需留存请手动归档。
- 捕获脚本与静态页清单维护在 `tests/e2e/manual/capture-handbook.spec.ts`；模块元数据与操作说明维护在 `scripts/generate-user-manual.mjs`。
- 新增模块页面时，同步更新上述两处的 `STATIC_PAGES` 与 `MODULE_META` / `STATIC_OPERATIONS`。

## 与其他文档的关系

- 联调运行前置与 E2E 约定见 [tests/e2e/README.md](../../tests/e2e/README.md)。
- 现场演练岗位 SOP 见 [docs/acceptance/phase1_5/](../acceptance/phase1_5/README.md)。
- 业务流程总览见 [docs/acceptance/M1_M6_BUSINESS_PROCESS_GUIDE.html](../acceptance/M1_M6_BUSINESS_PROCESS_GUIDE.html)。
