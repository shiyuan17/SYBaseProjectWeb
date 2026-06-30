# DYNAMIC_WORKFLOW_RULES.md — Workflow 与 Packet

本文件只定义：主 Workflow、强制修饰器、Packet 档位与证据字段。任务生命周期、Git、Memory 的细则分别以 `TASK_LIFECYCLE_RULES.md`、`GIT_RULES.md`、`AGENTS.md` 为准。

## 总规则

1. 先选**主 Workflow**，再叠加强制修饰器；不得扩展未列出的分类。
2. 文案、测试-only、注释-only、只读分析可走 Fast Path；不得覆盖 Security、DB、红区、跨仓、生产问题。
3. Loop Packet 仅显式 opt-in；未启用 loop 时不填写。
4. 跨仓口径与后端 `SYBaseProject` 同步评估；改分类或修饰器时检查两仓影响。

## 主 Workflow 与修饰器

| 改动信号 | 主 Workflow | 必叠修饰器 |
| --- | --- | --- |
| 页面、组件、布局、样式、视口 | UI | Browser Verification（低风险文案可退出） |
| api、mapper、mock、联调 | API | Backend Cross-check（跨仓时） |
| 后端 migration、SQL、种子、回滚 | DB | DB + Backend Cross-check + Red Team |
| 权限、登录态、患者/报告、导出、审计 | Security | Security + Red Team |
| 重构、共享层、循环依赖、构建工具链 | Architecture | Red Team（跨层或红区时） |
| 生产问题、性能回退、`.logs/` 已有错误 | Production Debug | Red Team + Backend Cross-check（跨仓时） |
| hooks、CI、脚本、环境变量、发布路径、治理校验 | Workflow-Infra | Red Team（红区时） |
| 纯文档、不改运行时 | 不适用 | 无 |

修饰器全集：`Security` / `DB` / `Red Team` / `Backend Cross-check` / `Browser Verification`。

## Packet 档位

| 档位 | 使用条件 | 必填证据 |
| --- | --- | --- |
| Fast Path | 纯文档、只读、测试-only、低风险静态文案 | Summary + `Primary Workflow: Not applicable (<reason>)` + 验证 |
| Lightweight | 低风险实现，无 Security / DB / Red Team / Backend Cross-check 强制修饰器 | 主 Workflow、触发信号、动态测试或验证、剩余风险 |
| Full | 红区、跨层、跨仓、权限/数据/报告、生产、发布、强制修饰器 | 完整 Workflow Packet + Red Team 四要素 + 必要跨仓/浏览器/DB 证据 |

## 轻量 Workflow Packet

```markdown
## Dynamic Workflow

- Primary Workflow:
- Trigger signals:
- Required modifiers:
- Dynamic tests / validation:
- Unverified items and risks:
```

Memory 仅 durable context 变更时填写；触发条件见 `AGENTS.md` §8。

## 完整 Workflow Packet

```markdown
## Dynamic Workflow

- Primary Workflow:
- Trigger signals:
- Required modifiers:
- Expert Agent(s):
- Dynamic tests:
- Dynamic simulation:
- Dynamic security:
- Dynamic database:
- Red Team:
- Cross-repo evidence:
- Unverified items and risks:
```

## Red Team

Full 档命中 Red Team 时，最低证据必须包含：

- Attack path：尝试证明什么会被绕过、泄露、破坏或误导。
- Expected failure point：正确系统应在哪里失败或拦截。
- Attack result：实际命令、浏览器、接口、日志或人工核对结果。
- Residual risk：仍未覆盖的风险与原因。

## 各 Workflow 验证重点

| Workflow | 典型验证 | 重点风险 |
| --- | --- | --- |
| UI | 相关单测/E2E/Browser；共享组件补类型检查 | 按钮不可达、视口错位、敏感数据进弹窗/URL/导出 |
| API | service/mapper 单测；跨仓引用后端 verify | DTO 直透视图、吞错误、字段错配 |
| DB | 前端展示兼容；DB 证据引用后端 MR | 丢数据、兼容缺口、缺回滚 |
| Security | 权限/路由单测；必要时 E2E | URL/API 越权、敏感数据泄露 |
| Architecture | `lint` + `check:type` + `check:circular` + 单测 | 浅封装、跨层依赖、删测试/降级 |
| Production Debug | 先读 `.logs/` 复现再修；补回归测试 | 未复现就修、缺回滚 |
| Workflow-Infra | hook/CI/治理命令；必要时 build | 绕过 hook、改写非目标文件、本地路径入库 |

## 关联文档

- [../../AGENTS.md](../../AGENTS.md)
- [./QUICKSTART.md](./QUICKSTART.md)
- [./GIT_RULES.md](./GIT_RULES.md)
- [./LOOP_ENGINEERING_RULES.md](./LOOP_ENGINEERING_RULES.md)
- [../templates/workflow-packet-examples.md](../templates/workflow-packet-examples.md)
