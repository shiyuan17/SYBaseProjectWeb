# TASK_MANAGEMENT_RULES.md — 本地任务清单与 AI 执行单元

本文件只维护本仓本地任务体系：`backlog.json` 负责可枚举父任务元数据，`docs/tasks/` 负责可执行语义。任务启动、Workflow、Git 与交付格式分别引用对应规则，不在这里重复。

## 文件结构

- 任务清单：[`backlog.json`](../../backlog.json)
- 任务详情目录：`docs/tasks/`
- 历史平铺执行单元：`docs/tasks/<TASK_ID>-<slug>.md`
- 新任务目录：`docs/tasks/<TASK_ID>-<slug>/`
- 父任务说明：`docs/tasks/<TASK_ID>-<slug>/README.md`
- 目录清单：`docs/tasks/<TASK_ID>-<slug>/task.json`
- 子任务执行单元：`docs/tasks/<TASK_ID>-<slug>/children/<TASK_ID>.<NNN>-<slug>.md`

新任务必须优先使用目录模型；历史平铺文件继续兼容，但不得作为大任务继续扩张。

## 单一事实来源

| 文件 | 负责 | 不负责 |
| --- | --- | --- |
| `backlog.json` | 父任务 `id`、`title`、`status`、`dependencies`、`scope`、可选 `taskDir` | 子任务明细、每轮 Goal 状态 |
| `docs/tasks/<TASK_ID>-<slug>/README.md` | 父任务背景、总目标、总验收、非目标、不可直接执行声明 | 具体 5 分钟执行步骤 |
| `docs/tasks/<TASK_ID>-<slug>/task.json` | 父任务和子任务状态、依赖、验证、回滚、更新时间 | 长说明、业务设计正文 |
| `docs/tasks/<TASK_ID>-<slug>/children/*.md` | 单个可执行子目标、停止条件、验证证据、回滚计划 | 父任务总目标、无边界探索 |
| `docs/tasks/*.md` | 历史兼容平铺任务 | 新增复杂任务、父子任务结构 |

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

`taskDir` 是可选字段。使用目录模型时必须指向 `docs/tasks/<TASK_ID>-<slug>`；不使用目录模型的历史任务可省略。

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

## 目录化任务模型

目录模型用于中大型任务、Loop 任务、跨仓任务、Full 档任务和任何可能超过单轮 Codex Goal 的工作。父任务只承载上下文和总验收，不能直接交给 Goal 执行；真正可执行的是 `children/` 下的子任务。

标准结构：

```text
docs/tasks/T-002-frozen-workflow-backend-closed-loop/
  README.md
  task.json
  children/
    T-002.001-contract-inventory.md
    T-002.002-read-contract-skeleton.md
```

父任务 `README.md` 必须包含：

```markdown
# T-002 冰冻流程后端真实闭环

Executable: false

## Goal

## Inputs

## Outputs

## Constraints

## Acceptance Criteria
```

父任务若缺少 `Executable: false`，不得进入 Codex Goal。父任务只能用于人类或主 Agent 选择下一个子任务。

`task.json` 最小结构：

```json
{
  "id": "T-002",
  "title": "冰冻流程后端真实闭环",
  "status": "ready",
  "executable": false,
  "dependencies": [],
  "validation": ["node scripts\\validate-governance.mjs"],
  "rollback": "Revert the task directory changes.",
  "updatedAt": "2026-07-02",
  "children": [
    {
      "id": "T-002.001",
      "title": "contract inventory",
      "status": "ready",
      "dependencies": [],
      "validation": ["node scripts\\validate-governance.mjs"],
      "rollback": "Revert this child task change.",
      "updatedAt": "2026-07-02"
    }
  ]
}
```

子任务 ID 使用 `T-002.001` 形式，只在父任务目录内管理，不写入全局 `backlog.json`。

## 5 分钟子任务硬规则

