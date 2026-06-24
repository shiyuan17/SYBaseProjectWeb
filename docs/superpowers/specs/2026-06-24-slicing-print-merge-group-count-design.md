# 切片工作站打印口径统一为合并组口径设计

## 背景

当前 M3 切片工作站已经支持待打印玻片两两合片：

- 前端 `GET /api/v1/slicings/workbench` 的 `pendingPrintList` / `pendingPrintTotal` 已按合片后的可见打印行返回。
- 合片组在工作台中表现为一行，例如 `A1+A2`。
- 但打印动作成功提示、`printedSlideCount` 返回值，以及部分“已打印数”展示仍然沿用原始切片数口径。

这会导致用户在看到 4 个合片后待打印单元时，执行打印后仍感知为打印了 6 个，和工作台心智模型不一致。

## 目标

将切片工作站中的“打印数量”统一定义为“当前打印单元数”：

- 普通未合片待打印行：1 行 = 1 个打印单元
- 合片组待打印行：1 组合片组 = 1 个打印单元

在此定义下，像 `A1 A2 A3 B1 B2 B3` 合成为 `A1+A2`、`B1+B2`、`A3`、`B3` 后：

- 待打印数量显示为 4
- 实际打印动作成功提示显示为 4
- 与打印结果相关的工作台数值展示也按 4 理解

## 非目标

- 不修改合片分组规则
- 不修改“底层实际生成了多少张物理玻片”的业务过程
- 不改其他工作站或其他模块的打印口径，除非直接复用本次切片接口语义

## 现状问题

### 前端

`apps/web-ele/src/modules/technical-workflow/views/SlicingWorkstationView.vue`

- 待打印页签标题已经使用 `pendingPrintTotal`，这部分是合片后口径
- 打印成功提示使用 `printedItems.reduce(...item.result.printedSlideCount...)`
- 打印模板中的 `total` 字段使用 `result.printedSlideCount || slideNos.length`
- “已打印数”表格列直接展示 `row.printedSlideCount`

这意味着页面同时存在两套口径：

- 页签数量按打印单元数
- 打印结果与部分行数据按原始玻片数

### 后端

`../SYBaseProject/bl-center`

- `printSlicingSlideMergeGroup(...)` 目前会逐个组内任务调用 `printSlicingSlides(...)`
- 返回 `SlicingSlidePrintResult` 时，`printedSlideCount` 使用 `slideNos.size()`
- 对于 `A1+A2` 这样的合片组，当前返回值是 2，而不是 1

因此前端即使只展示工作台行数，只要继续相信 `printedSlideCount`，仍会回到原始玻片数口径。

## 设计决策

采用“前后端统一改为合并组优先口径”：

1. 将切片打印返回值中的 `printedSlideCount` 重新定义为“本次打印单元数”
2. 普通打印保持返回 1
3. 合片组打印返回 1，而不是组内原始任务数
4. 工作台中与打印数量相关的展示统一使用该口径
5. 若未来需要表达底层物理玻片张数，应新增独立字段，不再复用 `printedSlideCount`

## 详细方案

### 1. 后端打印返回口径调整

影响位置：

- `TechnicalProcessingWorkflowService#printSlicingSlideMergeGroup`
- 对应 response / model / controller / integration test

调整内容：

- 普通 `POST /api/v1/slicings/slide-print` 不变，`printedSlideCount` 仍为 1
- 合片组 `POST /api/v1/slicings/slide-print-merge-groups/print` 的 `printedSlideCount` 改为 1
- 保留 `slideIds`、`slideNos` 全量返回，确保底层打印产物仍可追踪

结果语义：

- `printedSlideCount` = 本次工作台打印单元数
- `slideNos.length` = 底层实际生成的玻片标签数

### 2. 前端待打印成功提示统一

影响位置：

- `SlicingWorkstationView.vue`

调整内容：

- 批量打印成功提示继续汇总 `printedSlideCount`
- 因为后端口径已经统一，所以普通行打印 2 条显示 2，合片组打印 2 组也显示 2

### 3. 前端打印模板总数口径统一

影响位置：

- `buildPrintedSlicingSlideLabels(...)`

调整内容：

- 标签模板中 `total` 使用统一后的 `printedSlideCount`
- 对合片组来说，标签明细仍可列出多个 `slideNo`，但总数显示为本次打印单元数

说明：

当前打印模板会把 `total` 渲染为 `sequence/total`。因此本次实现不能继续把同一组合片中的多个 `slideNo` 直接套用“打印单元数”作为 `total`，否则会出现 `1/1`、`2/1` 这类错误展示。

