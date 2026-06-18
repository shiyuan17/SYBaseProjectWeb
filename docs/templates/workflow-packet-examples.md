# 治理模板填写范例

字段语义以 `AGENTS.md` 与 `DYNAMIC_WORKFLOW_RULES.md` 为准；本文仅示例，不新增字段。

## 档位速查

| 档位 | 判断 | 填写重点 |
| --- | --- | --- |
| Fast Path | 纯文档 / 只读 / 不改运行时 | `Primary Workflow: Not applicable (<reason>)` + 验证 + Memory 一行 |
| Lightweight | 低风险实现，无强制修饰器 | 主 Workflow + 触发信号 + 验证 + Memory + 剩余风险 |
| Full | 权限/数据/跨仓/红区/修饰器 | 完整 Packet + Red Team 四要素 |

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
## Workflow Packet
- 主 Workflow: UI
- 触发信号: 模块内展示文案调整
- 动态测试: pnpm test:unit -- StatusLabel 3 passed
- 剩余风险: 未跑 E2E
```

## 范例：Memory Update Packet（仅 durable 变更时）

```markdown
## Memory Update Packet
- Memory: 更新 DECISIONS.md DEC-…
```

## 坏例子 → 修正后

坏：`Attack result: Done, no problem.`

修正后：`Attack result: 无权限角色导出返回 403；剩余风险：审计落库由后端 MR 验证。`

## 关联文档

- [../../AGENTS.md](../../AGENTS.md)
- [../rules/DYNAMIC_WORKFLOW_RULES.md](../rules/DYNAMIC_WORKFLOW_RULES.md)
- [../../.github/PULL_REQUEST_TEMPLATE.md](../../.github/PULL_REQUEST_TEMPLATE.md)
