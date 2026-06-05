import type { ApplicationRegistrationWorkbenchRecord } from '../types/application-registration-workbench';
import type { LabelPrintRetryResult } from '../types/specimen-workflow';
import type {
  CachedApplicationContext,
  ConfirmationListRow,
} from '../utils/specimen-confirmation';

import { computed, onMounted, reactive, ref } from 'vue';

import { useUserStore } from '@vben/stores';
import { downloadFileFromBlob } from '@vben/utils';

import { ElMessage } from 'element-plus';

import { lookupApplicationRegistrationWorkbenchRecord } from '../api/application-registration-workbench-service';
import {
  confirmSpecimen,
  getApplicationDetail,
  listSpecimens,
  retryLabelPrint,
} from '../api/specimen-workflow-service';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import { loadOperatingRoomNameMapSafely } from '../utils/operating-room-display';
import { loadSpecimensWithApplicationExpansion } from '../utils/specimen-application-expansion';
import {
  buildExportRows as buildConfirmationExportRows,
  buildEnhancedRows,
  buildExportHeaders,
  canConfirm,
  canRetryLabel,
  isVisibleInConfirmationScene,
  MAX_QUERY_SIZE,
  resolveConfirmActionDisabledReason,
  resolveUnavailableMessage,
} from '../utils/specimen-confirmation';
import { useOperatorVerificationPrompt } from './useOperatorVerificationPrompt';

