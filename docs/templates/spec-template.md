# Spec Template

用于 Spec 阶段，定义“做什么”和验收边界。模板只承接 `TASK_LIFECYCLE_RULES.md`，不替代 Dynamic Workflow / Memory / Evidence。

```markdown
## Spec

### Background

### Goals

### Non-goals

### Users / Roles

### Business Flow

### UI Behavior

### API Contract

### Data Shape

### Permission / Security Rules

### Error Handling

### Acceptance Criteria

- [ ]

### Test Strategy

### Risks
```

## 使用约定

- 接口、权限、患者/报告、跨仓或复杂 UI 行为必须把关键契约写清楚。
- 纯文档、低风险文案或测试-only 任务可说明不适用。

## 关联文档

- [../rules/TASK_LIFECYCLE_RULES.md](../rules/TASK_LIFECYCLE_RULES.md)
- [../rules/DYNAMIC_WORKFLOW_RULES.md](../rules/DYNAMIC_WORKFLOW_RULES.md)
