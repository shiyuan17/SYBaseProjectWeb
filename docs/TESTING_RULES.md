# TESTING_RULES.md - 测试策略规范

## 目标与适用范围

本文件定义 `SYBaseProjectWeb` 的测试分层策略、用例落位约定与 mock 契约规则，回答“测什么、在哪测、测到什么程度”。

- 适用范围：`apps/web-ele` 业务代码、`packages` / `internal` 共享能力、`apps/backend-mock`、`tests/e2e`
- 入口收口：验证命令的定义与执行时机以 `docs/CODING_RULES.md`「标准验证命令」为唯一来源；“何时必须补测试”的强制触发条件以 `docs/CODING_RULES.md` 第 6 节为唯一来源。本文件只定义策略与约定，不重复命令表

## 测试分层

| 层 | 工具 | 位置 | 职责 |
| --- | --- | --- | --- |
| 单元测试 | Vitest（`--dom`） | 与被测文件同目录的 `*.test.ts`（co-located） | 工具函数、composable、组件逻辑、service/mapper 字段映射 |
| 端到端测试 | Playwright | `tests/e2e/smoke/`、`tests/e2e/<业务链路>/` | 登录态 / 路由 / 请求基础链路（smoke）与关键业务链路回归 |

分层边界：

- 能在单测层验证的逻辑（数据转换、状态机、权限判断、错误分支）不要靠 E2E 兜底；E2E 只覆盖“多个层协同才会暴露”的链路问题
- 新增业务模块时，优先补该模块 utils / composables / service 的单测；E2E 仅在该模块进入关键链路（如标本流转、报告签发）时新增
- `tests/e2e/smoke/` 是最低保障集，任何路由守卫、登录态、全局请求层改动都必须保证 smoke 通过

## 单元测试约定

- 用例文件与被测文件同目录、同名加 `.test.ts` 后缀；不集中堆放到独立 test 目录
- 覆盖基线遵循 `docs/CODING_RULES.md` 第 6 节：正常路径、边界条件、失败分支
- 组件测试优先测行为与输出（渲染结果、事件、调用参数），不断言内部实现细节；公共桩件复用各模块 `test-utils/`（如 `component-stubs.ts`），不重复手写
- service / mapper 测试必须覆盖：后端字段缺失、旧字段兼容、错误响应、分页边界
- 测试不得依赖真实网络与真实时间；外部依赖一律注入或 mock，时间用 fake timers

## E2E 约定

- 配置以根 `playwright.config.ts` 为准；用例按「smoke / 业务链路」分目录，不混放
- 业务链路用例命名表达场景（如 `happy-path.spec.ts`、`abnormal-receipt.spec.ts`），一个文件只覆盖一条主链路
- E2E 断言面向用户可见结果（页面元素、跳转、提示），不直接断言接口内部字段
- E2E 失败时先读 `.logs/test.log` 与 trace，不允许通过加宽超时或重试次数掩盖不稳定用例；不稳定用例修复或标记并登记 `KNOWN_BUGS.md` / `TECH_DEBT.md`

## Mock 契约规则

- `apps/backend-mock` 是开发期模拟，不是接口契约的事实来源；契约以后端 `SYBaseProject` 实现与 `docs/API_RULES.md` 为准
- 后端接口字段、错误码、分页协议变化时，必须同步更新 backend-mock 与对应前端单测；只改 mock 不改测试视为未完成
- 跨仓联调类任务，mock 通过不能作为交付证据；必须按 Backend Cross-check 修饰器引用后端实现或验证结果（见 `docs/DYNAMIC_WORKFLOW_RULES.md`）
- 业务模块内的 mock gateway（如 `*-mock-gateway.ts`）只服务于该模块演示与测试，不得被其他模块复用为数据源

## 按 Workflow 的测试选择

各主 Workflow 的动态测试组合（跑哪些命令、模拟哪些场景）以 `docs/DYNAMIC_WORKFLOW_RULES.md` 各 Workflow 小节为准，本文件不重复。通用顺序建议：先跑受影响模块单测，再按风险补 `pnpm check:type` / smoke E2E / 业务链路 E2E。

## 禁用项

- 不得删除或跳过（skip）既有测试来让流程通过；确需下线用例必须在交付说明与 `TECH_DEBT.md` 中登记原因
- 不得为凑覆盖写无断言或只断言“不抛错”的空壳用例
- 不得在单测中真实请求 backend-mock 或后端服务
- 不得把一次性调试用例（`.only`、临时数据）留在仓库

## 检查清单

- [ ] 新增/修改逻辑有对应层级的测试，落位符合 co-located 约定
- [ ] 缺陷修复有能复现问题的回归测试（触发条件见 `CODING_RULES.md` 第 6 节）
- [ ] 涉及接口字段变化时 backend-mock 与单测已同步
- [ ] 涉及路由守卫 / 登录态 / 全局请求层时 smoke E2E 已通过
- [ ] 无 skip / only / 空壳断言残留

## 关联文档

- [../AGENTS.md](../AGENTS.md)
- [./CODING_RULES.md](./CODING_RULES.md)
- [./DYNAMIC_WORKFLOW_RULES.md](./DYNAMIC_WORKFLOW_RULES.md)
- [./API_RULES.md](./API_RULES.md)
- [./VUE_TS_RULES.md](./VUE_TS_RULES.md)
