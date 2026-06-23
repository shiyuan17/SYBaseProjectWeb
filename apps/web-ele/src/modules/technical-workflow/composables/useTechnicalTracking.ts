import type {
  TechnicalTrackingCaseListItem,
  TechnicalTrackingCaseListPage,
  TechnicalTrackingView,
} from '../types/technical-workflow';

import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { ElMessage } from 'element-plus';

import { reportInlineErrorDisabled } from '#/utils/error-feedback';

import {
  getTechnicalTracking,
  listTechnicalTrackingCases,
} from '../api/technical-workflow-service';
import {
  buildDateRangeQueryParams,
  resolveRouteDateRange,
} from '../utils/date-range';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  formatDateTime,
  formatEventStatus,
  formatNullable,
  formatTaskStatus,
  formatTechnicalTrackingEventContent,
} from '../utils/format';
import {
  buildTrackingTreeData,
  buildWorkflowTimelineSteps,
  filterTrackingQcEvaluations,
  filterTrackingReworks,
  filterTrackingTasks,
  normalizeTrackingQueryValue,
  resolveInitialTrackingTab,
  resolveSelectedTrackingNodeId,
} from '../utils/tracking';
import { buildWorkstationCaseContext } from '../utils/workstation';

export function useTechnicalTracking() {
  const route = useRoute();

  const pageError = ref('');
  const listLoading = ref(false);
  const detailLoading = ref(false);
  const caseId = ref(
    typeof route.query.caseId === 'string' ? route.query.caseId : '',
  );
  const dateRange = ref<string[]>(resolveRouteDateRange(route.query));
  const trackingResult = ref<null | TechnicalTrackingView>(null);
  const caseList = ref<TechnicalTrackingCaseListPage>({
    items: [],
    page: 1,
    size: 20,
    total: 0,
  });
  const selectedCaseId = ref('');
  const activeTab = ref(resolveInitialTrackingTab(route.query.tab));
  const selectedNodeId = ref('');
  const hasDeepLinkedCase = computed(() => Boolean(caseId.value.trim()));
  const hasDateRange = computed(() => dateRange.value.length === 2);
  const loading = computed(() => listLoading.value || detailLoading.value);

  const context = computed(() =>
    trackingResult.value
      ? buildWorkstationCaseContext(trackingResult.value)
      : null,
  );

  const treeData = computed(() => buildTrackingTreeData(context.value));

  const selectedNode = computed(() => {
    if (!selectedNodeId.value || !context.value) {
      return null;
    }
    return (
      context.value.progressNodes.find(
        (item) => item.id === selectedNodeId.value,
      ) ?? null
    );
  });

  const filteredTasks = computed(() =>
    filterTrackingTasks(trackingResult.value, selectedNode.value),
  );

  const filteredReworks = computed(() =>
    filterTrackingReworks(trackingResult.value, selectedNode.value),
  );

  const filteredQcEvaluations = computed(() =>
    filterTrackingQcEvaluations(trackingResult.value, selectedNode.value),
  );

  const workflowTimelineSteps = computed(() =>
    buildWorkflowTimelineSteps(
      trackingResult.value,
      context.value,
      formatDateTime,
      formatEventStatus,
      formatNullable,
      formatTaskStatus,
      formatTechnicalTrackingEventContent,
    ),
  );

  const detailEmptyText = computed(() => {
    if (!hasDeepLinkedCase.value && caseList.value.items.length > 1) {
      return '请选择病例查看技术追踪详情';
    }
    if (!hasDeepLinkedCase.value && caseList.value.items.length === 0) {
      return '请选择工作日期后查询命中病例';
    }
    return '暂无技术追踪详情';
  });

  function handleNodeClick(data: { id: string }) {
    selectedNodeId.value = data.id;
  }

  function resetTrackingDetail() {
    trackingResult.value = null;
    selectedNodeId.value = '';
    activeTab.value = 'timeline';
  }

  function buildTrackingQueryParams() {
    return {
      ...buildDateRangeQueryParams(dateRange.value),
      workDate:
        dateRange.value.length === 0 &&
        typeof route.query.workDate === 'string' &&
        route.query.workDate.trim()
          ? route.query.workDate
          : undefined,
    };
  }

  async function loadTrackingByIdentifier(identifier: string) {
    detailLoading.value = true;
    pageError.value = '';
    try {
      trackingResult.value = await getTechnicalTracking(
        identifier,
        buildTrackingQueryParams(),
      );
      activeTab.value = resolveInitialTrackingTab(route.query.tab);
      selectedNodeId.value = resolveSelectedTrackingNodeId(
        {
          objectId:
            typeof route.query.objectId === 'string'
              ? route.query.objectId
              : '',
          taskId:
            typeof route.query.taskId === 'string' ? route.query.taskId : '',
        },
        activeTab.value,
        trackingResult.value,
      );
    } catch (error) {
      trackingResult.value = null;
      pageError.value = getWorkflowPageErrorMessage(error);
      reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
    } finally {
      detailLoading.value = false;
    }
  }

  async function loadTrackingForCaseItem(item: TechnicalTrackingCaseListItem) {
    selectedCaseId.value = item.caseId;
    await loadTrackingByIdentifier(item.caseId);
  }

  async function loadTracking() {
    const normalizedCaseId = caseId.value.trim();
    if (normalizedCaseId) {
      caseList.value = {
        items: [],
        page: 1,
        size: caseList.value.size,
        total: 0,
      };
      selectedCaseId.value = normalizedCaseId;
      await loadTrackingByIdentifier(normalizedCaseId);
      return;
    }

    if (!hasDateRange.value) {
      pageError.value = '请输入病例ID、病理号或对象ID，或选择工作日期';
      resetTrackingDetail();
      caseList.value = {
        items: [],
        page: 1,
        size: caseList.value.size,
        total: 0,
      };
      selectedCaseId.value = '';
      ElMessage.warning(pageError.value);
      return;
    }

    listLoading.value = true;
    pageError.value = '';
    try {
      const previousSelectedCaseId = selectedCaseId.value;
      const result = await listTechnicalTrackingCases({
        ...buildDateRangeQueryParams(dateRange.value),
        page: caseList.value.page,
        size: caseList.value.size,
      });
      caseList.value = result;

      const firstCase = result.items[0];
      if (result.items.length === 1 && firstCase) {
        await loadTrackingForCaseItem(firstCase);
        return;
      }

      const retainedCase = result.items.find(
        (item) => item.caseId === previousSelectedCaseId,
      );
      if (retainedCase) {
        await loadTrackingForCaseItem(retainedCase);
        return;
      }

      selectedCaseId.value = '';
      resetTrackingDetail();
    } catch (error) {
      resetTrackingDetail();
      caseList.value = {
        items: [],
        page: caseList.value.page,
        size: caseList.value.size,
        total: 0,
      };
      pageError.value = getWorkflowPageErrorMessage(error);
      reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
    } finally {
      listLoading.value = false;
    }
  }

  async function handleCaseSelect(item: TechnicalTrackingCaseListItem) {
    await loadTrackingForCaseItem(item);
  }

  async function handleCaseListPageChange(page: number) {
    caseList.value = {
      ...caseList.value,
      page,
    };
    await loadTracking();
  }

  async function handleCaseListSizeChange(size: number) {
    caseList.value = {
      ...caseList.value,
      page: 1,
      size,
    };
    await loadTracking();
  }

  function handleReset() {
    caseId.value = '';
    dateRange.value = [];
    pageError.value = '';
    activeTab.value = 'timeline';
    selectedNodeId.value = '';
    selectedCaseId.value = '';
    caseList.value = {
      items: [],
      page: 1,
      size: 20,
      total: 0,
    };
    resetTrackingDetail();
  }

  watch(
    () => route.query,
    (query) => {
      const nextCaseId = normalizeTrackingQueryValue(query.caseId);
      const previousCaseId = caseId.value.trim();

      caseId.value = nextCaseId;
      dateRange.value = resolveRouteDateRange(query);
      activeTab.value = resolveInitialTrackingTab(query.tab);

      if (!trackingResult.value && nextCaseId) {
        void loadTracking();
        return;
      }

      if (nextCaseId && nextCaseId !== previousCaseId) {
        void loadTracking();
        return;
      }

      if (!trackingResult.value) {
        selectedNodeId.value = '';
        return;
      }

      selectedNodeId.value = resolveSelectedTrackingNodeId(
        {
          objectId:
            typeof query.objectId === 'string' ? query.objectId : undefined,
          taskId: typeof query.taskId === 'string' ? query.taskId : undefined,
        },
        activeTab.value,
        trackingResult.value,
      );
    },
  );

  if (caseId.value) {
    void loadTracking();
  }

  return {
    activeTab,
    caseId,
    caseList,
    context,
    detailEmptyText,
    filteredQcEvaluations,
    filteredReworks,
    filteredTasks,
    handleCaseListPageChange,
    handleCaseListSizeChange,
    handleCaseSelect,
    handleNodeClick,
    handleReset,
    loadTracking,
    loading,
    listLoading,
    pageError,
    selectedCaseId,
    selectedNode,
    selectedNodeId,
    trackingResult,
    treeData,
    dateRange,
    workflowTimelineSteps,
  };
}
