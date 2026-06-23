# GIT_RULES.md — Git 协作与分支规范

## 目标与适用范围

本文件定义项目的 Git 分支模型、提交规范、PR 规则与合并流程。

- 适用对象：所有开发者、审查者、发布负责人、AI 助手
- 适用范围：日常开发、缺陷修复、发布分支、热修复分支、文档分支
- 规范定位：以 `Git Flow` 作为默认协作模型，支撑 `RELEASE.md` 的发布流程

## 强制规则

### 1. 分支模型

默认分支模型：

- `main`：生产稳定分支
- `develop`：日常集成分支
- `feature/*`：功能开发
- `fix/*`：非线上紧急缺陷修复
- `hotfix/*`：生产紧急修复
- `release/*`：发布准备
- `docs/*`：文档更新
- `refactor/*`：重构治理

### 2. 分支命名

推荐格式：

- `feature/ENG-123-user-management`
- `fix/ENG-456-table-pagination`
- `hotfix/ENG-789-login-redirect`
- `release/1.2.0`
- `docs/frontend-rules-baseline`
- `refactor/split-dashboard-module`

要求：

- 使用英文小写短语，单词间用 `-`
- 如有工单号、issue 编号或任务卡号，建议带上编号（例如 `ENG-123`）
- 用户、任务来源或团队流程若明确要求编号，则必须带上编号
- 一个分支只承载一类目标，不得混合多项无关改动

### 3. 提交规范

- 提交信息统一遵循 `Conventional Commits 1.0.0`
- 推荐类型：`feat`、`fix`、`refactor`、`docs`、`test`、`build`、`ci`、`chore`、`revert`
- 建议格式：`type(scope): subject`

示例：

- `feat(user-management): add user list filters`
- `fix(router): guard unauthorized routes`
- `docs(rules): add frontend engineering baseline`

### 3.1 AI 主动提交规范

AI 助手执行提交前，必须先给出建议提交分组，再按风险等级决定是否可以自动提交。提交分组以“可描述、可验证、可回滚的验收点”为默认粒度，不按文件类型机械拆分。

默认策略：

- 低风险：允许 AI 自动提交
- 中风险：允许 AI 自动提交，但必须先完成验证并明确写出风险说明
- 高风险：必须先获人工确认后才能提交
- 全局总开关：若用户明确说“不要提交 / 只给分组 / 等我确认”，任何风险等级都不得自动提交

建议提交分组至少包含：

- `Commit group`：提交主题、建议 commit message、对应验收点
- `Included files / Excluded files`：包含 / 排除文件
- `Validation`：验证证据或未验证说明
- `Risk`：低 / 中 / 高 + 风险说明
- `Rollback`：回滚影响与回滚方式
- `Needs human approval?`：是否需要人工确认

推荐输出模板：

```markdown
Commit group:
Included files:
Excluded files:
Validation:
Risk:
Rollback:
Needs human approval?:
```

自动提交授权边界：

- 低风险：AI 可在说明提交分组后自动提交
- 中风险：AI 可在说明提交分组后自动提交，但必须明确风险点、验证结果和不包含无关改动
- 高风险：AI 必须暂停，等待用户明确同意后才能提交
- 用户若明确说“不要提交 / 只给分组 / 等我确认”，任何评级都不得自动提交

风险评级标准：

| 等级 | 判定标准 | 提交策略 |
| --- | --- | --- |
| 低 | 纯文档、小范围测试、局部非运行时代码整理；不影响接口、权限、路由、构建、全局样式或共享契约 | 说明分组后可自动提交 |
| 中 | 单一验收点内的业务页面、组件、局部 service/composable、对应测试或记忆更新；影响范围清楚，验证已覆盖主要路径 | 说明风险和验证后可自动提交 |
| 高 | 涉及红区、权限/登录态/菜单鉴权、Axios 全局层、路由守卫、构建/CI/hook、环境变量、发布路径、跨仓接口契约、数据库迁移、批量重构、共享组件契约，或当前脏工作区无法可靠区分改动归属 | 必须等待用户同意后提交 |

默认提交粒度：

- 一个 commit 对应一个可描述、可验证、可回滚的验收点
- 同一验收点的实现、测试、相关文档、Memory Update 随同提交
- 重构与功能行为默认拆开；格式化-only、依赖升级、配置变更默认独立提交
- 多个无关任务项、多个独立页面目标、或多个业务闭环不得混入同一 commit

