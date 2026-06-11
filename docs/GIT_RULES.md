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
- 工单前缀以项目实际使用的工单系统为准（本项目为 Linear，示例 `ENG-123`，参见 `LINEAR_TASK.md`）
- 如有工单号，必须带上工单号
- 一个分支只承载一类目标，不得混合多项无关改动

### 3. 提交规范

- 提交信息统一遵循 Conventional Commits
- 推荐类型：`feat`、`fix`、`refactor`、`docs`、`test`、`build`、`chore`
- 建议格式：`type(scope): subject`

示例：

- `feat(user-management): add user list filters`
- `fix(router): guard unauthorized routes`
- `docs(rules): add frontend engineering baseline`

### 3.1 AI 自动提交粒度规范

AI 助手执行提交前，必须先给出建议提交分组，再按风险等级决定是否可以自动提交。提交分组以“可描述、可验证、可回滚的验收点”为默认粒度，不按文件类型机械拆分。

建议提交分组至少包含：

- 提交主题与建议 commit message
- 包含文件 / 排除文件
- 对应验收点或变更目的
- 验证证据或未验证说明
- 风险评级：低 / 中 / 高
- 风险说明与回滚影响

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
- 多个无关 Linear issue、多个独立页面目标、或多个业务闭环不得混入同一 commit

提交前检查流程：

- 必须执行 `git status --short`，并检查相关 `git diff` / `git diff --cached`
- 必须区分用户已有改动、AI 本次改动、hook 自动改写内容
- 使用路径限定 staging，只暂存当前提交分组内文件
- 若文件内同时存在用户改动和 AI 改动且无法安全拆分，该分组自动升为高风险并暂停确认

Commit message 仍遵循本节 Conventional Commits 与仓库 commitlint。文档治理类提交建议使用 `docs(project): ...`；workflow/hook/CI 真实行为变更才使用 `ci`、`build` 或 `chore` 等类型；scope 必须使用仓库允许 scope，例如 `project`、包名、`ci`、`dev` 等。

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

### 6. 工作树（Worktree）与 Linear 任务

- **Linear 任务必须在独立 `git worktree` 中处理**，一个 Linear issue 对应一个 worktree + 一个分支，避免在主工作区频繁切换分支、污染未提交改动或交叉影响其他任务
- 工作树目录统一放在主仓库的同级目录 `../SYBaseProjectWeb-worktrees/<issue-id>`，不得置于仓库内部，防止被构建、依赖安装或 `node_modules` 影响
- 分支命名仍遵循「2. 分支命名」，从 `develop` 切出，例如 `feature/ENG-123-user-management`
- 每个 worktree 是独立工作区，需各自执行 `pnpm install` 安装依赖，验证命令（见 `CODING_RULES.md` 标准验证命令）也在对应 worktree 内执行
- 任务合并完成后必须清理：移除 worktree 并删除已合并分支，保持工作树列表整洁
- 不得多个无关 Linear 任务共用同一 worktree，也不得在 `main`、`develop` 所在主工作区直接开发 Linear 任务

标准操作：

```bash
# 1. 同步 develop 并为 Linear issue 创建 worktree + 分支
git fetch origin
git worktree add -b feature/ENG-123-user-management ../SYBaseProjectWeb-worktrees/ENG-123 origin/develop

# 2. 进入 worktree 并安装依赖
cd ../SYBaseProjectWeb-worktrees/ENG-123
pnpm install

# 3. 查看当前所有工作树
git worktree list

# 4. 任务合并后清理 worktree 与分支
git worktree remove ../SYBaseProjectWeb-worktrees/ENG-123
git branch -d feature/ENG-123-user-management
```

### 7. 自动化护栏（lefthook）

仓库已通过 `lefthook.yml` 提供机器强制护栏，提交流程会自动触发，不依赖手工自觉：

- `pre-commit`：对暂存文件自动执行 `oxfmt` 格式化 + `oxlint --fix` + `eslint --fix`（`.vue/.js/.ts` 等）+ `stylelint --fix`（样式文件），格式化结果会回写；同时执行 `vsh code-workspace --auto-commit`，会自动维护并提交 `*.code-workspace` 工作区文件，提交时注意该自动改动是否在预期内
- `commit-msg`：`commitlint` 校验提交信息，不符合 Conventional Commits 直接拦截
- `pre-push`：执行 `pnpm check:type` + `pnpm check:circular` + `pnpm test:unit`，在推送前拦截类型、循环依赖与单元测试风险
- `post-merge`：自动执行 `pnpm install`，保持依赖与合并结果一致

护栏边界与责任分担：

