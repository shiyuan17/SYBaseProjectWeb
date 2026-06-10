import type { ApplicationRegistrationWorkbenchRecord } from '../types/application-registration-workbench';
import type {
  LabelPrintRetryResult,
  PendingSpecimenItem,
  SpecimenManagementListItem,
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
  directReceiveSpecimens,
  getApplicationDetail,
  listPendingReceipts,
  listSpecimens,
  receiveSpecimens,
  retryLabelPrint,
} from '../api/specimen-workflow-service';
import { getWorkflowPageErrorMessage } from '../utils/error';
import { loadOperatingRoomNameMapSafely } from '../utils/operating-room-display';
import {
  buildDirectReceiptSubmissionRequest,
  buildReceiptSubmissionRequest,
  createDefaultReceiptConfirmFormState,
  createDefaultReceiptFormState,
  createReceiptDraftItem,
  isReceiptDraftDerivedAbnormal,
  validateReceiptItems,
} from '../utils/specimen-receipt';
import {
  buildReceiptWorkbenchExportHeaders,
  buildReceiptWorkbenchExportRows,
  createReceiptWorkbenchRow,
  isReceiptWorkbenchRowReceivable,
  RECEIPT_WORKBENCH_MAX_QUERY_SIZE,
  resolveReceiptWorkbenchExactMatches,
} from '../utils/specimen-receipt-workbench';

