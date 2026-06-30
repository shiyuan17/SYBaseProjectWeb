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
- 开始实现前必须同时核对 JSON 条目与 Markdown 执行单元，不得只读其一。

## 与现有治理的关系

- 任务启动：见 [TASK_INTAKE.md](./TASK_INTAKE.md)
- Workflow / Packet：见 [DYNAMIC_WORKFLOW_RULES.md](./DYNAMIC_WORKFLOW_RULES.md)
- 可选生命周期产物：见 [TASK_LIFECYCLE_RULES.md](./TASK_LIFECYCLE_RULES.md)
- 模板索引：见 [../templates/README.md](../templates/README.md)

模板只能复用本文件字段，不新增平行任务模型。
