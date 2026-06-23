import type {
  CreateMedicalOrderQcEvaluationRequest,
  MedicalOrderQcEvaluationSummary,
  MedicalOrderSlidePrintResult,
  MedicalOrderSummary,
  PendingMedicalOrderQuery,
  TerminateMedicalOrderRequest,
} from '../../doctor-workflow/types/doctor-workflow';
import type { TechnicalWorkbenchQueryState } from '../types/technical-workbench';

import { computed, ref } from 'vue';

import { ElMessage } from 'element-plus';

import {
  acceptMedicalOrder,
  completeMedicalOrder,
  createMedicalOrderQcEvaluation,
  exportRoutineMedicalOrders,
  getLatestMedicalOrderQcEvaluation,
  mergeRoutineMedicalOrderSlides,
  printMedicalOrderSlide,
  terminateMedicalOrder,
  unmergeRoutineMedicalOrderSlides,
} from '../../doctor-workflow/api/doctor-workflow-service';
import { downloadRoutineOrderBlobFile } from '../utils/routine-order-download';
import { openRoutineOrderApplicationLabelPrintWindow } from '../utils/routine-order-label-print';
import { openRoutineOrderPrintWindow } from '../utils/routine-order-print';

export interface RoutineOrderToolbarAction {
  id: string;
  label: string;
}

export interface RoutineMedicalOrderRow extends Partial<MedicalOrderSummary> {
  applicationNo?: null | string;
  blockNo?: null | string;
  canConfirm?: boolean;
  canPrint?: boolean;
  canQc?: boolean;
  canRelease?: boolean;
  canTerminate?: boolean;
  caseId?: null | string;
  checkItem?: null | string;
  doctorTime?: null | string;
  doctorUser?: null | string;
  id: string;
  orderId?: string;
  pathologyNo?: null | string;
  patientName?: null | string;
  releaseStatus?: null | string;
  slideNo?: null | string;
  status?: null | string;
  slicingMergedPrintGroup?: boolean;
  slicingPrintGroupId?: null | string;
  slicingTaskIds?: string[];
  targetBlockId?: null | string;
  targetSlideId?: null | string;
  targetSpecimenId?: null | string;
  targetType?: null | string;
  terminatedAt?: null | string;
}

export type RoutineOrderQcSubmitPayload = Omit<
  CreateMedicalOrderQcEvaluationRequest,
  'caseId' | 'terminalCode'
>;

export interface RoutineOrderTerminationPayload {
  terminationReasonCode: string;
  terminationReasonLabel: string;
  terminationRemarks?: string;
}

interface ReloadableWorkbench {
  getQueryState?: () => TechnicalWorkbenchQueryState;
  reload?: () => Promise<void> | void;
}

const ROUTINE_TERMINAL_CODE = 'ROUTINE_ORDER_WORKSTATION';

function getOrderId(row: RoutineMedicalOrderRow) {
  return row.orderId?.trim() || row.id;
}

function getCaseId(row: RoutineMedicalOrderRow) {
  return row.caseId?.trim() || '';
}

function isTerminatedRow(row: RoutineMedicalOrderRow) {
  return (
    row.status?.trim().toUpperCase() === 'TERMINATED' ||
    Boolean(row.terminatedAt?.trim())
  );
}

function normalizeRemarks(value?: null | string) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function normalizeCheckItem(value?: null | string) {
  return value?.trim() || '';
}

function getRoutineWorkstationQuery(
  workbench: null | ReloadableWorkbench,
): PendingMedicalOrderQuery {
  const queryState = workbench?.getQueryState?.();
  const dateRange = queryState?.dateRange ?? [];
  const normalizedDateRange =
    Array.isArray(dateRange) && dateRange.length === 2 ? dateRange : [];

  return {
    dateFrom: normalizedDateRange[0]?.trim() || undefined,
    dateTo: normalizedDateRange[1]?.trim() || undefined,
    page: 1,
    pathologyNo: queryState?.searchKeyword?.trim() || undefined,
    size: 9999,
    status: queryState?.status?.trim() || undefined,
    workDate: undefined,
  };
}