export function useSpecimenConfirmationPanel() {
  const userStore = useUserStore();
  const { verifyOperator } = useOperatorVerificationPrompt();

  const loading = ref(false);
  const actionLoading = ref(false);
  const retrySubmitting = ref(false);
  const pageError = ref('');
  const selectedRows = ref<ConfirmationListRow[]>([]);
  const pendingConfirmationIds = ref<string[]>([]);
  const allRows = ref<ConfirmationListRow[]>([]);
  const workingRows = ref<ConfirmationListRow[]>([]);
  const retryDialogVisible = ref(false);
  const retryTargetRows = ref<ConfirmationListRow[]>([]);
  const batchRetryResult = ref<LabelPrintRetryResult | null>(null);
  const expandedApplicationNo = ref('');

  const workbenchRecordCache = reactive(
    new Map<string, ApplicationRegistrationWorkbenchRecord | null>(),
  );
  const applicationContextCache = reactive(
    new Map<string, CachedApplicationContext | null>(),
  );
  const operatingRoomNameMap = ref<ReadonlyMap<string, string>>(new Map());

  const filters = reactive({
    keyword: '',
    page: 1,
    size: DEFAULT_PAGE_SIZE,
  });

  const operatorForm = reactive({
    loginName:
      (userStore.userInfo as undefined | { loginName?: string })?.loginName ??
      '',
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
    const confirmedCount = workingRows.value.filter((item) =>
      Boolean(item.specimenConfirmedAt),
    ).length;
    return {
      allCount,
      confirmedCount,
      pendingCount: allCount - confirmedCount,
    };
  });

  function syncOperatorFromCurrentUser() {
    operatorForm.loginName =
      (userStore.userInfo as undefined | { loginName?: string })?.loginName ??
      '';
    operatorForm.operatorName = userStore.userInfo?.realName ?? '';
    operatorForm.operatorUserId = userStore.userInfo?.userId ?? '';
  }

  function syncRetryOperatorFromCurrentUser() {
    retryForm.operatorName = userStore.userInfo?.realName ?? '';
    retryForm.operatorUserId = userStore.userInfo?.userId ?? '';
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

  function applyRows(rows: ConfirmationListRow[]) {
    allRows.value = rows;
    workingRows.value = rows;
    selectedRows.value = [];
    if ((filters.page - 1) * filters.size >= rows.length) {
      filters.page = 1;
    }
  }

  async function ensureOperatingRoomNameMapLoaded() {
    if (operatingRoomNameMap.value.size > 0) {
      return operatingRoomNameMap.value;
    }

    operatingRoomNameMap.value = await loadOperatingRoomNameMapSafely();
    return operatingRoomNameMap.value;
  }

  async function loadSpecimens(showEmptyWarning = false) {
    loading.value = true;
    pageError.value = '';
    try {
      const roomNameById = await ensureOperatingRoomNameMapLoaded();
      const keyword = filters.keyword.trim();
      const queryResult = await loadSpecimensWithApplicationExpansion({
        keyword,
        listSpecimens,
        maxQuerySize: MAX_QUERY_SIZE,
      });
      const sourceRows =
        queryResult.mode === 'expanded'
          ? queryResult.items
          : queryResult.items.filter((item) =>
              isVisibleInConfirmationScene(item),
            );

      expandedApplicationNo.value =
        queryResult.mode === 'expanded'
          ? (queryResult.applicationNo ?? '')
          : '';

      if (showEmptyWarning && keyword && sourceRows.length === 0) {
        ElMessage.warning(
          resolveUnavailableMessage(queryResult.initialItems, keyword),
        );
      }
      const enhancedRows = await buildEnhancedRows(
        sourceRows,
        {
          ensureApplicationContext,
          ensureWorkbenchRecord,
          getApplicationContext: (applicationId) =>
            applicationContextCache.get(applicationId) ?? null,
          getWorkbenchRecord: (applicationNo) =>
            workbenchRecordCache.get(applicationNo) ?? null,
        },
        roomNameById,
      );
      applyRows(enhancedRows);
    } catch (error) {
      pageError.value = getWorkflowPageErrorMessage(error);
    } finally {
      loading.value = false;
    }
  }

  async function loadExpandedApplicationRows(applicationNo: string) {
    const normalizedApplicationNo = applicationNo.trim();
    if (!normalizedApplicationNo) {
      return;
    }

    const roomNameById = await ensureOperatingRoomNameMapLoaded();
    const expandedResult = await listSpecimens({
      applicationNo: normalizedApplicationNo,
      page: 1,
      size: MAX_QUERY_SIZE,
    });
    const enhancedRows = await buildEnhancedRows(
      expandedResult.items,
      {
        ensureApplicationContext,
        ensureWorkbenchRecord,
        getApplicationContext: (applicationId) =>
          applicationContextCache.get(applicationId) ?? null,
        getWorkbenchRecord: (applicationNo) =>
          workbenchRecordCache.get(applicationNo) ?? null,
      },
      roomNameById,
    );
    expandedApplicationNo.value = normalizedApplicationNo;
    applyRows(enhancedRows);
  }

  function resolveSelectedOperator() {
    if (
      !operatorForm.operatorName.trim() ||
      !operatorForm.operatorUserId.trim() ||
      !operatorForm.loginName.trim()
    ) {
      ElMessage.warning('请选择操作人');
      return null;
    }
    return {
      id: operatorForm.operatorUserId.trim(),
      loginName: operatorForm.loginName.trim(),
      name: operatorForm.operatorName.trim(),
    };
  }

  function buildConfirmPayload(operatorVerificationToken: string) {
    return {
      operatorName: operatorForm.operatorName.trim(),
      operatorUserId: operatorForm.operatorUserId.trim(),
      operatorVerificationToken,
      remarks: operatorForm.remarks.trim() || null,
      terminalCode: operatorForm.terminalCode.trim() || null,
    };
  }

  function handleOperatorChange(
    user: null | { id: string; loginName?: string; name: string },
  ) {
    operatorForm.operatorUserId = user?.id ?? '';
    operatorForm.operatorName = user?.name ?? '';
    operatorForm.loginName = user?.loginName ?? '';
  }

  function isConfirmationUnsaved(row: ConfirmationListRow) {
    return pendingConfirmationIds.value.includes(row.specimenId);
  }

  function markConfirmationUnsaved(row: ConfirmationListRow) {
    if (pendingConfirmationIds.value.includes(row.specimenId)) {
      return;
    }
    pendingConfirmationIds.value = [
      row.specimenId,
      ...pendingConfirmationIds.value,
    ];
  }

  function clearConfirmationUnsaved(rows: ConfirmationListRow[]) {
    const confirmedIds = new Set(rows.map((row) => row.specimenId));
    pendingConfirmationIds.value = pendingConfirmationIds.value.filter(
      (id) => !confirmedIds.has(id),
    );
  }

  function resolveConfirmationStatus(row: ConfirmationListRow) {
    if (row.specimenConfirmedAt) {
      return '标本确认';
    }
    return isConfirmationUnsaved(row) ? '确认未保存' : '未确认';
  }

  async function confirmRows(rows: ConfirmationListRow[]) {
    if (rows.length === 0) {
      ElMessage.warning('请先选择需要确认的标本');
      return;
    }
    const selectedOperator = resolveSelectedOperator();
    if (!selectedOperator) {
      return;
    }

    const pendingRows = rows.filter((row) => canConfirm(row));
    if (pendingRows.length === 0) {
      const firstDisabledReason = rows
        .map((row) => resolveConfirmActionDisabledReason(row))
        .find(Boolean);
      ElMessage.warning(firstDisabledReason ?? '当前所选标本均已确认');
      return;
    }

    actionLoading.value = true;
    pageError.value = '';
    try {
      const operatorVerificationToken = await verifyOperator(selectedOperator);
      if (!operatorVerificationToken) {
        return;
      }
      const payload = buildConfirmPayload(operatorVerificationToken);
      await Promise.all(
        pendingRows.map((row) =>
          confirmSpecimen(row.barcode || row.specimenId, payload),
        ),
      );
      clearConfirmationUnsaved(pendingRows);
      ElMessage.success(`已完成 ${pendingRows.length} 条标本确认`);
      await (expandedApplicationNo.value
        ? loadExpandedApplicationRows(expandedApplicationNo.value)
        : loadSpecimens());
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

    const normalizedKeyword = keyword.toLowerCase();
    const matchedRows = allRows.value.filter((row) => {
      const candidates = [row.applicationNo, row.specimenNo, row.barcode];
      return candidates.some(
        (value) => value?.trim().toLowerCase() === normalizedKeyword,
      );
    });

    const [matchedRow] = matchedRows;
    if (matchedRows.length === 1 && matchedRow) {
      const matchedApplicationNo = matchedRow.applicationNo.trim();
      filters.keyword = '';
      if (matchedApplicationNo) {
        await loadExpandedApplicationRows(matchedApplicationNo);
      }

      const currentMatchedRow =
        allRows.value.find((row) => row.specimenId === matchedRow.specimenId) ??
        matchedRow;

      if (currentMatchedRow && canConfirm(currentMatchedRow)) {
        markConfirmationUnsaved(currentMatchedRow);
        ElMessage.success('已加入确认未保存');
        return;
      }

      ElMessage.warning(
        resolveConfirmActionDisabledReason(currentMatchedRow) ?? '标本已确认',
      );
      return;
    }

    if (matchedRows.length > 1) {
      ElMessage.warning('匹配到多条标本，请先筛选后再确认');
      handleSearch();
      return;
    }

    await loadSpecimens(true);
    const refreshedMatchedRow = allRows.value.find((row) =>
      [row.applicationNo, row.specimenNo, row.barcode].some(
        (value) => value?.trim().toLowerCase() === normalizedKeyword,
      ),
    );
    if (refreshedMatchedRow && canConfirm(refreshedMatchedRow)) {
      markConfirmationUnsaved(refreshedMatchedRow);
      filters.keyword = '';
      ElMessage.success('已加入确认未保存');
    }
  }

  function handleSearch() {
    filters.page = 1;
    void loadSpecimens(true);
  }

  function handleReset() {
    filters.keyword = '';
    filters.page = 1;
    filters.size = DEFAULT_PAGE_SIZE;
    operatorForm.remarks = '';
    operatorForm.terminalCode = '';
    pendingConfirmationIds.value = [];
    syncOperatorFromCurrentUser();
    void loadSpecimens();
  }

  function handleSelectionChange(rows: ConfirmationListRow[]) {
    selectedRows.value = rows;
  }

  function handleConfirmSelected() {
    const targetRows =
      selectedRows.value.length > 0
        ? selectedRows.value
        : workingRows.value.filter((row) => isConfirmationUnsaved(row));
    void confirmRows(targetRows);
  }

  function handleConfirmRow(row: ConfirmationListRow) {
    void confirmRows([row]);
  }

  function handleClearSelectionRows() {
    const selectedSpecimenIds = new Set(
      selectedRows.value.map((item) => item.specimenId),
    );
    if (selectedSpecimenIds.size === 0) {
      ElMessage.warning('请先勾选需要清除的行');
      return;
    }

    workingRows.value = workingRows.value.filter(
      (item) => !selectedSpecimenIds.has(item.specimenId),
    );
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
    if (rows.length === 0) {
      ElMessage.warning('请先选择需要补打标签的标本');
      return;
    }

    const retryableRows = rows.filter((row) => canRetryLabel(row));
    if (retryableRows.length === 0) {
      ElMessage.warning('所选标本没有可补打的标签批次');
      return;
    }

    const batchNos = [
      ...new Set(
        retryableRows
          .map((item) => item.labelPrintBatchNo?.trim())
          .filter(Boolean),
      ),
    ];

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

  function handleExportExcel() {
    if (workingRows.value.length === 0) {
      ElMessage.warning('当前没有可导出的标本数据');
      return;
    }

    const tableRows = [
      buildExportHeaders(),
      ...buildConfirmationExportRows(workingRows.value),
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
      fileName: `标本确认-${new Date().toISOString().slice(0, 10)}.xls`,
      source: blob,
    });
    ElMessage.success('导出成功');
  }

  onMounted(() => {
    void loadSpecimens();
  });

  return {
    actionLoading,
    batchRetryResult,
    canConfirm,
    filters,
    handleClearList,
    handleClearSelectionRows,
    handleConfirmRow,
    handleConfirmSelected,
    handleExportExcel,
    handleOperatorChange,
    handleReset,
    handleRetryLabel,
    handleSearch,
    handleSelectionChange,
    loadSpecimens,
    loading,
    operatorForm,
    pageError,
    pagedItems,
    resolveConfirmationStatus,
    retryDialogVisible,
    retryForm,
    retrySubmitting,
    retryTargetRows,
    selectedRows,
    submitRetryLabel,
    summary,
    total,
    tryQuickConfirmByKeyword,
  };
}
