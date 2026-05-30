import type {
  DashboardDomainData,
  DashboardNotificationSummary,
} from '../types/dashboard';

import { computed, onMounted, ref } from 'vue';

import { useAccessStore } from '@vben/stores';

import {
  loadDoctorDomainData,
  loadNotificationSummary,
  loadOperationDomainData,
  loadQualityDomainData,
  loadSpecimenDomainData,
  loadTechnicalDomainData,
} from '../api/dashboard-service';
import {
  buildWorkspaceVisualSummary,
  groupQuickEntriesByDomain,
} from '../utils/dashboard-visualization';

function createEmptyNotificationSummary(): DashboardNotificationSummary {
  return {
    items: [],
    unreadCount: 0,
  };
}

export function useRoleWorkspaceDashboard() {
  const accessStore = useAccessStore();

  const todoLoading = ref(false);
  const alertLoading = ref(false);
  const quickLoading = ref(false);
  const notificationLoading = ref(false);

  const todoError = ref('');
  const alertError = ref('');
  const quickError = ref('');
  const notificationError = ref('');

  const domainData = ref<DashboardDomainData[]>([]);
  const notificationSummary = ref<DashboardNotificationSummary>(
    createEmptyNotificationSummary(),
  );

  const visibleDomainTitles = computed(() =>
    domainData.value.map((item) => item.title).join(' / '),
  );

  const visualSummary = computed(() =>
    buildWorkspaceVisualSummary(domainData.value),
  );

  const quickEntryGroups = computed(() =>
    groupQuickEntriesByDomain(visualSummary.value.quickEntries),
  );

  async function loadWorkspaceSections() {
    const accessCodes = [...accessStore.accessCodes];

    todoLoading.value = true;
    alertLoading.value = true;
    quickLoading.value = true;
    todoError.value = '';
    alertError.value = '';
    quickError.value = '';

    try {
      const domains = await Promise.all([
        loadSpecimenDomainData(accessCodes),
        loadTechnicalDomainData(accessCodes),
        loadDoctorDomainData(accessCodes),
        loadOperationDomainData(accessCodes),
        loadQualityDomainData(accessCodes),
      ]);
      domainData.value = domains.filter(
        (item): item is DashboardDomainData => item !== null,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '工作台加载失败，请稍后重试';
      todoError.value = message;
      alertError.value = message;
      quickError.value = message;
      domainData.value = [];
    } finally {
      todoLoading.value = false;
      alertLoading.value = false;
      quickLoading.value = false;
    }
  }

  async function loadNotifications() {
    notificationLoading.value = true;
    notificationError.value = '';

    try {
      notificationSummary.value = await loadNotificationSummary();
    } catch (error) {
      notificationError.value =
        error instanceof Error ? error.message : '通知加载失败，请稍后重试';
      notificationSummary.value = createEmptyNotificationSummary();
    } finally {
      notificationLoading.value = false;
    }
  }

  async function loadAll() {
    await Promise.all([loadWorkspaceSections(), loadNotifications()]);
  }

  onMounted(() => {
    void loadAll();
  });

  return {
    alertError,
    alertLoading,
    domainData,
    loadAll,
    loadNotifications,
    loadWorkspaceSections,
    notificationError,
    notificationLoading,
    notificationSummary,
    quickEntryGroups,
    quickError,
    quickLoading,
    todoError,
    todoLoading,
    visibleDomainTitles,
    visualSummary,
  };
}
