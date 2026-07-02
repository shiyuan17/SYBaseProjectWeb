# FAILURE_LEARNINGS.md

只记录“可复发、可防护”的失败模式，不把所有普通 bug 都塞进来。单次现象如果还没有抽象成模式，先留在 `KNOWN_BUGS.md` 或任务复盘里。

| ID | 日期 | 场景 | 失败模式 | 错误动作 | 根因 | 早期信号 | 正确做法 | 已加护栏 | 关联任务/PR | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FL-20260702-001 | 2026-07-02 | Goal 执行 | Goal 无限循环 | 直接把大任务当成单个 Goal 持续推进 | 缺少可停止、可验证、可回滚的最小执行单元 | 目标持续扩范围，下一步总是“继续找问题” | 把父任务做成 orchestrator，把子任务拆成 5 分钟内可验证 Goal | 目录化任务模型、5 分钟子任务规则、orchestrator / goal 分离 | T-002 | guarded |
| FL-20260702-002 | 2026-07-02 | Worktree 交付 | worktree 已完成但未 merge-back 就宣称完成 | 只在隔离 worktree 中提交，没有确认目标分支已包含变更 | 把“本地提交完成”误当成“主线完成” | 交接里只写提交 hash，不写 merge-back 状态 | 交付前必须核对目标分支、merge-back 和清理条件 | 交接模板强制写 `Merge-back 状态`，GIT_RULES 的 Worktree 完成门槛 | worktree 治理优化 | guarded |
| FL-20260702-003 | 2026-07-02 | 多 Agent 协作 | 实现 Agent 自证通过 | 写完代码后由同一实现者直接给出最终放行结论 | 缺少独立审查角色和职责边界 | 高风险任务没有独立 review 证据 | 中高风险任务由主 Agent 汇总，至少补独立审查或测试结论 | `TASK_LIFECYCLE_RULES.md` 多 Agent 协作模型、Full 档独立审查 | Full 档治理 | guarded |
| FL-20260702-004 | 2026-07-02 | 验证与交接 | 验证没有真实跑，只口头说通过 | 用“应该没问题”“看起来通过了”代替实际命令结果 | 完成压力下跳过证据收集 | 交接里没有命令、退出码或失败摘要 | 声称完成前必须跑对应验证并记录结果 | `handoff-template.md` 的 `验证情况` 字段、`validate-governance` 校验 | PR Packet / Handoff | guarded |
| FL-20260702-005 | 2026-07-02 | 前后端协作 | 前后端契约漂移 | 前端按猜测修改字段或 API 语义，没有后端交叉核对 | 缺少跨仓证据和契约审查 | 字段名频繁改动、mock 与真实接口不一致 | 先做 Spec / Cross-check，再提交接口证据和 Review 结论 | `API_RULES.md`、`DB_RULES.md`、Review 证据质量要求 | Backend Cross-check | guarded |
