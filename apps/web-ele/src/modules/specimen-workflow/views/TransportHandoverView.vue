<script setup lang="ts">
import type {
  PendingTransportOrderItem,
  TransportOrderView,
} from '../types/specimen-workflow';

import { reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElDatePicker,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElPagination,
  ElSelect,
  ElOption,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  createTransportOrder,
  handoverTransportOrder,
  listPendingTransportOrders,
  printTransportOrder,
} from '../api/specimen-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { DEFAULT_PAGE_SIZE, TRANSPORT_STATUS_OPTIONS } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import { formatDateTime, formatNullable } from '../utils/format';

const userStore = useUserStore();

const pageError = ref('');
const loading = ref(false);
const createLoading = ref(false);
const printLoading = ref(false);
const handoverLoading = ref(false);

const orders = ref<PendingTransportOrderItem[]>([]);
const total = ref(0);
const latestOrder = ref<null | TransportOrderView>(null);
const activeOrder = ref<PendingTransportOrderItem | null>(null);

const filters = reactive({
  applicationId: '',
  dateRange: [] as string[],
  departmentId: '',
  page: 1,
  size: DEFAULT_PAGE_SIZE,
  status: '',
});

const createForm = reactive({
  applicationId: '',
  handoverDepartmentId: '',
  handoverDepartmentName: '',
  handoverUserId: userStore.userInfo?.userId ?? '',
  handoverUserName: userStore.userInfo?.realName ?? '',
  receiverDepartmentId: '',
  receiverDepartmentName: '',
  remarks: '',
  specimenBarcodesText: '',
  terminalCode: '',
});

const printDialogVisible = ref(false);
const printForm = reactive({
  operatorName: userStore.userInfo?.realName ?? '',
  operatorUserId: userStore.userInfo?.userId ?? '',
  terminalCode: '',
});

const handoverDialogVisible = ref(false);
const handoverForm = reactive({
  receiverUserId: userStore.userInfo?.userId ?? '',
  receiverUserName: userStore.userInfo?.realName ?? '',
  remarks: '',
  terminalCode: '',
});

function splitSpecimenBarcodes(value: string) {
  return [...new Set(value.split(/[\s,，;；]+/).map((item) => item.trim()).filter(Boolean))];
}