提交前检查流程：

- 必须执行 `git status --short`
- 必须检查相关 `git diff` 与 `git diff --cached`
- 必须区分用户已有改动、AI 本次改动、hook 自动改写内容
- 使用路径限定 staging，只暂存当前提交分组内文件
- 暂存后再次核对 staged diff，确认未混入无关改动

以下情况自动降级为高风险并暂停确认：

- 当前工作区已脏，且改动归属不清
- 同一文件同时混有用户改动与 AI 改动，且无法安全拆分
- 涉及红区、共享契约、跨仓接口、构建/CI、发布路径、环境变量、权限/登录态、数据库迁移

提交后强制动作：

- 记录本次 commit 对应的验收点与验证证据
- 若 hook 改写了文件，必须重新检查 `git diff`，确认改写结果是否应保留
- 若 hook 改写产生新的必要修正，必须在说明原因后追加独立提交，或回到当前提交分组重新整理后再提交

Commit message 仍遵循本节 Conventional Commits 与仓库 commitlint。文档治理类提交建议使用 `docs(project): ...`；workflow/hook/CI/tag 机制真实行为变更建议使用 `build(release): ...`、`ci(release): ...` 或同等语义的 message。

### 3.2 Commit Message 细则

- 类型白名单：`feat`、`fix`、`refactor`、`docs`、`test`、`build`、`ci`、`chore`、`revert`
- scope 必须来自受控集合：`project`、模块名、包名、`ci`、`dev`、`release` 或团队约定的稳定 scope
- 文档治理统一建议使用 `docs(project): ...`
- 发布流程或 tag 机制真实行为变更建议使用 `build(release): ...` 或 `ci(release): ...`
- Breaking Change 必须使用 `!` 或 footer `BREAKING CHANGE:`；一旦出现 breaking change，版本策略必须同步触发 `SemVer MAJOR`
- 禁止低信息 message，如 `update`、`misc`、`fix bug`
- 一个 commit 不得混合多个无关验收点

示例：

- 合法：`feat(m6-statistics): add dashboard summary cards`
- 合法：`docs(project): refine git tag policy`
- 非法：`update`
- 非法：`fix bug`

### 3.3 Tag 规范

统一采用“版本 tag 严格 + 非版本 tag 命名空间隔离”模型，默认使用 annotated tag。

版本 tag：

- 正式发布：`v<MAJOR>.<MINOR>.<PATCH>`，例如 `v1.2.3`
- 预发布：`v<MAJOR>.<MINOR>.<PATCH>-rc.<N>`、`v<MAJOR>.<MINOR>.<PATCH>-beta.<N>`、`v<MAJOR>.<MINOR>.<PATCH>-alpha.<N>`
- 必须符合 `SemVer 2.0.0`
- 一个版本号只能对应一个不可复用 tag
- 版本 tag 只能打在已合入 `main` 的发布 commit 上
- 版本 tag 必须关联发布说明 / changelog / 验证记录
- AI 不得默认主动创建版本 tag；版本 tag 只能由显式发布动作、人工确认或受控发布流水线创建

非版本 tag：

- `milestone/<name>`：里程碑快照，例如 `milestone/m6-dashboard-freeze`
- `qa/<name>`：QA / 验收锚点
- `rollback/<name>`：辅助回滚锚点，例如 `rollback/pre-m6-release`
- `ops/<name>`：运维操作锚点
- 默认也使用 annotated tag，并写明用途、创建人、关联 PR / issue / 发布单
- 非版本 tag 不得替代版本管理、PR 状态或 changelog

禁止的 tag 用法：

- 用 lightweight tag 代替正式发布 tag
- 在未进入发布流程的普通开发 commit 上打 `v*` 版本 tag
- 同一语义同时维护 `v1.2.3`、`release-1.2.3`、`prod-1.2.3` 等多套规范
- 使用无前缀平铺 tag，如 `uat-pass`、`done`、`latest`

示例：

- 合法：`v1.2.3`
- 合法：`v1.2.3-rc.1`
- 合法：`milestone/m6-dashboard-freeze`
- 合法：`rollback/pre-m6-release`
- 非法：`release-1.2.3`
- 非法：`uat-pass`
- 非法：`latest`

