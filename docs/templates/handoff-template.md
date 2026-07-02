# Handoff Template

用于 Handoff 阶段，在会话暂停、换 Agent、跨天继续或交给人类工程师时保留上下文。模板只承接 `TASK_LIFECYCLE_RULES.md`。

```markdown
## 交接

- 当前目标：
- 已确认需求：
- 非目标：
- 已完成事项：
- 未完成事项：
- 关键决策：
- 涉及文件：
- 验证情况：
- Git 状态：
- Worktree / 分支状态：
- Merge-back 状态：
- 待人工确认：
- 已知风险：
- 下一步建议：
- 续接提示词：
```

## 使用约定

- 短任务可把交接摘要写在最终回复，但字段语义保持一致。
- `已完成事项` 与 `未完成事项` 必须分开写，不能用“基本完成”一类模糊表述覆盖。
- 只要存在未提交 git、未合并 worktree、merge-back 未完成、验证未跑完、review 未完成或红区确认未拿到，就必须写进交接，不得口头宣称完成。
- durable context 按 `AGENTS.md` 的 Memory 规则进入 `docs/memory/`，不要把临时实现细节塞进 memory。

## 关联文档

- [../rules/TASK_LIFECYCLE_RULES.md](../rules/TASK_LIFECYCLE_RULES.md)
- [../memory/README.md](../memory/README.md)
