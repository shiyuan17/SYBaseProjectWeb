# AGENTS.md — AI 与开发协作规范

本文件是 `SYBaseProjectWeb` 的协作入口。所有任务先回答 5 个问题：**读什么、风险多高、能不能动、怎么验证、怎么交付**。细则只在命中场景时阅读，避免把普通任务套成重流程。

## 快速命令

统一使用 `pnpm`（版本见根 `package.json` 的 `engines`）。完整验证命令以 `docs/rules/CODING_RULES.md` 为准。

| 用途                | 命令                            |
| ------------------- | ------------------------------- |
| 安装依赖            | `pnpm install`                  |
| 启动开发（web-ele） | `pnpm dev:ele`                  |
| 常规静态验证        | `pnpm lint` / `pnpm check:type` |
| 治理文档验证        | `pnpm run check:governance`     |

排查问题先看最近日志：`.logs/backend.log`、`frontend.log`、`build.log`、`test.log`。

## 一页式执行入口

| 步骤 | 要回答的问题 | 最小动作 |
| --- | --- | --- |
| 1. 定位任务 | 来源、目标、验收、非目标是否清楚？ | 读 `PROJECT_STATE`、`ARCHITECTURE`、`QUICKSTART`；来源不清时用 `TASK_INTAKE` |
| 2. 判定档位 | 是 Fast Path、Lightweight 还是 Full？ | 按下方档位表选最小流程 |
| 3. 判定能不能动 | 是否红区、跨仓、脏工作区、需要 worktree？ | 红区先人工确认；worktree 细则见 `GIT_RULES` |
| 4. 执行与验证 | 哪些命令能证明成功标准？ | 按影响面跑最小有效验证；治理改动跑 `check:governance` |
| 5. 交付 Packet | 需要哪些证据和上下文沉淀？ | 输出摘要、影响、验证、风险；按档位补 Workflow / Memory |

| 档位 | 适用 | 最低输出 | 最低验证 |
| --- | --- | --- | --- |
| **Fast Path** | 纯文档、只读、测试-only、低风险文案；不改运行时 | 精简任务确认；Workflow 不适用原因 | 对应测试或 `check:governance` |
| **Lightweight** | 低风险实现；未触发强制修饰器 | 任务确认 + 轻量 Workflow Packet | `CODING_RULES.md` 最小集 |
| **Full** | 中高风险、跨层、权限/数据、生产、红区、跨仓 | 完整任务确认 + 完整 Packet | `DYNAMIC_WORKFLOW_RULES.md` + 专项验证 |

权限/接口/患者报告/构建发布/生产问题默认 Full。绿区文案或文档默认 Fast Path。

### 规范单一来源矩阵

| 主题                         | 唯一来源                               |
| ---------------------------- | -------------------------------------- |
| 协作入口、风险、交付、Memory | `AGENTS.md`                            |
| 三层阅读路径与最小阅读表     | `docs/rules/QUICKSTART.md`             |
| Workflow、修饰器、Packet     | `docs/rules/DYNAMIC_WORKFLOW_RULES.md` |
| 可选生命周期产物             | `docs/rules/TASK_LIFECYCLE_RULES.md`   |
| 验证命令、编码基线           | `docs/rules/CODING_RULES.md`           |
| 前端实现                     | `docs/rules/FRONTEND_RULES.md`         |
| Git、worktree、PR            | `docs/rules/GIT_RULES.md`              |
| 任务来源与启动块             | `docs/rules/TASK_INTAKE.md`            |
| 本地 backlog 与 AI 执行单元  | `docs/rules/TASK_MANAGEMENT_RULES.md`  |
| Loop Packet                  | `docs/rules/LOOP_ENGINEERING_RULES.md` |
| 外部 skill                   | `docs/rules/AGENT_SKILL_ROUTING.md`    |
| 发布与回滚                   | `docs/rules/RELEASE.md`                |

## 强制规则

### 1. 必读顺序

- 入口层（三层阅读路径）：`AGENTS.md` → `PROJECT_STATE.md` → `ARCHITECTURE.md` → `QUICKSTART.md`
- 任务层：按 `QUICKSTART.md` 场景表读取 2–4 份专项规范和模块源码。
- 底座层：跨层、共享层、红区、发布前读 `CODING_RULES.md`、`GIT_RULES.md`、`DYNAMIC_WORKFLOW_RULES.md`。
- `DECISIONS`、`KNOWN_BUGS`、`TECH_DEBT` 按任务触发阅读；续接任务以 `git status --short` 为脏工作区事实来源。

### 2. 场景映射

| 场景                                          | 必读                        |
| --------------------------------------------- | --------------------------- |
| 首次进入 / 不确定读什么                       | `QUICKSTART.md`             |
| 页面 / 组件 / API / 路由 / 状态 / 测试 / 兼容 | `FRONTEND_RULES.md`         |
| Git / PR / worktree                           | `GIT_RULES.md`              |
| 选 Workflow / Packet                          | `DYNAMIC_WORKFLOW_RULES.md` |
| 澄清 / Spec / Plan / Tasks / Handoff / 复盘   | `TASK_LIFECYCLE_RULES.md`   |
| 任务来源 / issue / PR / 工单                  | `TASK_INTAKE.md`            |
| 任务 backlog / AI 执行单元                    | `TASK_MANAGEMENT_RULES.md`  |
| Memory 更新                                   | `docs/memory/*.md`          |
| 发布                                          | `RELEASE.md`                |
| Loop（显式要求时）                            | `LOOP_ENGINEERING_RULES.md` |

