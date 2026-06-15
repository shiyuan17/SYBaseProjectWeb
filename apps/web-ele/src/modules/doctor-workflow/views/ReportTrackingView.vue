<script setup lang="ts">
import type {
  CaseLifecycleTrackingView,
  LifecycleSpecimenView,
} from '../types/doctor-workflow';

import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElCollapse,
  ElCollapseItem,
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { getCaseLifecycleTracking } from '../api/doctor-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import {
  M4_MEDICAL_ORDER_PAGE_AUTHORITIES,
  M4_PERMISSION_CODES,
  M4_REPORT_PAGE_AUTHORITIES,
} from '../constants';
import { getDoctorWorkflowPageErrorMessage } from '../utils/error';
import {
  formatApplicationType,
  formatArchiveStatus,
  formatDateTime,
  formatDiagnosticTaskStatus,
  formatDiagnosticTaskType,
  formatLifecycleNodeStatus,
  formatLoanStatus,
  formatMedicalOrderStatus,
  formatMedicalOrderType,
  formatNullable,
  formatReportStatus,
} from '../utils/format';
import { firstQueryParam } from '../utils/route';

const route = useRoute();
const router = useRouter();
const accessStore = useAccessStore();

const loading = ref(false);
const pageError = ref('');
const tracking = ref<CaseLifecycleTrackingView | null>(null);
const queryCaseIdentifier = ref('');
const activeSpecimenIds = ref<string[]>([]);

const caseId = computed(() => firstQueryParam(route.query.caseId));
const isCurrentTrackingRoute = computed(
  () =>
    route.name === 'ReportTracking' ||
    route.path === '/doctor-workflow/tracking',
);
const canOpenWorkbench = computed(() =>
  accessStore.accessCodes.includes(M4_PERMISSION_CODES.WORKBENCH_QUERY),
);
const canOpenReport = computed(() => {
  const accessCodeSet = new Set(accessStore.accessCodes);
  return M4_REPORT_PAGE_AUTHORITIES.some((code) => accessCodeSet.has(code));
});
const canOpenMedicalOrders = computed(() =>
  M4_MEDICAL_ORDER_PAGE_AUTHORITIES.some((code) =>
    accessStore.accessCodes.includes(code),
  ),
);

function ensureExpandedSpecimen(target: CaseLifecycleTrackingView | null) {
  const specimenIds = target?.specimens.map((item) => item.specimenId) ?? [];
  if (specimenIds.length === 0) {
    activeSpecimenIds.value = [];
    return;
  }

  const nextExpandedIds = activeSpecimenIds.value.filter((item) =>
    specimenIds.includes(item),
  );
  if (nextExpandedIds.length > 0) {
    activeSpecimenIds.value = nextExpandedIds;
    return;
  }
  activeSpecimenIds.value = [specimenIds[0] ?? ''];
}

