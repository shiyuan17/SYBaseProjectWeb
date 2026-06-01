import type { SpecimenManagementListItem } from '../types/specimen-workflow';

import { computed, reactive, ref } from 'vue';

import { useUserStore } from '@vben/stores';
import { downloadFileFromBlob } from '@vben/utils';

import { ElMessage } from 'element-plus';

import {
  checkInSpecimen,
  listSpecimens,
  retryLabelPrint,
} from '../api/specimen-workflow-service';
import { getWorkflowPageErrorMessage } from '../utils/error';
import { formatSpecimenStatus } from '../utils/format';
import {
  isCheckInReady as isCheckInReadyValue,
  resolveExactMatches,
  resolveUnavailableMessage,
} from '../utils/specimen-check-in';
import {
  loadOperatingRoomNameMapSafely,
  resolveOperatingRoomDisplayName,
} from '../utils/operating-room-display';

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
  '类型',
  '入库时间',
  '入库人',
  '添加时间',
  '添加人',
] as const;

export type CheckInQueueItem = SpecimenManagementListItem & {
  checkedInAt?: null | string;
  checkedInByName?: null | string;
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

  function buildQueueItem(row: SpecimenManagementListItem): CheckInQueueItem {
    return {
      ...row,
      queueAddedAt: new Date().toISOString(),
      queueAddedByName:
        operatorForm.operatorName.trim() || userStore.userInfo?.realName || '-',
      queueStatus: row.checkInStatus === 'CHECKED_IN' ? 'SUCCESS' : 'PENDING',
    };
  }

  async function upsertQueueItem(row: SpecimenManagementListItem) {
    const roomNameById = await ensureOperatingRoomNameMapLoaded();
    const normalizedRow = {
      ...row,
      surgeryName: normalizeSurgeryName(row, roomNameById),
    };
    const index = queueItems.value.findIndex(
      (item) => item.specimenId === normalizedRow.specimenId,
    );
    const nextRow = buildQueueItem(normalizedRow);
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

  function isCheckInReady(row: SpecimenManagementListItem) {
    return isCheckInReadyValue(row);
  }

  async function loadMatchingSpecimens(keyword: string) {
    const result = await listSpecimens({
      keyword,
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

  async function performCheckIn(row: SpecimenManagementListItem) {
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
    if (!isCheckInReady(row)) {
      ElMessage.warning(
        resolveUnavailableMessage([row], row.barcode || row.specimenNo),
      );
      return;
    }

    const queueRow = await upsertQueueItem(row);
    queueRow.queueStatus = 'PENDING';

    actionLoading.value = true;
    pageError.value = '';
    try {
      const result = await checkInSpecimen(row.barcode, buildCheckInPayload(row));
      queueRow.checkInStatus = 'CHECKED_IN';
      queueRow.checkedInAt = result.checkedInAt ?? new Date().toISOString();
      queueRow.checkedInByName =
        result.checkedInByName ?? operatorForm.operatorName.trim();
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
      if (!isCheckInReady(row)) {
        ElMessage.warning(resolveUnavailableMessage(exactMatches, keyword));
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

      await upsertQueueItem(row);
      await performCheckIn(row);
      scanInput.value = '';
    } catch (error) {
      pageError.value = getWorkflowPageErrorMessage(error);
    } finally {
      loading.value = false;
    }
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
    pageError.value = '';
    operatorForm.operatorName = userStore.userInfo?.realName ?? '';
    operatorForm.operatorUserId = userStore.userInfo?.userId ?? '';
    operatorForm.remarks = '';
    operatorForm.terminalCode = '';
    operatorForm.printerCode = '';
  }

  function canBatchOperate(row: CheckInQueueItem) {
    return row.queueStatus !== 'SUCCESS';
  }

  async function handleBatchCheckIn() {
    const targets = selectedRows.value.filter((row) => canBatchOperate(row));
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
    pageError.value = '';
    try {
      await retryLabelPrint(batchNos[0] || '', {
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
        resolveExportValue(row.surgeryName),
        resolveExportValue(row.specimenName),
        resolveExportValue(formatSpecimenStatus(row.specimenStatus)),
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
      pageError.value = getWorkflowPageErrorMessage(error);
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
