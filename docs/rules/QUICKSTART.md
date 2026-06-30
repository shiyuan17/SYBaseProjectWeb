# QUICKSTART.md — 最小阅读路径

协作边界以 `AGENTS.md` 为准。本文件只回答：**这次最少读什么、最少跑什么**。

## 三层阅读路径

| 层级 | 何时 | 读什么 |
| --- | --- | --- |
| 入口层 | 每次续接 | `AGENTS.md` → `PROJECT_STATE` → `ARCHITECTURE` → 本文件 |
| 任务层 | 动手前 | 下方场景表 + 模块源码 |
| 底座层 | 跨层 / 共享层 / 红区 / 发布前 | `CODING_RULES` + `GIT_RULES` + `DYNAMIC_WORKFLOW_RULES` |

`DECISIONS` / `KNOWN_BUGS` / `TECH_DEBT` 按任务触发阅读。绿区任务默认不写 memory。

## 场景最小阅读

| 场景信号 | 必须读 | 可跳过 | 最少验证 |
| --- | --- | --- | --- |
| 纯文档 / 只读 / 低风险文案 | `AGENTS`、本文件；治理文档改动加 `CODING_RULES` 验证表 | Workflow 细则、生命周期产物 | 对应检查或 `pnpm run check:governance` |
| 需求模糊 / 需要规格或计划 | `TASK_LIFECYCLE_RULES`、`TASK_INTAKE` | 实现专项，直到需求清楚 | 阶段产物可执行 |
| 本地 backlog / `docs/tasks/*.md` | `TASK_MANAGEMENT_RULES`、任务详情 | 外部平台同步规则 | backlog 与执行单元一致 |
| 页面 / 组件 / 样式 | `PROJECT_DIRECTORY`、`FRONTEND_RULES` | 发布、DB | `lint` + `check:type` + 相关单测；布局视口按需 Browser |
| Pinia / 路由 / 菜单 / 守卫 | `FRONTEND_RULES`；涉权限加 `DYNAMIC_WORKFLOW_RULES` | 发布 | `check:type` + 相关路由/store 测试 |
| API / mapper / mock / 联调 | `FRONTEND_RULES`、`DYNAMIC_WORKFLOW_RULES`；跨仓读后端 | 发布 | service/mapper 单测 + 后端证据 |
| 权限 / 患者 / 报告 / 导出 / 审计 | `DYNAMIC_WORKFLOW_RULES`、`GIT_RULES`、相关前后端实现 | Fast Path | Full Packet + Red Team 证据 |
| 重构 / 共享层 / 构建脚本 / 环境变量 | `CODING_RULES`、`GIT_RULES`、`DYNAMIC_WORKFLOW_RULES` | 低风险例外 | `lint` + `check:type` + `check:circular` 或专项命令 |
| Git / PR / worktree | `GIT_RULES` | 业务专项 | hook / CI / merge-back 证据 |
| 发布 / 回滚 | `RELEASE`、`GIT_RULES`、`CODING_RULES` | Fast Path | `pnpm build` + 发布门禁 |
| Loop（显式要求） | `LOOP_ENGINEERING_RULES` | 未启用时全部跳过 | Loop Packet + Workflow Packet |

## 与 AGENTS 三档的关系

| 档位        | 阅读                     |
| ----------- | ------------------------ |
| Fast Path   | 入口层 + 命中场景        |
| Lightweight | 入口层 + 任务层          |
| Full        | 入口层 + 任务层 + 底座层 |

## 协作底座（底座层分包）

跨层、共享契约、红区、生产或发布前至少读：`CODING_RULES` → `GIT_RULES` → `DYNAMIC_WORKFLOW_RULES`。

索引：[README.md](./README.md)
