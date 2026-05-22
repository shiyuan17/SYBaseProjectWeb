<script setup lang="ts">
import type { ReportTrackingView } from '../types/doctor-workflow';

import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { M4_REPORT_PAGE_AUTHORITIES } from '../constants';
import { getReportTracking } from '../api/doctor-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { getDoctorWorkflowPageErrorMessage } from '../utils/error';
import {
  formatDateTime,
  formatDiagnosticTaskStatus,
  formatDiagnosticTaskType,
  formatNullable,
  formatReportStatus,
} from '../utils/format';
import { firstQueryParam } from '../utils/route';

const route = useRoute();
const router = useRouter();
const accessStore = useAccessStore();

const loading = ref(false);
const pageError = ref('');
const tracking = ref<ReportTrackingView | null>(null);
const queryCaseId = ref('');

const caseId = computed(() => firstQueryParam(route.query.caseId));
const canOpenReport = computed(() => {
  const accessCodeSet = new Set(accessStore.accessCodes);
  return M4_REPORT_PAGE_AUTHORITIES.some((code) => accessCodeSet.has(code));
});

async function loadTracking(targetCaseId = caseId.value) {
  const normalizedCaseId = targetCaseId.trim();
  if (!normalizedCaseId) {
    pageError.value = '';
    tracking.value = null;
    return;
  }

  loading.value = true;
  pageError.value = '';
  try {
    tracking.value = await getReportTracking(normalizedCaseId);
  } catch (error) {
    tracking.value = null;
    pageError.value = getDoctorWorkflowPageErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

function searchTracking() {
  const normalizedCaseId = queryCaseId.value.trim();
  if (!normalizedCaseId) {
    ElMessage.warning('请输入病例 ID');
    return;
  }

  void router.replace({
    path: '/doctor-workflow/tracking',
    query: {
      caseId: normalizedCaseId,
    },
  });
}

function handleReset() {
  queryCaseId.value = '';
  pageError.value = '';
  tracking.value = null;
  void router.replace({
    path: '/doctor-workflow/tracking',
    query: {},
  });
}

function goToReport() {
  if (!tracking.value || !canOpenReport.value) {
    return;
  }
  void router.push({
    path: '/doctor-workflow/report',
    query: {
      caseId: tracking.value.caseId,
      pathologyNo: tracking.value.pathologyNo ?? undefined,
      reportId: tracking.value.currentReport?.reportId ?? undefined,
    },
  });
}

watch(
  caseId,
  (value) => {
    queryCaseId.value = value;
    if (!value) {
      pageError.value = '';
      tracking.value = null;
      return;
    }
    void loadTracking(value);
  },
  { immediate: true },
);
</script>

<template>
  <Page title="报告跟踪" description="展示诊断任务链、报告版本链、事件链、修订链、会诊链与医嘱链。">
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        show-icon
        type="error"
      />

      <WorkflowSectionCard
        title="病例查询"
        description="支持从菜单独立进入后按病例 ID 查询报告跟踪，也支持从其他页面深链进入。"
      >
        <ElForm inline label-width="88px">
          <ElFormItem label="病例 ID" required>
            <ElInput
              v-model="queryCaseId"
              clearable
              placeholder="请输入病例 ID"
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

      <WorkflowSectionCard title="跟踪摘要">
        <ElEmpty
          v-if="!caseId"
          description="请输入病例 ID 查询报告跟踪，或从其他流程页面进入当前病例。"
        />
        <ElEmpty v-else-if="!loading && !tracking" description="暂无跟踪数据" />
        <ElDescriptions v-else :column="4" border>
          <ElDescriptionsItem label="病例ID">
            {{ formatNullable(tracking?.caseId) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="病理号">
            {{ formatNullable(tracking?.pathologyNo) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="患者">
            {{ formatNullable(tracking?.patientName) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="病例状态">
            {{ formatNullable(tracking?.caseStatus) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="有效版本">
            {{ formatNullable(tracking?.latestEffectiveVersionNo) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="草稿版本">
            {{ formatNullable(tracking?.currentDraftVersionNo) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="待修订">
            <ElTag :type="tracking?.hasPendingRevision ? 'warning' : 'info'">
              {{ tracking?.hasPendingRevision ? '是' : '否' }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="当前报告">
            {{ formatReportStatus(tracking?.currentReport?.reportStatus) }}
          </ElDescriptionsItem>
        </ElDescriptions>
        <template v-if="canOpenReport && tracking" #extra>
          <ElButton type="primary" @click="goToReport">进入报告</ElButton>
        </template>
      </WorkflowSectionCard>

      <template v-if="tracking">
        <WorkflowSectionCard title="诊断任务链">
          <ElTable v-loading="loading" :data="tracking.diagnosticTasks" border>
            <ElTableColumn label="任务号" min-width="180" prop="id" />
            <ElTableColumn label="类型" min-width="110">
              <template #default="{ row }">
                {{ formatDiagnosticTaskType(row.taskType) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="状态" min-width="120">
              <template #default="{ row }">
                {{ formatDiagnosticTaskStatus(row.taskStatus) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="责任医生" min-width="140" prop="diagnosisDoctorName" />
            <ElTableColumn label="完成时间" min-width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.completedAt) }}
              </template>
            </ElTableColumn>
          </ElTable>
        </WorkflowSectionCard>

        <WorkflowSectionCard title="版本链">
          <ElTable :data="tracking.versions" border>
            <ElTableColumn label="版本ID" min-width="180" prop="versionId" />
            <ElTableColumn label="版本号" min-width="100" prop="versionNo" />
            <ElTableColumn label="状态" min-width="120" prop="versionStatus" />
            <ElTableColumn label="最终诊断快照" min-width="260" prop="finalDiagnosisSnapshot" />
            <ElTableColumn label="签发时间" min-width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.signedAt) }}
              </template>
            </ElTableColumn>
          </ElTable>
        </WorkflowSectionCard>

        <WorkflowSectionCard title="事件链 / 修订链 / 会诊链 / 医嘱链">
          <div class="grid gap-4 xl:grid-cols-2">
            <ElTable :data="tracking.events" border>
              <ElTableColumn label="节点" prop="nodeCode" />
              <ElTableColumn label="事件" prop="eventType" />
              <ElTableColumn label="时间" min-width="180">
                <template #default="{ row }">
                  {{ formatDateTime(row.eventTime) }}
                </template>
              </ElTableColumn>
            </ElTable>
            <ElTable :data="tracking.revisions" border>
              <ElTableColumn label="修订单" prop="requestId" />
              <ElTableColumn label="状态" prop="requestStatus" />
              <ElTableColumn label="新版本" prop="approvedVersionNo" />
            </ElTable>
            <ElTable :data="tracking.consultations" border>
              <ElTableColumn label="会诊单" prop="consultationId" />
              <ElTableColumn label="状态" prop="status" />
              <ElTableColumn label="意见" prop="opinion" />
            </ElTable>
            <ElTable :data="tracking.medicalOrders" border>
              <ElTableColumn label="医嘱号" prop="orderNumber" />
              <ElTableColumn label="内容" prop="orderContent" />
              <ElTableColumn label="状态" prop="status" />
            </ElTable>
          </div>
        </WorkflowSectionCard>
      </template>
    </div>
  </Page>
</template>
