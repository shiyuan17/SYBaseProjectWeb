<script setup lang="ts">
import type {
  ApplicationDetailView,
  LabelPrintRetryResult,
  LatestSpecimenRegistrationResult,
  SpecimenManagementListItem,
  SpecimenManagementListQuery,
  SpecimenManagementListSummary,
  SpecimenRegisterResult,
} from '../types/specimen-workflow';

import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore, useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElDatePicker,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElPagination,
  ElSelect,
  ElOption,
  ElTable,
  ElTableColumn,
  ElTag,
  ElTimeline,
  ElTimelineItem,
  ElDrawer,
  ElMessage,
} from 'element-plus';

import {
  createEmptyWorkflowReferenceOptions,
  loadWorkflowReferenceOptionsSafely,
} from '#/modules/system-management/api/workflow-reference-service';
import DepartmentSelect from '#/modules/system-management/components/DepartmentSelect.vue';
import ReferenceOptionSelect from '#/modules/system-management/components/ReferenceOptionSelect.vue';
import SystemUserSelect from '#/modules/system-management/components/SystemUserSelect.vue';

import {
  completeFixation,
  getApplicationDetail,
  getLatestRegistrationResult,
  listSpecimens,
  retryLabelPrint,
  startFixation,
} from '../api/specimen-workflow-service';
import SpecimenRegisterDialog from '../components/SpecimenRegisterDialog.vue';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { DEFAULT_PAGE_SIZE, M2_PERMISSION_CODES } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  formatCurrentNode,
  formatDateTime,
  formatFixationStatus,
  formatLabelPrintStatus,
  formatNullable,
  formatSpecimenStatus,
} from '../utils/format';

type QuickFilterKey = 'ABNORMAL' | 'ALL' | 'PENDING_LABEL' | 'VERIFIED';
type AbnormalFilterValue = '' | 'false' | 'true';
type VerifyAction = 'complete' | 'start';

const route = useRoute();
const router = useRouter();
const accessStore = useAccessStore();
const userStore = useUserStore();

const props = withDefaults(
  defineProps<{
    embedded?: boolean;
    registrationApplicationId?: string;
    registrationTriggerKey?: number;
  }>(),
  {
    embedded: false,
    registrationApplicationId: '',
    registrationTriggerKey: 0,
  },
);

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

function createEmptySummary(): SpecimenManagementListSummary {
  return {
    abnormalCount: 0,
    labelPrintedCount: 0,
    pendingLabelCount: 0,
    totalCount: 0,
  };
}

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

const registerDialogVisible = ref(false);
const registerDialogApplicationId = ref('');

const detailDrawerVisible = ref(false);
const detailLoading = ref(false);
const detailRow = ref<null | SpecimenManagementListItem>(null);
const detailApplicationDetail = ref<null | ApplicationDetailView>(null);
const detailLatestRegisterResult = ref<LatestSpecimenRegistrationResult | null>(null);

const resultDialogVisible = ref(false);
const latestRegisterApplicationId = ref('');
const latestRegisterResult = ref<SpecimenRegisterResult | null>(null);

const retryDialogVisible = ref(false);
const retrySubmitting = ref(false);
const retrySelectionCount = ref(0);
const retrySourceLabel = ref('');
const currentRetryResult = ref<LabelPrintRetryResult | null>(null);
const retryContext = reactive({
  applicationId: '',
  batchNo: '',
});
const retryForm = reactive({
  operatorName: '',
  operatorUserId: '',
  printerCode: '',
  remarks: '',
  terminalCode: '',
});

const verifyDialogVisible = ref(false);
const verifySubmitting = ref(false);
const verifyAction = ref<VerifyAction>('start');
const verifyTargetRow = ref<null | SpecimenManagementListItem>(null);
const workflowReferenceOptions = ref(createEmptyWorkflowReferenceOptions());
const verifyForm = reactive({
  fixationLiquidType: '',
  operatorName: '',
  operatorUserId: '',
  remarks: '',
  specimenBarcode: '',
  terminalCode: '',
});

function resetRetryForm() {
  Object.assign(retryForm, {
    operatorName: currentUserName.value,
    operatorUserId: currentUserId.value,
    printerCode: '',
    remarks: '',
    terminalCode: '',
  });
}

function resetVerifyForm() {
  Object.assign(verifyForm, {
    fixationLiquidType: '',
    operatorName: currentUserName.value,
    operatorUserId: currentUserId.value,
    remarks: '',
    specimenBarcode: '',
    terminalCode: '',
  });
}

