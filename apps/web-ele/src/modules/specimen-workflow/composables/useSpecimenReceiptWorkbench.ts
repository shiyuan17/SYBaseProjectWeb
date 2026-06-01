import type { ApplicationRegistrationWorkbenchRecord } from '../types/application-registration-workbench';
import type {
  LabelPrintRetryResult,
  PendingSpecimenItem,
} from '../types/specimen-workflow';
import type {
  ReceiptWorkbenchApplicationContext,
  ReceiptWorkbenchRow,
} from '../utils/specimen-receipt-workbench';

import { computed, reactive, ref } from 'vue';

import { useUserStore } from '@vben/stores';
import { downloadFileFromBlob } from '@vben/utils';

import { ElMessage } from 'element-plus';

import { lookupApplicationRegistrationWorkbenchRecord } from '../api/application-registration-workbench-service';
import {
  getApplicationDetail,
  listPendingReceipts,
  listSpecimens,
  receiveSpecimens,
  retryLabelPrint,
} from '../api/specimen-workflow-service';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  buildReceiptWorkbenchExportHeaders,
  buildReceiptWorkbenchExportRows,
  createReceiptWorkbenchRow,
  RECEIPT_WORKBENCH_MAX_QUERY_SIZE,
  resolveReceiptWorkbenchExactMatches,
} from '../utils/specimen-receipt-workbench';
import { loadOperatingRoomNameMapSafely } from '../utils/operating-room-display';

