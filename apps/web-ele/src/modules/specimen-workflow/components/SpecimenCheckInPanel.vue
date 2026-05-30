<script setup lang="ts">
import type { SpecimenManagementListItem } from '../types/specimen-workflow';

import { computed, reactive, ref } from 'vue';

import { useUserStore } from '@vben/stores';

import {
  ElButton,
  ElInput,
  ElMessage,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  checkInSpecimen,
  listSpecimens,
  retryLabelPrint,
} from '../api/specimen-workflow-service';
import { getWorkflowPageErrorMessage } from '../utils/error';
import { downloadFileFromBlob } from '@vben/utils';
import {
  formatCheckInStatus,
  formatDateTime,
  formatNullable,
  formatSpecimenStatus,
} from '../utils/format';

const MAX_QUERY_SIZE = 100;
const RECEIPT_LOCKED_STATUSES = ['RECEIVED', 'REJECTED', 'RETURNED'];
const EXPORT_HEADERS = [
  '序',
  '申请单',
  '标本编号',
  '姓名',
  '住院号',
  '性别',
  '手术间',
  '标本名称',
  '标本状态',
  '类型',
  '入库时间',
  '入库人',
  '添加时间',
  '添加人',
] as const;

type QueueItem = SpecimenManagementListItem & {
  checkedInByName?: null | string;
  checkedInAt?: null | string;
  queueAddedAt: string;
  queueAddedByName: string;
  queueStatus: 'FAILED' | 'PENDING' | 'SUCCESS';
};

const userStore = useUserStore();

const loading = ref(false);
const actionLoading = ref(false);
const exportLoading = ref(false);
const retryLoading = ref(false);
const pageError = ref('');
const scanInput = ref('');
const queueItems = ref<QueueItem[]>([]);
const selectedRowKeys = ref<string[]>([]);

const operatorForm = reactive({
  operatorName: userStore.userInfo?.realName ?? '',
  operatorUserId: userStore.userInfo?.userId ?? '',
  remarks: '',
  terminalCode: '',
  printerCode: '',
});

const selectedRows = computed(() =>
  queueItems.value.filter((item) => selectedRowKeys.value.includes(item.specimenId)),
);

const selectedCount = computed(() => selectedRows.value.length);

const pendingCount = computed(
  () => queueItems.value.filter((item) => item.queueStatus !== 'SUCCESS').length,
);

function normalizeText(value?: null | string) {
  return value?.trim() ?? '';
}

function isReceiptLocked(row: SpecimenManagementListItem) {
  return RECEIPT_LOCKED_STATUSES.includes(row.specimenStatus ?? '');
}

function isVisibleInCheckInScene(row: SpecimenManagementListItem) {
  return (
    row.verificationStatus === 'VERIFIED'
    && row.fixationStatus === 'COMPLETED'
    && Boolean(row.specimenConfirmedAt)
    && !isReceiptLocked(row)
  );
}

function buildQueueItem(row: SpecimenManagementListItem): QueueItem {
  return {
    ...row,
    queueAddedAt: new Date().toISOString(),
    queueAddedByName: operatorForm.operatorName.trim() || userStore.userInfo?.realName || '-',
    queueStatus: row.checkInStatus === 'CHECKED_IN' ? 'SUCCESS' : 'PENDING',
  };
}

function upsertQueueItem(row: SpecimenManagementListItem) {
  const index = queueItems.value.findIndex((item) => item.specimenId === row.specimenId);
  const nextRow = buildQueueItem(row);
  if (index >= 0) {
    const existingRow = queueItems.value[index];
    if (!existingRow) {
      return nextRow;
    }
    queueItems.value.splice(index, 1, {
      ...existingRow,
      ...nextRow,
      queueAddedAt: existingRow.queueAddedAt,
      queueAddedByName: existingRow.queueAddedByName,
    });
    return queueItems.value[index] ?? nextRow;
  }
  queueItems.value.unshift(nextRow);
  return nextRow;
}

function removeQueueItems(specimenIds: string[]) {
  const targetSet = new Set(specimenIds);
  queueItems.value = queueItems.value.filter((item) => !targetSet.has(item.specimenId));
  selectedRowKeys.value = selectedRowKeys.value.filter((item) => !targetSet.has(item));
}

function clearSelection() {
  removeQueueItems(selectedRowKeys.value);
}

function clearQueue() {
  queueItems.value = [];
  selectedRowKeys.value = [];
}

function isCheckInReady(row: SpecimenManagementListItem) {
  return row.checkInStatus !== 'CHECKED_IN'
    && row.verificationStatus === 'VERIFIED'
    && row.fixationStatus === 'COMPLETED'
    && Boolean(row.specimenConfirmedAt)
    && !isReceiptLocked(row);
}

async function loadMatchingSpecimens(keyword: string) {
  const result = await listSpecimens({
    keyword,
    page: 1,
    size: MAX_QUERY_SIZE,
  });

  return result.items.filter((item) => isVisibleInCheckInScene(item));
}