watch(
  () => [currentUserId.value, currentUserName.value],
  () => {
    resetRetryForm();
    resetVerifyForm();
  },
  { immediate: true },
);

function normalizeRouteQueryValue(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : '';
  }
  return '';
}

function resolveQuickFilterQuery(): Partial<
  Pick<SpecimenManagementListQuery, 'abnormalFlag' | 'labelPrintStatus' | 'specimenStatus'>
> {
  if (quickFilter.value === 'ABNORMAL') {
    return { abnormalFlag: true };
  }
  if (quickFilter.value === 'PENDING_LABEL') {
    return { labelPrintStatus: 'PENDING' };
  }
  if (quickFilter.value === 'VERIFIED') {
    return { specimenStatus: 'FIXED' };
  }
  return {};
}

function resolveExplicitAbnormalFlag() {
  if (filters.abnormalFlag === 'true') {
    return true;
  }
  if (filters.abnormalFlag === 'false') {
    return false;
  }
  return undefined;
}

function buildListQuery(): SpecimenManagementListQuery {
  const quickQuery = resolveQuickFilterQuery();
  return {
    abnormalFlag: resolveExplicitAbnormalFlag() ?? quickQuery.abnormalFlag,
    dateFrom: filters.dateRange[0] || undefined,
    dateTo: filters.dateRange[1] || undefined,
    departmentId: filters.departmentId.trim() || undefined,
    keyword: filters.keyword.trim() || undefined,
    labelPrintStatus: filters.labelPrintStatus || quickQuery.labelPrintStatus,
    page: filters.page,
    size: filters.size,
    specimenStatus: filters.specimenStatus || quickQuery.specimenStatus || undefined,
  };
}

