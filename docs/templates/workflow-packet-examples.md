# 治理模板填写范例

本文件给出任务确认、Workflow Packet、Memory Update Packet 的**已填写范例**，用于对照学习，降低空壳模板被误填、漏填的概率。字段语义以 `AGENTS.md` 第 4 / 7 / 8 节与 `docs/DYNAMIC_WORKFLOW_RULES.md` 为唯一来源；本文只是示例，不新增任何字段要求。

> 范例中的需求、文件路径、记忆项 ID 均为示意，使用时替换为真实内容，不要原样复制。

## Fast / Lightweight / Full 最短决策表

| 档位 | 快速判断 | 填写重点 |
| --- | --- | --- |
| Fast Path | 只读分析、规范审计、纯文档修正，不改运行时行为 | `Primary Workflow: Not applicable (<reason>)`，写清实际核对来源、验证结果和 Memory 判定 |
| Lightweight | 低风险实现类任务，未触发 Security / DB / Red Team / Backend Cross-check / Browser Verification，也不碰红区 | 写主 Workflow、触发信号、实际测试、Memory 判定和剩余风险；不为形式合规补动态模拟或 Checker |
| Full | 权限、接口契约、患者 / 报告数据、导出打印、跨仓、生产问题、构建发布、CI / hook、红区或任一强制修饰器 | 补齐完整 Workflow Packet、必要证据块、Red Team 四要素、人工确认来源和跨仓 / Memory 引用 |

## 范例 1：完整任务确认（UI 实现类任务）

场景：报告列表页新增「导出 PDF」按钮，调用后端已有导出接口。

```markdown
## 任务确认

- 任务目标: 在报告列表页工具栏新增「导出 PDF」按钮，点击后调用后端 `/api/report/export` 下载当前筛选结果
- 影响范围: `apps/web-ele/src/views/report/list.vue`、`apps/web-ele/src/api/report.ts`、对应单测
- 主 Workflow: UI
- 强制修饰器: Browser 验证（UI 改动）、Security（报告数据导出）、Backend Cross-check（需对照后端导出接口实现）、Red Team（涉及报告数据）
- 依赖检查: 后端 `SYBaseProject` 导出接口已上线；Element Plus Button/Message；浏览器下载能力（含中文文件名）
- 风险等级: 中
- 关键假设: 导出范围 = 当前筛选条件命中的全部数据，而非当前分页；以后端接口语义为准，已对照后端实现确认
- 成功标准: 按钮在有导出权限角色可见可用；下载文件名含报告日期；无权限角色不可见；新增单测通过；浏览器实际验证下载成功
- 非目标 / 不做项: 不改导出接口契约；不顺手重构列表页筛选逻辑；不处理批量打印
```

## 范例 2：Fast Path 任务确认（纯文档任务）

场景：修正 `docs/ROUTER_RULES.md` 中一处失效的相对链接。

```markdown
## 任务确认（Fast Path）

- 任务目标: 修正 ROUTER_RULES.md 中指向已迁移文件的死链
- 影响范围: docs/ROUTER_RULES.md
- 主 Workflow: 不适用（纯文档修正，不改运行时行为）
- 成功标准: pnpm run check:governance 通过，链接指向真实存在的文件
```

## 范例 3：Workflow Packet（对应范例 1 的交付）

