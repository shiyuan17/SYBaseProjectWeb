import type {
  ArchiveCabinetView,
  ArchivePositionView,
} from '../../types/operation-support';
import type { CabinetFormState } from '../../utils/archive-forms';
import type { PositionWorkbenchRow } from '../../utils/archive-workbench';
import type {
  ArchiveManagementCapabilities,
  ArchiveMutationState,
  ArchiveOperatorContext,
} from './archive-management-shared';

import { computed, reactive, ref, watch } from 'vue';

import { ElMessage, ElMessageBox } from 'element-plus';

import {
  batchCreateArchiveCabinets,
  createArchiveCabinet,
  deleteArchiveCabinet,
  listArchiveCabinets,
  listAvailableArchivePositions,
  updateArchiveCabinet,
} from '../../api/operation-support-service';
import {
  buildBatchCreateCabinetRequest,
  buildCreateCabinetRequest,
  buildUpdateCabinetRequest,
  createBatchCabinetFormDefaults,
  createCabinetFormDefaults,
  createCabinetFormStateFromCabinet,
  validateBatchCabinetForm as getBatchCabinetFormValidationMessage,
  validateCabinetForm as getCabinetFormValidationMessage,
} from '../../utils/archive-forms';
import {
  buildArchivePositionRows,
  buildPositionCode,
  summarizeArchivePositions,
} from '../../utils/archive-workbench';
import { getOperationSupportPageErrorMessage } from '../../utils/error';

interface UseArchiveCabinetWorkspaceOptions {
  capabilities: ArchiveManagementCapabilities;
  mutationState: ArchiveMutationState;
  operatorContext: ArchiveOperatorContext;
}

