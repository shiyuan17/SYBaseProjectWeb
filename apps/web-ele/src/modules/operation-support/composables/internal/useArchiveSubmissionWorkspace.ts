import type { ComputedRef } from 'vue';

import type { ArchiveFormState } from '../../utils/archive-forms';
import type { PositionWorkbenchRow } from '../../utils/archive-workbench';
import type {
  ArchiveManagementCapabilities,
  ArchiveMutationState,
  ArchiveOperatorContext,
} from './archive-management-shared';

import { computed, reactive, watch } from 'vue';

import { ElMessage } from 'element-plus';

import {
  archiveApplicationForm,
  archiveEmbeddingBox,
  archiveSlide,
} from '../../api/operation-support-service';
import {
  buildArchiveApplicationFormRequest,
  buildArchiveEmbeddingBoxRequest,
  buildArchiveSlideRequest,
  createArchiveFormDefaults,
  validateArchiveForm as getArchiveFormValidationMessage,
} from '../../utils/archive-forms';
import { getOperationSupportPageErrorMessage } from '../../utils/error';

interface UseArchiveSubmissionWorkspaceOptions {
  capabilities: ArchiveManagementCapabilities;
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
    mutationState,
    operatorContext,
    refreshArchiveWorkspace,
    selectedPosition,
  } = options;

  const archiveForm = reactive<ArchiveFormState>(
    createArchiveFormDefaults(operatorContext.getCurrentOperatorDefaults()),
  );

  const archiveSubmitButtonText = computed(() => {
    if (archiveForm.objectType === 'EMBEDDING_BOX') {
      return '提交蜡块归档';
    }
    if (archiveForm.objectType === 'SLIDE') {
      return '提交玻片归档';
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
      archiveForm.caseId = '';
      archiveForm.embeddingBoxId = '';
      archiveForm.fileName = '';
      archiveForm.fileUrl = '';
      archiveForm.remarks = '';
      archiveForm.slideId = '';
    },
  );

  function getArchivePermissionForObjectType(objectType: string) {
    if (objectType === 'EMBEDDING_BOX') {
      return capabilities.canArchiveEmbeddingBox.value;
    }
    if (objectType === 'SLIDE') {
      return capabilities.canArchiveSlide.value;
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
      hasSelectedPosition: Boolean(selectedPosition.value),
      permissionWarning: archivePermissionWarning.value,
    });
    if (validationMessage) {
      ElMessage.warning(validationMessage);
      return false;
    }
    return true;
  }

  function resetArchiveForm() {
    Object.assign(
      archiveForm,
      createArchiveFormDefaults(operatorContext.getCurrentOperatorDefaults()),
    );
  }

  async function submitArchive() {
    if (!validateArchiveForm() || !selectedPosition.value) {
      return;
    }

    mutationState.submitting.value = true;

    try {
      if (archiveForm.objectType === 'APPLICATION_FORM') {
        await archiveApplicationForm(
          buildArchiveApplicationFormRequest(
            archiveForm,
            selectedPosition.value.id,
          ),
        );
        ElMessage.success('申请单归档已完成。');
      } else if (archiveForm.objectType === 'EMBEDDING_BOX') {
        await archiveEmbeddingBox(
          buildArchiveEmbeddingBoxRequest(
            archiveForm,
            selectedPosition.value.id,
          ),
        );
        ElMessage.success('蜡块归档已完成。');
      } else {
        await archiveSlide(
          buildArchiveSlideRequest(archiveForm, selectedPosition.value.id),
        );
        ElMessage.success('玻片归档已完成。');
      }

      resetArchiveForm();
      await refreshArchiveWorkspace();
    } catch (error) {
      ElMessage.error(getOperationSupportPageErrorMessage(error));
    } finally {
      mutationState.submitting.value = false;
    }
  }

  return {
    archiveForm,
    archivePermissionWarning,
    archiveSubmitButtonText,
    canSubmitArchive,
    submitArchive,
  };
}
