<script setup lang="ts">
import type { PendingTechnicalTaskItem } from '../types/technical-workflow';

import { computed, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElPagination,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  completeSlideStaining,
  listPendingTechnicalTasks,
  startSlideStaining,
} from '../api/technical-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import { formatDateTime, formatNullable } from '../utils/format';

const route = useRoute();
const userStore = useUserStore();

const pageError = ref('');
const loading = ref(false);
const actionLoading = ref(false);
const pendingItems = ref<PendingTechnicalTaskItem[]>([]);
const total = ref(0);

const filters = reactive({
  page: 1,
  pathologyNo: typeof route.query.pathologyNo === 'string' ? route.query.pathologyNo : '',
  size: DEFAULT_PAGE_SIZE,
  timedOutOnly: false,
});

const operatorForm = reactive({
  operatorName: userStore.userInfo?.realName ?? '',
  operatorUserId: userStore.userInfo?.userId ?? '',
  remarks: '',
  terminalCode: '',
});

const completeForm = reactive({
  qualityIssue: '',
  slideId:
    typeof route.query.objectId === 'string' && route.query.objectType === 'SLIDE'
      ? route.query.objectId
      : '',
  stainingType: 'HE',
  taskId: typeof route.query.taskId === 'string' ? route.query.taskId : '',
});

const currentQuery = computed(() => ({
  page: filters.page,
  pathologyNo: filters.pathologyNo.trim() || undefined,
  size: filters.size,
  taskType: 'STAINING',
  timedOutOnly: filters.timedOutOnly,
}));

function getTaskStatusTagType(status?: null | string) {
  if (status === 'COMPLETED') {
    return 'success';
  }
  if (status === 'IN_PROGRESS') {
    return 'warning';
  }
  return 'info';
}

function normalizeOperatorPayload() {
  return {
    operatorName: operatorForm.operatorName.trim(),
    operatorUserId: operatorForm.operatorUserId.trim() || null,
    remarks: operatorForm.remarks.trim() || null,
    terminalCode: operatorForm.terminalCode.trim() || null,
  };
}

function adoptTask(row: PendingTechnicalTaskItem) {
  completeForm.taskId = row.id;
  if (row.objectType === 'SLIDE' && row.objectId) {
    completeForm.slideId = row.objectId;
  }
  if (row.pathologyNo) {
    filters.pathologyNo = row.pathologyNo;
  }
}

