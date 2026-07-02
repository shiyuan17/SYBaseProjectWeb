# API_RULES.md — 接口与数据契约规范

本文件是前端仓接口协作的唯一细则来源。涉及后端接口、字段、权限、菜单、统计口径、业务规则、mock 或联调时，必须同时遵守 `AGENTS.md` 的后端联动规则，并提供同级后端仓 `SYBaseProject` 的实现或验证证据。

## 目标

- 让前端、后端、mock、测试和文档使用同一套字段语义。
- 防止 AI 或开发者凭猜测编造接口、吞掉错误、直透 DTO 到视图。
- 让接口变更可以被 Review、回归测试和交付 Packet 追踪。

## 单一来源

| 内容 | 唯一来源 | 前端责任 |
| --- | --- | --- |
| URL、方法、权限、错误码 | 后端实现 / OpenAPI / 后端 MR | 引用证据，不自行发明 |
| DTO 字段与兼容性 | 后端 DTO / mapper / migration 说明 | 建立类型与 mapper，标注可选字段 |
| ViewModel | 前端模块 mapper | 服务 UI，不反向污染 DTO |
| mock 数据 | 后端契约快照或真实联调样例 | 与 DTO 同步，变更时更新测试 |
| 业务错误语义 | 后端错误码与业务规则 | 页面给出可理解反馈 |

## 命名与分层

- API 文件放在模块 `api/` 下；共享请求底座不得混入业务接口。
- 函数命名使用业务动词 + 对象，例如 `querySpecimenList`、`createTechnicalOrder`。
- 类型分层必须清楚：`*Dto` / `*Request` / `*Response` / `*ViewModel` / `*FormModel` 不混用。
- 页面和组件不得直接消费后端原始 DTO；必须经过 mapper 或明确的适配函数。
- 枚举、状态码、字段含义必须能追溯到后端常量、接口文档或业务决策。

## 请求与响应约束

- 分页默认使用 `page` / `size`；若后端使用其他字段，必须在 API 层集中适配并写明原因。
- 列表、详情、提交、导出、上传必须分别处理 loading、空态、业务错误、权限错误和网络错误。
- 不得吞掉异常后返回伪成功；确需降级时必须返回可区分状态并在页面展示。
- 新增字段默认按可选处理，直到后端兼容窗口结束；删除或重命名字段必须提供旧字段兼容策略。
- 上传、下载、导出必须验证文件名编码、失败响应解析和权限失败提示。

## Mapper 与兼容

- Mapper 是 DTO 到 ViewModel 的唯一转换位置；不得在多个组件里重复拼字段。
- Mapper 必须覆盖空值、未知枚举、旧字段、新字段和权限不足场景。
- 后端字段变更时，同步更新类型、mapper、mock、单测和交付证据。
- 对状态流转类字段，必须记录前端显示状态、后端原始状态和非法状态的处理方式。

## Mock 与联调

- mock 只服务本地开发和测试，不得成为真实契约来源。
- mock 变更必须说明对应后端证据：接口代码、OpenAPI、后端 MR、联调日志或样例响应。
- 跨仓联调触发 `Backend Cross-check` 修饰器；PR Packet 的 `Cross-repo evidence` 必须非空。
- AI Agent 不得根据 UI 需要临时创造 mock 字段并让实现依赖该字段。

## 验证矩阵

| 变更类型 | 最低验证 | Packet 证据 |
| --- | --- | --- |
| 仅新增前端 mapper | mapper 单测 + 类型检查 | Lightweight Evidence |
| 接口字段新增 / 改名 / 删除 | mapper 单测 + mock 同步 + 后端证据 | Full Evidence / Cross-repo evidence |
| 权限、患者、报告、导出 | 权限失败路径 + Red Team | Full Evidence / Red Team |
| 上传 / 下载 / 导出 | 成功、失败、文件名、权限失败 | Full Evidence |
| 统计口径 / 菜单 / 状态流 | 后端口径证据 + 前端显示验证 | Full Evidence |

## AI Agent 禁止项

- 禁止编造 URL、字段、错误码、权限码或状态枚举。
- 禁止绕过 mapper，把 DTO 直接传入页面、表格或 store 长期保存。
- 禁止为了让测试通过而修改 mock 但不核对后端。
- 禁止擅自修改 Axios 全局层、鉴权头、环境变量或跨模块请求策略；命中红区必须先人工确认。

## 关联文档

- [../../AGENTS.md](../../AGENTS.md)
- [./FRONTEND_RULES.md](./FRONTEND_RULES.md)
- [./DYNAMIC_WORKFLOW_RULES.md](./DYNAMIC_WORKFLOW_RULES.md)
- [./TEST_RULES.md](./TEST_RULES.md)
- [./REVIEW_RULES.md](./REVIEW_RULES.md)
