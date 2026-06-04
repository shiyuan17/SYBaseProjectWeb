import type { SpecimenManagementListItem } from '../types/specimen-workflow';
import type { CheckInBlockingStep } from '../utils/specimen-check-in';

import { computed, reactive, ref } from 'vue';

import { useUserStore } from '@vben/stores';
import { downloadFileFromBlob } from '@vben/utils';

import { ElMessage } from 'element-plus';

import { reportInlineErrorDisabled } from '#/utils/error-feedback';

import {
  checkInSpecimen,
  listSpecimens,
  retryLabelPrint,
} from '../api/specimen-workflow-service';
import { getWorkflowPageErrorMessage } from '../utils/error';
import { formatSpecimenStatus } from '../utils/format';
import {
  loadOperatingRoomNameMapSafely,
  resolveOperatingRoomDisplayName,
} from '../utils/operating-room-display';
import {
  isCheckInReady as isCheckInReadyValue,
  resolveCheckInReadiness,
  resolveExactMatches,
  resolveUnavailableMessage,
} from '../utils/specimen-check-in';

const MAX_QUERY_SIZE = 100;
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
  '入库状态',
  '类型',
  '入库时间',
  '入库人',
  '添加时间',
  '添加人',
] as const;

export type CheckInQueueItem = SpecimenManagementListItem & {
  canCheckIn: boolean;
  checkedInAt?: null | string;
  checkedInByName?: null | string;
  checkInDisabledReason: null | string;
  checkInStatusTagType: 'info' | 'success' | 'warning';
  displayCheckInStatus: string;
  queueAddedAt: string;
  queueAddedByName: string;
  queueStatus: 'FAILED' | 'PENDING' | 'SUCCESS';
};

