<script setup lang="ts">
import type { ApplicationRegistrationWorkbenchRecord } from '../types/application-registration-workbench';
import type {
  ApplicationDetailView,
  LabelPrintRetryResult,
  SpecimenManagementListItem,
} from '../types/specimen-workflow';

import { computed, onMounted, reactive, ref } from 'vue';

import { useUserStore } from '@vben/stores';
import { downloadFileFromBlob } from '@vben/utils';

import {
  ElAlert,
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  createEmptyWorkflowReferenceOptions,
  loadWorkflowReferenceOptionsSafely,
} from '#/modules/system-management/api/workflow-reference-service';
import ReferenceOptionSelect from '#/modules/system-management/components/ReferenceOptionSelect.vue';

import { lookupApplicationRegistrationWorkbenchRecord } from '../api/application-registration-workbench-service';
import {
  completeFixation,
  getApplicationDetail,
  listSpecimens,
  retryLabelPrint,
} from '../api/specimen-workflow-service';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  formatDateTime,
  formatFixationStatus,
  formatNullable,
} from '../utils/format';

type CachedApplicationContext = {
  patientGender: null | string;
  patientId: null | string;
  specimenRemovalTime: null | string;
};

type FixationWorkbenchRow = SpecimenManagementListItem & {
  fixationOperatorName: string;
  fixationTime: null | string;
  inpatientNo: string;
  patientGenderLabel: string;
  patientIdLabel: string;
  queueAddedAt: string;
  queueAddedByName: string;
  surgeryName: string;
};

const MAX_QUERY_SIZE = 100;
const DEFAULT_FIXATION_LIQUID_TYPE = 'FORMALIN';
const RECEIPT_LOCKED_STATUSES = ['RECEIVED', 'REJECTED', 'RETURNED'];

const userStore = useUserStore();

const loading = ref(false);
const pageError = ref('');
const retrySubmitting = ref(false);
const retryDialogVisible = ref(false);
const batchRetryResult = ref<LabelPrintRetryResult | null>(null);
const scanInput = ref('');
const fixationLiquidType = ref(DEFAULT_FIXATION_LIQUID_TYPE);
const queueItems = ref<FixationWorkbenchRow[]>([]);
const selectedRows = ref<FixationWorkbenchRow[]>([]);
const workflowReferenceOptions = ref(createEmptyWorkflowReferenceOptions());

const workbenchRecordCache = reactive(
  new Map<string, ApplicationRegistrationWorkbenchRecord | null>(),
);
const applicationContextCache = reactive(
  new Map<string, CachedApplicationContext | null>(),
);

const retryTargetRows = ref<FixationWorkbenchRow[]>([]);
const retryForm = reactive({
  operatorName: userStore.userInfo?.realName ?? '',
  operatorUserId: userStore.userInfo?.userId ?? '',
  printerCode: '',
  remarks: '',
  terminalCode: '',
});

const selectedCount = computed(() => selectedRows.value.length);

function normalizeText(value?: null | string) {
  return value?.trim() ?? '';
}

function normalizeGenderLabel(value: null | string | undefined) {
  const normalizedValue = value?.trim().toUpperCase();
  if (normalizedValue === 'F' || normalizedValue === '女') {
    return '女';
  }
  if (normalizedValue === 'M' || normalizedValue === '男') {
    return '男';
  }
  return value?.trim() ?? '';
}

function resolveFixationTagType(status: null | string | undefined) {
  if (status === 'COMPLETED') {
    return 'success';
  }
  if (status === 'FIXING') {
    return 'warning';
  }
  return 'info';
}

function resolveFixationLiquidLabel(value: null | string | undefined) {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) {
    return '-';
  }
  const option = workflowReferenceOptions.value.fixationLiquidTypes.find(
    (item) => item.value === normalizedValue || item.label === normalizedValue,
  );
  return option?.label ?? normalizedValue;
}

async function ensureReferenceOptionsLoaded() {
  workflowReferenceOptions.value = await loadWorkflowReferenceOptionsSafely({ enabled: true });
  if (!normalizeText(fixationLiquidType.value)) {
    fixationLiquidType.value =
      workflowReferenceOptions.value.fixationLiquidTypes[0]?.value ?? DEFAULT_FIXATION_LIQUID_TYPE;
  }
}

function isReceiptLocked(row: SpecimenManagementListItem) {
  return RECEIPT_LOCKED_STATUSES.includes(row.specimenStatus ?? '');
}

