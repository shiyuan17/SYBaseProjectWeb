# Linear 任务起始模板

> 从某个 Linear issue 开工时，复制本模板填写，作为本次任务的起始提示。

## 0. Linear 同步命令（计划与 issue 维护）

仓库提供以下命令同步本地计划与 Linear，配置来源为根目录 `linear-setting.json`（被 `.gitignore` 忽略；首次使用时复制根目录 `linear-setting.example.json` 为 `linear-setting.json` 并填入 token 与 team/project 信息）：

| 命令 | 作用 |
| --- | --- |
| `pnpm linear:register` | 在 Linear 注册/校验项目与标签 |
| `pnpm linear:sync` | 按 `linear-setting.json` 的 `plan` 创建或更新对应 issue（本地计划 → Linear） |
| `pnpm linear:pull` | 回拉与计划标题匹配的 issue 标识与状态（Linear → 本地核对） |

- 单个 issue 开工前，可先 `pnpm linear:pull` 核对该 issue 当前状态与标识，再按下方模板准备起始信息。
- 调整计划条目（新增/改标题/改标签）后，用 `pnpm linear:sync` 回写，避免本地 `plan` 与 Linear 漂移。
- `linear-setting.json` 含访问凭证或环境相关配置时属红区，改动前按 `AGENTS.md` 第 6 节人工确认。

## 1. 任务来源

- Linear issue：`<ENG-123>` —— `<标题>`
- 链接：`<issue url>`
- 关联 spec / 设计：`<链接，可选>`

## 2. 背景与目标

- 背景：`<为什么要做这件事>`
- 目标：`<这次要达成什么>`

## 3. 验收标准（Acceptance Criteria）

> 规格先行：验收标准为空或存在歧义时，先与需求方澄清确认，不得凭推测进入编码（见 `AGENTS.md` 第 4 节"规格先行"硬约束）。

- [ ] `<标准 1>`
- [ ] `<标准 2>`
- [ ] `<标准 3>`

## 4. 非目标（Non-goals）

- `<本次明确不做的事>`

## 5. 动手前检查清单

- [ ] 已阅读 issue、关联 spec 与相关现有文件
- [ ] 已确认仓库现有实现模式（命名 / 架构 / UI 约定）
- [ ] 已为本 issue 创建独立 `git worktree`（目录 `../SYBaseProjectWeb-worktrees/<issue-id>`，命令见 `GIT_RULES.md` 第 6 节），并已在该 worktree 内 `pnpm install`；若命中 `GIT_RULES.md` 第 6 节低风险例外，已记录不建 worktree 的原因
- [ ] 已查看 `git status`，工作区干净、不会影响无关改动
- [ ] 已明确受影响的文件范围

## 6. 实施计划

1. `<步骤 1>`
2. `<步骤 2>`
3. `<步骤 3>`

## 7. 测试与验证

- 验证命令：`<尽量选范围最小且有效的命令>`
- 涉及逻辑 / 数据流 / 权限 / 集成 / 用户可见行为时，新增或更新测试。

## 8. 风险与回滚

- 风险：`<潜在风险>`
- 回滚方式：`<如何回滚>`
