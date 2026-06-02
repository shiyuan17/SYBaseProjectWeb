# AGENTS.md — AI 与开发协作规范

## 目标与适用范围

本文件定义 `SYBaseProjectWeb` 中 AI 智能体与人工开发者的协作边界、执行流程、风险升级机制与交接要求。

- 适用对象：Codex、Claude、Copilot、Cursor、IDE 内置助手、脚本化生成工具、人工开发者
- 适用范围：需求分析、文档编写、工程初始化、组件开发、接口联调、测试补充、缺陷修复、发布准备
- 规范定位：本文件只描述“如何协作”，不重复 Vue、TypeScript、Pinia、Vue Router、API、UI、发布细则

## 强制规则

### 1. 必读顺序

开始任务前，必须按以下顺序读取上下文：

1. `AGENTS.md`
2. `docs/PROJECT_DIRECTORY.md`
3. `docs/CODING_RULES.md`
4. `docs/VUE_TS_RULES.md`
5. `docs/UI_RULES.md`
6. `docs/STATE_RULES.md`
7. `docs/ROUTER_RULES.md`
8. `docs/API_RULES.md`
9. `docs/COMPATIBILITY_RULES.md`
10. `docs/GIT_RULES.md`
11. `docs/LINEAR_TASK.md`（仅当任务来源于 Linear issue 时）
12. `docs/RELEASE.md`
13. `docs/AI-CODE-HEALTH.md`
14. 任务涉及模块文档与现有源码

### 2. 规范映射表

| 场景 | 必读文档 |
| --- | --- |
| 目录组织与模块边界 | `docs/PROJECT_DIRECTORY.md` |
| 通用编码与测试基线 | `docs/CODING_RULES.md` |
| Vue 3、Vite、TypeScript、组件实现 | `docs/VUE_TS_RULES.md` |
| Pinia 状态设计 | `docs/STATE_RULES.md` |
| 路由设计、守卫与导航元信息 | `docs/ROUTER_RULES.md` |
| Axios、请求模型、错误处理、分页协议 | `docs/API_RULES.md` |
| Element Plus、TailwindCSS、ECharts、交互与视觉一致性 | `docs/UI_RULES.md` |
| 浏览器、国产环境、导出打印、字体与降级策略 | `docs/COMPATIBILITY_RULES.md` |
| 分支、提交、PR、合并协作 | `docs/GIT_RULES.md` |
| Linear issue 开工与任务起始信息准备 | `docs/LINEAR_TASK.md` |
| 环境、构建、发布与回滚 | `docs/RELEASE.md` |
| AI 生成代码健康基线 | `docs/AI-CODE-HEALTH.md` |

### 3. 后端联动检查

- 后端代码引用路径为 `D:\Github\JW\SYBaseProject`
- 当任务涉及接口联调、后端字段映射、业务规则核对、问题排查或需要确认后端实现时，必须对照该路径下对应代码进行匹配，不得仅依据前端页面、临时返回数据或推测作出结论

### 4. 任务开始模板

开始执行前，AI 必须先给出任务确认，至少包含以下内容：

```markdown
## 任务确认

- 任务目标: [对需求的理解]
- 影响范围: [计划修改的文件、模块或页面]
- 依赖检查: [涉及的组件、接口、浏览器能力、构建配置]
- 风险等级: [低 / 中 / 高]
- 关键假设: [默认采用的前提]
```

- 若任务明确来源于 Linear issue，开始前应参考 `docs/LINEAR_TASK.md` 准备任务起始信息；非 Linear 任务不强制套用该模板。

### 5. 文件操作边界

| 区域 | 说明 | 默认策略 |
| --- | --- | --- |
| 绿区 | 页面、业务模块内组件、文档、测试、非敏感样式 | 可直接修改 |
| 黄区 | 共享组件、`stores`、路由守卫、请求封装、主题变量、图表通用封装 | 先说明影响，再修改 |
| 红区 | 权限模型、登录态、全局拦截器、构建配置、发布脚本、浏览器兼容兜底方案 | 必须人工确认 |

补充约束：

- 修改全局路由守卫、登录态持久化、权限指令、Axios 全局实例、环境变量读取逻辑前，必须明确说明外部影响
- 不得因重构方便而绕过既有鉴权、错误处理、埋点、降级或浏览器兼容逻辑
- 不得擅自删除已有测试、截图基线或兼容性验证记录来“让流程通过”

