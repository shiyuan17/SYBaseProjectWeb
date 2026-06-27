import type {
  PathologyDashboardLoadState,
  PathologyScreenDashboardResponse,
} from '../types/pathology-screen';

import { computed, onMounted, ref } from 'vue';

import { useUserStore } from '@vben/stores';

import { queryPathologyScreenDashboard } from '../api/pathology-screen-service';
import {
  readPathologyDashboardSnapshot,
  writePathologyDashboardSnapshot,
} from '../utils/pathology-dashboard-cache';

function resolveErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '病理大屏数据加载失败';
}

function isForbiddenError(error: unknown) {
  return (error as { response?: { status?: number } })?.response?.status === 403;
}

export function usePathologyDashboardScreen() {
  const userStore = useUserStore();

  const dashboard = ref<null | PathologyScreenDashboardResponse>(null);
  const initialLoading = ref(true);
  const refreshing = ref(false);
  const forbidden = ref(false);
  const blockingError = ref('');
  const refreshError = ref('');
  const cachedAt = ref<null | number>(null);

  const currentUserId = computed(() => userStore.userInfo?.userId?.trim() ?? '');
  const hasCachedSnapshot = computed(() => cachedAt.value !== null);
  const loadState = computed<PathologyDashboardLoadState>(() => {
    if (initialLoading.value) {
      return 'loading';
    }
    if (forbidden.value) {
      return 'forbidden';
    }
    if (blockingError.value) {
      return 'error';
    }
    return 'ready';
  });

  function hydrateFromCache() {
    if (!currentUserId.value) {
      return false;
    }

    const snapshot = readPathologyDashboardSnapshot(currentUserId.value);
    if (!snapshot) {
      return false;
    }

    dashboard.value = snapshot.dashboard;
    cachedAt.value = snapshot.cachedAt;
    initialLoading.value = false;
    return true;
  }

  hydrateFromCache();

  async function refreshData() {
    const hasCached = dashboard.value !== null;
    if (hasCached) {
      refreshing.value = true;
      refreshError.value = '';
    } else {
      initialLoading.value = true;
      blockingError.value = '';
      forbidden.value = false;
    }

    try {
      const response = await queryPathologyScreenDashboard();
      dashboard.value = response;
      cachedAt.value = Date.now();
      refreshError.value = '';
      blockingError.value = '';
      forbidden.value = false;

      if (currentUserId.value) {
        writePathologyDashboardSnapshot(currentUserId.value, response);
      }
    } catch (error) {
      if (hasCached) {
        refreshError.value = resolveErrorMessage(error);
      } else if (isForbiddenError(error)) {
        forbidden.value = true;
      } else {
        blockingError.value = resolveErrorMessage(error);
      }
    } finally {
      initialLoading.value = false;
      refreshing.value = false;
    }
  }

  onMounted(() => {
    void refreshData();
  });

  return {
    blockingError,
    cachedAt,
    dashboard,
    forbidden,
    hasCachedSnapshot,
    initialLoading,
    loadState,
    refreshData,
    refreshError,
    refreshing,
  };
}