export function useSpecimenReceiptWorkbench() {
  const userStore = useUserStore();

  const receiveLoading = ref(false);
  const retrySubmitting = ref(false);
  const exportLoading = ref(false);
  const lookupLoading = ref(false);
  const pageError = ref('');
  const receiveDialogVisible = ref(false);
  const receiveTargetRows = ref<ReceiptWorkbenchRow[]>([]);
  const queueItems = ref<ReceiptWorkbenchRow[]>([]);
  const scanInput = ref('');
  const selectedRowKeys = ref<string[]>([]);
  const retryDialogVisible = ref(false);
  const retryTargetRows = ref<ReceiptWorkbenchRow[]>([]);
  const batchRetryResult = ref<LabelPrintRetryResult | null>(null);
  const directReceiveDialogVisible = ref(false);
  const directReceiveSubmitting = ref(false);
  const directReceiveItems = ref([createReceiptDraftItem()]);

  const applicationContextCache = reactive(
    new Map<string, null | ReceiptWorkbenchApplicationContext>(),
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
  const directReceiveForm = reactive(
    createDefaultReceiptFormState(
      userStore.userInfo?.realName ?? '',
      userStore.userInfo?.userId ?? '',
    ),
  );
  const receiveForm = reactive(
    createDefaultReceiptConfirmFormState(
      userStore.userInfo?.realName ?? '',
      userStore.userInfo?.userId ?? '',
    ),
  );

  const selectedRows = computed(() =>
    queueItems.value.filter((item) =>
      selectedRowKeys.value.includes(item.specimenId),
    ),
  );
  const selectedReceivableRows = computed(() =>
    selectedRows.value.filter((item) => isReceiptWorkbenchRowReceivable(item)),
  );
  const receiveSummary = computed(() => {
    const applicationKeys = new Set<string>();
    const patientKeys = new Set<string>();

    for (const row of receiveTargetRows.value) {
      const applicationKey =
        row.applicationId.trim() || row.applicationNo.trim();
      if (applicationKey) {
        applicationKeys.add(applicationKey);
      }

      const patientKey =
        row.patientIdLabel.trim() ||
        row.patientName?.trim() ||
        row.applicationId.trim();
      if (patientKey) {
        patientKeys.add(patientKey);
      }
    }

    return {
      applicationCount: applicationKeys.size,
      patientCount: patientKeys.size,
      specimenCount: receiveTargetRows.value.length,
    };
  });

  const selectedCount = computed(() => selectedReceivableRows.value.length);
  const selectedRowCount = computed(() => selectedRows.value.length);
  const receivedCount = computed(
    () =>
      queueItems.value.filter((item) => item.queueStatus === 'SUCCESS').length,
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

  function syncReceiveOperator() {
    receiveForm.logisticsStaffName = '';
    receiveForm.receivedByName =
      operatorForm.operatorName.trim() || userStore.userInfo?.realName || '';
    receiveForm.receivedByUserId =
      operatorForm.operatorUserId.trim() || userStore.userInfo?.userId || '';
  }

  function handleReceiveUserChange(user: null | { id: string; name: string }) {
    receiveForm.receivedByUserId = user?.id ?? '';
    receiveForm.receivedByName = user?.name ?? '';
  }

  function syncDirectReceiveOperator() {
    directReceiveForm.receivedByName =
      operatorForm.operatorName.trim() || userStore.userInfo?.realName || '';
    directReceiveForm.receivedByUserId =
      operatorForm.operatorUserId.trim() || userStore.userInfo?.userId || '';
    directReceiveForm.terminalCode = '';
  }

  function handleSelectionChange(rows: ReceiptWorkbenchRow[]) {
    selectedRowKeys.value = rows.map((item) => item.specimenId);
  }

  function resolvePendingItemBySpecimenId(
    items: PendingSpecimenItem[],
    specimen: SpecimenManagementListItem,
  ) {
    return (
      items.find((item) => item.specimenId === specimen.specimenId) ??
      resolveExactPendingItem(
        items,
        specimen.specimenId,
        specimen.specimenNo,
        specimen.barcode ?? '',
      ) ??
      null
    );
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

  function createSpecimenItemFromPending(
    pending: PendingSpecimenItem,
  ): SpecimenManagementListItem {
    return {
      abnormalFlag: pending.abnormalFlag,
      abnormalType: pending.abnormalType ?? null,
      applicationId: pending.applicationId,
      applicationNo: pending.applicationNo,
      barcode: pending.barcode,
      checkInStatus: pending.checkInStatus ?? null,
      checkedInAt: pending.checkedInAt ?? null,
      checkedInByName: pending.checkedInByName ?? null,
      containerCount: pending.containerCount,
      containerName: pending.containerName,
      fixationCompletedAt: pending.fixationCompletedAt ?? null,
      fixationLiquidType: pending.fixationLiquidType ?? null,
      fixationOperatorName: pending.fixationOperatorName ?? null,
      fixationOperatorUserId: pending.fixationOperatorUserId ?? null,
      fixationStartedAt: pending.fixationStartedAt ?? null,
      fixationStatus: pending.fixationStatus,
      labelPrintBatchNo: null,
      labelPrintStatus: null,
      latestTrackingAt: pending.latestTrackingAt,
      patientName: pending.patientName,
      registeredAt: pending.registeredAt,
      specimenConfirmedAt: pending.specimenConfirmedAt ?? null,
      specimenCount: pending.containerCount,
      specimenId: pending.specimenId,
      specimenName: '',
      specimenNo: pending.specimenNo,
      specimenSite: null,
      specimenStatus: pending.specimenStatus,
      specimenType: null,
      submittingDepartmentId: pending.submittingDepartmentId,
      submittingDepartmentName: pending.submittingDepartmentName,
      verificationCompletedAt: pending.verificationCompletedAt ?? null,
      verificationStartedAt: pending.verificationStartedAt ?? null,
      verificationStatus: pending.verificationStatus ?? null,
    };
  }

  function resolveSpecimenItemByPending(
    items: SpecimenManagementListItem[],
    pending: PendingSpecimenItem,
  ) {
    const normalizedSpecimenId = pending.specimenId.trim().toUpperCase();
    const normalizedSpecimenNo = pending.specimenNo.trim().toUpperCase();
    const normalizedBarcode = (pending.barcode ?? '').trim().toUpperCase();

    return (
      items.find((item) =>
        [item.specimenId, item.specimenNo, item.barcode ?? ''].some(
          (value) =>
            value.trim().toUpperCase() === normalizedSpecimenId ||
            value.trim().toUpperCase() === normalizedSpecimenNo ||
            value.trim().toUpperCase() === normalizedBarcode,
        ),
      ) ?? createSpecimenItemFromPending(pending)
    );
  }

  async function loadPendingReceiptRows() {
    lookupLoading.value = true;
    pageError.value = '';
    try {
      const pendingPage = await listPendingReceipts({
        page: 1,
        size: RECEIPT_WORKBENCH_MAX_QUERY_SIZE,
      });
      const applicationNos = [
        ...new Set(
          pendingPage.items
            .map((item) => item.applicationNo.trim())
            .filter(Boolean),
        ),
      ];
      const applicationSpecimensByNo = new Map<
        string,
        SpecimenManagementListItem[]
      >();

      await Promise.all(
        applicationNos.map(async (applicationNo) => {
          const specimenPage = await listSpecimens({
            applicationNo,
            page: 1,
            size: RECEIPT_WORKBENCH_MAX_QUERY_SIZE,
          });
          applicationSpecimensByNo.set(applicationNo, specimenPage.items);
        }),
      );

      const roomNameById = await ensureOperatingRoomNameMapLoaded();
      const queueAddedByName =
        operatorForm.operatorName.trim() || userStore.userInfo?.realName || '';
      const rows = await Promise.all(
        pendingPage.items.map(async (pending) => {
          const applicationSpecimens =
            applicationSpecimensByNo.get(pending.applicationNo.trim()) ?? [];
          const [applicationContext, workbenchRecord] = await Promise.all([
            ensureApplicationContext(pending.applicationId),
            ensureWorkbenchRecord(pending.applicationNo),
          ]);

          return createReceiptWorkbenchRow(
            resolveSpecimenItemByPending(applicationSpecimens, pending),
            pending,
            applicationContext,
            workbenchRecord,
            queueAddedByName,
            roomNameById,
          );
        }),
      );

      queueItems.value = rows;
      selectedRowKeys.value = [];
    } catch (error) {
      pageError.value = getWorkflowPageErrorMessage(error);
    } finally {
      lookupLoading.value = false;
    }
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

      const [
        applicationSpecimensPage,
        pendingPage,
        applicationContext,
        workbenchRecord,
      ] = await Promise.all([
        listSpecimens({
          applicationNo: matchedSpecimen.applicationNo,
          page: 1,
          size: RECEIPT_WORKBENCH_MAX_QUERY_SIZE,
        }),
        listPendingReceipts({
          applicationId: matchedSpecimen.applicationId,
          page: 1,
          size: RECEIPT_WORKBENCH_MAX_QUERY_SIZE,
        }),
        ensureApplicationContext(matchedSpecimen.applicationId),
        ensureWorkbenchRecord(matchedSpecimen.applicationNo),
      ]);
      const roomNameById = await ensureOperatingRoomNameMapLoaded();
      const queueAddedByName =
        operatorForm.operatorName.trim() || userStore.userInfo?.realName || '';
      const applicationSpecimens = applicationSpecimensPage.items.filter(
        (item) => item.applicationNo === matchedSpecimen.applicationNo,
      );
      const queuedRows = applicationSpecimens.map((item) =>
        createReceiptWorkbenchRow(
          item,
          resolvePendingItemBySpecimenId(pendingPage.items, item),
          applicationContext,
          workbenchRecord,
          queueAddedByName,
          roomNameById,
        ),
      );

      if (queuedRows.length === 0) {
        ElMessage.warning('当前申请单暂无标本列表');
      }

      queueItems.value = queuedRows;
      selectedRowKeys.value = [];
      scanInput.value = '';
    } catch (error) {
      pageError.value = getWorkflowPageErrorMessage(error);
    } finally {
      lookupLoading.value = false;
    }
  }

  function requireOperator() {
    if (
      !operatorForm.operatorName.trim() ||
      !operatorForm.operatorUserId.trim()
    ) {
      ElMessage.warning('请选择操作人');
      return false;
    }
    return true;
  }

  function requireReceiveForm() {
    if (!receiveForm.logisticsStaffName.trim()) {
      ElMessage.warning('请输入物流人员');
      return false;
    }
    if (
      !receiveForm.receivedByName.trim() ||
      !receiveForm.receivedByUserId.trim()
    ) {
      ElMessage.warning('请选择签收人员');
      return false;
    }
    return true;
  }

  function buildDirectReceiveItemsFromRows(rows: ReceiptWorkbenchRow[]) {
    return rows.map((row) => ({
      ...createReceiptDraftItem(row.barcode ?? '', {
        specimenId: row.specimenId,
        specimenNo: row.specimenNo,
      }),
      applicationNo: row.applicationNo,
      containerCount: row.containerCount ?? 1,
      containerName: row.containerName,
      patientName: row.patientName,
      specimenBarcode: row.barcode ?? '',
      specimenId: row.specimenId,
      specimenNo: row.specimenNo,
    }));
  }

  function collectReceiptItemKeys(item: {
    barcode?: null | string;
    specimenBarcode?: null | string;
    specimenId?: null | string;
    specimenNo?: null | string;
  }) {
    return [
      item.specimenId,
      item.specimenBarcode ?? item.barcode,
      item.specimenNo,
    ]
      .map((value) => value?.trim())
      .filter((value): value is string => value !== undefined && value !== '');
  }

  function openDirectReceiveDrawer() {
    const sourceRows =
      selectedRows.value.length > 0
        ? selectedRows.value.filter((item) =>
            isReceiptWorkbenchRowReceivable(item),
          )
        : queueItems.value.filter((item) =>
            isReceiptWorkbenchRowReceivable(item),
          );
    directReceiveItems.value =
      sourceRows.length > 0
        ? buildDirectReceiveItemsFromRows(sourceRows)
        : [createReceiptDraftItem()];
    syncDirectReceiveOperator();
    directReceiveDialogVisible.value = true;
  }

  function closeReceiveDialog() {
    receiveDialogVisible.value = false;
    receiveTargetRows.value = [];
  }

  function openReceiveDialog() {
    const targets = selectedRows.value.filter((item) =>
      isReceiptWorkbenchRowReceivable(item),
    );
    if (targets.length === 0) {
      ElMessage.warning('请先选择待签收标本');
      return;
    }

    if (!requireOperator()) {
      return;
    }

    syncReceiveOperator();
    receiveTargetRows.value = targets;
    receiveDialogVisible.value = true;
  }

  function handleDirectReceiveUserChange(
    user: null | { id: string; name: string },
  ) {
    directReceiveForm.receivedByUserId = user?.id ?? '';
    directReceiveForm.receivedByName = user?.name ?? '';
  }

  function handleRemoveDirectReceiveRow(key: number) {
    directReceiveItems.value = directReceiveItems.value.filter(
      (item) => item.key !== key,
    );
  }

  async function submitDirectReceive() {
    if (
      !directReceiveForm.receivedByName.trim() ||
      !directReceiveForm.receivedByUserId.trim()
    ) {
      ElMessage.warning('请选择接收人');
      return;
    }

    const validationMessage = validateReceiptItems(directReceiveItems.value);
    if (validationMessage) {
      ElMessage.warning(validationMessage);
      return;
    }

    directReceiveSubmitting.value = true;
    pageError.value = '';
    try {
      await directReceiveSpecimens(
        buildDirectReceiptSubmissionRequest(
          directReceiveForm,
          directReceiveItems.value,
        ),
      );
      const receiptTime = new Date().toISOString();
      const receiptItemsByIdentifier = new Map(
        directReceiveItems.value.flatMap((item) =>
          collectReceiptItemKeys(item).map((key) => [key, item] as const),
        ),
      );

      queueItems.value = queueItems.value.map((row) => {
        const matchedReceiptItem = collectReceiptItemKeys(row)
          .map((key) => receiptItemsByIdentifier.get(key))
          .find(Boolean);
        if (!matchedReceiptItem) {
          return row;
        }

        return {
          ...row,
          abnormalFlag: isReceiptDraftDerivedAbnormal(matchedReceiptItem),
          canReceive: false,
          qualityCheckResult: matchedReceiptItem.qualityCheckResult.trim(),
          qualityIssueCodes: matchedReceiptItem.qualityIssueCodes ?? [],
          receivedAt: receiptTime,
          receivedByName: directReceiveForm.receivedByName.trim(),
          specimenStatus: matchedReceiptItem.receiptStatus.trim(),
          queueStatus: 'SUCCESS',
        };
      });

      directReceiveDialogVisible.value = false;
      ElMessage.success('异常接收已提交');
    } catch (error) {
      pageError.value = getWorkflowPageErrorMessage(error);
    } finally {
      directReceiveSubmitting.value = false;
    }
  }

  async function handleReceiveSelected() {
    const targets = receiveTargetRows.value.filter((item) =>
      isReceiptWorkbenchRowReceivable(item),
    );
    if (targets.length === 0) {
      ElMessage.warning('请先选择待签收标本');
      return;
    }
    if (!requireReceiveForm()) {
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
          await receiveSpecimens(
            buildReceiptSubmissionRequest(
              transportOrderId,
              receiveForm,
              rows.map((row) => ({
                ...createReceiptDraftItem(row.barcode ?? '', {
                  specimenId: row.specimenId,
                  specimenNo: row.specimenNo,
                }),
                containerCount: row.containerCount ?? 1,
              })),
            ),
          );

          const receivedAt = new Date().toISOString();
          for (const row of rows) {
            row.canReceive = false;
            row.queueStatus = 'SUCCESS';
            row.receivedAt = receivedAt;
            row.receivedByName = receiveForm.receivedByName.trim();
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
        closeReceiveDialog();
        ElMessage.success('标本签收成功');
      } else if (successGroups > 0) {
        closeReceiveDialog();
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
    return selectedRows.value.length > 0
      ? selectedRows.value.filter((item) =>
          isReceiptWorkbenchRowReceivable(item),
        )
      : queueItems.value.filter((item) =>
          isReceiptWorkbenchRowReceivable(item),
        );
  }

  function handleRetryLabel() {
    const targets = resolveRetryTargets();
    if (targets.length === 0) {
      ElMessage.warning('当前没有可补打的标本');
      return;
    }

    const batchNos = [
      ...new Set(
        targets.map((item) => item.labelPrintBatchNo?.trim()).filter(Boolean),
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
        fileName: `标本接收-${new Date().toISOString().slice(0, 10)}.xls`,
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
    closeReceiveDialog,
    directReceiveDialogVisible,
    directReceiveForm,
    directReceiveItems,
    directReceiveSubmitting,
    exportLoading,
    handleClearList,
    handleClearSelectionRows,
    handleDirectReceiveUserChange,
    handleExportExcel,
    handleOperatorChange,
    handleQueueSpecimen,
    handleReceiveUserChange,
    handleReceiveSelected,
    handleRemoveDirectReceiveRow,
    handleRetryLabel,
    handleSelectionChange,
    loadPendingReceiptRows,
    lookupLoading,
    openReceiveDialog,
    openDirectReceiveDrawer,
    operatorForm,
    pageError,
    queueItems,
    receiveDialogVisible,
    receiveForm,
    receiveLoading,
    receiveSummary,
    receiveTargetRows,
    receivedCount,
    retryDialogVisible,
    retryForm,
    retrySubmitting,
    retryTargetRows,
    scanInput,
    selectedCount,
    selectedRowCount,
    selectedRows,
    submitDirectReceive,
    submitRetryLabel,
  };
}
