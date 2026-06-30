# TASK_INTAKE.md — 任务启动块

从 issue、工单、卡片、PR、文档需求、本地 `backlog.json` 或口头任务开工时，用本文件把输入压成一个可执行启动块。它不替代 Workflow、Git 或生命周期细则。

## 启动块

```markdown
## Task Intake

- Source: `<issue / 工单 / 卡片 / PR / 文档需求 / backlog.json / docs/tasks/*.md / 口头任务 / 其他>`
- ID / title: `<如无写 N/A>`
- Link: `<如无写 N/A>`
- Goal:
- Acceptance criteria:
- Non-goals:
- Impact scope:
- Packet tier: `<Fast Path / Lightweight / Full>`
- Primary Workflow:
- Required modifiers:
- Risk level: `<低 / 中 / 高>`
- Worktree decision: `<使用 / 不使用；原因>`
- Validation commands:
- Stop conditions:
```

## 使用规则

- 来源只有编号、标题或一句模糊描述时，先回查正文、历史讨论和验收标准。
- 验收标准为空或会改变行为时，先 Clarify；需要规格或计划时按 `TASK_LIFECYCLE_RULES.md`。
- 来源为本地任务体系时，同时核对 `backlog.json` 条目与对应 `docs/tasks/*.md` 执行单元；字段职责见 `TASK_MANAGEMENT_RULES.md`。
- worktree 决策只写结论和原因；创建、merge-back、清理门槛见 `GIT_RULES.md`。
- 触发红区、权限、接口、患者/报告、构建发布、生产问题时，切到 Full 并按 `AGENTS.md` 请求人工确认。

## 动手前检查

- [ ] 已读来源、关联 spec / 设计 / PR 和现有实现。
- [ ] 已确认目标、验收、非目标和影响范围。
- [ ] 已查看 `git status --short`，能区分无关改动。
- [ ] 已按 `QUICKSTART.md` 选择最小阅读路径。
- [ ] 已按 `DYNAMIC_WORKFLOW_RULES.md` 选择 Workflow 与修饰器。
- [ ] 已按 `GIT_RULES.md` 完成 worktree 决策。
- [ ] 已列出能证明成功标准的验证命令或人工核对项。

## 关联文档

- [../../AGENTS.md](../../AGENTS.md)
- [./QUICKSTART.md](./QUICKSTART.md)
- [./DYNAMIC_WORKFLOW_RULES.md](./DYNAMIC_WORKFLOW_RULES.md)
- [./TASK_LIFECYCLE_RULES.md](./TASK_LIFECYCLE_RULES.md)
- [./TASK_MANAGEMENT_RULES.md](./TASK_MANAGEMENT_RULES.md)
- [./GIT_RULES.md](./GIT_RULES.md)
