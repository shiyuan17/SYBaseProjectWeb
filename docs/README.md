# Docs 文档导航

## 说明

`docs/` 目录采用“规则正文、长期记忆、专题资料分层放置”的组织方式。

- 核心规范正文统一放在 [rules/](./rules/README.md)。
- 长期记忆正文统一放在 [memory/](./memory/README.md)。
- 专题资料继续按验收、计划、审查、参考和模板分类归档。
- 旧的 `docs/*.md` 同名规范入口和根目录五类记忆入口已删除，不再作为维护点。

## 阅读顺序

1. 先阅读 [../AGENTS.md](../AGENTS.md)。
2. 首次进入或不确定最少读哪些规范时，阅读 [rules/QUICKSTART.md](./rules/QUICKSTART.md)。
3. 按需阅读 [rules/](./rules/README.md) 中的核心规范。
4. 续接历史任务或交付前 Memory Update 时阅读 [memory/](./memory/README.md)。
5. 再进入对应分类目录查找实施方案、验收材料、评审报告或参考资料。

## 核心入口

- [rules/README.md](./rules/README.md): 项目级规范正文索引
- [memory/README.md](./memory/README.md): 长期记忆文件索引

## 分类目录

- [acceptance/](./acceptance/README.md): 验收、交付、PR 说明、测试手册、现场 SOP
- [plans/](./plans/README.md): 实施方案、阶段执行计划
- [reviews/](./reviews/README.md): 审查、差距分析、健康度与对比报告；Memory 台账归档（`*-archive.md`、`decisions-business-detail.md`）
- [reference/](./reference/README.md): 业务清单、数据库资料、分析报告、AI 工作流结构映射
- [templates/](./templates/): 可复用提示词与任务模板（如 Codex 任务模板、Linear 计划拆分模板、治理模板填写范例 `workflow-packet-examples.md`）

## 维护约定

- 新增核心规则时，放入 `docs/rules/` 并同步更新 [rules/README.md](./rules/README.md)。
- 新增长期上下文时，优先更新 `docs/memory/` 中对应台账或快照。
- 新增专题文档时，先判断应归入 `acceptance`、`plans`、`reviews`、`reference` 或 `templates`，并同步更新对应目录的 `README.md`。
- 历史 HTML 报告优先按专题归档，不强制重写其中的历史快照路径。
