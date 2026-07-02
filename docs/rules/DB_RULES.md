# DB_RULES.md — 数据库变更跨仓协作规范

本前端仓不直接维护后端数据库 migration，但任何影响表结构、字典、seed、数据修复、统计口径或字段兼容的前端任务，都必须按本文件提供跨仓证据。数据库真实变更以同级后端仓 `SYBaseProject` 为准。

## 触发条件

命中任一条件即升级为 Full Packet，并按 `DYNAMIC_WORKFLOW_RULES.md` 启用 `DB` 修饰器：

- 后端新增、删除、重命名字段或调整字段含义。
- migration、seed、数据修复、历史数据补偿、索引或唯一约束变化。
- 前端需要同时兼容迁移前后数据。
- 报表、统计、菜单、权限、状态流转依赖数据库口径。
- 生产数据回滚、补偿或灰度发布需要前端参与验证。

## 跨仓证据

PR Packet 的 `Full Evidence` 至少包含：

- `Dynamic database`: migration 名称、apply 结果、rollback 或补偿方案、兼容窗口。
- `Cross-repo evidence`: 后端 commit / MR / 测试命令 / 迁移日志 / 联调样例。
- `Dynamic simulation`: 前端对迁移前后数据的展示或 mapper 验证。
- `Residual risk`: 数据量、回滚耗时、人工补偿、灰度窗口等剩余风险。

## 前端实现责任

- 字段新增：前端按可选字段处理，提供缺省显示和 mapper 单测。
- 字段删除 / 重命名：保留兼容窗口；同时支持旧字段和新字段，直到后端确认迁移完成。
- 字典 / 枚举：未知值必须有降级显示，不得导致页面崩溃。
- 数据修复：前端不得把临时修复逻辑散落在组件里，应集中在 mapper 或服务层，并记录移除条件。
- 统计口径：必须引用后端 SQL、服务方法、接口文档或验收样例，不得只按 UI 期望推断。

## 回滚与发布

- DB 变更必须说明回滚方式：反向 migration、补偿脚本、只读降级或前端兼容开关。
- 如果回滚会导致前端字段缺失，前端必须提前验证旧数据读取路径。
- 涉及生产数据的任务必须列出人工确认人、确认范围和回滚窗口。
- 不得在无后端证据时宣称“数据库无影响”。

## AI Agent 禁止项

- 禁止在前端仓凭猜测编写 migration、seed 或数据修复方案并视作已验证。
- 禁止删除兼容字段、mapper 降级或 mock 历史样例来让测试通过。
- 禁止把数据库口径问题包装成纯前端展示问题。
- 禁止跳过 Red Team：DB、生产数据、权限数据、患者报告相关任务必须做失败路径验证。

## 验证矩阵

| 场景 | 最低验证 | 人工确认 |
| --- | --- | --- |
| 新字段展示 | mapper 单测 + 旧数据样例 | 不需要，除非跨权限/报告 |
| migration 兼容 | 后端 migration 测试 + 前端旧/新样例 | 需要后端证据 |
| 数据修复 | 修复前后样例 + 回滚或补偿说明 | 需要数据 owner |
| 统计口径 | 后端口径证据 + 前端渲染验证 | 需要业务 owner |
| 生产回滚 | 回滚演练或明确降级策略 | 需要发布 owner |

## 关联文档

- [../../AGENTS.md](../../AGENTS.md)
- [./API_RULES.md](./API_RULES.md)
- [./DYNAMIC_WORKFLOW_RULES.md](./DYNAMIC_WORKFLOW_RULES.md)
- [./RELEASE.md](./RELEASE.md)
- [./REVIEW_RULES.md](./REVIEW_RULES.md)
