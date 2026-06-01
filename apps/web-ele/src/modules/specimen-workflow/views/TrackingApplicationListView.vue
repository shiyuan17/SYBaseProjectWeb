<script setup lang="ts">
import type {
  ApplicationListItem,
  ApplicationListQuery,
  SpecimenTrackingSummary,
  TrackingEventView,
  TrackingQueryView as WorkflowTrackingQueryView,
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
} from 'element-plus';

import DepartmentSelect from '#/modules/system-management/components/DepartmentSelect.vue';

import {
  getApplicationTracking,
  listApplications,
} from '../api/specimen-workflow-service';
import TrackingApplicationListTable from '../components/TrackingApplicationListTable.vue';
import TrackingApplicationSpecimenTable from '../components/TrackingApplicationSpecimenTable.vue';
import TrackingApplicationTimelineTabs from '../components/TrackingApplicationTimelineTabs.vue';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import {
  APPLICATION_FORM_STATUS_OPTIONS,
  APPLICATION_TYPE_OPTIONS,
  DEFAULT_PAGE_SIZE,
  M2_PERMISSION_CODES,
} from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  formatApplicationFormStatus,
  formatApplicationStatus,
  formatApplicationType,
  formatCurrentNode,
  formatDate,
  formatDateTime,
  formatNullable,
  formatQualityCheckResult,
  formatReceiptStatus,
} from '../utils/format';
import { buildSpecimenAbnormalDetails } from '../utils/specimen-abnormal';
import {
  buildInitialApplicationMatch,
  buildSpecimenTimelineTabs,
  buildTrackingApplicationListQuery,
  resolveDetailRecentEvents,
  resolveDetailSpecimens,
} from '../utils/tracking-application-list';
import { buildTrackingTimelineData } from '../utils/tracking-timeline';

const props = withDefaults(
  defineProps<{
    initialApplicationId?: string;
    triggerKey?: number;
  }>(),
  {
    initialApplicationId: '',
    triggerKey: 0,
  },
);

const accessStore = useAccessStore();

const canQueryApplications = computed(() =>
  accessStore.accessCodes.includes(
    M2_PERMISSION_CODES.APPLICATION_DETAIL_QUERY,
  ),
);

const loading = ref(false);
const pageError = ref('');
const items = ref<ApplicationListItem[]>([]);
const total = ref(0);

const detailVisible = ref(false);
const detailLoading = ref(false);
const detailTracking = ref<null | WorkflowTrackingQueryView>(null);
const activeTimelineTab = ref('overall');

const filters = reactive({
  applicationFormStatus: '',
  applicationNo: '',
  applicationType: '',
  dateRange: [] as string[],
  page: 1,
  patientName: '',
  size: DEFAULT_PAGE_SIZE,
  submittingDepartmentId: '',
});

