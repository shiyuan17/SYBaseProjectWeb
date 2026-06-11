# AGENT_SKILL_ROUTING.md - AI Skill 路由规范

## 目标与适用范围

本文件定义 `SYBaseProjectWeb` 中外部 AI skills 的选用边界与推荐组合，避免在 `AGENTS.md` 和 `docs/DYNAMIC_WORKFLOW_RULES.md` 之外形成第二套任务路由。

- `AGENTS.md` 仍是协作边界、风险升级、交付要求的最高优先级规范
- `docs/DYNAMIC_WORKFLOW_RULES.md` 仍是选择主 Workflow、强制修饰器、专家 Agent、动态测试和 Red Team 的唯一来源
- 本文件只说明可选 skills 如何补强对应 Workflow，不改变红区确认、验证命令、Memory Update 或跨仓核对要求

## 使用原则

- 每个任务优先声明主 Workflow 和强制修饰器，再选择 skills
- 常规任务最多使用 1 个流程 skill、1 个专项 skill、1 个验证 skill
- 外部 skills 只作为专家清单、执行方法或审查提示，不替代项目规范
- 不把第三方 skill 源码复制进仓库；需要安装时优先安装到 Codex 用户级 skills 目录
- 同名或能力重叠的 skills 只保留一个主用来源，避免重复触发
- 涉及红区、权限、患者/报告数据、接口契约、构建发布时，仍按 `AGENTS.md` 升级人工确认

## 推荐安装集

### Superpowers

Superpowers 适合作为流程阶段门。当前项目推荐使用：

| Skill | 使用场景 |
| --- | --- |
| `using-superpowers` | 会话开始时检查是否有适用 skill |
| `brainstorming` | 中大型功能、验收标准不清、方案分叉时先澄清 |
| `writing-plans` | 需求确认后拆实施计划 |
| `test-driven-development` | 新增逻辑、缺陷修复、关键重构 |
| `systematic-debugging` | Bug、生产问题、无法解释的失败 |
| `verification-before-completion` | 交付前确认真实验证命令与结果 |
| `requesting-code-review` | 重要改动完成后进行审查 |
| `using-git-worktrees` | Linear 任务或需要隔离工作区的功能分支 |

### Matt Pocock skills

Matt Pocock skills 适合作为需求追问、诊断和交接补强。当前项目推荐使用：

| Skill             | 使用场景                                     |
| ----------------- | -------------------------------------------- |
| `grill-me`        | 设计方案需要被追问、拆风险、补验收标准       |
| `grill-with-docs` | 需要对照仓库文档、规范或既有实现追问方案     |
| `diagnose`        | 复杂问题诊断，可作为 Production Debug 的补充 |
| `handoff`         | 长任务、上下文压缩、多人接手前生成移交信息   |

> `grill-me` 和 `handoff` 若已由项目或用户级目录提供，不重复安装同名 skill。

### Addy Osmani agent-skills

Addy Osmani agent-skills 适合作为专项专家 Agent 和审查清单。当前项目推荐使用：

| Skill | 使用场景 |
| --- | --- |
| `code-review-and-quality` | 通用代码审查、可维护性、测试缺口 |
| `frontend-ui-engineering` | UI Workflow，页面、组件、交互、可访问性、一致性 |
| `api-and-interface-design` | API Workflow，接口契约、分页、错误模型、兼容性 |
| `security-and-hardening` | Security Workflow，权限、敏感数据、泄露与绕过检查 |
| `browser-testing-with-devtools` | UI 或联调任务的真实浏览器验证补强 |
| `debugging-and-error-recovery` | Bug 诊断、错误恢复路径、异常分支检查 |
| `code-simplification` | 架构或重构任务中的简化、去浅封装、降低认知负担 |
| `documentation-and-adrs` | 需要沉淀 `DECISIONS.md`、架构约束或交付文档时 |

## Workflow 映射

| 主 Workflow | 推荐流程 skill | 推荐专项 skill | 推荐验证 skill | 注意事项 |
| --- | --- | --- | --- | --- |
| UI | `brainstorming` / `test-driven-development` | `frontend-ui-engineering` | `browser-testing-with-devtools` / `verification-before-completion` | 必须保留 Browser 验证要求，UI 截图或录屏按任务风险补充 |
| API | `test-driven-development` | `api-and-interface-design` | `verification-before-completion` | 涉及后端契约时必须执行 Backend Cross-check |
| DB | `brainstorming` / `writing-plans` | `api-and-interface-design` | `verification-before-completion` | 前端只记录展示与兼容验证，数据库证据引用后端 |
| Security | `brainstorming` / `test-driven-development` | `security-and-hardening` | `requesting-code-review` / `verification-before-completion` | 权限、患者/报告信息、审计任务必须叠加 Red Team |
| Architecture | `writing-plans` | `code-simplification` / `code-review-and-quality` | `requesting-code-review` / `verification-before-completion` | 结构性问题优先 codegraph 或 Understand Anything |
| Production Debug | `systematic-debugging` | `diagnose` / `debugging-and-error-recovery` | `verification-before-completion` | 必须先读 `.logs/`，先复现，再修复，再回归 |
| Workflow-Infra | `writing-plans` | `code-review-and-quality` / `documentation-and-adrs` | `verification-before-completion` | 不改 CI/CD、hook、构建发布红区前必须人工确认 |
| 纯文档 / 咨询 | 无强制 | `documentation-and-adrs` 可选 | 按文档变更选择 markdown/link 检查 | 可标注主 Workflow 不适用 |

## 触发与避免

建议触发：

- 验收标准不完整，且不同理解会改变行为时，用 `brainstorming` 或 `grill-with-docs`
- 新增逻辑或修复 bug 时，用 `test-driven-development`
- 生产问题或日志错误时，用 `systematic-debugging`
- UI 任务完成后，用 `browser-testing-with-devtools` 或项目 Browser 验证
- 交付前，用 `verification-before-completion`
- 重要改动合入前，用 `requesting-code-review` 或 `code-review-and-quality`

避免触发：

- 不要同时使用两套同类流程 skill，例如 Superpowers TDD 和 Matt TDD
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

- 新增或替换推荐 skill 时，先确认它和现有 Workflow 的关系
- 如果 skill 只适用于单次任务，不写入本文件
- 如果 skill 改变后续协作方式，追加 `DECISIONS.md`
- 如果 skill 改变稳定架构边界或跨仓约束，更新 `ARCHITECTURE.md`