async function loadPendingData() {
  loading.value = true;
  pageError.value = '';
  try {
    const result = await listPendingTechnicalTasks(currentQuery.value);
    pendingItems.value = result.items;
    total.value = result.total;
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function startTask(row: PendingTechnicalTaskItem) {
  const payload = normalizeOperatorPayload();
  if (!payload.operatorName) {
    ElMessage.warning('请先填写操作人');
    return;
  }

  actionLoading.value = true;
  pageError.value = '';
  try {
    await startSlideStaining({
      ...payload,
      taskId: row.id,
    });
    ElMessage.success(`任务 ${row.id} 已开始染色`);
    await loadPendingData();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    actionLoading.value = false;
  }
}

async function submitStaining() {
  const payload = normalizeOperatorPayload();
  if (!completeForm.taskId.trim()) {
    ElMessage.warning('请先输入任务 ID');
    return;
  }
  if (!completeForm.slideId.trim()) {
    ElMessage.warning('请先输入玻片 ID');
    return;
  }
  if (!completeForm.stainingType.trim()) {
    ElMessage.warning('请先输入染色类型');
    return;
  }
  if (!payload.operatorName) {
    ElMessage.warning('请先填写操作人');
    return;
  }

  actionLoading.value = true;
  pageError.value = '';
  try {
    const result = await completeSlideStaining({
      ...payload,
      qualityIssue: completeForm.qualityIssue.trim() || null,
      slideId: completeForm.slideId.trim(),
      stainingType: completeForm.stainingType.trim(),
      taskId: completeForm.taskId.trim(),
    });
    ElMessage.success(`染色完成，病例状态已更新为 ${formatNullable(result.caseStatus)}`);
    await loadPendingData();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    actionLoading.value = false;
  }
}

void loadPendingData();
</script>

<template>
  <Page
    title="染色出片"
    description="承接切片后的染色任务，录入玻片、染色类型与质量问题，并记录出片后的病例状态。"
  >
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
        show-icon
      />

      <WorkflowSectionCard title="操作上下文" description="开始染色和完成染色共用操作人、终端与备注信息。">
        <ElForm label-width="96px">
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ElFormItem label="操作人" required>
              <ElInput v-model="operatorForm.operatorName" placeholder="请输入操作人姓名" />
            </ElFormItem>
            <ElFormItem label="操作人 ID">
              <ElInput v-model="operatorForm.operatorUserId" placeholder="请输入操作人用户 ID" />
            </ElFormItem>
            <ElFormItem label="终端编码">
              <ElInput v-model="operatorForm.terminalCode" placeholder="染色终端编码" />
            </ElFormItem>
            <ElFormItem label="备注">
              <ElInput v-model="operatorForm.remarks" placeholder="必要时补充说明" />
            </ElFormItem>
          </div>
        </ElForm>
      </WorkflowSectionCard>

      <WorkflowSectionCard title="染色完成表单" description="突出玻片 ID、染色类型和质量问题三类核心录入项。">
        <ElForm label-width="96px">
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ElFormItem label="任务 ID" required>
              <ElInput v-model="completeForm.taskId" placeholder="请输入 taskId" />
            </ElFormItem>
            <ElFormItem label="玻片 ID" required>
              <ElInput v-model="completeForm.slideId" placeholder="请输入 slideId" />
            </ElFormItem>
            <ElFormItem label="染色类型" required>
              <ElInput v-model="completeForm.stainingType" placeholder="例如：HE、IHC" />
            </ElFormItem>
          </div>
          <ElFormItem label="质量问题">
            <ElInput
              v-model="completeForm.qualityIssue"
              :rows="3"
              placeholder="必要时记录染色质量问题"
              type="textarea"
            />
          </ElFormItem>
          <div class="flex justify-end">
            <ElButton :loading="actionLoading" type="primary" @click="submitStaining">
              完成染色
            </ElButton>
          </div>
        </ElForm>
      </WorkflowSectionCard>

      <WorkflowSectionCard title="待染色任务" description="列表可直接开始染色，也可带入玻片对象到完成表单。">
        <ElTable v-loading="loading" :data="pendingItems" border>
          <ElTableColumn label="任务 ID" min-width="180" prop="id" />
          <ElTableColumn label="病理号" min-width="140">
            <template #default="{ row }">
              {{ formatNullable(row.pathologyNo) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="对象类型" min-width="140">
            <template #default="{ row }">
              {{ formatNullable(row.objectType) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="对象 ID" min-width="180">
            <template #default="{ row }">
              {{ formatNullable(row.objectId) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="任务状态" min-width="120">
            <template #default="{ row }">
              <ElTag :type="getTaskStatusTagType(row.taskStatus)">
                {{ formatNullable(row.taskStatus) }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="创建时间" min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.createdAt) }}
            </template>
          </ElTableColumn>
          <ElTableColumn fixed="right" label="操作" min-width="180">
            <template #default="{ row }">
              <div class="flex gap-2">
                <ElButton link type="primary" @click="startTask(row)">开始染色</ElButton>
                <ElButton link type="success" @click="adoptTask(row)">带入表单</ElButton>
              </div>
            </template>
          </ElTableColumn>
        </ElTable>

        <div class="mt-4 flex justify-end">
          <ElPagination
            v-model:current-page="filters.page"
            v-model:page-size="filters.size"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            background
            layout="total, sizes, prev, pager, next, jumper"
            @change="loadPendingData"
          />
        </div>
      </WorkflowSectionCard>
    </div>
  </Page>
</template>
