import type {
  ApplicationRegistrationWorkbenchRecord,
  OperatingBuildingOption,
  WorkbenchSpecimenItem,
  WorkbenchSpecimenPrintContext,
} from '../types/application-registration-workbench';
import type {
  LabelPrintRetryResult,
  SpecimenManagementListItem,
  SpecimenManagementListSummary,
} from '../types/specimen-workflow';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { useUserStore } from '@vben/stores';
import { downloadFileFromBlob } from '@vben/utils';

import { ElMessage, ElMessageBox } from 'element-plus';

import {
  listOperatingBuildingOptions,
  lookupApplicationRegistrationWorkbenchRecord,
} from '../api/application-registration-workbench-service';
import {
  bindSpecimenBarcode,
  listSpecimens,
  retryLabelPrint,
  unbindSpecimenBarcode,
} from '../api/specimen-workflow-service';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import { formatDateTime, formatNullable } from '../utils/format';
import {
  buildOperatingRoomNameMap,
  resolveOperatingRoomDisplayName,
} from '../utils/operating-room-display';
import { buildSpecimenBatchPrintDocument } from '../utils/specimen-print';

const MAX_QUERY_SIZE = 500;

type OperatingRoomSelectOption = {
  buildingName: string;
  roomId: string;
  roomName: string;
};

function normalizeText(value?: null | string) {
  return value?.trim() ?? '';
}

function createEmptySummary(): SpecimenManagementListSummary {
  return {
    abnormalCount: 0,
    labelPrintedCount: 0,
    pendingLabelCount: 0,
    totalCount: 0,
    unboundCount: 0,
  };
}

function isBoundRow(row: SpecimenManagementListItem) {
  return (
    row.barcodeBindingStatus === 'BOUND' || Boolean(normalizeText(row.barcode))
  );
}

function normalizeGenderLabel(value?: null | string) {
  const normalizedValue = normalizeText(value).toUpperCase();
  if (normalizedValue === 'F' || normalizedValue === '女') {
    return '女';
  }
  if (normalizedValue === 'M' || normalizedValue === '男') {
    return '男';
  }
  return normalizeText(value);
}

