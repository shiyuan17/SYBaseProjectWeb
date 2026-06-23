# AGENT_SKILL_ROUTING.md — AI Skill 路由（精简）

外部 skill 仅作 Workflow 补强，**不得覆盖** `AGENTS.md` 与 `DYNAMIC_WORKFLOW_RULES.md` 的强制要求。以当前环境已安装 skill 为准。

## 原则

- 先声明主 Workflow 与修饰器，再选 skill（常规 ≤1 流程 + 1 专项 + 1 验证）
- 红区 / 权限 / 患者报告 / 构建发布仍按 `AGENTS.md` 升级确认
- 不引用未安装 skill；Superpowers 未安装时用 `grill-me` / `diagnose` / `code-review-and-quality` 等已装 skill 回退

## AI 实现补充约束（借鉴外部 steering，非主规范）

说明：本节用于约束外部/通用 agent 的默认实现倾向，目标是减少重复造轮子、过度抽象和无验证交付；项目级流程、风险分级、人工确认与验证口径仍以仓库现有规范为准。

以下规则仅作为 agent 实施阶段的补充护栏，**不得覆盖** `AGENTS.md`、`CODING_RULES.md`、`FRONTEND_RULES.md`、`DYNAMIC_WORKFLOW_RULES.md` 的现有强制要求。

### 1. 能复用就不重写

- 先查仓内现有实现、模块内工具、共享组件、已存在 service / mapper / composable，再决定是否新增代码
- 选择顺序默认遵循：**仓内现有能力 > 平台原生 / 标准库 > 已安装依赖 > 新增依赖 / 新增抽象**
- 仅当现有能力明确不能满足成功标准时，才允许新增 helper、包装层或依赖

### 2. 默认最小实现，不为“以后可能会用”扩展

- agent 默认只交付当前成功标准所需的最小实现，不预建插件层、注册表、策略模式、平行配置体系或 speculative abstraction
- 若确需保留临时兼容、过渡分支或已知简化方案，必须明确说明**适用边界、失效条件和后续升级触发点**
- 不得为了“看起来更通用”扩大改动面或引入无验收价值的抽象

### 3. 非平凡逻辑必须留下最小验证证据

- 只要新增或修改的逻辑不是纯文案 / 注释 / 静态搬运，就应补充与复杂度匹配的最小验证
- 优先选择成本最低、反馈最直接的验证方式：已有单测补例 > 新增针对性单测 > 相关 E2E / 浏览器验证
- 不得以“逻辑很简单”替代验证；交付时必须说明已验证和未验证项

### 4. 偷懒不能牺牲边界质量

- agent 可以优先选择更短、更直接的实现，但不得因此省略错误处理、边界校验、权限约束、数据映射、文件名/编码处理、可访问性或用户可理解的失败反馈
- 涉及安全、患者/报告、权限、导出、跨仓契约、共享层时，仍以现有 Workflow 与修饰器要求为准，不因“最小实现”降级
- 若最短方案会引入隐性风险，应改用更稳妥实现，并在交付中写明权衡

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