### 4. PR 与评审规则

- 禁止直接向 `main`、`develop`、`release/*` 推送
- 所有变更必须通过 PR 合入
- PR 必须包含变更目的、影响范围、验证方式、风险说明
- 涉及路由、权限、接口层、构建配置、主题变量的变更必须重点标注
- UI 相关 PR 必须附页面截图或录屏
- 联调相关 PR 必须附浏览器验证范围、接口影响说明和异常场景说明

默认门禁：

- `main`：至少 2 人 Review，构建与测试全绿
- `develop`：至少 1 人 Review，构建与测试全绿
- `release/*`：至少 2 人 Review，仅允许发布相关修复

### 5. 合并规则

- 默认使用非快进合并或团队指定策略，保留分支上下文
- 合并前必须解决冲突并重新验证
- `hotfix/*` 合入 `main` 后必须回合并到 `develop`
- `release/*` 完成后必须同步回 `develop`

### 6. 工作树（Worktree）与任务隔离

- **实现类任务按风险决定是否使用独立 `git worktree`**。命中并行开发、脏工作区、依赖安装、跨层/红区、持续多提交或下方“必须使用 worktree”条件时，一个任务项对应一个 worktree + 一个分支；低风险单点任务可使用本节例外，避免把小改变成环境管理任务
- 工作树目录统一放在主仓库的同级目录 `../SYBaseProjectWeb-worktrees/<task-id>`，不得置于仓库内部，防止被构建、依赖安装或 `node_modules` 影响
- 分支命名仍遵循「2. 分支命名」，从 `develop` 切出，例如 `feature/eng-123-user-management`
- 每个 worktree 是独立工作区，需各自执行 `pnpm install` 安装依赖，验证命令（见 `CODING_RULES.md` 标准验证命令）也在对应 worktree 内执行
- 任务来源可以是 issue、工单、卡片、PR、文档需求或会话交接；是否创建 worktree 由任务风险和当前工作区状态决定，而不是由平台名称决定

以下场景**必须**使用独立 worktree，不得套用例外：

- 运行时代码、共享契约、路由、状态、接口、构建/脚本、依赖、锁文件或记忆文件与实现代码一起改动
- 多人 / 多 Agent 并行推进，或当前主工作区本身已脏且无法明确隔离归属
- 需要 `pnpm install`、构建、联调、E2E、跨仓验证，或预期会持续多次提交

低风险例外（可不新建 worktree）：

- 纯文档、规范审计、评审结论整理、只读分析类任务
- 单一绿区小改、测试-only、低风险静态文案或局部非布局样式调整，且满足：当前分支/工作区干净或可明确隔离归属、无并行实现任务、无依赖/构建/共享契约改动、无需安装新依赖

使用低风险例外时，必须同时满足：

- 在任务确认或交付说明中用一句话写明“为什么这次不需要独立 worktree”
- 先执行 `git status --short`，确认不会混入无关改动
- 一旦任务范围扩大到上述“必须使用 worktree”的条件，立即切回独立 worktree

#### 6.1 Merge-Back 完成定义

- worktree 中的采纳提交，必须由主 Agent 合并回当前集成分支或任务声明的目标分支
- **本地目标分支已经包含 merge-back 结果**，任务才算完成
- 合并回目标分支前，不得宣称任务已交付完成
- 合并回目标分支前，不得删除 worktree，不得删除对应分支
- 清理 worktree 与分支发生在 merge-back 完成并完成统一验证之后

#### 6.2 主 Agent 责任

- 审查各 worktree 的 diff 与提交边界
- 决定采纳 / 驳回 / 返工
- 处理冲突并排除无关改动
- 将采纳的提交合并回当前集成分支或任务目标分支
- 在目标分支运行统一验证
- 在交付说明中记录 merge-back 结果、剩余风险和清理状态

#### 6.3 暂停条件

- 目标分支已脏且无法安全合并
- worktree 分支与目标分支存在冲突，且无法在当前任务范围内解决
- merge-back 需要覆盖他人未确认改动

命中暂停条件时，先停止清理和交付，说明影响范围、冲突点、验证现状与建议处理方式。

#### 6.4 多 Agent 并行协作

