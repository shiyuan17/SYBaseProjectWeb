import type { PendingTechnicalTaskItem } from '../types/technical-workflow';
import type { WorkflowRiskCard } from '../types/technical-workflow-entry';

import { computed, onMounted, ref } from 'vue';

import { useAccessStore } from '@vben/stores';

import { M2_PERMISSION_CODES } from '#/modules/specimen-workflow/constants';
import { reportInlineErrorDisabled } from '#/utils/error-feedback';

import {
  listPendingTechnicalSpecimenRegistrations,
  listPendingTechnicalTasks,
} from '../api/technical-workflow-service';
import {
  M3_WORKFLOW_ROUTE_ITEMS,
  TECHNICAL_WORKFLOW_ROUTE_META,
} from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import { buildWorkstationSummaryBuckets } from '../utils/workstation';

export function getRiskTagType(level: WorkflowRiskCard['level']) {
  if (level === 'danger') {
    return 'danger';
  }
  if (level === 'success') {
    return 'success';
  }
  if (level === 'warning') {
    return 'warning';
  }
  return 'info';
}

export function useTechnicalWorkflowEntry() {
  const accessStore = useAccessStore();
  const loading = ref(false);
  const pageError = ref('');
  const pendingItems = ref<PendingTechnicalTaskItem[]>([]);
  const pendingSpecimenRegistrationCount = ref(0);

  const accessCodes = computed(() => new Set(accessStore.accessCodes));

  const canAccessReceipt = computed(() =>
    accessCodes.value.has(M2_PERMISSION_CODES.SPECIMEN_RECEIVE),
  );

  const canAccessSpecimenRegistration = computed(() =>
    accessCodes.value.has(
      TECHNICAL_WORKFLOW_ROUTE_META.SPECIMEN_REGISTRATION.authorityCode,
    ),
  );

  const canAccessAnyM3 = computed(() =>
    M3_WORKFLOW_ROUTE_ITEMS.some((item) => accessCodes.value.has(item.code)),
  );

  const canAccessWorkflowEntry = computed(
    () => canAccessAnyM3.value || canAccessReceipt.value,
  );

  const canAccessFrozen = computed(() =>
    accessCodes.value.has(TECHNICAL_WORKFLOW_ROUTE_META.FROZEN.authorityCode),
  );

  const canAccessRework = computed(() =>
    accessCodes.value.has(TECHNICAL_WORKFLOW_ROUTE_META.REWORK.authorityCode),
  );

  const canAccessTracking = computed(() =>
    accessCodes.value.has(TECHNICAL_WORKFLOW_ROUTE_META.TRACKING.authorityCode),
  );

  const accessibleBuckets = computed(() =>
    buildWorkstationSummaryBuckets(pendingItems.value).filter((item) => {
      const routeItem = M3_WORKFLOW_ROUTE_ITEMS.find(
        (candidate) => candidate.path === item.path,
      );
      return routeItem ? accessCodes.value.has(routeItem.code) : false;
    }),
  );

  const regularBuckets = computed(() =>
    accessibleBuckets.value.filter((item) => item.chain === 'REGULAR'),
  );

  const currentWorkingBucket = computed(
    () =>
      regularBuckets.value
        .filter((item) => item.inProgress > 0)
        .toSorted((left, right) => right.inProgress - left.inProgress)[0] ??
      regularBuckets.value[0] ??
      null,
  );

  const abnormalItems = computed(() =>
    pendingItems.value
      .filter(
        (item) => item.timedOut || item.taskType === 'REWORK' || item.remarks,
      )
      .slice(0, 8),
  );

  const frozenReminder = computed(() =>
    pendingItems.value
      .filter(
        (item) => item.taskType === 'FROZEN' || item.currentNode === 'FROZEN',
      )
      .slice(0, 5),
  );

  const riskCards = computed<WorkflowRiskCard[]>(() => [
    {
      level: 'warning',
      title: '处理中任务',
      value: String(
        regularBuckets.value.reduce(
          (total, item) => total + item.inProgress,
          0,
        ),
      ),
    },
    {
      level: 'danger',
      title: '超时风险',
      value: String(pendingItems.value.filter((item) => item.timedOut).length),
    },
    {
      level: 'primary',
      title: '返工闭环',
      value: String(
        pendingItems.value.filter((item) => item.taskType === 'REWORK').length,
      ),
    },
    {
      level: 'success',
      title: '当前可见工位',
      value: String(regularBuckets.value.length),
    },
  ]);

  const workflowLead = computed(() => {
    const regularTaskCount = regularBuckets.value.reduce(
      (total, item) => total + item.pending + item.inProgress,
      0,
    );

    if (!canAccessAnyM3.value) {
      return canAccessSpecimenRegistration.value
        ? '当前账号可处理标本接收与接收后标本登记流程，可先完成登记再进入后续技术工位。'
        : '当前账号仅开通标本接收入口，可先从接收页进入并等待后续技术权限开通。';
    }

    if (pendingSpecimenRegistrationCount.value > 0) {
      return `当前有 ${pendingSpecimenRegistrationCount.value} 条接收后待登记病例，建议先完成标本登记，再进入任务池或取材工位。`;
    }

    if (regularTaskCount === 0) {
      return '当前没有常规制片待办，适合先查看标本登记、任务池、冰冻工作台或技术追踪。';
    }

    return `当前常规制片主链共有 ${regularTaskCount} 条待处理/处理中任务，任务池仍可用于调度，但不再要求先额外分派才能继续处理。`;
  });

  async function loadDashboard() {
    loading.value = true;
    pageError.value = '';
    try {
      const [taskResult, registrationResult] = await Promise.all([
        listPendingTechnicalTasks({
          page: 1,
          size: 200,
          timedOutOnly: false,
        }),
        canAccessSpecimenRegistration.value
          ? listPendingTechnicalSpecimenRegistrations({
              page: 1,
              size: 20,
            })
          : Promise.resolve({ items: [], page: 1, size: 20, total: 0 }),
      ]);
      pendingItems.value = taskResult.items;
      pendingSpecimenRegistrationCount.value = registrationResult.total;
    } catch (error) {
      pageError.value = getWorkflowPageErrorMessage(error);
      reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => {
    if (canAccessAnyM3.value) {
      void loadDashboard();
    }
  });

  return {
    abnormalItems,
    accessibleBuckets,
    canAccessAnyM3,
    canAccessFrozen,
    canAccessReceipt,
    canAccessRework,
    canAccessSpecimenRegistration,
    canAccessTracking,
    canAccessWorkflowEntry,
    currentWorkingBucket,
    frozenReminder,
    loading,
    pageError,
    pendingSpecimenRegistrationCount,
    regularBuckets,
    riskCards,
    workflowLead,
  };
}
