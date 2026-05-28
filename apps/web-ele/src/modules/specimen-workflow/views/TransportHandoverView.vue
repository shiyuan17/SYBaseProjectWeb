<script setup lang="ts">
import type {
  PendingTransportOrderItem,
  TransportOrderView,
} from '../types/specimen-workflow';

import { computed, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  ElButton,
  ElDatePicker,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElPagination,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import DepartmentSelect from '#/modules/system-management/components/DepartmentSelect.vue';
import SystemUserSelect from '#/modules/system-management/components/SystemUserSelect.vue';

import {
  handoverTransportOrder,
  listPendingTransportOrders,
  printTransportOrder,
} from '../api/specimen-workflow-service';
import TransportOrderCreateDialog from '../components/TransportOrderCreateDialog.vue';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { DEFAULT_PAGE_SIZE, TRANSPORT_STATUS_OPTIONS } from '../constants';
import { formatDateTime, formatNullable, formatTransportStatus } from '../utils/format';

const userStore = useUserStore();
const route = useRoute();

withDefaults(
  defineProps<{
    embedded?: boolean;
  }>(),
  {
    embedded: false,
  },
);

const loading = ref(false);
const printLoading = ref(false);
const handoverLoading = ref(false);
const createDialogVisible = ref(false);

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
  specimenNo: '',
  status: '',
});

const routeApplicationNo = ref('');

const createDialogApplicationId = computed(() => filters.applicationId.trim());
const createDialogApplicationNo = computed(() => routeApplicationNo.value.trim());

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

function normalizeRouteQueryValue(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : '';
  }
  return '';
}

async function loadOrders() {
  loading.value = true;
  try {
    const result = await listPendingTransportOrders({
      applicationId: filters.applicationId.trim() || undefined,
      dateFrom: filters.dateRange[0] || undefined,
      dateTo: filters.dateRange[1] || undefined,
      departmentId: filters.departmentId.trim() || undefined,
      page: filters.page,
      size: filters.size,
      specimenNo: filters.specimenNo.trim() || undefined,
      status: filters.status || undefined,
    });
    orders.value = result.items;
    total.value = result.total;
  } catch {
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
  filters.specimenNo = '';
  filters.status = '';
  routeApplicationNo.value = '';
  void loadOrders();
}

function openCreateDialog() {
  createDialogVisible.value = true;
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
    ElMessage.warning('请选择打印操作人');
    return;
  }

  printLoading.value = true;
  try {
    latestOrder.value = await printTransportOrder(activeOrder.value.id, {
      operatorName: printForm.operatorName.trim(),
      operatorUserId: printForm.operatorUserId.trim() || null,
      terminalCode: printForm.terminalCode.trim() || null,
    });
    printDialogVisible.value = false;
    ElMessage.success('转运单打印成功');
    await loadOrders();
  } catch {
  } finally {
    printLoading.value = false;
  }
}

async function submitHandover() {
  if (!activeOrder.value) {
    return;
  }
  if (!handoverForm.receiverUserName.trim()) {
    ElMessage.warning('请选择接收人');
    return;
  }

  handoverLoading.value = true;
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
  } catch {
  } finally {
    handoverLoading.value = false;
  }
}

function handleTransportOrderCreated() {
  void loadOrders();
}

function canHandover(order: PendingTransportOrderItem) {
  return ['PENDING', 'PRINTED'].includes(order.status);
}

function handleFilterDepartmentChange(department: null | { id: string; name: string }) {
  filters.departmentId = department?.id ?? '';
}

function handlePrintUserChange(user: null | { id: string; name: string }) {
  printForm.operatorUserId = user?.id ?? '';
  printForm.operatorName = user?.name ?? '';
}

function handleReceiverUserChange(user: null | { id: string; name: string }) {
  handoverForm.receiverUserId = user?.id ?? '';
  handoverForm.receiverUserName = user?.name ?? '';
}

watch(
  () => [route.query.applicationId, route.query.applicationNo],
  ([applicationIdValue, applicationNoValue]) => {
    filters.applicationId = normalizeRouteQueryValue(applicationIdValue).trim();
    routeApplicationNo.value = normalizeRouteQueryValue(applicationNoValue).trim();
    filters.page = 1;
    void loadOrders();
  },
  { immediate: true },
);
</script>

<template>
  <Page :title="embedded ? '转运/出库' : '固定与转运'">
    <div class="flex flex-col gap-4">
      <WorkflowSectionCard
        v-if="latestOrder"
        title="最近操作结果"
        description="展示最近一次打印或交接后的转运单摘要。"
      >
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="转运单号">
            {{ latestOrder.transportOrderNo }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="状态">
            <ElTag :type="latestOrder.status === 'HANDED_OVER' ? 'success' : 'warning'">
              {{ formatTransportStatus(latestOrder.status) }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="申请单编号">
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
        title="转运/出库"
        description="统一承接创建转运单、打印转运单和交接动作。"
      >
        <template #extra>
          <ElButton type="primary" @click="openCreateDialog">创建转运单</ElButton>
        </template>

        <ElForm inline label-width="88px">
          <ElFormItem label="申请单号">
            <ElInput
              v-model="filters.applicationId"
              clearable
              placeholder="请输入申请单号"
              style="width: 220px"
              @keyup.enter="handleSearch"
            />
          </ElFormItem>
          <ElFormItem label="标本流水号">
            <ElInput
              v-model="filters.specimenNo"
              clearable
              placeholder="请输入标本流水号"
              style="width: 220px"
              @keyup.enter="handleSearch"
            />
          </ElFormItem>
          <ElFormItem label="送检科室">
            <DepartmentSelect
              v-model="filters.departmentId"
              placeholder="请选择送检科室"
              @change="handleFilterDepartmentChange"
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
                {{ formatTransportStatus(row.status) }}
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

    <TransportOrderCreateDialog
      v-model="createDialogVisible"
      :initial-application-id="createDialogApplicationId"
      :initial-application-no="createDialogApplicationNo"
      @created="handleTransportOrderCreated"
    />

    <ElDialog
      v-model="printDialogVisible"
      :title="activeOrder ? `打印转运单 ${activeOrder.transportOrderNo}` : '打印转运单'"
      width="520px"
    >
      <ElForm label-width="96px">
        <ElFormItem label="操作人" required>
          <SystemUserSelect
            v-model="printForm.operatorUserId"
            :selected-label="printForm.operatorName"
            placeholder="请选择打印操作人"
            @change="handlePrintUserChange"
          />
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
          <SystemUserSelect
            v-model="handoverForm.receiverUserId"
            :selected-label="handoverForm.receiverUserName"
            placeholder="请选择接收人"
            @change="handleReceiverUserChange"
          />
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
