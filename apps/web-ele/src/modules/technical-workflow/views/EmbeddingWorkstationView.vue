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
  ElOption,
  ElPagination,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import SystemUserSelect from '#/modules/system-management/components/SystemUserSelect.vue';

import {
  completeEmbedding,
  listPendingTechnicalTasks,
  startEmbedding,
} from '../api/technical-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { DEFAULT_PAGE_SIZE, EVALUATION_LEVEL_OPTIONS } from '../constants';
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
  blockCount: 1,
  deviceCode: '',
  embeddingBoxNo:
    typeof route.query.objectId === 'string' && route.query.objectType === 'EMBEDDING_BOX'
      ? route.query.objectId
      : '',
  evaluationLevel: '',
  samplingBlockId:
    typeof route.query.objectId === 'string' && route.query.objectType === 'SAMPLING_BLOCK'
      ? route.query.objectId
      : '',
  samplingEvaluation: '',
  sliceNotice: '',
  taskId: typeof route.query.taskId === 'string' ? route.query.taskId : '',
});

const currentQuery = computed(() => ({
  page: filters.page,
  pathologyNo: filters.pathologyNo.trim() || undefined,
  size: filters.size,
  taskType: 'EMBEDDING',
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
  if (row.objectType === 'SAMPLING_BLOCK' && row.objectId) {
    completeForm.samplingBlockId = row.objectId;
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
    await startEmbedding({
      ...payload,
      taskId: row.id,
    });
    ElMessage.success(`任务 ${row.id} 已开始包埋`);
    await loadPendingData();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    actionLoading.value = false;
  }
}

async function submitEmbedding() {
  const payload = normalizeOperatorPayload();
  if (!completeForm.taskId.trim()) {
    ElMessage.warning('请先选择待处理任务');
    return;
  }
  if (!completeForm.samplingBlockId.trim()) {
    ElMessage.warning('请先选择取材块');
    return;
  }
  if (!payload.operatorName) {
    ElMessage.warning('请先选择操作人');
    return;
  }

  actionLoading.value = true;
  pageError.value = '';
  try {
    const result = await completeEmbedding({
      ...payload,
      blockCount: completeForm.blockCount,
      deviceCode: completeForm.deviceCode.trim() || null,
      embeddingBoxNo: completeForm.embeddingBoxNo.trim() || null,
      evaluationLevel: completeForm.evaluationLevel || null,
      samplingBlockId: completeForm.samplingBlockId.trim(),
      samplingEvaluation: completeForm.samplingEvaluation.trim() || null,
      sliceNotice: completeForm.sliceNotice.trim() || null,
      taskId: completeForm.taskId.trim(),
    });
    ElMessage.success(
      result.markingSuccess
        ? `包埋完成，包埋盒 ${result.embeddingBoxId} 打号成功`
        : `包埋完成，打号结果：${formatNullable(result.markingMessage)}`,
    );
    await loadPendingData();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    actionLoading.value = false;
  }
}

void loadPendingData();

const currentTaskContext = computed(() => ({
  objectId: completeForm.samplingBlockId || selectedTask.value?.objectId || '',
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
    title="包埋工作站"
    description="承接脱水后的包埋任务，录入包埋盒、切片提示和质控评价，并保留设备打号反馈位。"
  >
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
        show-icon
      />

      <WorkflowSectionCard title="操作上下文" description="开始任务和完成包埋共用当前操作人、终端和备注信息。">
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
              <ElInput v-model="operatorForm.terminalCode" placeholder="包埋终端编码" />
            </ElFormItem>
            <ElFormItem label="备注">
              <ElInput v-model="operatorForm.remarks" placeholder="必要时补充说明" />
            </ElFormItem>
          </div>
        </ElForm>
      </WorkflowSectionCard>

      <WorkflowSectionCard title="包埋完成表单" description="当前任务上下文带入取材块，表单中只保留用户需要决策的包埋信息。">
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
          <ElDescriptionsItem label="取材块编号">
            {{ formatNullable(currentTaskContext.objectId) }}
          </ElDescriptionsItem>
        </ElDescriptions>
        <ElForm label-width="108px">
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ElFormItem label="取材块编号" required>
              <ElInput v-model="completeForm.samplingBlockId" disabled placeholder="由当前任务带入" />
            </ElFormItem>
            <ElFormItem label="包埋盒编号">
              <ElInput v-model="completeForm.embeddingBoxNo" placeholder="请输入包埋盒编号" />
            </ElFormItem>
            <ElFormItem label="蜡块数量" required>
              <ElInputNumber v-model="completeForm.blockCount" :min="1" class="w-full" />
            </ElFormItem>
            <ElFormItem label="评估等级">
              <ElSelect
                v-model="completeForm.evaluationLevel"
                clearable
                placeholder="请选择评估等级"
              >
                <ElOption
                  v-for="option in EVALUATION_LEVEL_OPTIONS"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="设备编码">
              <ElInput v-model="completeForm.deviceCode" placeholder="请输入设备编码" />
            </ElFormItem>
          </div>
          <ElFormItem label="切片提示">
            <ElInput v-model="completeForm.sliceNotice" placeholder="请输入切片提示" />
          </ElFormItem>
          <ElFormItem label="取材评估">
            <ElInput
              v-model="completeForm.samplingEvaluation"
              :rows="3"
              placeholder="请输入采样评价或退回说明"
              type="textarea"
            />
          </ElFormItem>
          <div class="flex justify-end">
            <ElButton :loading="actionLoading" type="primary" @click="submitEmbedding">
              完成包埋
            </ElButton>
          </div>
        </ElForm>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        title="待包埋任务"
        description="列表承接包埋任务，支持直接开始，也可将任务对象带入完成表单。"
      >
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
                <ElButton link type="primary" @click="startTask(row)">开始包埋</ElButton>
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
