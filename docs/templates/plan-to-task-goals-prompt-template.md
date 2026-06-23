# Plan To Task Goals Prompt Template

Use this prompt when a local plan needs to be split into task items and Codex Goal prompts.

```markdown
请按当前仓库 `AGENTS.md` 执行本轮工作。

本轮目标不是实现代码，而是把计划拆成可独立验收的任务项，并为每个任务项生成 Codex Goal 执行提示词。

计划文件：`<PLAN_FILE_PATH>`

## 必读

- `AGENTS.md`
- `docs/rules/TASK_INTAKE.md`
- `docs/rules/DYNAMIC_WORKFLOW_RULES.md`
- `docs/rules/LOOP_ENGINEERING_RULES.md`
- `docs/templates/task-item-template.md`
- `docs/templates/codex-goal-prompt-template.md`

## 执行步骤

1. 读取计划全文。
2. 识别功能点、风险点、依赖关系、阻塞项和必须人工确认的事项。
3. 按可独立验收的垂直切片拆分任务项。
4. 高风险前置事项单独拆成 Blocking task。
5. 每个任务项使用 `docs/templates/task-item-template.md` 的结构。
6. 每个任务项生成一份使用 `docs/templates/codex-goal-prompt-template.md` 的 Goal 提示词。
7. 若任务来源平台有现成记录能力，可在输出中标注建议的标题、编号和状态同步方式；不强绑定任何平台。

## 拆分要求

- 每个任务项必须有目标、验收标准、非目标、影响范围、Workflow Packet、Loop Packet、停止条件和验证要求。
- 不要把大任务只粗略拆成“前端”和“后端”。
- 涉及权限、菜单鉴权、接口契约、后端 migration/seed、统计口径、导出或敏感数据时，从严标注风险和停止条件。
- 计划中不明确但会影响行为或接口联调的内容，必须作为待确认项，不得替用户做业务决策。

## 输出

请最终输出：

1. 拆分策略说明。
2. 任务项列表。
3. 若任务平台已存在记录，列出对应编号、标题、链接。
4. 若尚未建卡，说明原因并给出可复制草案。
5. 每个任务项对应的 Codex Goal 提示词。
6. 必须人工确认后才能进入实现的任务清单。
```