async function loadTracking(targetCaseId = caseId.value) {
  const normalizedCaseId = targetCaseId.trim();
  if (!normalizedCaseId) {
    pageError.value = '';
    tracking.value = null;
    activeSpecimenIds.value = [];
    return;
  }

  loading.value = true;
  pageError.value = '';
  try {
    const response = await getCaseLifecycleTracking(normalizedCaseId);
    tracking.value = response;
    ensureExpandedSpecimen(response);
  } catch (error) {
    tracking.value = null;
    activeSpecimenIds.value = [];
    pageError.value = getDoctorWorkflowPageErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

function searchTracking() {
  const normalizedCaseIdentifier = queryCaseIdentifier.value.trim();
  if (!normalizedCaseIdentifier) {
    pageError.value = '请输入病例 ID 或病理号';
    return;
  }

  void router.replace({
    path: '/doctor-workflow/tracking',
    query: {
      caseId: normalizedCaseIdentifier,
    },
  });
}

function handleReset() {
  queryCaseIdentifier.value = '';
  pageError.value = '';
  tracking.value = null;
  activeSpecimenIds.value = [];
  void router.replace({
    path: '/doctor-workflow/tracking',
    query: {},
  });
}

function goToWorkbench() {
  if (!tracking.value || !canOpenWorkbench.value) {
    return;
  }
  void router.push({
    path: '/doctor-workflow/workbench',
    query: {
      caseId: tracking.value.caseSummary.caseId,
      pathologyNo: tracking.value.caseSummary.pathologyNo ?? undefined,
    },
  });
}

function goToReport() {
  if (!tracking.value || !canOpenReport.value) {
    return;
  }
  void router.push({
    path: '/doctor-workflow/report',
    query: {
      caseId: tracking.value.caseSummary.caseId,
      pathologyNo: tracking.value.caseSummary.pathologyNo ?? undefined,
      reportId: tracking.value.reportLifecycle.currentReport?.reportId ?? undefined,
    },
  });
}

function goToMedicalOrders() {
  if (!tracking.value || !canOpenMedicalOrders.value) {
    return;
  }

  void router.push({
    path: '/doctor-workflow/medical-orders',
    query: {
      pathologyNo: tracking.value.caseSummary.pathologyNo ?? undefined,
    },
  });
}

function nodeTagType(status?: null | string) {
  switch (status) {
    case 'BORROWED':
    case 'IN_PROGRESS': {
      return 'warning';
    }
    case 'COMPLETED':
    case 'IN_STORAGE':
    case 'PRINTED':
    case 'PUBLISHED':
    case 'RECEIVED':
    case 'RETURNED':
    case 'REVIEWED':
    case 'SIGNED':
    case 'SUBMITTED': {
      return 'success';
    }
    case 'CANCELLED': {
      return 'danger';
    }
    default: {
      return 'info';
    }
  }
}

function hasMeaningfulValue(value?: null | string) {
  return Boolean(value && value.trim());
}

function specimenCollapseTitle(item: LifecycleSpecimenView) {
  return [
    formatNullable(item.specimenNo),
    formatNullable(item.specimenName),
    `蜡块 ${item.blocks.length}`,
  ].join(' / ');
}

watch(
  [isCurrentTrackingRoute, caseId],
  ([isActive, value]) => {
    if (!isActive) {
      return;
    }

    queryCaseIdentifier.value = value;
    if (!value) {
      pageError.value = '';
      tracking.value = null;
      activeSpecimenIds.value = [];
      return;
    }
    void loadTracking(value);
  },
  { immediate: true },
);
</script>

<template>
  <Page
    :show-header="false"
    title="报告追踪"
    description="病例全生命周期追踪。展示申请、标本、蜡块、玻片、报告与归档借阅的完整只读链路。"
  >
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        show-icon
        type="error"
      />

      <WorkflowSectionCard title="病例查询">
        <ElForm inline label-width="88px">
          <ElFormItem label-width="132px" required>
            <template #label>
              <span class="whitespace-nowrap">病例 ID / 病理号</span>
            </template>
            <ElInput
              v-model="queryCaseIdentifier"
              clearable
              placeholder="请输入病例 ID 或病理号"
              style="width: 260px"
              @keyup.enter="searchTracking"
            />
          </ElFormItem>
          <ElFormItem>
            <ElButton :loading="loading" type="primary" @click="searchTracking">
              查询
            </ElButton>
            <ElButton @click="handleReset">重置</ElButton>
          </ElFormItem>
        </ElForm>
      </WorkflowSectionCard>

      <WorkflowSectionCard title="病例摘要" description="当前病例、患者、申请单与归档总览。">
        <template v-if="tracking" #extra>
          <div class="flex flex-wrap gap-2">
            <ElButton
              v-if="canOpenWorkbench"
              type="primary"
              @click="goToWorkbench"
            >
              进入诊断工作台
            </ElButton>
            <ElButton
              v-if="canOpenReport"
              type="success"
              @click="goToReport"
            >
              进入报告
            </ElButton>
            <ElButton
              v-if="canOpenMedicalOrders"
              type="warning"
              @click="goToMedicalOrders"
            >
              进入医嘱工作台
            </ElButton>
          </div>
        </template>
        <ElEmpty
          v-if="!caseId"
          description="请输入病例 ID 或病理号查询病例全生命周期追踪，或从其他流程页面进入当前病例。"
        />
        <ElEmpty v-else-if="!loading && !tracking" description="暂无追踪数据" />
        <template v-else-if="tracking">
          <ElDescriptions :column="4" border>
            <ElDescriptionsItem label="病例 ID">
              {{ formatNullable(tracking.caseSummary.caseId) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="病理号">
              {{ formatNullable(tracking.caseSummary.pathologyNo) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="申请单号">
              {{ formatNullable(tracking.caseSummary.applicationNo) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="当前阶段">
              {{ formatNullable(tracking.caseSummary.currentStage) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="患者">
              {{ formatNullable(tracking.caseSummary.patientName) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="性别 / 年龄">
              {{ `${formatNullable(tracking.caseSummary.patientGender)} / ${formatNullable(tracking.caseSummary.patientAge)}` }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="申请类型">
              {{ formatApplicationType(tracking.caseSummary.applicationType) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="病例状态">
              {{ formatNullable(tracking.caseSummary.caseStatus) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="送检科室">
              {{ formatNullable(tracking.caseSummary.submittingDepartmentName) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="送检医生">
              {{ formatNullable(tracking.caseSummary.submittingDoctorName) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="申请时间">
              {{ formatDateTime(tracking.caseSummary.applicationDate) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="待修订">
              <ElTag :type="tracking.caseSummary.hasPendingRevision ? 'warning' : 'info'">
                {{ tracking.caseSummary.hasPendingRevision ? '是' : '否' }}
              </ElTag>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="申请单归档">
              {{ formatArchiveStatus(tracking.applicationForm?.archiveStatus) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="归档位置">
              {{ formatNullable(tracking.applicationForm?.archiveLocation) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="申请医生">
              {{ formatNullable(tracking.applicationForm?.applicantDoctorName) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="申请备注" :span="2">
              {{ formatNullable(tracking.applicationForm?.remarks) }}
            </ElDescriptionsItem>
          </ElDescriptions>
        </template>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        v-if="tracking"
        title="全局生命周期时间线"
        description="固定顺序展示申请创建、标本、技术处理、诊断报告与归档借阅关键节点。未发生节点不会隐藏。"
      >
        <div class="grid gap-4 xl:grid-cols-2">
          <section
            v-for="stage in tracking.overallTimeline"
            :key="stage.stageCode ?? stage.stageTitle ?? 'stage'"
            class="rounded-lg border border-border/70 bg-muted/20 p-4"
          >
            <header class="mb-3 flex items-center justify-between gap-3">
              <h4 class="text-sm font-semibold text-foreground">
                {{ formatNullable(stage.stageTitle) }}
              </h4>
              <span class="text-xs text-muted-foreground">
                {{ formatNullable(stage.stageCode) }}
              </span>
            </header>
            <div class="flex flex-col gap-3">
              <article
                v-for="node in stage.nodes"
                :key="`${stage.stageCode ?? 'stage'}-${node.nodeCode ?? node.title}`"
                class="rounded-md border border-border bg-background p-3"
              >
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div class="text-sm font-medium text-foreground">
                      {{ formatNullable(node.title) }}
                    </div>
                    <div class="mt-1 text-xs text-muted-foreground">
                      {{ formatDateTime(node.occurredAt) }} / {{ formatNullable(node.operatorName) }}
                    </div>
                  </div>
                  <ElTag :type="nodeTagType(node.status)">
                    {{ formatLifecycleNodeStatus(node.status) }}
                  </ElTag>
                </div>
                <div
                  v-if="node.keyFacts.length > 0"
                  class="mt-3 flex flex-wrap gap-2"
                >
                  <span
                    v-for="fact in node.keyFacts"
                    :key="`${node.nodeCode ?? node.title ?? 'node'}-${fact.label}`"
                    class="rounded bg-muted px-2 py-1 text-xs text-foreground"
                  >
                    {{ fact.label }}: {{ formatNullable(fact.value) }}
                  </span>
                </div>
                <p
                  v-if="hasMeaningfulValue(node.eventContent)"
                  class="mt-3 text-sm leading-6 text-muted-foreground"
                >
                  {{ node.eventContent }}
                </p>
              </article>
            </div>
          </section>
        </div>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        v-if="tracking"
        title="对象追踪区"
        :description="`按标本 -> 蜡块 -> 玻片分层展示，当前共 ${tracking.specimens.length} 份标本。`"
      >
        <ElEmpty
          v-if="tracking.specimens.length === 0"
          description="当前病例暂无标本层级追踪数据"
        />
        <ElCollapse v-else v-model="activeSpecimenIds">
          <ElCollapseItem
            v-for="specimen in tracking.specimens"
            :key="specimen.specimenId"
            :name="specimen.specimenId"
          >
            <template #title>
              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2 pr-4">
                <span class="font-medium text-foreground">
                  {{ specimenCollapseTitle(specimen) }}
                </span>
                <ElTag size="small" :type="nodeTagType(specimen.specimenStatus)">
                  {{ formatNullable(specimen.specimenStatus) }}
                </ElTag>
                <ElTag size="small" type="info">
                  归档 {{ formatArchiveStatus(specimen.archiveStatus) }}
                </ElTag>
              </div>
            </template>

            <div class="flex flex-col gap-4 pb-2">
              <ElDescriptions :column="4" border>
                <ElDescriptionsItem label="标本编号">
                  {{ formatNullable(specimen.specimenNo) }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="条码">
                  {{ formatNullable(specimen.barcode) }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="标本状态">
                  {{ formatNullable(specimen.specimenStatus) }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="借阅状态">
                  {{ formatLoanStatus(specimen.loanStatus) }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="创建时间">
                  {{ formatDateTime(specimen.createdAt) }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="离体时间">
                  {{ formatDateTime(specimen.removalAt) }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="固定时间">
                  {{ formatDateTime(specimen.fixedAt) }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="确认时间">
                  {{ formatDateTime(specimen.confirmedAt) }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="入库时间">
                  {{ formatDateTime(specimen.checkedInAt) }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="签收状态">
                  {{ formatNullable(specimen.receiptStatus) }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="签收时间">
                  {{ formatDateTime(specimen.receivedAt) }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="归档位置">
                  {{ formatNullable(specimen.archiveLocation) }}
                </ElDescriptionsItem>
              </ElDescriptions>

              <div class="rounded-lg border border-border/70 p-3">
                <h5 class="mb-3 text-sm font-semibold text-foreground">
                  标本级事件
                </h5>
                <ElTable :data="specimen.specimenEvents" border size="small">
                  <ElTableColumn label="节点" min-width="140">
                    <template #default="{ row }">
                      {{ formatNullable(row.title) }}
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="状态" min-width="110">
                    <template #default="{ row }">
                      <ElTag :type="nodeTagType(row.status)">
                        {{ formatLifecycleNodeStatus(row.status) }}
                      </ElTag>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="时间" min-width="180">
                    <template #default="{ row }">
                      {{ formatDateTime(row.occurredAt) }}
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="操作人" min-width="140">
                    <template #default="{ row }">
                      {{ formatNullable(row.operatorName) }}
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="事件说明" min-width="220">
                    <template #default="{ row }">
                      {{ formatNullable(row.eventContent) }}
                    </template>
                  </ElTableColumn>
                </ElTable>
              </div>

              <div class="flex flex-col gap-4">
                <section
                  v-for="block in specimen.blocks"
                  :key="block.blockId"
                  class="rounded-lg border border-border bg-muted/15 p-4"
                >
                  <div class="mb-4 flex flex-wrap items-center gap-2">
                    <h5 class="text-sm font-semibold text-foreground">
                      蜡块 {{ formatNullable(block.blockCode) }}
                    </h5>
                    <ElTag size="small" type="info">
                      包埋盒 {{ formatNullable(block.embeddingBoxNo) }}
                    </ElTag>
                    <ElTag size="small" :type="nodeTagType(block.archiveStatus)">
                      {{ formatArchiveStatus(block.archiveStatus) }}
                    </ElTag>
                  </div>

                  <ElDescriptions :column="4" border size="small">
                    <ElDescriptionsItem label="标本名称">
                      {{ formatNullable(block.specimenName) }}
                    </ElDescriptionsItem>
                    <ElDescriptionsItem label="取材人">
                      {{ formatNullable(block.sampledByName) }}
                    </ElDescriptionsItem>
                    <ElDescriptionsItem label="取材时间">
                      {{ formatDateTime(block.sampledAt) }}
                    </ElDescriptionsItem>
                    <ElDescriptionsItem label="包埋人">
                      {{ formatNullable(block.embeddedByName) }}
                    </ElDescriptionsItem>
                    <ElDescriptionsItem label="包埋开始">
                      {{ formatDateTime(block.embeddingStartedAt) }}
                    </ElDescriptionsItem>
                    <ElDescriptionsItem label="包埋完成">
                      {{ formatDateTime(block.embeddingEndedAt) }}
                    </ElDescriptionsItem>
                    <ElDescriptionsItem label="切片提示">
                      {{ formatNullable(block.sliceNotice) }}
                    </ElDescriptionsItem>
                    <ElDescriptionsItem label="评估等级">
                      {{ formatNullable(block.evaluationLevel) }}
                    </ElDescriptionsItem>
                    <ElDescriptionsItem label="取材评价">
                      {{ formatNullable(block.samplingEvaluation) }}
                    </ElDescriptionsItem>
                    <ElDescriptionsItem label="包埋备注">
                      {{ formatNullable(block.embeddingRemarks) }}
                    </ElDescriptionsItem>
                    <ElDescriptionsItem label="归档位置">
                      {{ formatNullable(block.archiveLocation) }}
                    </ElDescriptionsItem>
                    <ElDescriptionsItem label="借阅状态">
                      {{ formatLoanStatus(block.loanStatus) }}
                    </ElDescriptionsItem>
                    <ElDescriptionsItem label="取材描述" :span="4">
                      {{ formatNullable(block.grossDescription) }}
                    </ElDescriptionsItem>
                  </ElDescriptions>

                  <div class="mt-4 rounded-lg border border-border/70 bg-background p-3">
                    <h6 class="mb-3 text-sm font-semibold text-foreground">
                      蜡块级事件
                    </h6>
                    <ElTable :data="block.blockEvents" border size="small">
                      <ElTableColumn label="节点" min-width="140">
                        <template #default="{ row }">
                          {{ formatNullable(row.title) }}
                        </template>
                      </ElTableColumn>
                      <ElTableColumn label="状态" min-width="110">
                        <template #default="{ row }">
                          <ElTag :type="nodeTagType(row.status)">
                            {{ formatLifecycleNodeStatus(row.status) }}
                          </ElTag>
                        </template>
                      </ElTableColumn>
                      <ElTableColumn label="时间" min-width="180">
                        <template #default="{ row }">
                          {{ formatDateTime(row.occurredAt) }}
                        </template>
                      </ElTableColumn>
                      <ElTableColumn label="操作人" min-width="140">
                        <template #default="{ row }">
                          {{ formatNullable(row.operatorName) }}
                        </template>
                      </ElTableColumn>
                      <ElTableColumn label="事件说明" min-width="220">
                        <template #default="{ row }">
                          {{ formatNullable(row.eventContent) }}
                        </template>
                      </ElTableColumn>
                    </ElTable>
                  </div>

                  <div class="mt-4 flex flex-col gap-4">
                    <section
                      v-for="slide in block.slides"
                      :key="slide.slideId"
                      class="rounded-lg border border-border/70 bg-background p-4"
                    >
                      <div class="mb-4 flex flex-wrap items-center gap-2">
                        <h6 class="text-sm font-semibold text-foreground">
                          玻片 {{ formatNullable(slide.slideNo) }}
                        </h6>
                        <ElTag size="small" :type="nodeTagType(slide.slideStatus)">
                          {{ formatNullable(slide.slideStatus) }}
                        </ElTag>
                        <ElTag size="small" type="info">
                          归档 {{ formatArchiveStatus(slide.archiveStatus) }}
                        </ElTag>
                      </div>

                      <ElDescriptions :column="4" border size="small">
                        <ElDescriptionsItem label="玻片状态">
                          {{ formatNullable(slide.slideStatus) }}
                        </ElDescriptionsItem>
                        <ElDescriptionsItem label="质控状态">
                          {{ formatNullable(slide.qualityStatus) }}
                        </ElDescriptionsItem>
                        <ElDescriptionsItem label="打印时间">
                          {{ formatDateTime(slide.printedAt) }}
                        </ElDescriptionsItem>
                        <ElDescriptionsItem label="切片时间">
                          {{ formatDateTime(slide.slicedAt) }}
                        </ElDescriptionsItem>
                        <ElDescriptionsItem label="切片人">
                          {{ formatNullable(slide.slicedByName) }}
                        </ElDescriptionsItem>
                        <ElDescriptionsItem label="染色时间">
                          {{ formatDateTime(slide.stainedAt) }}
                        </ElDescriptionsItem>
                        <ElDescriptionsItem label="染色人">
                          {{ formatNullable(slide.stainedByName) }}
                        </ElDescriptionsItem>
                        <ElDescriptionsItem label="质控结果">
                          {{ formatNullable(slide.qcResult) }}
                        </ElDescriptionsItem>
                        <ElDescriptionsItem label="质控时间">
                          {{ formatDateTime(slide.qcEvaluatedAt) }}
                        </ElDescriptionsItem>
                        <ElDescriptionsItem label="质控人">
                          {{ formatNullable(slide.qcEvaluatorName) }}
                        </ElDescriptionsItem>
                        <ElDescriptionsItem label="返工状态">
                          {{ formatNullable(slide.reworkStatus) }}
                        </ElDescriptionsItem>
                        <ElDescriptionsItem label="返工原因">
                          {{ formatNullable(slide.reworkReason) }}
                        </ElDescriptionsItem>
                        <ElDescriptionsItem label="归档位置">
                          {{ formatNullable(slide.archiveLocation) }}
                        </ElDescriptionsItem>
                        <ElDescriptionsItem label="借阅状态">
                          {{ formatLoanStatus(slide.loanStatus) }}
                        </ElDescriptionsItem>
                      </ElDescriptions>

                      <div class="mt-4 rounded-lg border border-border/70 p-3">
                        <h6 class="mb-3 text-sm font-semibold text-foreground">
                          玻片级事件
                        </h6>
                        <ElTable :data="slide.slideEvents" border size="small">
                          <ElTableColumn label="节点" min-width="140">
                            <template #default="{ row }">
                              {{ formatNullable(row.title) }}
                            </template>
                          </ElTableColumn>
                          <ElTableColumn label="状态" min-width="110">
                            <template #default="{ row }">
                              <ElTag :type="nodeTagType(row.status)">
                                {{ formatLifecycleNodeStatus(row.status) }}
                              </ElTag>
                            </template>
                          </ElTableColumn>
                          <ElTableColumn label="时间" min-width="180">
                            <template #default="{ row }">
                              {{ formatDateTime(row.occurredAt) }}
                            </template>
                          </ElTableColumn>
                          <ElTableColumn label="操作人" min-width="140">
                            <template #default="{ row }">
                              {{ formatNullable(row.operatorName) }}
                            </template>
                          </ElTableColumn>
                          <ElTableColumn label="事件说明" min-width="220">
                            <template #default="{ row }">
                              {{ formatNullable(row.eventContent) }}
                            </template>
                          </ElTableColumn>
                        </ElTable>
                      </div>
                    </section>
                  </div>
                </section>
              </div>
            </div>
          </ElCollapseItem>
        </ElCollapse>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        v-if="tracking"
        title="报告链区"
        description="保留当前报告、诊断任务、版本链、修订、会诊与医嘱链路。"
      >
        <div class="grid gap-4 xl:grid-cols-2">
          <section class="rounded-lg border border-border bg-background p-4">
            <h4 class="mb-3 text-sm font-semibold text-foreground">当前报告</h4>
            <ElDescriptions :column="2" border size="small">
              <ElDescriptionsItem label="报告号">
                {{ formatNullable(tracking.reportLifecycle.currentReport?.reportNo) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="状态">
                {{ formatReportStatus(tracking.reportLifecycle.currentReport?.reportStatus) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="版本号">
                {{ formatNullable(tracking.reportLifecycle.currentReport?.versionNo) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="签发时间">
                {{ formatDateTime(tracking.reportLifecycle.currentReport?.signedAt) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="发布时间">
                {{ formatDateTime(tracking.reportLifecycle.currentReport?.publishedAt) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="签发人">
                {{ formatNullable(tracking.reportLifecycle.currentReport?.signedByName) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="最终诊断" :span="2">
                {{ formatNullable(tracking.reportLifecycle.currentReport?.finalDiagnosis) }}
              </ElDescriptionsItem>
            </ElDescriptions>
          </section>

          <section class="rounded-lg border border-border bg-background p-4">
            <h4 class="mb-3 text-sm font-semibold text-foreground">诊断任务</h4>
            <ElTable
              :data="tracking.reportLifecycle.diagnosticTasks"
              border
              size="small"
            >
              <ElTableColumn label="任务号" min-width="160" prop="id" />
              <ElTableColumn label="类型" min-width="100">
                <template #default="{ row }">
                  {{ formatDiagnosticTaskType(row.taskType) }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="状态" min-width="100">
                <template #default="{ row }">
                  {{ formatDiagnosticTaskStatus(row.taskStatus) }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="责任医生" min-width="120" prop="diagnosisDoctorName" />
            </ElTable>
          </section>

          <section class="rounded-lg border border-border bg-background p-4 xl:col-span-2">
            <h4 class="mb-3 text-sm font-semibold text-foreground">版本链</h4>
            <ElTable :data="tracking.reportLifecycle.versions" border size="small">
              <ElTableColumn label="版本 ID" min-width="160" prop="versionId" />
              <ElTableColumn label="版本号" min-width="90" prop="versionNo" />
              <ElTableColumn label="状态" min-width="100" prop="versionStatus" />
              <ElTableColumn label="签发时间" min-width="180">
                <template #default="{ row }">
                  {{ formatDateTime(row.signedAt) }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="创建时间" min-width="180">
                <template #default="{ row }">
                  {{ formatDateTime(row.createdAt) }}
                </template>
              </ElTableColumn>
              <ElTableColumn
                label="诊断快照"
                min-width="260"
                prop="finalDiagnosisSnapshot"
              />
            </ElTable>
          </section>

          <section class="rounded-lg border border-border bg-background p-4">
            <h4 class="mb-3 text-sm font-semibold text-foreground">修订</h4>
            <ElTable :data="tracking.reportLifecycle.revisions" border size="small">
              <ElTableColumn label="修订单" min-width="140" prop="requestId" />
              <ElTableColumn label="状态" min-width="100" prop="requestStatus" />
              <ElTableColumn label="申请人" min-width="120" prop="requestedByName" />
              <ElTableColumn label="申请时间" min-width="180">
                <template #default="{ row }">
                  {{ formatDateTime(row.requestedAt) }}
                </template>
              </ElTableColumn>
            </ElTable>
          </section>

          <section class="rounded-lg border border-border bg-background p-4">
            <h4 class="mb-3 text-sm font-semibold text-foreground">会诊</h4>
            <ElTable :data="tracking.reportLifecycle.consultations" border size="small">
              <ElTableColumn label="会诊单" min-width="140" prop="consultationId" />
              <ElTableColumn label="状态" min-width="100" prop="status" />
              <ElTableColumn label="发起人" min-width="120" prop="requestedByName" />
              <ElTableColumn label="会诊意见" min-width="220" prop="opinion" />
            </ElTable>
          </section>

          <section class="rounded-lg border border-border bg-background p-4 xl:col-span-2">
            <h4 class="mb-3 text-sm font-semibold text-foreground">医嘱</h4>
            <ElTable :data="tracking.reportLifecycle.medicalOrders" border size="small">
              <ElTableColumn label="内容" min-width="240" prop="orderContent" />
              <ElTableColumn label="类型" min-width="120">
                <template #default="{ row }">
                  {{ formatMedicalOrderType(row.orderType) }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="状态" min-width="110">
                <template #default="{ row }">
                  {{ formatMedicalOrderStatus(row.status) }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="开单医生" min-width="120" prop="doctorName" />
              <ElTableColumn label="医嘱时间" min-width="180">
                <template #default="{ row }">
                  {{ formatDateTime(row.orderDate) }}
                </template>
              </ElTableColumn>
            </ElTable>
          </section>
        </div>
      </WorkflowSectionCard>
    </div>
  </Page>
</template>
