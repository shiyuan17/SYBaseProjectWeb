# M2 临床送检 E2E

本目录提供 `M2 临床送检` 的本地联调版 Playwright E2E 套件，运行目标是：

- `apps/web-ele`
- `auth-center`
- `bl-center`

当前首批覆盖：

- 主链路：申请创建 -> 标本登记 -> 固定核对 -> 转运交接 -> 标本接收 -> 追踪查询
- 异常链：部分接收 / 拒收后追踪异常确认

## 运行前提

本套件不使用前端 mock。原因是当前 mock 用户不具备 M2 权限，无法覆盖真实岗位流程。

请先启动本地联调环境：

```bash
pnpm dev:ele
.\scripts\dev\run-auth-center-dev.cmd
.\scripts\dev\run-bl-center-dev.cmd
```

## 环境变量

支持以下环境变量，均可在执行命令前覆盖：

```bash
E2E_BASE_URL=http://localhost:5777
E2E_AUTH_BASE_URL=http://localhost:8081
E2E_BL_BASE_URL=http://localhost:8080
E2E_PASSWORD=123456

E2E_USER_ADMIN=m1.admin
E2E_USER_CREATOR=m2.admin
E2E_USER_REGISTER=m2.register
E2E_USER_FIXATION=m2.fixation
E2E_USER_TRANSPORT=m2.transport
E2E_USER_RECEIVE=m2.receive
E2E_USER_TRACKING=m2.tracking
E2E_USER_M6=m6.admin
```

## 执行命令

```bash
pnpm test:e2e
```

默认认证策略为 `api`：E2E 会直接调用认证接口生成 `.auth/*.json`，不再依赖登录页滑块。

如需专项回归真实登录页滑块，可显式切回 UI 认证链路：

```bash
pnpm test:e2e:ui-auth
```

也可手动指定：

```bash
cross-env E2E_AUTH_STRATEGY=ui playwright test -c playwright.config.ts --project=chromium tests/e2e/smoke/login-ui-auth.spec.ts
```

## 认证刷新

- 首次执行 `pnpm test:e2e` 时，Playwright 会先跑 `auth.setup` 生成 `tests/e2e/.auth/*.json`。
- `auth.setup` 会刷新手册与关键 E2E 需要的完整角色集合：`admin`、`m6`、`creator`、`register`、`fixation`、`transport`、`receive`、`tracking`。
- 如页面频繁跳回登录页、手册捕获出现 `auth_failed` 占位、或怀疑登录态过期，可单独刷新：

```bash
pnpm exec playwright test -c playwright.config.ts --project=auth-setup
```

- 如仍异常，可先删除 `tests/e2e/.auth/*.json` 再重新执行上面的 `auth-setup`。
- 默认策略是 `api-then-ui`：优先复用 API 登录态，若检测到登录页/令牌过期/滑块页，再自动切换到 UI 滑块登录兜底。
- `E2E_AUTH_STRATEGY=ui` 只用于回归真实登录页/滑块链路，不建议作为日常手册捕获默认模式。

常用附加命令：

```bash
pnpm exec playwright test -c playwright.config.ts --list
pnpm exec playwright test -c playwright.config.ts tests/e2e/specimen-workflow/happy-path.spec.ts
pnpm exec playwright test -c playwright.config.ts --project=chromium --headed
```

本地浏览器/仿真验证可直接生成已登录态并打开受保护页面：

```bash
pnpm e2e:open -- --role register --path /workflow/submission-registration
pnpm e2e:open -- --role receive --path /workflow/specimen-management?action=receive
pnpm e2e:open -- --role m6 --path /analytics --base-url http://localhost:5777
```

如只想刷新会话文件、不自动打开浏览器：

```bash
pnpm e2e:open -- --role register --print-only
pnpm e2e:open -- --role m6 --path /analytics --base-url http://localhost:5777 --print-only
```

## 设计约束

- 使用 `tests/e2e/.auth/` 缓存各岗位登录态。
- 默认缓存由 API 登录生成；仅登录页专项 smoke 才继续走真实滑块。
- 所有测试数据都带唯一编号，避免依赖清库。
- 不做数据库回滚；失败后允许残留业务数据，但后续运行仍应可继续。
- 当前阶段不覆盖第三方导入成功链，只保留后续扩展位。
- 失败时自动保留 `trace`、`video`、`screenshot`。

## 用户手册生成

Playwright 用户操作手册继续输出到 `docs/user-manual/`，但生成流程拆成两段：

- `pnpm manual:capture` 将截图、`.capture-manifest.json`、`capture-errors.log` 先写入 `docs/user-manual/.generated/`
- `pnpm manual:gen` 读取 `.generated/` 内的中间产物，渲染 Markdown 后整体同步到 `docs/user-manual/`
- `pnpm manual:build` 串联执行以上两步

常用命令：

```bash
pnpm manual:capture
pnpm manual:gen
pnpm manual:build
```

维护约定：

- 手册模块、静态页面、文案说明统一维护在 `tests/e2e/manual/manual-spec.mjs`
- `tests/e2e/manual/capture-handbook.spec.ts` 负责截图捕获与真实业务链路
- `scripts/generate-user-manual.mjs` 只负责渲染与目录同步
- 新增模块页面时，优先更新 `manual-spec.mjs`，再补必要 POM 或步骤逻辑
- 生成器应保持向后兼容：即使某些步骤未捕获、捕获失败或认证失效，也要继续生成骨架页，并通过占位文案 + `capture-errors.log` 暴露问题

## 手册排障路径

- 第一步看 `docs/user-manual/capture-errors.log`：这里会记录 `capture_failed`、`auth_failed` 等失败线索。
- 第二步看 `test-results/`、`playwright-report/`：确认是哪一步骤、哪一页失败。
- 第三步看 `.logs/frontend.log`、`.logs/backend.log`：排查页面、鉴权、接口或联调服务异常。
- 若某模块只生成占位文案而没有截图，优先检查登录态是否刷新、当前账号是否具备页面权限、以及捕获步骤是否成功写入 manifest。

## 失败产物

默认产物目录：

- `playwright-report/`
- `test-results/`

关键步骤会输出 `applicationNo`、`barcode`、`transportOrderNo` 到测试日志，便于联调回查。
