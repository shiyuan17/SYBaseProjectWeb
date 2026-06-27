# AGENT_SKILL_ROUTING.md — AI Skill 路由（精简）

外部 skill 仅作 Workflow 补强，**不得覆盖** `AGENTS.md` 与 `DYNAMIC_WORKFLOW_RULES.md` 的强制要求。以当前环境已安装 skill 为准。

## 原则

- 先声明主 Workflow 与修饰器，再选 skill（常规 ≤1 流程 + 1 专项 + 1 验证）
- 红区 / 权限 / 患者报告 / 构建发布仍按 `AGENTS.md` 升级确认
- 不引用未安装 skill；优先使用当前环境已安装的等价调试、审查或专项 skill 回退

## 设计类 skill 补充

- 设计类任务默认只选 **一个主设计 skill**，不并列堆叠多个相似设计 skill
- 先按页面类型判断：营销 / 品牌展示 / 作品集 / 视觉改版优先 `taste-skill`
- 产品 UI / 后台 / 工具型界面 / settings / forms / critique / audit / polish 优先 `impeccable`
- 仅当需求只描述“提升设计感 / 避免模板味”，但未明确是营销页还是产品 UI 时，回退到 `frontend-design`
- 设计类 skill 只补强设计与执行方式，不改变 `AGENTS.md`、`DYNAMIC_WORKFLOW_RULES.md`、`CODING_RULES.md`、`FRONTEND_RULES.md` 的硬约束
- 不因使用设计类 skill 而跳过 Workflow、修饰器、红区确认、编码规范或验证要求

## 实现补充约束（摘要）

外部 skill 只补强执行方式，不重复定义编码规则。实现时遵循 `CODING_RULES.md` 与 `FRONTEND_RULES.md`：优先复用、最小实现、非平凡逻辑留验证证据，且不得因使用 skill 降级错误处理、权限、数据映射、编码或用户可理解的失败反馈。

## 常用映射

| Workflow | 专项 | 验证 |
| --- | --- | --- |
| UI | `frontend-ui-engineering` | `browser-testing-with-devtools` |
| API | `api-and-interface-design` | `code-review-and-quality` |
| Security | `security-and-hardening` | `code-review-and-quality` |
| Architecture | `code-simplification` | `code-review-and-quality` |
| Production Debug | `debugging-and-error-recovery` | 回归测试（规范要求） |
| 纯文档 | 可选 `documentation-and-adrs` | `check:governance` 等 |

## 设计类映射

| 场景 | 主设计 skill | 验证 |
| --- | --- | --- |
| `UI / landing / portfolio / redesign` | `taste-skill` | `browser-testing-with-devtools` |
| `UI / dashboard / app shell / settings / forms / polish` | `impeccable` | `browser-testing-with-devtools` |
| `UI / 泛设计提升 / 风格方向不明确` | `frontend-design` | `browser-testing-with-devtools` |

续接任务：`recall` / `handoff` / `session-history`。本文只维护项目推荐路由，不维护用户环境中的全量安装清单。
