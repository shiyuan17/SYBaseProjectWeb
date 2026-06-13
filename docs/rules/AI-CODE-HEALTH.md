# AI 健康度开发规范（AI Code Health Standard）

Version: 2.0（压缩版，完整示例版见 git 历史 v1.0）

## 使用边界与优先级

- 本规范是 AI 生成代码时的质量自检附录，按需引用，不在首次全量通读清单内。
- 规则优先级：仓库专项规范（`CODING_RULES.md`、`VUE_TS_RULES.md`、`STATE_RULES.md`、`ROUTER_RULES.md`、`API_RULES.md`、`UI_RULES.md` 等） > 本规范 > 通用实现经验。
- 与专项规范表述有差异时，以专项规范为准；不得为迎合本规范而破坏现有模块边界、共享层契约或引入新依赖（新依赖属红区，须人工确认）。
- 本文件不作为任务开始、Workflow 选择、worktree 决策、Memory Update 或交付字段的来源。

## 核心原则

- 显式优于隐式，清晰优于聪明，稳定优于炫技
- 可理解性优于代码行数，可维护性优于设计模式堆砌
- 可验证目标优于模糊执行，外科手术式修改优于顺手整理
- 一切规则服务于降低认知负担，而非机械满足规范

## 规则速查表

| 维度 | 必须 | 禁止 | 细则来源 |
| --- | --- | --- | --- |
| 函数 | 单一职责；单一抽象层级（业务编排不混 SQL/消息/日志细节）；可独立调用与验证 | 一个函数同时做校验+计算+持久化+通知；为减行数做形式主义拆分导致频繁跳转 | `CODING_RULES.md` |
| 副作用 | 优先返回新对象；显式传入依赖 | 修改入参；写全局状态；依赖隐藏单例 | `STATE_RULES.md` |
| 命名 | 函数=动词+名词（`createOrder`）；布尔=`is/has/should/can`；事件用过去式（`OrderCreated`）；变量用业务语义 | 缩写、自造术语、`data/info/tmp/flag/obj/res/result1/testData` | `CODING_RULES.md` |
| 类型 | 公共 API 显式声明参数与返回类型；不确定时用 `unknown`；多参数优先对象参数 | 滥用 `any` 与 `as unknown as` 宽泛断言；返回不确定结构 | `VUE_TS_RULES.md` |
| 错误处理 | 结构化错误（错误码 + 消息）；区分用户输入/权限/不存在/业务规则/系统异常 | 吞异常（空 `catch`）；`throw '字符串'` | `API_RULES.md` |
| 文件 | 一个文件一个主题；文件名表达业务意图（`createOrder.ts`） | 新增 `utils.ts`/`common.ts`/`helper.ts`/`tools.ts` 垃圾场文件 | `PROJECT_DIRECTORY.md` |
| 测试 | 核心逻辑可测试；覆盖业务规则、边界条件、异常路径；测试关注行为而非调用次数 | 删测试让流程通过 | `CODING_RULES.md` |

行数仅作复杂度信号（业务编排 ≤30、算法 ≤60、UI 组件 ≤100），不是硬门槛；组件拆分口径以 `VUE_TS_RULES.md` 为准。

运行时 schema 校验（Zod 等）仅在已有依赖的场景使用，不得为套用规范擅自引入新依赖。

## AI 行为约束

- 不写聪明/炫技/过度抽象代码，不为减少行数降低可读性
- 不制造无业务意义的中间层、配置项或 speculative abstraction
- 所有函数与命名必须表达真实业务意图
- 优先直白实现、可维护性、可测试性、新人可读性

## 前端语境示例（Vue 3 + TS）

技术细则以 `VUE_TS_RULES.md`、`STATE_RULES.md`、`API_RULES.md` 为准。

组合式函数：单一职责 + 显式加载/错误状态，禁止 `any` + 模糊命名 + 直接透传后端结构：

```ts
function useUserList() {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const rows = ref<UserTableRow[]>([]);

  async function load(query: UserListQuery) {
    loading.value = true;
    error.value = null;
    try {
      const dto = await fetchUserList(query);
      rows.value = dto.items.map(toUserTableRow);
    } catch (e) {
      error.value = resolveErrorMessage(e);
    } finally {
      loading.value = false;
    }
  }

  return { loading, error, rows, load };
}
```

ViewModel 转换：不让组件长期依赖后端原始结构：

```ts
function toUserTableRow(dto: UserDTO): UserTableRow {
  return {
    id: dto.id,
    name: dto.userName,
    isEnabled: dto.status === 1,
    createdAt: formatDateTime(dto.gmtCreate),
  };
}
```

组件副作用可销毁（ECharts 等实例必须在卸载时释放）：

```ts
const chart = shallowRef<EChartsType | null>(null);
onMounted(() => {
  chart.value = echarts.init(containerRef.value!);
});
onBeforeUnmount(() => {
  chart.value?.dispose();
});
```

## 自检清单（提交前过一遍）

代码质量：

- [ ] 每个函数能一句话说明作用，只负责一件事，无隐藏副作用
- [ ] 命名表达真实业务含义，无缩写与模糊命名
- [ ] 无 `any` 滥用，公共 API 类型与返回值明确
- [ ] 无吞异常、无字符串异常，错误码明确
- [ ] 无无意义抽象与频繁跳转阅读，新人可在 30 秒内抓住主线

AI 行为：

- [ ] 关键假设已写明；需求多解时已澄清或显式选择并说明原因
- [ ] 需求已转成可验证成功标准
- [ ] 每个改动可追溯到用户需求、成功标准或本次必要清理
- [ ] 未改动无关格式、注释、命名或旧逻辑
- [ ] 缺陷修复先复现或补回归测试；重构能证明行为不变

## 评分模型（自检与复盘参考，非唯一判定）

可读性 30% + 命名 20% + 测试能力 20% + 类型完整性 15% + 错误处理 15%；90+ 优秀，80+ 良好，70+ 合格，60+ 需优化，<60 建议重构。
