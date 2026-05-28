<script setup lang="ts">
import type { ApplicationRegistrationWorkbenchRecord } from '../types/application-registration-workbench';
import type {
  LabelPrintRetryResult,
  SpecimenManagementListItem,
} from '../types/specimen-workflow';

import { computed, reactive, ref } from 'vue';

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
  ElPagination,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { lookupApplicationRegistrationWorkbenchRecord } from '../api/application-registration-workbench-service';
import {
  confirmSpecimen,
  getApplicationDetail,
  listSpecimens,
  retryLabelPrint,
} from '../api/specimen-workflow-service';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  formatDateTime,
  formatNullable,
} from '../utils/format';

import SystemUserSelect from '#/modules/system-management/components/SystemUserSelect.vue';

type CachedApplicationContext = {
  patientGender: null | string;
  submittingDoctorName: string;
};

type ConfirmationListRow = SpecimenManagementListItem & {
  inpatientNo: string;
  patientGenderLabel: string;
  registrationOperatorName: string;
  registrationTime: null | string;
  surgeryName: string;
};

const MAX_QUERY_SIZE = 500;
const RECEIPT_LOCKED_STATUSES = ['RECEIVED', 'REJECTED', 'RETURNED'];

const userStore = useUserStore();

const loading = ref(false);
const actionLoading = ref(false);
const retrySubmitting = ref(false);
const pageError = ref('');
const selectedRows = ref<ConfirmationListRow[]>([]);
const allRows = ref<ConfirmationListRow[]>([]);
const workingRows = ref<ConfirmationListRow[]>([]);
const retryDialogVisible = ref(false);
const retryTargetRows = ref<ConfirmationListRow[]>([]);
const batchRetryResult = ref<LabelPrintRetryResult | null>(null);

const workbenchRecordCache = reactive(
  new Map<string, ApplicationRegistrationWorkbenchRecord | null>(),
);
const applicationContextCache = reactive(
  new Map<string, CachedApplicationContext | null>(),
);

const filters = reactive({
  keyword: '',
  page: 1,
  size: DEFAULT_PAGE_SIZE,
});

const operatorForm = reactive({
  operatorName: userStore.userInfo?.realName ?? '',
  operatorUserId: userStore.userInfo?.userId ?? '',
  remarks: '',
  terminalCode: '',
});

const retryForm = reactive({
  operatorName: userStore.userInfo?.realName ?? '',
  operatorUserId: userStore.userInfo?.userId ?? '',
  printerCode: '',
  remarks: '',
  terminalCode: '',
});

const pagedItems = computed(() => {
  const startIndex = (filters.page - 1) * filters.size;
  return workingRows.value.slice(startIndex, startIndex + filters.size);
});

const total = computed(() => workingRows.value.length);

const summary = computed(() => {
  const allCount = workingRows.value.length;
  const confirmedCount = workingRows.value.filter((item) => Boolean(item.specimenConfirmedAt)).length;
  return {
    allCount,
    confirmedCount,
    pendingCount: allCount - confirmedCount,
  };
});

function syncOperatorFromCurrentUser() {
  operatorForm.operatorName = userStore.userInfo?.realName ?? '';
  operatorForm.operatorUserId = userStore.userInfo?.userId ?? '';
}

function syncRetryOperatorFromCurrentUser() {
  retryForm.operatorName = userStore.userInfo?.realName ?? '';
  retryForm.operatorUserId = userStore.userInfo?.userId ?? '';
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

function isReceiptLocked(row: SpecimenManagementListItem) {
  return RECEIPT_LOCKED_STATUSES.includes(row.specimenStatus ?? '');
}

function isVisibleInConfirmationScene(row: SpecimenManagementListItem) {
  return (
    row.fixationStatus === 'COMPLETED'
    && row.verificationStatus === 'VERIFIED'
    && row.checkInStatus !== 'CHECKED_IN'
    && !isReceiptLocked(row)
  );
}

function canConfirm(row: ConfirmationListRow) {
  return !row.specimenConfirmedAt;
}

function canRetryLabel(row: ConfirmationListRow) {
  return Boolean(row.labelPrintBatchNo) && ['FAILED', 'PENDING'].includes(row.labelPrintStatus ?? '');
}

async function ensureWorkbenchRecord(applicationNo: string) {
  const normalizedApplicationNo = applicationNo.trim();
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
  const normalizedApplicationId = applicationId.trim();
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
      submittingDoctorName: detail.submittingDoctorName?.trim() ?? '',
    };
    applicationContextCache.set(normalizedApplicationId, context);
    return context;
  } catch {
    applicationContextCache.set(normalizedApplicationId, null);
    return null;
  }
}

