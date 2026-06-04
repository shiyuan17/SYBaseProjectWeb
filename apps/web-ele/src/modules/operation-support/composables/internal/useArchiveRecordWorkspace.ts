import type { ArchiveRecordView } from '../../types/operation-support';
import type { ArchiveManagementCapabilities } from './archive-management-shared';

import { reactive, ref } from 'vue';

import { searchArchiveRecords } from '../../api/operation-support-service';
import { getOperationSupportPageErrorMessage } from '../../utils/error';

interface UseArchiveRecordWorkspaceOptions {
  capabilities: ArchiveManagementCapabilities;
}

export function useArchiveRecordWorkspace(
  options: UseArchiveRecordWorkspaceOptions,
) {
  const { capabilities } = options;

  const loading = ref(false);
  const recordError = ref('');
  const records = ref<ArchiveRecordView[]>([]);

  const recordFilters = reactive({
    caseId: '',
    keyword: '',
    objectType: '',
  });

  async function loadRecords() {
    if (!capabilities.canQueryRecords.value) {
      records.value = [];
      recordError.value = '';
      return;
    }

    loading.value = true;
    recordError.value = '';

    try {
      records.value = await searchArchiveRecords({
        caseId: recordFilters.caseId.trim() || undefined,
        keyword: recordFilters.keyword.trim() || undefined,
        objectType: recordFilters.objectType || undefined,
      });
    } catch (error) {
      recordError.value = getOperationSupportPageErrorMessage(error);
    } finally {
      loading.value = false;
    }
  }

  return {
    loadRecords,
    loading,
    recordError,
    recordFilters,
    records,
  };
}
