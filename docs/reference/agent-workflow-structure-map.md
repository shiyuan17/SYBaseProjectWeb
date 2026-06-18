# AI Agent 工作流结构映射

> **可选参考**：外部编号目录的概念对齐，**非**协作规范必读项。日常任务以 `AGENTS.md` + `docs/rules/QUICKSTART.md` 为准。

## 目的

外部资料中的 `01_planner` 到 `10_docs` 结构适合作为通用 AI Agent 工作流的概念模型。本仓已经采用面向工程治理的事实目录：协作入口、核心规则、长期记忆、专题资料、工具脚本和 CI 分别放在各自稳定位置。

因此，本仓只做概念对齐，不把现有目录整体迁移成编号目录。后续新增文档或工具时，应优先放入现有事实目录，并在对应 `README.md` 中补充入口。

## 映射总览

| 通用结构 | 本仓入口 | 本仓职责 | 维护边界 |
| --- | --- | --- | --- |
| `01_planner/` 规划与任务管理 | [../plans/README.md](../plans/README.md)、[../templates/](../templates/) | 阶段实施方案、专项执行计划、Codex / Linear 任务模板 | 只放计划、任务拆分和可复用提示词；不替代 `AGENTS.md` 的任务确认规则 |
| `02_memory/` 记忆系统 | [../memory/README.md](../memory/README.md) | 项目状态、技术债、已知缺陷、决策日志、架构快照 | 五类记忆文件职责以 [../../AGENTS.md](../../AGENTS.md) 为准，不新增平行记忆目录 |
| `03_tools/` 工具系统 | [../../scripts/](../../scripts/)、[../../.agents/skills/](../../.agents/skills/)、[../../.github/workflows/](../../.github/workflows/) | 治理校验、日志包装、Linear 同步、项目级 skills、CI 工作流 | 工具和自动化保留在可执行位置；文档只记录入口和使用规则 |
| `04_knowledge/` 知识库与检索 | [README.md](./README.md)、[detailed_list/README.md](./detailed_list/README.md)、[database/README.md](./database/README.md)、[../acceptance/README.md](../acceptance/README.md) | 业务清单、数据库资料、验收材料和背景分析 | 参考资料不替代接口、数据库或业务规则的事实来源 |
| `05_agent_core/` Agent 核心配置 | [../../AGENTS.md](../../AGENTS.md)、[../rules/DYNAMIC_WORKFLOW_RULES.md](../rules/DYNAMIC_WORKFLOW_RULES.md)、[../rules/LOOP_ENGINEERING_RULES.md](../rules/LOOP_ENGINEERING_RULES.md)、[../rules/AGENT_SKILL_ROUTING.md](../rules/AGENT_SKILL_ROUTING.md) | 协作边界、Workflow 路由、Loop Packet、skill 路由 | `AGENTS.md` 是协作入口；Workflow 分类和修饰器只在动态规则中维护 |
| `06_evaluation/` 评估与测试 | [../../tests/](../../tests/)、[../acceptance/README.md](../acceptance/README.md)、[../templates/workflow-packet-examples.md](../templates/workflow-packet-examples.md) | 单测、E2E、验收记录、Workflow Packet 示例 | 测试命令以 [../rules/CODING_RULES.md](../rules/CODING_RULES.md) 为准，验收材料不替代真实验证 |
| `07_observability/` 观测与监控 | [../../.logs/](../../.logs/)、[../../scripts/run-with-log.mjs](../../scripts/run-with-log.mjs)、[../rules/DYNAMIC_WORKFLOW_RULES.md](../rules/DYNAMIC_WORKFLOW_RULES.md) | 前端、后端、构建、测试日志和生产问题排查入口 | `.logs/` 是本地运行证据；排查流程仍按 Production Debug Workflow 执行 |
| `08_deployment/` 部署与运维 | [../../deploy/](../../deploy/)、[../rules/RELEASE.md](../rules/RELEASE.md)、[../../.github/workflows/](../../.github/workflows/) | Nginx 配置、发布与回滚规则、CI 门禁 | 构建发布和 CI/CD 属红区，变更前按 `AGENTS.md` 升级确认 |
| `09_examples/` 示例与用例 | [../templates/workflow-packet-examples.md](../templates/workflow-packet-examples.md)、[../acceptance/README.md](../acceptance/README.md)、[../reviews/README.md](../reviews/README.md) | 治理模板范例、验收样例、审查报告 | 示例用于降低误填概率，不新增强制字段或新的路由体系 |
| `10_docs/` 文档与知识库 | [../README.md](../README.md)、[../rules/README.md](../rules/README.md)、[README.md](./README.md) | 文档导航、核心规范索引、参考资料入口 | 核心规则放 `docs/rules/`，长期记忆放 `docs/memory/`，专题资料按分类目录归档 |

## 使用建议

1. 新任务先读 [../../AGENTS.md](../../AGENTS.md)，确认协作边界、风险等级、红区规则和交付要求。
2. 按任务类型进入 [../rules/README.md](../rules/README.md)，读取命中的专项规则。
3. 续接历史任务或交付前 Memory Update 时，读取 [../memory/README.md](../memory/README.md) 和对应记忆文件。
4. 需要计划、验收、审查、参考或模板材料时，再从 [../README.md](../README.md) 的分类目录进入。
5. 遇到图片或外部文章中的编号目录结构时，优先使用本映射找到本仓事实入口，不新增重复的编号目录。

## 不建议迁移为编号目录的原因

- 现有 `docs/rules/`、`docs/memory/`、`AGENTS.md` 已被治理校验、PR 模板和 CI 工作流引用。
- `scripts/`、`.agents/skills/`、`.github/workflows/` 是可执行工具或平台配置，不适合作为普通文档子目录移动。
- 编号目录会制造第二套信息架构，容易让后续 Agent 不清楚哪个位置才是单一事实来源。
- 当前结构已经按“规则、记忆、计划、验收、审查、参考、模板”分层，更适合本仓前端工程治理和跨仓协作。
