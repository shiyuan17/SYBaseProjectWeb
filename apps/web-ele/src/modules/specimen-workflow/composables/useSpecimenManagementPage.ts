import type { ApplicationRegistrationWorkbenchRecord } from '../types/application-registration-workbench';
import type {
  SpecimenManagementListItem,
  SpecimenManagementListSummary,
  SpecimenRegisterResult,
} from '../types/specimen-workflow';
import type {
  AbnormalFilterValue,
  QuickFilterKey,
} from '../utils/specimen-management';

import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAccessStore, useUserStore } from '@vben/stores';

import { ElMessage } from 'element-plus';

import {
  getApplicationDetail,
  listSpecimens,
} from '../api/specimen-workflow-service';
import { DEFAULT_PAGE_SIZE, M2_PERMISSION_CODES } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  buildSpecimenManagementListQuery,
  createEmptySummary,
  isNotFoundWorkflowError,
  normalizeRouteQueryValue,
  triggerWorkbenchLookupState,
} from '../utils/specimen-management';
import { buildApplicationFormPrintDocument } from '../utils/specimen-print';
import { useSpecimenManagementRetry } from './useSpecimenManagementRetry';
import { useSpecimenManagementVerify } from './useSpecimenManagementVerify';

export type SpecimenManagementViewProps = {
  embedded?: boolean;
  registrationApplicationId?: string;
  registrationTriggerKey?: number;
};

