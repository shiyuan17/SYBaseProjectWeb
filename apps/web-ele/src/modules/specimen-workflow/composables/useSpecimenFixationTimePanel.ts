import type { ApplicationRegistrationWorkbenchRecord } from '../types/application-registration-workbench';
import type {
  LabelPrintRetryResult,
  SpecimenManagementListItem,
} from '../types/specimen-workflow';
import type {
  CachedApplicationContext,
  FixationWorkbenchRow,
} from '../utils/specimen-fixation-time';

import { computed, onMounted, reactive, ref } from 'vue';

import { useUserStore } from '@vben/stores';
import { downloadFileFromBlob } from '@vben/utils';

import { ElMessage } from 'element-plus';

import {
  createEmptyWorkflowReferenceOptions,
  loadWorkflowReferenceOptionsSafely,
} from '#/modules/system-management/api/workflow-reference-service';

import { lookupApplicationRegistrationWorkbenchRecord } from '../api/application-registration-workbench-service';
import {
  completeFixation,
  getApplicationDetail,
  listSpecimens,
  retryLabelPrint,
} from '../api/specimen-workflow-service';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  buildExportRows as buildFixationExportRows,
  buildQueueRow as buildFixationQueueRow,
  DEFAULT_FIXATION_LIQUID_TYPE,
  isReceiptLocked as isReceiptLockedValue,
  isVisibleInFixationScene as isVisibleInFixationSceneValue,
  MAX_QUERY_SIZE,
  normalizeText as normalizeFixationText,
  normalizeGenderLabel,
  resolveExactMatches as resolveExactFixationMatches,
  resolveFixationLiquidLabel as resolveFixationLiquidLabelValue,
  resolveFixationTagType as resolveFixationTagTypeValue,
} from '../utils/specimen-fixation-time';
import { loadOperatingRoomNameMapSafely } from '../utils/operating-room-display';

