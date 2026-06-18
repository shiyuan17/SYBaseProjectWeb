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
E2E_BASE_URL=http://localhost:5778
E2E_AUTH_BASE_URL=http://localhost:8081
E2E_BL_BASE_URL=http://localhost:8080
E2E_PASSWORD=123456

E2E_USER_CREATOR=m2.admin
E2E_USER_REGISTER=m2.register
E2E_USER_FIXATION=m2.fixation
E2E_USER_TRANSPORT=m2.transport
E2E_USER_RECEIVE=m2.receive
E2E_USER_TRACKING=m2.tracking
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
```

如只想刷新会话文件、不自动打开浏览器：

```bash
pnpm e2e:open -- --role register --print-only
```

## 设计约束

- 使用 `tests/e2e/.auth/` 缓存各岗位登录态。
- 默认缓存由 API 登录生成；仅登录页专项 smoke 才继续走真实滑块。
- 所有测试数据都带唯一编号，避免依赖清库。
- 不做数据库回滚；失败后允许残留业务数据，但后续运行仍应可继续。
- 当前阶段不覆盖第三方导入成功链，只保留后续扩展位。
- 失败时自动保留 `trace`、`video`、`screenshot`。

## 失败产物

默认产物目录：

- `playwright-report/`
- `test-results/`

关键步骤会输出 `applicationNo`、`barcode`、`transportOrderNo` 到测试日志，便于联调回查。