function isNotFoundError(error: unknown) {
  const apiError = error as {
    message?: string;
    response?: {
      data?: {
        error?: string;
        message?: string;
      };
      status?: number;
    };
  };
  const responseMessage =
    apiError.response?.data?.error || apiError.response?.data?.message || apiError.message || '';

  return apiError.response?.status === 404 || responseMessage === 'Resource not found';
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
    if (isNotFoundError(error)) {
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
  const applicationId = normalizeRouteQueryValue(route.query.applicationId).trim();
  if (applicationId && canQueryApplicationDetail.value) {
    try {
      const detail = await getApplicationDetail(applicationId);
      if (!filters.keyword.trim() && detail.applicationNo?.trim()) {
        filters.keyword = detail.applicationNo.trim();
      }
    } catch {
      // ignore backfill errors
    }
  }
  await loadSpecimens();
}

function resolveSelectedRegisterApplicationId() {
  if (props.registrationApplicationId.trim()) {
    return props.registrationApplicationId.trim();
  }

  const routeApplicationId = normalizeRouteQueryValue(route.query.applicationId).trim();
  if (routeApplicationId) {
    return routeApplicationId;
  }

  const applicationIds = Array.from(
    new Set(
      selectedRows.value
        .map((row) => row.applicationId)
        .filter((applicationId) => Boolean(applicationId)),
    ),
  );

  if (applicationIds.length > 1) {
    ElMessage.warning('请选择同一申请单下的标本后再登记');
    return '';
  }

  return applicationIds[0] ?? '';
}

async function openRegisterDialogForApplication(applicationId: string) {
  const normalizedApplicationId = applicationId.trim();
  if (!normalizedApplicationId) {
    return;
  }
  registerDialogApplicationId.value = normalizedApplicationId;
  registerDialogVisible.value = true;
}

async function openRegisterDialog() {
  const applicationId = resolveSelectedRegisterApplicationId();
  if (!applicationId) {
    ElMessage.warning('请先从申请单进入，或在当前列表中选中同一申请单下的标本');
    return;
  }
  await openRegisterDialogForApplication(applicationId);
}

watch(
  () => [route.query.applicationId, route.query.action],
  ([applicationId, action]) => {
    const normalizedApplicationId = normalizeRouteQueryValue(applicationId).trim();
    void applyRouteInitialFilter();
    if (action === 'register' && normalizedApplicationId) {
      void openRegisterDialogForApplication(normalizedApplicationId);
    }
  },
  { immediate: true },
);

watch(
  () => [props.registrationApplicationId, props.registrationTriggerKey] as const,
  ([applicationId]) => {
    if (!props.embedded) {
      return;
    }
    const normalizedApplicationId = applicationId.trim();
    if (normalizedApplicationId) {
      void openRegisterDialogForApplication(normalizedApplicationId);
    }
  },
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

function handleDepartmentChange(department: null | { id: string; name: string }) {
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

async function openDetailDrawer(row: SpecimenManagementListItem) {
  detailDrawerVisible.value = true;
  detailRow.value = row;
  detailApplicationDetail.value = null;
  detailLatestRegisterResult.value = null;
  detailLoading.value = true;
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
  } finally {
    detailLoading.value = false;
  }
}

function canRetryBatch(row: SpecimenManagementListItem) {
  return Boolean(row.labelPrintBatchNo) && ['FAILED', 'PENDING'].includes(row.labelPrintStatus ?? '');
}

function isVerifyCompleted(row: SpecimenManagementListItem) {
  return row.specimenStatus === 'FIXED' || row.fixationStatus === 'COMPLETED';
}

function canStartVerify(row: SpecimenManagementListItem) {
  return !row.abnormalFlag && !isVerifyCompleted(row) && row.fixationStatus !== 'FIXING';
}

function canCompleteVerify(row: SpecimenManagementListItem) {
  return !row.abnormalFlag && row.fixationStatus === 'FIXING';
}

function openRetryDialog(rows: SpecimenManagementListItem[], sourceLabel: string) {
  if (!rows.length) {
    ElMessage.warning('请先选择需要补打的标本');
    return;
  }
  if (rows.some((row) => !canRetryBatch(row))) {
    ElMessage.warning('仅待打印或打印失败的记录支持补打');
    return;
  }

  const [firstRow] = rows;
  const batchNumbers = Array.from(
    new Set(
      rows
        .map((row) => row.labelPrintBatchNo)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const [batchNo] = batchNumbers;
  if (!firstRow || batchNumbers.length !== 1 || !batchNo) {
    ElMessage.warning('批量补打仅允许选择同一标签批次');
    return;
  }

  retryContext.applicationId = firstRow.applicationId;
  retryContext.batchNo = batchNo;
  retrySelectionCount.value = rows.length;
  retrySourceLabel.value = sourceLabel;
  currentRetryResult.value = null;
  resetRetryForm();
  retryDialogVisible.value = true;
}

function handleBulkRetry() {
  openRetryDialog(selectedRows.value, '批量补打标签');
}

function handleRowRetry(row: SpecimenManagementListItem) {
  openRetryDialog([row], '补打本批次');
}

async function submitRetry() {
  if (!retryContext.batchNo) {
    ElMessage.warning('缺少标签批次号');
    return;
  }
  if (!retryForm.printerCode.trim()) {
    ElMessage.warning('请输入打印机编号');
    return;
  }

  retrySubmitting.value = true;
  pageError.value = '';
  try {
    const result = await retryLabelPrint(retryContext.batchNo, {
      operatorName: retryForm.operatorName.trim(),
      operatorUserId: retryForm.operatorUserId.trim() || null,
      printerCode: retryForm.printerCode.trim(),
      remarks: retryForm.remarks.trim() || null,
      terminalCode: retryForm.terminalCode.trim() || null,
    });
    currentRetryResult.value = result;
    ElMessage.success('批次补打已提交');
    await loadSpecimens();
    if (detailDrawerVisible.value && detailRow.value?.applicationId === retryContext.applicationId) {
      await openDetailDrawer(detailRow.value);
    }
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    retrySubmitting.value = false;
  }
}

function openRetryDialogFromLatestResult() {
  const result = latestRegisterResult.value;
  if (!result?.labelPrintBatchNo) {
    return;
  }

  openRetryDialog(
    result.specimens
      .filter((item) => ['FAILED', 'PENDING'].includes(item.labelPrintStatus ?? ''))
      .map((item) => ({
        abnormalFlag: false,
        applicationId: latestRegisterApplicationId.value,
        applicationNo: '',
        barcode: item.barcode,
        containerCount: item.containerCount,
        containerName: item.containerName,
        fixationStatus: item.fixationStatus,
        labelPrintBatchNo: result.labelPrintBatchNo,
        labelPrintStatus: item.labelPrintStatus,
        latestTrackingAt: null,
        patientName: null,
        registeredAt: null,
        specimenCount: item.specimenCount,
        specimenId: item.id,
        specimenName: item.specimenName,
        specimenNo: item.specimenNo,
        specimenSite: item.specimenSite,
        specimenStatus: item.specimenStatus,
        specimenType: item.specimenType,
        submittingDepartmentId: null,
        submittingDepartmentName: null,
      })),
    '登记结果补打',
  );
}

function goToTracking(row: SpecimenManagementListItem) {
  void router.push({
    path: '/workflow/tracking-exception',
    query: {
      barcode: row.barcode,
    },
  });
}

async function openVerifyDialog(row: SpecimenManagementListItem, action: VerifyAction) {
  verifyAction.value = action;
  verifyTargetRow.value = row;
  verifyDialogVisible.value = true;
  verifyForm.specimenBarcode = row.barcode;
  verifyForm.fixationLiquidType = '';
  verifyForm.remarks = '';
  verifyForm.terminalCode = '';
  workflowReferenceOptions.value = await loadWorkflowReferenceOptionsSafely({
    enabled: canQueryWorkflowReference.value,
  });
}

async function submitVerify() {
  const barcode = verifyForm.specimenBarcode.trim();
  if (!barcode) {
    ElMessage.warning('缺少标本条码');
    return;
  }
  if (!verifyForm.operatorName.trim()) {
    ElMessage.warning('请选择核验人');
    return;
  }

  verifySubmitting.value = true;
  pageError.value = '';
  try {
    const payload = {
      fixationLiquidType: verifyForm.fixationLiquidType.trim() || null,
      operatorName: verifyForm.operatorName.trim(),
      operatorUserId: verifyForm.operatorUserId.trim() || null,
      remarks: verifyForm.remarks.trim() || null,
      specimenBarcode: barcode,
      terminalCode: verifyForm.terminalCode.trim() || null,
    };

    if (verifyAction.value === 'start') {
      await startFixation(payload);
      ElMessage.success(`条码 ${barcode} 已开始核验`);
    } else {
      await completeFixation(payload);
      ElMessage.success(`条码 ${barcode} 已完成核验`);
    }

    verifyDialogVisible.value = false;
    await loadSpecimens();
    if (detailDrawerVisible.value && detailRow.value?.specimenId === verifyTargetRow.value?.specimenId) {
      const latestRow = items.value.find((item) => item.specimenId === verifyTargetRow.value?.specimenId);
      if (latestRow) {
        await openDetailDrawer(latestRow);
      }
    }
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    verifySubmitting.value = false;
  }
}

function handleVerifyOperatorChange(user: null | { id: string; name: string }) {
  verifyForm.operatorUserId = user?.id ?? '';
  verifyForm.operatorName = user?.name ?? '';
}

function formatContainerRatio(row: SpecimenManagementListItem) {
  return `${row.containerCount ?? '-'} / ${row.specimenCount ?? '-'}`;
}

function labelTagType(status?: null | string) {
  if (status === 'SUCCESS') {
    return 'success';
  }
  if (status === 'FAILED') {
    return 'danger';
  }
  if (status === 'PENDING') {
    return 'warning';
  }
  return 'info';
}

function specimenTagType(row: SpecimenManagementListItem) {
  if (row.abnormalFlag) {
    return 'danger';
  }
  if (row.specimenStatus === 'RECEIVED' || row.specimenStatus === 'FIXED') {
    return 'success';
  }
  if (row.specimenStatus === 'REGISTERED' || row.specimenStatus === 'FIXING') {
    return 'warning';
  }
  return 'info';
}

function closeResultDialog() {
  resultDialogVisible.value = false;
}
</script>

<template>
  <Page :title="embedded ? undefined : '申请与登记'">
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
        show-icon
      />

      <template v-if="canManageSpecimens">
        <WorkflowSectionCard
          title="工作台概览"
          description="围绕登记、贴签、核验和异常处理组织当前工作台。"
        >
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
              <div class="text-sm text-muted-foreground">登记总数</div>
              <div class="mt-2 text-2xl font-semibold text-foreground">{{ summary.totalCount }}</div>
            </section>
            <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
              <div class="text-sm text-muted-foreground">已贴签</div>
              <div class="mt-2 text-2xl font-semibold text-foreground">{{ summary.labelPrintedCount }}</div>
            </section>
            <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
              <div class="text-sm text-muted-foreground">待贴签</div>
              <div class="mt-2 text-2xl font-semibold text-foreground">{{ summary.pendingLabelCount }}</div>
            </section>
            <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
              <div class="text-sm text-muted-foreground">异常</div>
              <div class="mt-2 text-2xl font-semibold text-foreground">{{ summary.abnormalCount }}</div>
            </section>
          </div>
        </WorkflowSectionCard>

        <WorkflowSectionCard
          title="标本列表"
          description="快捷筛选与高级筛选共同驱动当前工作台列表。"
        >
          <template #extra>
            <div class="flex flex-wrap gap-2">
              <ElButton
                v-for="option in quickFilterOptions"
                :key="option.key"
                :type="quickFilter === option.key ? 'primary' : 'default'"
                plain
                @click="handleQuickFilterChange(option.key)"
              >
                {{ option.label }}
              </ElButton>
            </div>
          </template>

          <ElForm label-width="88px">
            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <ElFormItem label="关键词">
                <ElInput
                  v-model="filters.keyword"
                  clearable
                  placeholder="申请单号 / 标本号 / 条码 / 患者"
                  @keyup.enter="handleSearch"
                />
              </ElFormItem>
              <ElFormItem label="送检科室">
                <DepartmentSelect
                  v-model="filters.departmentId"
                  placeholder="请选择送检科室"
                  @change="handleDepartmentChange"
                />
              </ElFormItem>
              <ElFormItem label="标签状态">
                <ElSelect v-model="filters.labelPrintStatus" clearable style="width: 100%">
                  <ElOption
                    v-for="option in labelPrintStatusOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </ElSelect>
              </ElFormItem>
              <ElFormItem label="标本状态">
                <ElSelect v-model="filters.specimenStatus" clearable style="width: 100%">
                  <ElOption
                    v-for="option in specimenStatusOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </ElSelect>
              </ElFormItem>
              <ElFormItem label="异常标记">
                <ElSelect v-model="filters.abnormalFlag" clearable style="width: 100%">
                  <ElOption
                    v-for="option in abnormalFilterOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </ElSelect>
              </ElFormItem>
            </div>

            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_auto]">
              <ElFormItem label="登记日期">
                <ElDatePicker
                  v-model="filters.dateRange"
                  end-placeholder="结束日期"
                  range-separator="至"
                  start-placeholder="开始日期"
                  style="width: 100%"
                  type="daterange"
                  value-format="YYYY-MM-DD"
                />
              </ElFormItem>
              <ElFormItem class="xl:justify-self-end">
                <div class="flex flex-wrap gap-2">
                  <ElButton type="primary" @click="handleSearch">查询</ElButton>
                  <ElButton @click="handleReset">重置</ElButton>
                  <ElButton type="primary" plain @click="openRegisterDialog">登记标本</ElButton>
                  <ElButton :disabled="selectedRows.length === 0" plain @click="handleBulkRetry">
                    批量补打
                  </ElButton>
                </div>
              </ElFormItem>
            </div>
          </ElForm>

          <ElTable
            v-loading="listLoading"
            :data="items"
            border
            row-key="specimenId"
            @selection-change="handleSelectionChange"
          >
            <ElTableColumn type="selection" width="48" />
            <ElTableColumn label="标本编号" min-width="150" prop="specimenNo" />
            <ElTableColumn label="关联申请单" min-width="160" prop="applicationNo" />
            <ElTableColumn label="患者姓名" min-width="120">
              <template #default="{ row }">
                {{ formatNullable(row.patientName) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="送检科室" min-width="160">
              <template #default="{ row }">
                {{ formatNullable(row.submittingDepartmentName) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="标本名称" min-width="180" prop="specimenName" />
            <ElTableColumn label="容器名称" min-width="150">
              <template #default="{ row }">
                {{ formatNullable(row.containerName) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="容器数/标本数" min-width="140">
              <template #default="{ row }">
                {{ formatContainerRatio(row) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="采集部位" min-width="150">
              <template #default="{ row }">
                {{ formatNullable(row.specimenSite) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="登记时间" min-width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.registeredAt) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="标签打印状态" min-width="160">
              <template #default="{ row }">
                <div class="flex flex-col items-start gap-2">
                  <ElTag :type="labelTagType(row.labelPrintStatus)">
                    {{ formatLabelPrintStatus(row.labelPrintStatus) }}
                  </ElTag>
                  <ElButton
                    v-if="canRetryBatch(row)"
                    link
                    type="primary"
                    @click="handleRowRetry(row)"
                  >
                    补打标签
                  </ElButton>
                </div>
              </template>
            </ElTableColumn>
            <ElTableColumn label="标本状态" min-width="160">
              <template #default="{ row }">
                <div class="flex flex-col items-start gap-2">
                  <ElTag :type="specimenTagType(row)">
                    {{ formatSpecimenStatus(row.specimenStatus) }}
                  </ElTag>
                  <span class="text-xs text-muted-foreground">
                    {{ formatFixationStatus(row.fixationStatus) }}
                  </span>
                </div>
              </template>
            </ElTableColumn>
            <ElTableColumn fixed="right" label="操作" width="220">
              <template #default="{ row }">
                <div class="flex flex-wrap gap-x-3 gap-y-1">
                  <ElButton v-if="row.abnormalFlag" link type="danger" @click="goToTracking(row)">
                    异常处理
                  </ElButton>
                  <ElButton v-else-if="canRetryBatch(row)" link type="primary" @click="handleRowRetry(row)">
                    补打标签
                  </ElButton>
                  <ElButton
                    v-else-if="canVerifyFixation && canStartVerify(row)"
                    link
                    type="primary"
                    @click="openVerifyDialog(row, 'start')"
                  >
                    开始核验
                  </ElButton>
                  <ElButton
                    v-else-if="canVerifyFixation && canCompleteVerify(row)"
                    link
                    type="success"
                    @click="openVerifyDialog(row, 'complete')"
                  >
                    完成核验
                  </ElButton>
                  <ElButton link type="primary" @click="openDetailDrawer(row)">
                    详情
                  </ElButton>
                </div>
              </template>
            </ElTableColumn>
          </ElTable>

          <div class="flex justify-end pt-4">
            <ElPagination
              :current-page="filters.page"
              :page-size="filters.size"
              :page-sizes="[10, 20, 50, 100]"
              :total="total"
              background
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="handlePageChange"
              @size-change="handleSizeChange"
            />
          </div>
        </WorkflowSectionCard>
      </template>
    </div>

    <SpecimenRegisterDialog
      v-model="registerDialogVisible"
      :application-id="registerDialogApplicationId"
      @registered="handleRegisterSuccess"
    />

    <ElDrawer
      v-model="detailDrawerVisible"
      :close-on-click-modal="true"
      destroy-on-close
      size="58%"
      title="标本详情"
    >
      <div v-loading="detailLoading" class="flex flex-col gap-4">
        <ElAlert
          v-if="detailRow?.abnormalFlag"
          :closable="false"
          title="该标本当前处于异常状态，请结合追踪信息尽快处理。"
          type="warning"
          show-icon
        />

        <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div class="mb-4 text-base font-semibold text-foreground">标本基础信息</div>
          <ElDescriptions :column="2" border>
            <ElDescriptionsItem label="标本编号">
              {{ detailRow?.specimenNo || '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="条码">
              {{ detailRow?.barcode || '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="标本名称">
              {{ detailRow?.specimenName || '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="标本类型">
              {{ formatNullable(detailRow?.specimenType) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="采集部位">
              {{ formatNullable(detailRow?.specimenSite) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="容器名称">
              {{ formatNullable(detailRow?.containerName) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="容器数/标本数">
              {{ detailRow ? formatContainerRatio(detailRow) : '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="标签状态">
              {{ formatLabelPrintStatus(detailRow?.labelPrintStatus) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="标本状态">
              {{ formatSpecimenStatus(detailRow?.specimenStatus) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="核验状态">
              {{ formatFixationStatus(detailRow?.fixationStatus) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="登记时间">
              {{ formatDateTime(detailRow?.registeredAt) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem :span="2" label="最近标签批次">
              {{ formatNullable(detailRow?.labelPrintBatchNo) }}
            </ElDescriptionsItem>
          </ElDescriptions>
        </section>

        <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div class="mb-4 text-base font-semibold text-foreground">所属申请单信息</div>
          <ElDescriptions :column="2" border>
            <ElDescriptionsItem label="申请单号">
              {{ formatNullable(detailApplicationDetail?.applicationNo ?? detailRow?.applicationNo) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="患者姓名">
              {{ formatNullable(detailApplicationDetail?.patientName ?? detailRow?.patientName) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="送检科室">
              {{
                formatNullable(
                  detailApplicationDetail?.submittingDepartmentName
                    ?? detailRow?.submittingDepartmentName,
                )
              }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="当前节点">
              {{ formatCurrentNode(detailApplicationDetail?.currentNode) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem :span="2" label="临床诊断">
              {{ formatNullable(detailApplicationDetail?.clinicalDiagnosis) }}
            </ElDescriptionsItem>
          </ElDescriptions>
        </section>

        <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div class="mb-4 flex items-center justify-between gap-2">
            <div class="text-base font-semibold text-foreground">最近流程节点</div>
            <ElButton
              v-if="detailRow"
              link
              type="primary"
              @click="goToTracking(detailRow)"
            >
              去追踪与异常
            </ElButton>
          </div>

          <ElTimeline v-if="detailApplicationDetail?.recentEvents?.length">
            <ElTimelineItem
              v-for="(event, index) in detailApplicationDetail.recentEvents.slice(-6).reverse()"
              :key="`${event.eventTime}-${event.nodeCode}-${index}`"
              :timestamp="formatDateTime(event.eventTime)"
            >
              <div class="font-medium text-foreground">
                {{ formatCurrentNode(event.nodeCode) }} / {{ formatNullable(event.eventType) }}
              </div>
              <div class="text-sm text-muted-foreground">
                {{ formatNullable(event.operatorName) }}
                {{ formatNullable(event.eventContent) }}
              </div>
            </ElTimelineItem>
          </ElTimeline>
          <ElEmpty v-else description="暂无流程节点记录" />
        </section>

        <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div class="mb-4 text-base font-semibold text-foreground">最近标签批次结果</div>

          <template v-if="detailLatestRegisterResult?.labelPrintBatchNo">
            <ElDescriptions :column="2" border>
              <ElDescriptionsItem label="标签批次号">
                {{ detailLatestRegisterResult.labelPrintBatchNo }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="打印结果">
                <ElTag :type="detailLatestRegisterResult.labelPrintSuccess ? 'success' : 'warning'">
                  {{ detailLatestRegisterResult.labelPrintSuccess ? '成功' : '存在失败' }}
                </ElTag>
              </ElDescriptionsItem>
              <ElDescriptionsItem :span="2" label="结果说明">
                {{ formatNullable(detailLatestRegisterResult.labelPrintMessage) }}
              </ElDescriptionsItem>
            </ElDescriptions>

            <ElTable :data="detailLatestRegisterResult.specimens" border class="mt-4">
              <ElTableColumn label="标本编号" min-width="140" prop="specimenNo" />
              <ElTableColumn label="条码" min-width="180" prop="barcode" />
              <ElTableColumn label="标本名称" min-width="180" prop="specimenName" />
              <ElTableColumn label="容器名称" min-width="140">
                <template #default="{ row }">
                  {{ formatNullable(row.containerName) }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="容器数/标本数" min-width="140">
                <template #default="{ row }">
                  {{ `${row.containerCount ?? '-'} / ${row.specimenCount ?? '-'}` }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="标签状态" min-width="120">
                <template #default="{ row }">
                  {{ formatLabelPrintStatus(row.labelPrintStatus) }}
                </template>
              </ElTableColumn>
            </ElTable>
          </template>
          <ElEmpty v-else description="暂无最近批次结果" />
        </section>
      </div>
    </ElDrawer>

    <ElDialog
      v-model="resultDialogVisible"
      :close-on-click-modal="false"
      destroy-on-close
      title="登记结果"
      width="1100px"
    >
      <div class="flex flex-col gap-4">
        <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
          <ElDescriptions :column="2" border>
            <ElDescriptionsItem label="申请单 ID">
              {{ latestRegisterApplicationId || '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="标签批次号">
              {{ latestRegisterResult?.labelPrintBatchNo || '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="打印结果">
              <ElTag :type="latestRegisterResult?.labelPrintSuccess ? 'success' : 'warning'">
                {{ latestRegisterResult?.labelPrintSuccess ? '成功' : '存在失败' }}
              </ElTag>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="结果说明">
              {{ formatNullable(latestRegisterResult?.labelPrintMessage) }}
            </ElDescriptionsItem>
          </ElDescriptions>

          <ElTable :data="latestRegisterResult?.specimens ?? []" border class="mt-4">
            <ElTableColumn label="标本编号" min-width="140" prop="specimenNo" />
            <ElTableColumn label="条码" min-width="180" prop="barcode" />
            <ElTableColumn label="标本名称" min-width="180" prop="specimenName" />
            <ElTableColumn label="容器名称" min-width="140">
              <template #default="{ row }">
                {{ formatNullable(row.containerName) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="容器数/标本数" min-width="140">
              <template #default="{ row }">
                {{ `${row.containerCount ?? '-'} / ${row.specimenCount ?? '-'}` }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="标签状态" min-width="120">
              <template #default="{ row }">
                {{ formatLabelPrintStatus(row.labelPrintStatus) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="标本状态" min-width="120">
              <template #default="{ row }">
                {{ formatSpecimenStatus(row.specimenStatus) }}
              </template>
            </ElTableColumn>
          </ElTable>
        </section>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <ElButton @click="closeResultDialog">关闭</ElButton>
          <ElButton
            v-if="latestRegisterResult?.labelPrintBatchNo && !latestRegisterResult.labelPrintSuccess"
            type="primary"
            @click="openRetryDialogFromLatestResult()"
          >
            补打本批次
          </ElButton>
        </div>
      </template>
    </ElDialog>

    <ElDialog
      v-model="retryDialogVisible"
      :close-on-click-modal="false"
      destroy-on-close
      title="标签补打"
      width="760px"
    >
      <div class="flex flex-col gap-4">
        <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
          <ElDescriptions :column="2" border>
            <ElDescriptionsItem label="来源">
              {{ retrySourceLabel || '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="标签批次号">
              {{ retryContext.batchNo || '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="涉及标本数">
              {{ retrySelectionCount }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="最近结果">
              <ElTag :type="currentRetryResult?.allSuccessful ? 'success' : 'info'">
                {{ currentRetryResult ? (currentRetryResult.allSuccessful ? '全部成功' : '已提交补打') : '待执行' }}
              </ElTag>
            </ElDescriptionsItem>
          </ElDescriptions>
        </section>

        <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
          <ElForm label-width="96px">
            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <ElFormItem label="操作人" required>
                <ElInput :model-value="retryForm.operatorName" disabled />
              </ElFormItem>
              <ElFormItem label="打印机编号" required>
                <ElInput v-model="retryForm.printerCode" placeholder="请输入打印机编号" />
              </ElFormItem>
              <ElFormItem label="终端编号">
                <ElInput v-model="retryForm.terminalCode" placeholder="工作站或扫码设备编号" />
              </ElFormItem>
            </div>
            <ElFormItem label="备注">
              <ElInput v-model="retryForm.remarks" placeholder="补打说明" />
            </ElFormItem>
          </ElForm>
        </section>

        <section v-if="currentRetryResult" class="rounded-lg border border-border bg-card p-4 shadow-sm">
          <ElDescriptions :column="2" border>
            <ElDescriptionsItem label="批次号">
              {{ currentRetryResult.labelPrintBatchNo }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="整体结果">
              <ElTag :type="currentRetryResult.allSuccessful ? 'success' : 'warning'">
                {{ currentRetryResult.allSuccessful ? '全部成功' : '部分成功' }}
              </ElTag>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="成功数">
              {{ currentRetryResult.successCount }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="失败数">
              {{ currentRetryResult.failedCount }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="重试数">
              {{ currentRetryResult.retriedCount }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="消息">
              {{ formatNullable(currentRetryResult.message) }}
            </ElDescriptionsItem>
          </ElDescriptions>
        </section>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <ElButton @click="retryDialogVisible = false">取消</ElButton>
          <ElButton :loading="retrySubmitting" type="primary" @click="submitRetry">
            提交补打
          </ElButton>
        </div>
      </template>
    </ElDialog>

    <ElDialog
      v-model="verifyDialogVisible"
      :close-on-click-modal="false"
      destroy-on-close
      :title="verifyAction === 'start' ? '开始核验' : '完成核验'"
      width="760px"
    >
      <div class="flex flex-col gap-4">
        <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
          <ElDescriptions :column="2" border>
            <ElDescriptionsItem label="标本编号">
              {{ verifyTargetRow?.specimenNo || '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="条码">
              {{ verifyTargetRow?.barcode || '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="容器名称">
              {{ formatNullable(verifyTargetRow?.containerName) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="容器数/标本数">
              {{ verifyTargetRow ? formatContainerRatio(verifyTargetRow) : '-' }}
            </ElDescriptionsItem>
          </ElDescriptions>
        </section>

        <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
          <ElForm label-width="96px">
            <div class="grid gap-4 md:grid-cols-2">
              <ElFormItem label="核验人" required>
                <SystemUserSelect
                  v-model="verifyForm.operatorUserId"
                  :selected-label="verifyForm.operatorName"
                  placeholder="请选择核验人"
                  @change="handleVerifyOperatorChange"
                />
              </ElFormItem>
              <ElFormItem label="固定液">
                <ReferenceOptionSelect
                  v-model="verifyForm.fixationLiquidType"
                  :options="workflowReferenceOptions.fixationLiquidTypes"
                  placeholder="请选择或输入固定液"
                />
              </ElFormItem>
              <ElFormItem label="终端编号">
                <ElInput v-model="verifyForm.terminalCode" placeholder="工作站或扫码设备编号" />
              </ElFormItem>
            </div>
            <ElFormItem label="备注">
              <ElInput
                v-model="verifyForm.remarks"
                :rows="2"
                placeholder="必要时补充核验说明"
                type="textarea"
              />
            </ElFormItem>
          </ElForm>
        </section>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <ElButton @click="verifyDialogVisible = false">取消</ElButton>
          <ElButton :loading="verifySubmitting" type="primary" @click="submitVerify">
            {{ verifyAction === 'start' ? '开始核验' : '完成核验' }}
          </ElButton>
        </div>
      </template>
    </ElDialog>
  </Page>
</template>