export function useSpecimenFixationTimePanel() {
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
  const operatingRoomNameMap = ref<ReadonlyMap<string, string>>(new Map());

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
    return normalizeFixationText(value);
  }

  function resolveFixationTagType(status: null | string | undefined) {
    return resolveFixationTagTypeValue(status);
  }

  function resolveFixationLiquidLabel(value: null | string | undefined) {
    return resolveFixationLiquidLabelValue(
      value,
      workflowReferenceOptions.value.fixationLiquidTypes,
    );
  }

  async function ensureReferenceOptionsLoaded() {
    workflowReferenceOptions.value = await loadWorkflowReferenceOptionsSafely({
      enabled: true,
    });
    if (!normalizeText(fixationLiquidType.value)) {
      fixationLiquidType.value =
        workflowReferenceOptions.value.fixationLiquidTypes[0]?.value ??
        DEFAULT_FIXATION_LIQUID_TYPE;
    }
  }

  async function ensureOperatingRoomNameMapLoaded() {
    if (operatingRoomNameMap.value.size > 0) {
      return operatingRoomNameMap.value;
    }

    operatingRoomNameMap.value = await loadOperatingRoomNameMapSafely();
    return operatingRoomNameMap.value;
  }

  function isReceiptLocked(row: SpecimenManagementListItem) {
    return isReceiptLockedValue(row);
  }

  function isVisibleInFixationScene(row: SpecimenManagementListItem) {
    return isVisibleInFixationSceneValue(row);
  }

  function resolveExactMatches(
    items: SpecimenManagementListItem[],
    keyword: string,
  ) {
    return resolveExactFixationMatches(items, keyword);
  }

  function resolveUnavailableMessage(
    items: SpecimenManagementListItem[],
    keyword: string,
  ) {
    const exactMatches = resolveExactMatches(items, keyword);
    const targetItems = exactMatches.length > 0 ? exactMatches : items;
    if (
      targetItems.some(
        (item) => normalizeText(item.verificationStatus) !== 'VERIFIED',
      )
    ) {
      return '标本尚未完成离体确认，请先完成离体确认后再固定';
    }
    if (targetItems.some((item) => isReceiptLocked(item))) {
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
    roomNameById: ReadonlyMap<string, string>,
  ): FixationWorkbenchRow {
    const queueAddedByName = normalizeText(userStore.userInfo?.realName) || '-';
    const queueAddedAt = new Date().toISOString();
    const baseRow = buildFixationQueueRow(
      row,
      applicationContext,
      workbenchRecord,
      {
        queueAddedAt,
        queueAddedByName,
      },
      roomNameById,
    );
    return {
      ...baseRow,
      patientGenderLabel: normalizeGenderLabel(
        applicationContext?.patientGender ??
          workbenchRecord?.patientInfo.gender,
      ),
    };
  }

  async function buildEnrichedRow(row: SpecimenManagementListItem) {
    const roomNameById = await ensureOperatingRoomNameMapLoaded();
    const [applicationContext, workbenchRecord] = await Promise.all([
      ensureApplicationContext(row.applicationId),
      ensureWorkbenchRecord(row.applicationNo),
    ]);

    return buildQueueRow(
      row,
      applicationContext,
      workbenchRecord,
      roomNameById,
    );
  }

  function handleSelectionChange(rows: FixationWorkbenchRow[]) {
    selectedRows.value = rows;
  }

  function removeRows(specimenIds: string[]) {
    const targetSet = new Set(specimenIds);
    queueItems.value = queueItems.value.filter(
      (item) => !targetSet.has(item.specimenId),
    );
    selectedRows.value = selectedRows.value.filter(
      (item) => !targetSet.has(item.specimenId),
    );
  }

  function upsertQueueRow(row: FixationWorkbenchRow) {
    const existingIndex = queueItems.value.findIndex(
      (item) => item.specimenId === row.specimenId,
    );
    if (existingIndex !== -1) {
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
      const visibleRows = listResult.items.filter((item) =>
        isVisibleInFixationScene(item),
      );
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

      const existingRow = queueItems.value.find(
        (item) => item.specimenId === matchedRow.specimenId,
      );
      if (existingRow) {
        ElMessage.warning('该标本已在当前列表中');
        scanInput.value = '';
        return;
      }

      const result = await completeFixation({
        fixationLiquidType: selectedFixationLiquidType,
        remarks: '扫码完成固定',
        specimenBarcode: matchedRow.barcode || matchedRow.specimenNo,
      });
      const completedAt =
        result.fixationCompletedAt ?? new Date().toISOString();
      const nextRow = await buildEnrichedRow({
        ...matchedRow,
        fixationCompletedAt: completedAt,
        fixationLiquidType:
          result.fixationLiquidType ?? selectedFixationLiquidType,
        fixationOperatorName: result.operatorName ?? operatorName,
        fixationOperatorUserId: result.operatorUserId ?? null,
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
    return selectedRows.value.length > 0
      ? selectedRows.value
      : queueItems.value;
  }

  function handleRetryLabel() {
    const targets = resolveRetryTargets();
    if (targets.length === 0) {
      ElMessage.warning('当前没有可补打的标本');
      return;
    }

    const batchNos = [
      ...new Set(
        targets
          .map((item) => normalizeText(item.labelPrintBatchNo))
          .filter(Boolean),
      ),
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

  function getSpecimenRemovalTime(applicationId: string) {
    return (
      applicationContextCache.get(normalizeText(applicationId))
        ?.specimenRemovalTime ?? null
    );
  }

  function buildExportRows() {
    return buildFixationExportRows(queueItems.value, {
      getSpecimenRemovalTime,
      resolveFixationLiquidLabel(value) {
        return resolveFixationLiquidLabelValue(
          value,
          workflowReferenceOptions.value.fixationLiquidTypes,
        );
      },
    });
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

  return {
    batchRetryResult,
    buildExportRows,
    fixationLiquidType,
    getSpecimenRemovalTime,
    handleClearList,
    handleClearSelectionRows,
    handleCompleteFixationByScan,
    handleExportExcel,
    handleRetryLabel,
    handleSelectionChange,
    loading,
    pageError,
    queueItems,
    resolveFixationLiquidLabel,
    resolveFixationTagType,
    retryDialogVisible,
    retryForm,
    retrySubmitting,
    retryTargetRows,
    scanInput,
    selectedCount,
    selectedRows,
    submitRetryLabel,
    workflowReferenceOptions,
  };
}
