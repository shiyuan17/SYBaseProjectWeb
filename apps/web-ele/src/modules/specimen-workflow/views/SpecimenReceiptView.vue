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
  ElDialog,
  ElDrawer,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
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
  directReceiveSpecimens,
  listPendingReceipts,
  receiveSpecimens,
  reprintApplicationForm,
} from '../api/specimen-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import {
  DEFAULT_PAGE_SIZE,
  QUALITY_CHECK_RESULT_OPTIONS,
  QUALITY_ISSUE_CODE_OPTIONS,
  RECEIPT_STATUS_OPTIONS,
} from '../constants';
import { formatDateTime, formatNullable } from '../utils/format';

type ReceiptDraftItem = SpecimenReceiptItemRequest & {
  applicationNo?: string;
  containerName?: null | string;
  key: number;
  patientName?: null | string;
};

type TransportReceiptGroup = {
  applicationId: string;
  applicationNo: string;
  barcodes: string[];
  batchAbnormalFlag: boolean;
  items: PendingSpecimenItem[];
  latestTrackingAt: null | string;
  patientName: null | string;
  reminderCount: number;
  transportOrderId: string;
  unreceivedCount: number;
};

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

const receiveForm = reactive({
  receivedByName: userStore.userInfo?.realName ?? '',
  receivedByUserId: userStore.userInfo?.userId ?? '',
  terminalCode: '',
});