export function useSpecimenBarcodeBindingPanel() {
  const userStore = useUserStore();

  const loading = ref(false);
  const actionLoading = ref(false);
  const retrySubmitting = ref(false);
  const pageError = ref('');
  const allRows = ref<SpecimenManagementListItem[]>([]);
  const selectedRows = ref<SpecimenManagementListItem[]>([]);
  const summary = ref<SpecimenManagementListSummary>(createEmptySummary());
  const targetBarcode = ref('');
  const buildingOptions = ref<OperatingBuildingOption[]>([]);
  const workbenchRecordCache = reactive(
    new Map<string, ApplicationRegistrationWorkbenchRecord | null>(),
  );

  const retryDialogVisible = ref(false);
  const retryTargetRows = ref<SpecimenManagementListItem[]>([]);
  const batchRetryResult = ref<LabelPrintRetryResult | null>(null);

  const filters = reactive({
    buildingId: '',
    dateRange: [] as string[],
    onlyUnbound: false,
    page: 1,
    roomId: '',
    size: DEFAULT_PAGE_SIZE,
  });

  const retryForm = reactive({
    operatorName: userStore.userInfo?.realName ?? '',
    operatorUserId: userStore.userInfo?.userId ?? '',
    printerCode: '',
    remarks: '',
    terminalCode: '',
  });

  const roomNameById = computed(() =>
    buildOperatingRoomNameMap(buildingOptions.value),
  );

  const roomOptions = computed<OperatingRoomSelectOption[]>(() => {
    const normalizedBuildingId = normalizeText(filters.buildingId);
    const rooms = normalizedBuildingId
      ? buildingOptions.value.filter(
          (item) => item.buildingId === normalizedBuildingId,
        )
      : buildingOptions.value;

    return rooms.flatMap((building) =>
      building.operatingRooms.map((room) => ({
        buildingName: normalizeText(building.buildingName),
        roomId: room.roomId,
        roomName: room.roomName,
      })),
    );
  });

  const pagedItems = computed(() => {
    const startIndex = (filters.page - 1) * filters.size;
    return allRows.value.slice(startIndex, startIndex + filters.size);
  });

  const total = computed(() => allRows.value.length);

  const selectedSingleRow = computed(() =>
    selectedRows.value.length === 1 ? (selectedRows.value[0] ?? null) : null,
  );

  const canBind = computed(() => {
    const row = selectedSingleRow.value;
    return Boolean(
      row && !isBoundRow(row) && normalizeText(targetBarcode.value),
    );
  });

  const canUnbind = computed(() => {
    const row = selectedSingleRow.value;
    return Boolean(row && isBoundRow(row));
  });

  const retryBatchNo = computed(() => {
    if (selectedRows.value.length === 0) {
      return '';
    }
    const batchNos = [
      ...new Set(
        selectedRows.value
          .map((row) => normalizeText(row.labelPrintBatchNo))
          .filter(Boolean),
      ),
    ];
    return batchNos.length === 1 &&
      selectedRows.value.every(
        (row) => normalizeText(row.labelPrintBatchNo) === batchNos[0],
      )
      ? (batchNos[0] ?? '')
      : '';
  });

  const canRetryLabel = computed(
    () => selectedRows.value.length > 0 && Boolean(retryBatchNo.value),
  );

  const canPreprint = computed(() => selectedRows.value.length > 0);
  const canPrintBoundBarcodes = computed(
    () =>
      selectedRows.value.length > 0 &&
      selectedRows.value.every(
        (row) => isBoundRow(row) && normalizeText(row.barcode),
      ),
  );
  const canExportExcel = computed(() => allRows.value.length > 0);

  watch(
    () => filters.buildingId,
    () => {
      filters.roomId = '';
    },
  );

  function syncRetryOperatorFromCurrentUser() {
    retryForm.operatorName = userStore.userInfo?.realName ?? '';
    retryForm.operatorUserId = userStore.userInfo?.userId ?? '';
  }

  function enhanceRows(items: SpecimenManagementListItem[]) {
    return items.map((item) => ({
      ...item,
      surgeryName: resolveOperatingRoomDisplayName(
        roomNameById.value,
        item.roomId,
        item.surgeryName,
      ),
    }));
  }

  async function loadOperatingOptions() {
    try {
      buildingOptions.value = await listOperatingBuildingOptions();
    } catch (error) {
      pageError.value = getWorkflowPageErrorMessage(error);
      buildingOptions.value = [];
    }
  }

  async function loadSpecimens() {
    loading.value = true;
    pageError.value = '';
    try {
      const [dateFrom, dateTo] =
        filters.dateRange.length === 2 ? filters.dateRange : [];
      const result = await listSpecimens({
        barcodeBindingStatus: filters.onlyUnbound ? 'UNBOUND' : undefined,
        buildingId: normalizeText(filters.buildingId) || undefined,
        dateFrom: normalizeText(dateFrom) || undefined,
        dateTo: normalizeText(dateTo) || undefined,
        page: 1,
        roomId: normalizeText(filters.roomId) || undefined,
        size: MAX_QUERY_SIZE,
      });
      summary.value = result.summary;
      allRows.value = enhanceRows(result.items);
      selectedRows.value = [];
      if ((filters.page - 1) * filters.size >= allRows.value.length) {
        filters.page = 1;
      }
    } catch (error) {
      pageError.value = getWorkflowPageErrorMessage(error);
    } finally {
      loading.value = false;
    }
  }

  function handleSearch() {
    filters.page = 1;
    void loadSpecimens();
  }

  function handleReset() {
    filters.buildingId = '';
    filters.dateRange = [];
    filters.onlyUnbound = false;
    filters.page = 1;
    filters.roomId = '';
    filters.size = DEFAULT_PAGE_SIZE;
    targetBarcode.value = '';
    void loadSpecimens();
  }

  function handleSelectionChange(rows: SpecimenManagementListItem[]) {
    selectedRows.value = rows;
  }

  async function handleBindBarcode() {
    const row = selectedSingleRow.value;
    if (!row || !canBind.value) {
      ElMessage.warning('请选择 1 条未绑定标本并输入目标条码');
      return;
    }

    actionLoading.value = true;
    pageError.value = '';
    try {
      await bindSpecimenBarcode(row.specimenId, {
        remarks: null,
        targetBarcode: normalizeText(targetBarcode.value),
        terminalCode: null,
      });
      ElMessage.success('条码绑定成功');
      targetBarcode.value = '';
      await loadSpecimens();
    } catch (error) {
      pageError.value = getWorkflowPageErrorMessage(error);
    } finally {
      actionLoading.value = false;
    }
  }

  async function handleUnbindBarcode() {
    const row = selectedSingleRow.value;
    if (!row || !canUnbind.value) {
      ElMessage.warning('请选择 1 条已绑定标本');
      return;
    }

    try {
      await ElMessageBox.confirm(
        `确认取消标本 ${row.specimenNo} 的条码绑定吗？`,
        '取消绑定',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        },
      );
    } catch {
      return;
    }

    actionLoading.value = true;
    pageError.value = '';
    try {
      await unbindSpecimenBarcode(row.specimenId, {
        remarks: null,
        terminalCode: null,
      });
      ElMessage.success('取消绑定成功');
      await loadSpecimens();
    } catch (error) {
      pageError.value = getWorkflowPageErrorMessage(error);
    } finally {
      actionLoading.value = false;
    }
  }

  function handleRetryLabel() {
    if (selectedRows.value.length === 0) {
      ElMessage.warning('请先勾选需要补打标签的标本');
      return;
    }
    if (!retryBatchNo.value) {
      ElMessage.warning('补打标本标签仅支持同一标签批次');
      return;
    }

    retryTargetRows.value = [...selectedRows.value];
    batchRetryResult.value = null;
    syncRetryOperatorFromCurrentUser();
    retryForm.printerCode = '';
    retryForm.remarks = '';
    retryForm.terminalCode = '';
    retryDialogVisible.value = true;
  }

  async function submitRetryLabel() {
    if (!retryBatchNo.value) {
      ElMessage.warning('缺少标签批次号');
      return;
    }
    if (!normalizeText(retryForm.printerCode)) {
      ElMessage.warning('请输入打印机编号');
      return;
    }

    retrySubmitting.value = true;
    pageError.value = '';
    try {
      batchRetryResult.value = await retryLabelPrint(retryBatchNo.value, {
        printerCode: normalizeText(retryForm.printerCode),
        remarks: normalizeText(retryForm.remarks) || null,
        terminalCode: normalizeText(retryForm.terminalCode) || null,
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
    return allRows.value.map((row, index) => [
      String(index + 1),
      row.applicationNo,
      row.specimenNo,
      formatNullable(row.barcode),
      formatNullable(normalizeGenderLabel(row.patientGender) || null),
      formatNullable(row.surgeryName),
      row.specimenName,
      formatNullable(row.specimenType),
      formatDateTime(row.registeredAt),
      formatNullable(row.registrationOperatorName),
      formatNullable(row.patientId),
      formatNullable(row.patientName),
    ]);
  }

  function handleExportExcel() {
    if (!canExportExcel.value) {
      ElMessage.warning('当前没有可导出的标本数据');
      return;
    }

    const headers = [
      '序',
      '申请单',
      '标本编号',
      '标本条码',
      '性别',
      '手术间',
      '标本名称',
      '类型',
      '添加时间',
      '添加人',
      '病人ID',
      '姓名',
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
      fileName: `条码绑定-${new Date().toISOString().slice(0, 10)}.xls`,
      source: blob,
    });
    ElMessage.success('导出成功');
  }

  function openPrintWindow(documentHtml: string) {
    const printWindow = window.open('', '_blank', 'width=960,height=760');
    if (!printWindow) {
      ElMessage.warning('打印窗口被浏览器拦截，请允许弹窗后重试');
      return null;
    }

    printWindow.document.open();
    printWindow.document.write(documentHtml);
    printWindow.document.close();
    return printWindow;
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

  function buildPrintContext(
    row: SpecimenManagementListItem,
    record: ApplicationRegistrationWorkbenchRecord | null,
  ): WorkbenchSpecimenPrintContext {
    return {
      applyDept:
        normalizeText(record?.patientInfo.applyDept) ||
        normalizeText(row.submittingDepartmentName) ||
        '-',
      gender:
        normalizeText(record?.patientInfo.gender) ||
        normalizeGenderLabel(row.patientGender) ||
        '-',
      idNo:
        normalizeText(record?.patientInfo.idNo) ||
        normalizeText(row.patientId) ||
        row.applicationNo,
      patientName:
        normalizeText(record?.patientInfo.patientName) ||
        normalizeText(row.patientName) ||
        '-',
      roomLabel: resolveOperatingRoomDisplayName(
        roomNameById.value,
        normalizeText(record?.surgeryInfo.roomId) || row.roomId,
        normalizeText(record?.surgeryInfo.surgeryName) || row.surgeryName,
      ),
      surgeryTime:
        normalizeText(record?.surgeryInfo.specimenRemovalTime) ||
        normalizeText(record?.surgeryInfo.fixationTime) ||
        normalizeText(row.registeredAt) ||
        '-',
    };
  }

  function buildPrintItem(
    row: SpecimenManagementListItem,
    options?: { includeBarcode: boolean },
  ): WorkbenchSpecimenItem {
    const includeBarcode = options?.includeBarcode ?? false;

    return {
      barcode: includeBarcode
        ? normalizeText(row.barcode) || undefined
        : undefined,
      id: row.specimenId,
      quantity: row.specimenCount ?? 1,
      specimenName: row.specimenName,
      specimenNo: row.specimenNo,
      specimenSite: normalizeText(row.specimenSite),
      status: row.specimenStatus ?? '',
    };
  }

  async function printRowsByApplication(
    rowsToPrint: SpecimenManagementListItem[],
    options: { includeBarcode: boolean },
    successMessage: string,
  ) {
    const groupedRows = new Map<string, SpecimenManagementListItem[]>();
    for (const row of rowsToPrint) {
      const rows = groupedRows.get(row.applicationNo) ?? [];
      rows.push(row);
      groupedRows.set(row.applicationNo, rows);
    }

    for (const rows of groupedRows.values()) {
      const sampleRow = rows[0];
      if (!sampleRow) {
        continue;
      }
      const record = await ensureWorkbenchRecord(sampleRow.applicationNo);
      const documentHtml = buildSpecimenBatchPrintDocument({
        context: buildPrintContext(sampleRow, record),
        items: rows.map((row) => buildPrintItem(row, options)),
      });
      if (!openPrintWindow(documentHtml)) {
        return;
      }
    }

    ElMessage.success(successMessage);
  }

  async function handlePreprintBarcodes() {
    if (selectedRows.value.length === 0) {
      ElMessage.warning('请先勾选需要预打印的标本');
      return;
    }

    pageError.value = '';
    try {
      await printRowsByApplication(
        selectedRows.value,
        { includeBarcode: false },
        '已打开预打印窗口',
      );
    } catch (error) {
      pageError.value = getWorkflowPageErrorMessage(error);
    }
  }

  async function handlePrintBoundBarcodes() {
    if (selectedRows.value.length === 0) {
      ElMessage.warning('请先勾选需要打印的已绑定标本');
      return;
    }
    if (!canPrintBoundBarcodes.value) {
      ElMessage.warning('仅支持打印已绑定且存在条码的标本');
      return;
    }

    pageError.value = '';
    try {
      await printRowsByApplication(
        selectedRows.value,
        { includeBarcode: true },
        '已打开条码打印窗口',
      );
    } catch (error) {
      pageError.value = getWorkflowPageErrorMessage(error);
    }
  }

  function resolveRoomLabel(room: OperatingRoomSelectOption) {
    return room.buildingName
      ? `${room.buildingName} - ${room.roomName}`
      : room.roomName;
  }

  onMounted(async () => {
    await loadOperatingOptions();
    await loadSpecimens();
  });

  return {
    actionLoading,
    allRows,
    batchRetryResult,
    buildingOptions,
    canBind,
    canExportExcel,
    canPrintBoundBarcodes,
    canPreprint,
    canRetryLabel,
    canUnbind,
    filters,
    handleBindBarcode,
    handleExportExcel,
    handlePreprintBarcodes,
    handlePrintBoundBarcodes,
    handleReset,
    handleRetryLabel,
    handleSearch,
    handleSelectionChange,
    handleUnbindBarcode,
    loading,
    pageError,
    pagedItems,
    resolveRoomLabel,
    retryDialogVisible,
    retryForm,
    retrySubmitting,
    retryTargetRows,
    roomOptions,
    selectedRows,
    submitRetryLabel,
    summary,
    targetBarcode,
    total,
  };
}