export function useSpecimenManagementPage(props: SpecimenManagementViewProps) {
  const route = useRoute();
  const router = useRouter();
  const accessStore = useAccessStore();
  const userStore = useUserStore();

  const accessCodeSet = computed(() => new Set(accessStore.accessCodes));
  const canManageSpecimens = computed(() =>
    accessCodeSet.value.has(M2_PERMISSION_CODES.SPECIMEN_REGISTER),
  );
  const canQueryApplicationDetail = computed(() =>
    accessCodeSet.value.has(M2_PERMISSION_CODES.APPLICATION_DETAIL_QUERY),
  );
  const canVerifyFixation = computed(() =>
    accessCodeSet.value.has(M2_PERMISSION_CODES.FIXATION_VERIFY),
  );
  const canQueryWorkflowReference = computed(() =>
    accessCodeSet.value.has(M2_PERMISSION_CODES.WORKFLOW_REFERENCE_QUERY),
  );

  const currentUserName = computed(() => userStore.userInfo?.realName ?? '');
  const currentUserId = computed(() => userStore.userInfo?.userId ?? '');

  const quickFilterOptions: Array<{ key: QuickFilterKey; label: string }> = [
    { key: 'ALL', label: '全部' },
    { key: 'PENDING_LABEL', label: '待贴签' },
    { key: 'ABNORMAL', label: '异常' },
    { key: 'VERIFIED', label: '已核验' },
  ];

  const labelPrintStatusOptions = [
    { label: '全部标签状态', value: '' },
    { label: '待打印', value: 'PENDING' },
    { label: '打印成功', value: 'SUCCESS' },
    { label: '打印失败', value: 'FAILED' },
  ] as const;

  const specimenStatusOptions = [
    { label: '全部标本状态', value: '' },
    { label: '已登记', value: 'REGISTERED' },
    { label: '固定中', value: 'FIXING' },
    { label: '固定完成', value: 'FIXED' },
    { label: '转运中', value: 'IN_TRANSIT' },
    { label: '已接收', value: 'RECEIVED' },
    { label: '已拒收', value: 'REJECTED' },
    { label: '已退回', value: 'RETURNED' },
  ] as const;

  const abnormalFilterOptions = [
    { label: '全部异常标记', value: '' },
    { label: '异常', value: 'true' },
    { label: '正常', value: 'false' },
  ] as const;

  const pageError = ref('');
  const listLoading = ref(false);
  const items = ref<SpecimenManagementListItem[]>([]);
  const summary = ref<SpecimenManagementListSummary>(createEmptySummary());
  const total = ref(0);
  const selectedRows = ref<SpecimenManagementListItem[]>([]);
  const quickFilter = ref<QuickFilterKey>('ALL');

  const filters = reactive({
    abnormalFlag: '' as AbnormalFilterValue,
    dateRange: [] as string[],
    departmentId: '',
    keyword: '',
    labelPrintStatus: '',
    page: 1,
    size: DEFAULT_PAGE_SIZE,
    specimenStatus: '',
  });

  const workbenchLookupKeyword = ref('');
  const workbenchLookupQueryType = ref<
    'APPLICATION_NO' | 'AUTO' | 'INPATIENT_NO' | 'PATIENT_NAME'
  >('INPATIENT_NO');
  const workbenchLookupTriggerKey = ref(0);
  const registerDialogVisible = ref(false);
  const registerDialogApplicationId = ref('');

  const detailDrawerVisible = ref(false);
  const detailLoading = ref(false);
  const detailRow = ref<null | SpecimenManagementListItem>(null);

  const resultDialogVisible = ref(false);
  const latestRegisterApplicationId = ref('');
  const latestRegisterResult = ref<null | SpecimenRegisterResult>(null);

  const {
    detailApplicationDetail,
    detailLatestRegisterResult,
    openDetailDrawer,
    openVerifyDialog,
    submitVerify,
    verifyAction,
    verifyDialogVisible,
    verifyForm,
    verifySubmitting,
    verifyTargetRow,
    workflowReferenceOptions,
  } = useSpecimenManagementVerify({
    canQueryApplicationDetail,
    canQueryWorkflowReference,
    currentUserId,
    currentUserName,
    detailDrawerVisible,
    detailLoading,
    detailRow,
    items,
    loadSpecimens,
    pageError,
  });

  function triggerWorkbenchLookup(
    keyword: string,
    queryType:
      | 'APPLICATION_NO'
      | 'AUTO'
      | 'INPATIENT_NO'
      | 'PATIENT_NAME' = 'AUTO',
  ) {
    const lookupState = triggerWorkbenchLookupState(keyword, queryType);
    if (!lookupState) {
      return;
    }
    workbenchLookupKeyword.value = lookupState.keyword;
    workbenchLookupQueryType.value = lookupState.queryType;
    workbenchLookupTriggerKey.value += lookupState.triggerKeyDelta;
  }

  async function resolveApplicationDetailById(applicationId: string) {
    const normalizedApplicationId = applicationId.trim();
    if (!normalizedApplicationId) {
      return null;
    }

    if (!canQueryApplicationDetail.value) {
      return null;
    }

    try {
      return await getApplicationDetail(normalizedApplicationId);
    } catch {
      return null;
    }
  }

  function resolveWorkbenchLookupTarget(
    applicationId: string,
    applicationNo?: null | string,
  ) {
    const normalizedApplicationId = applicationId.trim();
    const normalizedApplicationNo = applicationNo?.trim() ?? '';
    if (normalizedApplicationNo) {
      return {
        keyword: normalizedApplicationNo,
        queryType: 'APPLICATION_NO' as const,
      };
    }
    if (!normalizedApplicationId) {
      return null;
    }
    return {
      keyword: normalizedApplicationId,
      queryType: 'AUTO' as const,
    };
  }

  function buildListQuery() {
    return buildSpecimenManagementListQuery({
      abnormalFlag: filters.abnormalFlag,
      dateRange: filters.dateRange,
      departmentId: filters.departmentId,
      keyword: filters.keyword,
      labelPrintStatus: filters.labelPrintStatus,
      page: filters.page,
      quickFilter: quickFilter.value,
      size: filters.size,
      specimenStatus: filters.specimenStatus,
    });
  }

  async function loadSpecimens() {
    if (!canManageSpecimens.value) {
      items.value = [];
      total.value = 0;
      summary.value = createEmptySummary();
      return;
    }

    listLoading.value = true;
    pageError.value = '';
    try {
      const result = await listSpecimens(buildListQuery());
      items.value = result.items;
      total.value = result.total;
      summary.value = result.summary;
    } catch (error) {
      if (isNotFoundWorkflowError(error)) {
        items.value = [];
        total.value = 0;
        summary.value = createEmptySummary();
        pageError.value = '';
        return;
      }
      pageError.value = getWorkflowPageErrorMessage(error);
    } finally {
      listLoading.value = false;
    }
  }

  async function applyRouteInitialFilter() {
    if (props.embedded) {
      return;
    }

    const applicationId = normalizeRouteQueryValue(
      route.query.applicationId,
    ).trim();
    const detail = await resolveApplicationDetailById(applicationId);
    if (!filters.keyword.trim() && detail?.applicationNo?.trim()) {
      filters.keyword = detail.applicationNo.trim();
    }
    await loadSpecimens();
  }

  watch(
    () => [route.query.applicationId, route.query.action],
    async ([applicationId, action]) => {
      if (props.embedded) {
        return;
      }

      const normalizedApplicationId =
        normalizeRouteQueryValue(applicationId).trim();
      const detail = await resolveApplicationDetailById(normalizedApplicationId);
      if (!filters.keyword.trim() && detail?.applicationNo?.trim()) {
        filters.keyword = detail.applicationNo.trim();
      }
      if (action === 'register' && normalizedApplicationId) {
        const lookupTarget = resolveWorkbenchLookupTarget(
          normalizedApplicationId,
          detail?.applicationNo,
        );
        if (lookupTarget) {
          triggerWorkbenchLookup(lookupTarget.keyword, lookupTarget.queryType);
        }
      }
      await loadSpecimens();
    },
    { immediate: true },
  );

  watch(
    () =>
      [props.registrationApplicationId, props.registrationTriggerKey] as const,
    async ([applicationId]) => {
      if (!props.embedded) {
        return;
      }
      const normalizedApplicationId = (applicationId ?? '').trim();
      if (normalizedApplicationId) {
        const detail =
          await resolveApplicationDetailById(normalizedApplicationId);
        const lookupTarget = resolveWorkbenchLookupTarget(
          normalizedApplicationId,
          detail?.applicationNo,
        );
        if (lookupTarget) {
          triggerWorkbenchLookup(lookupTarget.keyword, lookupTarget.queryType);
        }
      }
    },
    { immediate: true },
  );

  function handleSearch() {
    filters.page = 1;
    void loadSpecimens();
  }

  function handleReset() {
    filters.abnormalFlag = '';
    filters.dateRange = [];
    filters.departmentId = '';
    filters.keyword = '';
    filters.labelPrintStatus = '';
    filters.page = 1;
    filters.size = DEFAULT_PAGE_SIZE;
    filters.specimenStatus = '';
    quickFilter.value = 'ALL';
    void applyRouteInitialFilter();
  }

  function handleDepartmentChange(
    department: null | { id: string; name: string },
  ) {
    filters.departmentId = department?.id ?? '';
  }

  function handleQuickFilterChange(nextQuickFilter: QuickFilterKey) {
    quickFilter.value = nextQuickFilter;
    filters.page = 1;
    void loadSpecimens();
  }

  function handleSelectionChange(rows: SpecimenManagementListItem[]) {
    selectedRows.value = rows;
  }

  function handlePageChange(page: number) {
    filters.page = page;
    void loadSpecimens();
  }

  function handleSizeChange(size: number) {
    filters.size = size;
    filters.page = 1;
    void loadSpecimens();
  }

  function handleRegisterSuccess(payload: {
    applicationId: string;
    registerResult: SpecimenRegisterResult;
  }) {
    latestRegisterApplicationId.value = payload.applicationId;
    latestRegisterResult.value = payload.registerResult;
    registerDialogVisible.value = false;
    resultDialogVisible.value = true;
    void loadSpecimens();
  }

  function handleWorkbenchSaved() {
    void loadSpecimens();
  }

  function openPrintWindow(documentHtml: string) {
    const printWindow = window.open('', '_blank', 'width=960,height=760');
    if (!printWindow) {
      ElMessage.warning('打印窗口被浏览器拦截，请允许弹窗后重试');
      return null;
    }

    printWindow.document.open();
    printWindow.document.write(documentHtml);
    printWindow.document.close();
    return printWindow;
  }

  function handleWorkbenchReprintApplicationForm(payload: {
    applicationId: string;
    record: ApplicationRegistrationWorkbenchRecord;
  }) {
    const applicationId =
      payload.applicationId.trim() ||
      payload.record.patientInfo.applicationNo.trim();
    if (!applicationId) {
      ElMessage.warning('缺少补打申请单所需的申请单号');
      return;
    }

    pageError.value = '';
    try {
      const printDocument = buildApplicationFormPrintDocument(payload.record);
      openPrintWindow(printDocument);
    } catch (error) {
      pageError.value = getWorkflowPageErrorMessage(error);
    }
  }

  const {
    currentRetryResult,
    handleBulkRetry,
    handleRowRetry,
    openRetryDialogFromLatestResult,
    retryContext,
    retryDialogVisible,
    retryForm,
    retrySelectionCount,
    retrySourceLabel,
    retrySubmitting,
    submitRetry,
  } = useSpecimenManagementRetry({
    currentUserId,
    currentUserName,
    detailDrawerVisible,
    detailRow,
    latestRegisterApplicationId,
    latestRegisterResult,
    loadSpecimens,
    openDetailDrawer,
    pageError,
    selectedRows,
  });

  function goToTracking(row: SpecimenManagementListItem) {
    void router.push({
      path: '/workflow/tracking-exception',
      query: {
        barcode: row.barcode,
      },
    });
  }

  return {
    abnormalFilterOptions,
    canManageSpecimens,
    canQueryApplicationDetail,
    canQueryWorkflowReference,
    canVerifyFixation,
    currentRetryResult,
    detailApplicationDetail,
    detailDrawerVisible,
    detailLatestRegisterResult,
    detailLoading,
    detailRow,
    filters,
    handleBulkRetry,
    handleDepartmentChange,
    handlePageChange,
    handleQuickFilterChange,
    handleRegisterSuccess,
    handleReset,
    handleRowRetry,
    handleSearch,
    handleSelectionChange,
    handleSizeChange,
    handleWorkbenchReprintApplicationForm,
    handleWorkbenchSaved,
    items,
    labelPrintStatusOptions,
    latestRegisterApplicationId,
    latestRegisterResult,
    listLoading,
    openDetailDrawer,
    openRetryDialogFromLatestResult,
    openVerifyDialog,
    pageError,
    quickFilter,
    quickFilterOptions,
    registerDialogApplicationId,
    registerDialogVisible,
    resultDialogVisible,
    retryContext,
    retryDialogVisible,
    retryForm,
    retrySelectionCount,
    retrySourceLabel,
    retrySubmitting,
    selectedRows,
    specimenStatusOptions,
    submitRetry,
    submitVerify,
    summary,
    total,
    verifyAction,
    verifyDialogVisible,
    verifyForm,
    verifySubmitting,
    verifyTargetRow,
    workbenchLookupKeyword,
    workbenchLookupQueryType,
    workbenchLookupTriggerKey,
    workflowReferenceOptions,
    goToTracking,
  };
}
