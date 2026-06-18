# FRONTEND_RULES.md — 前端实现规范（合并版）

本文件为前端实现规范（Vue/TS、UI、状态、路由、API、测试、兼容）。目录边界见 `PROJECT_DIRECTORY.md`；编码与验证命令见 `CODING_RULES.md`。

## Vue / TypeScript / 组件

- 新代码统一 `script setup + TypeScript`；`props` / `emits` / 公开类型必须明确
- 页面组装、组合式函数封装行为；共享组件保持业务无关，不直接依赖模块 store
- 类型分层：DTO / ViewModel / Props 不混用；避免 `any` 与宽泛断言
- 模板避免复杂表达式；副作用、定时器、图表实例在卸载时清理
- 现有页面默认 `Page` 传 `show-header=false`（见 `DEC-20260610-003`）

## UI / 样式 / 图表

- Element Plus（交互）、Tailwind（布局）、ECharts（图表）职责分离
- 主题与 token：`packages/styles/src/ele/index.css`、`packages/styles/src/global/index.scss`；品牌覆盖在 `apps/web-ele/src/preferences.ts` / `preferences-branding.ts`；**不存在** `apps/web-ele/src/styles` 统一目录
- 设计 token 复用 Vben preferences / `use-design-tokens`，不新建平行 token 体系
- 表单/表格/弹窗/空态/加载态/错误态需可区分；危险操作需确认
- ECharts 统一主题与 `dispose`；大数据量需降级策略

## Pinia 状态

- 全局 store：`apps/web-ele/src/store`；模块 store：`src/modules/<domain>/store`
- 组件局部临时态不上提；store 不长期持有未整理的原始接口响应
- 持久化白名单；异步 action 处理竞态与失败；避免 store 循环依赖

## 路由

- 路由在 `src/router`；路径小写短横线；`meta` 承载标题、权限、缓存
- 守卫只做登录/权限/导航准入，不编排业务请求
- 懒加载使用 `withRouteComponentReloadRetry` 模式（技术流程/诊断工作站已接入）
- 禁止页面散落硬编码路径

## API / 请求

- 统一 Axios 实例；业务 API 放模块 `api/`
- 分页：`page` / `size`；错误区分网络/权限/业务；页面级错误保留业务语境
- 通过 mapper 转 ViewModel，不长期依赖后端原始结构
- 上传/下载/导出处理文件名编码与失败反馈

## 测试

| 层   | 工具           | 位置                           |
| ---- | -------------- | ------------------------------ |
| 单测 | Vitest `--dom` | 同目录 `*.test.ts`             |
| E2E  | Playwright     | `tests/e2e/smoke/`、业务子目录 |

- 能在单测验证的不靠 E2E；mock 契约以后端 `SYBaseProject` 为准，变更时同步 backend-mock 与单测
- 不得删/skip 测试过关；缺陷修复补回归测试（触发条件见 `CODING_RULES.md` §6）
- Workflow 对应验证组合见 `DYNAMIC_WORKFLOW_RULES.md`

## 浏览器 / 导出 / 兼容

- 管理台覆盖现代 Chromium；国产环境按需补充验证记录
- `ResizeObserver`、剪贴板、打印等能力需评估降级
- 时间展示显式时区/格式；`CSV`/`TXT` 默认 UTF-8（无 BOM）
- 下载验证中文文件名；打印/导出失败需用户可理解的提示

## 关联文档

- [../../AGENTS.md](../../AGENTS.md)
- [./PROJECT_DIRECTORY.md](./PROJECT_DIRECTORY.md)
- [./CODING_RULES.md](./CODING_RULES.md)
- [./DYNAMIC_WORKFLOW_RULES.md](./DYNAMIC_WORKFLOW_RULES.md)
