# QUICKSTART.md — 规范最小阅读路径

协作边界以 `AGENTS.md` 为准。本文件只回答：**最少读什么、跑什么**。

## 三层阅读路径

| 层级 | 何时 | 读什么 |
| --- | --- | --- |
| **入口层** | 每次续接 | `AGENTS.md` → `PROJECT_STATE` → `ARCHITECTURE` → 本文件 |
| **任务层** | 动手前 | 下方场景表 + 模块源码（2–4 份） |
| **底座层** | 跨层/共享层/发布前 | `CODING_RULES` + `GIT_RULES` + `DYNAMIC_WORKFLOW_RULES` |

`DECISIONS` / `KNOWN_BUGS` / `TECH_DEBT`：**按任务按需读**，非入口层默认。

绿区任务默认**不写** memory；会话续接优先 agentmemory / 模块 README（见 `AGENTS.md` §8）。

## 场景最小阅读

| 场景信号 | 最少追加阅读 | 最少验证 |
| --- | --- | --- |
| 绿区文案 / 测试-only / 纯文档 | 无 | 对应测试或 `check:governance` |
| 模块内页面 / 组件 / 样式 | `PROJECT_DIRECTORY`、`FRONTEND_RULES` | `lint` + `check:type` + 相关单测 |
| Pinia / 模块状态 | `FRONTEND_RULES`（状态节） | 上表 + store 测试 |
| 路由 / 菜单 / 守卫 | `FRONTEND_RULES`（路由节）；涉权限加 `DYNAMIC_WORKFLOW_RULES` | `check:type` + 路由测试 |
| API / mapper / mock / 联调 | `FRONTEND_RULES`（API/测试节） | service 单测；跨仓附后端验证 |
| 浏览器 / 导出 | `FRONTEND_RULES`（兼容节） | Browser 或 E2E |
| 权限 / 患者 / 报告 | `DYNAMIC_WORKFLOW_RULES` Security | Full Packet |
| 重构 / 共享层 | `PROJECT_DIRECTORY`、`CODING_RULES`、`DYNAMIC_WORKFLOW_RULES` | `lint` + `check:type` + `check:circular` |
| Git / PR / worktree | `GIT_RULES` | hook/CI |
| 发布 | `RELEASE`、`GIT_RULES` | `build` |
| Linear | `LINEAR_TASK` | issue 验收 |
| Loop（显式要求） | `LOOP_ENGINEERING_RULES` | Loop + Workflow Packet |

## 与 AGENTS 三档的关系

| 档位        | 阅读                     |
| ----------- | ------------------------ |
| Fast Path   | 入口层                   |
| Lightweight | 入口层 + 任务层          |
| Full        | 入口层 + 任务层 + 底座层 |

## 协作底座（底座层分包）

跨层/红区/发布前至少读：`CODING_RULES` → `GIT_RULES` → `DYNAMIC_WORKFLOW_RULES`。

索引：[README.md](./README.md)