function isVisibleInFixationScene(row: SpecimenManagementListItem) {
  return row.verificationStatus === 'VERIFIED' && !isReceiptLocked(row);
}

function resolveUnavailableMessage(
  items: SpecimenManagementListItem[],
  keyword: string,
) {
  const exactMatches = resolveExactMatches(items, keyword);
  const targetItems = exactMatches.length > 0 ? exactMatches : items;
  if (
    targetItems.some((item) => normalizeText(item.verificationStatus) !== 'VERIFIED')
  ) {
    return '标本尚未完成离体确认，请先完成离体确认后再固定';
  }
  if (targetItems.some(isReceiptLocked)) {
    return '标本已接收、拒收或退回，不能完成固定';
  }
  return '未找到可固定的标本';
}

async function ensureWorkbenchRecord(applicationNo: string) {
  const normalizedApplicationNo = normalizeText(applicationNo);
  if (!normalizedApplicationNo) {
    return null;
  }
  if (workbenchRecordCache.has(normalizedApplicationNo)) {
    return workbenchRecordCache.get(normalizedApplicationNo) ?? null;
  }

  try {
    const record = await lookupApplicationRegistrationWorkbenchRecord({
      keyword: normalizedApplicationNo,
      queryType: 'APPLICATION_NO',
    });
    workbenchRecordCache.set(normalizedApplicationNo, record);
    return record;
  } catch {
    workbenchRecordCache.set(normalizedApplicationNo, null);
    return null;
  }
}

async function ensureApplicationContext(applicationId: string) {
  const normalizedApplicationId = normalizeText(applicationId);
  if (!normalizedApplicationId) {
    return null;
  }
  if (applicationContextCache.has(normalizedApplicationId)) {
    return applicationContextCache.get(normalizedApplicationId) ?? null;
  }

  try {
    const detail = await getApplicationDetail(normalizedApplicationId);
    const context: CachedApplicationContext = {
      patientGender: detail.patientGender ?? null,
      patientId: detail.patientId ?? null,
      specimenRemovalTime: detail.specimenRemovalTime ?? null,
    };
    applicationContextCache.set(normalizedApplicationId, context);
    return context;
  } catch {
    applicationContextCache.set(normalizedApplicationId, null);
    return null;
  }
}

function buildQueueRow(
  row: SpecimenManagementListItem,
  applicationContext: CachedApplicationContext | null,
  workbenchRecord: ApplicationRegistrationWorkbenchRecord | null,
): FixationWorkbenchRow {
  const queueAddedByName = normalizeText(userStore.userInfo?.realName) || '-';
  const queueAddedAt = new Date().toISOString();

  return {
    ...row,
    fixationOperatorName:
      normalizeText(row.fixationOperatorName)
      || normalizeText(workbenchRecord?.surgeryInfo.fixationPerson),
    fixationTime: row.fixationCompletedAt ?? row.fixationStartedAt ?? null,
    inpatientNo: normalizeText(workbenchRecord?.patientInfo.inpatientNo),
    patientGenderLabel: normalizeGenderLabel(
      applicationContext?.patientGender ?? workbenchRecord?.patientInfo.gender,
    ),
    patientIdLabel: normalizeText(applicationContext?.patientId),
    queueAddedAt,
    queueAddedByName,
    surgeryName:
      normalizeText(workbenchRecord?.surgeryInfo.roomId)
      || normalizeText(workbenchRecord?.surgeryInfo.surgeryName),
  };
}

async function buildEnrichedRow(row: SpecimenManagementListItem) {
  const [applicationContext, workbenchRecord] = await Promise.all([
    ensureApplicationContext(row.applicationId),
    ensureWorkbenchRecord(row.applicationNo),
  ]);

  return buildQueueRow(row, applicationContext, workbenchRecord);
}

function resolveExactMatches(items: SpecimenManagementListItem[], keyword: string) {
  const normalizedKeyword = normalizeText(keyword).toLowerCase();
  return items.filter((item) =>
    [item.specimenId, item.specimenNo, item.barcode].some(
      (value) => normalizeText(value).toLowerCase() === normalizedKeyword,
    ),
  );
}

function handleSelectionChange(rows: FixationWorkbenchRow[]) {
  selectedRows.value = rows;
}

function removeRows(specimenIds: string[]) {
  const targetSet = new Set(specimenIds);
  queueItems.value = queueItems.value.filter((item) => !targetSet.has(item.specimenId));
  selectedRows.value = selectedRows.value.filter((item) => !targetSet.has(item.specimenId));
}

