<script setup lang="ts">
import type {
  PendingSpecimenItem,
  SpecimenReceiptResult,
} from '../types/specimen-workflow';
import type {
  ReceiptDraftItem,
  TransportReceiptGroup,
} from '../utils/specimen-receipt';

import { computed, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { ElMessage } from 'element-plus';

import {
  directReceiveSpecimens,
  listPendingReceipts,
  receiveSpecimens,
  reprintApplicationForm,
} from '../api/specimen-workflow-service';
import SpecimenReceiptDirectDrawer from '../components/SpecimenReceiptDirectDrawer.vue';
import SpecimenReceiptReceiveDialog from '../components/SpecimenReceiptReceiveDialog.vue';
import SpecimenReceiptResultPanel from '../components/SpecimenReceiptResultPanel.vue';
import SpecimenReceiptWorkbenchPanel from '../components/SpecimenReceiptWorkbenchPanel.vue';
import { DEFAULT_PAGE_SIZE } from '../constants';
import {
  buildApplicationFormReprintRequest,
  buildDirectReceiptSubmissionRequest,
  buildPendingReceiptQuery,
  buildReceiptSubmissionRequest,
  buildTransportReceiptGroups,
  createDefaultReceiptFormState,
  createReceiptDraftItem,
  createReceiptDraftItemsFromGroup,
  validateReceiptItems as validateReceiptItemsHelper,
} from '../utils/specimen-receipt';

const userStore = useUserStore();

const loading = ref(false);
const receiveLoading = ref(false);
const directReceiveLoading = ref(false);
const receiptResult = ref<null | SpecimenReceiptResult>(null);

const pendingItems = ref<PendingSpecimenItem[]>([]);
const total = ref(0);

const filters = reactive({
  applicationId: '',
  dateRange: [] as string[],
  departmentId: '',
  page: 1,
  size: DEFAULT_PAGE_SIZE,
});

const receiveForm = reactive(
  createDefaultReceiptFormState(
    userStore.userInfo?.realName ?? '',
    userStore.userInfo?.userId ?? '',
  ),
);

const selectedTransportOrderId = ref('');
const receiptDraftItems = ref<ReceiptDraftItem[]>([]);
const receiptDialogVisible = ref(false);

const directDrawerVisible = ref(false);
const directForm = reactive(
  createDefaultReceiptFormState(
    userStore.userInfo?.realName ?? '',
    userStore.userInfo?.userId ?? '',
  ),
);
const directDraftItems = ref<ReceiptDraftItem[]>([createReceiptDraftItem()]);

const groupedTransportOrders = computed<TransportReceiptGroup[]>(() =>
  buildTransportReceiptGroups(pendingItems.value),
);

const selectedGroup = computed(
  () =>
    groupedTransportOrders.value.find(
      (item) => item.transportOrderId === selectedTransportOrderId.value,
    ) ?? null,
);

const orphanPendingCount = computed(
  () => pendingItems.value.filter((item) => !item.transportOrderId).length,
);
const abnormalBatchCount = computed(
  () =>
    groupedTransportOrders.value.filter((item) => item.batchAbnormalFlag)
      .length,
);
const totalReminderCount = computed(() =>
  groupedTransportOrders.value.reduce(
    (sum, item) => sum + (item.reminderCount ?? 0),
    0,
  ),
);

async function loadPendingData() {
  loading.value = true;
  try {
    const result = await listPendingReceipts(buildPendingReceiptQuery(filters));
    pendingItems.value = result.items;
    total.value = result.total;

    if (
      selectedTransportOrderId.value &&
      !result.items.some(
        (item) => item.transportOrderId === selectedTransportOrderId.value,
      )
    ) {
      closeReceiptDialog();
    }
  } catch (error) {
    void error;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  filters.page = 1;
  void loadPendingData();
}

function handleReset() {
  filters.applicationId = '';
  filters.dateRange = [];
  filters.departmentId = '';
  filters.page = 1;
  filters.size = DEFAULT_PAGE_SIZE;
  void loadPendingData();
}

function prepareReceipt(group: TransportReceiptGroup) {
  selectedTransportOrderId.value = group.transportOrderId;
  receiptDraftItems.value = createReceiptDraftItemsFromGroup(group);
  receiptDialogVisible.value = true;
}

async function handleReprintApplicationForm(group: TransportReceiptGroup) {
  const operatorName = userStore.userInfo?.realName ?? '';
  const operatorUserId = userStore.userInfo?.userId ?? '';
  if (!operatorName.trim()) {
    ElMessage.warning('缺少当前操作人信息');
    return;
  }
  const request = buildApplicationFormReprintRequest(
    operatorName,
    operatorUserId,
    receiveForm.terminalCode,
    group.transportOrderId,
  );

  try {
    await reprintApplicationForm(group.applicationId, request);
    ElMessage.success(`申请单 ${group.applicationNo} 补打印成功`);
  } catch (error) {
    console.error('[SpecimenReceiptView] Failed to reprint application form', {
      applicationId: group.applicationId,
      applicationNo: group.applicationNo,
      error,
      transportOrderId: group.transportOrderId,
    });
    ElMessage.warning('申请单补打印失败，请稍后重试');
  }
}

function closeReceiptDialog() {
  receiptDialogVisible.value = false;
  selectedTransportOrderId.value = '';
  receiptDraftItems.value = [];
}

async function submitReceipt() {
  if (!selectedGroup.value) {
    ElMessage.warning('请先选择待接收转运单');
    return;
  }
  if (!receiveForm.receivedByName.trim()) {
    ElMessage.warning('请选择接收人');
    return;
  }
  const validationMessage = validateReceiptItemsHelper(receiptDraftItems.value);
  if (validationMessage) {
    ElMessage.warning(validationMessage);
    return;
  }

  receiveLoading.value = true;
  try {
    receiptResult.value = await receiveSpecimens(
      buildReceiptSubmissionRequest(
        selectedGroup.value.transportOrderId,
        receiveForm,
        receiptDraftItems.value,
      ),
    );
    ElMessage.success('标本接收成功');
    closeReceiptDialog();
    await loadPendingData();
  } catch (error) {
    void error;
  } finally {
    receiveLoading.value = false;
  }
}

function addDirectReceiptRow() {
  directDraftItems.value.push(createReceiptDraftItem());
}

function removeDirectReceiptRow(key: number) {
  if (directDraftItems.value.length === 1) {
    ElMessage.warning('至少保留一行直接接收项');
    return;
  }
  directDraftItems.value = directDraftItems.value.filter(
    (item) => item.key !== key,
  );
}

async function submitDirectReceipt() {
  if (!directForm.receivedByName.trim()) {
    ElMessage.warning('请选择接收人');
    return;
  }
  const validationMessage = validateReceiptItemsHelper(directDraftItems.value);
  if (validationMessage) {
    ElMessage.warning(validationMessage);
    return;
  }

  directReceiveLoading.value = true;
  try {
    receiptResult.value = await directReceiveSpecimens(
      buildDirectReceiptSubmissionRequest(directForm, directDraftItems.value),
    );
    ElMessage.success('条码直收成功');
    directDrawerVisible.value = false;
    directDraftItems.value = [createReceiptDraftItem()];
    await loadPendingData();
  } catch (error) {
    void error;
  } finally {
    directReceiveLoading.value = false;
  }
}

function handleDepartmentChange(
  department: null | { id: string; name: string },
) {
  filters.departmentId = department?.id ?? '';
}

function handleReceiveUserChange(user: null | { id: string; name: string }) {
  receiveForm.receivedByUserId = user?.id ?? '';
  receiveForm.receivedByName = user?.name ?? '';
}

function handleDirectReceiveUserChange(
  user: null | { id: string; name: string },
) {
  directForm.receivedByUserId = user?.id ?? '';
  directForm.receivedByName = user?.name ?? '';
}

void loadPendingData();
</script>

<template>
  <Page title="病理接收">
    <div class="flex flex-col gap-4">
      <SpecimenReceiptWorkbenchPanel
        v-model:filters="filters"
        :abnormal-batch-count="abnormalBatchCount"
        :groups="groupedTransportOrders"
        :loading="loading"
        :orphan-pending-count="orphanPendingCount"
        :total="total"
        :total-reminder-count="totalReminderCount"
        @department-change="handleDepartmentChange"
        @open-direct-receive="directDrawerVisible = true"
        @page-change="
          (page) => {
            filters.page = page;
            void loadPendingData();
          }
        "
        @prepare="prepareReceipt"
        @reprint="handleReprintApplicationForm"
        @reset="handleReset"
        @search="handleSearch"
        @size-change="
          (size) => {
            filters.size = size;
            filters.page = 1;
            void loadPendingData();
          }
        "
      />

      <SpecimenReceiptResultPanel
        v-if="receiptResult"
        :result="receiptResult"
      />
    </div>

    <SpecimenReceiptReceiveDialog
      v-model="receiptDialogVisible"
      v-model:form="receiveForm"
      :items="receiptDraftItems"
      :selected-group="selectedGroup"
      :submitting="receiveLoading"
      @close="closeReceiptDialog"
      @receive-user-change="handleReceiveUserChange"
      @submit="submitReceipt"
    />

    <SpecimenReceiptDirectDrawer
      v-model="directDrawerVisible"
      v-model:form="directForm"
      :items="directDraftItems"
      :submitting="directReceiveLoading"
      @add-row="addDirectReceiptRow"
      @close="directDrawerVisible = false"
      @direct-receive-user-change="handleDirectReceiveUserChange"
      @remove-row="removeDirectReceiptRow"
      @submit="submitDirectReceipt"
    />
  </Page>
</template>
