<script setup lang="ts">
import type { DehydrationBatchResult, PendingTechnicalTaskItem } from '../types/technical-workflow';

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
  completeDehydrationBatch,
  createDehydrationBatch,
  listPendingTechnicalTasks,
  startDehydrationBatch,
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
const lastBatchResult = ref<DehydrationBatchResult | null>(null);

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

const createForm = reactive({
  basketNo: '',
  caseId: typeof route.query.caseId === 'string' ? route.query.caseId : '',
  deviceNo: '',
  samplingBlockIdsText:
    typeof route.query.objectId === 'string' && route.query.objectType === 'SAMPLING_BLOCK'
      ? route.query.objectId
      : '',
});

const batchForm = reactive({
  batchId: '',
  mediaAssets: [
    {
      fileName: '',
      fileUrl: '',
    },
  ],
});

const currentQuery = computed(() => ({
  page: filters.page,
  pathologyNo: filters.pathologyNo.trim() || undefined,
  size: filters.size,
  taskType: 'DEHYDRATION',
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

function parseSamplingBlockIds() {
  return Array.from(
    new Set(
      createForm.samplingBlockIdsText
        .split(/[\s,，]+/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function adoptTask(row: PendingTechnicalTaskItem) {
  createForm.caseId = row.caseId;
  if (row.objectType === 'SAMPLING_BLOCK' && row.objectId) {
    const values = parseSamplingBlockIds();
    if (!values.includes(row.objectId)) {
      values.push(row.objectId);
    }
    createForm.samplingBlockIdsText = values.join('\n');
  }
  if (row.pathologyNo) {
    filters.pathologyNo = row.pathologyNo;
  }
}

function addMediaAsset() {
  batchForm.mediaAssets.push({
    fileName: '',
    fileUrl: '',
  });
}

function removeMediaAsset(index: number) {
  if (batchForm.mediaAssets.length === 1) {
    ElMessage.warning('至少保留一条附件占位');
    return;
  }
  batchForm.mediaAssets.splice(index, 1);
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

async function submitCreateBatch() {
  const payload = normalizeOperatorPayload();
  const samplingBlockIds = parseSamplingBlockIds();
  if (!createForm.caseId.trim()) {
    ElMessage.warning('请先输入病例 ID');
    return;
  }
  if (!createForm.basketNo.trim()) {
    ElMessage.warning('请先输入脱水筐编号');
    return;
  }
  if (!payload.operatorName) {
    ElMessage.warning('请先填写操作人');
    return;
  }
  if (samplingBlockIds.length === 0) {
    ElMessage.warning('请至少输入一个取材块 ID');
    return;
  }

  actionLoading.value = true;
  pageError.value = '';
  try {
    lastBatchResult.value = await createDehydrationBatch({
      ...payload,
      basketNo: createForm.basketNo.trim(),
      caseId: createForm.caseId.trim(),
      deviceNo: createForm.deviceNo.trim() || null,
      samplingBlockIds,
    });
    batchForm.batchId = lastBatchResult.value.batchId;
    ElMessage.success(`脱水批次 ${lastBatchResult.value.batchNo} 创建成功`);
    await loadPendingData();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    actionLoading.value = false;
  }
}

async function submitStartBatch() {
  const payload = normalizeOperatorPayload();
  if (!batchForm.batchId.trim()) {
    ElMessage.warning('请先输入批次 ID');
    return;
  }
  if (!payload.operatorName) {
    ElMessage.warning('请先填写操作人');
    return;
  }

  actionLoading.value = true;
  pageError.value = '';
  try {
    lastBatchResult.value = await startDehydrationBatch(batchForm.batchId.trim(), payload);
    ElMessage.success(`批次 ${lastBatchResult.value.batchNo} 已开始脱水`);
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    actionLoading.value = false;
  }
}

async function submitCompleteBatch() {
  const payload = normalizeOperatorPayload();
  if (!batchForm.batchId.trim()) {
    ElMessage.warning('请先输入批次 ID');
    return;
  }
  if (!payload.operatorName) {
    ElMessage.warning('请先填写操作人');
    return;
  }

  actionLoading.value = true;
  pageError.value = '';
  try {
    lastBatchResult.value = await completeDehydrationBatch(batchForm.batchId.trim(), {
      ...payload,
      mediaAssets: batchForm.mediaAssets
        .filter((item) => item.fileUrl.trim())
        .map((item) => ({
          fileName: item.fileName.trim() || null,
          fileUrl: item.fileUrl.trim(),
        })),
    });
    ElMessage.success(`批次 ${lastBatchResult.value.batchNo} 已完成脱水`);
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
    title="脱水工作站"
    description="按蜡块任务创建脱水批次，并记录开始、完成及附件占位信息，形成后续包埋任务的前置批量操作。"
  >
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
        show-icon
      />

      <WorkflowSectionCard title="操作上下文" description="创建、开始、完成脱水批次共用当前操作人和终端信息。">
        <ElForm label-width="96px">
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ElFormItem label="操作人" required>
              <ElInput v-model="operatorForm.operatorName" placeholder="请输入操作人姓名" />
            </ElFormItem>
            <ElFormItem label="操作人 ID">
              <ElInput v-model="operatorForm.operatorUserId" placeholder="请输入操作人用户 ID" />
            </ElFormItem>
            <ElFormItem label="终端编码">
              <ElInput v-model="operatorForm.terminalCode" placeholder="脱水终端编码" />
            </ElFormItem>
            <ElFormItem label="备注">
              <ElInput v-model="operatorForm.remarks" placeholder="必要时补充说明" />
            </ElFormItem>
          </div>
        </ElForm>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        title="待脱水任务"
        description="每条待办对象默认对应蜡块级任务，可带入批次创建表单，减少手工录入。"
      >
        <ElForm inline label-width="88px">
          <ElFormItem label="病理号">
            <ElInput
              v-model="filters.pathologyNo"
              clearable
              placeholder="请输入 pathologyNo"
              style="width: 220px"
              @keyup.enter="loadPendingData"
            />
          </ElFormItem>
          <ElFormItem>
            <ElButton type="primary" @click="loadPendingData">刷新列表</ElButton>
            <ElButton
              @click="filters.timedOutOnly = !filters.timedOutOnly; loadPendingData()"
            >
              {{ filters.timedOutOnly ? '仅超时中' : '切换仅超时' }}
            </ElButton>
          </ElFormItem>
        </ElForm>

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
          <ElTableColumn fixed="right" label="操作" min-width="120">
            <template #default="{ row }">
              <ElButton link type="primary" @click="adoptTask(row)">带入批次</ElButton>
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

      <WorkflowSectionCard
        title="创建脱水批次"
        description="按病例与蜡块集合创建脱水批次，适配扫码篮筐和人工批量选择两类场景。"
      >
        <ElForm label-width="108px">
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ElFormItem label="病例 ID" required>
              <ElInput v-model="createForm.caseId" placeholder="请输入 caseId" />
            </ElFormItem>
            <ElFormItem label="脱水筐编号" required>
              <ElInput v-model="createForm.basketNo" placeholder="请输入 basketNo" />
            </ElFormItem>
            <ElFormItem label="设备编号">
              <ElInput v-model="createForm.deviceNo" placeholder="请输入 deviceNo" />
            </ElFormItem>
          </div>
          <ElFormItem label="取材块 ID 列表" required>
            <ElInput
              v-model="createForm.samplingBlockIdsText"
              :rows="4"
              placeholder="支持换行、空格或逗号分隔多个 samplingBlockId"
              type="textarea"
            />
          </ElFormItem>
          <div class="flex justify-end">
            <ElButton :loading="actionLoading" type="primary" @click="submitCreateBatch">
              创建批次
            </ElButton>
          </div>
        </ElForm>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        title="批次开始与完成"
        description="当前以后端已落地接口为准，输入批次 ID 即可记录开始脱水、完成脱水与附件回传。"
      >
        <ElForm label-width="96px">
          <ElFormItem label="批次 ID" required>
            <ElInput v-model="batchForm.batchId" placeholder="请输入 batchId" />
          </ElFormItem>
          <div class="mb-4 flex gap-2">
            <ElButton :loading="actionLoading" type="primary" @click="submitStartBatch">
              开始脱水
            </ElButton>
            <ElButton :loading="actionLoading" type="success" @click="submitCompleteBatch">
              完成脱水
            </ElButton>
          </div>

          <div class="mb-2 flex items-center justify-between">
            <h4 class="text-sm font-medium text-foreground">附件占位</h4>
            <ElButton link type="primary" @click="addMediaAsset">新增附件</ElButton>
          </div>
          <div class="flex flex-col gap-3">
            <section
              v-for="(asset, assetIndex) in batchForm.mediaAssets"
              :key="assetIndex"
              class="rounded border border-border p-3"
            >
              <div class="mb-3 flex justify-end">
                <ElButton link type="danger" @click="removeMediaAsset(assetIndex)">
                  删除附件
                </ElButton>
              </div>
              <div class="grid gap-4 md:grid-cols-2">
                <ElInput v-model="asset.fileUrl" placeholder="附件 URL" />
                <ElInput v-model="asset.fileName" placeholder="附件名称" />
              </div>
            </section>
          </div>
        </ElForm>

        <ElAlert
          v-if="lastBatchResult"
          :closable="false"
          :title="`最近批次：${lastBatchResult.batchNo}（${formatNullable(lastBatchResult.batchStatus)}）`"
          class="mt-4"
          type="success"
          show-icon
        />
      </WorkflowSectionCard>
    </div>
  </Page>
</template>
