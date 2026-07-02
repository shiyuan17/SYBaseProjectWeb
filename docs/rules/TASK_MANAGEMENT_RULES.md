# TASK_MANAGEMENT_RULES.md — 本地任务清单与 AI 执行单元

本文件只维护本仓本地任务体系：`backlog.json` 负责可枚举元数据，`docs/tasks/*.md` 负责可执行语义。任务启动、Workflow、Git 与交付格式分别引用对应规则，不在这里重复。

## 文件结构

- 任务清单：[`backlog.json`](../../backlog.json)
- 任务详情目录：`docs/tasks/`
- 单任务执行单元：`docs/tasks/<TASK_ID>-<slug>.md`

## 单一事实来源

| 文件 | 负责 | 不负责 |
| --- | --- | --- |
| `backlog.json` | `id`、`title`、`status`、`dependencies`、`scope` | 长说明、验收标准、执行细节 |
| `docs/tasks/*.md` | 目标、输入输出、约束、验收、交接上下文 | 状态流转、依赖图 |

`backlog.json` 条目至少包含：

```json
{
  "id": "T-001",
  "title": "auth system",
  "status": "todo",
  "dependencies": [],
  "scope": "modules/auth"
}
```

推荐字段（新增任务应填写；历史任务可逐步补齐，不在本轮强制迁移）：

```json
{
  "risk": "low | medium | high",
  "packetTier": "Fast Path | Lightweight | Full",
  "validation": ["pnpm test:unit -- auth"],
  "blockedReason": "",
  "updatedAt": "2026-07-01"
}
```

状态枚举：

| status        | 含义                                   |
| ------------- | -------------------------------------- |
| `todo`        | 尚未拆清或未进入排期                   |
| `ready`       | 输入、验收、依赖已清楚，可以开工       |
| `in_progress` | 正在实现或验证                         |
| `blocked`     | 外部依赖阻塞，必须填写 `blockedReason` |
| `review`      | 已完成实现，等待 Review 或验收         |
| `done`        | 已交付并有验证证据                     |
| `cancelled`   | 已取消，任务文件保留原因               |

AI 执行单元最小结构：

```markdown
# T-001 Auth System

## Goal

## Inputs

## Outputs

## Constraints

## Acceptance Criteria
```

## 一致性规则

- `backlog.json` 中的每个任务 ID 必须能映射到一个同 ID 任务详情文件。
- 任务详情标题中的 ID 与标题必须与 `backlog.json` 对应条目一致。
- `dependencies` 只能引用已存在任务 ID。
- `scope` 使用仓库路径或模块路径，例如 `modules/auth`、`apps/web-ele/src/modules/auth`。
- `risk`、`packetTier`、`validation`、`blockedReason`、`updatedAt` 若出现，必须符合本文件推荐字段类型。
- `blocked` 任务必须填写非空 `blockedReason`。
- 任务详情必须包含 `Goal`、`Inputs`、`Outputs`、`Constraints`、`Acceptance Criteria`。
- 开始实现前必须同时核对 JSON 条目与 Markdown 执行单元，不得只读其一。

## 自动化校验

`pnpm run check:governance` 会校验：

- `backlog.json` 顶层必须是数组。
- 任务 ID 使用 `T-001` 形式且不得重复。
- `status`、`dependencies`、`scope` 合法。
- `dependencies` 不引用不存在的任务。
- `docs/tasks/T-001-*.md` 与 backlog ID 双向一致。
- 任务 Markdown 必备章节存在。
- 推荐字段出现时类型和值合法。

该校验只保证任务元数据闭环，不判断业务验收是否充分；验收质量仍由 `TASK_INTAKE.md`、`DYNAMIC_WORKFLOW_RULES.md`、`TEST_RULES.md` 和 `REVIEW_RULES.md` 共同约束。

## 与现有治理的关系

- 任务启动：见 [TASK_INTAKE.md](./TASK_INTAKE.md)
- Workflow / Packet：见 [DYNAMIC_WORKFLOW_RULES.md](./DYNAMIC_WORKFLOW_RULES.md)
- 可选生命周期产物：见 [TASK_LIFECYCLE_RULES.md](./TASK_LIFECYCLE_RULES.md)
- 模板索引：见 [../templates/README.md](../templates/README.md)

模板只能复用本文件字段，不新增平行任务模型。
