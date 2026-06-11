# DYNAMIC_WORKFLOW_RULES.md — 动态任务路由剧本

## 目标与适用范围

本文件定义前端任务如何按类型选择不同 AI Workflow。动态 Workflow 不是只做 Review，而是决定本次任务应该启用哪些专家 Agent、测试、模拟、安全检查、数据库联动与红队对抗。

适用范围：

- `apps/web-ele` 页面、组件、路由、状态、接口适配与测试
- `packages` 与 `internal` 共享能力、构建和工具配置
- 跨前后端接口、权限、患者信息、报告信息和生产问题排查

## 总规则

每个任务必须先选择一个主 Workflow，再按风险叠加强制修饰器：

- 主 Workflow：UI、API、DB、Security、Architecture、Production Debug、Workflow-Infra 之一
- Security 修饰器：涉及权限、患者信息、报告信息、登录态、脱敏、审计时必须叠加
- DB 修饰器：涉及后端迁移、种子、SQL、数据兼容或回滚时必须叠加，并引用后端验证结果
- Red Team 修饰器：高风险、跨层、生产问题、权限/数据/报告相关任务必须叠加
- 跨仓任务：前端 PR 必须引用后端 MR/验证结果，后端 MR 必须引用前端 PR/验证结果

PR 必须填写 Workflow Packet，说明为什么选择该 Workflow、启用哪些专家 Agent、跑了哪些动态测试和模拟、红队攻击结论是什么。

专家 Agent 可由人工角色、子 Agent 或已安装 Codex skill 承担；可选 skill 映射见 `docs/AGENT_SKILL_ROUTING.md`。该映射只补充执行方式，不改变本文对主 Workflow、强制修饰器、动态测试、Red Team 与 Memory Update 的要求。

## 触发信号速查表

任务开始时先按"改动路径 / 需求信号"查下表选主 Workflow，再按命中行叠加必叠修饰器。一个任务可能命中多行：主 Workflow 取最贴近核心改动的一项，其余命中项作为修饰器叠加。判断有歧义或跨多类时，从严就高（优先叠加 Security / DB / Red Team）。

| 改动路径 / 需求信号 | 主 Workflow | 必叠修饰器 |
| --- | --- | --- |
| `apps/web-ele/**` 页面、组件、布局、样式、`*.vue`、Element Plus / Tailwind / ECharts、视口与浏览器兼容 | UI | Browser 验证（Browser Verification） |
| `**/api/**`、`*request*`、`*mapper*`、字段映射、错误码、分页协议、`*mock*`、后端联调 | API | Backend Cross-check（跨仓时） |
| 依赖后端 `db/migration`、SQL、种子数据、历史数据兼容、回滚 | DB | DB、Backend Cross-check、Red Team |
| 权限、登录态、菜单鉴权、路由守卫、患者信息、报告信息、敏感字段、导出、打印、下载、审计、日志脱敏 | Security | Security、Red Team |
| 大文件重构、共享组件 / `stores` / 路由 / `request` 边界、跨模块复用、循环依赖、构建/工具链 | Architecture | Red Team（跨层时） |
| 生产问题、线上故障、性能回退、用户现场阻塞、`.logs/` 中已有错误 | Production Debug | Red Team、Backend Cross-check（跨仓时） |
| Git hooks、GitHub Actions、构建/日志脚本、包管理、环境变量、发布路径 | Workflow-Infra | Red Team（红区时） |
| 纯文档、注释、闲聊或信息查询，不改运行时行为 | 不适用（标注原因即可） | 无 |

修饰器叠加底线（与「总规则」一致）：

- 涉及权限 / 患者信息 / 报告信息 / 登录态 / 脱敏 / 审计 → 必叠 Security
- 涉及后端迁移 / 种子 / SQL / 数据兼容 / 回滚 → 必叠 DB，并引用后端验证结果
- 高风险 / 跨层 / 生产问题 / 权限 / 数据 / 报告相关 → 必叠 Red Team
- 需要对照后端 `SYBaseProject` 实现或验证 → 必叠 Backend Cross-check，并双向引用

## Workflow Packet

PR 中必须包含以下信息：

- 主 Workflow：
- 触发信号：改动路径、需求类型、风险点
- 专家 Agent：本次使用的专家角色
- 动态测试：实际运行的命令和结果
- 动态模拟：角色、数据、浏览器、接口异常或日志回放场景
- 动态安全：是否触发 Security 修饰器，结论是什么
- 动态数据库：是否触发 DB 修饰器，后端验证链接或说明是什么
- Red Team：攻击路径、失败/成功结论、剩余风险
- Memory Update：更新的记忆文件、未更新文件与原因、相关记忆项 ID、跨仓引用

## Memory Layer

