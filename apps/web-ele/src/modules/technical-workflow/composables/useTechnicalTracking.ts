import type { TechnicalTrackingView } from '../types/technical-workflow';

import { computed, ref, watch } from 'vue';

import { ElMessage } from 'element-plus';
import { useRoute } from 'vue-router';

import { reportInlineErrorDisabled } from '#/utils/error-feedback';

import { getTechnicalTracking } from '../api/technical-workflow-service';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  formatDateTime,
  formatEventStatus,
  formatNullable,
  formatTaskStatus,
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
  const loading = ref(false);
  const caseId = ref(
    typeof route.query.caseId === 'string' ? route.query.caseId : '',
  );
  const trackingResult = ref<null | TechnicalTrackingView>(null);
  const activeTab = ref(resolveInitialTrackingTab(route.query.tab));
  const selectedNodeId = ref('');

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
    ),
  );

  function handleNodeClick(data: { id: string }) {
    selectedNodeId.value = data.id;
  }

  async function loadTracking() {
    const normalizedCaseId = caseId.value.trim();
    if (!normalizedCaseId) {
      pageError.value = '请输入病例ID、病理号或对象ID';
      trackingResult.value = null;
      ElMessage.warning(pageError.value);
      return;
    }

    loading.value = true;
    pageError.value = '';
    try {
      trackingResult.value = await getTechnicalTracking(normalizedCaseId);
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
      loading.value = false;
    }
  }

  function handleReset() {
    caseId.value = '';
    pageError.value = '';
    activeTab.value = 'timeline';
    selectedNodeId.value = '';
    trackingResult.value = null;
  }

  watch(
    () => route.query,
    (query) => {
      const nextCaseId = normalizeTrackingQueryValue(query.caseId);
      const previousCaseId = caseId.value.trim();

      caseId.value = nextCaseId;
      activeTab.value = resolveInitialTrackingTab(query.tab);

      if (!trackingResult.value) {
        if (nextCaseId) {
          void loadTracking();
        }
        return;
      }

      if (nextCaseId && nextCaseId !== previousCaseId) {
        void loadTracking();
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
    context,
    filteredQcEvaluations,
    filteredReworks,
    filteredTasks,
    handleNodeClick,
    handleReset,
    loadTracking,
    loading,
    pageError,
    selectedNode,
    selectedNodeId,
    trackingResult,
    treeData,
    workflowTimelineSteps,
  };
}