function upsertQueueRow(row: FixationWorkbenchRow) {
  const existingIndex = queueItems.value.findIndex((item) => item.specimenId === row.specimenId);
  if (existingIndex >= 0) {
    queueItems.value.splice(existingIndex, 1, row);
    return;
  }
  queueItems.value.unshift(row);
}

async function handleCompleteFixationByScan() {
  const keyword = normalizeText(scanInput.value);
  if (!keyword) {
    ElMessage.warning('请输入流水号或标本ID');
    return;
  }
  const operatorName = normalizeText(userStore.userInfo?.realName);
  const operatorUserId = normalizeText(userStore.userInfo?.userId);
  const selectedFixationLiquidType = normalizeText(fixationLiquidType.value);
  if (!operatorName) {
    ElMessage.warning('缺少当前固定人信息');
    return;
  }
  if (!selectedFixationLiquidType) {
    ElMessage.warning('请选择固定液类型');
    return;
  }

  loading.value = true;
  pageError.value = '';
  try {
    const listResult = await listSpecimens({
      keyword,
      page: 1,
      size: MAX_QUERY_SIZE,
    });
    const visibleRows = listResult.items.filter(isVisibleInFixationScene);
    const exactMatches = resolveExactMatches(visibleRows, keyword);
    const candidates = exactMatches.length > 0 ? exactMatches : visibleRows;

    if (candidates.length === 0) {
      ElMessage.warning(resolveUnavailableMessage(listResult.items, keyword));
      return;
    }
    if (candidates.length > 1) {
      ElMessage.warning('匹配到多条标本，请输入更精确的流水号或标本ID');
      return;
    }

    const [matchedRow] = candidates;
    if (!matchedRow) {
      return;
    }

    const existingRow = queueItems.value.find((item) => item.specimenId === matchedRow.specimenId);
    if (existingRow) {
      ElMessage.warning('该标本已在当前列表中');
      scanInput.value = '';
      return;
    }

    const result = await completeFixation({
      fixationLiquidType: selectedFixationLiquidType,
      operatorName,
      operatorUserId: operatorUserId || null,
      remarks: '扫码完成固定',
      specimenBarcode: matchedRow.barcode || matchedRow.specimenNo,
    });
    const completedAt = result.fixationCompletedAt ?? new Date().toISOString();
    const nextRow = await buildEnrichedRow({
      ...matchedRow,
      fixationCompletedAt: completedAt,
      fixationLiquidType: result.fixationLiquidType ?? selectedFixationLiquidType,
      fixationOperatorName: result.operatorName ?? operatorName,
      fixationOperatorUserId: result.operatorUserId ?? (operatorUserId || null),
      fixationStatus: result.fixationStatus,
      latestTrackingAt: completedAt,
      specimenStatus: 'FIXED',
    });
    upsertQueueRow(nextRow);
    scanInput.value = '';
    ElMessage.success(`条码 ${matchedRow.barcode || keyword} 已完成固定`);
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

function handleClearSelectionRows() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先勾选需要清除的行');
    return;
  }

  removeRows(selectedRows.value.map((item) => item.specimenId));
  ElMessage.success('已清除选择行');
}

function handleClearList() {
  queueItems.value = [];
  selectedRows.value = [];
  ElMessage.success('列表已清空');
}

function resetRetryForm() {
  retryForm.operatorName = userStore.userInfo?.realName ?? '';
  retryForm.operatorUserId = userStore.userInfo?.userId ?? '';
  retryForm.printerCode = '';
  retryForm.remarks = '';
  retryForm.terminalCode = '';
}

function resolveRetryTargets() {
  return selectedRows.value.length > 0 ? selectedRows.value : queueItems.value;
}

function handleRetryLabel() {
  const targets = resolveRetryTargets();
  if (targets.length === 0) {
    ElMessage.warning('当前没有可补打的标本');
    return;
  }

  const batchNos = Array.from(
    new Set(
      targets
        .map((item) => normalizeText(item.labelPrintBatchNo))
        .filter((value): value is string => Boolean(value)),
    ),
  );
  if (batchNos.length === 0) {
    ElMessage.warning('当前列表缺少可补打的标签批次');
    return;
  }
  if (batchNos.length > 1) {
    ElMessage.warning('补打标本标签仅支持同一标签批次，请先勾选同一批次标本');
    return;
  }

  retryTargetRows.value = targets;
  batchRetryResult.value = null;
  resetRetryForm();
  retryDialogVisible.value = true;
}