所有 Workflow 都必须在交付前检查根目录五类记忆文件，并判断本次任务是否产生持久上下文。五类文件的职责与通用更新触发条件以 `AGENTS.md` 第 8 节「AI Memory Update」为唯一来源，本文件不再重复，只补充各 Workflow 的强制重点。

强制重点：

- Security Workflow 必须特别检查 `KNOWN_BUGS.md`、`DECISIONS.md`、`ARCHITECTURE.md`
- DB Workflow 必须特别检查 `TECH_DEBT.md`、`KNOWN_BUGS.md`、`DECISIONS.md`、`ARCHITECTURE.md`
- Production Debug Workflow 必须特别检查 `PROJECT_STATE.md`、`KNOWN_BUGS.md`、`DECISIONS.md`
- Architecture Workflow 必须特别检查 `DECISIONS.md`、`ARCHITECTURE.md`，必要时更新 `TECH_DEBT.md`
- 跨仓任务必须双向引用前后端记忆项和验证证据

不做流水账式“无变化”更新；未更新的文件只在交付摘要和 PR Memory Update Packet 中说明原因。

## UI Workflow

触发条件：

- 页面、组件、布局、交互、Element Plus、Tailwind、ECharts、移动端或浏览器兼容改动

专家 Agent：

- UI/UX Agent：检查交互、信息密度、状态反馈、视觉一致性
- Browser 验证 Agent：通过浏览器截图、录屏或 E2E 检查真实渲染

动态测试：

- `pnpm test:unit` 或受影响组件/页面的 Vitest
- 必要时 `pnpm test:e2e`
- UI 涉及共享组件或路由时补跑 `pnpm check:type`

动态模拟：

- 不同角色、权限菜单、空态、加载态、失败态、重复提交
- 桌面和移动视口
- 浏览器下载、导出、中文文件名、长文本溢出

红队问题：

- 是否能通过隐藏入口绕过权限
- 是否存在遮挡、错位、按钮不可点击、错误态无提示
- 是否把患者/报告数据暴露在错误弹窗、URL、日志或导出文件中

交付证据：

- 截图/录屏、测试命令、浏览器验证范围、未验证项

记忆层重点：

- UI 状态、验证基线或交接重点变化时更新 `PROJECT_STATE.md`
- 发现持久 UI 债务或可复现 UI bug 时更新 `TECH_DEBT.md` / `KNOWN_BUGS.md`
- 改变共享组件、浏览器兼容边界或视觉系统约束时更新 `DECISIONS.md` / `ARCHITECTURE.md`

## API Workflow

触发条件：

- 前端请求模型、字段映射、错误处理、分页协议、接口路径、mock 或后端联调改动

专家 Agent：

- API Contract Agent：对齐前后端字段、状态码、错误码、分页和兼容性
- Backend Cross-check Agent：需要时对照 `SYBaseProject` 后端实现

动态测试：

- `pnpm test:unit` 中对应 service、mapper、request、menu 或页面测试
- 必要时 `pnpm test:e2e`
- 跨仓时引用后端 `./mvnw -pl <module> -am verify` 或 API 回归结果

动态模拟：

- 成功响应、错误响应、空列表、分页边界、超时、重复提交
- 后端字段缺失、旧字段兼容、新字段默认值

红队问题：

- 是否直接把后端 DTO 透传到视图
- 是否吞掉接口错误或显示误导性成功
- 是否字段错配导致权限、状态或金额/数量展示错误

交付证据：

- 接口影响说明、字段映射说明、请求/响应样例、失败分支验证

记忆层重点：

- 跨仓接口契约、字段映射或错误模型形成稳定结论时更新 `DECISIONS.md`
- 接口兼容债务或已知联调缺陷更新 `TECH_DEBT.md` / `KNOWN_BUGS.md`
- 涉及后端契约变化时在前后端记忆文件中双向引用

## DB Workflow

触发条件：

- 前端任务依赖后端数据库迁移、种子数据、SQL 回滚、历史数据兼容

专家 Agent：

- DB/Migration Agent：检查迁移、回滚、幂等、旧数据兼容
- Backend Cross-check Agent：对照后端 `SYBaseProject/docs/rules/DB_RULES.md` 与迁移脚本

动态测试：

- 前端只验证展示与接口兼容；数据库验证必须引用后端 MR 结果
- 后端应提供迁移、回滚、种子、兼容查询或 API 回归证据

动态模拟：

- 旧数据、新数据、空数据、重复迁移、部分失败、回滚后查询

红队问题：

- 是否可能丢数据、重复写、错写状态
- 是否前端把兼容缺口隐藏成正常空态
- 是否缺少回滚路径或目标环境确认

交付证据：

- 后端迁移验证链接、目标环境待验项、前端兼容验证范围

记忆层重点：

- 数据库兼容、迁移、回滚或目标环境约束必须检查 `TECH_DEBT.md`、`KNOWN_BUGS.md`、`DECISIONS.md`、`ARCHITECTURE.md`
- 前端只记录与展示、接口兼容、交接风险有关的持久上下文，并引用后端验证

