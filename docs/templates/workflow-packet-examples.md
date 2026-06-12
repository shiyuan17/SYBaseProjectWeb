# 治理模板填写范例

本文件给出任务确认、Workflow Packet、Memory Update Packet 的**已填写范例**，用于对照学习，降低空壳模板被误填、漏填的概率。字段语义以 `AGENTS.md` 第 4 / 7 / 8 节与 `docs/DYNAMIC_WORKFLOW_RULES.md` 为唯一来源；本文只是示例，不新增任何字段要求。

> 范例中的需求、文件路径、记忆项 ID 均为示意，使用时替换为真实内容，不要原样复制。

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

## 范例 4：Memory Update Packet（交付 / PR 摘要中的记忆层说明）

```markdown
## Memory Update Packet

- 已更新: `DECISIONS.md` 追加 DEC-YYYYMMDD-NNN（报告导出范围契约，引用后端 `SYBaseProject` MR !123 与接口测试结果）
- 未更新: `PROJECT_STATE.md`（阶段与验证基线未变化）、`TECH_DEBT.md` / `KNOWN_BUGS.md`（未发现新债务或缺陷）、`ARCHITECTURE.md`（模块边界未变化）
- 跨仓引用: 前端 PR 引用后端 MR !123；后端 `DECISIONS.md` 对应条目回引本 PR
```

## 常见误填提醒

- 「动态测试」必须写**实际运行过**的命令与真实结果，不写计划中的命令
- Red Team 只写「已执行 / 无问题」不算完成，四要素（攻击路径、预期失败点、实际结果、剩余风险）缺一不可
- Fast Path 的「不适用」必须带括号原因，PR 校验（`validate-pr-packet.mjs`）会检查该格式
- Memory Update 不写「无变化」流水账；未更新的文件给一句原因即可

## 关联文档

- [../../AGENTS.md](../../AGENTS.md) §4 任务开始模板、§7 输出与交接要求、§8 AI Memory Update
- [../DYNAMIC_WORKFLOW_RULES.md](../DYNAMIC_WORKFLOW_RULES.md) Workflow Packet 字段语义与决策流程图
- [../../.github/PULL_REQUEST_TEMPLATE.md](../../.github/PULL_REQUEST_TEMPLATE.md) PR 层字段镜像
