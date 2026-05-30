# AI 健康度开发规范（AI Code Health Standard）

Version: 1.0

---

# 前言

本规范用于约束 AI（Codex、Claude Code、Cursor、Copilot、OpenClaw、Gemini 等）生成代码时的行为，目标不是追求极致抽象或最少代码，而是持续产出：

- 易理解
- 易维护
- 易测试
- 易扩展
- 易审查

的健康代码。

---

# 一、核心原则（必须遵守）

## 1.1 基本准则

✅ 显式优于隐式

✅ 清晰优于聪明

✅ 稳定优于炫技

✅ 可理解性优于代码行数

✅ 可维护性优于设计模式堆砌

---

## 1.2 最终目标

所有规则均服务于：

降低认知负担

而非机械式满足规范。

---

# 二、函数健康度规范

函数是系统健康度的最小单元。

---

## 2.1 单一职责原则

一个函数只负责一件事情。

### 正例

```ts
function validateOrder(order: Order): ValidationResult;
```

```ts
function calculatePrice(items: OrderItem[]): number;
```

### 反例

```ts
function processOrder() {
  validate();
  calculate();
  save();
  notify();
}
```

同时承担：

- 校验
- 计算
- 持久化
- 消息通知

违反单一职责原则。

---

## 2.2 单一抽象层级

同一个函数内不要混用：

- 业务逻辑
- 技术实现
- 基础设施细节

### 正例

```ts
async function createOrder(command: CreateOrderCommand) {
  const order = buildOrder(command);

  await orderRepository.save(order);

  await eventBus.publish(new OrderCreated(order.id));
}
```

---

### 反例

```ts
async function createOrder(command) {

  const sql =
    "insert into order ...";

  await mysql.execute(sql);

  sendKafkaMessage(...);

  writeAuditLog(...);

}
```

业务与实现混杂。

---

## 2.3 无副作用原则

函数应尽量保持纯净。

### 禁止

修改外部状态：

```ts
globalState.user = user;
```

修改入参：

```ts
function updateOrder(order) {
  order.status = 'PAID';
}
```

---

### 推荐

返回新对象：

```ts
function markOrderPaid(order: Order): Order {
  return {
    ...order,
    status: 'PAID',
  };
}
```

---

## 2.4 可独立测试

函数必须可以：

- 单独调用
- 独立验证
- 无环境依赖

---

## 2.5 行数建议

### 行数是参考值，不是目标

| 类型         | 建议     |
| ------------ | -------- |
| 业务编排函数 | ≤ 30 行  |
| 算法函数     | ≤ 60 行  |
| UI组件       | ≤ 100 行 |
| 配置文件     | 不限制   |

---

### 禁止

为了减少行数：

- 过度抽象
- 提取无意义函数
- 拆分到无法阅读

---

### 反例

```ts
function process() {
  step1();
  step2();
  step3();
}
```

阅读者必须不断跳转。

属于形式主义拆分。

---

# 三、命名规范

命名是 AI 理解代码最重要的上下文。

---

## 3.1 命名原则

禁止：

- 缩写
- 自造术语
- 模糊表达

命名应直接体现业务意图。

---

## 3.2 函数命名

格式：

```text
动词 + 名词
```

示例：

```ts
createOrder();

calculatePrice();

validateUser();

generateReport();
```

---

## 3.3 布尔变量

格式：

```text
is
has
should
can
```

示例：

```ts
isPaid;

hasStock;

shouldRetry;

canDelete;
```

---

## 3.4 普通变量

使用业务语义。

```ts
totalAmount;

retryCount;

paymentMethod;

deliveryAddress;
```

---

## 3.5 事件命名

使用过去式。

```ts
OrderCreated;

OrderCanceled;

PaymentFailed;
```

---

## 3.6 禁止命名

```ts
data;
info;
tmp;
flag;
obj;
res;
result1;
testData;
```

---

# 四、类型与接口规范

类型是 AI 理解系统结构的导航地图。

---

## 4.1 禁止 Any

禁止：

```ts
any;
```

必须使用：

```ts
unknown;
```

或明确类型。

---

## 4.2 公共 API 显式声明

### 正例

```ts
function calculateTotal(items: CartItem[]): number;
```

---

### 反例

```ts
function calculateTotal(items) {}
```

---

## 4.3 输入集中

优先使用对象参数。

### 推荐

```ts
createOrder({
  userId,
  items,
  couponCode,
});
```

---

### 避免

