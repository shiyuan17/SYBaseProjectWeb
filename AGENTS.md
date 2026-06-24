# AGENTS.md — AI 与开发协作规范

本文件是 `SYBaseProjectWeb` 的协作入口：边界、风险、交付与 Memory 总规则在此；实现细则见 `docs/rules/`。

## 快速命令

统一使用 `pnpm`（版本见根 `package.json` 的 `engines`）。本节只列高频入口，完整标准验证命令以 `docs/rules/CODING_RULES.md` 为准。

| 用途                | 命令                            |
| ------------------- | ------------------------------- |
| 安装依赖            | `pnpm install`                  |
| 启动开发（web-ele） | `pnpm dev:ele`                  |
| 常规静态验证        | `pnpm lint` / `pnpm check:type` |
| 治理文档验证        | `pnpm run check:governance`     |
| 完整验证入口        | 见 `docs/rules/CODING_RULES.md` |

改动逻辑或组件时，交付前按影响面运行最小有效验证。涉及规范、记忆文件或治理脚本时，额外运行 `pnpm run check:governance`。

## 日志读取规则

- 日志：`.logs/backend.log`、`frontend.log`、`build.log`、`test.log`
- 排查先读最近日志，修改后重跑命令并核对输出

## 一页式执行入口

| 档位 | 适用 | 最低输出 | 最低验证 |
| --- | --- | --- | --- |
| **Fast Path** | 纯文档、只读、测试-only、低风险文案；不改运行时 | 精简任务确认；Workflow 不适用原因 | 对应测试或 `check:governance` |
| **Lightweight** | 低风险实现；未触发强制修饰器 | 任务确认 + 轻量 Workflow Packet | `CODING_RULES.md` 最小集 |
| **Full** | 中高风险、跨层、权限/数据、生产、红区、跨仓 | 完整任务确认 + 完整 Packet | `DYNAMIC_WORKFLOW_RULES.md` |

权限/接口/患者报告/构建发布/生产问题 → Full；绿区文案或文档 → Fast Path。

### 规范单一来源矩阵

| 主题                          | 唯一来源                               |
| ----------------------------- | -------------------------------------- |
| 协作入口、风险、交付、Memory  | `AGENTS.md`                            |
| 最小阅读路径                  | `docs/rules/QUICKSTART.md`             |
| Workflow、修饰器、Packet      | `docs/rules/DYNAMIC_WORKFLOW_RULES.md` |
| 验证命令、编码基线            | `docs/rules/CODING_RULES.md`           |
| 前端实现（Vue/UI/API/测试等） | `docs/rules/FRONTEND_RULES.md`         |
| Git、worktree、PR             | `docs/rules/GIT_RULES.md`              |
| 任务来源与启动                | `docs/rules/TASK_INTAKE.md`            |
| Loop Packet                   | `docs/rules/LOOP_ENGINEERING_RULES.md` |
| 外部 skill                    | `docs/rules/AGENT_SKILL_ROUTING.md`    |

## 强制规则

### 1. 必读顺序

- **三层阅读路径**（详情见 `docs/rules/QUICKSTART.md`）：
  1. **入口层**：本文件 → `PROJECT_STATE.md` → `ARCHITECTURE.md` → `QUICKSTART.md`
  2. **任务层**：场景表 + 2–4 份专项规范 + 模块源码
  3. **底座层**：`CODING_RULES`、`GIT_RULES`、`DYNAMIC_WORKFLOW_RULES`
- **按需阅读**：`DECISIONS`（索引；全文见 `docs/reviews/decisions-business-detail.md`）、`KNOWN_BUGS`、`TECH_DEBT` — 仅当任务涉及时读
- 续接任务：`git status` 为脏工作区事实来源，不以 `PROJECT_STATE` 为准
- 红区或 §6 场景：命中专项文档必读

### 2. 规范映射表

| 场景                                          | 必读                        |
| --------------------------------------------- | --------------------------- |
| 首次进入 / 不确定读什么                       | `QUICKSTART.md`             |
| 目录与模块边界                                | `PROJECT_DIRECTORY.md`      |
| 编码与验证                                    | `CODING_RULES.md`           |
| 页面 / 组件 / API / 路由 / 状态 / 测试 / 兼容 | `FRONTEND_RULES.md`         |
| Git / PR                                      | `GIT_RULES.md`              |
| 选 Workflow                                   | `DYNAMIC_WORKFLOW_RULES.md` |
| Loop（显式要求时）                            | `LOOP_ENGINEERING_RULES.md` |
| Memory 更新                                   | `docs/memory/*.md`          |
| 任务来源 / issue / PR / 工单                  | `TASK_INTAKE.md`            |
| 发布                                          | `RELEASE.md`                |

