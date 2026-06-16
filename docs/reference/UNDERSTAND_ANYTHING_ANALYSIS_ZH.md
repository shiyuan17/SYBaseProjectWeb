# understand-anything 中文分析报告

## 项目概览

`SYBaseProjectWeb` 是一个面向中后台与业务平台的 Vue 3 前端 monorepo，主应用位于 `apps/web-ele`，本地联调 mock 服务位于 `apps/backend-mock`。仓库整体延续 Vben Admin 的工程组织方式，但业务已经明显收敛到病理全流程管理场景。

## 扫描结论

- 总文件数：1352
- 复杂度：very-large
- 主要语言：TypeScript、Vue、JSON、Markdown
- 主要框架：Vue、Vite、Vitest、TailwindCSS
- 项目内导入边：467
- 存在内部依赖的文件：253

## 关键结构

### 启动链路

- [apps/web-ele/src/main.ts](../../apps/web-ele/src/main.ts) 负责偏好设置初始化、命名空间迁移和应用启动
- [apps/web-ele/src/bootstrap.ts](../../apps/web-ele/src/bootstrap.ts) 负责挂载 Vue 应用、注册指令、i18n、Pinia、路由和动画插件

### 路由与权限

- [apps/web-ele/src/router/index.ts](../../apps/web-ele/src/router/index.ts) 创建路由实例并安装守卫
- [apps/web-ele/src/router/guard.ts](../../apps/web-ele/src/router/guard.ts) 统一处理登录态、权限码、动态路由和跳转回流
- [apps/web-ele/src/router/routes/index.ts](../../apps/web-ele/src/router/routes/index.ts) 通过 `import.meta.glob` 聚合模块路由
- [apps/web-ele/src/api/core/menu-mapper.ts](../../apps/web-ele/src/api/core/menu-mapper.ts) 是菜单与后端路由映射的核心文件

### 请求与认证

- [apps/web-ele/src/api/request.ts](../../apps/web-ele/src/api/request.ts) 统一封装请求客户端、鉴权拦截和错误提示
- [apps/web-ele/src/store/auth.ts](../../apps/web-ele/src/store/auth.ts) 管理登录、登出、用户信息和登录后跳转

### 业务模块

当前业务模块已经按领域拆分，且以 `modules/*` 为主：

- `specimen-workflow`：体量最大，覆盖临床送检主链路
- `technical-workflow`：制片管理与各工位任务流
- `doctor-workflow`：诊断分配、工作台、报告与修订
- `system-management`：用户、角色、科室、字典和配置
- `operation-support`：归档运营、台账和预警
- `m6-management` / `m6-statistics`：集成与统计
- `dashboard`：跨域工作台聚合页
- `notification-center`：通知中心

### Mock 联调层

- [apps/backend-mock/README.md](../../apps/backend-mock/README.md) 说明 mock 服务随前端一起启用
- [apps/backend-mock/nitro.config.ts](../../apps/backend-mock/nitro.config.ts) 配置了 Nitro 路由规则与跨域头

## 重点判断

1. 这个仓库不是通用 UI 示例，而是围绕病理业务流程重构过的行业前端。
2. 路由、菜单、权限和模块数据之间耦合较深，后续改动应优先检查映射关系。
3. `specimen-workflow` 是当前最重的业务域，`dashboard` 又强依赖多个域的汇总接口。
4. `apps/backend-mock` 对本地开发很关键，很多前端流程默认依赖它。
5. 共享层与业务层边界整体清晰，但 `menu-mapper.ts` 这类文件已经成为高维护成本点。

## 风险提示

- 动态路由和权限生成逻辑比较敏感，改动前要确认菜单、权限码和默认首页跳转。
- `dashboard` 聚合了多个业务域的数据，任何一个域接口变化都可能影响首页展示。
- `specimen-workflow` 规模最大，重构时最容易引入路由遗漏或菜单错配。
- 当前分析结果已足够支撑架构梳理，但尚未补齐完整 `knowledge-graph.json`。

## 结论

从 understand-anything 的扫描结果看，这个仓库已经形成了“应用壳 + 业务模块 + 共享能力 + 本地 mock”的稳定分层，后续最值得优先治理的是路由/菜单映射、权限链路和跨域聚合页。
