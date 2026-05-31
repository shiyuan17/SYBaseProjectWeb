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
  ElTag,
} from 'element-plus';

import DepartmentSelect from '#/modules/system-management/components/DepartmentSelect.vue';
import SystemUserSelect from '#/modules/system-management/components/SystemUserSelect.vue';

import {
  handoverTransportOrder,
  listPendingTransportOrders,
  printTransportOrder,
} from '../api/specimen-workflow-service';
import TransportHandoverOrderTable from '../components/TransportHandoverOrderTable.vue';
import TransportOrderCreateDialog from '../components/TransportOrderCreateDialog.vue';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { DEFAULT_PAGE_SIZE, TRANSPORT_STATUS_OPTIONS } from '../constants';
import {
  formatDateTime,
  formatNullable,
  formatTransportStatus,
} from '../utils/format';
import {
  buildPendingTransportOrderQuery,
  buildPrintTransportOrderRequest,
  buildTransportOrderHandoverRequest,
  createDefaultTransportHandoverFormState,
  createDefaultTransportPrintFormState,
  normalizeRouteQueryValue,
  resolveTargetTransportOrders,
} from '../utils/transport-handover';

withDefaults(
  defineProps<{
    embedded?: boolean;
  }>(),
  {
    embedded: false,
  },
);
const userStore = useUserStore();
const route = useRoute();

const loading = ref(false);
const printLoading = ref(false);
const handoverLoading = ref(false);
const createDialogVisible = ref(false);
const selectedRowKeys = ref<string[]>([]);
const selectedRows = computed(() =>
  orders.value.filter((item) => selectedRowKeys.value.includes(item.id)),
);

const orders = ref<PendingTransportOrderItem[]>([]);
const total = ref(0);
const latestOrder = ref<null | TransportOrderView>(null);
const activeOrder = ref<null | PendingTransportOrderItem>(null);

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
const createDialogApplicationNo = computed(() =>
  routeApplicationNo.value.trim(),
);

const printDialogVisible = ref(false);
const printForm = reactive(
  createDefaultTransportPrintFormState(
    userStore.userInfo?.realName ?? '',
    userStore.userInfo?.userId ?? '',
  ),
);

const handoverDialogVisible = ref(false);
const handoverForm = reactive(
  createDefaultTransportHandoverFormState(
    userStore.userInfo?.realName ?? '',
    userStore.userInfo?.userId ?? '',
  ),
);

const printDialogTitle = computed(() => {
  if (selectedRows.value.length > 1) {
    return `批量打印转运单（${selectedRows.value.length} 条）`;
  }
  return activeOrder.value
    ? `打印转运单 ${activeOrder.value.transportOrderNo}`
    : '打印转运单';
});

const handoverDialogTitle = computed(() => {
  if (selectedRows.value.length > 1) {
    return `批量交接转运单（${selectedRows.value.length} 条）`;
  }
  return activeOrder.value
    ? `交接转运单 ${activeOrder.value.transportOrderNo}`
    : '交接转运单';
});

