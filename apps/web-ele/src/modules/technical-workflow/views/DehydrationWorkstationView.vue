<script setup lang="ts">
import type {
  DehydrationBatchResult,
  PendingTechnicalTaskItem,
  TechnicalTrackingView as TechnicalTrackingViewModel,
} from '../types/technical-workflow';

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
  completeDehydrationBatch,
  createDehydrationBatch,
  getTechnicalTracking,
  listPendingTechnicalTasks,
  startDehydrationBatch,
} from '../api/technical-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  formatBatchStatus,
  formatDateTime,
  formatNullable,
  formatObjectType,
  formatTaskStatus,
} from '../utils/format';

const route = useRoute();
const userStore = useUserStore();

const pageError = ref('');
const loading = ref(false);
const actionLoading = ref(false);
const pendingItems = ref<PendingTechnicalTaskItem[]>([]);
const total = ref(0);
const lastBatchResult = ref<DehydrationBatchResult | null>(null);
const trackingLoading = ref(false);
const trackingResult = ref<null | TechnicalTrackingViewModel>(null);
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

const createForm = reactive({
  basketNo: '',
  caseId: typeof route.query.caseId === 'string' ? route.query.caseId : '',
  deviceNo: '',
  selectedSamplingBlockIds: [] as string[],
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
  const manualIds = createForm.samplingBlockIdsText
    .split(/[\s,，]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from(new Set([...createForm.selectedSamplingBlockIds, ...manualIds]));
}

function adoptTask(row: PendingTechnicalTaskItem) {
  selectedTask.value = row;
  createForm.caseId = row.caseId;
  if (row.objectType === 'SAMPLING_BLOCK' && row.objectId) {
    const values = parseSamplingBlockIds();
    if (!values.includes(row.objectId)) {
      values.push(row.objectId);
    }
    createForm.selectedSamplingBlockIds = values;
    createForm.samplingBlockIdsText = values.join('\n');
  }
  if (row.pathologyNo) {
    filters.pathologyNo = row.pathologyNo;
  }
  void loadTracking();
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

async function loadTracking() {
  const caseId = createForm.caseId.trim();
  if (!caseId) {
    ElMessage.warning('请先从待办任务中选择病例上下文');
    return;
  }

  trackingLoading.value = true;
  pageError.value = '';
  try {
    trackingResult.value = await getTechnicalTracking(caseId);
    const blockIds = trackingResult.value.blocks.map((item) => item.blockId);
    if (createForm.selectedSamplingBlockIds.length === 0) {
      createForm.selectedSamplingBlockIds = blockIds;
    }
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    trackingLoading.value = false;
  }
}

async function submitCreateBatch() {
  const payload = normalizeOperatorPayload();
  const samplingBlockIds = parseSamplingBlockIds();
  if (!createForm.caseId.trim()) {
    ElMessage.warning('请先选择病例上下文');
    return;
  }
  if (!createForm.basketNo.trim()) {
    ElMessage.warning('请先输入脱水筐编号');
    return;
  }
  if (!payload.operatorName) {
    ElMessage.warning('请先选择操作人');
    return;
  }
  if (samplingBlockIds.length === 0) {
    ElMessage.warning('请至少选择一个取材块');
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
    ElMessage.warning('请先选择或带入批次编号');
    return;
  }
  if (!payload.operatorName) {
    ElMessage.warning('请先选择操作人');
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
    ElMessage.warning('请先选择或带入批次编号');
    return;
  }
  if (!payload.operatorName) {
    ElMessage.warning('请先选择操作人');
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
if (createForm.caseId) {
  void loadTracking();
}

const currentTaskContext = computed(() => ({
  caseId: createForm.caseId || selectedTask.value?.caseId || '',
  objectId: selectedTask.value?.objectId ?? '',
  objectType: selectedTask.value?.objectType ?? '',
  pathologyNo: selectedTask.value?.pathologyNo ?? '',
  taskId: selectedTask.value?.id ?? '',
}));

function handleOperatorChange(user: null | { id: string; name: string }) {
  operatorForm.operatorUserId = user?.id ?? '';
  operatorForm.operatorName = user?.name ?? '';
}
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
              <SystemUserSelect
                v-model="operatorForm.operatorUserId"
                :selected-label="operatorForm.operatorName"
                placeholder="请选择操作人"
                @change="handleOperatorChange"
              />
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
              placeholder="请输入病理号"
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
          <ElTableColumn fixed="right" label="操作" min-width="120">
            <template #default="{ row }">
              <ElButton link type="primary" @click="adoptTask(row)">设为当前任务</ElButton>
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
        description="按病例与取材块集合创建脱水批次，默认使用病例上下文下的取材块选择。"
      >
        <ElDescriptions :column="3" border class="mb-4">
          <ElDescriptionsItem label="当前任务号">
            {{ formatNullable(currentTaskContext.taskId) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="病例编号">
            {{ formatNullable(currentTaskContext.caseId) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="病理号">
            {{ formatNullable(currentTaskContext.pathologyNo) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="对象类型">
            {{ formatObjectType(currentTaskContext.objectType) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="对象编号" :span="2">
            {{ formatNullable(currentTaskContext.objectId) }}
          </ElDescriptionsItem>
        </ElDescriptions>

        <div class="mb-4 flex justify-end">
          <ElButton :loading="trackingLoading" @click="loadTracking">加载病例取材块</ElButton>
        </div>
        <ElForm label-width="108px">
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ElFormItem label="病例编号" required>
              <ElInput v-model="createForm.caseId" disabled placeholder="由当前任务带入" />
            </ElFormItem>
            <ElFormItem label="脱水筐编号" required>
              <ElInput v-model="createForm.basketNo" placeholder="请输入脱水筐编号" />
            </ElFormItem>
            <ElFormItem label="设备编号">
              <ElInput v-model="createForm.deviceNo" placeholder="请输入设备编号" />
            </ElFormItem>
          </div>
          <ElFormItem label="取材块选择" required>
            <ElSelect
              v-model="createForm.selectedSamplingBlockIds"
              collapse-tags
              collapse-tags-tooltip
              filterable
              multiple
              placeholder="请选择当前病例下的取材块"
              style="width: 100%"
            >
              <ElOption
                v-for="block in trackingResult?.blocks ?? []"
                :key="block.blockId"
                :label="`${block.blockCode || block.blockId} / ${block.description || '未命名取材块'}`"
                :value="block.blockId"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="批量粘贴编号">
            <ElInput
              v-model="createForm.samplingBlockIdsText"
              :rows="4"
              placeholder="支持换行、空格或逗号分隔多个取材块编号"
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
        description="当前以后端已落地接口为准，带入批次编号后可记录开始脱水、完成脱水与附件回传。"
      >
        <ElForm label-width="96px">
          <ElFormItem label="批次编号" required>
            <ElInput v-model="batchForm.batchId" placeholder="请输入批次编号" />
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
                <ElInput v-model="asset.fileUrl" placeholder="附件地址" />
                <ElInput v-model="asset.fileName" placeholder="附件名称" />
              </div>
            </section>
          </div>
        </ElForm>

        <ElAlert
          v-if="lastBatchResult"
          :closable="false"
          :title="`最近批次：${lastBatchResult.batchNo}（${formatBatchStatus(lastBatchResult.batchStatus)}）`"
          class="mt-4"
          type="success"
          show-icon
        />
      </WorkflowSectionCard>
    </div>
  </Page>
</template>