### 3. 后端联动

后端为同级 `SYBaseProject`。涉及接口、字段、业务规则或联调时**必须对照后端实现**。

### 4. 任务开始模板

**完整模板**：

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

**Fast Path**：

```markdown
## 任务确认（Fast Path）

- 任务目标:
- 影响范围:
- 主 Workflow: 不适用（原因）
- 成功标准:
```

规格先行；验收歧义且会改变行为时先澄清。范例见 `docs/templates/workflow-packet-examples.md`。

### 5. 文件操作边界

| 区域                                   | 策略         |
| -------------------------------------- | ------------ |
| 绿区（业务模块内）                     | 可直接改     |
| 黄区（共享组件、stores、路由、请求）   | 先说明影响   |
| 红区（权限、登录态、全局层、构建发布） | **人工确认** |

### 6. 必须升级人工确认

权限/认证/守卫；Axios 全局层或环境变量；全局主题；CI/CD/构建路径；业务规则无法确定；覆盖共享契约。

**红区确认协议**：须说明范围、原因、验证、回滚；范围扩大须重新确认。

### 7. 输出与交接

交付含：**变更摘要**、**影响**、**验证结果**、**Workflow Packet**（按档位）、**风险**。

- **Memory 判定**：仅当产生 durable context 时写入交付或 PR；绿区 Fast Path / Lightweight **默认省略**（见 §8）
- **Loop Packet**：仅用户显式要求 loop 或多轮闭环时填写；普通任务不填
- Fast Path 文档类：可省略 Workflow Packet
- Full：含 Red Team 四要素 + Memory 判定（有变更时）

禁止以「应该没问题」替代实际验证。

### 8. AI Memory Update

五类文件：`PROJECT_STATE`、`TECH_DEBT`、`KNOWN_BUGS`、`DECISIONS`（索引 + `docs/reviews/decisions-business-detail.md`）、`ARCHITECTURE`。

**默认不写**：绿区 Fast Path / Lightweight 且无下列触发项时，**不更新** memory 文件，交付中**可不写** Memory 判定。

**必须更新**（任一命中）：

- 阶段/活跃任务/交接重点变化 → `PROJECT_STATE`
- 新 Open 技术债或已解决债务 → `TECH_DEBT`
- 可复现缺陷或已修复 bug → `KNOWN_BUGS`
- 影响后续行为的决策 → `DECISIONS` + `decisions-business-detail.md`
- 模块边界/跨仓契约变化 → `ARCHITECTURE`

**交接渠道**（替代把实现细节写入 `PROJECT_STATE`）：

- 仓内 durable 事实 → 上表五类 memory
- 会话/任务续接 → agentmemory `handoff` / `recall` / `session-history`，或 `agent-transcripts/`
- 模块局部约定 → 模块内 `README.md` 或源码注释

历史台账迁 `docs/reviews/*-archive.md`，不删 ID。

### 9. 语言与提交

默认中文沟通；UTF-8 见 `CODING_RULES.md` §5；Git 遵循 `GIT_RULES.md`。提交权限遵循 `docs/rules/GIT_RULES.md`：低/中风险任务可按该文规则主动 commit，高风险任务必须先获人工确认；若用户明确要求“不要提交 / 只给分组 / 等我确认”，则任何风险等级都不得主动提交。

### 10. 工具与子 Agent

结构性问题优先 codegraph；大型任务可并行 worktree（`GIT_RULES.md` §6）；skill 见 `AGENT_SKILL_ROUTING.md`。

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
- [docs/rules/LOOP_ENGINEERING_RULES.md](./docs/rules/LOOP_ENGINEERING_RULES.md)
- [docs/rules/AGENT_SKILL_ROUTING.md](./docs/rules/AGENT_SKILL_ROUTING.md)
- [docs/rules/TASK_INTAKE.md](./docs/rules/TASK_INTAKE.md)
- [docs/rules/RELEASE.md](./docs/rules/RELEASE.md)