async function loadApplications() {
  if (!canQueryApplications.value) {
    items.value = [];
    total.value = 0;
    return;
  }

  loading.value = true;
  pageError.value = '';
  try {
    const query: ApplicationListQuery =
      buildTrackingApplicationListQuery(filters);
    const result = await listApplications(query);
    items.value = result.items;
    total.value = result.total;
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function openDetailById(applicationId: string) {
  const normalizedApplicationId = applicationId.trim();
  if (!normalizedApplicationId) {
    return;
  }

  activeTimelineTab.value = 'overall';
  detailVisible.value = true;
  detailLoading.value = true;
  pageError.value = '';
  try {
    detailTracking.value = await getApplicationTracking(
      normalizedApplicationId,
    );
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
    detailVisible.value = false;
  } finally {
    detailLoading.value = false;
  }
}

function handleSearch() {
  filters.page = 1;
  void loadApplications();
}

function handleReset() {
  filters.applicationFormStatus = '';
  filters.applicationNo = '';
  filters.applicationType = '';
  filters.dateRange = [];
  filters.page = 1;
  filters.patientName = '';
  filters.size = DEFAULT_PAGE_SIZE;
  filters.submittingDepartmentId = '';
  void loadApplications();
}

function handleDepartmentChange(
  department: null | { id: string; name: string },
) {
  filters.submittingDepartmentId = department?.id ?? '';
}

const detailRecentEvents = computed<TrackingEventView[]>(() =>
  resolveDetailRecentEvents(detailTracking.value),
);

const detailSpecimens = computed<SpecimenTrackingSummary[]>(() =>
  resolveDetailSpecimens(detailTracking.value),
);

const detailAbnormalSpecimens = computed(() =>
  buildSpecimenAbnormalDetails(detailSpecimens.value),
);

const trackingTimelineData = computed(() =>
  buildTrackingTimelineData(detailRecentEvents.value, detailSpecimens.value),
);

const specimenTimelineTabs = computed(() =>
  buildSpecimenTimelineTabs(detailSpecimens.value, trackingTimelineData.value),
);

watch(
  () => [props.initialApplicationId, props.triggerKey] as const,
  ([applicationId]) => {
    void loadApplications();
    const matchedApplicationId = buildInitialApplicationMatch(
      applicationId,
      items.value,
    );
    if (!matchedApplicationId) {
      return;
    }
    void openDetailById(matchedApplicationId);
  },
  { immediate: true },
);
</script>

<template>
  <div class="flex flex-col gap-4">
    <ElAlert
      v-if="false"
      :closable="false"
      :title="pageError"
      type="error"
      show-icon
    />

    <WorkflowSectionCard
      title="筛选条件"
      description="支持按申请单号、患者、科室、申请类型、表单状态和申请日期筛选。"
    >
      <ElForm label-width="92px">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ElFormItem label="申请单号">
            <ElInput
              v-model="filters.applicationNo"
              clearable
              placeholder="模糊搜索申请单号"
              @keyup.enter="handleSearch"
            />
          </ElFormItem>
          <ElFormItem label="患者姓名">
            <ElInput
              v-model="filters.patientName"
              clearable
              placeholder="模糊搜索患者姓名"
              @keyup.enter="handleSearch"
            />
          </ElFormItem>
          <ElFormItem label="送检科室">
            <DepartmentSelect
              v-model="filters.submittingDepartmentId"
              placeholder="请选择送检科室"
              @change="handleDepartmentChange"
            />
          </ElFormItem>
          <ElFormItem label="申请类型">
            <ElSelect
              v-model="filters.applicationType"
              clearable
              placeholder="请选择申请类型"
            >
              <ElOption
                v-for="option in APPLICATION_TYPE_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="表单状态">
            <ElSelect
              v-model="filters.applicationFormStatus"
              clearable
              placeholder="请选择表单状态"
            >
              <ElOption
                v-for="option in APPLICATION_FORM_STATUS_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="申请日期" class="xl:col-span-2">
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
      title="申请单列表"
      description="列表展示申请单编号、申请单号、患者、流程节点和异常标记。"
    >
      <TrackingApplicationListTable
        :items="items"
        :loading="loading"
        @detail="openDetailById"
      />

      <div v-if="!loading && total === 0" class="py-8">
        <ElEmpty description="暂无符合条件的申请单" />
      </div>

      <div class="mt-4 flex justify-end">
        <ElPagination
          v-model:current-page="filters.page"
          v-model:page-size="filters.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          background
          layout="total, sizes, prev, pager, next"
          @current-change="loadApplications"
          @size-change="loadApplications"
        />
      </div>
    </WorkflowSectionCard>

    <ElDialog
      v-model="detailVisible"
      :close-on-click-modal="true"
      destroy-on-close
      title="申请单追踪详情"
      width="1120px"
    >
      <div v-loading="detailLoading" class="flex flex-col gap-4">
        <WorkflowSectionCard
          title="异常标记"
          description="展示当前申请单的流程异常标记。"
        >
          <ElAlert
            :closable="false"
            :title="
              detailTracking?.abnormalFlag
                ? '当前申请单存在异常标记，请结合最近追踪事件和标本状态重点核对。'
                : '当前申请单未标记异常。'
            "
            :type="detailTracking?.abnormalFlag ? 'warning' : 'success'"
            show-icon
          />
          <div
            v-if="detailAbnormalSpecimens.length > 0"
            class="mt-3 flex flex-col gap-3"
          >
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
                <div>
                  质控结果：{{
                    formatQualityCheckResult(specimen.qualityCheckResult)
                  }}
                </div>
                <div>
                  问题代码：{{
                    specimen.qualityIssueCodes.length > 0
                      ? specimen.qualityIssueCodes.join('、')
                      : '-'
                  }}
                </div>
                <div>原因：{{ specimen.reason || '-' }}</div>
              </div>
            </div>
          </div>
        </WorkflowSectionCard>

        <WorkflowSectionCard
          title="基本信息"
          description="展示申请单状态、当前节点、表单状态与送检摘要。"
        >
          <ElDescriptions :column="2" border>
            <ElDescriptionsItem label="申请单编号">
              {{ detailTracking?.id || '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="申请单号">
              {{ formatNullable(detailTracking?.applicationNo) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="申请单状态">
              {{ formatApplicationStatus(detailTracking?.status) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="表单状态">
              {{
                formatApplicationFormStatus(
                  detailTracking?.applicationFormStatus,
                )
              }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="当前节点">
              {{ formatCurrentNode(detailTracking?.currentNode) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="申请类型">
              {{ formatApplicationType(detailTracking?.applicationType) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="患者姓名">
              {{ formatNullable(detailTracking?.patientName) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="患者标识">
              {{ formatNullable(detailTracking?.patientId) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="送检科室">
              {{ formatNullable(detailTracking?.submittingDepartmentName) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="送检医生">
              {{ formatNullable(detailTracking?.submittingDoctorName) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="申请日期">
              {{ formatDate(detailTracking?.applicationDate) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="送检日期">
              {{ formatDate(detailTracking?.submissionDate) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="离体时间">
              {{ formatDateTime(detailTracking?.specimenRemovalTime) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="临床诊断" :span="2">
              {{ formatNullable(detailTracking?.clinicalDiagnosis) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="临床症状" :span="2">
              {{ formatNullable(detailTracking?.clinicalSymptom) }}
            </ElDescriptionsItem>
          </ElDescriptions>
        </WorkflowSectionCard>

        <WorkflowSectionCard
          title="标本列表"
          description="展示当前申请单下标本摘要、状态和标签打印情况。"
        >
          <TrackingApplicationSpecimenTable
            :specimens="detailTracking?.specimens ?? []"
          />
        </WorkflowSectionCard>

        <WorkflowSectionCard
          title="时间线事件"
          description="展示最近追踪事件、节点、状态与操作终端。"
        >
          <TrackingApplicationTimelineTabs
            v-model="activeTimelineTab"
            :detail-recent-events-count="detailRecentEvents.length"
            :specimen-timeline-tabs="specimenTimelineTabs"
            :tracking-timeline-data="trackingTimelineData"
          />
        </WorkflowSectionCard>

        <WorkflowSectionCard
          v-if="canQueryApplications"
          title="完整申请单详情"
          description="展示来源医院、外部单号与补充信息。"
        >
          <ElDescriptions :column="2" border>
            <ElDescriptionsItem label="外部单号">
              {{ formatNullable(detailTracking?.externalOrderNo) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="来源医院">
              {{ formatNullable(detailTracking?.sourceHospitalName) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="备注" :span="2">
              {{ formatNullable(detailTracking?.remarks) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="创建时间">
              {{ formatDateTime(detailTracking?.createdAt) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="更新时间">
              {{ formatDateTime(detailTracking?.updatedAt) }}
            </ElDescriptionsItem>
          </ElDescriptions>
        </WorkflowSectionCard>
      </div>
    </ElDialog>
  </div>
</template>