function resolveExactMatch(items: SpecimenManagementListItem[], keyword: string) {
  const normalizedKeyword = normalizeText(keyword);
  const matches = items.filter((item) =>
    [item.specimenId, item.specimenNo, item.barcode].some(
      (value) => normalizeText(value) === normalizedKeyword,
    ),
  );
  return matches;
}

function buildCheckInPayload(row: SpecimenManagementListItem) {
  return {
    operatorName: operatorForm.operatorName.trim(),
    operatorUserId: operatorForm.operatorUserId.trim() || null,
    remarks: operatorForm.remarks.trim() || null,
    specimenBarcode: row.barcode,
    terminalCode: operatorForm.terminalCode.trim() || null,
  };
}

async function performCheckIn(row: SpecimenManagementListItem) {
  if (!operatorForm.operatorName.trim()) {
    ElMessage.warning('缺少当前操作人信息');
    return;
  }
  if (!row.barcode) {
    ElMessage.warning('当前标本缺少条码，无法入库');
    return;
  }
  if (!isCheckInReady(row)) {
    ElMessage.warning('当前标本不满足入库条件');
    return;
  }

  const queueRow = upsertQueueItem(row);
  queueRow.queueStatus = 'PENDING';

  actionLoading.value = true;
  pageError.value = '';
  try {
    await checkInSpecimen(row.barcode, buildCheckInPayload(row));
    queueRow.checkInStatus = 'CHECKED_IN';
    queueRow.checkedInAt = new Date().toISOString();
    queueRow.checkedInByName = operatorForm.operatorName.trim();
    queueRow.queueStatus = 'SUCCESS';
    ElMessage.success('标本入库成功');
  } catch (error) {
    queueRow.queueStatus = 'FAILED';
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    actionLoading.value = false;
  }
}