## Security Workflow

触发条件：

- 权限、登录态、菜单鉴权、患者信息、报告信息、敏感字段、导出、日志、审计

专家 Agent：

- Security/Privacy Agent：检查最小权限、数据范围、脱敏、审计与日志
- Red Team Agent：主动尝试越权、泄密和绕过

动态测试：

- 权限/菜单/路由相关单测
- `tests/e2e/smoke/auth-router-request.spec.ts` 或相关 E2E
- 后端权限改动需引用对应接口/鉴权测试结果

动态模拟：

- 低权限角色、未登录、过期登录态、无菜单但直达 URL、跨角色数据访问
- 患者/报告数据导出、打印、下载、错误弹窗

红队问题：

- 是否能直达页面或调用接口绕过菜单权限
- 是否患者/报告数据进入 URL、日志、错误提示或未授权导出
- 是否前端只靠隐藏按钮而没有后端授权兜底

交付证据：

- 权限矩阵、角色模拟结果、敏感数据暴露检查、未验证项

记忆层重点：

- 权限、患者信息、报告信息、脱敏、审计相关结论必须检查 `KNOWN_BUGS.md`、`DECISIONS.md`、`ARCHITECTURE.md`
- 可复现越权、泄露、审计缺口必须进入 `KNOWN_BUGS.md`，安全债务进入 `TECH_DEBT.md`

## Architecture Workflow

触发条件：

- 大文件重构、共享组件、路由/store/request 边界、跨模块复用、构建/工具链改动

专家 Agent：

- Architecture Agent：检查模块边界、共享契约、影响面和测试面
- Codegraph Agent：优先用 codegraph 查调用关系与影响半径

动态测试：

- `pnpm lint`
- `pnpm check:type`
- `pnpm check:circular`
- 受影响模块单测，必要时完整 `pnpm test:unit`

动态模拟：

- 主要调用方兼容、删除测试、旧路径/旧入口、懒加载和构建产物

红队问题：

- 是否制造浅封装、跨层依赖或共享层业务耦合
- 是否破坏旧调用方或隐藏循环依赖
- 是否为了重构删除测试、降级或兼容逻辑

交付证据：

- 影响面说明、调用关系、受影响测试、兼容性说明

记忆层重点：

- 模块边界、共享契约、跨层约束变化必须更新 `ARCHITECTURE.md`
- 形成架构取舍时追加 `DECISIONS.md`
- 发现大文件、浅封装、循环依赖等持久问题时更新 `TECH_DEBT.md`

## Production Debug Workflow

触发条件：

- 生产问题、线上故障、性能回退、用户现场阻塞、日志中已有错误

专家 Agent：

- Diagnose Agent：执行日志优先、复现优先、最小修复、回归测试
- Execution Agent：记录命令、环境、证据与回滚路径

动态测试：

- 先构造可重复反馈环，再写回归测试
- 前端问题优先读取 `.logs/frontend.log`
- 跨仓问题必须读取 `.logs/backend.log`

动态模拟：

- 日志回放、请求重放、故障输入、目标环境配置差异、慢接口

红队问题：

- 是否未复现就修复
- 是否只修表象没有验证原始故障
- 是否缺少回滚路径、监控信号或失败证据

交付证据：

- 复现步骤、日志片段、修复前后对比、回归测试、回滚说明

记忆层重点：

- 生产问题必须检查 `PROJECT_STATE.md`、`KNOWN_BUGS.md`、`DECISIONS.md`
- 已复现故障进入 `KNOWN_BUGS.md`，回滚或处置决策进入 `DECISIONS.md`
- 当前阻塞、验证基线和交接重点更新 `PROJECT_STATE.md`

## Workflow-Infra Workflow

触发条件：

- Git hooks、GitHub Actions、构建脚本、日志脚本、包管理、环境变量、发布路径

专家 Agent：

- Workflow-Infra Agent：检查本地命令、CI、缓存、跨平台与发布风险

动态测试：

- 对应 hook/CI 命令
- `pnpm lint`
- 必要时 `pnpm build:ele`

动态模拟：

- Windows/Unix 命令差异、空路径、缺依赖、CI 与本地环境差异

红队问题：

- 是否能绕过 hook 或 CI
- 是否命令会改写非目标文件
- 是否把本地绝对路径、密钥或环境特例写入仓库

交付证据：

- 命令结果、跨平台说明、CI 影响、回滚方式

记忆层重点：

- hook、CI、脚本、环境约束变化时更新 `PROJECT_STATE.md` 或 `DECISIONS.md`
- 稳定工具边界或跨平台约束变化时更新 `ARCHITECTURE.md`
- 已知 hook/CI 阻塞进入 `KNOWN_BUGS.md`，长期治理缺口进入 `TECH_DEBT.md`
