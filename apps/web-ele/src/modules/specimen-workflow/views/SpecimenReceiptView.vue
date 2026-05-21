<script setup lang="ts">
import type {
  PendingSpecimenItem,
  SpecimenReceiptItemRequest,
  SpecimenReceiptResult,
} from '../types/specimen-workflow';

import { computed, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElDatePicker,
  ElDescriptions,
  ElDescriptionsItem,
  ElDrawer,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElPagination,
  ElSelect,
  ElOption,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  directReceiveSpecimens,
  listPendingReceipts,
  receiveSpecimens,
} from '../api/specimen-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { DEFAULT_PAGE_SIZE, RECEIPT_STATUS_OPTIONS } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import { formatDateTime, formatNullable } from '../utils/format';

type ReceiptDraftItem = SpecimenReceiptItemRequest & {
  applicationNo?: string;
  key: number;
  patientName?: null | string;
};

type TransportReceiptGroup = {
  applicationId: string;
  applicationNo: string;
  barcodes: string[];
  latestTrackingAt: null | string;
  patientName: null | string;
  transportOrderId: string;
  items: PendingSpecimenItem[];
};

const userStore = useUserStore();

const pageError = ref('');
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

const receiveForm = reactive({
  receivedByName: userStore.userInfo?.realName ?? '',
  receivedByUserId: userStore.userInfo?.userId ?? '',
  terminalCode: '',
});

const selectedTransportOrderId = ref('');
const receiptDraftItems = ref<ReceiptDraftItem[]>([]);

const directDrawerVisible = ref(false);
const directForm = reactive({
  receivedByName: userStore.userInfo?.realName ?? '',
  receivedByUserId: userStore.userInfo?.userId ?? '',
  terminalCode: '',
});
const directDraftItems = ref<ReceiptDraftItem[]>([createReceiptDraftItem()]);

function createReceiptDraftItem(barcode = ''): ReceiptDraftItem {
  return {
    containerCount: 1,
    key: Date.now() + Math.floor(Math.random() * 1000),
    reason: '',
    receiptStatus: 'RECEIVED',
    remarks: '',
    specimenBarcode: barcode,
  };
}

const groupedTransportOrders = computed<TransportReceiptGroup[]>(() => {
  const groupMap = new Map<string, TransportReceiptGroup>();

  for (const item of pendingItems.value) {
    if (!item.transportOrderId) {
      continue;
    }
    const existing = groupMap.get(item.transportOrderId);
    if (existing) {
      existing.items.push(item);
      existing.barcodes.push(item.barcode);
      existing.latestTrackingAt =
        existing.latestTrackingAt && item.latestTrackingAt
          ? existing.latestTrackingAt > item.latestTrackingAt
            ? existing.latestTrackingAt
            : item.latestTrackingAt
          : existing.latestTrackingAt || item.latestTrackingAt;
      continue;
    }

    groupMap.set(item.transportOrderId, {
      applicationId: item.applicationId,
      applicationNo: item.applicationNo,
      barcodes: [item.barcode],
      items: [item],
      latestTrackingAt: item.latestTrackingAt,
      patientName: item.patientName,
      transportOrderId: item.transportOrderId,
    });
  }

  return [...groupMap.values()];
});

const selectedGroup = computed(
  () =>
    groupedTransportOrders.value.find(
      (item) => item.transportOrderId === selectedTransportOrderId.value,
    ) ?? null,
);

const orphanPendingCount = computed(
  () => pendingItems.value.filter((item) => !item.transportOrderId).length,
);

