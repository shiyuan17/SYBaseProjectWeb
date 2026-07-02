# TEST_RULES.md — 测试与验证规范

本文件定义测试分层、触发矩阵和交付证据。`CODING_RULES.md` 只保留标准命令入口；具体“改什么要测什么”以本文件为准。

## 测试分层

| 层级 | 目标 | 常用命令 / 位置 | 适用场景 |
| --- | --- | --- | --- |
| 单元测试 | 函数、mapper、composable、组件局部行为 | `pnpm test:unit` / 同目录 `*.test.ts` | 默认首选 |
| 集成测试 | store + service + mapper 或模块内流程 | Vitest 组合测试 | 状态流、接口适配 |
| E2E | 关键用户链路 | `pnpm test:e2e` / `tests/e2e/` | 登录、权限、主流程 |
| 冒烟测试 | 构建后核心页面可打开 | Playwright / 手工记录 | 发布、CI、热修 |
| 回归测试 | 复现已知 bug 并防止复发 | 对应最小测试或复现脚本 | 缺陷修复必须 |
| 手工验收 | 外部系统、权限账号、数据环境 | 截图、日志、接口样例 | 自动化不可覆盖时 |

## 触发矩阵

| 改动 | 必须验证 | 可补充 |
| --- | --- | --- |
| mapper / DTO / mock | mapper 单测 + 类型检查 | 后端联调样例 |
| 组件展示 / 表单 | 组件单测或交互测试 | Browser 截图 |
| 路由 / 菜单 / 权限 | 路由/store 测试 + 权限失败路径 | E2E |
| 上传 / 下载 / 导出 | 成功、失败、权限失败、文件名 | 手工浏览器验证 |
| 共享组件 / composable | 单测 + 使用方抽样验证 | Story 或截图 |
| 构建脚本 / CI / 治理脚本 | 脚本单测 + 对应命令 | `git diff --check` |
| DB / 生产 / 安全 | Full Evidence + Red Team | E2E / 后端证据 |

## 强制规则

- 不得删除、跳过或弱化测试来让交付通过；确需临时跳过必须记录原因、恢复条件和 owner。
- 缺陷修复优先写复现测试或最小复现步骤，再修复。
- 测试应验证行为，不绑定内部实现细节；mock 只模拟边界，不替代真实契约。
- PR Packet 的 `Validation` 和 `Evidence` 必须写真实命令、退出结果、失败摘要或未验证原因。
- Full Packet 不能只写 `pnpm lint`；必须覆盖触发风险的专项验证。

## AI Agent 执行要求

- 改生产逻辑前先写或更新能失败的测试；无法自动化时先写清楚人工验证步骤。
- 每次声称通过前必须重新运行对应命令并读取退出码。
- 测试失败时先定位根因，不得直接改期望值。
- 不能运行的命令要记录环境、错误摘要和替代验证，不得写“应该通过”。

## 标准命令

| 命令                        | 说明           |
| --------------------------- | -------------- |
| `pnpm lint`                 | 全量 lint      |
| `pnpm check:type`           | 类型检查       |
| `pnpm test:unit`            | Vitest 单测    |
| `pnpm test:e2e`             | Playwright E2E |
| `pnpm run check:governance` | 治理文档与索引 |
| `git diff --check`          | 空白错误       |

## 关联文档

- [./CODING_RULES.md](./CODING_RULES.md)
- [./DYNAMIC_WORKFLOW_RULES.md](./DYNAMIC_WORKFLOW_RULES.md)
- [./API_RULES.md](./API_RULES.md)
- [./DB_RULES.md](./DB_RULES.md)
- [./REVIEW_RULES.md](./REVIEW_RULES.md)
