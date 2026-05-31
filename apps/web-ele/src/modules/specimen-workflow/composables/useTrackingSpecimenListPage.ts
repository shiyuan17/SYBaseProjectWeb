import type {
  ApplicationDetailView,
  LatestSpecimenRegistrationResult,
  SpecimenManagementListItem,
  SpecimenManagementListSummary,
} from '../types/specimen-workflow';
import type {
  AbnormalFilterValue,
  QuickFilterKey,
} from '../utils/tracking-specimen-list';

import { computed, reactive, ref, watch } from 'vue';

import { useAccessStore } from '@vben/stores';

import {
  getApplicationDetail,
  getLatestRegistrationResult,
  listSpecimens,
} from '../api/specimen-workflow-service';
import { DEFAULT_PAGE_SIZE, M2_PERMISSION_CODES } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import { buildSpecimenAbnormalDetails } from '../utils/specimen-abnormal';
import {
  buildTrackingSpecimenListQuery,
  createEmptySpecimenManagementSummary,
  resolveDetailTargetSpecimen,
} from '../utils/tracking-specimen-list';

export type TrackingSpecimenListViewProps = {
  initialBarcode?: string;
  triggerKey?: number;
};

export function useTrackingSpecimenListPage(
  props: TrackingSpecimenListViewProps,
) {
  const accessStore = useAccessStore();

  const canManageSpecimens = computed(() =>
    accessStore.accessCodes.includes(M2_PERMISSION_CODES.SPECIMEN_REGISTER),
  );
  const canQueryApplicationDetail = computed(() =>
    accessStore.accessCodes.includes(
      M2_PERMISSION_CODES.APPLICATION_DETAIL_QUERY,
    ),
  );

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
  const summary = ref<SpecimenManagementListSummary>(
    createEmptySpecimenManagementSummary(),
  );
  const total = ref(0);
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

  const detailVisible = ref(false);
  const detailLoading = ref(false);
  const detailRow = ref<null | SpecimenManagementListItem>(null);
  const detailApplicationDetail = ref<ApplicationDetailView | null>(null);
  const detailLatestRegisterResult =
    ref<LatestSpecimenRegistrationResult | null>(null);

  const detailTargetSpecimen = computed(() => {
    const specimenId = detailRow.value?.specimenId;
    if (!specimenId) {
      return null;
    }
    return resolveDetailTargetSpecimen(
      specimenId,
      detailApplicationDetail.value,
      detailLatestRegisterResult.value,
    );
  });

  const detailAbnormalSpecimens = computed(() =>
    detailTargetSpecimen.value
      ? buildSpecimenAbnormalDetails([detailTargetSpecimen.value])
      : [],
  );

  async function loadSpecimens(): Promise<SpecimenManagementListItem[]> {
    if (!canManageSpecimens.value) {
      items.value = [];
      total.value = 0;
      summary.value = createEmptySpecimenManagementSummary();
      return [];
    }

    listLoading.value = true;
    pageError.value = '';
    try {
      const result = await listSpecimens(
        buildTrackingSpecimenListQuery(filters, quickFilter.value),
      );
      items.value = result.items;
      total.value = result.total;
      summary.value = result.summary;
      return result.items;
    } catch (error) {
      pageError.value = getWorkflowPageErrorMessage(error);
      items.value = [];
      total.value = 0;
      summary.value = createEmptySpecimenManagementSummary();
      return [];
    } finally {
      listLoading.value = false;
    }
  }

  async function openDetailDialog(row: SpecimenManagementListItem) {
    detailVisible.value = true;
    detailLoading.value = true;
    detailRow.value = row;
    detailApplicationDetail.value = null;
    detailLatestRegisterResult.value = null;
    pageError.value = '';
    try {
      const [applicationDetail, latestResult] = await Promise.all([
        canQueryApplicationDetail.value
          ? getApplicationDetail(row.applicationId)
          : Promise.resolve(null),
        getLatestRegistrationResult(row.applicationId).catch(() => null),
      ]);
      detailApplicationDetail.value = applicationDetail;
      detailLatestRegisterResult.value = latestResult;
    } catch (error) {
      pageError.value = getWorkflowPageErrorMessage(error);
      detailVisible.value = false;
    } finally {
      detailLoading.value = false;
    }
  }

  async function applyInitialBarcode(barcode: string) {
    const normalizedBarcode = barcode.trim();
    if (!normalizedBarcode) {
      await loadSpecimens();
      return;
    }

    filters.keyword = normalizedBarcode;
    filters.page = 1;
    const rows = await loadSpecimens();
    const targetRow = rows.find((item) => item.barcode === normalizedBarcode);
    if (targetRow) {
      await openDetailDialog(targetRow);
    }
  }

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
    void loadSpecimens();
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

  function handlePageChange(page: number) {
    filters.page = page;
    void loadSpecimens();
  }

  function handleSizeChange(size: number) {
    filters.size = size;
    filters.page = 1;
    void loadSpecimens();
  }

  watch(
    () => [props.initialBarcode, props.triggerKey] as const,
    ([barcode]) => {
      void applyInitialBarcode(barcode ?? '');
    },
    { immediate: true },
  );

  return {
    abnormalFilterOptions,
    detailAbnormalSpecimens,
    detailApplicationDetail,
    detailLatestRegisterResult,
    detailLoading,
    detailRow,
    detailVisible,
    filters,
    handleDepartmentChange,
    handlePageChange,
    handleQuickFilterChange,
    handleReset,
    handleSearch,
    handleSizeChange,
    items,
    labelPrintStatusOptions,
    listLoading,
    openDetailDialog,
    pageError,
    quickFilter,
    quickFilterOptions,
    specimenStatusOptions,
    summary,
    total,
    canManageSpecimens,
    canQueryApplicationDetail,
    loadSpecimens,
  };
}
