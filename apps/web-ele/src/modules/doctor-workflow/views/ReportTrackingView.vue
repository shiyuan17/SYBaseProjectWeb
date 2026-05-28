<script setup lang="ts">
import type { MedicalOrderSummary, ReportTrackingView } from '../types/doctor-workflow';

import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore, useUserStore } from '@vben/stores';

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

import {
  M4_MEDICAL_ORDER_PAGE_AUTHORITIES,
  M4_PERMISSION_CODES,
  M4_REPORT_PAGE_AUTHORITIES,
} from '../constants';
import {
  cancelMedicalOrder,
  getReportTracking,
} from '../api/doctor-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { getDoctorWorkflowPageErrorMessage } from '../utils/error';
import {
  formatDateTime,
  formatDiagnosticTaskStatus,
  formatDiagnosticTaskType,
  formatMedicalOrderStatus,
  formatNullable,
  formatReportStatus,
} from '../utils/format';
import { firstQueryParam } from '../utils/route';

const route = useRoute();
const router = useRouter();
const accessStore = useAccessStore();
const userStore = useUserStore();

const loading = ref(false);
const operating = ref(false);
const pageError = ref('');
const tracking = ref<ReportTrackingView | null>(null);
const queryCaseIdentifier = ref('');

const caseId = computed(() => firstQueryParam(route.query.caseId));
const currentUserId = computed(() => userStore.userInfo?.userId ?? '');
const currentUserName = computed(() => userStore.userInfo?.realName ?? '');
const canOpenReport = computed(() => {
  const accessCodeSet = new Set(accessStore.accessCodes);
  return M4_REPORT_PAGE_AUTHORITIES.some((code) => accessCodeSet.has(code));
});
const canCancelMedicalOrder = computed(() =>
  accessStore.accessCodes.includes(M4_PERMISSION_CODES.MEDICAL_ORDER_CANCEL),
);
const canOpenMedicalOrders = computed(() =>
  M4_MEDICAL_ORDER_PAGE_AUTHORITIES.some((code) =>
    accessStore.accessCodes.includes(code),
  ),
);

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
  const normalizedCaseIdentifier = queryCaseIdentifier.value.trim();
  if (!normalizedCaseIdentifier) {
    ElMessage.warning('请输入病例 ID 或病理号');
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

function goToMedicalOrders() {
  if (!tracking.value || !canOpenMedicalOrders.value) {
    return;
  }

  void router.push({
    path: '/doctor-workflow/medical-orders',
    query: {
      pathologyNo: tracking.value.pathologyNo ?? undefined,
    },
  });
}

async function runCancelMedicalOrder(order: MedicalOrderSummary) {
  if (!canCancelMedicalOrder.value) {
    ElMessage.warning('当前账号没有取消医嘱权限');
    return;
  }
  if (order.status !== 'PENDING') {
    ElMessage.warning('仅待处理医嘱可取消');
    return;
  }
  if (!currentUserName.value.trim()) {
    ElMessage.warning('当前登录账号缺少姓名信息，无法执行取消。');
    return;
  }

  operating.value = true;
  try {
    await cancelMedicalOrder(order.orderId, {
      operatorName: currentUserName.value.trim(),
      operatorUserId: currentUserId.value || undefined,
      remarks: '从报告追踪页取消医嘱',
    });
    ElMessage.success('病理医嘱已取消');
    await loadTracking();
  } catch (error) {
    ElMessage.error(getDoctorWorkflowPageErrorMessage(error));
  } finally {
    operating.value = false;
  }
}

watch(
  caseId,
  (value) => {
    queryCaseIdentifier.value = value;
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
  <Page title="报告追踪" description="展示诊断任务链、报告版本链、事件链、修订链、会诊链与医嘱链。">
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
        description="支持从菜单独立进入后按病例 ID 或病理号查询报告追踪，也支持从其他页面深链进入。"
      >
        <ElForm inline label-width="88px">
          <ElFormItem label="病例 ID / 病理号" required>
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

      <WorkflowSectionCard title="追踪摘要">
        <ElEmpty
          v-if="!caseId"
          description="请输入病例 ID 或病理号查询报告追踪，或从其他流程页面进入当前病例。"
        />
        <ElEmpty v-else-if="!loading && !tracking" description="暂无追踪数据" />
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
          <template #extra>
            <ElButton
              v-if="canOpenMedicalOrders"
              type="warning"
              @click="goToMedicalOrders"
            >
              进入医嘱工作台
            </ElButton>
          </template>
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
              <ElTableColumn label="状态">
                <template #default="{ row }">
                  {{ formatMedicalOrderStatus(row.status) }}
                </template>
              </ElTableColumn>
              <ElTableColumn v-if="canCancelMedicalOrder" label="操作" min-width="120">
                <template #default="{ row }">
                  <ElButton
                    :disabled="row.status !== 'PENDING'"
                    :loading="operating"
                    size="small"
                    type="danger"
                    @click="runCancelMedicalOrder(row)"
                  >
                    取消
                  </ElButton>
                </template>
              </ElTableColumn>
            </ElTable>
          </div>
        </WorkflowSectionCard>
      </template>
    </div>
  </Page>
</template>
