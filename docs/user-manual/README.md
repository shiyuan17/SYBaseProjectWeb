# 用户操作手册

本手册由 Playwright 驱动 `apps/web-ele` 真实页面捕获截图后自动生成，按模块 SOP 结构输出页面入口、关键操作与截图组。

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

## 认证刷新

- 默认走 `api-then-ui`：先尝试 API 登录态，若检测到登录页/令牌过期/滑块页，再自动切换到 UI 滑块登录兜底。
- 可单独刷新登录态：`pnpm exec playwright test -c playwright.config.ts --project=auth-setup`。
- 如发现 `tests/e2e/.auth/*.json` 过期、总是被重定向回登录页，先重新执行 `auth-setup`；必要时删除旧 `.auth/*.json` 后再刷新。
- 如需强制回归真实登录页与滑块链路，可设置 `E2E_AUTH_STRATEGY=ui`，例如 `cross-env E2E_AUTH_STRATEGY=ui pnpm manual:capture`。

## 产物与排障

- `pnpm manual:capture`：更新 `docs/user-manual/.generated/.capture-manifest.json`、`docs/user-manual/.generated/images/` 与 `docs/user-manual/.generated/capture-errors.log`，不改 Markdown 正文。
- `pnpm manual:gen`：读取 `.generated/` 中间产物，生成/覆盖 `docs/user-manual/README.md` 与各模块 `<module>.md`；即使模块未捕获，也会输出 SOP 骨架页。
- `pnpm manual:build`：串行执行 `manual:capture` + `manual:gen`，用于完整重建手册。
- 排障优先看 `docs/user-manual/capture-errors.log`，再看 `test-results/`、`playwright-report/` 与 `.logs/frontend.log` / `.logs/backend.log`。若模块页只出现占位文案，先确认登录态、页面权限与捕获步骤是否成功写入 manifest。

> M2 临床送检可继续沿用真实业务链路截图；静态模块统一按“模块 → 一级章节 → 二级操作节 → 截图组”渲染。

## 模块索引

- [仪表盘](dashboard.md)：病理看板与个人工作台，聚合当日标本流转、诊断进度与异常指标。 流程：病理看板总览 -> 个人工作台待办 -> 岗位快捷入口
- [M2 临床送检](m2-specimen-workflow.md)：临床标本送检全链路：申请创建 -> 标本登记 -> 固定核对 -> 转运交接 -> 标本接收 -> 追踪查询，含部分接收/拒收异常链。 流程：申请创建 -> 标本登记 -> 固定核对 -> 转运交接 -> 标本接收 -> 追踪查询
- [M3 制片管理](m3-technical-workflow.md)：制片管理承接标本接收后的实验室内部生产流程，覆盖技术登记、任务调度、取材、脱水、包埋、切片、染色出片与技术追踪。 流程：标本接收 -> 标本登记 -> 任务调度 -> 取材描写 -> 脱水 -> 包埋 -> 切片 -> 染色出片 -> 技术追踪
- [M4 诊断管理](m4-doctor-workflow.md)：诊断管理围绕任务分配、诊断工作站、报告管理、追踪、医嘱执行、报告修订与会诊协作展开。 流程：诊断分配 -> 诊断平台工作站 -> 病理报告 -> 报告追踪 -> 病理医嘱执行 -> 报告修订 -> 会诊管理
- [M5 归档与借记 / 设备及试剂管理](m5-operation-support.md)：M5 覆盖归档与借记台账，以及仪器设备、试剂耗材和医疗废物等资源管理能力。 流程：归档管理 -> 借记管理 -> 仪器设备管理 -> 试剂耗材管理 -> 医疗废物管理
- [M6 数据统计与分析](m6-statistics.md)：M6 提供病理质控、运营和工作量分析能力，支撑统计驾驶舱与报表工作台。 流程：统计仪表盘 -> 质控指标统计 -> 管理指标统计 -> 统计报表工作台
- [M1 系统管理](m1-system.md)：系统管理覆盖用户权限、基础字典、业务模板、系统参数、编号规则与日志追踪等配置能力。 流程：系统用户 -> 角色授权 -> 基础字典 -> 业务模板与规范 -> 系统配置 -> 编号规则 -> 日志管理

> ⚠️ 本次捕获存在失败步骤，详见 [capture-errors.log](./capture-errors.log)。

## 维护约定

- 截图产物位于 `images/<module>/`（已 gitignore，可重新生成），手册正文位于各 `<module>.md`（入库）。
- `pnpm manual:capture` 先写入 `docs/user-manual/.generated/`，`pnpm manual:gen` 验证并同步到正式目录，避免留下半生成状态。
- 手册元数据单一来源位于 `tests/e2e/manual/manual-spec.mjs`；新增模块页面时优先更新这里，再补必要 POM/捕获逻辑。
- `capture-handbook.spec.ts` 负责截图捕获，`generate-user-manual.mjs` 仅负责渲染与同步。
- 新增 manifest 字段时优先保持向后兼容：即使旧数据只有 `caption/name/order/image`，生成器也应继续输出手册；失败状态需通过节级占位与 `capture-errors.log` 暴露。

## 与其他文档的关系

- 联调运行前置与 E2E 约定见 [tests/e2e/README.md](../../tests/e2e/README.md)。
- 现场演练岗位 SOP 见 [docs/acceptance/phase1_5/](../acceptance/phase1_5/README.md)。
- 业务流程总览见 [docs/acceptance/M1_M6_BUSINESS_PROCESS_GUIDE.html](../acceptance/M1_M6_BUSINESS_PROCESS_GUIDE.html)。
