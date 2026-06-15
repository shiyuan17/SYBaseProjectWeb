# Rules 规范索引

## 说明

本目录是项目级核心规范正文的唯一维护位置。仓库根目录 `AGENTS.md` 仍是协作入口；旧的 `docs/*.md` 同名入口已删除。

**首次进入或不确定最少读哪些规范时，先读 [QUICKSTART.md](./QUICKSTART.md)。**

## 工程基础

- [PROJECT_DIRECTORY.md](./PROJECT_DIRECTORY.md): 项目目录与模块边界
- [CODING_RULES.md](./CODING_RULES.md): 通用编码、验证命令与文本编码
- [VUE_TS_RULES.md](./VUE_TS_RULES.md): Vue 3 与 TypeScript 细则

## 前端专项

- [UI_RULES.md](./UI_RULES.md): 界面、交互与组件使用
- [STATE_RULES.md](./STATE_RULES.md): Pinia 状态管理
- [ROUTER_RULES.md](./ROUTER_RULES.md): 路由、守卫与导航元信息
- [API_RULES.md](./API_RULES.md): Axios、接口模型与错误处理
- [TESTING_RULES.md](./TESTING_RULES.md): 测试分层与 mock 契约
- [COMPATIBILITY_RULES.md](./COMPATIBILITY_RULES.md): 浏览器、导出打印与兼容性

## 协作治理

- [QUICKSTART.md](./QUICKSTART.md): 首次进入与中大型任务的最小阅读路径
- [GIT_RULES.md](./GIT_RULES.md): 分支、提交、PR、hook 与 Git 门禁
- [DYNAMIC_WORKFLOW_RULES.md](./DYNAMIC_WORKFLOW_RULES.md): Workflow、修饰器、动态测试与 Red Team
- [LOOP_ENGINEERING_RULES.md](./LOOP_ENGINEERING_RULES.md): Loop Engineering 协作规则
- [AGENT_SKILL_ROUTING.md](./AGENT_SKILL_ROUTING.md): 外部 AI skill 路由与回退
- [LINEAR_TASK.md](./LINEAR_TASK.md): Linear 任务起始模板
- [RELEASE.md](./RELEASE.md): 版本发布与回滚
- [AI-CODE-HEALTH.md](./AI-CODE-HEALTH.md): AI 生成代码健康度自检附录

## 维护约定

- 新增或修改核心规则时，正文放在本目录，并同步更新本索引。
- 旧的 `docs/*.md` 同名入口不再维护；新增引用应直接指向 `docs/rules/` 下的正文。
- 与长期上下文相关的状态、债务、缺陷、决策和架构快照放在 [../memory/README.md](../memory/README.md)。
