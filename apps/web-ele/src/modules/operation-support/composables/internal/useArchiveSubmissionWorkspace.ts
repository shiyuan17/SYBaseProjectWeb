import type { ComputedRef } from 'vue';

import type {
  ArchiveObjectType,
  ArchiveRecordView,
} from '../../types/operation-support';
import type {
  ArchiveApplicationFormSelection,
  ArchiveFormState,
} from '../../utils/archive-forms';
import type { PositionWorkbenchRow } from '../../utils/archive-workbench';
import type {
  ArchiveManagementCapabilities,
  ArchiveMutationState,
  ArchiveOperatorContext,
} from './archive-management-shared';

import { computed, reactive, ref, watch } from 'vue';

import { ElMessage } from 'element-plus';

import {
  archiveApplicationForm,
  batchArchiveEmbeddingBoxes,
  batchArchiveSlides,
  batchArchiveSpecimens,
  listAvailableArchivePositions,
} from '../../api/operation-support-service';
import {
  buildArchiveApplicationFormRequests,
  buildBatchArchiveObjectRequest,
  buildBatchArchiveSpecimenRequest,
  createArchiveFormDefaults,
  validateArchiveForm as getArchiveFormValidationMessage,
  validateBatchArchiveForm as getBatchArchiveFormValidationMessage,
} from '../../utils/archive-forms';
import { getOperationSupportPageErrorMessage } from '../../utils/error';

type PhysicalArchiveObjectType = Exclude<ArchiveObjectType, 'APPLICATION_FORM'>;

interface UseArchiveSubmissionWorkspaceOptions {
  capabilities: ArchiveManagementCapabilities;
  clearSelectedArchiveObjectRecords: (objectType: ArchiveObjectType) => void;
  clearSelectedApplicationFormRecords: () => void;
  getSelectedArchiveObjectRecords: (
    objectType: ArchiveObjectType,
  ) => ArchiveRecordView[];
  getSelectedApplicationFormRecords: () => ArchiveApplicationFormSelection[];
  mutationState: ArchiveMutationState;
  operatorContext: ArchiveOperatorContext;
  refreshArchiveWorkspace: () => Promise<void>;
  selectedPosition: ComputedRef<null | PositionWorkbenchRow>;
}