### 3. 后端联动

后端为同级 `SYBaseProject`。涉及接口、字段、权限、菜单、统计口径、业务规则、迁移或联调时，必须对照后端实现或验证证据。

### 4. 任务开始模板

Fast Path：

```markdown
## 任务确认（Fast Path）

- 任务目标:
- 影响范围:
- 主 Workflow: 不适用（原因）
- 成功标准:
```

Lightweight / Full：

```markdown
## 任务确认

- 任务目标:
- 影响范围:
- 主 Workflow:
- 强制修饰器:
- 风险等级:
- 成功标准:
- 非目标:
```

验收歧义且会改变行为时，先澄清，不凭猜测进入实现。

### 5. 文件操作边界

| 区域                                   | 策略         |
| -------------------------------------- | ------------ |
| 绿区（业务模块内）                     | 可直接改     |
| 黄区（共享组件、stores、路由、请求）   | 先说明影响   |
| 红区（权限、登录态、全局层、构建发布） | **人工确认** |

### 6. 必须升级人工确认

权限/认证/守卫；Axios 全局层或环境变量；全局主题；CI/CD/构建路径；业务规则无法确定；覆盖共享契约。

**红区确认协议**：说明范围、原因、验证、回滚；范围扩大须重新确认。

### 7. 输出与交接

交付含：变更摘要、影响、验证结果、Workflow Packet（按档位）、风险。Fast Path 文档类可省略 Workflow Packet 正文，但需说明不适用原因。

- Loop Packet：仅用户、任务来源或计划显式要求 loop 时填写。
- Worktree 完成门槛：一旦为任务创建独立 `git worktree`，采纳提交必须由主 Agent merge-back 到当前集成分支或任务声明的目标分支；目标分支未包含 merge-back 结果前，不得宣称完成、不得清理 worktree 或对应分支。
- 禁止以“应该没问题”替代实际验证。

### 8. AI Memory Update

五类文件：`PROJECT_STATE`、`TECH_DEBT`、`KNOWN_BUGS`、`DECISIONS`（索引 + `docs/reviews/decisions-business-detail.md`）、`ARCHITECTURE`。

默认不写：绿区 Fast Path / Lightweight 且无 durable context 变更时，不更新 memory，交付中可不写 Memory 判定。

必须更新：

- 阶段/活跃任务/交接重点变化 → `PROJECT_STATE`
- 新 Open 技术债或已解决债务 → `TECH_DEBT`
- 可复现缺陷或已修复 bug → `KNOWN_BUGS`
- 影响后续行为的决策 → `DECISIONS` + `decisions-business-detail.md`
- 模块边界/跨仓契约变化 → `ARCHITECTURE`

临时会话交接优先 agentmemory `handoff` / `recall` / `session-history`，不要把实现流水账写入 `PROJECT_STATE`。

### 9. 语言与提交

默认中文沟通；UTF-8 见 `CODING_RULES.md`。提交权限遵循 `GIT_RULES.md`：低/中风险任务可按规则主动 commit，高风险任务必须先获人工确认；若用户明确要求“不要提交 / 只给分组 / 等我确认”，任何风险等级都不得主动提交。

### 10. 工具与子 Agent

结构性问题优先 CodeGraph；大型任务可并行 worktree；skill 路由见 `AGENT_SKILL_ROUTING.md`。外部 skill 只补强执行，不覆盖本文件、Workflow、红区和验证要求。

## 推荐实践 / 反例

先读现有实现；最小 diff；列出已验证与未验证项。反例：不读上下文就生成结构、未说明风险改守卫/拦截器、删测试过关。

## 关联文档

- [README.md](./README.md)
- [PROJECT_STATE.md](./docs/memory/PROJECT_STATE.md)
- [ARCHITECTURE.md](./docs/memory/ARCHITECTURE.md)
- [TECH_DEBT.md](./docs/memory/TECH_DEBT.md)
- [KNOWN_BUGS.md](./docs/memory/KNOWN_BUGS.md)
- [DECISIONS.md](./docs/memory/DECISIONS.md)
- [docs/rules/QUICKSTART.md](./docs/rules/QUICKSTART.md)
- [docs/rules/PROJECT_DIRECTORY.md](./docs/rules/PROJECT_DIRECTORY.md)
- [docs/rules/CODING_RULES.md](./docs/rules/CODING_RULES.md)
- [docs/rules/FRONTEND_RULES.md](./docs/rules/FRONTEND_RULES.md)
- [docs/rules/GIT_RULES.md](./docs/rules/GIT_RULES.md)
- [docs/rules/DYNAMIC_WORKFLOW_RULES.md](./docs/rules/DYNAMIC_WORKFLOW_RULES.md)
- [docs/rules/TASK_LIFECYCLE_RULES.md](./docs/rules/TASK_LIFECYCLE_RULES.md)
- [docs/rules/LOOP_ENGINEERING_RULES.md](./docs/rules/LOOP_ENGINEERING_RULES.md)
- [docs/rules/AGENT_SKILL_ROUTING.md](./docs/rules/AGENT_SKILL_ROUTING.md)
- [docs/rules/TASK_INTAKE.md](./docs/rules/TASK_INTAKE.md)
- [docs/rules/TASK_MANAGEMENT_RULES.md](./docs/rules/TASK_MANAGEMENT_RULES.md)
- [docs/rules/RELEASE.md](./docs/rules/RELEASE.md)