function buildBatchSummary(
  actionLabel: string,
  results: PromiseSettledResult<unknown>[],
) {
  const failedCount = results.filter(
    (result) => result.status === 'rejected',
  ).length;
  const successCount = results.length - failedCount;

  if (failedCount === 0) {
    ElMessage.success(`${actionLabel}成功 ${successCount} 条`);
    return;
  }

  if (successCount > 0) {
    ElMessage.warning(
      `${actionLabel}成功 ${successCount} 条，失败 ${failedCount} 条`,
    );
    return;
  }

  ElMessage.warning(`${actionLabel}失败，请重试`);
}

async function runBatchAction(
  rows: RoutineMedicalOrderRow[],
  actionLabel: string,
  runner: (row: RoutineMedicalOrderRow) => Promise<unknown>,
) {
  const results = await Promise.allSettled(rows.map((row) => runner(row)));
  buildBatchSummary(actionLabel, results);
  return results;
}

export function useRoutineMedicalOrderActions() {
  const selectedRows = ref<RoutineMedicalOrderRow[]>([]);
  const workbenchRef = ref<null | ReloadableWorkbench>(null);
  const terminationDialogVisible = ref(false);
  const qcDrawerVisible = ref(false);
  const latestQcEvaluation = ref<MedicalOrderQcEvaluationSummary | null>(null);
  const activeQcRowId = ref('');
  const submitting = ref(false);

  const selectedCount = computed(() => selectedRows.value.length);
  const activeQcRow = computed(() => {
    const matchedRow = selectedRows.value.find(
      (row) => getOrderId(row) === activeQcRowId.value,
    );
    return matchedRow ?? selectedRows.value[0] ?? null;
  });

  async function reloadWorkbench() {
    await workbenchRef.value?.reload?.();
  }

  function setSelectedRows(rows: RoutineMedicalOrderRow[]) {
    selectedRows.value = rows;
    if (
      rows.length === 0 ||
      !rows.some((row) => getOrderId(row) === activeQcRowId.value)
    ) {
      activeQcRowId.value = getOrderId(rows[0] ?? { id: '' });
    }
  }

  function ensureSelectedRows(actionLabel: string) {
    if (selectedRows.value.length > 0) {
      return true;
    }
    ElMessage.warning(`请先选择需要${actionLabel}的医嘱`);
    return false;
  }

  function ensureRowsCanRun(
    predicate: (row: RoutineMedicalOrderRow) => boolean,
    message: string,
  ) {
    if (selectedRows.value.every((row) => predicate(row))) {
      return true;
    }
    ElMessage.warning(message);
    return false;
  }

  function ensureRowsNotTerminated(actionLabel: string) {
    if (selectedRows.value.every((row) => !isTerminatedRow(row))) {
      return true;
    }
    ElMessage.warning(`选中医嘱中存在不可${actionLabel}的数据，请重新选择`);
    return false;
  }

  async function handleConfirmAction() {
    if (!ensureSelectedRows('确认')) {
      return;
    }
    if (
      !ensureRowsCanRun(
        (row) => Boolean(row.canConfirm),
        '选中医嘱中存在不可确认的数据，请重新选择',
      )
    ) {
      return;
    }

    submitting.value = true;
    try {
      await runBatchAction(selectedRows.value, '确认', (row) =>
        acceptMedicalOrder(getOrderId(row), {
          remarks: '常规医嘱确认',
          terminalCode: ROUTINE_TERMINAL_CODE,
        }),
      );
      await reloadWorkbench();
    } finally {
      submitting.value = false;
    }
  }

  async function handlePrintAction() {
    if (!ensureSelectedRows('打印玻片')) {
      return;
    }

    submitting.value = true;
    try {
      const results = await Promise.allSettled(
        selectedRows.value.map((row) =>
          printMedicalOrderSlide(getOrderId(row), {
            remarks: '常规医嘱打印玻片',
            terminalCode: ROUTINE_TERMINAL_CODE,
          }),
        ),
      );

      const succeededResults = results
        .filter(
          (
            result,
          ): result is PromiseFulfilledResult<MedicalOrderSlidePrintResult> =>
            result.status === 'fulfilled',
        )
        .map((result) => result.value);

      if (succeededResults.length > 0) {
        const labels = succeededResults.flatMap((result) => result.labels);
        if (labels.length === 0 || !openRoutineOrderPrintWindow(labels)) {
          ElMessage.warning('未能打开打印窗口，请检查浏览器弹窗权限');
        }
      }

      buildBatchSummary('打印玻片', results);
      await reloadWorkbench();
    } finally {
      submitting.value = false;
    }
  }

  async function handleReleaseAction() {
    if (!ensureSelectedRows('出片')) {
      return;
    }
    if (
      !ensureRowsCanRun(
        (row) => Boolean(row.canRelease),
        '选中医嘱中存在未打印或不可出片的数据，请重新选择',
      )
    ) {
      return;
    }

    submitting.value = true;
    try {
      await runBatchAction(selectedRows.value, '出片', (row) =>
        completeMedicalOrder(getOrderId(row), {
          remarks: '常规医嘱出片',
          terminalCode: ROUTINE_TERMINAL_CODE,
        }),
      );
      await reloadWorkbench();
    } finally {
      submitting.value = false;
    }
  }

  function ensureRowsHaveSameCheckItem() {
    if (selectedRows.value.length < 2) {
      ElMessage.warning('相同项目合片至少选择 2 条医嘱');
      return false;
    }

    const firstCheckItem = normalizeCheckItem(selectedRows.value[0]?.checkItem);
    if (
      !firstCheckItem ||
      !selectedRows.value.every(
        (row) => normalizeCheckItem(row.checkItem) === firstCheckItem,
      )
    ) {
      ElMessage.warning('相同项目合片仅支持检查项目一致的医嘱');
      return false;
    }

    return true;
  }

  function ensureMergedPrintGroupsSelected() {
    if (
      selectedRows.value.every((row) =>
        Boolean(row.slicingMergedPrintGroup && row.slicingPrintGroupId),
      )
    ) {
      return true;
    }

    ElMessage.warning('取消合片只支持未打印合片组');
    return false;
  }

  async function handlePrintLabelAction() {
    if (!ensureSelectedRows('打印申请单标签')) {
      return;
    }

    const opened = openRoutineOrderApplicationLabelPrintWindow([
      ...selectedRows.value,
    ]);
    if (!opened) {
      ElMessage.warning('未能打开打印窗口，请检查浏览器弹窗权限');
      return;
    }

    ElMessage.success(`打印申请单标签成功 ${selectedRows.value.length} 条`);
    await reloadWorkbench();
  }

  async function handleMergeAction() {
    if (!ensureSelectedRows('相同项目合片')) {
      return;
    }
    if (!ensureRowsHaveSameCheckItem()) {
      return;
    }

    submitting.value = true;
    try {
      await mergeRoutineMedicalOrderSlides(
        selectedRows.value.map((row) => getOrderId(row)),
      );
      ElMessage.success(`相同项目合片成功 ${selectedRows.value.length} 条`);
      await reloadWorkbench();
    } finally {
      submitting.value = false;
    }
  }

  async function handleUnmergeAction() {
    if (!ensureSelectedRows('取消合片')) {
      return;
    }
    if (!ensureMergedPrintGroupsSelected()) {
      return;
    }

    const printGroupIds = [
      ...new Set(
        selectedRows.value
          .map((row) => row.slicingPrintGroupId?.trim())
          .filter(Boolean),
      ),
    ];

    submitting.value = true;
    try {
      await unmergeRoutineMedicalOrderSlides(printGroupIds);
      ElMessage.success(`取消合片成功 ${printGroupIds.length} 组`);
      await reloadWorkbench();
    } finally {
      submitting.value = false;
    }
  }

  async function handleExportAction() {
    submitting.value = true;
    try {
      const blob = await exportRoutineMedicalOrders(
        getRoutineWorkstationQuery(workbenchRef.value),
      );
      downloadRoutineOrderBlobFile(
        blob,
        `routine-medical-orders-${new Date().toISOString().slice(0, 10)}.csv`,
      );
      ElMessage.success('导出成功');
      await reloadWorkbench();
    } finally {
      submitting.value = false;
    }
  }

  function openTerminationDialog() {
    if (!ensureSelectedRows('终止')) {
      return;
    }
    if (
      !ensureRowsCanRun(
        (row) => Boolean(row.canTerminate),
        '选中医嘱中存在不可终止的数据，请重新选择',
      )
    ) {
      return;
    }
    terminationDialogVisible.value = true;
  }

  async function submitTermination(payload: RoutineOrderTerminationPayload) {
    submitting.value = true;
    try {
      await runBatchAction(selectedRows.value, '终止', (row) =>
        terminateMedicalOrder(getOrderId(row), {
          remarks: normalizeRemarks(payload.terminationRemarks),
          terminalCode: ROUTINE_TERMINAL_CODE,
          terminationReasonCode: payload.terminationReasonCode,
          terminationReasonLabel: payload.terminationReasonLabel,
        } satisfies TerminateMedicalOrderRequest),
      );
      terminationDialogVisible.value = false;
      await reloadWorkbench();
    } finally {
      submitting.value = false;
    }
  }

  async function loadLatestQcEvaluation(row?: null | RoutineMedicalOrderRow) {
    const targetRow = row ?? activeQcRow.value;
    if (!targetRow) {
      latestQcEvaluation.value = null;
      return;
    }
    activeQcRowId.value = getOrderId(targetRow);
    latestQcEvaluation.value = await getLatestMedicalOrderQcEvaluation(
      getOrderId(targetRow),
    );
  }

  async function openQcDrawer() {
    if (!ensureSelectedRows('质控评价')) {
      return;
    }
    if (!ensureRowsNotTerminated('质控评价')) {
      return;
    }

    qcDrawerVisible.value = true;
    await loadLatestQcEvaluation(selectedRows.value[0] ?? null);
  }

  async function submitQcEvaluation(payload: RoutineOrderQcSubmitPayload) {
    const targetRow = activeQcRow.value;
    if (!targetRow) {
      ElMessage.warning('当前缺少可评价的医嘱');
      return;
    }

    submitting.value = true;
    try {
      await createMedicalOrderQcEvaluation(getOrderId(targetRow), {
        caseId: getCaseId(targetRow),
        detailItems: payload.detailItems,
        evaluationReason: normalizeRemarks(payload.evaluationReason),
        grade: payload.grade,
        processingAction: payload.processingAction,
        qcAspect: payload.qcAspect,
        remarks: normalizeRemarks(payload.remarks),
        reworkType: payload.reworkType ?? null,
        terminalCode: ROUTINE_TERMINAL_CODE,
        totalScore: payload.totalScore,
      });
      ElMessage.success('质控评价提交成功');
      qcDrawerVisible.value = false;
      await reloadWorkbench();
    } finally {
      submitting.value = false;
    }
  }

  async function handleToolbarAction(action: RoutineOrderToolbarAction) {
    if (submitting.value) {
      return;
    }
    switch (action.id) {
      case 'routine-confirm': {
        await handleConfirmAction();
        return;
      }
      case 'routine-export': {
        await handleExportAction();
        return;
      }
      case 'routine-merge': {
        await handleMergeAction();
        return;
      }
      case 'routine-print-label': {
        await handlePrintLabelAction();
        return;
      }
      case 'routine-print-slide': {
        await handlePrintAction();
        return;
      }
      case 'routine-qc': {
        await openQcDrawer();
        return;
      }
      case 'routine-release': {
        await handleReleaseAction();
        return;
      }
      case 'routine-stop': {
        openTerminationDialog();
        return;
      }
      case 'routine-unmerge': {
        await handleUnmergeAction();
        return;
      }
      default: {
        ElMessage.warning(`${action.label}暂未在常规医嘱页接入`);
      }
    }
  }

  return {
    activeQcRow,
    latestQcEvaluation,
    loadLatestQcEvaluation,
    qcDrawerVisible,
    selectedCount,
    selectedRows,
    setSelectedRows,
    submitQcEvaluation,
    submitTermination,
    submitting,
    terminationDialogVisible,
    workbenchRef,
    handleToolbarAction,
  };
}