async function submitRetryLabel() {
  const batchNo = normalizeText(retryTargetRows.value[0]?.labelPrintBatchNo);
  if (!batchNo) {
    ElMessage.warning('缺少标签批次号');
    return;
  }
  if (!normalizeText(retryForm.operatorName)) {
    ElMessage.warning('当前登录人信息缺失');
    return;
  }
  if (!normalizeText(retryForm.printerCode)) {
    ElMessage.warning('请输入打印机编号');
    return;
  }

  retrySubmitting.value = true;
  pageError.value = '';
  try {
    batchRetryResult.value = await retryLabelPrint(batchNo, {
      operatorName: normalizeText(retryForm.operatorName),
      operatorUserId: normalizeText(retryForm.operatorUserId) || null,
      printerCode: normalizeText(retryForm.printerCode),
      remarks: normalizeText(retryForm.remarks) || null,
      terminalCode: normalizeText(retryForm.terminalCode) || null,
    });
    ElMessage.success('补打标本标签已提交');
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    retrySubmitting.value = false;
  }
}

function buildExportRows() {
  return queueItems.value.map((row, index) => [
    String(index + 1),
    row.applicationNo,
    row.specimenNo,
    formatNullable(row.patientName),
    formatNullable(row.inpatientNo),
    formatNullable(row.patientGenderLabel),
    formatNullable(row.surgeryName),
    row.specimenName,
    formatFixationStatus(row.fixationStatus),
    formatNullable(row.specimenType),
    formatDateTime(
      applicationContextCache.get(normalizeText(row.applicationId))?.specimenRemovalTime ?? null,
    ),
    formatDateTime(row.fixationTime),
    formatNullable(row.fixationOperatorName),
    resolveFixationLiquidLabel(row.fixationLiquidType),
    formatDateTime(row.queueAddedAt),
    formatNullable(row.queueAddedByName),
    formatNullable(row.patientIdLabel),
  ]);
}

