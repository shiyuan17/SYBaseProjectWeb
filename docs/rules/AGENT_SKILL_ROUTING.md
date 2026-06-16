# AGENT_SKILL_ROUTING.md - AI Skill 路由规范

## 目标与适用范围

本文件定义 `SYBaseProjectWeb` 中外部 AI skills 的选用边界与推荐组合，避免在 `AGENTS.md` 和 `docs/rules/DYNAMIC_WORKFLOW_RULES.md` 之外形成第二套任务路由。

- `AGENTS.md` 仍是协作边界、风险升级、交付要求的最高优先级规范
- `docs/rules/DYNAMIC_WORKFLOW_RULES.md` 仍是选择主 Workflow、强制修饰器、专家 Agent、动态测试和 Red Team 的唯一来源
- 本文件只说明可选 skills 如何补强对应 Workflow，不改变红区确认、验证命令、Memory Update 或跨仓核对要求
- **本文件的映射以“当前环境已安装的 skill”为准**；引用未安装 skill 会导致执行落空，新增推荐前必须先确认该 skill 在 agent 的可用 skill 列表中真实存在

## 使用原则

- 每个任务优先声明主 Workflow 和强制修饰器，再选择 skills
- 常规任务最多使用 1 个流程 skill、1 个专项 skill、1 个验证 skill
- 外部 skills 只作为专家清单、执行方法或审查提示，不替代项目规范
- 不把第三方 skill 源码复制进仓库；需要安装时优先安装到用户级 skills 目录
- 同名或能力重叠的 skills 只保留一个主用来源，避免重复触发
- 涉及红区、权限、患者/报告数据、接口契约、构建发布时，仍按 `AGENTS.md` 升级人工确认
- Karpathy guidelines 仅作为“先澄清、简单优先、外科手术式修改、目标驱动验证”的行为基线参考，项目内不 vendor 第三方源码，也不把它作为新的任务路由体系

## 已安装主用集（当前环境可直接调用）

### 专项专家 / 审查类（Addy Osmani agent-skills，用户级）

| Skill | 使用场景 |
| --- | --- |
| `code-review-and-quality` | 通用代码审查、可维护性、测试缺口；合入前审查 |
| `frontend-ui-engineering` | UI Workflow，页面、组件、交互、可访问性、一致性 |
| `api-and-interface-design` | API Workflow，接口契约、分页、错误模型、兼容性 |
| `security-and-hardening` | Security Workflow，权限、敏感数据、泄露与绕过检查 |
| `browser-testing-with-devtools` | UI 或联调任务的真实浏览器验证补强 |
| `debugging-and-error-recovery` | Bug 诊断、错误恢复路径、异常分支检查 |
| `code-simplification` | 架构或重构任务中的简化、去浅封装、降低认知负担 |
| `documentation-and-adrs` | 需要沉淀 `docs/memory/DECISIONS.md`、架构约束或交付文档时 |
| `spec-workflow-skill` | 治理文档、PR 模板、CI 门禁、协作规范类任务 |

### 追问 / 诊断 / 交接类（Matt Pocock 系，用户级或项目级）

| Skill             | 使用场景                                   |
| ----------------- | ------------------------------------------ |
| `grill-me`        | 设计方案需要被追问、拆风险、补验收标准     |
| `grill-with-docs` | 需要对照仓库文档、规范或既有实现追问方案   |
| `diagnose`        | 复杂问题诊断，作为 Production Debug 的补充 |
| `handoff`         | 长任务、上下文压缩、多人接手前生成移交信息 |

### 会话记忆类（本仓 `.agents/skills/`）

| Skill                                  | 使用场景                        |
| -------------------------------------- | ------------------------------- |
| `recall` / `recap` / `session-history` | 续接历史任务、恢复上下文        |
| `remember` / `forget`                  | 显式保存或删除长期记忆          |
| `commit-context` / `commit-history`    | 追溯某段代码来自哪次 agent 会话 |

### 后端仓补充（`SYBaseProject/.agents/skills/`，跨仓任务可用）

| Skill | 使用场景 |
| --- | --- |
| `tdd` | 新增逻辑、缺陷修复、关键重构的 red-green-refactor |
| `triage` / `to-issues` / `to-prd` | 任务分诊、计划拆 issue、上下文转 PRD |
| `prototype` | 设计定案前的一次性原型验证 |
| `playwright-cli` | 浏览器自动化与 E2E 补强 |

## 可选安装集（当前环境未默认安装）

Superpowers 系列适合作为流程阶段门，但**当前环境未安装**。任务中不要直接引用其 skill 名；按下表回退到已装等价能力，或先安装并确认可用后再引用：