```markdown
## Workflow Packet

- 主 Workflow: UI
- 触发信号: `apps/web-ele/src/views/report/**` 页面改动；报告数据导出（敏感数据信号）
- 专家 Agent: UI/UX Agent（frontend-ui-engineering）、Browser 验证 Agent、Security/Privacy Agent
- 动态测试: `pnpm lint` 通过；`pnpm check:type` 通过；`pnpm test:unit -- report` 12 passed
- 动态模拟: 管理员 / 只读角色两种权限菜单；空筛选结果导出；下载中文文件名；移动端视口按钮布局
- 动态安全: 触发 Security 修饰器；确认导出走后端鉴权接口，前端不拼接敏感字段进 URL
- 动态数据库: 未触发 DB 修饰器（无迁移 / SQL 依赖）
- Red Team: 攻击路径=无权限角色直接调用导出接口；预期失败点=后端 403；实际结果=返回 403 且前端提示无权限；剩余风险=导出审计日志由后端记录，前端未重复校验，已在后端确认
- Memory Update: 更新 `DECISIONS.md`（DEC-YYYYMMDD-NNN 导出范围=筛选全集的契约结论，双向引用后端 MR）；其余四类无 durable context change
```

## 范例 3.1：轻量 Workflow Packet（低风险实现类任务）

场景：模块内组件修正一个非敏感展示文案，不涉及权限、接口、样式系统、路由或跨仓核对。

```markdown
## Workflow Packet

- 主 Workflow: UI
- 触发信号: `apps/web-ele/src/modules/example/components/StatusLabel.vue` 模块内展示文案调整
- 动态测试: `pnpm test:unit -- StatusLabel` 3 passed；未触发 Browser 验证（无布局/视口/交互变化）
- Memory Update: 无 durable context change，未更新五类记忆文件
- 剩余风险 / 未验证项: 未运行 E2E；本次只影响组件静态文案，单测覆盖渲染结果
```

## 范例 4：Memory Update Packet（交付 / PR 摘要中的记忆层说明）

```markdown
## Memory Update Packet

- 已更新: `DECISIONS.md` 追加 DEC-YYYYMMDD-NNN（报告导出范围契约，引用后端 `SYBaseProject` MR !123 与接口测试结果）
- 未更新: `PROJECT_STATE.md`（阶段与验证基线未变化）、`TECH_DEBT.md` / `KNOWN_BUGS.md`（未发现新债务或缺陷）、`ARCHITECTURE.md`（模块边界未变化）
- 跨仓引用: 前端 PR 引用后端 MR !123；后端 `DECISIONS.md` 对应条目回引本 PR
```

## 范例 5：高风险 Red Team / Checker 证据块

场景：报告导出页新增敏感报告批量导出能力，涉及权限、患者 / 报告数据、后端接口核对和浏览器下载验证。

```markdown
## Red Team / Checker Evidence

- Checker / reviewer source: 只读 Checker 子 Agent，输入为本 PR diff、后端 `SYBaseProject/bl-center` 导出接口、`pnpm test:unit -- report-export` 输出和浏览器验证截图；Checker 未直接改文件。
- Review focus: 权限绕过、敏感字段泄露、误报导出成功、后端 403/审计链路、PR Packet 证据是否真实。
- Attack path 1: 只读角色绕过菜单，直接访问报告导出路由并点击导出按钮。
- Expected failure point 1: 前端路由 / 按钮权限隐藏导出入口；若构造请求，后端接口仍返回 403。
- Actual result 1: Browser 验证中只读角色未渲染导出按钮；手工调用 `POST /api/v1/reports/export` 返回 403；前端显示“无导出权限”，未创建下载文件。
- Attack path 2: 修改请求 payload，加入未授权科室 `departmentId=outside-scope` 并尝试批量导出。
- Expected failure point 2: 后端按当前用户数据域重新鉴权，拒绝越权科室数据。
- Actual result 2: 后端接口测试返回 403；响应体不包含患者姓名、诊断文本或文件下载地址；前端错误提示不拼接敏感 payload。
- Blocking findings: 无阻塞项。
- Non-blocking findings: 后端审计日志完整性由后端 MR !123 覆盖，前端仅确认接口被调用和失败态展示；建议后端 reviewer 复核审计字段。
- Release decision: 放行前提为 `pnpm lint`、`pnpm check:type`、`pnpm test:unit -- report-export`、Browser 只读 / 管理员角色验证全部通过。
- Residual risk: 前端无法单独证明后端审计落库长期可用；该风险归属后端发布核验，前端 PR 保留后端 MR 链接与接口测试证据。
```

## 范例 6：子 Agent / Checker 结论采纳记录

场景：同一高风险报告导出任务中，主 Agent 汇总探索 Agent、Security Checker 和人工 reviewer 的结论。

```markdown
## Sub-Agent / Checker Adoption Record

- Source A: 探索 Agent（只读）；结论=导出按钮入口只在 `ReportListToolbar.vue`，实际鉴权仍以后端 `POST /api/v1/reports/export` 为准；处理=采纳，避免在前端复制复杂数据域规则。
- Source B: Security Checker（只读）；结论=需要覆盖“直接构造 payload 越权科室”攻击路径；处理=采纳，新增单测断言 403 时不创建下载文件、不展示成功提示。
- Source C: Security Checker（只读）；结论=建议前端增加一套完整科室权限判定；处理=驳回，理由=后端是权限来源，前端只负责入口显示与失败态，不维护第二套数据域规则，避免规则漂移。
- Source D: 人工 reviewer；结论=审计日志字段应由后端 reviewer 确认；处理=延后到后端 MR !123，前端 PR 记录跨仓链接和剩余风险。
- Conflict resolution: “前端是否复制后端数据域规则”以 `AGENTS.md` 后端权威和 API 契约为准，选择不复制规则，但保留 403 失败态验证。
- Final verification covering adopted conclusions: `pnpm test:unit -- report-export` 覆盖 403/无下载文件；Browser 验证覆盖只读角色无按钮、管理员导出成功；后端接口测试覆盖越权 payload 403。
```

## 范例 7：Triage Loop 真实输出样例

场景：每周治理巡检，从 CI、记忆台账和审计报告中提取可执行工作。

```markdown
## Triage Loop Output

- Triage summary: 本轮发现 4 个候选项，去重后保留 3 个可执行任务；无 P0，1 个 P1，2 个 P2。
- Inputs checked: GitHub Actions 最近失败记录、`TECH_DEBT.md` Open 项、`KNOWN_BUGS.md` Open 项、`DECISIONS.md` 最新治理决策、`docs/reviews/loop-dynamic-workflow-ai-collab-audit-2026-06-13.html`。

| Candidate | Raw signal | Dedupe result | Risk | Suggested Workflow | Verification command | State Sink |
| --- | --- | --- | --- | --- | --- | --- |
| PR Packet 证据质量 checklist | 审计报告指出机器校验只能检查字段形状 | 保留；无现有 Linear / Memory 覆盖人工证据质量 | P1 / 中 | Workflow-Infra | `pnpm run check:governance`; `pnpm exec vitest run scripts/validate-pr-packet.test.mjs` | `DECISIONS.md` DEC-YYYYMMDD-NNN |
| Red Team / Checker 高质量样例 | 审计报告指出样例不足 | 与 checklist 相关但输出物不同，保留为模板任务 | P2 / 低 | Workflow-Infra | `pnpm run check:governance` | `docs/templates/workflow-packet-examples.md` |
| TECH_DEBT 归档 | `TECH_DEBT.md` 当前 32 行，未接近 200 行软上限 | 暂不执行迁移；记录 SOP 即可 | P2 / 低 | 不适用（治理说明） | `pnpm run check:governance` | `TECH_DEBT.md` 保持不变；SOP 放入模板 |
| 重复治理校验失败 | CI 近 7 天无重复 `check:governance` 失败 | 去重后关闭；无可执行任务 | Closed | 不适用 | 未运行，因无任务 | 无 |

- Escalation: 若候选任务涉及 CI / hook 行为变更，升级为红区并暂停人工确认；本轮仅文档模板，不触发。
- Next action: 先补样例与人工 checklist；归档迁移等台账超过软上限后再执行。
```

## 范例 8：记忆台账定期归档 SOP

当 `TECH_DEBT.md`、`KNOWN_BUGS.md` 或 `DECISIONS.md` 接近 / 超过 200 行软上限时，执行以下归档流程。该流程只移动冗长历史详情，不删除历史、不改 ID、不打断跨仓引用。

```markdown
## Memory Ledger Archive SOP

1. Count: 统计 `TECH_DEBT.md`、`KNOWN_BUGS.md`、`DECISIONS.md` 行数，确认是否接近 / 超过 200 行软上限。
2. Select: 只选择 `Resolved` / `Closed` / 已被后续决策 supersede 且历史上下文很长的条目；Open 项默认留在根台账。
3. Archive: 新建 `docs/reviews/memory-ledger-archive-YYYY-MM-DD.md`，迁入完整历史、验证记录、长讨论和跨仓链接。
4. Keep index: 根台账保留原 ID、状态、短摘要、归档链接和必要跨仓引用；不得重编号或删除 ID。
5. Cross-repo: 若条目有后端对应记录，前后端归档链接互相回引。
6. Verify: 归档后运行 `pnpm run check:governance`；若 PR 模板或 validator 相关文件也被修改，额外运行对应 Vitest。
7. Report: 交付中写明归档文件、保留在根台账的 ID 列表、未归档 Open 项原因。
```

## 常见误填提醒

- 「动态测试」必须写**实际运行过**的命令与真实结果，不写计划中的命令
- 低风险实现类任务可以用轻量 Workflow Packet；不要为了形式合规补写无意义的动态模拟、Red Team 或 Checker
- Red Team 只写「已执行 / 无问题」不算完成，四要素（攻击路径、预期失败点、实际结果、剩余风险）缺一不可
- Fast Path 的「不适用」必须带括号原因，PR 校验（`validate-pr-packet.mjs`）会检查该格式
- Memory Update 不写「无变化」流水账；未更新的文件给一句原因即可

## 坏例子 → 修正后

坏例子：

```markdown
- Actual results: Should pass.
- Attack result: Done, no problem.
- Residual risk:
- Updated memory files: None.
- Not updated memory files and reasons: No changes.
```

修正后：

```markdown
- Actual results: `pnpm run check:governance` passed; `pnpm exec vitest run scripts/validate-pr-packet.test.mjs` passed.
- Attack result: Required modifier `Red Team` with empty attack evidence is rejected by `validate-pr-packet.mjs`.
- Residual risk: The validator checks minimum evidence presence only; reviewer still checks evidence quality.
- Updated memory files: `DECISIONS.md` DEC-YYYYMMDD-NNN records the governance rule change.
- Not updated memory files and reasons: `TECH_DEBT.md` / `KNOWN_BUGS.md` unchanged because no new durable debt or reproducible bug was found.
```

## 关联文档

- [../../AGENTS.md](../../AGENTS.md) §4 任务开始模板、§7 输出与交接要求、§8 AI Memory Update
- [../DYNAMIC_WORKFLOW_RULES.md](../DYNAMIC_WORKFLOW_RULES.md) Workflow Packet 字段语义与决策流程图
- [../../.github/PULL_REQUEST_TEMPLATE.md](../../.github/PULL_REQUEST_TEMPLATE.md) PR 层字段镜像
