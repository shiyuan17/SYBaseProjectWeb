<script setup lang="ts">
import type {
  ApplicationDetailView,
  LatestSpecimenRegistrationResult,
  SpecimenManagementListItem,
  SpecimenManagementListQuery,
  SpecimenManagementListSummary,
} from '../types/specimen-workflow';

import { computed, reactive, ref, watch } from 'vue';

import { useAccessStore } from '@vben/stores';

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
  ElOption,
  ElPagination,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
  ElTimeline,
  ElTimelineItem,
} from 'element-plus';

import DepartmentSelect from '#/modules/system-management/components/DepartmentSelect.vue';

import {
  getApplicationDetail,
  getLatestRegistrationResult,
  listSpecimens,
} from '../api/specimen-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { DEFAULT_PAGE_SIZE, M2_PERMISSION_CODES } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  formatCurrentNode,
  formatDateTime,
  formatFixationStatus,
  formatLabelPrintStatus,
  formatNullable,
  formatQualityCheckResult,
  formatReceiptStatus,
  formatSpecimenStatus,
} from '../utils/format';
import { buildSpecimenAbnormalDetails } from '../utils/specimen-abnormal';

type QuickFilterKey = 'ABNORMAL' | 'ALL' | 'PENDING_LABEL' | 'VERIFIED';
type AbnormalFilterValue = '' | 'false' | 'true';

const props = withDefaults(
  defineProps<{
    initialBarcode?: string;
    triggerKey?: number;
  }>(),
  {
    initialBarcode: '',
    triggerKey: 0,
  },
);

const accessStore = useAccessStore();