实现约束收敛为：

- 打印成功提示按打印单元数展示
- 工作台数量展示按打印单元数展示
- 标签模板中的 `sequence/total` 继续表达物理标签张数，不参与本次“打印数量”统一口径
- 因此前端实现时不得再把标签模板 `total` 当成工作台打印数量语义

### 4. 前端工作台“已打印数”口径统一

影响位置：

- `GET /api/v1/slicings/workbench` 返回的 `printedSlideCount`
- `SlicingWorkstationView.vue` 完成列表中的“已打印数”列

调整内容：

- 已合并并完成打印的切片记录，工作台展示的 `printedSlideCount` 改为打印单元数
- 对合并完成记录，若是一组合片产物，对前端主表展示为 1

说明：

这一步要求后端工作台查询中产生的 `printedSlideCount` 也统一收口为打印单元语义，而不是历史生成玻片数。

### 5. 统计卡片与页签数量

当前判断：

- `pendingPrintTotal`
- `stats.pendingPrintCount`

`pendingPrintTotal` 已由后端集成测试证明按合片后的工作台可见打印单元数返回。

`stats.pendingPrintCount` 当前需要在实现阶段补回归断言；若验证结果显示它仍按原始切片数累加，则同次修正为合片后打印单元数。

## 影响范围

### 前端

- `apps/web-ele/src/modules/technical-workflow/views/SlicingWorkstationView.vue`
- `apps/web-ele/src/modules/technical-workflow/views/SlicingWorkstationView.test.ts`
- `technical-workflow-service.test.ts` 中与切片打印结果映射相关的契约断言

### 后端

- `../SYBaseProject/bl-center/src/main/java/.../TechnicalProcessingWorkflowService.java`
- `../SYBaseProject/bl-center/src/main/java/.../TechnicalWorkflowQueryService.java`
- `../SYBaseProject/bl-center/src/main/java/.../SlicingController.java`
- `../SYBaseProject/bl-center/src/test/java/.../SlicingWorkbenchIntegrationTest.java`

## 兼容性与风险

### 风险 1

`printedSlideCount` 语义变化可能影响其他复用该接口的调用方。

缓解：

- 先在前后端全局搜索 `printedSlideCount`
- 本次只在切片工作站相关链路中改口径
- 若发现其他调用方依赖旧语义，则同次一起评估，或改为新增字段

### 风险 2

打印模板中的 `sequence/total` 当前表达的是物理标签张数，而不是工作台打印单元数。

缓解：

- 本次明确不修改标签上的物理张数表达
- 工作台打印数量与标签物理张数分开处理，避免混用同一字段

### 风险 3

工作台完成列表中的历史数据可能仍保留旧的底层记录语义，导致新旧数据展示口径并存。

缓解：

- 优先确保新打印链路与当前工作台查询语义一致
- 若历史数据转换复杂，本次允许只修“前端展示换算”，但要在实现说明中显式写出

## 测试方案

### 前端单测

补充或调整 `SlicingWorkstationView.test.ts`：

- 普通待打印批量打印时，成功提示按选中行数累计
- 合片组批量打印时，成功提示按选中组数累计
- 合片组打印调用 `/slide-print-merge-groups/print`
- 完成列表“已打印数”在合片场景下显示打印单元数

必要时补 `technical-workflow-service.test.ts`：

- 确认 `printedSlideCount` 契约映射正确

### 后端集成测试

补充或调整 `SlicingWorkbenchIntegrationTest`：

- 合片后工作台 `pendingPrintTotal` 维持合并组数
- 合片组打印接口返回 `printedSlideCount = 1`
- 打印完成后的工作台记录展示按打印单元数
- 若存在 `stats.pendingPrintCount` 断言，则补上合片场景校验

## 验收标准

### 场景 1

给定 `A1 A2 A3 B1 B2 B3`

当系统合并为：

- `A1+A2`
- `B1+B2`
- `A3`
- `B3`

则：

- 待打印列表显示 4 条打印单元
- 打印这 4 条后，成功提示为 4

### 场景 2

打印 1 条普通待打印行时：

- 仍显示打印 1 个
- 不影响未合片行为

### 场景 3

已打印完成列表中，与本次打印数量相关的展示不再回退到原始 6，而是按合并后的 4 理解。

## 实施边界

本次改动是中风险、跨前后端契约微调：

- 不涉及权限、路由、全局请求层
- 涉及同级后端 `SYBaseProject` 对照和同步修改
- 以最小 diff 完成，不顺手重构 unrelated 打印逻辑
