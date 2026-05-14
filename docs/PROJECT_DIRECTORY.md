# PROJECT_DIRECTORY.md — 项目目录规范

## 目标与适用范围

本文件定义 `SYBaseProjectWeb` 的目录结构、模块边界与命名约定。

- 适用对象：前端开发者、架构设计者、AI 助手
- 适用范围：Vue 3 管理台、业务平台、可视化页面及其工程初始化
- 规范定位：统一目录骨架，约束“代码放在哪里”和“边界怎么拆”

## 强制规则

### 1. 根目录基线

根目录默认建议包含以下目录：

- `src/`
- `public/`
- `docs/`
- `mock/`
- `tests/`

必要的工程文件按脚手架落地，例如：

- `package.json`
- `pnpm-lock.yaml`
- `tsconfig.json`
- `vite.config.ts`
- `tailwind.config.ts`
- `.env.*`

### 2. `src/` 组织方式

`src/` 必须采用“应用壳 + 业务模块 + 共享能力”模式：

- `src/app`：应用启动、全局 provider、入口装配、全局错误处理、全局样式注册
- `src/modules/<domain>`：按业务域组织页面、组件、模块内 store、模块内 API、类型与转换逻辑
- `src/shared`：通用组件、组合式函数、工具、常量、类型、权限能力
- `src/router`：路由注册、守卫装配、导航元信息处理
- `src/stores`：仅放全局级 Pinia store，例如用户会话、主题、布局状态
- `src/styles`：Tailwind 入口、设计 token、Element Plus 变量覆盖、全局样式

### 3. 模块目录契约

业务模块建议按以下结构组织：

```text
src/modules/<domain>/
├── api/
├── components/
├── store/
├── types/
├── utils/
└── views/
```

要求：

- 模块内组件优先放在模块目录，不要一开始就提到 `shared`
- 模块内 API 只服务当前业务域，不直接暴露为全局基础能力
- 模块内 store 只管理本域稳定状态，不承载临时弹窗或表单草稿

### 4. 命名约定

- 目录名：使用英文小写短横线，例如 `user-management`
- Vue 单文件组件：使用 `PascalCase`，页面以 `View` 结尾
- 组合式函数：使用 `useXxx.ts`
- Store：使用 `useXxxStore.ts`
- API 服务：使用 `xxxService.ts`
- 类型文件：使用 `xxx.ts` 或 `xxx.types.ts`

### 5. 禁止事项

- 禁止把所有页面堆到顶层 `views/`
- 禁止把所有接口堆到顶层 `api/`
- 禁止把所有类型堆到顶层 `types/`
- 禁止在 `src/router` 中直接写业务页面实现
- 禁止把共享层当作默认收纳箱，导致业务边界持续外溢

## 推荐实践

- 先按业务模块拆目录，再提炼共享能力
- 页面级逻辑优先靠模块内组合式函数和 store 消化，降低超大组件出现概率
- 在模块内保留 `types` 或 `mappers`，让后端响应模型与页面展示模型保持分层
- 在 `shared/components` 中只放真正跨域复用的组件

## 反例/禁用项

- 新项目一开始就只建 `components`、`views`、`api`、`store` 平铺目录
- 把 `ECharts` 配置、表单规则、接口 DTO、页面状态全部塞进同一个 `.vue` 文件
- 为了图省事在多个业务模块间互相直接引用内部实现
- 共享组件绑死某个业务域字段命名，表面通用、实际耦合

## 检查清单

- [ ] 根目录包含规范要求的核心目录
- [ ] `src/` 采用业务模块化结构
- [ ] 全局 store 与模块 store 边界清晰
- [ ] 路由、样式、共享能力目录职责明确
- [ ] 未出现大面积顶层平铺的 `views/components/api/store/types`

## 关联文档

- [../AGENTS.md](../AGENTS.md)
- [./CODING_RULES.md](./CODING_RULES.md)
- [./VUE_TS_RULES.md](./VUE_TS_RULES.md)
- [./STATE_RULES.md](./STATE_RULES.md)
- [./ROUTER_RULES.md](./ROUTER_RULES.md)
- [./UI_RULES.md](./UI_RULES.md)