- 多个子 Agent 并行实现时，必须为每个实现切片使用独立 worktree 和独立分支；写作用域应在分配任务时明确到文件、模块或验收点
- 只读探索、只读审查或 Checker 任务可以不新建 worktree，但不得改文件、暂存、提交或运行会改写仓库文件的命令
- 主 Agent 负责最终 merge-back：检查各 worktree 的 diff、处理冲突、排除无关改动、将采纳的提交合并回当前集成分支或任务目标分支、运行统一验证并完成交付说明；不得把已完成任务只停留在孤立 worktree 分支中
- 若子 Agent 产出与主线已有改动冲突，先由主 Agent 判定采纳 / 驳回 / 返工，不得让子 Agent 直接覆盖主线或他人改动

标准操作：

```bash
# 1. 同步 develop 并为任务创建 worktree + 分支
git fetch origin
git worktree add -b feature/eng-123-user-management ../SYBaseProjectWeb-worktrees/ENG-123 origin/develop

# 2. 进入 worktree 并安装依赖
cd ../SYBaseProjectWeb-worktrees/ENG-123
pnpm install

# 3. 查看当前所有工作树
git worktree list

# 4. 在主工作区或目标分支执行 merge-back 与统一验证
git switch develop
git merge --no-ff feature/eng-123-user-management

# 5. merge-back 完成后再清理 worktree 与分支
git worktree remove ../SYBaseProjectWeb-worktrees/ENG-123
git branch -d feature/eng-123-user-management
```

### 7. 自动化护栏（lefthook）

仓库已通过 `lefthook.yml` 提供机器强制护栏，提交流程会自动触发，不依赖手工自觉：

- `pre-commit`：对暂存文件自动执行 `oxfmt` 格式化 + `oxlint --fix` + `eslint --fix`（`.vue/.js/.ts` 等）+ `stylelint --fix`（样式文件），格式化结果会回写；同时执行 `vsh code-workspace --auto-commit`，会自动维护并提交 `*.code-workspace` 工作区文件，提交时注意该自动改动是否在预期内
- `commit-msg`：`commitlint` 校验提交信息，不符合 Conventional Commits 直接拦截
- `pre-push`：执行 `pnpm check:type` + `pnpm check:circular` + `pnpm run check:governance` + `pnpm test:unit`，在推送前拦截类型、循环依赖、治理文档一致性与单元测试风险
- `post-merge`：自动执行 `pnpm install`，保持依赖与合并结果一致

护栏边界与责任分担：

- **lefthook 覆盖格式化、暂存文件 lint、提交信息、推送前中等检查与治理文档一致性**，不覆盖完整构建、端到端测试与目标环境验收
- 因此 `pnpm build`、`pnpm test:e2e`、联调验证等仍属开发者 / Agent 的交付前必跑项（见 `CODING_RULES.md` 标准验证命令），不得因"hook 已通过"就跳过
- 禁止使用 `--no-verify` 等方式绕过护栏；确有特殊情况必须说明原因并人工确认
- 涉及红区文件的改动（红区定义以 `AGENTS.md` 第 5 节「文件操作边界」为唯一来源），除护栏外仍须执行「6. 必须升级人工确认的场景」中的人工确认（见 `AGENTS.md`）

门禁覆盖矩阵（明确"哪层拦哪些"，避免"hook 通过即安全"的误解；各命令的定义与基线以 `CODING_RULES.md`「标准验证命令」为唯一来源，本矩阵只描述各层执行哪些命令）：

| 校验项 | pre-commit | pre-push | CI（`frontend-quality.yml` / `governance-quality.yml` / `pr-packet.yml`） | 发布门禁（`RELEASE.md` §5） |
| --- | --- | --- | --- | --- |
| 格式化 / `eslint --fix`（暂存文件） | 是 | 否 | 否 | 否 |
| `pnpm lint`（全量） | 否 | 否 | 是 | 是 |
| `pnpm check:type` | 否 | 是 | 是 | 是 |
| `pnpm check:circular` | 否 | 是 | 是 | 是 |
| `pnpm test:unit` | 否 | 是 | 是 | 是 |
| `pnpm build` / `build:ele` | 否 | 否 | 是 | 是 |
| `pnpm check:cspell` / `check:dep` | 否 | 否 | 否 | 是（含于 `pnpm check`） |
| `pnpm run check:governance` | 否 | 是 | 是（治理路径变更时） | 是（含于 `pnpm check`） |
| 治理校验脚本 Vitest | 否 | 否 | 是（治理路径变更时） | 否 |
| `pnpm test:e2e` | 否 | 否 | 否 | 关键链路时 |

