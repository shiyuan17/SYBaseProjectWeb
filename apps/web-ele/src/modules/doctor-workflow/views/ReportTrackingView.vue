<script setup lang="ts">
import type { ReportTrackingView } from '../types/doctor-workflow';

import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ElAlert,
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

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

const loading = ref(false);
const pageError = ref('');
const tracking = ref<ReportTrackingView | null>(null);

const caseId = computed(() => firstQueryParam(route.query.caseId));

async function loadTracking() {
  if (!caseId.value) {
    pageError.value = '缺少病例 ID，无法加载报告跟踪。';
    return;
  }

  loading.value = true;
  pageError.value = '';
  try {
    tracking.value = await getReportTracking(caseId.value);
  } catch (error) {
    pageError.value = getDoctorWorkflowPageErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

function goToReport() {
  if (!tracking.value) {
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

void loadTracking();
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

      <WorkflowSectionCard title="跟踪摘要">
        <ElEmpty v-if="!loading && !tracking" description="暂无跟踪数据" />
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
        <template #extra>
          <ElButton type="primary" @click="goToReport">进入报告</ElButton>
        </template>
      </WorkflowSectionCard>

      <WorkflowSectionCard title="诊断任务链">
        <ElTable v-loading="loading" :data="tracking?.diagnosticTasks ?? []" border>
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
        <ElTable :data="tracking?.versions ?? []" border>
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
          <ElTable :data="tracking?.events ?? []" border>
            <ElTableColumn label="节点" prop="nodeCode" />
            <ElTableColumn label="事件" prop="eventType" />
            <ElTableColumn label="时间" min-width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.eventTime) }}
              </template>
            </ElTableColumn>
          </ElTable>
          <ElTable :data="tracking?.revisions ?? []" border>
            <ElTableColumn label="修订单" prop="requestId" />
            <ElTableColumn label="状态" prop="requestStatus" />
            <ElTableColumn label="新版本" prop="approvedVersionNo" />
          </ElTable>
          <ElTable :data="tracking?.consultations ?? []" border>
            <ElTableColumn label="会诊单" prop="consultationId" />
            <ElTableColumn label="状态" prop="status" />
            <ElTableColumn label="意见" prop="opinion" />
          </ElTable>
          <ElTable :data="tracking?.medicalOrders ?? []" border>
            <ElTableColumn label="医嘱号" prop="orderNumber" />
            <ElTableColumn label="内容" prop="orderContent" />
            <ElTableColumn label="状态" prop="status" />
          </ElTable>
        </div>
      </WorkflowSectionCard>
    </div>
  </Page>
</template>