export function useSpecimenCheckInPanel() {
  const userStore = useUserStore();

  const loading = ref(false);
  const actionLoading = ref(false);
  const exportLoading = ref(false);
  const retryLoading = ref(false);
  const pageError = ref('');
  const scanInput = ref('');
  const queueItems = ref<CheckInQueueItem[]>([]);
  const operatingRoomNameMap = ref<ReadonlyMap<string, string>>(new Map());
  const selectedRowKeys = ref<string[]>([]);

  const operatorForm = reactive({
    operatorName: userStore.userInfo?.realName ?? '',
    operatorUserId: userStore.userInfo?.userId ?? '',
    remarks: '',
    terminalCode: '',
    printerCode: '',
  });

  const selectedRows = computed(() =>
    queueItems.value.filter((item) =>
      selectedRowKeys.value.includes(item.specimenId),
    ),
  );

  const selectedCount = computed(() => selectedRows.value.length);

  const pendingCount = computed(
    () =>
      queueItems.value.filter((item) => item.queueStatus !== 'SUCCESS').length,
  );

  async function ensureOperatingRoomNameMapLoaded() {
    if (operatingRoomNameMap.value.size > 0) {
      return operatingRoomNameMap.value;
    }

    operatingRoomNameMap.value = await loadOperatingRoomNameMapSafely();
    return operatingRoomNameMap.value;
  }

  function normalizeSurgeryName(
    row: SpecimenManagementListItem,
    roomNameById: ReadonlyMap<string, string>,
  ) {
    return resolveOperatingRoomDisplayName(
      roomNameById,
      row.roomId,
      row.surgeryName,
    );
  }

  function resolveBlockingStatusLabel(
    row: SpecimenManagementListItem,
    blockingStep: CheckInBlockingStep | null,
  ) {
    if (blockingStep === 'CHECKED_IN') {
      return '已入库';
    }
    if (blockingStep === 'RECEIPT_TERMINAL') {
      if (row.specimenStatus === 'RECEIVED') {
        return '已接收';
      }
      if (row.specimenStatus === 'REJECTED') {
        return '已拒收';
      }
      if (row.specimenStatus === 'RETURNED') {
        return '已退回';
      }
      return '流程已结束';
    }
    if (blockingStep === 'VERIFICATION') {
      return '待核对';
    }
    if (blockingStep === 'FIXATION') {
      return '待固定';
    }
    if (blockingStep === 'CONFIRMATION') {
      return '待标本确认';
    }
    return '待处理';
  }

  function resolveCheckInTagType(
    canCheckIn: boolean,
    blockingStep: CheckInBlockingStep | null,
  ) {
    if (blockingStep === 'CHECKED_IN') {
      return 'success' as const;
    }
    if (canCheckIn) {
      return 'info' as const;
    }
    return 'warning' as const;
  }

  function resolveDisplayCheckInStatus(
    row: SpecimenManagementListItem,
    isCheckedIn: boolean,
    canCheckIn: boolean,
    blockingStep: CheckInBlockingStep | null,
  ) {
    if (blockingStep === 'RECEIPT_TERMINAL') {
      return resolveBlockingStatusLabel(row, blockingStep);
    }
    if (isCheckedIn) {
      return '已入库';
    }
    if (canCheckIn) {
      return '待入库';
    }
    return resolveBlockingStatusLabel(row, blockingStep);
  }

  function buildQueueItem(
    row: SpecimenManagementListItem,
    applicationRows: SpecimenManagementListItem[] = [row],
  ): CheckInQueueItem {
    const readiness = resolveCheckInReadiness(row, applicationRows);
    const isCheckedIn = row.checkInStatus === 'CHECKED_IN';
    return {
      ...row,
      canCheckIn: readiness.canCheckIn,
      checkedInAt: row.checkedInAt,
      checkedInByName: row.checkedInByName,
      checkInDisabledReason: readiness.reason,
      checkInStatusTagType: resolveCheckInTagType(
        readiness.canCheckIn,
        readiness.blockingStep,
      ),
      displayCheckInStatus: resolveDisplayCheckInStatus(
        row,
        isCheckedIn,
        readiness.canCheckIn,
        readiness.blockingStep,
      ),
      queueAddedAt: new Date().toISOString(),
      queueAddedByName:
        operatorForm.operatorName.trim() || userStore.userInfo?.realName || '-',
      queueStatus: isCheckedIn ? 'SUCCESS' : 'PENDING',
    };
  }

  async function upsertQueueItems(rows: SpecimenManagementListItem[]) {
    return Promise.all(rows.map((row) => upsertQueueItem(row, rows)));
  }

  async function upsertQueueItem(
    row: SpecimenManagementListItem,
    applicationRows: SpecimenManagementListItem[] = [row],
  ) {
    const roomNameById = await ensureOperatingRoomNameMapLoaded();
    const normalizedRow = {
      ...row,
      surgeryName: normalizeSurgeryName(row, roomNameById),
    };
    const index = queueItems.value.findIndex(
      (item) => item.specimenId === normalizedRow.specimenId,
    );
    const nextRow = buildQueueItem(normalizedRow, applicationRows);
    if (index !== -1) {
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
    queueItems.value = queueItems.value.filter(
      (item) => !targetSet.has(item.specimenId),
    );
    selectedRowKeys.value = selectedRowKeys.value.filter(
      (item) => !targetSet.has(item),
    );
  }

  function clearSelection() {
    removeQueueItems(selectedRowKeys.value);
  }

  function clearQueue() {
    queueItems.value = [];
    selectedRowKeys.value = [];
  }

  function isCheckInReady(
    row: SpecimenManagementListItem,
    applicationRows?: SpecimenManagementListItem[],
  ) {
    return isCheckInReadyValue(row, applicationRows);
  }

  async function loadMatchingSpecimens(keyword: string) {
    const result = await listSpecimens({
      keyword,
      page: 1,
      size: MAX_QUERY_SIZE,
    });

    return result.items;
  }

  async function loadApplicationSpecimens(applicationNo: string) {
    const result = await listSpecimens({
      applicationNo,
      page: 1,
      size: MAX_QUERY_SIZE,
    });

    return result.items;
  }

  function buildCheckInPayload(row: SpecimenManagementListItem) {
    return {
      operatorName: operatorForm.operatorName.trim(),
      operatorUserId: operatorForm.operatorUserId.trim(),
      remarks: operatorForm.remarks.trim() || null,
      specimenBarcode: row.barcode ?? '',
      terminalCode: operatorForm.terminalCode.trim() || null,
    };
  }

  function handleOperatorChange(user: null | { id: string; name: string }) {
    operatorForm.operatorUserId = user?.id ?? '';
    operatorForm.operatorName = user?.name ?? '';
  }

  async function performCheckIn(
    row: SpecimenManagementListItem,
    applicationRows?: SpecimenManagementListItem[],
  ) {
    if (
      !operatorForm.operatorName.trim() ||
      !operatorForm.operatorUserId.trim()
    ) {
      ElMessage.warning('缺少当前操作人信息');
      return;
    }
    if (!row.barcode) {
      ElMessage.warning('当前标本缺少条码，无法入库');
      return;
    }
    const resolvedApplicationRows =
      applicationRows ?? (await loadApplicationSpecimens(row.applicationNo));
    if (!isCheckInReady(row, resolvedApplicationRows)) {
      ElMessage.warning(
        resolveUnavailableMessage(
          resolvedApplicationRows,
          row.barcode || row.specimenNo,
        ),
      );
      return;
    }

    const queueRow = await upsertQueueItem(row, resolvedApplicationRows);
    queueRow.queueStatus = 'PENDING';

    actionLoading.value = true;
    try {
      const result = await checkInSpecimen(
        row.barcode,
        buildCheckInPayload(row),
      );
      queueRow.checkInStatus = 'CHECKED_IN';
      queueRow.specimenStatus = 'CHECKED_IN';
      queueRow.checkedInAt = result.checkedInAt ?? new Date().toISOString();
      queueRow.checkedInByName =
        result.checkedInByName ?? operatorForm.operatorName.trim();
      queueRow.canCheckIn = false;
      queueRow.checkInDisabledReason = '标本已完成入库，无需重复操作';
      queueRow.checkInStatusTagType = 'success';
      queueRow.displayCheckInStatus = '已入库';
      queueRow.queueStatus = 'SUCCESS';
      ElMessage.success('标本入库成功');
    } catch (error) {
      queueRow.queueStatus = 'FAILED';
      reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
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
    try {
      const items = await loadMatchingSpecimens(keyword);
      const exactMatches = resolveExactMatches(items, keyword);
      if (exactMatches.length === 0) {
        ElMessage.warning(resolveUnavailableMessage(items, keyword));
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
      const applicationRows = await loadApplicationSpecimens(row.applicationNo);
      await upsertQueueItems(applicationRows);
      if (!isCheckInReady(row, applicationRows)) {
        ElMessage.warning(resolveUnavailableMessage(applicationRows, keyword));
        return;
      }

      const existingRow = queueItems.value.find(
        (item) => item.specimenId === row.specimenId,
      );
      if (existingRow?.checkInStatus === 'CHECKED_IN') {
        ElMessage.warning('标本已完成入库，无需重复操作');
        scanInput.value = '';
        return;
      }

      await performCheckIn(row, applicationRows);
      scanInput.value = '';
    } catch (error) {
      reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
    } finally {
      loading.value = false;
    }
  }

  async function handlePrimaryCheckIn() {
    if (scanInput.value.trim()) {
      await handleQuickCheckIn();
      return;
    }

    await handleBatchCheckIn();
  }

  function handleSelectionChange(rows: CheckInQueueItem[]) {
    selectedRowKeys.value = rows.map((item) => item.specimenId);
  }

  async function handleManualCheckIn(row: CheckInQueueItem) {
    await performCheckIn(row);
  }

  function handleRemoveRow(row: CheckInQueueItem) {
    removeQueueItems([row.specimenId]);
  }

  function handleReset() {
    scanInput.value = '';
    clearQueue();
    operatorForm.operatorName = userStore.userInfo?.realName ?? '';
    operatorForm.operatorUserId = userStore.userInfo?.userId ?? '';
    operatorForm.remarks = '';
    operatorForm.terminalCode = '';
    operatorForm.printerCode = '';
  }

  function canBatchOperate(row: CheckInQueueItem) {
    return row.queueStatus !== 'SUCCESS' && row.canCheckIn;
  }

  function resolveBatchUnavailableMessage(rows: CheckInQueueItem[]) {
    if (
      rows.every(
        (row) =>
          row.queueStatus === 'SUCCESS' || row.checkInStatus === 'CHECKED_IN',
      )
    ) {
      return '所选标本已完成入库，无需重复操作';
    }

    return (
      rows.find((row) => row.checkInDisabledReason)?.checkInDisabledReason ??
      '所选标本当前不可入库'
    );
  }

  async function handleBatchCheckIn() {
    const selectedTargets = selectedRows.value;
    if (selectedTargets.length === 0) {
      ElMessage.warning('请先选择需要入库的标本');
      return;
    }

    const targets = selectedTargets.filter((row) => canBatchOperate(row));
    if (targets.length === 0) {
      ElMessage.warning(resolveBatchUnavailableMessage(selectedTargets));
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
    const fallbackBatchNos = [
      ...new Set(
        queueItems.value.map((row) => row.labelPrintBatchNo).filter(Boolean),
      ),
    ];
    const targets =
      selectedTargets.length > 0
        ? selectedTargets
        : queueItems.value.filter(
            (row) => row.labelPrintBatchNo === fallbackBatchNos[0],
          );
    if (targets.length === 0) {
      ElMessage.warning('请先选择需要补打的标本');
      return;
    }

    const batchNos = [
      ...new Set(targets.map((row) => row.labelPrintBatchNo).filter(Boolean)),
    ];
    if (batchNos.length !== 1) {
      ElMessage.warning('仅支持同一标签批次补打');
      return;
    }
    if (!operatorForm.printerCode.trim()) {
      ElMessage.warning('请输入打印机编号');
      return;
    }

    retryLoading.value = true;
    try {
      await retryLabelPrint(batchNos[0] || '', {
        printerCode: operatorForm.printerCode.trim(),
        remarks: operatorForm.remarks.trim() || null,
        terminalCode: operatorForm.terminalCode.trim() || null,
      });
      ElMessage.success('补打已提交');
    } catch (error) {
      reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
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
        resolveExportValue(row.surgeryName),
        resolveExportValue(row.specimenName),
        resolveExportValue(formatSpecimenStatus(row.specimenStatus)),
        resolveExportValue(row.displayCheckInStatus),
        resolveExportValue(row.specimenType),
        resolveExportValue(row.checkedInAt),
        resolveExportValue(row.checkedInByName),
        resolveExportValue(row.queueAddedAt),
        resolveExportValue(row.queueAddedByName),
      ]);
      const csv = [EXPORT_HEADERS, ...rows]
        .map((line) =>
          line
            .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
            .join(','),
        )
        .join('\n');
      downloadFileFromBlob({
        fileName: `specimen-check-in-${new Date().toISOString().slice(0, 10)}.csv`,
        source: new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }),
      });
      ElMessage.success('导出成功');
    } catch (error) {
      reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
    } finally {
      exportLoading.value = false;
    }
  }

  return {
    actionLoading,
    clearQueue,
    clearSelection,
    exportLoading,
    formatSpecimenStatus,
    handleBatchCheckIn,
    handleExport,
    handleManualCheckIn,
    handleOperatorChange,
    handlePrimaryCheckIn,
    handleQuickCheckIn,
    handleRemoveRow,
    handleReset,
    handleRetryLabelPrint,
    handleSelectionChange,
    isCheckInReady,
    loading,
    operatorForm,
    pageError,
    pendingCount,
    queueItems,
    retryLoading,
    scanInput,
    selectedCount,
    selectedRows,
  };
}