export function useArchiveCabinetWorkspace(
  options: UseArchiveCabinetWorkspaceOptions,
) {
  const { capabilities, mutationState, operatorContext } = options;

  const loading = reactive({
    cabinets: false,
    positions: false,
  });
  const cabinetError = ref('');
  const positionError = ref('');

  const cabinets = ref<ArchiveCabinetView[]>([]);
  const availablePositions = ref<ArchivePositionView[]>([]);
  const selectedPositionCode = ref('');
  const editingCabinet = ref<ArchiveCabinetView | null>(null);
  const cabinetDialogMode = ref<'create' | 'edit' | null>(null);
  const batchCabinetDialogVisible = ref(false);

  const cabinetDialogVisible = computed({
    get: () => cabinetDialogMode.value !== null,
    set: (visible: boolean) => {
      if (!visible) {
        closeCabinetDialog();
      }
    },
  });
  const isEditingCabinet = computed(() => cabinetDialogMode.value === 'edit');

  const cabinetForm = reactive<CabinetFormState>(
    createCabinetFormDefaults(operatorContext.getCurrentOperatorDefaults()),
  );
  const batchCabinetForm = reactive(
    createBatchCabinetFormDefaults(
      operatorContext.getCurrentOperatorDefaults(),
    ),
  );

  const positionFilters = reactive({
    cabinetId: '',
    cabinetType: '',
  });

  const filteredCabinets = computed(() =>
    cabinets.value
      .filter((cabinet) => {
        if (
          positionFilters.cabinetId &&
          cabinet.id !== positionFilters.cabinetId
        ) {
          return false;
        }
        if (
          positionFilters.cabinetType &&
          cabinet.cabinetType !== positionFilters.cabinetType
        ) {
          return false;
        }
        return true;
      })
      .toSorted((left, right) =>
        left.cabinetCode.localeCompare(right.cabinetCode),
      ),
  );

  const positionRows = computed<PositionWorkbenchRow[]>(() =>
    buildArchivePositionRows(filteredCabinets.value, availablePositions.value),
  );

  const selectedPosition = computed(
    () =>
      positionRows.value.find(
        (position) =>
          position.positionCode === selectedPositionCode.value &&
          position.selectable,
      ) ?? null,
  );

  const positionSummary = computed(() =>
    summarizeArchivePositions(positionRows.value),
  );

  const cabinetCapacityPreview = computed(
    () => cabinetForm.layerCount * cabinetForm.slotCountPerLayer,
  );
  const cabinetPositionRulePreview = computed(() =>
    cabinetForm.cabinetCode
      ? buildPositionCode(cabinetForm.cabinetCode.trim(), 1, 1)
      : 'CAB-01-L1-S1',
  );
  const selectedPositionLabel = computed(
    () => selectedPosition.value?.positionCode || '未选择柜位',
  );

  watch(
    () => operatorContext.currentOperatorName.value,
    (operatorName) => {
      populateOperatorDefaults(
        operatorName,
        operatorContext.currentOperatorUserId.value,
      );
    },
    { immediate: true },
  );

  watch(
    () => operatorContext.currentOperatorUserId.value,
    (operatorUserId) => {
      populateOperatorDefaults(
        operatorContext.currentOperatorName.value,
        operatorUserId,
      );
    },
    { immediate: true },
  );

  watch(positionRows, (rows) => {
    if (
      selectedPositionCode.value &&
      !rows.some(
        (row) =>
          row.positionCode === selectedPositionCode.value && row.selectable,
      )
    ) {
      selectedPositionCode.value = '';
    }
  });

  function populateOperatorDefaults(
    operatorName: string,
    operatorUserId: string,
  ) {
    if (!cabinetForm.operatorName && operatorName) {
      cabinetForm.operatorName = operatorName;
    }
    if (!cabinetForm.operatorUserId && operatorUserId) {
      cabinetForm.operatorUserId = operatorUserId;
    }
  }

  function applyCabinetFormState(nextState: CabinetFormState) {
    Object.assign(cabinetForm, nextState);
  }

  function closeCabinetDialog() {
    cabinetDialogMode.value = null;
    editingCabinet.value = null;
    applyCabinetFormState(
      createCabinetFormDefaults(operatorContext.getCurrentOperatorDefaults()),
    );
  }

  function closeBatchCreateCabinetDialog() {
    batchCabinetDialogVisible.value = false;
    Object.assign(
      batchCabinetForm,
      createBatchCabinetFormDefaults(
        operatorContext.getCurrentOperatorDefaults(),
      ),
    );
  }

  function openCreateCabinetDialog() {
    cabinetDialogMode.value = 'create';
    editingCabinet.value = null;
    applyCabinetFormState(
      createCabinetFormDefaults(operatorContext.getCurrentOperatorDefaults()),
    );
  }

  function openBatchCreateCabinetDialog() {
    batchCabinetDialogVisible.value = true;
    Object.assign(
      batchCabinetForm,
      createBatchCabinetFormDefaults(
        operatorContext.getCurrentOperatorDefaults(),
      ),
    );
  }

  function openEditCabinetDialog(cabinet: ArchiveCabinetView) {
    cabinetDialogMode.value = 'edit';
    editingCabinet.value = cabinet;
    applyCabinetFormState(
      createCabinetFormStateFromCabinet(
        cabinet,
        operatorContext.getCurrentOperatorDefaults(),
      ),
    );
  }

  function selectPosition(position: PositionWorkbenchRow) {
    if (!position.selectable) {
      return;
    }

    selectedPositionCode.value = position.positionCode;
    ElMessage.success(`已选择柜位 ${position.positionCode}`);
  }

  function clearSelectedPosition() {
    selectedPositionCode.value = '';
  }

  async function loadCabinets() {
    if (!capabilities.canQueryCabinets.value) {
      cabinets.value = [];
      cabinetError.value = '';
      return;
    }

    loading.cabinets = true;
    cabinetError.value = '';

    try {
      cabinets.value = await listArchiveCabinets();
    } catch (error) {
      cabinetError.value = getOperationSupportPageErrorMessage(error);
    } finally {
      loading.cabinets = false;
    }
  }

  async function loadPositions() {
    if (!capabilities.canQueryCabinets.value) {
      availablePositions.value = [];
      positionError.value = '';
      return;
    }

    loading.positions = true;
    positionError.value = '';

    try {
      availablePositions.value = await listAvailableArchivePositions({
        cabinetId: positionFilters.cabinetId || undefined,
        cabinetType: positionFilters.cabinetType || undefined,
      });
    } catch (error) {
      positionError.value = getOperationSupportPageErrorMessage(error);
    } finally {
      loading.positions = false;
    }
  }

  function validateCabinetForm() {
    const validationMessage = getCabinetFormValidationMessage(
      cabinetForm,
      cabinetDialogMode.value,
    );
    if (validationMessage) {
      ElMessage.warning(validationMessage);
      return false;
    }
    return true;
  }

  function validateBatchCabinetForm() {
    const validationMessage =
      getBatchCabinetFormValidationMessage(batchCabinetForm);
    if (validationMessage) {
      ElMessage.warning(validationMessage);
      return false;
    }
    return true;
  }

  async function submitCabinet() {
    if (!validateCabinetForm()) {
      return;
    }

    mutationState.submitting.value = true;

    try {
      if (cabinetDialogMode.value === 'edit' && editingCabinet.value) {
        await updateArchiveCabinet(
          editingCabinet.value.id,
          buildUpdateCabinetRequest(cabinetForm),
        );
        ElMessage.success('归档柜信息已更新。');
      } else {
        await createArchiveCabinet(buildCreateCabinetRequest(cabinetForm));
        ElMessage.success('归档柜已创建，系统已同步生成柜位。');
      }

      closeCabinetDialog();
      await Promise.all([loadCabinets(), loadPositions()]);
    } catch (error) {
      ElMessage.error(getOperationSupportPageErrorMessage(error));
    } finally {
      mutationState.submitting.value = false;
    }
  }

  async function submitBatchCabinets() {
    if (!validateBatchCabinetForm()) {
      return;
    }

    mutationState.submitting.value = true;

    try {
      const createdCabinets = await batchCreateArchiveCabinets(
        buildBatchCreateCabinetRequest(batchCabinetForm),
      );
      ElMessage.success(`已批量新增 ${createdCabinets.length} 个归档柜。`);
      closeBatchCreateCabinetDialog();
      await Promise.all([loadCabinets(), loadPositions()]);
    } catch (error) {
      ElMessage.error(getOperationSupportPageErrorMessage(error));
    } finally {
      mutationState.submitting.value = false;
    }
  }

  async function deleteCabinet(cabinet: ArchiveCabinetView) {
    try {
      await ElMessageBox.confirm(
        `确认删除归档柜 ${cabinet.cabinetCode}？仅空柜允许删除。`,
        '删除归档柜',
        {
          confirmButtonText: '删除',
          cancelButtonText: '取消',
          type: 'warning',
        },
      );
    } catch {
      return;
    }

    mutationState.submitting.value = true;

    try {
      await deleteArchiveCabinet(cabinet.id);
      ElMessage.success('归档柜已删除。');
      await Promise.all([loadCabinets(), loadPositions()]);
    } catch (error) {
      ElMessage.error(getOperationSupportPageErrorMessage(error));
    } finally {
      mutationState.submitting.value = false;
    }
  }

  async function toggleCabinetStatus(cabinet: ArchiveCabinetView) {
    if (!operatorContext.currentOperatorName.value) {
      ElMessage.warning(
        '当前登录账号缺少操作人姓名，请通过编辑弹窗补充后再执行启停。',
      );
      return;
    }

    mutationState.submitting.value = true;

    try {
      await updateArchiveCabinet(cabinet.id, {
        cabinetName: cabinet.cabinetName,
        cabinetStatus:
          cabinet.cabinetStatus === 'DISABLED' ? 'ACTIVE' : 'DISABLED',
        locationDescription: cabinet.locationDescription ?? undefined,
        operatorName: operatorContext.currentOperatorName.value,
        operatorUserId:
          operatorContext.currentOperatorUserId.value || undefined,
        remarks: cabinet.remarks ?? undefined,
      });

      ElMessage.success(
        `归档柜已${cabinet.cabinetStatus === 'DISABLED' ? '启用' : '停用'}。`,
      );
      await Promise.all([loadCabinets(), loadPositions()]);
    } catch (error) {
      ElMessage.error(getOperationSupportPageErrorMessage(error));
    } finally {
      mutationState.submitting.value = false;
    }
  }

  return {
    batchCabinetDialogVisible,
    batchCabinetForm,
    cabinetCapacityPreview,
    cabinetDialogMode,
    cabinetDialogVisible,
    cabinetError,
    cabinetForm,
    cabinetPositionRulePreview,
    cabinets,
    clearSelectedPosition,
    closeBatchCreateCabinetDialog,
    filteredCabinets,
    isEditingCabinet,
    loadCabinets,
    loadPositions,
    loading,
    openBatchCreateCabinetDialog,
    openCreateCabinetDialog,
    openEditCabinetDialog,
    positionError,
    positionFilters,
    positionRows,
    positionSummary,
    selectedPosition,
    selectedPositionCode,
    selectedPositionLabel,
    selectPosition,
    submitCabinet,
    submitBatchCabinets,
    deleteCabinet,
    toggleCabinetStatus,
  };
}
