# 治理模板填写范例

字段语义以 `AGENTS.md` 与 `DYNAMIC_WORKFLOW_RULES.md` 为准；API、DB、测试和 Review 证据分别引用 `API_RULES.md`、`DB_RULES.md`、`TEST_RULES.md`、`REVIEW_RULES.md`。本文仅示例，不新增字段。

## 档位速查

| 档位 | 判断 | 填写重点 |
| --- | --- | --- |
| Fast Path | 纯文档 / 只读 / 不改运行时 | `Primary Workflow: Not applicable (<reason>)` + Summary 验证 |
| Lightweight | 低风险实现，无强制高风险修饰器 | Dynamic Workflow + Evidence 中的验证和剩余风险 |
| Full | 权限/数据/跨仓/红区/修饰器 | Dynamic Workflow + Full Evidence + Red Team 四要素 |

## 范例：Fast Path 任务确认

```markdown
## 任务确认（Fast Path）

- 任务目标: 修正 FRONTEND_RULES 死链
- 影响范围: docs/rules/FRONTEND_RULES.md
- 主 Workflow: 不适用（纯文档）
- 成功标准: pnpm run check:governance 通过
```

## 范例：轻量 Workflow Packet

```markdown
## Dynamic Workflow

- Primary Workflow: UI
- Trigger signals: 模块内展示文案调整
- Required modifiers: None
- Dynamic tests / validation: pnpm test:unit -- StatusLabel 3 passed
- Unverified items and risks: 未跑 E2E，因未改路由或关键链路
```

## 范例：Memory

```markdown
## Memory

- Memory: no durable context change
```

仅 durable 变更时填写更新文件和 ID，例如：`Memory: updated DECISIONS.md DEC-20260629-001`。

## 坏例子 → 修正后

坏：`Attack result: Done, no problem.`

修正后：`Attack result: 无权限角色导出返回 403；Residual risk: 审计落库由后端 MR 验证。`

## 关联文档

- [../../AGENTS.md](../../AGENTS.md)
- [../rules/DYNAMIC_WORKFLOW_RULES.md](../rules/DYNAMIC_WORKFLOW_RULES.md)
- [../rules/API_RULES.md](../rules/API_RULES.md)
- [../rules/DB_RULES.md](../rules/DB_RULES.md)
- [../rules/TEST_RULES.md](../rules/TEST_RULES.md)
- [../rules/REVIEW_RULES.md](../rules/REVIEW_RULES.md)
- [../../.github/PULL_REQUEST_TEMPLATE.md](../../.github/PULL_REQUEST_TEMPLATE.md)
