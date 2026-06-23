# SYBaseProjectWeb

`SYBaseProjectWeb` 是一个面向中后台与业务平台场景的前端工程基线仓库，采用 `Vben Admin 5.7.0 + Vue 3 + Vite + TypeScript + Pinia + Vue Router + Element Plus + Axios + TailwindCSS` 作为默认技术栈，用于统一团队的工程骨架、目录组织、编码约束、协作流程与发布要求。

## 项目定位

- 为新前端项目提供统一的 Vben Admin Element Plus 精简应用基线
- 为 AI 与人工协作提供同一套执行语境
- 为后续脚手架、模块开发、接口联调和发布验收提供唯一规范来源

当前工程保留 Vben monorepo 结构，目标应用为 `apps/web-ele`，本地 Mock 服务为 `apps/backend-mock`。项目文档仍以本仓库 `AGENTS.md` 与 `docs/` 下的规范为准，文档导航入口见 [docs/README.md](./docs/README.md)。

## 技术栈

- `Vben Admin 5.7.0`
- `Vue 3`
- `Vite`
- `TypeScript`
- `Pinia`
- `Vue Router`
- `Element Plus`
- `Axios`
- `TailwindCSS`
- `pnpm`

## 当前目录骨架

项目采用“Vben monorepo + Element Plus 应用 + 本项目协作规范”的双层结构：

```text
project-root
├── AGENTS.md
├── README.md
├── apps/
│   ├── backend-mock/
│   └── web-ele/
│       └── src/
│           ├── api/
│           ├── adapter/
│           ├── layouts/
│           ├── modules/
│           │   └── <domain>/
│           ├── router/
│           ├── store/
│           └── views/
├── docs/
├── internal/
├── packages/
└── scripts/
```

`apps/web-ele` 已按 Vben Thin 思路精简为 Element Plus 版本，保留登录、基础布局、异常页、用户信息、工作台和分析页；组件演示页、Vben 外链演示菜单、其他 UI 版本应用、Playground 与 Vben 文档应用不纳入本仓库。

业务开发仍遵循“应用壳 + 业务模块 + 共享能力”原则：新增业务域优先放在 `apps/web-ele/src/modules/<domain>`，共享能力再沉淀到 `packages/*` 或应用内共享目录。

命名示例：

- `apps/web-ele/src/modules/user-management/views/UserListView.vue`
- `apps/web-ele/src/modules/user-management/api/userService.ts`
- `apps/web-ele/src/modules/user-management/store/useUserFilterStore.ts`
- `apps/web-ele/src/modules/user-management/components/UserStatusTag.vue`

更完整说明见 [docs/rules/PROJECT_DIRECTORY.md](./docs/rules/PROJECT_DIRECTORY.md)。

## 推荐命令

以下命令约定后续脚手架和工程脚本统一使用 `pnpm`：

```bash
pnpm install
pnpm dev
pnpm dev:ele
pnpm build
pnpm build:ele
pnpm preview
pnpm lint
pnpm test:unit
```

## 任务启动与协作

仓库治理不再绑定特定任务平台。任务可以来自 issue、工单、卡片、PR、文档需求或会话交接，但开始实现前都应按统一起始模板补齐目标、验收标准、非目标、风险和 worktree 决策。

- 通用任务起始模板：[`docs/rules/TASK_INTAKE.md`](./docs/rules/TASK_INTAKE.md)
- worktree 隔离与 merge-back 规则：[`docs/rules/GIT_RULES.md`](./docs/rules/GIT_RULES.md)
- Workflow / Packet 规则：[`docs/rules/DYNAMIC_WORKFLOW_RULES.md`](./docs/rules/DYNAMIC_WORKFLOW_RULES.md)

若本地仍保留历史任务平台配置（例如被 `.gitignore` 忽略的私有文件），它们不再属于项目规范和仓库维护范围。

开发环境默认保留 `apps/backend-mock`，`apps/web-ele/.env.development` 中 `VITE_NITRO_MOCK=true`，用于本地登录、菜单和基础页面联调。

数据库联调与表结构资料统一归档在 [docs/reference/database/README.md](./docs/reference/database/README.md)。`scripts/` 目录只放可执行脚本，不放纯资料型 SQL。

## 规范文档索引

- [AGENTS.md](./AGENTS.md)
- [docs/README.md](./docs/README.md)
- [docs/rules/PROJECT_DIRECTORY.md](./docs/rules/PROJECT_DIRECTORY.md)
- [docs/rules/CODING_RULES.md](./docs/rules/CODING_RULES.md)（含 AI 健康度附录）
- [docs/rules/FRONTEND_RULES.md](./docs/rules/FRONTEND_RULES.md)
- [docs/rules/GIT_RULES.md](./docs/rules/GIT_RULES.md)
- [docs/rules/DYNAMIC_WORKFLOW_RULES.md](./docs/rules/DYNAMIC_WORKFLOW_RULES.md)
- [docs/rules/LOOP_ENGINEERING_RULES.md](./docs/rules/LOOP_ENGINEERING_RULES.md)
- [docs/rules/AGENT_SKILL_ROUTING.md](./docs/rules/AGENT_SKILL_ROUTING.md)
- [docs/rules/TASK_INTAKE.md](./docs/rules/TASK_INTAKE.md)
- [docs/rules/RELEASE.md](./docs/rules/RELEASE.md)

> 完整文档导航（含分类目录与模板）见 [docs/README.md](./docs/README.md)。

## 后续工程建议顺序

1. 基础工程：基于 `apps/web-ele` 继续维护 Element Plus 应用壳
2. 路由壳：在 Vben 路由体系内维护布局、菜单、权限元信息与异常页
3. 状态层：区分 Vben 全局 store、项目全局 store 与模块内 store
4. API 层：基于 `apps/web-ele/src/api/request.ts` 统一扩展请求与错误处理
5. 页面模块：按业务域逐步落地页面、组件、图表与样式规范

## 关联说明

- 本仓库参考 `SYBaseProject` 的文档结构与治理方式
- 所有规范均已按前端技术栈重写，不沿用 Java / Spring / Maven 语义
- Vben 上游源码参考 `/Users/hsy/Downloads/vue-vben-admin-main`
- 后续若生成脚手架或代码模板，必须同时遵循 Vben 结构与本仓库规范