const canManageSpecimens = computed(() =>
  accessStore.accessCodes.includes(M2_PERMISSION_CODES.SPECIMEN_REGISTER),
);
const canQueryApplicationDetail = computed(() =>
  accessStore.accessCodes.includes(M2_PERMISSION_CODES.APPLICATION_DETAIL_QUERY),
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
const detailApplicationDetail = ref<null | ApplicationDetailView>(null);
const detailLatestRegisterResult = ref<LatestSpecimenRegistrationResult | null>(null);

const detailTargetSpecimen = computed(() => {
  const specimenId = detailRow.value?.specimenId;
  if (!specimenId) {
    return null;
  }
  return (
    detailApplicationDetail.value?.specimens.find((specimen) => specimen.id === specimenId)
    ?? detailLatestRegisterResult.value?.specimens.find((specimen) => specimen.id === specimenId)
    ?? null
  );
});

const detailAbnormalSpecimens = computed(() =>
  detailTargetSpecimen.value ? buildSpecimenAbnormalDetails([detailTargetSpecimen.value]) : [],
);

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

function labelTagType(status?: null | string) {
  if (status === 'SUCCESS') {
    return 'success';
  }
  if (status === 'FAILED') {
    return 'danger';
  }
  return 'info';
}

function specimenTagType(row: SpecimenManagementListItem) {
  if (row.abnormalFlag || row.specimenStatus === 'REJECTED' || row.specimenStatus === 'RETURNED') {
    return 'danger';
  }
  if (row.specimenStatus === 'RECEIVED' || row.specimenStatus === 'FIXED') {
    return 'success';
  }
  if (row.specimenStatus === 'FIXING' || row.fixationStatus === 'FIXING') {
    return 'warning';
  }
  return 'info';
}

async function loadSpecimens(): Promise<SpecimenManagementListItem[]> {
  if (!canManageSpecimens.value) {
    items.value = [];
    total.value = 0;
    summary.value = createEmptySummary();
    return [];
  }

  listLoading.value = true;
  pageError.value = '';
  try {
    const result = await listSpecimens(buildListQuery());
    items.value = result.items;
    total.value = result.total;
    summary.value = result.summary;
    return result.items;
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
    items.value = [];
    total.value = 0;
    summary.value = createEmptySummary();
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

function handleDepartmentChange(department: null | { id: string; name: string }) {
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

function formatContainerRatio(row: SpecimenManagementListItem) {
  return `${row.containerCount ?? '-'} / ${row.specimenCount ?? '-'}`;
}

watch(
  () => [props.initialBarcode, props.triggerKey] as const,
  ([barcode]) => {
    void applyInitialBarcode(barcode);
  },
  { immediate: true },
);
</script>

<template>
  <div class="flex flex-col gap-4">
    <ElAlert
      v-if="pageError"
      :closable="false"
      :title="pageError"
      type="error"
      show-icon
    />

    <WorkflowSectionCard
      title="工作台概览"
      description="通过快捷筛选和状态统计快速定位追踪对象。"
    >
      <div class="flex flex-wrap gap-2">
        <ElButton
          v-for="option in quickFilterOptions"
          :key="option.key"
          :plain="quickFilter !== option.key"
          :type="quickFilter === option.key ? 'primary' : 'default'"
          @click="handleQuickFilterChange(option.key)"
        >
          {{ option.label }}
        </ElButton>
      </div>

      <div class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div class="text-sm text-muted-foreground">总数</div>
          <div class="mt-2 text-2xl font-semibold text-foreground">
            {{ summary.totalCount }}
          </div>
        </div>
        <div class="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div class="text-sm text-muted-foreground">异常</div>
          <div class="mt-2 text-2xl font-semibold text-red-500">
            {{ summary.abnormalCount }}
          </div>
        </div>
        <div class="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div class="text-sm text-muted-foreground">待贴签</div>
          <div class="mt-2 text-2xl font-semibold text-amber-500">
            {{ summary.pendingLabelCount }}
          </div>
        </div>
        <div class="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div class="text-sm text-muted-foreground">已贴签</div>
          <div class="mt-2 text-2xl font-semibold text-emerald-500">
            {{ summary.labelPrintedCount }}
          </div>
        </div>
      </div>
    </WorkflowSectionCard>

    <WorkflowSectionCard
      title="筛选条件"
      description="支持按关键字、科室、状态、标签状态、异常标记和日期范围筛选。"
    >
      <ElForm label-width="92px">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ElFormItem label="关键字">
            <ElInput
              v-model="filters.keyword"
              clearable
              placeholder="申请单号 / 条码 / 标本编号"
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
          <ElFormItem label="标本状态">
            <ElSelect
              v-model="filters.specimenStatus"
              clearable
              placeholder="请选择标本状态"
            >
              <ElOption
                v-for="option in specimenStatusOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="标签状态">
            <ElSelect
              v-model="filters.labelPrintStatus"
              clearable
              placeholder="请选择标签状态"
            >
              <ElOption
                v-for="option in labelPrintStatusOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="异常标记">
            <ElSelect
              v-model="filters.abnormalFlag"
              clearable
              placeholder="请选择异常标记"
            >
              <ElOption
                v-for="option in abnormalFilterOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="登记日期" class="xl:col-span-2">
            <ElDatePicker
              v-model="filters.dateRange"
              end-placeholder="结束日期"
              range-separator="至"
              start-placeholder="开始日期"
              type="daterange"
              value-format="YYYY-MM-DD"
            />
          </ElFormItem>
        </div>

        <div class="flex justify-end gap-2">
          <ElButton @click="handleReset">重置</ElButton>
          <ElButton type="primary" @click="handleSearch">查询</ElButton>
        </div>
      </ElForm>
    </WorkflowSectionCard>

    <WorkflowSectionCard
      title="标本列表"
      description="列表展示标本编号、条码、关联申请单、患者、科室、登记时间、标签状态和异常标记。"
    >
      <ElTable v-loading="listLoading" :data="items" border>
        <ElTableColumn label="标本编号" min-width="150" prop="specimenNo" />
        <ElTableColumn label="条码" min-width="180" prop="barcode" />
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
        <ElTableColumn label="登记时间" min-width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.registeredAt) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="标签打印状态" min-width="150">
          <template #default="{ row }">
            <ElTag :type="labelTagType(row.labelPrintStatus)">
              {{ formatLabelPrintStatus(row.labelPrintStatus) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="标本状态" min-width="150">
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
        <ElTableColumn label="异常标记" min-width="110">
          <template #default="{ row }">
            <ElTag :type="row.abnormalFlag ? 'danger' : 'success'">
              {{ row.abnormalFlag ? '有异常' : '正常' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn fixed="right" label="操作" min-width="120">
          <template #default="{ row }">
            <ElButton link type="primary" @click="openDetailDialog(row)">
              详情
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <div v-if="!listLoading && total === 0" class="py-8">
        <ElEmpty description="暂无符合条件的标本" />
      </div>

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

    <ElDialog
      v-model="detailVisible"
      :close-on-click-modal="true"
      destroy-on-close
      title="标本追踪详情"
      width="1120px"
    >
      <div v-loading="detailLoading" class="flex flex-col gap-4">
        <ElAlert
          v-if="detailRow?.abnormalFlag"
          :closable="false"
          title="该标本当前处于异常状态，请结合追踪信息尽快处理。"
          type="warning"
          show-icon
        />
        <WorkflowSectionCard
          v-if="detailAbnormalSpecimens.length > 0"
          title="异常明细"
          description="展示当前异常标本的退回/拒收结果、质控结论、问题代码和原因。"
        >
          <div class="flex flex-col gap-3">
            <div
              v-for="specimen in detailAbnormalSpecimens"
              :key="`${specimen.id}-${specimen.barcode}`"
              class="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm"
            >
              <div class="font-medium text-foreground">
                {{ specimen.specimenNo || '-' }} / {{ specimen.barcode || '-' }}
              </div>
              <div class="mt-2 grid gap-2 md:grid-cols-2">
                <div>异常类型：{{ formatReceiptStatus(specimen.status) }}</div>
                <div>质控结果：{{ formatQualityCheckResult(specimen.qualityCheckResult) }}</div>
                <div>问题代码：{{ specimen.qualityIssueCodes.length ? specimen.qualityIssueCodes.join('、') : '-' }}</div>
                <div>原因：{{ specimen.reason || '-' }}</div>
              </div>
            </div>
          </div>
        </WorkflowSectionCard>

        <WorkflowSectionCard title="标本基础信息" description="展示标本、条码、容器、状态与最近批次信息。">
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
        </WorkflowSectionCard>

        <WorkflowSectionCard title="所属申请单信息" description="展示关联申请单的患者、科室、节点和临床诊断。">
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
        </WorkflowSectionCard>

        <WorkflowSectionCard title="最近流程节点" description="展示最近追踪事件和操作上下文。">
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
              </div>
            </ElTimelineItem>
          </ElTimeline>
          <ElEmpty v-else description="暂无流程节点记录" />
        </WorkflowSectionCard>

        <WorkflowSectionCard title="最近标签批次结果" description="展示当前申请单最近一次登记批次及其标本结果。">
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
              <ElTableColumn label="异常明细" min-width="320">
                <template #default="{ row }">
                  <div class="flex flex-col gap-1 text-sm">
                    <div>异常类型：{{ formatReceiptStatus(row.receiptStatus ?? row.specimenStatus) }}</div>
                    <div>质控结果：{{ formatQualityCheckResult(row.qualityCheckResult) }}</div>
                    <div>问题代码：{{ row.qualityIssueCodes?.length ? row.qualityIssueCodes.join('、') : '-' }}</div>
                    <div>原因：{{ formatNullable(row.abnormalReason) }}</div>
                  </div>
                </template>
              </ElTableColumn>
            </ElTable>
          </template>
          <ElEmpty v-else description="暂无最近批次结果" />
        </WorkflowSectionCard>
      </div>
    </ElDialog>
  </div>
</template>
