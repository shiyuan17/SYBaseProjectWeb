# SYBaseProjectWeb

`SYBaseProjectWeb` 是一个面向中后台与业务平台场景的前端工程规范基线仓库，采用 `Vue 3 + Vite + TypeScript + Pinia + Vue Router + Element Plus + Axios + ECharts + TailwindCSS` 作为默认技术栈，用于统一团队的目录组织、编码约束、协作流程与发布要求。

## 项目定位

- 为新前端项目提供统一的工程治理基线
- 为 AI 与人工协作提供同一套执行语境
- 为后续脚手架、模块开发、接口联调和发布验收提供唯一规范来源

当前阶段仅交付规范体系，不包含脚手架代码、依赖安装或页面实现。

## 技术栈

- `Vue 3`
- `Vite`
- `TypeScript`
- `Pinia`
- `Vue Router`
- `Element Plus`
- `Axios`
- `ECharts`
- `TailwindCSS`
- `pnpm`

## 推荐目录骨架

项目默认采用“应用壳 + 业务模块 + 共享能力”的业务模块化结构：

```text
project-root
├── AGENTS.md
├── README.md
├── docs/
├── public/
├── mock/
├── tests/
└── src/
    ├── app/
    ├── modules/
    │   └── <domain>/
    │       ├── api/
    │       ├── components/
    │       ├── store/
    │       ├── types/
    │       └── views/
    ├── router/
    ├── shared/
    ├── stores/
    └── styles/
```

命名示例：

- `src/modules/user-management/views/UserListView.vue`
- `src/modules/user-management/api/userService.ts`
- `src/modules/user-management/store/useUserFilterStore.ts`
- `src/shared/components/BasePageHeader.vue`

更完整说明见 [docs/PROJECT_DIRECTORY.md](./docs/PROJECT_DIRECTORY.md)。

## 初始化后推荐命令

以下命令约定后续脚手架和工程脚本统一使用 `pnpm`：

```bash
pnpm install
pnpm dev
pnpm build
pnpm preview
pnpm lint
pnpm test
```

## 规范文档索引

- [AGENTS.md](./AGENTS.md)
- [docs/PROJECT_DIRECTORY.md](./docs/PROJECT_DIRECTORY.md)
- [docs/CODING_RULES.md](./docs/CODING_RULES.md)
- [docs/VUE_TS_RULES.md](./docs/VUE_TS_RULES.md)
- [docs/STATE_RULES.md](./docs/STATE_RULES.md)
- [docs/ROUTER_RULES.md](./docs/ROUTER_RULES.md)
- [docs/API_RULES.md](./docs/API_RULES.md)
- [docs/UI_RULES.md](./docs/UI_RULES.md)
- [docs/COMPATIBILITY_RULES.md](./docs/COMPATIBILITY_RULES.md)
- [docs/GIT_RULES.md](./docs/GIT_RULES.md)
- [docs/RELEASE.md](./docs/RELEASE.md)

## 后续工程建议顺序

1. 基础工程：初始化 `Vite + Vue 3 + TypeScript + pnpm`
2. 路由壳：搭建 `app`、`router`、布局骨架与权限元信息
3. 状态层：确定 Pinia 全局 store 与模块 store 边界
4. API 层：建立 Axios 实例、错误处理、类型与 ViewModel 转换
5. 页面模块：按业务域逐步落地页面、组件、图表与样式规范

## 关联说明

- 本仓库参考 `SYBaseProject` 的文档结构与治理方式
- 所有规范均已按前端技术栈重写，不沿用 Java / Spring / Maven 语义
- 后续若生成脚手架或代码模板，必须以本仓库规范为准
