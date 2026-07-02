# Plan To Task Goals Prompt Template

Use this prompt when a local plan needs to be split into task items and Codex Goal prompts.

```markdown
请按当前仓库 `AGENTS.md` 执行本轮工作。

本轮目标不是实现代码，而是把计划拆成可独立验收的任务项，并为每个任务项生成 Codex Goal 执行提示词。

计划文件：`<PLAN_FILE_PATH>`

默认输出目录化任务模型：父任务在 `docs/tasks/<TASK_ID>-<slug>/README.md`，子任务在 `children/<TASK_ID>.<NNN>-<slug>.md`，状态清单在 `task.json`。不要把大量子任务平铺到 `docs/tasks/` 根目录。

## 必读

- `AGENTS.md`
- `docs/rules/TASK_INTAKE.md`
- `docs/rules/DYNAMIC_WORKFLOW_RULES.md`
- `docs/rules/LOOP_ENGINEERING_RULES.md`（仅计划或任务明确启用 loop 时必读）
- `docs/rules/TASK_MANAGEMENT_RULES.md`（仅任务需要落库到本地 backlog 体系时必读）
- `docs/templates/task-item-template.md`
- `docs/templates/codex-goal-prompt-template.md`

## 执行步骤

1. 读取计划全文。
2. 识别功能点、风险点、依赖关系、阻塞项和必须人工确认的事项。
3. 按可独立验收的垂直切片拆分任务项。
4. 高风险前置事项单独拆成 Blocking task。
5. 每个任务项使用 `docs/templates/task-item-template.md` 的结构。
6. 每个任务项生成一份使用 `docs/templates/codex-goal-prompt-template.md` 的 Goal 提示词。
7. 若任务需要落库到本地任务体系，同时生成父任务 `backlog.json` 条目草案、任务目录结构、父任务 `README.md` 草案、`task.json` 草案和每个子任务 Markdown 草案；条目草案必须包含 `risk`、`packetTier`、`validation`、`blockedReason`、`updatedAt` 推荐字段，目录模型父任务可额外包含 `taskDir`。
8. 父任务必须写 `Executable: false`；子任务 ID 使用 `<TASK_ID>.<NNN>`，只写入父任务目录 `task.json`，不写入全局 `backlog.json`。
9. 若任务来源平台有现成记录能力，可在输出中标注建议的标题、编号和状态同步方式；不强绑定任何平台。

## 拆分要求

- 每个任务项必须有目标、验收标准、非目标、影响范围、Dynamic Workflow、Memory、Evidence、停止条件和验证要求。
- 目录化子任务必须有 `Timebox: <= 5 minutes`、`Stop Condition`、`Verification Command`、`Rollback Plan`、`Non-goals`、`Evidence`。
- 每个子任务只允许一个可观察目标；超过 5 分钟、不可验证或不可回滚时继续拆分。
- Loop Packet 仅在计划、任务来源或用户明确启用 loop 时填写；未启用时写 `Not used（普通任务，按 Dynamic Workflow 交付）`。
- 不要把大任务只粗略拆成“前端”和“后端”。
- 涉及权限、菜单鉴权、接口契约、后端 migration/seed、统计口径、导出或敏感数据时，从严标注风险和停止条件。
- 计划中不明确但会影响行为或接口联调的内容，必须作为待确认项，不得替用户做业务决策。

## 输出

请最终输出：

1. 拆分策略说明。
2. 任务项列表。
3. 若任务平台已存在记录，列出对应编号、标题、链接。
4. 若尚未建卡，说明原因并给出可复制草案。
5. 若落库到本地任务体系，附父任务 `backlog.json` 条目草案、目录结构、父任务 `README.md`、`task.json` 和子任务 Markdown 草案，并说明阻塞任务的 `blockedReason` 与可执行任务的 `validation`。
6. 每个子任务对应的 Codex Goal 提示词；提示词必须只引用单个 `<TASK_ID>.<NNN>`。
7. 必须人工确认后才能进入实现的任务清单。
```