async function loadPendingData() {
  loading.value = true;
  pageError.value = '';
  try {
    const result = await listPendingReceipts({
      applicationId: filters.applicationId.trim() || undefined,
      dateFrom: filters.dateRange[0] || undefined,
      dateTo: filters.dateRange[1] || undefined,
      departmentId: filters.departmentId.trim() || undefined,
      page: filters.page,
      size: filters.size,
    });
    pendingItems.value = result.items;
    total.value = result.total;

    if (
      selectedTransportOrderId.value &&
      !result.items.some((item) => item.transportOrderId === selectedTransportOrderId.value)
    ) {
      selectedTransportOrderId.value = '';
      receiptDraftItems.value = [];
    }
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
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
  receiptDraftItems.value = group.items.map((item) => ({
    applicationNo: item.applicationNo,
    containerCount: 1,
    key: Date.now() + Math.floor(Math.random() * 1000),
    patientName: item.patientName,
    reason: '',
    receiptStatus: 'RECEIVED',
    remarks: '',
    specimenBarcode: item.barcode,
  }));
}

function validateReceiptItems(items: ReceiptDraftItem[]) {
  if (items.length === 0) {
    ElMessage.warning('当前没有可提交的标本明细');
    return false;
  }
  if (items.some((item) => !item.specimenBarcode.trim())) {
    ElMessage.warning('请完整填写标本条码');
    return false;
  }
  if (items.some((item) => !item.receiptStatus.trim())) {
    ElMessage.warning('请为每一条标本选择接收结果');
    return false;
  }
  if (items.some((item) => !item.containerCount || item.containerCount < 1)) {
    ElMessage.warning('容器数量必须大于 0');
    return false;
  }
  if (
    items.some(
      (item) =>
        item.receiptStatus !== 'RECEIVED' &&
        !(item.reason ?? '').trim(),
    )
  ) {
    ElMessage.warning('拒收或退回时请填写原因');
    return false;
  }
  return true;
}

async function submitReceipt() {
  if (!selectedTransportOrderId.value) {
    ElMessage.warning('请先从待接收转运单中选择一条记录');
    return;
  }
  if (!receiveForm.receivedByName.trim()) {
    ElMessage.warning('请填写接收人');
    return;
  }
  if (!validateReceiptItems(receiptDraftItems.value)) {
    return;
  }

  receiveLoading.value = true;
  pageError.value = '';
  try {
    receiptResult.value = await receiveSpecimens({
      items: receiptDraftItems.value.map(normalizeReceiptItem),
      receivedByName: receiveForm.receivedByName.trim(),
      receivedByUserId: receiveForm.receivedByUserId.trim() || null,
      terminalCode: receiveForm.terminalCode.trim() || null,
      transportOrderId: selectedTransportOrderId.value,
    });
    ElMessage.success('标本接收成功');
    selectedTransportOrderId.value = '';
    receiptDraftItems.value = [];
    await loadPendingData();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    receiveLoading.value = false;
  }
}

function addDirectReceiptRow() {
  directDraftItems.value.push(createReceiptDraftItem());
}

function removeDirectReceiptRow(key: number) {
  if (directDraftItems.value.length === 1) {
    ElMessage.warning('至少保留一条直收记录');
    return;
  }
  directDraftItems.value = directDraftItems.value.filter((item) => item.key !== key);
}

async function submitDirectReceipt() {
  if (!directForm.receivedByName.trim()) {
    ElMessage.warning('请填写接收人');
    return;
  }
  if (!validateReceiptItems(directDraftItems.value)) {
    return;
  }

  directReceiveLoading.value = true;
  pageError.value = '';
  try {
    receiptResult.value = await directReceiveSpecimens({
      items: directDraftItems.value.map(normalizeReceiptItem),
      receivedByName: directForm.receivedByName.trim(),
      receivedByUserId: directForm.receivedByUserId.trim() || null,
      terminalCode: directForm.terminalCode.trim() || null,
    });
    ElMessage.success('条码直收成功');
    directDrawerVisible.value = false;
    directDraftItems.value = [createReceiptDraftItem()];
    await loadPendingData();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    directReceiveLoading.value = false;
  }
}

function normalizeReceiptItem(item: ReceiptDraftItem): SpecimenReceiptItemRequest {
  return {
    containerCount: item.containerCount,
    reason: item.reason?.trim() || null,
    receiptStatus: item.receiptStatus.trim(),
    remarks: item.remarks?.trim() || null,
    specimenBarcode: item.specimenBarcode.trim(),
  };
}

void loadPendingData();
</script>

<template>
  <Page
    title="标本接收"
    description="主流程按转运单接收，补充提供条码直收入口，并展示 caseId / pathologyNo / receiptStatus / unreceivedCount。"
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
        title="待接收转运单"
        description="待接收列表按后端标本分页返回，在前端按 transportOrderId 聚合成接收工作台。"
      >
        <template #extra>
          <ElButton type="primary" @click="directDrawerVisible = true">条码直收</ElButton>
        </template>

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
          <ElFormItem label="追踪日期">
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

        <ElAlert
          v-if="orphanPendingCount > 0"
          class="mb-4"
          :closable="false"
          :title="`当前有 ${orphanPendingCount} 条待接收标本尚未关联转运单，请优先回到转运交接站核对。`"
          type="warning"
          show-icon
        />

        <ElTable v-loading="loading" :data="groupedTransportOrders" border>
          <ElTableColumn label="转运单 ID" min-width="180" prop="transportOrderId" />
          <ElTableColumn label="申请单号" min-width="150" prop="applicationNo" />
          <ElTableColumn label="患者姓名" min-width="120">
            <template #default="{ row }">
              {{ formatNullable(row.patientName) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="标本数" min-width="100">
            <template #default="{ row }">
              {{ row.items.length }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="最近追踪时间" min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.latestTrackingAt) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="标本条码" min-width="240">
            <template #default="{ row }">
              <div class="flex flex-wrap gap-1">
                <ElTag v-for="barcode in row.barcodes" :key="barcode" effect="plain" type="info">
                  {{ barcode }}
                </ElTag>
              </div>
            </template>
          </ElTableColumn>
          <ElTableColumn fixed="right" label="操作" width="120">
            <template #default="{ row }">
              <ElButton link type="primary" @click="prepareReceipt(row)">准备接收</ElButton>
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
            @current-change="loadPendingData"
            @size-change="loadPendingData"
          />
        </div>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        title="按转运单接收"
        description="支持逐条录入接收结果、拒收原因、容器数量与备注。"
      >
        <ElAlert
          v-if="!selectedGroup"
          :closable="false"
          title="请先在上方选择一条待接收转运单。"
          type="info"
          show-icon
        />

        <template v-else>
          <ElDescriptions :column="2" border class="mb-4">
            <ElDescriptionsItem label="转运单 ID">
              {{ selectedGroup.transportOrderId }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="申请单号">
              {{ selectedGroup.applicationNo }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="患者姓名">
              {{ formatNullable(selectedGroup.patientName) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="待接收标本数">
              {{ selectedGroup.items.length }}
            </ElDescriptionsItem>
          </ElDescriptions>

          <ElForm label-width="96px">
            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <ElFormItem label="接收人" required>
                <ElInput v-model="receiveForm.receivedByName" placeholder="请输入接收人姓名" />
              </ElFormItem>
              <ElFormItem label="接收人 ID">
                <ElInput
                  v-model="receiveForm.receivedByUserId"
                  placeholder="请输入接收人用户 ID"
                />
              </ElFormItem>
              <ElFormItem label="终端编码">
                <ElInput v-model="receiveForm.terminalCode" placeholder="工作站终端编码" />
              </ElFormItem>
            </div>
          </ElForm>

          <ElTable :data="receiptDraftItems" border>
            <ElTableColumn label="标本条码" min-width="180">
              <template #default="{ row }">
                <ElInput v-model="row.specimenBarcode" placeholder="标本条码" />
              </template>
            </ElTableColumn>
            <ElTableColumn label="接收结果" min-width="140">
              <template #default="{ row }">
                <ElSelect v-model="row.receiptStatus" style="width: 100%">
                  <ElOption
                    v-for="option in RECEIPT_STATUS_OPTIONS"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </ElSelect>
              </template>
            </ElTableColumn>
            <ElTableColumn label="容器数量" min-width="120">
              <template #default="{ row }">
                <ElInputNumber v-model="row.containerCount" :min="1" style="width: 100%" />
              </template>
            </ElTableColumn>
            <ElTableColumn label="原因" min-width="180">
              <template #default="{ row }">
                <ElInput v-model="row.reason" placeholder="拒收 / 退回原因" />
              </template>
            </ElTableColumn>
            <ElTableColumn label="备注" min-width="180">
              <template #default="{ row }">
                <ElInput v-model="row.remarks" placeholder="补充说明" />
              </template>
            </ElTableColumn>
          </ElTable>

          <div class="mt-4 flex justify-end">
            <ElButton :loading="receiveLoading" type="primary" @click="submitReceipt">
              提交接收
            </ElButton>
          </div>
        </template>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        v-if="receiptResult"
        title="接收结果"
        description="展示接收后的病例号、病理号、整体签收状态与未签收数量。"
      >
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="caseId">
            {{ formatNullable(receiptResult.caseId) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="pathologyNo">
            {{ formatNullable(receiptResult.pathologyNo) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="receiptStatus">
            {{ receiptResult.receiptStatus }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="unreceivedCount">
            {{ receiptResult.unreceivedCount }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </WorkflowSectionCard>
    </div>

    <ElDrawer v-model="directDrawerVisible" title="条码直收" size="52%">
      <ElForm label-width="96px">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ElFormItem label="接收人" required>
            <ElInput v-model="directForm.receivedByName" placeholder="请输入接收人姓名" />
          </ElFormItem>
          <ElFormItem label="接收人 ID">
            <ElInput v-model="directForm.receivedByUserId" placeholder="请输入接收人用户 ID" />
          </ElFormItem>
          <ElFormItem label="终端编码">
            <ElInput v-model="directForm.terminalCode" placeholder="工作站终端编码" />
          </ElFormItem>
        </div>
      </ElForm>

      <div class="mb-3 flex justify-end">
        <ElButton type="primary" @click="addDirectReceiptRow">新增条码</ElButton>
      </div>

      <ElTable :data="directDraftItems" border>
        <ElTableColumn label="标本条码" min-width="180">
          <template #default="{ row }">
            <ElInput v-model="row.specimenBarcode" placeholder="请输入标本条码" />
          </template>
        </ElTableColumn>
        <ElTableColumn label="接收结果" min-width="140">
          <template #default="{ row }">
            <ElSelect v-model="row.receiptStatus" style="width: 100%">
              <ElOption
                v-for="option in RECEIPT_STATUS_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </template>
        </ElTableColumn>
        <ElTableColumn label="容器数量" min-width="120">
          <template #default="{ row }">
            <ElInputNumber v-model="row.containerCount" :min="1" style="width: 100%" />
          </template>
        </ElTableColumn>
        <ElTableColumn label="原因" min-width="180">
          <template #default="{ row }">
            <ElInput v-model="row.reason" placeholder="拒收 / 退回原因" />
          </template>
        </ElTableColumn>
        <ElTableColumn label="备注" min-width="180">
          <template #default="{ row }">
            <ElInput v-model="row.remarks" placeholder="补充说明" />
          </template>
        </ElTableColumn>
        <ElTableColumn fixed="right" label="操作" width="90">
          <template #default="{ row }">
            <ElButton link type="danger" @click="removeDirectReceiptRow(row.key)">
              删除
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <div class="mt-4 flex justify-end gap-2">
        <ElButton @click="directDrawerVisible = false">取消</ElButton>
        <ElButton :loading="directReceiveLoading" type="primary" @click="submitDirectReceipt">
          提交直收
        </ElButton>
      </div>
    </ElDrawer>
  </Page>
</template>
