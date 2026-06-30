# M2 临床送检

临床标本送检全链路：申请创建 -> 标本登记 -> 固定核对 -> 转运交接 -> 标本接收 -> 追踪查询，含部分接收/拒收异常链。

流程：申请创建 -> 标本登记 -> 固定核对 -> 转运交接 -> 标本接收 -> 追踪查询

## 主链路（正常接收）

### 1.申请与登记：进入工作站后展示申请单列表，点击「创建」新建申请。

页面路径：`/workflow/submission-registration`

适用角色：`creator`

预期结果：页面顶部出现「创建」按钮，列表为当前账号可见的申请单。

![申请与登记：进入工作站后展示申请单列表，点击「创建」新建申请。](images/m2-specimen-workflow/submission-list.png)

### 2.创建申请单并进入标本登记：填写申请单号、患者信息、送检科室、送检部位等字段保存后，自动进入「标本登记」对话框。

页面路径：`/workflow/submission-registration`

适用角色：`creator`

预期结果：「标本登记」对话框打开，可录入打印机编号与多行标本。

![创建申请单并进入标本登记：填写申请单号、患者信息、送检科室、送检部位等字段保存后，自动进入「标本登记」对话框。](images/m2-specimen-workflow/specimen-register-form.png)

### 3.提交登记：点击「提交登记」后接口返回登记成功，标签打印批次号生成。

页面路径：`/workflow/submission-registration`

适用角色：`creator`

预期结果：提示「标本登记成功」，列表出现新建申请单。

![提交登记：点击「提交登记」后接口返回登记成功，标签打印批次号生成。](images/m2-specimen-workflow/specimen-register-done.png)

### 4.固定核对：固定列表展示待固定标本，按条码操作「开始固定」。

页面路径：`/workflow/fixation-verify`

适用角色：`fixation`

预期结果：固定列表出现刚登记的标本条码。

![固定核对：固定列表展示待固定标本，按条码操作「开始固定」。](images/m2-specimen-workflow/fixation-list.png)

### 5.完成固定：开始固定后点击「完成固定」并确认，记录固定液与时间。

页面路径：`/workflow/fixation-verify`

适用角色：`fixation`

预期结果：提示「已完成固定」，标本进入可转运状态。

![完成固定：开始固定后点击「完成固定」并确认，记录固定液与时间。](images/m2-specimen-workflow/fixation-complete-dialog.png)

### 6.创建转运单：选择交接/接收科室并扫码后生成转运单号。

页面路径：`/workflow/fixation-verify`

适用角色：`fixation`

预期结果：提示「转运单创建成功」，转运列表出现新单。

![创建转运单：选择交接/接收科室并扫码后生成转运单号。](images/m2-specimen-workflow/transport-order-created.png)

### 7.标本出库：待处理转运单列表，对转运单「打印」与「交接」。

页面路径：`/workflow/transport-handover`

适用角色：`transport`

预期结果：列表出现刚创建的转运单号。

![标本出库：待处理转运单列表，对转运单「打印」与「交接」。](images/m2-specimen-workflow/transport-list.png)

### 8.转运交接：确认打印后点击「交接」，状态变为已交接。

页面路径：`/workflow/transport-handover`

适用角色：`transport`

预期结果：提示「转运交接成功」，转运单进入待接收。

![转运交接：确认打印后点击「交接」，状态变为已交接。](images/m2-specimen-workflow/transport-handover-done.png)

### 9.标本接收工作站：待接收转运单列表，点击「接收」打开接收对话框。

页面路径：`/workflow/pathology-receipt`

适用角色：`receive`

预期结果：列表出现已交接的转运单。

![标本接收工作站：待接收转运单列表，点击「接收」打开接收对话框。](images/m2-specimen-workflow/receipt-list.png)

### 10.接收结果：提交接收后展示接收结果，生成病例号，未接收数为 0。

页面路径：`/workflow/pathology-receipt`

适用角色：`receive`

预期结果：提示「标本接收成功」，接收结果展示病例号。

![接收结果：提交接收后展示接收结果，生成病例号，未接收数为 0。](images/m2-specimen-workflow/receipt-result.png)

### 11.追踪与异常：申请单列表，输入申请单号查询后点击「详情」。

页面路径：`/workflow/tracking-exception`

适用角色：`tracking`

预期结果：列表可按申请单号检索到本次申请单。

![追踪与异常：申请单列表，输入申请单号查询后点击「详情」。](images/m2-specimen-workflow/tracking-list.png)

### 12.申请单追踪详情：展示当前节点（接收）、时间线事件与标本明细。

页面路径：`/workflow/tracking-exception`

适用角色：`tracking`

预期结果：时间线事件可见，所有标本条码均展示。

![申请单追踪详情：展示当前节点（接收）、时间线事件与标本明细。](images/m2-specimen-workflow/tracking-timeline.png)

## 异常链（部分接收 / 拒收）

### 1.异常接收：对其中一条标本选择拒收并填写原因，提交后结果为部分接收。

页面路径：`/workflow/pathology-receipt`

适用角色：`receive`

预期结果：接收状态为 PARTIALLY_RECEIVED，未接收数为 1。

![异常接收：对其中一条标本选择拒收并填写原因，提交后结果为部分接收。](images/m2-specimen-workflow/abnormal-receipt-result.png)

### 2.异常追踪详情：展示异常明细、拒收标本状态与异常原因。

页面路径：`/workflow/tracking-exception`

适用角色：`tracking`

预期结果：异常标记为真，拒收标本状态为 REJECTED，展示异常原因。

![异常追踪详情：展示异常明细、拒收标本状态与异常原因。](images/m2-specimen-workflow/abnormal-tracking-detail.png)
