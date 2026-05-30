import type { AnalyticsOverviewResult } from '../types/dashboard';

import { computed, onMounted, ref } from 'vue';

import { useAccessStore } from '@vben/stores';

import dayjs from 'dayjs';

import { loadAnalyticsOverview } from '../api/dashboard-service';
import { buildAnalyticsVisualSummary } from '../utils/dashboard-visualization';

function createEmptyAnalyticsOverview(): AnalyticsOverviewResult {
  return {
    kpiCards: [],
    operationRows: [],
    qualityRows: [],
    riskCards: [],
    workloadRows: [],
  };
}

export function useAnalyticsOverviewDashboard() {
  const accessStore = useAccessStore();

  const loading = ref(false);
  const pageError = ref('');
  const overview = ref<AnalyticsOverviewResult>(createEmptyAnalyticsOverview());

  const currentMonthLabel = computed(() => dayjs().format('YYYY 年 MM 月'));
  const dateRangeLabel = computed(
    () =>
      `${dayjs().startOf('month').format('MM.DD')} - ${dayjs().format('MM.DD')}`,
  );

  const hasContent = computed(
    () =>
      overview.value.kpiCards.length > 0 ||
      overview.value.riskCards.length > 0 ||
      overview.value.operationRows.length > 0 ||
      overview.value.qualityRows.length > 0 ||
      overview.value.workloadRows.length > 0,
  );

  const visualSummary = computed(() =>
    buildAnalyticsVisualSummary(overview.value),
  );

  async function loadPage() {
    loading.value = true;
    pageError.value = '';

    try {
      overview.value = await loadAnalyticsOverview([
        ...accessStore.accessCodes,
      ]);
    } catch (error) {
      pageError.value =
        error instanceof Error ? error.message : '分析页加载失败，请稍后重试';
      overview.value = createEmptyAnalyticsOverview();
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => {
    void loadPage();
  });

  return {
    currentMonthLabel,
    dateRangeLabel,
    hasContent,
    loading,
    loadPage,
    overview,
    pageError,
    visualSummary,
  };
}
