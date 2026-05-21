<script setup lang="ts">
import type { PendingTechnicalTaskItem } from '../types/technical-workflow';

import { computed, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElPagination,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import SystemUserSelect from '#/modules/system-management/components/SystemUserSelect.vue';

import {
  completeSlicing,
  listPendingTechnicalTasks,
  startSlicing,
} from '../api/technical-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import { formatDateTime, formatNullable, formatObjectType, formatTaskStatus } from '../utils/format';

const route = useRoute();
const userStore = useUserStore();

const pageError = ref('');
const loading = ref(false);
const actionLoading = ref(false);
const pendingItems = ref<PendingTechnicalTaskItem[]>([]);
const total = ref(0);
const selectedTask = ref<null | PendingTechnicalTaskItem>(null);

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
  deviceCode: '',
  embeddingBoxId:
    typeof route.query.objectId === 'string' && route.query.objectType === 'EMBEDDING_BOX'
      ? route.query.objectId
      : '',
  qualityIssue: '',
  slideCount: 1,
  sliceCountPerSlide: 1,
  sliceThickness: '',
  taskId: typeof route.query.taskId === 'string' ? route.query.taskId : '',
});

const currentQuery = computed(() => ({
  page: filters.page,
  pathologyNo: filters.pathologyNo.trim() || undefined,
  size: filters.size,
  taskType: 'SLICING',
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
  selectedTask.value = row;
  completeForm.taskId = row.id;
  if (row.objectType === 'EMBEDDING_BOX' && row.objectId) {
    completeForm.embeddingBoxId = row.objectId;
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
    ElMessage.warning('请先选择操作人');
    return;
  }

  actionLoading.value = true;
  pageError.value = '';
  try {
    await startSlicing({
      ...payload,
      taskId: row.id,
    });
    ElMessage.success(`任务 ${row.id} 已开始切片`);
    await loadPendingData();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    actionLoading.value = false;
  }
}

async function submitSlicing() {
  const payload = normalizeOperatorPayload();
  if (!completeForm.taskId.trim()) {
    ElMessage.warning('请先选择待处理任务');
    return;
  }
  if (!completeForm.embeddingBoxId.trim()) {
    ElMessage.warning('请先选择包埋盒');
    return;
  }
  if (!payload.operatorName) {
    ElMessage.warning('请先选择操作人');
    return;
  }

  actionLoading.value = true;
  pageError.value = '';
  try {
    const result = await completeSlicing({
      ...payload,
      deviceCode: completeForm.deviceCode.trim() || null,
      embeddingBoxId: completeForm.embeddingBoxId.trim(),
      qualityIssue: completeForm.qualityIssue.trim() || null,
      slideCount: completeForm.slideCount,
      sliceCountPerSlide: completeForm.sliceCountPerSlide,
      sliceThickness: completeForm.sliceThickness.trim() || null,
      taskId: completeForm.taskId.trim(),
    });
    ElMessage.success(`切片完成，已生成 ${result.slideIds.length} 张玻片`);
    await loadPendingData();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    actionLoading.value = false;
  }
}

void loadPendingData();

const currentTaskContext = computed(() => ({
  objectId: completeForm.embeddingBoxId || selectedTask.value?.objectId || '',
  objectType: selectedTask.value?.objectType ?? '',
  pathologyNo: selectedTask.value?.pathologyNo ?? '',
  taskId: completeForm.taskId || selectedTask.value?.id || '',
}));

function handleOperatorChange(user: null | { id: string; name: string }) {
  operatorForm.operatorUserId = user?.id ?? '';
  operatorForm.operatorName = user?.name ?? '';
}
</script>

<template>
  <Page
    title="切片工作站"
    description="承接包埋后的切片任务，录入包埋盒、玻片数量、切片厚度和质量问题，形成后续染色出片对象。"
  >
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
        show-icon
      />

      <WorkflowSectionCard title="操作上下文" description="开始切片和完成切片共用操作人、终端与备注信息。">
        <ElForm label-width="96px">
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ElFormItem label="操作人" required>
              <SystemUserSelect
                v-model="operatorForm.operatorUserId"
                :selected-label="operatorForm.operatorName"
                placeholder="请选择操作人"
                @change="handleOperatorChange"
              />
            </ElFormItem>
            <ElFormItem label="终端编码">
              <ElInput v-model="operatorForm.terminalCode" placeholder="切片终端编码" />
            </ElFormItem>
            <ElFormItem label="备注">
              <ElInput v-model="operatorForm.remarks" placeholder="必要时补充说明" />
            </ElFormItem>
          </div>
        </ElForm>
      </WorkflowSectionCard>

      <WorkflowSectionCard title="切片完成表单" description="当前任务上下文带入包埋盒，表单中只保留用户需要决策的切片信息。">
        <ElDescriptions :column="2" border class="mb-4">
          <ElDescriptionsItem label="当前任务号">
            {{ formatNullable(currentTaskContext.taskId) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="病理号">
            {{ formatNullable(currentTaskContext.pathologyNo) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="对象类型">
            {{ formatObjectType(currentTaskContext.objectType) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="包埋盒编号">
            {{ formatNullable(currentTaskContext.objectId) }}
          </ElDescriptionsItem>
        </ElDescriptions>
        <ElForm label-width="108px">
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ElFormItem label="包埋盒编号" required>
              <ElInput v-model="completeForm.embeddingBoxId" disabled placeholder="由当前任务带入" />
            </ElFormItem>
            <ElFormItem label="玻片数量" required>
              <ElInputNumber v-model="completeForm.slideCount" :min="1" class="w-full" />
            </ElFormItem>
            <ElFormItem label="每片切片数">
              <ElInputNumber
                v-model="completeForm.sliceCountPerSlide"
                :min="1"
                class="w-full"
              />
            </ElFormItem>
            <ElFormItem label="切片厚度">
              <ElInput v-model="completeForm.sliceThickness" placeholder="例如：4μm" />
            </ElFormItem>
            <ElFormItem label="设备编码">
              <ElInput v-model="completeForm.deviceCode" placeholder="请输入设备编码" />
            </ElFormItem>
          </div>
          <ElFormItem label="质量问题">
            <ElInput
              v-model="completeForm.qualityIssue"
              :rows="3"
              placeholder="必要时记录切片质量问题"
              type="textarea"
            />
          </ElFormItem>
          <div class="flex justify-end">
            <ElButton :loading="actionLoading" type="primary" @click="submitSlicing">
              完成切片
            </ElButton>
          </div>
        </ElForm>
      </WorkflowSectionCard>

      <WorkflowSectionCard title="待切片任务" description="列表可直接开始切片，也可带入对象信息到完成表单。">
        <ElTable v-loading="loading" :data="pendingItems" border>
          <ElTableColumn label="任务号" min-width="180" prop="id" />
          <ElTableColumn label="病理号" min-width="140">
            <template #default="{ row }">
              {{ formatNullable(row.pathologyNo) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="对象类型" min-width="140">
            <template #default="{ row }">
              {{ formatObjectType(row.objectType) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="对象编号" min-width="180">
            <template #default="{ row }">
              {{ formatNullable(row.objectId) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="任务状态" min-width="120">
            <template #default="{ row }">
              <ElTag :type="getTaskStatusTagType(row.taskStatus)">
                {{ formatTaskStatus(row.taskStatus) }}
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
                <ElButton link type="primary" @click="startTask(row)">开始切片</ElButton>
                <ElButton link type="success" @click="adoptTask(row)">设为当前任务</ElButton>
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