```ts
createOrder(userId, items, couponCode);
```

---

## 4.4 输出明确

禁止返回不确定结构。

### 推荐

```ts
type CreateOrderResult
```

---

## 4.5 Schema 优先

优先使用：

- Zod
- Joi
- JSON Schema

统一输入校验。

示例：

```ts
export const CreateOrderSchema = z.object({
  userId: z.string(),
  items: z.array(
    z.object({
      skuId: z.string(),
      qty: z.number().int().positive(),
    }),
  ),
});
```

---

# 五、错误处理规范

错误处理是 AI 最容易失控的区域。

---

## 5.1 禁止吞异常

禁止：

```ts
try {
} catch {}
```

---

## 5.2 禁止字符串异常

禁止：

```ts
throw 'error';
```

---

## 5.3 使用结构化错误

```ts
throw new BusinessError({
  code: 'ORDER_NOT_FOUND',
  message: '订单不存在',
});
```

---

## 5.4 错误分类

| 类型         | 处理方式   |
| ------------ | ---------- |
| 用户输入错误 | 4xx        |
| 权限错误     | 403        |
| 资源不存在   | 404        |
| 业务规则失败 | 业务错误码 |
| 系统异常     | 日志+告警  |

---

# 六、副作用与状态管理

副作用必须可追踪。

---

## 6.1 禁止

修改全局状态：

```ts
updateGlobalState();
```

依赖隐藏单例：

```ts
CurrentUser.get();
```

---

## 6.2 推荐

显式依赖注入：

```ts
createOrder(command, repository);
```

---

# 七、文件与目录规范

目录结构决定系统可维护性。

---

## 7.1 文件原则

一个文件只负责一个主题。

---

## 7.2 文件命名

文件名应表达业务意图。

### 推荐

```text
createOrder.ts

calculatePrice.ts

validateOrder.ts
```

---

### 禁止

```text
utils.ts

common.ts

helper.ts

tools.ts
```

这些文件最终都会变成垃圾场。

---

## 7.3 推荐目录结构

```text
order/

├── createOrder.ts
├── validateOrder.ts
├── calculatePrice.ts

├── order.types.ts
├── order.errors.ts

├── order.repository.ts

└── order.spec.ts
```

---

# 八、测试与可验证性

## 8.1 测试优先

AI 应优先生成：

测试

再生成实现。

---

## 8.2 测试关注行为

测试业务行为：

```ts
shouldCreateOrder();
```

而不是：

```ts
shouldCallFunctionTwice();
```

---

## 8.3 核心逻辑必须可测试

必须覆盖：

- 业务规则
- 边界条件
- 异常路径

---

# 九、AI 行为约束（System Prompt）

以下内容建议作为所有 AI 编码工具的系统规则。

```markdown
# AI 行为约束

- 不写聪明代码
- 不写炫技代码
- 不写过度抽象代码
- 不为了减少行数而降低可读性
- 不制造无业务意义的中间层
- 所有函数必须具有明确业务语义
- 所有命名必须表达真实意图
- 优先直白实现
- 优先可维护性
- 优先可测试性
- 优先新人可读性
```

---

# 十、AI 健康度自检清单

提交代码前必须自检。

## 函数

- [ ] 是否能一句话说明函数作用？
- [ ] 是否只负责一件事情？
- [ ] 是否混用了多个抽象层级？
- [ ] 是否存在隐藏副作用？
- [ ] 是否容易测试？

---

## 命名

- [ ] 是否表达真实业务含义？
- [ ] 是否存在缩写？
- [ ] 是否存在模糊命名？

---

## 类型

- [ ] 是否使用了 any？
- [ ] 是否声明了公共 API 类型？
- [ ] 返回值是否明确？

---

## 错误处理

- [ ] 是否吞异常？
- [ ] 是否使用结构化错误？
- [ ] 是否具备明确错误码？

---

## 可维护性

- [ ] 新人能否在 30 秒内看懂？
- [ ] 是否存在无意义抽象？
- [ ] 是否存在频繁跳转阅读？
- [ ] 是否降低了系统认知成本？

---

# 健康度评分模型

| 维度       | 权重 |
| ---------- | ---- |
| 可读性     | 30%  |
| 命名质量   | 20%  |
| 测试能力   | 20%  |
| 类型完整性 | 15%  |
| 错误处理   | 15%  |

总分：

```text
90~100   A 优秀

80~89    B 良好

70~79    C 合格

60~69    D 需优化

<60      F 重构
```
