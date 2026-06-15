# QUICKSTART.md — 规范最小阅读路径

## 目标

本文件是 `AGENTS.md` §1「首次进入项目 / 中大型改动」的**执行索引**，把原先机械通读 16 份文档改为**按场景补齐最小上下文**。

- 协作边界、风险升级、交付要求仍以 `AGENTS.md` 为最高优先级
- 专项规则正文仍以 `docs/rules/*.md` 各文件为唯一来源
- 本文件只回答：**这次任务最少还要读哪几份文档、跑哪些命令**

## 三层阅读路径

| 层级 | 何时读 | 读什么 | 目标 |
| --- | --- | --- | --- |
| **入口层** | 首次进入仓库；每次续接长期任务 | `AGENTS.md`（一页式入口 + 映射表）→ `docs/memory/PROJECT_STATE.md` → `docs/memory/DECISIONS.md` → `docs/memory/KNOWN_BUGS.md` → 本文件 | 知道当前阶段、活跃决策、已知问题、如何选 Workflow |
| **任务层** | 任务确认后、动手前 | 下方「场景最小阅读」命中行 + 任务涉及模块源码 | 只读与本次改动直接相关的 2–4 份专项规范 |
| **底座层** | 首次跨层改动；首次改共享层/路由/状态/接口；发布/热修复前 | 下方「协作底座」三包（按命中子包阅读，不必每次三包全读） | 建立可复用的工程与安全基线 |

**禁止**：跳过入口层直接改共享层、红区或跨仓契约；用「以后有空再读」代替任务层必读。

## 场景最小阅读

任务开始时先查下表，再叠加 `AGENTS.md`「2. 规范映射表」中的命中项。同一任务命中多行时合并阅读，不重复通读无关文档。

| 场景信号 | 最少追加阅读 | 最少验证（见 `CODING_RULES.md`） |
| --- | --- | --- |
| 绿区文案 / 测试-only / 纯文档 | 无（入口层即可） | 对应测试或 `pnpm run check:governance` |
| 模块内页面 / 组件 / 样式 | `PROJECT_DIRECTORY.md`、`VUE_TS_RULES.md`、`UI_RULES.md`、`TESTING_RULES.md` | `pnpm lint` + `pnpm check:type` + 相关 `pnpm test:unit` |
| Pinia / 模块状态 | `STATE_RULES.md` + 上表 UI 行（若改视图） | 上表 + 相关 store 测试 |
| 路由 / 菜单 / 守卫 | `ROUTER_RULES.md`；若涉权限再加 `DYNAMIC_WORKFLOW_RULES.md` Security 相关节 | `pnpm check:type` + 路由/菜单相关测试 |
| API / mapper / mock / 联调 | `API_RULES.md`、`TESTING_RULES.md`；跨仓时对照后端实现 | 相关 service/mapper 单测；跨仓附后端验证 |
| 浏览器 / 导出 / 国产环境 | `COMPATIBILITY_RULES.md`、`UI_RULES.md` | 浏览器或 E2E 证据（见 Workflow Browser 修饰器） |
| 权限 / 患者 / 报告 / 敏感数据 | `DYNAMIC_WORKFLOW_RULES.md`（Security Workflow） | Full Workflow Packet + 权限/E2E 证据 |
| 重构 / 共享层 / 循环依赖 | `PROJECT_DIRECTORY.md`、`CODING_RULES.md`、`DYNAMIC_WORKFLOW_RULES.md`（Architecture） | `pnpm lint` + `pnpm check:type` + `pnpm check:circular` + 相关单测 |
| Git / PR / hook / worktree | `GIT_RULES.md` | 对应 hook/CI 命令 |
| 发布 / 热修复 | `RELEASE.md`、`GIT_RULES.md` | `pnpm build` + 发布 checklist |
| Linear 任务 | `LINEAR_TASK.md`、`GIT_RULES.md` §6 | 按 issue 验收标准 |
| Loop / 多轮闭环 | `LOOP_ENGINEERING_RULES.md` | Loop Packet + Workflow Packet |
| 交付前代码自检 | `AI-CODE-HEALTH.md`（按需） | 任务成功标准对应的验证命令 |

## 协作底座（底座层分包）

首次跨层或首次触碰共享能力前，按命中子包阅读；**协作子包**为硬性最低要求。

### 协作子包（跨层 / 红区 / 发布前必读）

1. `CODING_RULES.md` — 验证命令、编码基线
2. `GIT_RULES.md` — 分支、PR、worktree、hook
3. `DYNAMIC_WORKFLOW_RULES.md` — Workflow、修饰器、Packet 证据

### 前端实现子包（首次做业务功能前）

4. `PROJECT_DIRECTORY.md`
5. `VUE_TS_RULES.md`
6. `UI_RULES.md`
7. `TESTING_RULES.md`

### 横切能力子包（首次触碰对应层时）

8. `STATE_RULES.md` — store
9. `ROUTER_RULES.md` — 路由/守卫
10. `API_RULES.md` — 请求/接口
11. `COMPATIBILITY_RULES.md` — 浏览器/导出

### 按需附录（不纳入通读清单）

- `AI-CODE-HEALTH.md` — 生成或评审代码前自检
- `AGENT_SKILL_ROUTING.md` — 选用外部 skill 时
- `LOOP_ENGINEERING_RULES.md` — 显式 loop 任务
- `LINEAR_TASK.md` — Linear issue
- `RELEASE.md` — 发布/热修复

## 与 AGENTS.md 三档执行入口的关系

| AGENTS 档位 | 阅读要求                                                     |
| ----------- | ------------------------------------------------------------ |
| Fast Path   | 入口层 + 映射表命中项（通常无需底座层）                      |
| Lightweight | 入口层 + 任务层                                              |
| Full        | 入口层 + 任务层 + 底座层（至少协作子包；横切改动补横切子包） |

## 关联文档

- [../../AGENTS.md](../../AGENTS.md)
- [./README.md](./README.md)
- [../memory/README.md](../memory/README.md)