async function handleQuickCheckIn() {
  const keyword = scanInput.value.trim();
  if (!keyword) {
    return;
  }

  loading.value = true;
  pageError.value = '';
  try {
    const candidates = await loadMatchingSpecimens(keyword);
    const exactMatches = resolveExactMatch(candidates, keyword);
    if (exactMatches.length === 0) {
      ElMessage.warning('未找到可入库标本');
      return;
    }
    if (exactMatches.length > 1) {
      ElMessage.warning('匹配到多条记录，请检查输入值');
      return;
    }

    const [row] = exactMatches;
    if (!row) {
      return;
    }
    if (!isCheckInReady(row)) {
      ElMessage.warning('当前标本不满足入库条件');
      return;
    }

    const existingRow = queueItems.value.find((item) => item.specimenId === row.specimenId);
    if (existingRow?.checkInStatus === 'CHECKED_IN') {
      ElMessage.success('该标本已完成入库');
      scanInput.value = '';
      return;
    }

    upsertQueueItem(row);
    await performCheckIn(row);
    scanInput.value = '';
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

function handleSelectionChange(rows: QueueItem[]) {
  selectedRowKeys.value = rows.map((item) => item.specimenId);
}

async function handleManualCheckIn(row: QueueItem) {
  await performCheckIn(row);
}

function handleRemoveRow(row: QueueItem) {
  removeQueueItems([row.specimenId]);
}

function handleReset() {
  scanInput.value = '';
  clearQueue();
  pageError.value = '';
}

function canBatchOperate(row: QueueItem) {
  return row.queueStatus !== 'SUCCESS';
}

async function handleBatchCheckIn() {
  const targets = selectedRows.value.filter(canBatchOperate);
  if (targets.length === 0) {
    ElMessage.warning('请先选择需要入库的标本');
    return;
  }

  retryLoading.value = true;
  try {
    for (const row of targets) {
      await performCheckIn(row);
    }
  } finally {
    retryLoading.value = false;
  }
}

async function handleRetryLabelPrint() {
  const selectedTargets = selectedRows.value;
  const fallbackBatchNos = Array.from(
    new Set(queueItems.value.map((row) => row.labelPrintBatchNo).filter(Boolean)),
  );
  const targets = selectedTargets.length > 0
    ? selectedTargets
    : queueItems.value.filter((row) => row.labelPrintBatchNo === fallbackBatchNos[0]);
  if (targets.length === 0) {
    ElMessage.warning('请先选择需要补打的标本');
    return;
  }

  const batchNos = Array.from(
    new Set(targets.map((row) => row.labelPrintBatchNo).filter(Boolean)),
  );
  if (batchNos.length !== 1) {
    ElMessage.warning('仅支持同一标签批次补打');
    return;
  }
  if (!operatorForm.printerCode.trim()) {
    ElMessage.warning('请输入打印机编号');
    return;
  }

  retryLoading.value = true;
  pageError.value = '';
  try {
    await retryLabelPrint(batchNos[0]!, {
      operatorName: operatorForm.operatorName.trim(),
      operatorUserId: operatorForm.operatorUserId.trim() || null,
      printerCode: operatorForm.printerCode.trim(),
      remarks: operatorForm.remarks.trim() || null,
      terminalCode: operatorForm.terminalCode.trim() || null,
    });
    ElMessage.success('补打已提交');
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    retryLoading.value = false;
  }
}

function resolveExportValue(value: null | number | string | undefined) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  return String(value);
}

async function handleExport() {
  exportLoading.value = true;
  try {
    const rows = queueItems.value.map((row, index) => [
      String(index + 1),
      resolveExportValue(row.applicationNo),
      resolveExportValue(row.specimenNo),
      resolveExportValue(row.patientName),
      '-',
      '-',
      resolveExportValue(row.submittingDepartmentName),
      resolveExportValue(row.specimenName),
      resolveExportValue(formatSpecimenStatus(row.specimenStatus)),
      resolveExportValue(row.specimenType),
      resolveExportValue(row.checkedInAt),
      resolveExportValue(row.checkedInByName),
      resolveExportValue(row.queueAddedAt),
      resolveExportValue(row.queueAddedByName),
    ]);
    const csv = [EXPORT_HEADERS, ...rows]
      .map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    downloadFileFromBlob({
      fileName: `specimen-check-in-${new Date().toISOString().slice(0, 10)}.csv`,
      source: new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }),
    });
    ElMessage.success('导出成功');
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    exportLoading.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      v-if="pageError"
      class="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
    >
      {{ pageError }}
    </div>

    <div class="flex flex-wrap items-center gap-4 text-sm">
      <div class="font-semibold text-[color:#d6453d]">标本入库</div>
      <div>
        全部
        <span class="text-xl font-semibold text-primary">{{ queueItems.length }}</span>
      </div>
      <div>
        已选
        <span class="text-xl font-semibold text-success">{{ selectedCount }}</span>
      </div>
      <div>
        待处理
        <span class="text-xl font-semibold text-danger">{{ pendingCount }}</span>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <ElInput
        v-model="scanInput"
        clearable
        placeholder="标本id / 流水号 / 条码"
        style="width: 260px"
        @keyup.enter="handleQuickCheckIn"
      />
      <ElInput
        v-model="operatorForm.operatorName"
        placeholder="选择操作人"
        style="width: 160px"
      />
      <ElInput v-model="operatorForm.printerCode" placeholder="打印机编号" style="width: 140px" />
      <ElInput v-model="operatorForm.terminalCode" placeholder="终端编号" style="width: 140px" />
      <ElButton :loading="actionLoading" type="primary" @click="handleQuickCheckIn">
        标本入库
      </ElButton>
      <ElButton :loading="retryLoading" @click="handleBatchCheckIn">批量入库</ElButton>
      <ElButton @click="clearSelection">清除选择行</ElButton>
      <ElButton @click="clearQueue">清除列表</ElButton>
      <ElButton :loading="retryLoading" @click="handleRetryLabelPrint">补打标本标签</ElButton>
      <ElButton @click="handleReset">重置</ElButton>
      <ElButton :loading="exportLoading" @click="handleExport">导出Excel</ElButton>
    </div>

    <ElTable
      v-loading="loading"
      :data="queueItems"
      border
      row-key="specimenId"
      @selection-change="handleSelectionChange"
    >
      <ElTableColumn type="selection" width="38" />
      <ElTableColumn label="序" type="index" width="60" />
      <ElTableColumn label="申请单" min-width="120" prop="applicationNo" />
      <ElTableColumn label="标本编号" min-width="130" prop="specimenNo" />
      <ElTableColumn label="姓名" min-width="110" prop="patientName" />
      <ElTableColumn label="住院号" min-width="110">
        <template #default>
          -
        </template>
      </ElTableColumn>
      <ElTableColumn label="性别" min-width="90">
        <template #default>
          -
        </template>
      </ElTableColumn>
      <ElTableColumn label="手术间" min-width="120">
        <template #default="{ row }">
          {{ formatNullable(row.submittingDepartmentName) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="标本名称" min-width="140" prop="specimenName" />
      <ElTableColumn label="标本状态" min-width="120">
        <template #default="{ row }">
          <ElTag :type="row.queueStatus === 'SUCCESS' ? 'success' : 'warning'">
            {{ formatCheckInStatus(row.checkInStatus) }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="类型" min-width="100">
        <template #default="{ row }">
          {{ formatNullable(row.specimenType) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="入库时间" min-width="170">
        <template #default="{ row }">
          {{ formatDateTime(row.checkedInAt) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="入库人" min-width="120">
        <template #default="{ row }">
          {{ formatNullable(row.checkedInByName) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="添加时间" min-width="170">
        <template #default="{ row }">
          {{ formatDateTime(row.queueAddedAt) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="添加人" min-width="120" prop="queueAddedByName" />
      <ElTableColumn fixed="right" label="操作" width="150">
        <template #default="{ row }">
          <div class="flex items-center gap-2">
            <ElButton
              link
              :disabled="row.queueStatus === 'SUCCESS'"
              type="primary"
              @click="handleManualCheckIn(row)"
            >
              入库
            </ElButton>
            <ElButton link type="danger" @click="handleRemoveRow(row)">
              移除
            </ElButton>
          </div>
        </template>
      </ElTableColumn>
    </ElTable>

    <div class="text-sm text-muted-foreground">
      已入库 {{ queueItems.filter((item) => item.queueStatus === 'SUCCESS').length }} 条，
      待处理 {{ pendingCount }} 条
    </div>
  </div>
</template>