function handleExportExcel() {
  if (queueItems.value.length === 0) {
    ElMessage.warning('当前没有可导出的标本数据');
    return;
  }

  const headers = [
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
    '离体时间',
    '固定时间',
    '固定人',
    '固定液类型',
    '添加时间',
    '添加人',
    '病人ID',
  ];

  const tableRows = [headers, ...buildExportRows()];
  const html = `
    <html>
      <head><meta charset="utf-8" /></head>
      <body>
        <table>
          ${tableRows
            .map(
              (row) =>
                `<tr>${row.map((cell) => `<td>${String(cell ?? '')}</td>`).join('')}</tr>`,
            )
            .join('')}
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([`\uFEFF${html}`], {
    type: 'application/vnd.ms-excel;charset=utf-8',
  });
  downloadFileFromBlob({
    fileName: `标本固定-${new Date().toISOString().slice(0, 10)}.xls`,
    source: blob,
  });
  ElMessage.success('导出成功');
}

onMounted(() => {
  void ensureReferenceOptionsLoaded();
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <ElAlert
      v-if="pageError"
      :closable="false"
      :title="pageError"
      type="error"
      show-icon
    />

    <div class="flex flex-wrap items-center gap-3 text-sm">
      <div class="font-semibold text-[color:#d6453d]">设置固定时间</div>
      <div>
        全部
        <span class="text-xl font-semibold text-primary">{{ queueItems.length }}</span>
      </div>
      <div>
        已选
        <span class="text-xl font-semibold text-success">{{ selectedCount }}</span>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <ElInput
        v-model="scanInput"
        clearable
        placeholder="流水号 / 标本ID"
        style="width: 260px"
        @keyup.enter="handleCompleteFixationByScan"
      />
      <ReferenceOptionSelect
        v-model="fixationLiquidType"
        :options="workflowReferenceOptions.fixationLiquidTypes"
        placeholder="请选择固定液类型"
        style="width: 220px"
      />
      <ElButton @click="handleClearSelectionRows">清除选择行</ElButton>
      <ElButton @click="handleClearList">清除列表</ElButton>
      <ElButton @click="handleRetryLabel">补打标本标签</ElButton>
      <ElButton @click="handleExportExcel">导出Excel</ElButton>
    </div>

    <ElTable
      v-loading="loading"
      :data="queueItems"
      border
      row-key="specimenId"
      @selection-change="handleSelectionChange"
    >
      <ElTableColumn type="selection" width="42" />
      <ElTableColumn label="序" width="60">
        <template #default="{ $index }">
          {{ $index + 1 }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="申请单" min-width="130" prop="applicationNo" />
      <ElTableColumn label="标本编号" min-width="130" prop="specimenNo" />
      <ElTableColumn label="姓名" min-width="100">
        <template #default="{ row }">
          {{ formatNullable(row.patientName) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="住院号" min-width="120">
        <template #default="{ row }">
          {{ formatNullable(row.inpatientNo) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="性别" min-width="80">
        <template #default="{ row }">
          {{ formatNullable(row.patientGenderLabel) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="手术间" min-width="120">
        <template #default="{ row }">
          {{ formatNullable(row.surgeryName) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="标本名称" min-width="160" prop="specimenName" />
      <ElTableColumn label="标本状态" min-width="120">
        <template #default="{ row }">
          <ElTag :type="resolveFixationTagType(row.fixationStatus)">
            {{ formatFixationStatus(row.fixationStatus) }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="类型" min-width="100">
        <template #default="{ row }">
          {{ formatNullable(row.specimenType) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="离体时间" min-width="170">
        <template #default="{ row }">
          {{
            formatDateTime(
              applicationContextCache.get(normalizeText(row.applicationId))?.specimenRemovalTime
                ?? null,
            )
          }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="固定时间" min-width="170">
        <template #default="{ row }">
          {{ formatDateTime(row.fixationTime) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="固定人" min-width="120">
        <template #default="{ row }">
          {{ formatNullable(row.fixationOperatorName) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="固定液类型" min-width="150">
        <template #default="{ row }">
          {{ resolveFixationLiquidLabel(row.fixationLiquidType) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="添加时间" min-width="170">
        <template #default="{ row }">
          {{ formatDateTime(row.queueAddedAt) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="添加人" min-width="120">
        <template #default="{ row }">
          {{ formatNullable(row.queueAddedByName) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="病人ID" min-width="140">
        <template #default="{ row }">
          {{ formatNullable(row.patientIdLabel) }}
        </template>
      </ElTableColumn>
    </ElTable>
  </div>

  <ElDialog
    v-model="retryDialogVisible"
    :close-on-click-modal="false"
    destroy-on-close
    title="补打标本标签"
    width="760px"
  >
    <div class="flex flex-col gap-4">
      <section class="rounded-lg border border-border bg-card px-4 py-4 shadow-sm">
        <div class="mb-4 text-base font-semibold text-foreground">补打范围</div>
        <div class="grid gap-3 text-sm md:grid-cols-2">
          <div>涉及标本数：{{ retryTargetRows.length }}</div>
          <div>标签批次号：{{ retryTargetRows[0]?.labelPrintBatchNo || '-' }}</div>
        </div>
      </section>

      <section class="rounded-lg border border-border bg-card px-4 py-4 shadow-sm">
        <ElForm label-width="96px">
          <div class="grid gap-4 md:grid-cols-2">
            <ElFormItem label="操作人" required>
              <ElInput v-model="retryForm.operatorName" disabled />
            </ElFormItem>
            <ElFormItem label="打印机编号" required>
              <ElInput v-model="retryForm.printerCode" placeholder="请输入打印机编号" />
            </ElFormItem>
            <ElFormItem label="终端编号">
              <ElInput v-model="retryForm.terminalCode" placeholder="可选" />
            </ElFormItem>
          </div>
          <ElFormItem label="备注">
            <ElInput v-model="retryForm.remarks" placeholder="补打说明" />
          </ElFormItem>
        </ElForm>
      </section>

      <section
        v-if="batchRetryResult"
        class="rounded-lg border border-border bg-card px-4 py-4 shadow-sm"
      >
        <div class="mb-4 text-base font-semibold text-foreground">补打结果</div>
        <div class="grid gap-3 text-sm md:grid-cols-2">
          <div>批次号：{{ batchRetryResult.labelPrintBatchNo }}</div>
          <div>结果：{{ batchRetryResult.allSuccessful ? '全部成功' : '部分成功' }}</div>
          <div>成功数：{{ batchRetryResult.successCount }}</div>
          <div>失败数：{{ batchRetryResult.failedCount }}</div>
          <div>重试数：{{ batchRetryResult.retriedCount }}</div>
          <div>消息：{{ formatNullable(batchRetryResult.message) }}</div>
        </div>
      </section>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <ElButton @click="retryDialogVisible = false">取消</ElButton>
        <ElButton :loading="retrySubmitting" type="primary" @click="submitRetryLabel">
          提交补打
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>
