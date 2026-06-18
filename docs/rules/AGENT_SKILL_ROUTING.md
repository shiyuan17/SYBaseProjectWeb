# AGENT_SKILL_ROUTING.md — AI Skill 路由（精简）

外部 skill 仅作 Workflow 补强，**不得覆盖** `AGENTS.md` 与 `DYNAMIC_WORKFLOW_RULES.md` 的强制要求。以当前环境已安装 skill 为准。

## 原则

- 先声明主 Workflow 与修饰器，再选 skill（常规 ≤1 流程 + 1 专项 + 1 验证）
- 红区 / 权限 / 患者报告 / 构建发布仍按 `AGENTS.md` 升级确认
- 不引用未安装 skill；Superpowers 未安装时用 `grill-me` / `diagnose` / `code-review-and-quality` 等已装 skill 回退

## 常用映射

| Workflow | 专项 | 验证 |
| --- | --- | --- |
| UI | `frontend-ui-engineering` | `browser-testing-with-devtools` |
| API | `api-and-interface-design` | `code-review-and-quality` |
| Security | `security-and-hardening` | `code-review-and-quality` |
| Architecture | `code-simplification` | `code-review-and-quality` |
| Production Debug | `debugging-and-error-recovery` | 回归测试（规范要求） |
| 纯文档 | 可选 `documentation-and-adrs` | `check:governance` 等 |

续接任务：`recall` / `handoff` / `session-history`。完整 skill 列表见用户环境，不在此维护。
