# Handoff Template

用于 Handoff 阶段，在会话暂停、换 Agent、跨天继续或交给人类工程师时保留上下文。模板只承接 `TASK_LIFECYCLE_RULES.md`。

```markdown
## Handoff

- Current goal:
- Confirmed requirements:
- Non-goals:
- Completed:
- Not completed:
- Key decisions:
- Files touched:
- Validation run:
- Known risks:
- Next steps:
- Continue prompt:
```

## 使用约定

- 短任务可把交接摘要写在最终回复。
- durable context 按 `AGENTS.md` 的 Memory 规则进入 `docs/memory/`，不要把临时实现细节塞进 memory。

## 关联文档

- [../rules/TASK_LIFECYCLE_RULES.md](../rules/TASK_LIFECYCLE_RULES.md)
- [../memory/README.md](../memory/README.md)