export function useSpecimenReceiptWorkbench() {
  const userStore = useUserStore();

  const receiveLoading = ref(false);
  const retrySubmitting = ref(false);
  const exportLoading = ref(false);
  const lookupLoading = ref(false);
  const pageError = ref('');
  const queueItems = ref<ReceiptWorkbenchRow[]>([]);
  const scanInput = ref('');
  const selectedRowKeys = ref<string[]>([]);
  const retryDialogVisible = ref(false);
  const retryTargetRows = ref<ReceiptWorkbenchRow[]>([]);
  const batchRetryResult = ref<LabelPrintRetryResult | null>(null);

  const applicationContextCache = reactive(
    new Map<string, ReceiptWorkbenchApplicationContext | null>(),
  );
  const workbenchRecordCache = reactive(
    new Map<string, ApplicationRegistrationWorkbenchRecord | null>(),
  );
  const operatingRoomNameMap = ref<ReadonlyMap<string, string>>(new Map());

  const operatorForm = reactive({
    operatorName: userStore.userInfo?.realName ?? '',
    operatorUserId: userStore.userInfo?.userId ?? '',
  });

  const retryForm = reactive({
    operatorName: userStore.userInfo?.realName ?? '',
    operatorUserId: userStore.userInfo?.userId ?? '',
    printerCode: '',
    remarks: '',
    terminalCode: '',
  });

  const selectedRows = computed(() =>
    queueItems.value.filter((item) => selectedRowKeys.value.includes(item.specimenId)),
  );

  const selectedCount = computed(() => selectedRows.value.length);
  const receivedCount = computed(
    () => queueItems.value.filter((item) => item.queueStatus === 'SUCCESS').length,
  );

  function syncRetryOperator() {
    retryForm.operatorName =
      operatorForm.operatorName.trim() || userStore.userInfo?.realName || '';
    retryForm.operatorUserId =
      operatorForm.operatorUserId.trim() || userStore.userInfo?.userId || '';
    retryForm.printerCode = '';
    retryForm.remarks = '';
    retryForm.terminalCode = '';
  }

  function handleOperatorChange(user: null | { id: string; name: string }) {
    operatorForm.operatorUserId = user?.id ?? '';
    operatorForm.operatorName = user?.name ?? '';
  }

  function handleSelectionChange(rows: ReceiptWorkbenchRow[]) {
    selectedRowKeys.value = rows.map((item) => item.specimenId);
  }

  async function ensureOperatingRoomNameMapLoaded() {
    if (operatingRoomNameMap.value.size > 0) {
      return operatingRoomNameMap.value;
    }

    operatingRoomNameMap.value = await loadOperatingRoomNameMapSafely();
    return operatingRoomNameMap.value;
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
      const context: ReceiptWorkbenchApplicationContext = {
        patientGender: detail.patientGender ?? null,
        patientId: detail.patientId ?? null,
      };
      applicationContextCache.set(normalizedApplicationId, context);
      return context;
    } catch {
      applicationContextCache.set(normalizedApplicationId, null);
      return null;
    }
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

  function resolveExactPendingItem(
    items: PendingSpecimenItem[],
    specimenId: string,
    specimenNo: string,
    barcode: string,
  ) {
    const normalizedSpecimenId = specimenId.trim().toUpperCase();
    const normalizedSpecimenNo = specimenNo.trim().toUpperCase();
    const normalizedBarcode = barcode.trim().toUpperCase();

    return items.find((item) =>
      [item.specimenId, item.specimenNo, item.barcode].some(
        (value) =>
          value?.trim().toUpperCase() === normalizedSpecimenId ||
          value?.trim().toUpperCase() === normalizedSpecimenNo ||
          value?.trim().toUpperCase() === normalizedBarcode,
      ),
    );
  }

  async function handleQueueSpecimen() {
    const keyword = scanInput.value.trim();
    if (!keyword) {
      return;
    }

    lookupLoading.value = true;
    pageError.value = '';
    try {
      const specimenPage = await listSpecimens({
        keyword,
        page: 1,
        size: RECEIPT_WORKBENCH_MAX_QUERY_SIZE,
      });
      const exactMatches = resolveReceiptWorkbenchExactMatches(
        specimenPage.items,
        keyword,
      );

      if (exactMatches.length === 0) {
        ElMessage.warning('未找到对应标本');
        return;
      }
      if (exactMatches.length > 1) {
        ElMessage.warning('匹配到多条标本，请检查标本ID后重试');
        return;
      }

      const matchedSpecimen = exactMatches[0];
      if (!matchedSpecimen) {
        return;
      }

      if (
        queueItems.value.some((item) => item.specimenId === matchedSpecimen.specimenId)
      ) {
        ElMessage.warning('该标本已在当前列表中');
        return;
      }

      const pendingPage = await listPendingReceipts({
        page: 1,
        size: RECEIPT_WORKBENCH_MAX_QUERY_SIZE,
        specimenNo: matchedSpecimen.specimenNo,
      });
      const pendingItem = resolveExactPendingItem(
        pendingPage.items,
        matchedSpecimen.specimenId,
        matchedSpecimen.specimenNo,
        matchedSpecimen.barcode,
      );

      if (!pendingItem) {
        ElMessage.warning('当前标本不在待签收范围');
        return;
      }
      if (!pendingItem.transportOrderId?.trim()) {
        ElMessage.warning('当前标本尚未关联转运单，不能在病理接收页签收');
        return;
      }

      const [applicationContext, workbenchRecord] = await Promise.all([
        ensureApplicationContext(matchedSpecimen.applicationId),
        ensureWorkbenchRecord(matchedSpecimen.applicationNo),
      ]);
      const roomNameById = await ensureOperatingRoomNameMapLoaded();

      queueItems.value.unshift(
        createReceiptWorkbenchRow(
          matchedSpecimen,
          pendingItem,
          applicationContext,
          workbenchRecord,
          operatorForm.operatorName.trim() || userStore.userInfo?.realName || '',
          roomNameById,
        ),
      );
      scanInput.value = '';
    } catch (error) {
      pageError.value = getWorkflowPageErrorMessage(error);
    } finally {
      lookupLoading.value = false;
    }
  }

  function requireOperator() {
    if (!operatorForm.operatorName.trim() || !operatorForm.operatorUserId.trim()) {
      ElMessage.warning('请选择操作人');
      return false;
    }
    return true;
  }

  async function handleReceiveSelected() {
    const targets = selectedRows.value.filter((item) => item.queueStatus !== 'SUCCESS');
    if (targets.length === 0) {
      ElMessage.warning('请先选择待签收标本');
      return;
    }
    if (!requireOperator()) {
      return;
    }

    receiveLoading.value = true;
    pageError.value = '';
    const groupedRows = new Map<string, ReceiptWorkbenchRow[]>();
    for (const row of targets) {
      if (!row.transportOrderId?.trim()) {
        row.queueStatus = 'FAILED';
        continue;
      }
      const existing = groupedRows.get(row.transportOrderId) ?? [];
      existing.push(row);
      groupedRows.set(row.transportOrderId, existing);
    }

    let successGroups = 0;
    let failureGroups = 0;

    try {
      for (const [transportOrderId, rows] of groupedRows.entries()) {
        try {
          await receiveSpecimens({
            items: rows.map((row) => ({
              containerCount: row.containerCount ?? 1,
              qualityCheckResult: 'PASSED',
              receiptStatus: 'RECEIVED',
              specimenBarcode: row.barcode,
            })),
            receivedByName: operatorForm.operatorName.trim(),
            receivedByUserId: operatorForm.operatorUserId.trim(),
            terminalCode: null,
            transportOrderId,
          });

          const receivedAt = new Date().toISOString();
          for (const row of rows) {
            row.queueStatus = 'SUCCESS';
            row.receivedAt = receivedAt;
            row.receivedByName = operatorForm.operatorName.trim();
            row.specimenStatus = 'RECEIVED';
          }
          successGroups += 1;
        } catch (error) {
          failureGroups += 1;
          pageError.value = getWorkflowPageErrorMessage(error);
          for (const row of rows) {
            row.queueStatus = 'FAILED';
          }
        }
      }

      if (successGroups > 0 && failureGroups === 0) {
        ElMessage.success('标本签收成功');
      } else if (successGroups > 0) {
        ElMessage.warning('部分标本签收失败，请检查提示后重试');
      }
    } finally {
      receiveLoading.value = false;
    }
  }

  function removeRows(specimenIds: string[]) {
    const targetSet = new Set(specimenIds);
    queueItems.value = queueItems.value.filter(
      (item) => !targetSet.has(item.specimenId),
    );
    selectedRowKeys.value = selectedRowKeys.value.filter(
      (item) => !targetSet.has(item),
    );
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
    selectedRowKeys.value = [];
    ElMessage.success('列表已清空');
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

    const batchNos = [
      ...new Set(targets.map((item) => item.labelPrintBatchNo?.trim()).filter(Boolean)),
    ];

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
    syncRetryOperator();
    retryDialogVisible.value = true;
  }

  async function submitRetryLabel() {
    const batchNo = retryTargetRows.value[0]?.labelPrintBatchNo?.trim();
    if (!batchNo) {
      ElMessage.warning('缺少标签批次号');
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
        printerCode: retryForm.printerCode.trim(),
        remarks: retryForm.remarks.trim() || null,
        terminalCode: retryForm.terminalCode.trim() || null,
      });
      ElMessage.success('补打标本标签已提交');
    } catch (error) {
      pageError.value = getWorkflowPageErrorMessage(error);
    } finally {
      retrySubmitting.value = false;
    }
  }

  function handleExportExcel() {
    if (queueItems.value.length === 0) {
      ElMessage.warning('当前没有可导出的标本数据');
      return;
    }

    exportLoading.value = true;
    try {
      const tableRows = [
        buildReceiptWorkbenchExportHeaders(),
        ...buildReceiptWorkbenchExportRows(queueItems.value),
      ];
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
        fileName: `病理接收-${new Date().toISOString().slice(0, 10)}.xls`,
        source: blob,
      });
      ElMessage.success('导出成功');
    } catch (error) {
      pageError.value = getWorkflowPageErrorMessage(error);
    } finally {
      exportLoading.value = false;
    }
  }

  return {
    batchRetryResult,
    exportLoading,
    handleClearList,
    handleClearSelectionRows,
    handleExportExcel,
    handleOperatorChange,
    handleQueueSpecimen,
    handleReceiveSelected,
    handleRetryLabel,
    handleSelectionChange,
    lookupLoading,
    operatorForm,
    pageError,
    queueItems,
    receiveLoading,
    receivedCount,
    retryDialogVisible,
    retryForm,
    retrySubmitting,
    retryTargetRows,
    scanInput,
    selectedCount,
    selectedRows,
    submitRetryLabel,
  };
}