> 注意：`pr-packet.yml` 只校验 PR 正文存在关键 Workflow Packet / Memory Update Packet 字段且非空；当 PR 声明启用了 Red Team 时，还会检查 `Attack result` 与 `Residual risk` 不为空，但仍不判断证据质量。`governance-quality.yml` 只在治理/记忆/模板路径变更时运行，负责 `check:governance` 与治理脚本测试。`cspell` 扫描 `**/*.{ts,tsx,vue}`、`**/README.md`、`docs/**/*.md` 与根目录 `*.md`（含五类记忆文件），新增领域术语需在 `cspell.json` 词典登记；章节一致性等非拼写问题仍须人工核对。Red Team 质量、人工确认是否真实完成等治理项仍依赖交付者和 reviewer 审查。

### 8. 动态 Workflow 剧本与红队审查

PR 必须根据任务类型填写 Workflow Packet。主 Workflow 选择、强制修饰器、专家 Agent、动态测试/模拟与 Red Team 要求以 `docs/rules/DYNAMIC_WORKFLOW_RULES.md` 的「总规则」与「触发信号速查表」为唯一来源，本文件不再复述各 Workflow 的触发条件与剧本；不得所有任务套用同一套 AI 流程。

PR 合入前还必须填写 Memory Update Packet：

- 记忆文件的职责与更新触发条件以 `AGENTS.md` 第 8 节「AI Memory Update」为唯一来源，交付前按其规则按需更新 `docs/memory/` 五类记忆文件
- PR 必须说明已更新文件、未更新文件及原因、相关记忆项 ID、跨仓引用和剩余风险
- `pr-packet.yml` 会拦截缺少关键 Packet 字段或字段为空的 PR；动态 Workflow 和 AI Memory Update 的内容质量仍由 reviewer 结合证据审查
- 跨仓事项必须双向引用后端 `SYBaseProject` 的记忆项或验证证据

## 推荐实践

- 保持分支短生命周期，尽量小步提交、频繁同步 `develop`
- 在 PR 描述中附带测试结果、截图、录屏、接口示例或兼容说明
- 把重构与功能变更拆成独立提交，提升审查效率
- 在临近发布时减少大规模样式重构和依赖升级，降低集成风险

## 反例/禁用项

- 一个分支同时混入需求开发、重构、格式化、依赖升级
- 提交信息写成 `update`、`fix bug`、`misc`
- 直接在 `main` 上开发后再强行补 PR
- 没有验证结果、截图或风险说明就请求合并
- `release/*` 分支中继续开发新功能

## 检查清单

- [ ] 任务已在独立 worktree 中处理，或已命中低风险例外并在任务确认/交付中说明原因
- [ ] 分支类型与命名符合 Git Flow 规范
- [ ] 提交信息符合 Conventional Commits
- [ ] AI 提交前已给出提交分组、风险评级、风险说明和回滚影响；高风险分组已获人工确认
- [ ] 任务已完成本地 merge-back，且对应 worktree 与已合并分支已在验证后清理
- [ ] PR 描述包含目的、影响、验证和风险
- [ ] PR 已填写 Workflow Packet，高风险变更已执行 Red Team
- [ ] 使用 Loop Engineering 执行的任务已填写 Loop Packet
- [ ] PR 已填写 Memory Update Packet，并引用相关记忆项 ID 或说明未更新原因
- [ ] UI 或联调类变更已附截图、录屏或接口说明
- [ ] Review、构建、冲突处理已完成
- [ ] 未使用 `--no-verify` 绕过 lefthook 护栏；hook 未覆盖的构建 / 端到端 / 联调验收已另行执行
- [ ] `release/*` 与 `hotfix/*` 的回合并路径已执行

## 关联文档

- [../../AGENTS.md](../../AGENTS.md)
- [./RELEASE.md](./RELEASE.md)
- [./FRONTEND_RULES.md](./FRONTEND_RULES.md)
