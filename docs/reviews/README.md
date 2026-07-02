# Reviews 文档索引

## 说明

本目录用于归档审查、差距分析、系统体检和对比评估文档，主要回答“现状如何”“差距在哪里”“还存在哪些风险”。

## Memory 与台账归档（Markdown）

- [bug-archive.md](./bug-archive.md)
- [decisions-archive.md](./decisions-archive.md)
- [decisions-business-detail.md](./decisions-business-detail.md)
- [tech-debt-archive.md](./tech-debt-archive.md)

## 审查报告（HTML）

- [ai-coding-governance-workflow-audit-2026-07-01.html](./ai-coding-governance-workflow-audit-2026-07-01.html)
- [ai-coding-governance-workflow-audit-2026-07-02.html](./ai-coding-governance-workflow-audit-2026-07-02.html)
- [ai-coding-governance-workflow-audit-2026-07-02-worktree.html](./ai-coding-governance-workflow-audit-2026-07-02-worktree.html)
- [agents-spec-redteam-review.html](./agents-spec-redteam-review.html)
- [clinical-submission-blsysnew-comparison.html](./clinical-submission-blsysnew-comparison.html)
- [clinical-submission-legacy-gap-analysis.html](./clinical-submission-legacy-gap-analysis.html)
- [clinical-submission-process.html](./clinical-submission-process.html)
- [clinical-submission-workflow-review.html](./clinical-submission-workflow-review.html)
- [frontend-system-audit-review.html](./frontend-system-audit-review.html)
- [full-process-audit-review.html](./full-process-audit-review.html)
- [loop-dynamic-workflow-ai-collab-audit-2026-06-13.html](./loop-dynamic-workflow-ai-collab-audit-2026-06-13.html)
- [project-code-health-checklist.html](./project-code-health-checklist.html)
- [technical-workflow-legacy-gap-analysis.html](./technical-workflow-legacy-gap-analysis.html)

## 推荐阅读顺序

1. 先看 [ai-coding-governance-workflow-audit-2026-07-02-worktree.html](./ai-coding-governance-workflow-audit-2026-07-02-worktree.html) 和 [ai-coding-governance-workflow-audit-2026-07-02.html](./ai-coding-governance-workflow-audit-2026-07-02.html) 了解当前 AI 治理基线。
2. 再看 [full-process-audit-review.html](./full-process-audit-review.html) 和 [project-code-health-checklist.html](./project-code-health-checklist.html) 了解全局流程与工程健康度。
3. 涉及临床送检时，再看 `clinical-submission*` 系列文档。
4. 涉及技术流程时，再看 [technical-workflow-legacy-gap-analysis.html](./technical-workflow-legacy-gap-analysis.html)。

## 与其他目录的关系

- 评审结论通常回流到 [../acceptance/README.md](../acceptance/README.md) 中的验收与交付材料。
- 对应的执行方案位于 [../plans/README.md](../plans/README.md)。
- 原始业务清单与背景资料位于 [../reference/README.md](../reference/README.md)。

## 维护约定

- 审查报告、差距分析、健康度检查和对比评估统一放在本目录。
- 历史 HTML 报告以档案为主，除非修复明确失效链接，否则不改写内部历史快照内容。