每个子任务必须能在 5 分钟内判断「完成 / 未完成 / 阻塞」，并且必须可验证、可回滚。

子任务 Markdown 必须包含：

```markdown
# T-002.001 Contract Inventory

Timebox: <= 5 minutes

## Goal

## Acceptance Criteria

## Non-goals

## Stop Condition

## Verification Command

## Rollback Plan

## Evidence
```

硬性约束：

- 一个子任务只允许一个可观察目标；标题或验收里出现多个动作时必须继续拆分。
- `Stop Condition` 达成后立即停止，不能继续寻找下一个缺口。
- `Verification Command` 必须是本子任务最小证明命令；无法自动验证时写明确人工核对项。
- `Rollback Plan` 必须说明如何撤回本子任务改动；无法回滚时必须升级人工确认。
- 发现新缺口、新接口、新状态或额外风险时，只能记录为后续子任务或阻塞项，不得扩大当前 Goal。
- 超过 5 分钟仍不能完成或验证时，停止并更新 `blockedReason` / `Evidence`。

## 一致性规则

- `backlog.json` 中的每个任务 ID 必须能映射到一个同 ID 任务详情文件。
- 使用目录模型时，`backlog.json.taskDir` 必须指向同 ID 任务目录。
- 任务详情标题中的 ID 与标题必须与 `backlog.json` 对应条目一致。
- `dependencies` 只能引用已存在任务 ID。
- `scope` 使用仓库路径或模块路径，例如 `modules/auth`、`apps/web-ele/src/modules/auth`。
- `risk`、`packetTier`、`validation`、`blockedReason`、`updatedAt` 若出现，必须符合本文件推荐字段类型。
- `blocked` 任务必须填写非空 `blockedReason`。
- 任务详情必须包含 `Goal`、`Inputs`、`Outputs`、`Constraints`、`Acceptance Criteria`。
- 父任务目录必须包含 `README.md`、`task.json` 和 `children/` 子任务文件。
- 父任务必须声明 `Executable: false`，`task.json.executable` 也必须为 `false`。
- 子任务必须放在父任务目录 `children/` 下；不得散落在 `docs/tasks/` 根目录。
- 子任务必须包含 `Timebox: <= 5 minutes`、`Stop Condition`、`Verification Command`、`Rollback Plan`、`Non-goals`、`Evidence`。
- 开始实现前必须同时核对 JSON 条目与 Markdown 执行单元，不得只读其一。

## 自动化校验

`pnpm run check:governance` 会校验：

- `backlog.json` 顶层必须是数组。
- 任务 ID 使用 `T-001` 形式且不得重复。
- `status`、`dependencies`、`scope` 合法。
- `dependencies` 不引用不存在的任务。
- `docs/tasks/T-001-*.md` 与 backlog ID 双向一致。
- `docs/tasks/<TASK_ID>-<slug>/README.md`、`task.json`、`children/*.md` 目录模型一致。
- 父任务不可执行、子任务 ID、子任务必备护栏、子任务路径合法。
- 任务 Markdown 必备章节存在。
- 推荐字段出现时类型和值合法。

该校验只保证任务元数据闭环，不判断业务验收是否充分；验收质量仍由 `TASK_INTAKE.md`、`DYNAMIC_WORKFLOW_RULES.md`、`TEST_RULES.md` 和 `REVIEW_RULES.md` 共同约束。

## 与现有治理的关系

- 任务启动：见 [TASK_INTAKE.md](./TASK_INTAKE.md)
- Workflow / Packet：见 [DYNAMIC_WORKFLOW_RULES.md](./DYNAMIC_WORKFLOW_RULES.md)
- 可选生命周期产物：见 [TASK_LIFECYCLE_RULES.md](./TASK_LIFECYCLE_RULES.md)
- 模板索引：见 [../templates/README.md](../templates/README.md)

模板只能复用本文件字段，不新增平行任务模型。
