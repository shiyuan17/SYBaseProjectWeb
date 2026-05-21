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
  ElInputNumber,
  ElMessage,
  ElOption,
  ElPagination,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  completeEmbedding,
  listPendingTechnicalTasks,
  startEmbedding,
} from '../api/technical-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { DEFAULT_PAGE_SIZE, EVALUATION_LEVEL_OPTIONS } from '../constants';
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
    ElMessage.warning('请先填写操作人');
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
    ElMessage.warning('请先输入任务 ID');
    return;
  }
  if (!completeForm.samplingBlockId.trim()) {
    ElMessage.warning('请先输入取材块 ID');
    return;
  }
  if (!payload.operatorName) {
    ElMessage.warning('请先填写操作人');
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
              <ElInput v-model="operatorForm.operatorName" placeholder="请输入操作人姓名" />
            </ElFormItem>
            <ElFormItem label="操作人 ID">
              <ElInput v-model="operatorForm.operatorUserId" placeholder="请输入操作人用户 ID" />
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

      <WorkflowSectionCard title="包埋完成表单" description="突出取材块、包埋盒、切片提示、评估等级和采样评价等关键字段。">
        <ElForm label-width="108px">
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ElFormItem label="任务 ID" required>
              <ElInput v-model="completeForm.taskId" placeholder="请输入 taskId" />
            </ElFormItem>
            <ElFormItem label="取材块 ID" required>
              <ElInput v-model="completeForm.samplingBlockId" placeholder="请输入 samplingBlockId" />
            </ElFormItem>
            <ElFormItem label="包埋盒编号">
              <ElInput v-model="completeForm.embeddingBoxNo" placeholder="请输入 embeddingBoxNo" />
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
              <ElInput v-model="completeForm.deviceCode" placeholder="请输入 deviceCode" />
            </ElFormItem>
          </div>
          <ElFormItem label="切片提示">
            <ElInput v-model="completeForm.sliceNotice" placeholder="请输入 sliceNotice" />
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
                <ElButton link type="primary" @click="startTask(row)">开始包埋</ElButton>
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