async function loadOrders() {
  loading.value = true;
  pageError.value = '';
  try {
    const result = await listPendingTransportOrders({
      applicationId: filters.applicationId.trim() || undefined,
      dateFrom: filters.dateRange[0] || undefined,
      dateTo: filters.dateRange[1] || undefined,
      departmentId: filters.departmentId.trim() || undefined,
      page: filters.page,
      size: filters.size,
      status: filters.status || undefined,
    });
    orders.value = result.items;
    total.value = result.total;
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  filters.page = 1;
  void loadOrders();
}

function handleReset() {
  filters.applicationId = '';
  filters.dateRange = [];
  filters.departmentId = '';
  filters.page = 1;
  filters.size = DEFAULT_PAGE_SIZE;
  filters.status = '';
  void loadOrders();
}

function resetCreateForm() {
  Object.assign(createForm, {
    applicationId: '',
    handoverDepartmentId: '',
    handoverDepartmentName: '',
    handoverUserId: userStore.userInfo?.userId ?? '',
    handoverUserName: userStore.userInfo?.realName ?? '',
    receiverDepartmentId: '',
    receiverDepartmentName: '',
    remarks: '',
    specimenBarcodesText: '',
    terminalCode: '',
  });
}

async function submitCreate() {
  const specimenBarcodes = splitSpecimenBarcodes(createForm.specimenBarcodesText);
  if (!createForm.applicationId.trim()) {
    ElMessage.warning('请填写申请单 ID');
    return;
  }
  if (!createForm.handoverDepartmentName.trim()) {
    ElMessage.warning('请填写交接科室名称');
    return;
  }
  if (!createForm.handoverUserName.trim()) {
    ElMessage.warning('请填写交接人');
    return;
  }
  if (!createForm.receiverDepartmentName.trim()) {
    ElMessage.warning('请填写接收科室名称');
    return;
  }
  if (specimenBarcodes.length === 0) {
    ElMessage.warning('请至少填写一个标本条码');
    return;
  }

  createLoading.value = true;
  pageError.value = '';
  try {
    latestOrder.value = await createTransportOrder({
      applicationId: createForm.applicationId.trim(),
      handoverDepartmentId: createForm.handoverDepartmentId.trim() || null,
      handoverDepartmentName: createForm.handoverDepartmentName.trim(),
      handoverUserId: createForm.handoverUserId.trim() || null,
      handoverUserName: createForm.handoverUserName.trim(),
      receiverDepartmentId: createForm.receiverDepartmentId.trim() || null,
      receiverDepartmentName: createForm.receiverDepartmentName.trim(),
      remarks: createForm.remarks.trim() || null,
      specimenBarcodes,
      terminalCode: createForm.terminalCode.trim() || null,
    });
    ElMessage.success('转运单创建成功');
    filters.applicationId = createForm.applicationId.trim();
    resetCreateForm();
    await loadOrders();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    createLoading.value = false;
  }
}

function openPrintDialog(order: PendingTransportOrderItem) {
  activeOrder.value = order;
  printForm.operatorName = userStore.userInfo?.realName ?? '';
  printForm.operatorUserId = userStore.userInfo?.userId ?? '';
  printForm.terminalCode = '';
  printDialogVisible.value = true;
}

function openHandoverDialog(order: PendingTransportOrderItem) {
  activeOrder.value = order;
  handoverForm.receiverUserId = userStore.userInfo?.userId ?? '';
  handoverForm.receiverUserName = userStore.userInfo?.realName ?? '';
  handoverForm.remarks = '';
  handoverForm.terminalCode = '';
  handoverDialogVisible.value = true;
}

async function submitPrint() {
  if (!activeOrder.value) {
    return;
  }
  if (!printForm.operatorName.trim()) {
    ElMessage.warning('请填写打印操作人');
    return;
  }

  printLoading.value = true;
  pageError.value = '';
  try {
    latestOrder.value = await printTransportOrder(activeOrder.value.id, {
      operatorName: printForm.operatorName.trim(),
      operatorUserId: printForm.operatorUserId.trim() || null,
      terminalCode: printForm.terminalCode.trim() || null,
    });
    printDialogVisible.value = false;
    ElMessage.success('转运单打印成功');
    await loadOrders();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    printLoading.value = false;
  }
}

async function submitHandover() {
  if (!activeOrder.value) {
    return;
  }
  if (!handoverForm.receiverUserName.trim()) {
    ElMessage.warning('请填写接收人');
    return;
  }

  handoverLoading.value = true;
  pageError.value = '';
  try {
    latestOrder.value = await handoverTransportOrder(activeOrder.value.id, {
      receiverUserId: handoverForm.receiverUserId.trim() || null,
      receiverUserName: handoverForm.receiverUserName.trim(),
      remarks: handoverForm.remarks.trim() || null,
      terminalCode: handoverForm.terminalCode.trim() || null,
    });
    handoverDialogVisible.value = false;
    ElMessage.success('转运交接成功');
    await loadOrders();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    handoverLoading.value = false;
  }
}

function canHandover(order: PendingTransportOrderItem) {
  return ['PENDING', 'PRINTED'].includes(order.status);
}

void loadOrders();
</script>

<template>
  <Page
    title="转运交接"
    description="创建转运单、打印交接凭据并完成交接，工作台列表对接新增的转运单分页查询接口。"
  >
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
        show-icon
      />

      <WorkflowSectionCard
        title="创建转运单"
        description="支持按申请单创建转运单，并提交交接科室、接收科室与标本条码清单。"
      >
        <ElForm label-width="108px">
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ElFormItem label="申请单 ID" required>
              <ElInput v-model="createForm.applicationId" placeholder="请输入 applicationId" />
            </ElFormItem>
            <ElFormItem label="交接科室 ID">
              <ElInput
                v-model="createForm.handoverDepartmentId"
                placeholder="请输入交接科室 ID"
              />
            </ElFormItem>
            <ElFormItem label="交接科室名称" required>
              <ElInput
                v-model="createForm.handoverDepartmentName"
                placeholder="请输入交接科室名称"
              />
            </ElFormItem>
            <ElFormItem label="交接人 ID">
              <ElInput v-model="createForm.handoverUserId" placeholder="请输入交接人用户 ID" />
            </ElFormItem>
            <ElFormItem label="交接人" required>
              <ElInput v-model="createForm.handoverUserName" placeholder="请输入交接人姓名" />
            </ElFormItem>
            <ElFormItem label="接收科室 ID">
              <ElInput
                v-model="createForm.receiverDepartmentId"
                placeholder="请输入接收科室 ID"
              />
            </ElFormItem>
            <ElFormItem label="接收科室名称" required>
              <ElInput
                v-model="createForm.receiverDepartmentName"
                placeholder="请输入接收科室名称"
              />
            </ElFormItem>
            <ElFormItem label="终端编码">
              <ElInput v-model="createForm.terminalCode" placeholder="工作站终端编码" />
            </ElFormItem>
          </div>
          <ElFormItem label="标本条码" required>
            <ElInput
              v-model="createForm.specimenBarcodesText"
              :rows="4"
              placeholder="支持换行、空格、逗号分隔多个条码"
              type="textarea"
            />
          </ElFormItem>
          <ElFormItem label="备注">
            <ElInput
              v-model="createForm.remarks"
              :rows="2"
              placeholder="补充转运说明"
              type="textarea"
            />
          </ElFormItem>
          <div class="flex justify-end gap-2">
            <ElButton @click="resetCreateForm">重置</ElButton>
            <ElButton :loading="createLoading" type="primary" @click="submitCreate">
              创建转运单
            </ElButton>
          </div>
        </ElForm>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        v-if="latestOrder"
        title="最近操作结果"
        description="展示最近一次创建、打印或交接后返回的转运单摘要。"
      >
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="转运单号">
            {{ latestOrder.transportOrderNo }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="状态">
            <ElTag :type="latestOrder.status === 'HANDED_OVER' ? 'success' : 'warning'">
              {{ latestOrder.status }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="申请单 ID">
            {{ latestOrder.applicationId }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="交接人">
            {{ formatNullable(latestOrder.handoverUserName) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="接收人">
            {{ formatNullable(latestOrder.receiverUserName) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="待转运时间">
            {{ formatDateTime(latestOrder.toBeTransportedAt) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="交接完成时间">
            {{ formatDateTime(latestOrder.handedOverAt) }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        title="待处理转运单"
        description="工作台列表固定使用申请单、送检科室、日期范围、状态与分页参数。"
      >
        <ElForm inline label-width="88px">
          <ElFormItem label="申请单 ID">
            <ElInput
              v-model="filters.applicationId"
              clearable
              placeholder="请输入 applicationId"
              style="width: 220px"
              @keyup.enter="handleSearch"
            />
          </ElFormItem>
          <ElFormItem label="送检科室 ID">
            <ElInput
              v-model="filters.departmentId"
              clearable
              placeholder="请输入 departmentId"
              style="width: 220px"
              @keyup.enter="handleSearch"
            />
          </ElFormItem>
          <ElFormItem label="转运状态">
            <ElSelect
              v-model="filters.status"
              clearable
              placeholder="全部状态"
              style="width: 180px"
            >
              <ElOption
                v-for="option in TRANSPORT_STATUS_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="待转运日期">
            <ElDatePicker
              v-model="filters.dateRange"
              end-placeholder="结束日期"
              range-separator="至"
              start-placeholder="开始日期"
              type="daterange"
              value-format="YYYY-MM-DD"
            />
          </ElFormItem>
          <ElFormItem>
            <ElButton type="primary" @click="handleSearch">查询</ElButton>
            <ElButton @click="handleReset">重置</ElButton>
          </ElFormItem>
        </ElForm>

        <ElTable v-loading="loading" :data="orders" border>
          <ElTableColumn label="转运单号" min-width="160" prop="transportOrderNo" />
          <ElTableColumn label="申请单号" min-width="150" prop="applicationNo" />
          <ElTableColumn label="患者姓名" min-width="120">
            <template #default="{ row }">
              {{ formatNullable(row.patientName) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="交接科室" min-width="160">
            <template #default="{ row }">
              {{ formatNullable(row.handoverDepartmentName) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="接收科室" min-width="160">
            <template #default="{ row }">
              {{ formatNullable(row.receiverDepartmentName) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="状态" min-width="120">
            <template #default="{ row }">
              <ElTag :type="row.status === 'HANDED_OVER' ? 'success' : 'warning'">
                {{ row.status }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="待转运时间" min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.toBeTransportedAt) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="交接时间" min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.handedOverAt) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="标本条码" min-width="220">
            <template #default="{ row }">
              <div class="flex flex-wrap gap-1">
                <ElTag
                  v-for="barcode in row.specimenBarcodes"
                  :key="barcode"
                  effect="plain"
                  type="info"
                >
                  {{ barcode }}
                </ElTag>
              </div>
            </template>
          </ElTableColumn>
          <ElTableColumn fixed="right" label="操作" min-width="180">
            <template #default="{ row }">
              <div class="flex flex-wrap gap-2">
                <ElButton link type="primary" @click="openPrintDialog(row)">打印</ElButton>
                <ElButton
                  :disabled="!canHandover(row)"
                  link
                  type="success"
                  @click="openHandoverDialog(row)"
                >
                  交接
                </ElButton>
              </div>
            </template>
          </ElTableColumn>
        </ElTable>

        <div class="mt-4 flex justify-end">
          <ElPagination
            v-model:current-page="filters.page"
            v-model:page-size="filters.size"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            background
            layout="total, sizes, prev, pager, next"
            @current-change="loadOrders"
            @size-change="loadOrders"
          />
        </div>
      </WorkflowSectionCard>
    </div>

    <ElDialog
      v-model="printDialogVisible"
      :title="activeOrder ? `打印转运单 ${activeOrder.transportOrderNo}` : '打印转运单'"
      width="520px"
    >
      <ElForm label-width="96px">
        <ElFormItem label="操作人" required>
          <ElInput v-model="printForm.operatorName" placeholder="请输入打印操作人" />
        </ElFormItem>
        <ElFormItem label="操作人 ID">
          <ElInput v-model="printForm.operatorUserId" placeholder="请输入操作人用户 ID" />
        </ElFormItem>
        <ElFormItem label="终端编码">
          <ElInput v-model="printForm.terminalCode" placeholder="请输入终端编码" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="printDialogVisible = false">取消</ElButton>
        <ElButton :loading="printLoading" type="primary" @click="submitPrint">
          确认打印
        </ElButton>
      </template>
    </ElDialog>

    <ElDialog
      v-model="handoverDialogVisible"
      :title="activeOrder ? `交接转运单 ${activeOrder.transportOrderNo}` : '交接转运单'"
      width="520px"
    >
      <ElForm label-width="96px">
        <ElFormItem label="接收人" required>
          <ElInput v-model="handoverForm.receiverUserName" placeholder="请输入接收人姓名" />
        </ElFormItem>
        <ElFormItem label="接收人 ID">
          <ElInput v-model="handoverForm.receiverUserId" placeholder="请输入接收人用户 ID" />
        </ElFormItem>
        <ElFormItem label="终端编码">
          <ElInput v-model="handoverForm.terminalCode" placeholder="请输入终端编码" />
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput
            v-model="handoverForm.remarks"
            :rows="2"
            placeholder="补充交接说明"
            type="textarea"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="handoverDialogVisible = false">取消</ElButton>
        <ElButton :loading="handoverLoading" type="primary" @click="submitHandover">
          确认交接
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