function enhanceRow(
  row: SpecimenManagementListItem,
  applicationContext: CachedApplicationContext | null,
  workbenchRecord: ApplicationRegistrationWorkbenchRecord | null,
): ConfirmationListRow {
  return {
    ...row,
    inpatientNo: workbenchRecord?.patientInfo.inpatientNo?.trim() ?? '',
    patientGenderLabel: normalizeGenderLabel(
      applicationContext?.patientGender ?? workbenchRecord?.patientInfo.gender,
    ),
    registrationOperatorName:
      applicationContext?.submittingDoctorName
      || workbenchRecord?.patientInfo.applyDoctor?.trim()
      || workbenchRecord?.surgeryInfo.fixationPerson?.trim()
      || '',
    registrationTime: row.registeredAt ?? workbenchRecord?.surgeryInfo.fixationTime ?? null,
    surgeryName:
      workbenchRecord?.surgeryInfo.roomId?.trim()
      || workbenchRecord?.surgeryInfo.surgeryName?.trim()
      || '',
  };
}

async function buildEnhancedRows(items: SpecimenManagementListItem[]) {
  const applicationNos = Array.from(
    new Set(
      items
        .map((item) => item.applicationNo?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const applicationIds = Array.from(
    new Set(
      items
        .map((item) => item.applicationId?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  );

  await Promise.all([
    ...applicationNos.map((applicationNo) => ensureWorkbenchRecord(applicationNo)),
    ...applicationIds.map((applicationId) => ensureApplicationContext(applicationId)),
  ]);

  return items.map((item) =>
    enhanceRow(
      item,
      applicationContextCache.get(item.applicationId.trim()) ?? null,
      workbenchRecordCache.get(item.applicationNo.trim()) ?? null,
    ),
  );
}

function applyRows(rows: ConfirmationListRow[]) {
  allRows.value = rows;
  workingRows.value = rows;
  selectedRows.value = [];
  if ((filters.page - 1) * filters.size >= rows.length) {
    filters.page = 1;
  }
}

async function loadSpecimens() {
  loading.value = true;
  pageError.value = '';
  try {
    const result = await listSpecimens({
      keyword: filters.keyword.trim() || undefined,
      page: 1,
      size: MAX_QUERY_SIZE,
    });
    const visibleRows = result.items.filter(isVisibleInConfirmationScene);
    const enhancedRows = await buildEnhancedRows(visibleRows);
    applyRows(enhancedRows);
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

function requireOperatorInfo() {
  if (!operatorForm.operatorName.trim()) {
    ElMessage.warning('请先选择操作人');
    return false;
  }
  return true;
}

function buildConfirmPayload() {
  return {
    operatorName: operatorForm.operatorName.trim(),
    operatorUserId: operatorForm.operatorUserId.trim() || null,
    remarks: operatorForm.remarks.trim() || null,
    terminalCode: operatorForm.terminalCode.trim() || null,
  };
}

async function confirmRows(rows: ConfirmationListRow[]) {
  if (!rows.length) {
    ElMessage.warning('请先选择需要确认的标本');
    return;
  }
  if (!requireOperatorInfo()) {
    return;
  }

  const pendingRows = rows.filter(canConfirm);
  if (!pendingRows.length) {
    ElMessage.warning('当前所选标本均已确认');
    return;
  }

  actionLoading.value = true;
  pageError.value = '';
  try {
    const payload = buildConfirmPayload();
    await Promise.all(
      pendingRows.map((row) => confirmSpecimen(row.barcode || row.specimenId, payload)),
    );
    ElMessage.success(`已完成 ${pendingRows.length} 条标本确认`);
    await loadSpecimens();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    actionLoading.value = false;
  }
}

async function tryQuickConfirmByKeyword() {
  const keyword = filters.keyword.trim();
  if (!keyword) {
    handleSearch();
    return;
  }
  if (!requireOperatorInfo()) {
    return;
  }

  const normalizedKeyword = keyword.toLowerCase();
  const matchedRows = allRows.value.filter((row) => {
    const candidates = [row.applicationNo, row.specimenNo, row.barcode];
    return candidates.some((value) => value?.trim().toLowerCase() === normalizedKeyword);
  });

  if (matchedRows.length === 1) {
    filters.keyword = '';
    await confirmRows(matchedRows);
    return;
  }

  if (matchedRows.length > 1) {
    ElMessage.warning('匹配到多条标本，请先筛选后再确认');
    handleSearch();
    return;
  }

  handleSearch();
}

function handleSearch() {
  filters.page = 1;
  void loadSpecimens();
}

function handleReset() {
  filters.keyword = '';
  filters.page = 1;
  filters.size = DEFAULT_PAGE_SIZE;
  operatorForm.remarks = '';
  operatorForm.terminalCode = '';
  syncOperatorFromCurrentUser();
  void loadSpecimens();
}

function handleSelectionChange(rows: ConfirmationListRow[]) {
  selectedRows.value = rows;
}

function handleOperatorChange(user: null | { id: string; name: string }) {
  operatorForm.operatorUserId = user?.id ?? '';
  operatorForm.operatorName = user?.name ?? '';
}

function handleRetryOperatorChange(user: null | { id: string; name: string }) {
  retryForm.operatorUserId = user?.id ?? '';
  retryForm.operatorName = user?.name ?? '';
}

function handleConfirmSelected() {
  void confirmRows(selectedRows.value);
}

function handleConfirmRow(row: ConfirmationListRow) {
  void confirmRows([row]);
}

function handleClearSelectionRows() {
  const selectedSpecimenIds = new Set(selectedRows.value.map((item) => item.specimenId));
  if (!selectedSpecimenIds.size) {
    ElMessage.warning('请先勾选需要清除的行');
    return;
  }

  workingRows.value = workingRows.value.filter((item) => !selectedSpecimenIds.has(item.specimenId));
  selectedRows.value = [];
  ElMessage.success('已清除选择行');
}

function handleClearList() {
  workingRows.value = [];
  selectedRows.value = [];
  filters.page = 1;
  ElMessage.success('列表已清空');
}

function openRetryDialog(rows: ConfirmationListRow[]) {
  if (!rows.length) {
    ElMessage.warning('请先选择需要补打标签的标本');
    return;
  }

  const retryableRows = rows.filter(canRetryLabel);
  if (!retryableRows.length) {
    ElMessage.warning('所选标本没有可补打的标签批次');
    return;
  }

  const batchNos = Array.from(
    new Set(
      retryableRows
        .map((item) => item.labelPrintBatchNo?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  );

  if (batchNos.length !== 1) {
    ElMessage.warning('补打标签仅支持同一标签批次的标本');
    return;
  }

  retryTargetRows.value = retryableRows;
  batchRetryResult.value = null;
  syncRetryOperatorFromCurrentUser();
  retryForm.printerCode = '';
  retryForm.remarks = '';
  retryForm.terminalCode = '';
  retryDialogVisible.value = true;
}

function handleRetryLabel() {
  openRetryDialog(selectedRows.value);
}

async function submitRetryLabel() {
  const batchNo = retryTargetRows.value[0]?.labelPrintBatchNo?.trim();
  if (!batchNo) {
    ElMessage.warning('缺少标签批次号');
    return;
  }
  if (!retryForm.operatorName.trim()) {
    ElMessage.warning('请选择操作人');
    return;
  }
  if (!retryForm.printerCode.trim()) {
    ElMessage.warning('请输入打印机编号');
    return;
  }

  retrySubmitting.value = true;
  pageError.value = '';
  try {
    batchRetryResult.value = await retryLabelPrint(batchNo, {
      operatorName: retryForm.operatorName.trim(),
      operatorUserId: retryForm.operatorUserId.trim() || null,
      printerCode: retryForm.printerCode.trim(),
      remarks: retryForm.remarks.trim() || null,
      terminalCode: retryForm.terminalCode.trim() || null,
    });
    ElMessage.success('补打标本标签已提交');
    await loadSpecimens();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    retrySubmitting.value = false;
  }
}

function buildExportRows() {
  return workingRows.value.map((row, index) => [
    String(index + 1),
    row.applicationNo,
    row.specimenNo,
    formatNullable(row.patientName),
    formatNullable(row.inpatientNo),
    formatNullable(row.patientGenderLabel),
    formatNullable(row.surgeryName),
    row.specimenName,
    row.specimenConfirmedAt ? '标本确认' : '未确认',
    formatNullable(row.specimenType),
    formatDateTime(row.specimenConfirmedAt),
    formatNullable(operatorForm.operatorName),
    formatDateTime(row.registrationTime),
    formatNullable(row.registrationOperatorName),
  ]);
}

function handleExportExcel() {
  if (!workingRows.value.length) {
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
    '确认时间',
    '确认人',
    '添加时间',
    '添加人',
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
    fileName: `标本确认-${new Date().toISOString().slice(0, 10)}.xls`,
    source: blob,
  });
  ElMessage.success('导出成功');
}

void loadSpecimens();
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

    <div class="flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-4 shadow-sm">
      <div class="flex flex-wrap items-end gap-3">
        <div class="min-w-[220px] flex-1">
          <div class="mb-1 text-sm text-muted-foreground">快速扫描 / 查询</div>
          <ElInput
            v-model="filters.keyword"
            clearable
            placeholder="申请单号 / 标本编号 / 条码，回车立即确认"
            @keyup.enter="tryQuickConfirmByKeyword"
          />
        </div>
        <div class="min-w-[240px]">
          <div class="mb-1 text-sm text-muted-foreground">选择操作人</div>
          <SystemUserSelect
            v-model="operatorForm.operatorUserId"
            :selected-label="operatorForm.operatorName"
            placeholder="请选择操作人"
            @change="handleOperatorChange"
          />
        </div>
        <div class="min-w-[180px]">
          <div class="mb-1 text-sm text-muted-foreground">终端编号</div>
          <ElInput v-model="operatorForm.terminalCode" placeholder="可选" />
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <ElButton :loading="loading" type="primary" @click="handleSearch">查询</ElButton>
        <ElButton :loading="actionLoading" type="success" @click="handleConfirmSelected">
          标本确认
        </ElButton>
        <ElButton @click="handleClearSelectionRows">清除选择行</ElButton>
        <ElButton @click="handleClearList">清除列表</ElButton>
        <ElButton @click="handleRetryLabel">补打标本标签</ElButton>
        <ElButton @click="handleExportExcel">导出Excel</ElButton>
        <ElButton @click="handleReset">重置</ElButton>
      </div>

      <div class="flex flex-wrap items-center gap-4 text-sm">
        <div class="font-semibold text-[color:#d6453d]">标本确认</div>
        <div>全部 <span class="text-xl font-semibold text-primary">{{ summary.allCount }}</span></div>
        <div>标本确认 <span class="text-xl font-semibold text-success">{{ summary.confirmedCount }}</span></div>
        <div>未确认 <span class="text-xl font-semibold text-danger">{{ summary.pendingCount }}</span></div>
      </div>
    </div>

    <div class="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <ElTable
        v-loading="loading"
        :data="pagedItems"
        border
        max-height="520"
        @selection-change="handleSelectionChange"
      >
        <ElTableColumn type="selection" width="52" />
        <ElTableColumn label="序" width="64">
          <template #default="{ $index }">
            {{ (filters.page - 1) * filters.size + $index + 1 }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="申请单" min-width="120" prop="applicationNo" />
        <ElTableColumn label="标本编号" min-width="120" prop="specimenNo" />
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
        <ElTableColumn label="标本名称" min-width="180" prop="specimenName" />
        <ElTableColumn label="标本状态" min-width="120">
          <template #default="{ row }">
            <ElTag :type="row.specimenConfirmedAt ? 'success' : 'danger'">
              {{ row.specimenConfirmedAt ? '标本确认' : '未确认' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="类型" min-width="100">
          <template #default="{ row }">
            {{ formatNullable(row.specimenType) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="确认时间" min-width="140">
          <template #default="{ row }">
            {{ formatDateTime(row.specimenConfirmedAt) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="确认人" min-width="120">
          <template #default>
            {{ formatNullable(operatorForm.operatorName) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="添加时间" min-width="140">
          <template #default="{ row }">
            {{ formatDateTime(row.registrationTime) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="添加人" min-width="120">
          <template #default="{ row }">
            {{ formatNullable(row.registrationOperatorName) }}
          </template>
        </ElTableColumn>
        <ElTableColumn fixed="right" label="操作" width="110">
          <template #default="{ row }">
            <ElButton
              link
              :disabled="!canConfirm(row)"
              type="primary"
              @click="handleConfirmRow(row)"
            >
              标本确认
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </div>

    <div class="flex justify-end">
      <ElPagination
        v-model:current-page="filters.page"
        v-model:page-size="filters.size"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        background
        layout="total, sizes, prev, pager, next"
      />
    </div>
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
              <SystemUserSelect
                v-model="retryForm.operatorUserId"
                :selected-label="retryForm.operatorName"
                placeholder="请选择操作人"
                @change="handleRetryOperatorChange"
              />
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
