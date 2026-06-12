# Docs 文档导航

## 说明

`docs/` 目录采用“核心规范保留顶层、专题资料按类别下沉”的组织方式。

- 顶层仅保留协作必读规范文档，避免打断 `AGENTS.md` 与 `README.md` 的固定入口。
- 非规范类文档统一放入分类目录，降低顶层噪音，提升可发现性。
- 新增文档默认不得直接放入 `docs/` 根层，除非它属于项目级核心规范。

## 阅读顺序

1. 先阅读 [../AGENTS.md](../AGENTS.md)。
2. 按需阅读顶层规范文档。
3. 再进入对应分类目录查找实施方案、验收材料、评审报告或参考资料。

## 顶层规范文档

- [PROJECT_DIRECTORY.md](./PROJECT_DIRECTORY.md)
- [CODING_RULES.md](./CODING_RULES.md)
- [VUE_TS_RULES.md](./VUE_TS_RULES.md)
- [UI_RULES.md](./UI_RULES.md)
- [STATE_RULES.md](./STATE_RULES.md)
- [ROUTER_RULES.md](./ROUTER_RULES.md)
- [API_RULES.md](./API_RULES.md)
- [COMPATIBILITY_RULES.md](./COMPATIBILITY_RULES.md)
- [GIT_RULES.md](./GIT_RULES.md)
- [DYNAMIC_WORKFLOW_RULES.md](./DYNAMIC_WORKFLOW_RULES.md)
- [LOOP_ENGINEERING_RULES.md](./LOOP_ENGINEERING_RULES.md)
- [AGENT_SKILL_ROUTING.md](./AGENT_SKILL_ROUTING.md)
- [LINEAR_TASK.md](./LINEAR_TASK.md)
- [RELEASE.md](./RELEASE.md)
- [AI-CODE-HEALTH.md](./AI-CODE-HEALTH.md)

## 分类目录

- [acceptance/](./acceptance/README.md): 验收、交付、PR 说明、测试手册、现场 SOP
- [plans/](./plans/README.md): 实施方案、阶段执行计划
- [reviews/](./reviews/README.md): 审查、差距分析、健康度与对比报告
- [reference/](./reference/README.md): 业务清单、数据库资料、分析报告
- [templates/](./templates/): 可复用提示词与任务模板（如 Codex 任务模板、Linear 计划拆分模板）

## 维护约定

- 核心协作文档继续保留顶层稳定路径，不随普通整理移动。
- 历史 HTML 报告优先按专题归档，不强制重写其中的历史快照路径。
- 新增专题文档时，先判断应归入 `acceptance`、`plans`、`reviews` 或 `reference`，并同步更新对应目录的 `README.md`。
