# Memory 长期记忆索引

仓内长期上下文层。协作规则见 `AGENTS.md` §8。

## 记忆文件（按需阅读）

- [PROJECT_STATE.md](./PROJECT_STATE.md): 当前阶段与交接（入口层必读）
- [ARCHITECTURE.md](./ARCHITECTURE.md): 跨仓契约与模块边界（入口层必读）
- [TECH_DEBT.md](./TECH_DEBT.md): Open 技术债
- [KNOWN_BUGS.md](./KNOWN_BUGS.md): Open 缺陷与近期 Resolved 摘要
- [DECISIONS.md](./DECISIONS.md): 活跃业务决策索引

## 何时写 / 何时不写

- **绿区 Fast Path / Lightweight 且无 durable 变更**：默认**不更新** memory，交付可省略 Memory 判定
- **必须写**：新 DEC/契约、Open 债务或 bug、ARCHITECTURE 边界变化、阶段交接变化
- **会话续接**：优先 agentmemory `handoff` / `recall` / `session-history` 或 `agent-transcripts/`；模块局部上下文放模块 `README.md`

## 归档

历史台账全文在 `docs/reviews/`：

- [bug-archive.md](../reviews/bug-archive.md)
- [decisions-archive.md](../reviews/decisions-archive.md)
- [decisions-business-detail.md](../reviews/decisions-business-detail.md)
- [tech-debt-archive.md](../reviews/tech-debt-archive.md)

活跃台账只保留 Open 项 + 短摘要；迁归档时不删 ID。

## ID 与跨仓

- `TD-` / `BUG-` / `DEC-` + `YYYYMMDD-NNN`
- 跨仓事项双向引用前后端路径与验证