async function loadOrders() {
  loading.value = true;
  try {
    const result = await listPendingTransportOrders(
      buildPendingTransportOrderQuery(filters),
    );
    orders.value = result.items;
    total.value = result.total;
  } catch (error) {
    void error;
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
  selectedRowKeys.value = [];
  latestOrder.value = null;
  void loadOrders();
}

function openCreateDialog() {
  createDialogVisible.value = true;
}

function openPrintDialog(order: PendingTransportOrderItem) {
  activeOrder.value = order;
  Object.assign(
    printForm,
    createDefaultTransportPrintFormState(
      userStore.userInfo?.realName ?? '',
      userStore.userInfo?.userId ?? '',
    ),
  );
  printDialogVisible.value = true;
}

function openHandoverDialog(order: PendingTransportOrderItem) {
  activeOrder.value = order;
  Object.assign(
    handoverForm,
    createDefaultTransportHandoverFormState(
      userStore.userInfo?.realName ?? '',
      userStore.userInfo?.userId ?? '',
    ),
  );
  handoverDialogVisible.value = true;
}

function openSelectedPrintDialog() {
  const [order] = selectedRows.value;
  if (order) {
    openPrintDialog(order);
  }
}

function openSelectedHandoverDialog() {
  const [order] = selectedRows.value;
  if (order) {
    openHandoverDialog(order);
  }
}

async function submitPrint() {
  const targets = resolveTargetTransportOrders(
    selectedRows.value,
    activeOrder.value,
  );
  if (targets.length === 0) {
    return;
  }
  if (!printForm.operatorName.trim()) {
    ElMessage.warning('请选择打印操作人');
    return;
  }

  printLoading.value = true;
  try {
    for (const order of targets) {
      latestOrder.value = await printTransportOrder(
        order.id,
        buildPrintTransportOrderRequest(printForm),
      );
    }
    printDialogVisible.value = false;
    selectedRowKeys.value = [];
    ElMessage.success('转运单打印成功');
    await loadOrders();
  } catch (error) {
    void error;
  } finally {
    printLoading.value = false;
  }
}

async function submitHandover() {
  const targets = resolveTargetTransportOrders(
    selectedRows.value,
    activeOrder.value,
  );
  if (targets.length === 0) {
    return;
  }
  if (!handoverForm.receiverUserName.trim()) {
    ElMessage.warning('请选择接收人');
    return;
  }

  handoverLoading.value = true;
  try {
    for (const order of targets) {
      latestOrder.value = await handoverTransportOrder(
        order.id,
        buildTransportOrderHandoverRequest(handoverForm),
      );
    }
    handoverDialogVisible.value = false;
    selectedRowKeys.value = [];
    ElMessage.success('转运交接成功');
    await loadOrders();
  } catch (error) {
    void error;
  } finally {
    handoverLoading.value = false;
  }
}

function handleTransportOrderCreated() {
  void loadOrders();
}

function handleFilterDepartmentChange(
  department: null | { id: string; name: string },
) {
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

function handleSelectionChange(rows: PendingTransportOrderItem[]) {
  selectedRowKeys.value = rows.map((item) => item.id);
}

watch(
  () => [route.query.applicationId, route.query.applicationNo],
  ([applicationIdValue, applicationNoValue]) => {
    filters.applicationId = normalizeRouteQueryValue(applicationIdValue).trim();
    routeApplicationNo.value =
      normalizeRouteQueryValue(applicationNoValue).trim();
    filters.page = 1;
    void loadOrders();
  },
  { immediate: true },
);
</script>

<template>
  <Page :title="embedded ? '' : '固定与转运'">
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
            <ElTag
              :type="
                latestOrder.status === 'HANDED_OVER' ? 'success' : 'warning'
              "
            >
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

      <WorkflowSectionCard title="转运/出库">
        <div class="flex flex-col gap-3">
          <div class="flex flex-wrap items-center gap-4 text-sm">
            <div class="font-semibold text-[color:#d6453d]">转运/出库</div>
            <div>
              全部
              <span class="text-xl font-semibold text-primary">{{
                total
              }}</span>
            </div>
            <div>
              已选
              <span class="text-xl font-semibold text-success">{{
                selectedRows.length
              }}</span>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <ElInput
              v-model="filters.applicationId"
              clearable
              placeholder="请输入申请单号"
              style="width: 220px"
              @keyup.enter="handleSearch"
            />
            <ElInput
              v-model="filters.specimenNo"
              clearable
              placeholder="请输入标本流水号"
              style="width: 220px"
              @keyup.enter="handleSearch"
            />
            <div class="w-[180px]">
              <DepartmentSelect
                v-model="filters.departmentId"
                placeholder="送检科室"
                @change="handleFilterDepartmentChange"
              />
            </div>
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
            <ElDatePicker
              v-model="filters.dateRange"
              end-placeholder="结束日期"
              range-separator="至"
              start-placeholder="开始日期"
              style="width: 320px"
              type="daterange"
              value-format="YYYY-MM-DD"
            />
            <ElButton type="primary" @click="handleSearch">查询</ElButton>
            <ElButton @click="handleReset">重置</ElButton>
            <ElButton type="primary" @click="openCreateDialog">
              创建转运单
            </ElButton>
            <ElButton
              :disabled="selectedRows.length === 0"
              @click="openSelectedPrintDialog"
            >
              批量打印
            </ElButton>
            <ElButton
              :disabled="selectedRows.length === 0"
              type="success"
              @click="openSelectedHandoverDialog"
            >
              批量交接
            </ElButton>
          </div>

          <TransportHandoverOrderTable
            :loading="loading"
            :orders="orders"
            @handover="openHandoverDialog"
            @print="openPrintDialog"
            @selection-change="handleSelectionChange"
          />

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
      :title="printDialogTitle"
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
          <ElInput
            v-model="printForm.terminalCode"
            placeholder="请输入终端编码"
          />
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
      :title="handoverDialogTitle"
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
          <ElInput
            v-model="handoverForm.terminalCode"
            placeholder="请输入终端编码"
          />
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
        <ElButton
          :loading="handoverLoading"
          type="primary"
          @click="submitHandover"
        >
          确认交接
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