- **lefthook 覆盖格式化、lint、提交信息、推送前中等检查**，不覆盖完整构建、端到端测试与目标环境验收
- 因此 `pnpm build`、`pnpm test:e2e`、联调验证等仍属开发者 / Agent 的交付前必跑项（见 `CODING_RULES.md` 标准验证命令），不得因"hook 已通过"就跳过
- 禁止使用 `--no-verify` 等方式绕过护栏；确有特殊情况必须说明原因并人工确认
- 涉及红区文件的改动（红区定义以 `AGENTS.md` 第 5 节「文件操作边界」为唯一来源），除护栏外仍须执行「6. 必须升级人工确认的场景」中的人工确认（见 `AGENTS.md`）

门禁覆盖矩阵（明确"哪层拦哪些"，避免"hook 通过即安全"的误解）：

| 校验项 | pre-commit | pre-push | CI（`frontend-quality.yml`） | 发布门禁（`RELEASE.md` §5） |
| --- | --- | --- | --- | --- |
| 格式化 / `eslint --fix`（暂存文件） | 是 | 否 | 否 | 否 |
| `pnpm lint`（全量） | 否 | 否 | 是 | 是 |
| `pnpm check:type` | 否 | 是 | 是 | 是 |
| `pnpm check:circular` | 否 | 是 | 是 | 是 |
| `pnpm test:unit` | 否 | 是 | 是 | 是 |
| `pnpm build` / `build:ele` | 否 | 否 | 是 | 是 |
| `pnpm check:cspell` / `check:dep` | 否 | 否 | 否 | 是（含于 `pnpm check`） |
| `pnpm test:e2e` | 否 | 否 | 否 | 关键链路时 |

> 注意：`cspell` 仅扫描 `**/*.{ts,tsx,vue}` 与 `**/README.md`，不覆盖 `docs/*.md` 规范与根目录记忆文件；这些文件的拼写与一致性须人工核对。Workflow Packet、Memory Update、Red Team、人工确认等治理项目前均无机器门禁，依赖交付者自觉执行。

### 8. 动态 Workflow 剧本与红队审查

PR 必须根据任务类型填写 Workflow Packet，并参考 `docs/DYNAMIC_WORKFLOW_RULES.md` 选择专家 Agent、动态测试、动态模拟、安全/数据库修饰器与红队对抗点。不得所有任务套用同一套 AI 流程：

- UI 任务：启用 UI/UX + Browser 验证 Agent，执行组件/页面测试、必要 E2E、角色/视口/状态模拟
- 接口任务：启用 API Contract Agent，对齐前后端字段、错误模型、分页、失败响应和兼容性
- 数据库任务：叠加 DB 修饰器，引用后端迁移、回滚、种子、兼容查询或 API 回归证据
- 权限、患者信息、报告信息：叠加 Security 修饰器，检查越权、泄露、脱敏、审计、导出和日志
- 大文件重构、共享契约、跨层边界：启用 Architecture Agent，检查影响面、调用关系、循环依赖和兼容性
- 生产问题：启用 Execution Driven Debug，必须先读日志、复现问题、建立反馈环、确认修复与回滚路径
- 高风险变更：叠加 Red Team，主动攻击代码并证明是否存在绕过、数据破坏、错误吞噬或回滚缺口

PR 合入前还必须填写 Memory Update Packet：

- 记忆文件的职责与更新触发条件以 `AGENTS.md` 第 8 节「AI Memory Update」为唯一来源，交付前按其规则按需更新根目录五类记忆文件
- PR 必须说明已更新文件、未更新文件及原因、相关记忆项 ID、跨仓引用和剩余风险
- CI 与 hook 只负责机器门禁；动态 Workflow 和 AI Memory Update 负责任务级治理与长期上下文维护
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

- [ ] Linear 任务已在独立 worktree 中处理，目录位于仓库同级 `../SYBaseProjectWeb-worktrees/<issue-id>`
- [ ] 分支类型与命名符合 Git Flow 规范
- [ ] 提交信息符合 Conventional Commits
- [ ] AI 提交前已给出提交分组、风险评级、风险说明和回滚影响；高风险分组已获人工确认
- [ ] 任务合并后已清理对应 worktree 与已合并分支
- [ ] PR 描述包含目的、影响、验证和风险
- [ ] PR 已填写 Workflow Packet，高风险变更已执行 Red Team
- [ ] PR 已填写 Memory Update Packet，并引用相关记忆项 ID 或说明未更新原因
- [ ] UI 或联调类变更已附截图、录屏或接口说明
- [ ] Review、构建、冲突处理已完成
- [ ] 未使用 `--no-verify` 绕过 lefthook 护栏；hook 未覆盖的构建 / 端到端 / 联调验收已另行执行
- [ ] `release/*` 与 `hotfix/*` 的回合并路径已执行

## 关联文档

- [../AGENTS.md](../AGENTS.md)
- [./RELEASE.md](./RELEASE.md)
- [./COMPATIBILITY_RULES.md](./COMPATIBILITY_RULES.md)
