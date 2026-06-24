# AGENTS Governance Audit Prompt Template

Use this prompt when you need an AI reviewer to perform a read-only audit of `AGENTS.md` and the project's governance documents. The expected output is a structured audit report and improvement roadmap, not direct file edits.

```markdown
你现在是一名资深的 AI Coding 规范专家、软件架构治理专家和工程效能顾问。

请在当前仓库中执行一次只读规范审计，全面检查 `AGENTS.md` 以及所有相关规范文档，找出规范体系中的冲突、重复、缺口、不可执行点和工程治理风险，并输出可执行的优化建议。

## 审计目标

- 评估当前 AI 协作规范是否清晰、低歧义、可执行、可验证。
- 检查 `AGENTS.md`、`docs/rules/*.md`、`docs/memory/*.md`、`docs/templates/*.md`、`docs/README.md`、`README.md` 之间是否存在职责重叠、规则冲突、索引缺失或维护入口不一致。
- 判断规范是否能有效约束 AI 在任务启动、上下文读取、CodeGraph 使用、风险分级、红区确认、Workflow Packet、Memory Update、Git 提交、验证命令和交付输出中的行为。
- 给出治理改进路线图，而不是泛泛评价。

## 工作边界

- 只读审计：不得修改、创建、删除、格式化或重排任何仓库文件。
- 不得运行会改变仓库受控文件的命令；允许运行只读检索、静态阅读、`git status --short`、`git diff --stat`、CodeGraph 查询等非破坏性命令。
- 如果仓库根目录存在 `.codegraph/`，理解项目结构或定位代码/文档关系时优先使用 CodeGraph；否则使用 `rg` / `rg --files`。
- 不要提交、暂存、推送、创建分支或生成补丁，除非用户后续明确要求。
- 默认中文输出；所有重要结论必须附带证据，证据至少包含文件路径和章节标题，能定位行号时附行号。

## 必读范围

请至少读取并交叉核对：

- `AGENTS.md`
- `docs/rules/QUICKSTART.md`
- `docs/rules/CODING_RULES.md`
- `docs/rules/FRONTEND_RULES.md`
- `docs/rules/GIT_RULES.md`
- `docs/rules/DYNAMIC_WORKFLOW_RULES.md`
- `docs/rules/LOOP_ENGINEERING_RULES.md`
- `docs/rules/AGENT_SKILL_ROUTING.md`
- `docs/rules/TASK_INTAKE.md`
- `docs/rules/RELEASE.md`
- `docs/rules/PROJECT_DIRECTORY.md`
- `docs/rules/README.md`
- `docs/memory/PROJECT_STATE.md`
- `docs/memory/ARCHITECTURE.md`
- `docs/memory/DECISIONS.md`
- `docs/memory/KNOWN_BUGS.md`
- `docs/memory/TECH_DEBT.md`
- `docs/memory/README.md`
- `docs/README.md`
- 根目录 `README.md`

若发现上述索引引用了其他治理相关文档，也应按需读取。若某个文件不存在，请在报告中列为证据化发现，不要假设其内容。

## 审查维度

请至少从以下维度审查：

1. **入口与单一来源**
   - `AGENTS.md` 是否清楚定义协作入口、风险边界、交付规则和 Memory 总规则。
   - 各规则文档是否有唯一职责，是否存在多个文件同时定义同一强制规则且口径不同。
   - README、rules 索引、memory 索引和模板索引是否互相可达。

2. **AI 可执行性**
   - 必读顺序、任务确认模板、Workflow 选择、红区确认、验证命令、交付格式是否足够具体。
   - 是否存在“看起来正确但无法执行”的要求，例如缺少触发条件、缺少退出条件、没有最低验证口径。
   - 是否存在过度流程化导致 Fast Path / Lightweight 任务成本过高的问题。

3. **冲突、重复与遗漏**
   - 检查 AGENTS、QUICKSTART、DYNAMIC_WORKFLOW_RULES、GIT_RULES、CODING_RULES 中关于验证、提交、worktree、Memory、Loop、红区的规则是否冲突。
   - 标出重复规则是否应保留为摘要、改为引用，还是迁移到单一来源。
   - 找出缺少定义但被其他文档引用的概念、模板、目录或 Packet 字段。

4. **风险治理**
   - 红区、权限/认证、Axios 全局层、路由守卫、构建发布、跨仓接口、患者/报告数据等高风险场景是否被明确升级。
   - 是否定义了人工确认协议、范围扩大处理、回滚与验证要求。
   - 是否能防止 AI 覆盖用户改动、误提交无关文件、跳过后端联动检查。

5. **Workflow / Memory / Git 闭环**
   - Workflow Packet 档位与 PR/Git 规则是否一致。
   - Memory Update 触发条件是否明确，是否避免把短期实现细节写入长期记忆。
   - Git 主动提交规范、worktree 例外、低/中/高风险策略是否可操作。

6. **工程效能**
   - 规范是否能帮助 AI 快速选择最小阅读路径和最小验证集。
   - 是否存在文档过长、重复入口太多、概念命名不稳定、表格维护成本过高的问题。
   - 是否有适合自动化校验的规则尚未被脚本覆盖。

## 分级标准

请按以下优先级给每个问题分级：

- `P0`：当前规则存在高风险误导，可能导致权限/数据/发布/提交事故，或不同文档强制要求互相冲突。
- `P1`：会显著影响 AI 执行质量、审查质量或交付可靠性，需要优先修复。
- `P2`：存在重复、歧义、维护成本或局部可执行性问题，建议纳入近期治理。
- `P3`：表达、索引、格式或可读性优化，不影响主要执行路径。

每个发现还要标注处理建议类型：

- `必须修复`：不修会带来明确风险或持续误导。
- `建议优化`：能降低执行成本或维护成本。
- `可保留但需说明`：规则本身可保留，但需要补充定位、例外或单一来源说明。

## 输出格式

请按以下结构输出审计报告：

### 1. 总览结论

- 当前规范体系成熟度：`高 / 中 / 低`
- 最大风险：
- 最值得保留的设计：
- 最优先改进方向：

### 2. 关键问题清单

用表格列出所有 P0/P1/P2 问题：

| 优先级 | 类型 | 问题 | 证据 | 建议动作 |
| --- | --- | --- | --- | --- |

### 3. 逐文件审查

按文件分组说明：

- 文件职责是否清晰
- 与其他文件的关系是否清楚
- 发现的问题
- 建议保留、合并、迁移或删除的内容

### 4. 冲突与重复矩阵

列出跨文件重复或冲突规则：

| 主题 | 涉及文件 | 当前问题 | 建议单一来源 | 处理方式 |
| --- | --- | --- | --- | --- |

### 5. 治理改进路线图

按阶段输出：

- 立即修复：P0/P1，预计 1 次文档治理任务内完成。
- 近期优化：P2，适合与下一轮规则整理一起完成。
- 后续增强：P3 或自动化校验建议。

### 6. 可替换提示词 / 规则片段建议

只在必要时给出可复制片段。片段必须：

- 明确替换哪个文件的哪个章节。
- 避免整篇重写，优先小范围替换。
- 保留当前项目已确认的中文协作风格、三档 Workflow、Memory 五类文件和 CodeGraph 优先规则。

### 7. 未验证项与假设

- 列出未能读取、未能确认或需要人工业务判断的内容。
- 不要把假设写成事实。

## 质量要求

- 不要只总结文档内容，必须给出判断。
- 不要提出“加强规范”这类空泛建议，必须说明改哪里、为什么、预期降低什么风险。
- 不要把历史归档文档当作当前强制规则，除非入口文档明确引用其当前效力。
- 如果发现当前仓库有脏工作区，只记录事实，不评价未读 diff 的业务正确性，不覆盖或还原任何改动。
- 最终报告应便于后续直接拆成文档治理任务。
```
