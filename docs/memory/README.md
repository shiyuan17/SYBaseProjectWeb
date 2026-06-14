# Memory 长期记忆索引

## 说明

本目录存放仓内长期上下文层，记录项目状态、技术债、已知缺陷、协作决策和稳定架构快照。根目录同名记忆入口已删除，新增引用应直接指向本目录。

## 记忆文件

- [PROJECT_STATE.md](./PROJECT_STATE.md): 当前阶段、活跃任务、最新验证状态、跨仓依赖、交接重点
- [TECH_DEBT.md](./TECH_DEBT.md): 持久技术债台账
- [KNOWN_BUGS.md](./KNOWN_BUGS.md): 已知问题台账
- [DECISIONS.md](./DECISIONS.md): 影响后续协作的决策日志
- [ARCHITECTURE.md](./ARCHITECTURE.md): 稳定架构快照、模块边界、核心依赖、跨仓接口与当前约束

## 更新触发

- 项目阶段、活跃任务、验证基线或交接重点变化时更新 `PROJECT_STATE.md`。
- 发现或解决持久技术债时更新 `TECH_DEBT.md`。
- 发现、复现或修复已知 bug 时更新 `KNOWN_BUGS.md`。
- 做出影响后续协作的技术或流程决策时更新 `DECISIONS.md`。
- 改变稳定模块边界、跨仓接口、共享约束或禁止事项时更新 `ARCHITECTURE.md`。

## ID 与跨仓规则

- 技术债 ID 使用 `TD-YYYYMMDD-NNN`。
- 已知缺陷 ID 使用 `BUG-YYYYMMDD-NNN`。
- 决策 ID 使用 `DEC-YYYYMMDD-NNN`。
- 跨仓事项必须双向引用：前端记忆文件引用后端路径或验证，后端记忆文件引用前端路径或验证。
