<script setup lang="ts">
import type { IntegrationTaskQuery } from '../types/m6-management';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  ElAlert,
  ElButton,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import WorkflowSectionCard from '#/modules/doctor-workflow/components/WorkflowSectionCard.vue';

import { listIntegrationTasks } from '../api/m6-management-service';

const loading = ref(false);
const pageError = ref('');
const tasks = ref([] as Awaited<ReturnType<typeof listIntegrationTasks>>);

const queryForm = reactive<IntegrationTaskQuery>({
  businessId: '',
  businessType: '',
  compensationStatus: '',
  externalSystem: '',
  reconciliationStatus: '',
  stageCode: '',
  taskStatus: '',
  taskType: '',
});

function displayText(value?: null | string) {
  return value?.trim() ? value : '-';
}

function formatPayload(value?: null | string) {
  if (!value?.trim()) {
    return '-';
  }
  return value.length > 80 ? `${value.slice(0, 80)}...` : value;
}

async function loadTasks() {
  loading.value = true;
  pageError.value = '';
  try {
    tasks.value = await listIntegrationTasks({
      businessId: queryForm.businessId?.trim() || undefined,
      businessType: queryForm.businessType?.trim() || undefined,
      compensationStatus: queryForm.compensationStatus?.trim() || undefined,
      externalSystem: queryForm.externalSystem?.trim() || undefined,
      reconciliationStatus: queryForm.reconciliationStatus?.trim() || undefined,
      stageCode: queryForm.stageCode?.trim() || undefined,
      taskStatus: queryForm.taskStatus?.trim() || undefined,
      taskType: queryForm.taskType?.trim() || undefined,
    });
  } catch (error) {
    tasks.value = [];
    pageError.value =
      error instanceof Error ? error.message : '集成任务加载失败';
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  queryForm.businessId = '';
  queryForm.businessType = '';
  queryForm.compensationStatus = '';
  queryForm.externalSystem = '';
  queryForm.reconciliationStatus = '';
  queryForm.stageCode = '';
  queryForm.taskStatus = '';
  queryForm.taskType = '';
  void loadTasks();
}

onMounted(() => {
  void loadTasks();
});
</script>

<template>
  <Page
    title="集成任务"
    description="查询临床导入、收费提交和历史导入等 M6 集成任务轨迹。"
  >
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        show-icon
        type="error"
      />

      <WorkflowSectionCard
        title="查询条件"
        description="按任务类型、业务对象、状态、补偿状态和对账状态筛选集成轨迹。"
      >
        <ElForm inline label-width="90px">
          <ElFormItem label="任务类型">
            <ElInput v-model="queryForm.taskType" placeholder="如 BILLING_SUBMIT" />
          </ElFormItem>
          <ElFormItem label="业务类型">
            <ElInput v-model="queryForm.businessType" placeholder="如 BILLING_RECORD" />
          </ElFormItem>
          <ElFormItem label="业务 ID">
            <ElInput v-model="queryForm.businessId" placeholder="业务主键" />
          </ElFormItem>
          <ElFormItem label="任务状态">
            <ElInput v-model="queryForm.taskStatus" placeholder="如 SUCCESS / FAILED" />
          </ElFormItem>
          <ElFormItem label="阶段编码">
            <ElInput v-model="queryForm.stageCode" placeholder="如 REPORT_PUBLISH" />
          </ElFormItem>
          <ElFormItem label="外部系统">
            <ElInput v-model="queryForm.externalSystem" placeholder="如 MOCK_BILLING" />
          </ElFormItem>
          <ElFormItem label="补偿状态">
            <ElInput
              v-model="queryForm.compensationStatus"
              placeholder="如 RETRY_PENDING"
            />
          </ElFormItem>
          <ElFormItem label="对账状态">
            <ElInput
              v-model="queryForm.reconciliationStatus"
              placeholder="如 MATCHED"
            />
          </ElFormItem>
          <ElFormItem>
            <ElButton :loading="loading" type="primary" @click="loadTasks">
              查询
            </ElButton>
            <ElButton @click="handleReset">重置</ElButton>
          </ElFormItem>
        </ElForm>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        title="任务列表"
        :description="`当前返回 ${tasks.length} 条集成任务记录。`"
      >
        <ElEmpty v-if="!loading && tasks.length === 0 && !pageError" description="暂无集成任务" />
        <ElTable v-else v-loading="loading" :data="tasks" border>
          <ElTableColumn label="任务 ID" min-width="180" prop="id" />
          <ElTableColumn label="任务类型" min-width="140" prop="taskType" />
          <ElTableColumn label="业务类型" min-width="140" prop="businessType" />
          <ElTableColumn label="业务 ID" min-width="160" prop="businessId" />
          <ElTableColumn label="阶段" min-width="140" prop="stageCode" />
          <ElTableColumn label="外部系统" min-width="140" prop="externalSystem" />
          <ElTableColumn label="任务状态" min-width="120">
            <template #default="{ row }">
              <ElTag :type="row.taskStatus === 'SUCCESS' ? 'success' : row.taskStatus === 'FAILED' ? 'danger' : 'warning'">
                {{ displayText(row.taskStatus) }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="补偿状态" min-width="120">
            <template #default="{ row }">
              {{ displayText(row.compensationStatus) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="对账状态" min-width="120">
            <template #default="{ row }">
              {{ displayText(row.reconciliationStatus) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="重试次数" min-width="100" prop="retryCount" />
          <ElTableColumn label="下次重试" min-width="180">
            <template #default="{ row }">
              {{ displayText(row.nextRetryAt) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="错误码" min-width="160">
            <template #default="{ row }">
              {{ displayText(row.lastErrorCode) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="请求载荷" min-width="240">
            <template #default="{ row }">
              {{ formatPayload(row.requestPayload) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="响应载荷" min-width="240">
            <template #default="{ row }">
              {{ formatPayload(row.responsePayload) }}
            </template>
          </ElTableColumn>
        </ElTable>
      </WorkflowSectionCard>
    </div>
  </Page>
</template>