| Superpowers skill | 已装回退 |
| --- | --- |
| `brainstorming` | `grill-me` / `grill-with-docs` |
| `writing-plans` | `spec-workflow-skill`，或按 `AGENTS.md` §4 任务确认 + Plan 模式 |
| `test-driven-development` | 后端仓 `tdd`，或按 `docs/rules/CODING_RULES.md` 测试基线执行 |
| `systematic-debugging` | `diagnose` / `debugging-and-error-recovery` |
| `verification-before-completion` | `AGENTS.md` §7 执行后验证强制回路（规范，非 skill） |
| `requesting-code-review` | `code-review-and-quality` |
| `using-git-worktrees` | `docs/rules/GIT_RULES.md` 第 6 节（规范，非 skill） |

## Workflow 映射

| 主 Workflow | 推荐流程 skill | 推荐专项 skill | 推荐验证 skill | 注意事项 |
| --- | --- | --- | --- | --- |
| UI | `grill-me`（方案分叉时） | `frontend-ui-engineering` | `browser-testing-with-devtools` | 必须保留 Browser 验证要求，UI 截图或录屏按任务风险补充 |
| API | `tdd`（后端仓） | `api-and-interface-design` | `code-review-and-quality` | 涉及后端契约时必须执行 Backend Cross-check |
| DB | `grill-with-docs` | `api-and-interface-design` | `code-review-and-quality` | 前端只记录展示与兼容验证，数据库证据引用后端 |
| Security | `grill-me` | `security-and-hardening` | `code-review-and-quality` | 权限、患者/报告信息、审计任务必须叠加 Red Team |
| Architecture | `grill-with-docs` | `code-simplification` / `code-review-and-quality` | `code-review-and-quality` | 结构性问题优先 codegraph 或 Understand Anything |
| Production Debug | `diagnose` | `debugging-and-error-recovery` | 回归测试（规范要求） | 必须先读 `.logs/`，先复现，再修复，再回归 |
| Workflow-Infra | `spec-workflow-skill` | `code-review-and-quality` / `documentation-and-adrs` | 对应 hook/CI 命令 | 不改 CI/CD、hook、构建发布红区前必须人工确认 |
| 纯文档 / 咨询 | 无强制 | `documentation-and-adrs` 可选 | 按文档变更选择 markdown/link 检查 | 可标注主 Workflow 不适用 |

> 验证列中“规范要求”指 `AGENTS.md` §7 与 `docs/rules/CODING_RULES.md` 的强制验证回路本身，不依赖任何外部 skill。

## 触发与避免

建议触发：

- 验收标准不完整，且不同理解会改变行为时，用 `grill-me` 或 `grill-with-docs`
- 新增逻辑或修复 bug 时，用 `tdd` 或按测试基线先补测试
- 生产问题或日志错误时，用 `diagnose`
- UI 任务完成后，用 `browser-testing-with-devtools` 或项目 Browser 验证
- 重要改动合入前，用 `code-review-and-quality`
- 续接历史任务时，用 `recall` / `session-history` / `handoff`

避免触发：

- 不要同时使用两套同类流程 skill，例如 `tdd` 与其他 TDD 类 skill
- 不要引用本文件「可选安装集」中未确认安装的 skill 名
- 不要为绿区小改强行写大型 spec 或 ADR
- 不要让外部 skill 改写本项目的 Workflow 分类、验证命令、分支模型或 Memory Update 规则
- 不要因为 skill 建议引入新依赖、hook、CI 或构建策略；这类变更按红区处理

## 交付记录

交付说明中的 Workflow Packet 可按以下口径记录 skills：

```markdown
- 专家 Agent: UI/UX Agent（frontend-ui-engineering），Browser 验证 Agent
- 动态测试: pnpm lint；pnpm check:type；相关 pnpm test:unit
- 动态模拟: 桌面/移动视口、加载/空态/错误态
- Red Team: 未触发 / 已执行，结论...
- Memory Update: 更新 DEC-... / 未更新，原因...
```

## 维护规则

- 新增或替换推荐 skill 时，先确认它在当前环境可用 skill 列表中真实存在，再确认它和现有 Workflow 的关系
- 环境中 skill 安装情况变化（新装 Superpowers、移除某套 skill）时，同步更新「已安装主用集」与「可选安装集」分区
- 如果 skill 只适用于单次任务，不写入本文件
- 如果 skill 改变后续协作方式，追加 `docs/memory/DECISIONS.md`
- 如果 skill 改变稳定架构边界或跨仓约束，更新 `docs/memory/ARCHITECTURE.md`
