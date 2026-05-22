<script setup lang="ts">
import type {
  DiagnosticTaskActionRequest,
  DiagnosticWorkbenchView,
  PendingDiagnosticTaskItem,
} from '../types/doctor-workflow';

import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

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
  acceptDiagnosticTask,
  getDiagnosticWorkbench,
  startDiagnosticTask,
} from '../api/doctor-workflow-service';
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
const operating = ref(false);
const pageError = ref('');
const workbench = ref<DiagnosticWorkbenchView | null>(null);

const actionForm = reactive<DiagnosticTaskActionRequest>({
  operatorName: '',
  remarks: '',
  terminalCode: '',
});

const caseId = computed(() => firstQueryParam(route.query.caseId));
const currentTaskId = computed(() => firstQueryParam(route.query.taskId));

const selectedTask = computed(() => {
  if (!workbench.value) {
    return null;
  }
  return (
    workbench.value.diagnosticTasks.find(
      (item) => item.id === currentTaskId.value,
    ) ??
    workbench.value.diagnosticTasks[0] ??
    null
  );
});

async function loadWorkbench() {
  if (!caseId.value) {
    pageError.value = '缺少病例 ID，无法加载诊断工作台。';
    return;
  }

  loading.value = true;
  pageError.value = '';
  try {
    workbench.value = await getDiagnosticWorkbench(caseId.value);
  } catch (error) {
    pageError.value = getDoctorWorkflowPageErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function runTaskAction(
  action: 'accept' | 'start',
  task: PendingDiagnosticTaskItem | null,
) {
  if (!task) {
    ElMessage.warning('当前病例没有可操作的诊断任务');
    return;
  }
  if (!actionForm.operatorName) {
    ElMessage.warning('请填写操作人姓名');
    return;
  }

  operating.value = true;
  try {
    if (action === 'accept') {
      await acceptDiagnosticTask(task.id, actionForm);
      ElMessage.success('诊断任务已接单');
    } else {
      await startDiagnosticTask(task.id, actionForm);
      ElMessage.success('诊断任务已开始');
    }
    await loadWorkbench();
  } catch (error) {
    ElMessage.error(getDoctorWorkflowPageErrorMessage(error));
  } finally {
    operating.value = false;
  }
}

function goToReport() {
  if (!caseId.value) {
    return;
  }

  void router.push({
    path: '/doctor-workflow/report',
    query: {
      caseId: caseId.value,
      pathologyNo: workbench.value?.pathologyNo ?? undefined,
      reportId: workbench.value?.currentReport?.reportId ?? undefined,
      taskId: (selectedTask.value?.id ?? currentTaskId.value) || undefined,
    },
  });
}

void loadWorkbench();
</script>

<template>
  <Page title="诊断工作台" description="按病例聚合展示诊断所需上下文，承载接单、开始诊断和报告编辑入口。">
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        show-icon
        type="error"
      />

      <WorkflowSectionCard title="病例摘要" description="病例、申请单、临床诊断和当前报告摘要。">
        <ElEmpty v-if="!loading && !workbench" description="暂无病例数据" />
        <ElDescriptions v-else :column="3" border>
          <ElDescriptionsItem label="病例ID">
            {{ formatNullable(workbench?.caseId) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="病理号">
            {{ formatNullable(workbench?.pathologyNo) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="患者">
            {{ formatNullable(workbench?.patientName) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="申请单号">
            {{ formatNullable(workbench?.applicationNo) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="送检科室">
            {{ formatNullable(workbench?.submittingDepartmentName) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="送检医生">
            {{ formatNullable(workbench?.submittingDoctorName) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="病例状态">
            {{ formatNullable(workbench?.caseStatus) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="报告状态">
            {{ formatReportStatus(workbench?.currentReport?.reportStatus) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="待修订">
            <ElTag :type="workbench?.hasPendingRevision ? 'warning' : 'info'">
              {{ workbench?.hasPendingRevision ? '是' : '否' }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem :span="3" label="临床诊断">
            {{ formatNullable(workbench?.clinicalDiagnosis) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem :span="3" label="当前最终诊断">
            {{ formatNullable(workbench?.currentReport?.finalDiagnosis) }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </WorkflowSectionCard>

      <WorkflowSectionCard title="任务操作" description="接单和开始诊断会调用诊断任务动作接口。">
        <ElForm inline label-width="80px">
          <ElFormItem label="操作人">
            <ElInput
              v-model="actionForm.operatorName"
              placeholder="请输入操作人姓名"
              style="width: 220px"
            />
          </ElFormItem>
          <ElFormItem label="终端">
            <ElInput
              v-model="actionForm.terminalCode"
              placeholder="终端编码"
              style="width: 180px"
            />
          </ElFormItem>
          <ElFormItem label="备注">
            <ElInput
              v-model="actionForm.remarks"
              placeholder="备注"
              style="width: 260px"
            />
          </ElFormItem>
          <ElFormItem>
            <ElButton
              :loading="operating"
              type="primary"
              @click="runTaskAction('accept', selectedTask)"
            >
              接单
            </ElButton>
            <ElButton
              :loading="operating"
              type="success"
              @click="runTaskAction('start', selectedTask)"
            >
              开始诊断
            </ElButton>
            <ElButton type="warning" @click="goToReport">报告编辑</ElButton>
          </ElFormItem>
        </ElForm>
      </WorkflowSectionCard>

      <WorkflowSectionCard title="诊断任务链">
        <ElTable v-loading="loading" :data="workbench?.diagnosticTasks ?? []" border>
          <ElTableColumn label="任务号" min-width="180" prop="id" />
          <ElTableColumn label="类型" min-width="100">
            <template #default="{ row }">
              {{ formatDiagnosticTaskType(row.taskType) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="状态" min-width="110">
            <template #default="{ row }">
              {{ formatDiagnosticTaskStatus(row.taskStatus) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="责任医生" min-width="140">
            <template #default="{ row }">
              {{ formatNullable(row.diagnosisDoctorName) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="初诊医生" min-width="140">
            <template #default="{ row }">
              {{ formatNullable(row.primaryDoctorName) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="审核医生" min-width="140">
            <template #default="{ row }">
              {{ formatNullable(row.reviewerName) }}
            </template>
          </ElTableColumn>
        </ElTable>
      </WorkflowSectionCard>

      <WorkflowSectionCard title="标本 / 蜡块 / 玻片">
        <div class="grid gap-4 xl:grid-cols-3">
          <ElTable :data="workbench?.specimens ?? []" border>
            <ElTableColumn label="标本号" prop="specimenNo" />
            <ElTableColumn label="名称" prop="specimenName" />
            <ElTableColumn label="状态" prop="specimenStatus" />
          </ElTable>
          <ElTable :data="workbench?.blocks ?? []" border>
            <ElTableColumn label="蜡块号" prop="blockCode" />
            <ElTableColumn label="包埋盒" prop="embeddingBoxNo" />
            <ElTableColumn label="借阅" prop="loanStatus" />
          </ElTable>
          <ElTable :data="workbench?.slides ?? []" border>
            <ElTableColumn label="玻片号" prop="slideNo" />
            <ElTableColumn label="状态" prop="slideStatus" />
            <ElTableColumn label="质控" prop="qualityStatus" />
          </ElTable>
        </div>
      </WorkflowSectionCard>

      <WorkflowSectionCard title="修订 / 会诊 / 医嘱摘要">
        <div class="grid gap-4 xl:grid-cols-3">
          <ElTable :data="workbench?.revisions ?? []" border>
            <ElTableColumn label="修订单" prop="requestId" />
            <ElTableColumn label="状态" prop="requestStatus" />
            <ElTableColumn label="申请人" prop="requestedByName" />
          </ElTable>
          <ElTable :data="workbench?.consultations ?? []" border>
            <ElTableColumn label="会诊单" prop="consultationId" />
            <ElTableColumn label="状态" prop="status" />
            <ElTableColumn label="主持人" prop="hostName" />
          </ElTable>
          <ElTable :data="workbench?.medicalOrders ?? []" border>
            <ElTableColumn label="医嘱号" prop="orderNumber" />
            <ElTableColumn label="类型" prop="orderType" />
            <ElTableColumn label="状态" prop="status" />
          </ElTable>
        </div>
      </WorkflowSectionCard>

      <WorkflowSectionCard title="技术与诊断事件">
        <ElTable :data="workbench?.recentEvents ?? []" border>
          <ElTableColumn label="节点" min-width="140" prop="nodeCode" />
          <ElTableColumn label="事件" min-width="140" prop="eventType" />
          <ElTableColumn label="状态" min-width="120" prop="eventStatus" />
          <ElTableColumn label="时间" min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.eventTime) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="内容" min-width="240" prop="eventContent" />
        </ElTable>
      </WorkflowSectionCard>
    </div>
  </Page>
</template>