const selectedTransportOrderId = ref('');
const receiptDraftItems = ref<ReceiptDraftItem[]>([]);
const receiptDialogVisible = ref(false);

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
    qualityCheckResult: 'PASSED',
    qualityIssueCodes: [],
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
      existing.batchAbnormalFlag =
        existing.batchAbnormalFlag || Boolean(item.batchAbnormalFlag);
      existing.latestTrackingAt = pickLatestTrackingAt(
        existing.latestTrackingAt,
        item.latestTrackingAt,
      );
      existing.reminderCount = Math.max(
        existing.reminderCount,
        item.reminderCount ?? 0,
      );
      existing.unreceivedCount = Math.max(
        existing.unreceivedCount,
        item.unreceivedCount ?? 0,
      );
      continue;
    }

    groupMap.set(item.transportOrderId, {
      applicationId: item.applicationId,
      applicationNo: item.applicationNo,
      batchAbnormalFlag: Boolean(item.batchAbnormalFlag),
      barcodes: [item.barcode],
      items: [item],
      latestTrackingAt: item.latestTrackingAt,
      patientName: item.patientName,
      reminderCount: item.reminderCount ?? 0,
      transportOrderId: item.transportOrderId,
      unreceivedCount: item.unreceivedCount ?? 0,
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

function formatGroupContainerNames(items: PendingSpecimenItem[]) {
  const names = items
    .map((item) => item.containerName?.trim())
    .filter(
      (value, index, values): value is string =>
        Boolean(value) && values.indexOf(value) === index,
    );
  return names.join('、') || '-';
}

function pickLatestTrackingAt(
  current: null | string,
  next: null | string,
): null | string {
  if (current && next) {
    return [current, next].toSorted()[1] ?? null;
  }

  return current || next;
}

async function loadPendingData() {
  loading.value = true;
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
  receiptDraftItems.value = group.items.map((item) => ({
    applicationNo: item.applicationNo,
    containerCount: item.containerCount ?? 1,
    containerName: item.containerName,
    key: Date.now() + Math.floor(Math.random() * 1000),
    patientName: item.patientName,
    qualityCheckResult: 'PASSED',
    qualityIssueCodes: [],
    reason: '',
    receiptStatus: 'RECEIVED',
    remarks: '',
    specimenBarcode: item.barcode,
  }));
  receiptDialogVisible.value = true;
}

async function handleReprintApplicationForm(group: TransportReceiptGroup) {
  const operatorName = userStore.userInfo?.realName?.trim() ?? '';
  const operatorUserId = userStore.userInfo?.userId?.trim() ?? '';
  if (!operatorName) {
    ElMessage.warning('缺少当前操作人信息');
    return;
  }

  try {
    await reprintApplicationForm(group.applicationId, {
      operatorName,
      operatorUserId: operatorUserId || null,
      remarks: `病理接收页补打印申请单，转运单 ${group.transportOrderId}`,
      terminalCode: receiveForm.terminalCode.trim() || null,
    });
    ElMessage.success(`申请单 ${group.applicationNo} 补打印成功`);
  } catch {}
}

function closeReceiptDialog() {
  receiptDialogVisible.value = false;
  selectedTransportOrderId.value = '';
  receiptDraftItems.value = [];
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
  if (items.some((item) => !item.qualityCheckResult.trim())) {
    ElMessage.warning('请为每一条标本选择质控结果');
    return false;
  }
  if (
    items.some(
      (item) =>
        item.receiptStatus === 'RECEIVED' &&
        item.qualityCheckResult !== 'PASSED',
    )
  ) {
    ElMessage.warning('正常接收的标本质控结果必须为合格');
    return false;
  }
  if (
    items.some(
      (item) =>
        item.qualityCheckResult === 'FAILED' &&
        !(item.qualityIssueCodes && item.qualityIssueCodes.length > 0),
    )
  ) {
    ElMessage.warning('质控不合格时必须选择问题代码');
    return false;
  }
  if (
    items.some(
      (item) => item.receiptStatus !== 'RECEIVED' && !item.reason?.trim(),
    )
  ) {
    ElMessage.warning('拒收或退回时必须填写原因');
    return false;
  }

  return true;
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
  if (!validateReceiptItems(receiptDraftItems.value)) {
    return;
  }

  receiveLoading.value = true;
  try {
    receiptResult.value = await receiveSpecimens({
      items: receiptDraftItems.value.map((item) => normalizeReceiptItem(item)),
      receivedByName: receiveForm.receivedByName.trim(),
      receivedByUserId: receiveForm.receivedByUserId.trim() || null,
      terminalCode: receiveForm.terminalCode.trim() || null,
      transportOrderId: selectedGroup.value.transportOrderId,
    });
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
  if (!validateReceiptItems(directDraftItems.value)) {
    return;
  }

  directReceiveLoading.value = true;
  try {
    receiptResult.value = await directReceiveSpecimens({
      items: directDraftItems.value.map((item) => normalizeReceiptItem(item)),
      receivedByName: directForm.receivedByName.trim(),
      receivedByUserId: directForm.receivedByUserId.trim() || null,
      terminalCode: directForm.terminalCode.trim() || null,
    });
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

function normalizeReceiptItem(
  item: ReceiptDraftItem,
): SpecimenReceiptItemRequest {
  return {
    containerCount: item.containerCount,
    qualityCheckResult: item.qualityCheckResult.trim(),
    qualityIssueCodes: item.qualityIssueCodes?.length
      ? item.qualityIssueCodes
      : null,
    reason: item.reason?.trim() || null,
    receiptStatus: item.receiptStatus.trim(),
    remarks: item.remarks?.trim() || null,
    specimenBarcode: item.specimenBarcode.trim(),
  };
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
      <WorkflowSectionCard
        title="待接收转运单"
        description="待接收列表按后端标本分页返回，在前端按 transportOrderId 聚合成接收工作台，并显式展示异常批次、提醒计数和未接收数量。"
      >
        <template #extra>
          <ElButton type="primary" @click="directDrawerVisible = true">
            条码直收
          </ElButton>
        </template>

        <div class="mb-4 grid gap-3 md:grid-cols-3">
          <div class="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div class="text-sm text-muted-foreground">待接收批次</div>
            <div class="mt-2 text-2xl font-semibold text-foreground">
              {{ groupedTransportOrders.length }}
            </div>
          </div>
          <div
            class="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm"
          >
            <div class="text-sm text-muted-foreground">异常批次</div>
            <div class="mt-2 text-2xl font-semibold text-amber-600">
              {{ abnormalBatchCount }}
            </div>
          </div>
          <div class="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm">
            <div class="text-sm text-muted-foreground">提醒计数</div>
            <div class="mt-2 text-2xl font-semibold text-red-600">
              {{ totalReminderCount }}
            </div>
          </div>
        </div>

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
          <ElFormItem label="送检科室">
            <DepartmentSelect
              v-model="filters.departmentId"
              placeholder="请选择送检科室"
              @change="handleDepartmentChange"
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
          <ElTableColumn
            label="转运单号"
            min-width="180"
            prop="transportOrderId"
          />
          <ElTableColumn
            label="申请单号"
            min-width="150"
            prop="applicationNo"
          />
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
          <ElTableColumn label="提醒/未接收" min-width="140">
            <template #default="{ row }">
              <div class="flex flex-col gap-1 text-sm">
                <span>提醒: {{ row.reminderCount }}</span>
                <span>未接收: {{ row.unreceivedCount }}</span>
              </div>
            </template>
          </ElTableColumn>
          <ElTableColumn label="容器名称" min-width="180">
            <template #default="{ row }">
              {{ formatGroupContainerNames(row.items) }}
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
                <ElTag v-if="row.batchAbnormalFlag" effect="dark" type="danger">
                  异常批次
                </ElTag>
                <ElTag
                  v-for="barcode in row.barcodes"
                  :key="barcode"
                  effect="plain"
                  type="info"
                >
                  {{ barcode }}
                </ElTag>
              </div>
            </template>
          </ElTableColumn>
          <ElTableColumn fixed="right" label="操作" width="120">
            <template #default="{ row }">
              <div class="flex flex-col items-start gap-1">
                <ElButton link type="primary" @click="prepareReceipt(row)">
                  接收
                </ElButton>
                <ElButton
                  link
                  type="info"
                  @click="handleReprintApplicationForm(row)"
                >
                  补打印申请单
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
            @current-change="loadPendingData"
            @size-change="loadPendingData"
          />
        </div>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        v-if="receiptResult"
        title="接收结果"
        description="展示接收后的病例号、病理号、整体签收状态、未签收数量与异常摘要。"
      >
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="病例编号">
            {{ formatNullable(receiptResult.caseId) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="病理号">
            {{ formatNullable(receiptResult.pathologyNo) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="接收状态">
            {{ receiptResult.receiptStatus }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="未接收数量">
            {{ receiptResult.unreceivedCount }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="提醒计数">
            {{ receiptResult.reminderCount ?? 0 }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="异常批次">
            <ElTag
              :type="receiptResult.batchAbnormalFlag ? 'danger' : 'success'"
            >
              {{ receiptResult.batchAbnormalFlag ? '是' : '否' }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem :span="2" label="异常摘要">
            {{ formatNullable(receiptResult.receiptAbnormalSummary) }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </WorkflowSectionCard>
    </div>

    <ElDialog
      v-model="receiptDialogVisible"
      destroy-on-close
      title="接收标本"
      width="78%"
      @closed="closeReceiptDialog"
    >
      <template v-if="selectedGroup">
        <ElDescriptions :column="2" border class="mb-4">
          <ElDescriptionsItem label="转运单号">
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
          <ElDescriptionsItem label="未接收数量">
            {{ selectedGroup.unreceivedCount }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="批次提醒">
            {{ selectedGroup.reminderCount }}
          </ElDescriptionsItem>
        </ElDescriptions>

        <ElAlert
          v-if="selectedGroup.batchAbnormalFlag"
          class="mb-4"
          :closable="false"
          title="当前批次含异常标记，请重点核对容器数量、质控问题和拒收/退回原因。"
          type="warning"
          show-icon
        />

        <ElForm label-width="96px">
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ElFormItem label="接收人" required>
              <SystemUserSelect
                v-model="receiveForm.receivedByUserId"
                :selected-label="receiveForm.receivedByName"
                placeholder="请选择接收人"
                @change="handleReceiveUserChange"
              />
            </ElFormItem>
            <ElFormItem label="终端编码">
              <ElInput
                v-model="receiveForm.terminalCode"
                placeholder="工作站终端编码"
              />
            </ElFormItem>
          </div>
        </ElForm>

        <ElTable
          :data="receiptDraftItems"
          row-key="key"
          border
          max-height="420"
        >
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
          <ElTableColumn label="容器名称" min-width="160">
            <template #default="{ row }">
              {{ formatNullable(row.containerName) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="容器数量" min-width="120">
            <template #default="{ row }">
              <ElInputNumber
                v-model="row.containerCount"
                :min="1"
                style="width: 100%"
              />
            </template>
          </ElTableColumn>
          <ElTableColumn label="质控结果" min-width="140">
            <template #default="{ row }">
              <ElSelect v-model="row.qualityCheckResult" style="width: 100%">
                <ElOption
                  v-for="option in QUALITY_CHECK_RESULT_OPTIONS"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
            </template>
          </ElTableColumn>
          <ElTableColumn label="问题代码" min-width="220">
            <template #default="{ row }">
              <ElSelect
                v-model="row.qualityIssueCodes"
                collapse-tags
                collapse-tags-tooltip
                filterable
                multiple
                placeholder="请选择问题代码"
                style="width: 100%"
              >
                <ElOption
                  v-for="option in QUALITY_ISSUE_CODE_OPTIONS"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
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
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <ElButton @click="closeReceiptDialog">取消</ElButton>
          <ElButton
            :loading="receiveLoading"
            type="primary"
            @click="submitReceipt"
          >
            提交接收
          </ElButton>
        </div>
      </template>
    </ElDialog>

    <ElDrawer v-model="directDrawerVisible" title="条码直收" size="52%">
      <ElForm label-width="96px">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ElFormItem label="接收人" required>
            <SystemUserSelect
              v-model="directForm.receivedByUserId"
              :selected-label="directForm.receivedByName"
              placeholder="请选择接收人"
              @change="handleDirectReceiveUserChange"
            />
          </ElFormItem>
          <ElFormItem label="终端编码">
            <ElInput
              v-model="directForm.terminalCode"
              placeholder="工作站终端编码"
            />
          </ElFormItem>
        </div>
      </ElForm>

      <div class="mb-3 flex justify-end">
        <ElButton type="primary" @click="addDirectReceiptRow">
          新增条码
        </ElButton>
      </div>

      <ElTable :data="directDraftItems" row-key="key" border>
        <ElTableColumn label="标本条码" min-width="180">
          <template #default="{ row }">
            <ElInput
              v-model="row.specimenBarcode"
              placeholder="请输入标本条码"
            />
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
            <ElInputNumber
              v-model="row.containerCount"
              :min="1"
              style="width: 100%"
            />
          </template>
        </ElTableColumn>
        <ElTableColumn label="质控结果" min-width="140">
          <template #default="{ row }">
            <ElSelect v-model="row.qualityCheckResult" style="width: 100%">
              <ElOption
                v-for="option in QUALITY_CHECK_RESULT_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </template>
        </ElTableColumn>
        <ElTableColumn label="问题代码" min-width="220">
          <template #default="{ row }">
            <ElSelect
              v-model="row.qualityIssueCodes"
              collapse-tags
              collapse-tags-tooltip
              filterable
              multiple
              placeholder="请选择问题代码"
              style="width: 100%"
            >
              <ElOption
                v-for="option in QUALITY_ISSUE_CODE_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
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
            <ElButton
              link
              type="danger"
              @click="removeDirectReceiptRow(row.key)"
            >
              删除
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <div class="mt-4 flex justify-end gap-2">
        <ElButton @click="directDrawerVisible = false">取消</ElButton>
        <ElButton
          :loading="directReceiveLoading"
          type="primary"
          @click="submitDirectReceipt"
        >
          提交直收
        </ElButton>
      </div>
    </ElDrawer>
  </Page>
</template>
