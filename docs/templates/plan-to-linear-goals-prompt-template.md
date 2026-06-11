# Plan To Linear Goals Prompt Template

Use this prompt when a local plan needs to be split into Linear issues and Codex Goal prompts.

```markdown
请按当前仓库 `AGENTS.md` 执行本轮工作。

本轮目标不是实现代码，而是把计划拆成 Linear issue，并为每个 issue 生成 Codex Goal 执行提示词。

计划文件：`<PLAN_FILE_PATH>`

## 必读

- `AGENTS.md`
- `docs/LINEAR_TASK.md`
- `docs/DYNAMIC_WORKFLOW_RULES.md`
- `docs/templates/linear-issue-template.md`
- `docs/templates/codex-goal-prompt-template.md`

## 执行步骤

1. 读取计划全文。
2. 识别功能点、风险点、依赖关系、阻塞项和必须人工确认的事项。
3. 按可独立验收的垂直切片拆分 Linear issue。
4. 高风险前置事项单独拆成 Blocking issue。
5. 每个 issue 使用 `docs/templates/linear-issue-template.md` 的结构。
6. 每个 issue 生成一份使用 `docs/templates/codex-goal-prompt-template.md` 的 Goal 提示词。
7. 如果 Linear 工具可用，先读取 team/project/label 状态，再创建或更新 issue；不确定 team/project/label 时先询问。
8. 如果 Linear 工具不可用，输出完整 issue 草案和 Goal 提示词，不要中断分析。

## 拆分要求

- 每个 issue 必须有目标、验收标准、非目标、影响范围、Workflow Packet、停止条件和验证要求。
- 不要把大任务只粗略拆成“前端”和“后端”。
- 涉及权限、菜单鉴权、接口契约、后端 migration/seed、统计口径、导出或敏感数据时，从严标注风险和停止条件。
- 计划中不明确但会影响行为或接口联调的内容，必须作为待确认项，不得替用户做业务决策。

## 输出

请最终输出：

1. 拆分策略说明。
2. Linear issue 列表。
3. 若已创建 Linear issue，列出 issue ID、标题、链接。
4. 若未创建，说明原因并给出可复制草案。
5. 每个 issue 对应的 Codex Goal 提示词。
6. 必须人工确认后才能进入实现的任务清单。
```