### 6. 必须升级人工确认的场景

出现以下任一情况时，必须暂停并请求人工确认：

- 需要调整权限模型、认证流程、菜单鉴权、路由守卫策略
- 需要变更 Axios 全局拦截器、错误码协议、统一响应模型、环境变量方案
- 需要重构 Element Plus 主题覆盖策略、Tailwind 设计 token、全局样式入口
- 需要调整 ECharts 大屏性能策略、导出打印能力、图表降级方案
- 需要修改构建产物路径、CI/CD、静态资源缓存、Nginx 分发或发布路径
- 无法从上下文确定业务规则，且不同实现会改变页面行为或接口联调方式
- 需要执行高风险操作，如覆盖共享组件契约、删除关键页面、重写公共请求层

### 7. 输出与交接要求

每次交付必须包含：

- 变更摘要：做了什么、为什么这样做
- 影响说明：是否涉及配置、接口、兼容性、主题、路由或状态
- 验证结果：已执行的检查、构建、测试或未验证项
- 风险提示：需要人工跟进的事项

任务移交时必须提供：

```markdown
## 移交摘要

- 已完成:
- 进行中:
- 待处理:
- 关键决策:
- 已知风险:
- 建议下一步:
```

### 8. 语言与提交约束

- 与用户沟通：默认使用用户当前语言
- 代码注释与文档：遵循模块既有语言风格，无现存风格时优先中文
- 文本类文件编码：新增或修改源码、脚本、配置、文档时，默认使用 `UTF-8`，并与仓库 `.editorconfig` 中的 `charset=utf-8` 保持一致，默认采用 `UTF-8（无 BOM）`
- 乱码与错码处理：发现乱码或疑似错码时，必须先确认原文件编码和当前工具的解码方式，再进行修改，不得在未确认前直接批量转码或覆盖保存
- Git 提交信息：遵循 `docs/GIT_RULES.md` 中的 Conventional Commits
- 发布说明：遵循 `docs/RELEASE.md` 中的版本与验收要求
- 工程命令示例：统一使用 `pnpm`

## 推荐实践

- 先阅读现有实现，再决定新增还是复用
- 优先做最小可验证改动，避免一轮任务内同时改动路由、状态、接口层和主题层
- 说明默认假设，例如“当前以业务模块化目录结构为基线”
- 输出中明确列出“已验证”和“未验证”项，降低协作不确定性
- 交接时给出下一位执行者可直接继续的上下文，而不是只给结论

## 反例/禁用项

- 不读上下文就直接生成整套页面或工程结构
- 在共享层直接堆积业务逻辑，导致模块边界失效
- 在不说明风险的情况下修改登录态、权限守卫、请求拦截器或构建配置
- 用“先跑通再说”为理由跳过错误处理、兼容性说明、自检
- 直接覆盖用户已有改动，或把不理解的代码整体删除重写

## 检查清单

- [ ] 已阅读本文件及相关专项规范
- [ ] 已输出任务确认和关键假设
- [ ] 已识别本次改动属于绿区、黄区还是红区
- [ ] 新增或修改的文本类文件编码符合 `UTF-8` 约定，乱码风险已检查
- [ ] 涉及高风险变更时已人工确认
- [ ] 交付内容包含变更摘要、验证结果和风险提示
- [ ] 如需交接，已附带完整移交摘要

## 关联文档

- [README.md](./README.md)
- [docs/PROJECT_DIRECTORY.md](./docs/PROJECT_DIRECTORY.md)
- [docs/CODING_RULES.md](./docs/CODING_RULES.md)
- [docs/VUE_TS_RULES.md](./docs/VUE_TS_RULES.md)
- [docs/STATE_RULES.md](./docs/STATE_RULES.md)
- [docs/ROUTER_RULES.md](./docs/ROUTER_RULES.md)
- [docs/API_RULES.md](./docs/API_RULES.md)
- [docs/UI_RULES.md](./docs/UI_RULES.md)
- [docs/COMPATIBILITY_RULES.md](./docs/COMPATIBILITY_RULES.md)
- [docs/GIT_RULES.md](./docs/GIT_RULES.md)
- [docs/LINEAR_TASK.md](./docs/LINEAR_TASK.md)
- [docs/RELEASE.md](./docs/RELEASE.md)
- [docs/AI-CODE-HEALTH.md](./docs/AI-CODE-HEALTH.md)
