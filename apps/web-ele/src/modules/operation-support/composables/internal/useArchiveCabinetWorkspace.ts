import type {
  ArchiveCabinetNodeView,
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
  createArchiveCabinetNode,
  deleteArchiveCabinet,
  listArchiveCabinetNodes,
  listArchiveCabinets,
  listAvailableArchivePositions,
  updateArchiveCabinet,
  updateArchiveCabinetNode,
} from '../../api/operation-support-service';
import {
  buildBatchCreateCabinetRequest,
  buildCreateCabinetNodeRequest,
  buildUpdateCabinetNodeRequest,
  buildUpdateCabinetRequest,
  createBatchCabinetFormDefaults,
  createCabinetFormDefaults,
  createCabinetFormStateFromCabinet,
  createCabinetFormStateFromNode,
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
    cabinetNodes: false,
    positions: false,
  });
  const loaded = reactive({
    cabinets: false,
    cabinetNodes: false,
    positions: false,
  });
  const cabinetError = ref('');
  const cabinetNodeError = ref('');
  const positionError = ref('');

  const cabinetNodes = ref<ArchiveCabinetNodeView[]>([]);
  const cabinets = ref<ArchiveCabinetView[]>([]);
  const availablePositions = ref<ArchivePositionView[]>([]);
  const selectedPositionCode = ref('');
  const editingCabinet = ref<ArchiveCabinetView | null>(null);
  const editingCabinetNode = ref<ArchiveCabinetNodeView | null>(null);
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

  const cabinetCapacityPreview = computed(() => cabinetForm.capacity);
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
    () => [cabinetForm.nodeType, cabinetForm.capacity] as const,
    ([nodeType, capacity]) => {
      if (cabinetDialogMode.value === 'edit') {
        return;
      }
      cabinetForm.remainingCapacity = nodeType === 'AREA' ? 0 : capacity;
      if (nodeType === 'AREA') {
        cabinetForm.cabinetType = '';
        cabinetForm.capacity = 0;
      } else if (!cabinetForm.cabinetType) {
        cabinetForm.cabinetType = 'APPLICATION_FORM';
      }
    },
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
    editingCabinetNode.value = null;
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
    editingCabinetNode.value = null;
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
    editingCabinetNode.value =
      cabinetNodes.value.find((node) => node.cabinetId === cabinet.id) ?? null;
    applyCabinetFormState(
      editingCabinetNode.value
        ? createCabinetFormStateFromNode(
            editingCabinetNode.value,
            operatorContext.getCurrentOperatorDefaults(),
          )
        : createCabinetFormStateFromCabinet(
            cabinet,
            operatorContext.getCurrentOperatorDefaults(),
          ),
    );
  }

  function openEditCabinetNodeDialog(node: ArchiveCabinetNodeView) {
    cabinetDialogMode.value = 'edit';
    editingCabinetNode.value = node;
    editingCabinet.value =
      node.cabinetId && node.nodeType === 'CABINET'
        ? (cabinets.value.find((cabinet) => cabinet.id === node.cabinetId) ??
          null)
        : null;
    applyCabinetFormState(
      createCabinetFormStateFromNode(
        node,
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
      loaded.cabinets = false;
      return;
    }

    loading.cabinets = true;
    cabinetError.value = '';

    try {
      cabinets.value = await listArchiveCabinets();
      loaded.cabinets = true;
    } catch (error) {
      loaded.cabinets = false;
      cabinetError.value = getOperationSupportPageErrorMessage(error);
    } finally {
      loading.cabinets = false;
    }
  }

  async function loadCabinetNodes() {
    if (!capabilities.canQueryCabinets.value) {
      cabinetNodes.value = [];
      cabinetNodeError.value = '';
      loaded.cabinetNodes = false;
      return;
    }

    loading.cabinetNodes = true;
    cabinetNodeError.value = '';

    try {
      cabinetNodes.value = await listArchiveCabinetNodes();
      loaded.cabinetNodes = true;
    } catch (error) {
      loaded.cabinetNodes = false;
      cabinetNodeError.value = getOperationSupportPageErrorMessage(error);
    } finally {
      loading.cabinetNodes = false;
    }
  }

  async function loadPositions() {
    if (!capabilities.canQueryCabinets.value) {
      availablePositions.value = [];
      positionError.value = '';
      loaded.positions = false;
      return;
    }

    loading.positions = true;
    positionError.value = '';

    try {
      availablePositions.value = await listAvailableArchivePositions({
        cabinetId: positionFilters.cabinetId || undefined,
        cabinetType: positionFilters.cabinetType || undefined,
      });
      loaded.positions = true;
    } catch (error) {
      loaded.positions = false;
      positionError.value = getOperationSupportPageErrorMessage(error);
    } finally {
      loading.positions = false;
    }
  }

  async function loadCabinetsIfNeeded() {
    if (
      !capabilities.canQueryCabinets.value ||
      loaded.cabinets ||
      loading.cabinets
    ) {
      return;
    }

    await loadCabinets();
  }

  async function loadWorkbenchIfNeeded() {
    if (!capabilities.canQueryCabinets.value) {
      return;
    }

    const tasks: Array<Promise<unknown>> = [];

    if (!loaded.cabinets && !loading.cabinets) {
      tasks.push(loadCabinets());
    }
    if (!loaded.cabinetNodes && !loading.cabinetNodes) {
      tasks.push(loadCabinetNodes());
    }
    if (!loaded.positions && !loading.positions) {
      tasks.push(loadPositions());
    }

    if (tasks.length > 0) {
      await Promise.all(tasks);
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
        await (editingCabinetNode.value
          ? updateArchiveCabinetNode(
              editingCabinetNode.value.id,
              buildUpdateCabinetNodeRequest(cabinetForm),
            )
          : updateArchiveCabinet(
              editingCabinet.value.id,
              buildUpdateCabinetRequest(cabinetForm),
            ));
        ElMessage.success('归档柜节点信息已更新。');
      } else if (
        cabinetDialogMode.value === 'edit' &&
        editingCabinetNode.value
      ) {
        await updateArchiveCabinetNode(
          editingCabinetNode.value.id,
          buildUpdateCabinetNodeRequest(cabinetForm),
        );
        ElMessage.success('归档柜节点信息已更新。');
      } else {
        await createArchiveCabinetNode(
          buildCreateCabinetNodeRequest(cabinetForm),
        );
        ElMessage.success('归档柜节点已创建。');
      }

      closeCabinetDialog();
      await Promise.all([loadCabinets(), loadCabinetNodes(), loadPositions()]);
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
      await Promise.all([loadCabinets(), loadCabinetNodes(), loadPositions()]);
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
      await Promise.all([loadCabinets(), loadCabinetNodes(), loadPositions()]);
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
      await Promise.all([loadCabinets(), loadCabinetNodes(), loadPositions()]);
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
    cabinetNodeError,
    cabinetNodes,
    cabinetPositionRulePreview,
    cabinets,
    clearSelectedPosition,
    closeBatchCreateCabinetDialog,
    filteredCabinets,
    isEditingCabinet,
    loadCabinets,
    loadCabinetsIfNeeded,
    loadCabinetNodes,
    loadPositions,
    loadWorkbenchIfNeeded,
    loading,
    openBatchCreateCabinetDialog,
    openCreateCabinetDialog,
    openEditCabinetDialog,
    openEditCabinetNodeDialog,
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
