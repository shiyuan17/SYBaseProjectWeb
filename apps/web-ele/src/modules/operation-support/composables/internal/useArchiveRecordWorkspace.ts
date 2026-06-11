import type {
  ArchiveObjectPage,
  ArchiveObjectType,
  ArchiveRecordView,
} from '../../types/operation-support';
import type { ArchiveManagementCapabilities } from './archive-management-shared';

import { reactive, ref } from 'vue';

import { listArchiveObjects } from '../../api/operation-support-service';
import { getOperationSupportPageErrorMessage } from '../../utils/error';

interface UseArchiveRecordWorkspaceOptions {
  capabilities: ArchiveManagementCapabilities;
}

interface ArchiveObjectListFilters {
  keyword: string;
  page: number;
  size: number;
}

interface ArchiveObjectListState {
  error: string;
  filters: ArchiveObjectListFilters;
  items: ArchiveRecordView[];
  loaded: boolean;
  loading: boolean;
  total: number;
}

type ArchiveObjectListMap = Record<ArchiveObjectType, ArchiveObjectListState>;

const archiveObjectTypes: ArchiveObjectType[] = [
  'APPLICATION_FORM',
  'EMBEDDING_BOX',
  'SLIDE',
  'SPECIMEN',
];

function createArchiveObjectListState(): ArchiveObjectListState {
  return {
    error: '',
    filters: {
      keyword: '',
      page: 1,
      size: 20,
    },
    items: [],
    loaded: false,
    loading: false,
    total: 0,
  };
}

function createArchiveObjectLists(): ArchiveObjectListMap {
  const objectLists = {} as ArchiveObjectListMap;

  for (const objectType of archiveObjectTypes) {
    objectLists[objectType] = createArchiveObjectListState();
  }

  return objectLists;
}

export function useArchiveRecordWorkspace(
  options: UseArchiveRecordWorkspaceOptions,
) {
  const { capabilities } = options;

  const activeObjectType = ref<ArchiveObjectType>('APPLICATION_FORM');
  const objectLists = reactive(createArchiveObjectLists());
  const requestVersionByType = new Map<ArchiveObjectType, number>();

  function getObjectList(objectType: ArchiveObjectType) {
    return objectLists[objectType];
  }

  async function loadArchiveObjects(
    objectType: ArchiveObjectType = activeObjectType.value,
  ) {
    const objectList = getObjectList(objectType);

    if (!capabilities.canQueryRecords.value) {
      objectList.items = [];
      objectList.error = '';
      objectList.total = 0;
      objectList.loaded = false;
      return;
    }

    const requestVersion = (requestVersionByType.get(objectType) ?? 0) + 1;
    requestVersionByType.set(objectType, requestVersion);
    objectList.loading = true;
    objectList.error = '';

    try {
      const page: ArchiveObjectPage = await listArchiveObjects({
        keyword: objectList.filters.keyword.trim() || undefined,
        objectType,
        page: objectList.filters.page,
        size: objectList.filters.size,
      });

      if (requestVersionByType.get(objectType) !== requestVersion) {
        return;
      }

      objectList.items = page.items;
      objectList.filters.page = page.page;
      objectList.filters.size = page.size;
      objectList.total = page.total;
      objectList.loaded = true;
    } catch (error) {
      if (requestVersionByType.get(objectType) === requestVersion) {
        objectList.error = getOperationSupportPageErrorMessage(error);
      }
    } finally {
      if (requestVersionByType.get(objectType) === requestVersion) {
        objectList.loading = false;
      }
    }
  }

  async function queryArchiveObjects(
    objectType: ArchiveObjectType = activeObjectType.value,
  ) {
    const objectList = getObjectList(objectType);
    objectList.filters.page = 1;
    await loadArchiveObjects(objectType);
  }

  async function setArchiveObjectPage(
    objectType: ArchiveObjectType,
    page: number,
  ) {
    getObjectList(objectType).filters.page = page;
    await loadArchiveObjects(objectType);
  }

  async function setArchiveObjectSize(
    objectType: ArchiveObjectType,
    size: number,
  ) {
    const objectList = getObjectList(objectType);
    objectList.filters.page = 1;
    objectList.filters.size = size;
    await loadArchiveObjects(objectType);
  }

  async function setActiveArchiveObjectType(
    objectType: ArchiveObjectType,
    options: { loadIfNeeded?: boolean } = {},
  ) {
    activeObjectType.value = objectType;

    const objectList = getObjectList(objectType);
    if (
      options.loadIfNeeded &&
      !objectList.loaded &&
      !objectList.loading &&
      capabilities.canQueryRecords.value
    ) {
      await loadArchiveObjects(objectType);
    }
  }

  async function refreshCurrentArchiveObjects() {
    await loadArchiveObjects(activeObjectType.value);
  }

  return {
    activeObjectType,
    loadArchiveObjects,
    objectLists,
    queryArchiveObjects,
    refreshCurrentArchiveObjects,
    setActiveArchiveObjectType,
    setArchiveObjectPage,
    setArchiveObjectSize,
  };
}
