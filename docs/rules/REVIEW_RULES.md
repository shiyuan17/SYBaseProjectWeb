# REVIEW_RULES.md — Code Review 与证据质量规范

本文件是 Review 深度、阻塞条件、AI checker 和证据质量的唯一细则来源。Git 分支、提交和 PR 流程仍以 `GIT_RULES.md` 为准。

## Review 五轴

| 轴         | 必查问题                                     |
| ---------- | -------------------------------------------- |
| 正确性     | 是否满足需求、验收、边界条件、失败路径       |
| 可读性     | 命名、控制流、模块组织是否让新人和 AI 能理解 |
| 架构       | 是否符合模块边界、共享契约、依赖方向         |
| 安全       | 权限、数据泄露、输入输出、越权路径           |
| 性能与兼容 | 渲染、请求量、列表规模、浏览器能力、回滚兼容 |

## 严重度

| 等级 | 含义 | 处理 |
| --- | --- | --- |
| P0 / Blocking | 会导致数据错误、权限绕过、构建失败、接口破坏或无法回滚 | 必须修复后再合并 |
| P1 / Required | 明确风险或规范缺口，但有可控修复路径 | 合并前修复或写明 owner 和期限 |
| P2 / Suggested | 可维护性、可读性、后续优化 | 可不阻塞，但应记录 |

## 阻塞条件

出现以下任一情况不得通过 Review：

- 未提供真实验证结果，或验证与改动风险不匹配。
- PR Packet 缺少必需 Workflow、Memory、Evidence 或 Red Team 字段。
- 涉及 API / DB / 权限 / 报告 / 生产问题但没有跨仓证据或失败路径验证。
- 修改共享层、路由、请求底座、构建、CI、环境变量但没有说明影响和回滚。
- AI Agent 明显编造接口、删除测试、覆盖用户改动或越权修改红区文件。

## 证据质量

好证据必须包含：

- 命令或操作名称。
- 实际结果：通过数量、失败摘要、截图、日志、接口响应或人工确认来源。
- 覆盖范围：哪些风险已覆盖，哪些未覆盖。
- 剩余风险和 owner。

坏证据示例：

- `测试通过`，但没有命令。
- `应该没问题`。
- `已人工验证`，但没有账号、环境、路径或结果。
- `后端已支持`，但没有后端 commit、MR、接口样例或负责人确认。

## AI Checker 使用

- 高风险 PR 建议至少增加一个独立 AI checker 或人工 reviewer，从五轴中选择重点。
- Checker 只提供审查意见，不能替代主 Agent 的验证和人工批准。
- 主 Agent 必须复核 checker 输出，不得照单全收或忽略阻塞项。
- PR Packet 的 `Checker / reviewer source` 填写 checker 来源和结论摘要。

## Review 输出模板

```markdown
## Review

- Verdict: Approve / Request changes
- Scope reviewed:
- Blocking findings:
- Required fixes:
- Suggested follow-ups:
- Verification checked:
- Residual risk:
```

## 关联文档

- [./GIT_RULES.md](./GIT_RULES.md)
- [./DYNAMIC_WORKFLOW_RULES.md](./DYNAMIC_WORKFLOW_RULES.md)
- [./API_RULES.md](./API_RULES.md)
- [./DB_RULES.md](./DB_RULES.md)
- [./TEST_RULES.md](./TEST_RULES.md)