export function useArchiveSubmissionWorkspace(
  options: UseArchiveSubmissionWorkspaceOptions,
) {
  const {
    capabilities,
    clearSelectedArchiveObjectRecords,
    clearSelectedApplicationFormRecords,
    getSelectedArchiveObjectRecords,
    getSelectedApplicationFormRecords,
    mutationState,
    operatorContext,
    refreshArchiveWorkspace,
    selectedPosition,
  } = options;

  const archiveForm = reactive<ArchiveFormState>(
    createArchiveFormDefaults(operatorContext.getCurrentOperatorDefaults()),
  );
  const applicationFormDialogVisible = ref(false);
  const archiveDialogVisible = ref(false);
  const physicalArchiveDialogVisible = ref(false);

  const archiveSubmitButtonText = computed(() => {
    if (archiveForm.objectType === 'EMBEDDING_BOX') {
      return '提交蜡块归档';
    }
    if (archiveForm.objectType === 'SLIDE') {
      return '提交玻片归档';
    }
    if (archiveForm.objectType === 'SPECIMEN') {
      return '提交标本归档';
    }
    return '提交申请单归档';
  });

  const archivePermissionWarning = computed(() => {
    if (
      archiveForm.objectType === 'EMBEDDING_BOX' &&
      !capabilities.canArchiveEmbeddingBox.value
    ) {
      return '当前账号缺少蜡块归档权限。';
    }
    if (
      archiveForm.objectType === 'SLIDE' &&
      !capabilities.canArchiveSlide.value
    ) {
      return '当前账号缺少玻片归档权限。';
    }
    if (
      archiveForm.objectType === 'SPECIMEN' &&
      !capabilities.canArchiveSpecimen.value
    ) {
      return '当前账号缺少标本归档权限。';
    }
    if (
      archiveForm.objectType === 'APPLICATION_FORM' &&
      !capabilities.canArchiveApplicationForm.value
    ) {
      return '当前账号缺少申请单归档权限。';
    }
    if (!capabilities.canQueryCabinets.value) {
      return '当前账号缺少归档柜查询权限，无法选择归档柜位。';
    }
    return '';
  });

  const canSubmitArchive = computed(() => !archivePermissionWarning.value);

  watch(
    () => operatorContext.currentOperatorName.value,
    (operatorName) => {
      if (!archiveForm.operatorName && operatorName) {
        archiveForm.operatorName = operatorName;
      }
    },
    { immediate: true },
  );

  watch(
    () => operatorContext.currentOperatorUserId.value,
    (operatorUserId) => {
      if (!archiveForm.operatorUserId && operatorUserId) {
        archiveForm.operatorUserId = operatorUserId;
      }
    },
    { immediate: true },
  );

  watch(
    () => archiveForm.objectType,
    () => {
      archiveForm.archiveExpiresAt = '';
      archiveForm.archiveCabinetId = '';
      archiveForm.archiveReminderDays = null;
      archiveForm.caseId = '';
      archiveForm.embeddingBoxId = '';
      archiveForm.fileName = '';
      archiveForm.fileUrl = '';
      archiveForm.remarks = '';
      archiveForm.slideId = '';
      archiveForm.specimenId = '';
    },
  );

  function getArchivePermissionForObjectType(objectType: string) {
    if (objectType === 'EMBEDDING_BOX') {
      return capabilities.canArchiveEmbeddingBox.value;
    }
    if (objectType === 'SLIDE') {
      return capabilities.canArchiveSlide.value;
    }
    if (objectType === 'SPECIMEN') {
      return capabilities.canArchiveSpecimen.value;
    }
    return capabilities.canArchiveApplicationForm.value;
  }

  function validateArchiveForm() {
    const validationMessage = getArchiveFormValidationMessage({
      canArchiveObjectType: getArchivePermissionForObjectType(
        archiveForm.objectType,
      ),
      canQueryCabinets: capabilities.canQueryCabinets.value,
      form: archiveForm,
      hasSelectedCabinet: Boolean(archiveForm.archiveCabinetId),
      permissionWarning: archivePermissionWarning.value,
      selectedApplicationFormRecordCount:
        archiveForm.objectType === 'APPLICATION_FORM'
          ? getSelectedApplicationFormRecords().length
          : 0,
    });
    if (validationMessage) {
      ElMessage.warning(validationMessage);
      return false;
    }
    return true;
  }

  function validateBatchArchiveForm(objectType: ArchiveObjectType) {
    const validationMessage = getBatchArchiveFormValidationMessage({
      canArchiveObjectType: getArchivePermissionForObjectType(objectType),
      canQueryCabinets: capabilities.canQueryCabinets.value,
      form: archiveForm,
      hasSelectedCabinet: Boolean(archiveForm.archiveCabinetId),
      objectType,
      permissionWarning: archivePermissionWarning.value,
      selectedRecordCount: getSelectedArchiveObjectRecords(objectType).length,
    });
    if (validationMessage) {
      ElMessage.warning(validationMessage);
      return false;
    }
    return true;
  }

  function isPhysicalArchiveObjectType(
    objectType: string,
  ): objectType is PhysicalArchiveObjectType {
    return (
      objectType === 'EMBEDDING_BOX' ||
      objectType === 'SLIDE' ||
      objectType === 'SPECIMEN'
    );
  }

  function resetArchiveForm() {
    const objectType = archiveForm.objectType;
    Object.assign(
      archiveForm,
      createArchiveFormDefaults(operatorContext.getCurrentOperatorDefaults()),
      { objectType },
    );
  }

  function syncApplicationFormArchiveCabinetId() {
    if (archiveForm.objectType !== 'APPLICATION_FORM') {
      return;
    }

    if (
      selectedPosition.value?.cabinetId &&
      !archiveForm.archiveCabinetId.trim()
    ) {
      archiveForm.archiveCabinetId = selectedPosition.value.cabinetId;
    }
  }

  function openArchiveDialog(objectType: ArchiveObjectType) {
    if (objectType === 'APPLICATION_FORM') {
      if (getSelectedApplicationFormRecords().length === 0) {
        ElMessage.warning('请先勾选至少一条申请单记录。');
        return;
      }

      syncApplicationFormArchiveCabinetId();
      applicationFormDialogVisible.value = true;
      return;
    }

    if (getSelectedArchiveObjectRecords(objectType).length === 0) {
      ElMessage.warning('请先勾选至少一条归档记录。');
      return;
    }

    archiveForm.objectType = objectType;
    physicalArchiveDialogVisible.value = true;
  }

  async function submitArchive() {
    const archiveObjectType = archiveForm.objectType;
    if (archiveForm.objectType === 'APPLICATION_FORM') {
      if (!validateArchiveForm()) {
        return;
      }
    } else if (!isPhysicalArchiveObjectType(archiveObjectType)) {
      return;
    } else if (!validateBatchArchiveForm(archiveObjectType)) {
      return;
    }

    mutationState.submitting.value = true;

    try {
      if (archiveForm.objectType === 'APPLICATION_FORM') {
        const [archivePosition] = await listAvailableArchivePositions({
          cabinetId: archiveForm.archiveCabinetId.trim(),
        });
        if (!archivePosition) {
          ElMessage.warning('所选归档框暂无可用柜位，请重新选择。');
          return;
        }
        const selectedApplicationFormRecords =
          getSelectedApplicationFormRecords();
        const requests = buildArchiveApplicationFormRequests(
          selectedApplicationFormRecords,
          archiveForm,
          archivePosition.id,
        );

        for (const [index, request] of requests.entries()) {
          try {
            await archiveApplicationForm(request);
          } catch (error) {
            const record = selectedApplicationFormRecords[index];
            const recordLabel =
              record?.pathologyNo?.trim() ||
              record?.patientName?.trim() ||
              request.caseId;
            throw new Error(
              `申请单 ${recordLabel} 归档失败：${getOperationSupportPageErrorMessage(error)}`,
              { cause: error },
            );
          }
        }

        ElMessage.success('申请单归档已完成。');
      } else if (archiveObjectType === 'EMBEDDING_BOX') {
        await batchArchiveEmbeddingBoxes(
          buildBatchArchiveObjectRequest(
            getSelectedArchiveObjectRecords('EMBEDDING_BOX'),
            archiveForm,
          ),
        );
        ElMessage.success('蜡块归档已完成。');
      } else {
        if (archiveObjectType === 'SLIDE') {
          await batchArchiveSlides(
            buildBatchArchiveObjectRequest(
              getSelectedArchiveObjectRecords('SLIDE'),
              archiveForm,
            ),
          );
          ElMessage.success('玻片归档已完成。');
        } else if (archiveObjectType === 'SPECIMEN') {
          await batchArchiveSpecimens(
            buildBatchArchiveSpecimenRequest(
              getSelectedArchiveObjectRecords('SPECIMEN'),
              archiveForm,
            ),
          );
          ElMessage.success('标本归档已完成。');
        }
      }

      resetArchiveForm();
      archiveDialogVisible.value = false;
      applicationFormDialogVisible.value = false;
      physicalArchiveDialogVisible.value = false;
      clearSelectedApplicationFormRecords();
      if (isPhysicalArchiveObjectType(archiveObjectType)) {
        clearSelectedArchiveObjectRecords(archiveObjectType);
      }
      await refreshArchiveWorkspace();
    } catch (error) {
      ElMessage.error(getOperationSupportPageErrorMessage(error));
    } finally {
      mutationState.submitting.value = false;
    }
  }

  return {
    applicationFormDialogVisible,
    archiveDialogVisible,
    archiveForm,
    archivePermissionWarning,
    archiveSubmitButtonText,
    canSubmitArchive,
    openArchiveDialog,
    physicalArchiveDialogVisible,
    submitArchive,
  };
}
