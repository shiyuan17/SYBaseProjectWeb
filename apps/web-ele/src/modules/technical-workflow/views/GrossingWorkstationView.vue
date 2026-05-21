<script setup lang="ts">
import type {
  GrossingBlockItemRequest,
  GrossingSpecimenItemRequest,
  MediaAssetItem,
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
  ElPagination,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  completeGrossing,
  getTechnicalTracking,
  listPendingTechnicalTasks,
  startGrossing,
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
const trackingLoading = ref(false);
const pendingItems = ref<PendingTechnicalTaskItem[]>([]);
const total = ref(0);
const trackingResult = ref<null | TechnicalTrackingViewModel>(null);

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

function createEmptyBlock(): GrossingBlockItemRequest {
  return {
    blockDescription: '',
    blockSite: '',
    specialRequirement: '',
  };
}

function createEmptyMediaAsset(): MediaAssetItem {
  return {
    fileName: '',
    fileUrl: '',
  };
}

function createEmptySpecimen(): GrossingSpecimenItemRequest {
  return {
    blocks: [createEmptyBlock()],
    bodyPartId: '',
    grossDescription: '',
    mediaAssets: [],
    samplingTemplateId: '',
    specimenId: '',
    specimenType: 'ROUTINE',
  };
}

const completeForm = reactive({
  caseId: typeof route.query.caseId === 'string' ? route.query.caseId : '',
  specimens: [createEmptySpecimen()],
  taskId: typeof route.query.taskId === 'string' ? route.query.taskId : '',
});

const currentQuery = computed(() => ({
  page: filters.page,
  pathologyNo: filters.pathologyNo.trim() || undefined,
  size: filters.size,
  taskType: 'GROSSING',
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

function addSpecimen() {
  completeForm.specimens.push(createEmptySpecimen());
}

function removeSpecimen(index: number) {
  if (completeForm.specimens.length === 1) {
    ElMessage.warning('至少保留一条标本明细');
    return;
  }
  completeForm.specimens.splice(index, 1);
}

function addBlock(specimenIndex: number) {
  completeForm.specimens[specimenIndex]?.blocks.push(createEmptyBlock());
}

function removeBlock(specimenIndex: number, blockIndex: number) {
  const blocks = completeForm.specimens[specimenIndex]?.blocks;
  if (!blocks) {
    return;
  }
  if (blocks.length === 1) {
    ElMessage.warning('每个标本至少保留一个蜡块明细');
    return;
  }
  blocks.splice(blockIndex, 1);
}

function addMediaAsset(specimenIndex: number) {
  completeForm.specimens[specimenIndex]?.mediaAssets?.push(createEmptyMediaAsset());
}

function removeMediaAsset(specimenIndex: number, assetIndex: number) {
  completeForm.specimens[specimenIndex]?.mediaAssets?.splice(assetIndex, 1);
}

function seedSpecimensFromTracking() {
  if (!trackingResult.value || trackingResult.value.specimens.length === 0) {
    return;
  }

  completeForm.specimens = trackingResult.value.specimens.map((item) => ({
    blocks: [createEmptyBlock()],
    bodyPartId: '',
    grossDescription: '',
    mediaAssets: [],
    samplingTemplateId: '',
    specimenId: item.specimenId,
    specimenType: 'ROUTINE',
  }));
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
  const caseId = completeForm.caseId.trim();
  if (!caseId) {
    ElMessage.warning('请先输入病例 ID');
    return;
  }

  trackingLoading.value = true;
  pageError.value = '';
  try {
    trackingResult.value = await getTechnicalTracking(caseId);
    seedSpecimensFromTracking();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    trackingLoading.value = false;
  }
}

function adoptTask(row: PendingTechnicalTaskItem) {
  completeForm.taskId = row.id;
  completeForm.caseId = row.caseId;
  if (row.pathologyNo) {
    filters.pathologyNo = row.pathologyNo;
  }
  void loadTracking();
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
    await startGrossing({
      ...payload,
      taskId: row.id,
    });
    ElMessage.success(`任务 ${row.id} 已开始取材`);
    await loadPendingData();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    actionLoading.value = false;
  }
}

async function submitGrossing() {
  const payload = normalizeOperatorPayload();
  if (!completeForm.taskId.trim()) {
    ElMessage.warning('请先选择或输入任务 ID');
    return;
  }
  if (!completeForm.caseId.trim()) {
    ElMessage.warning('请先输入病例 ID');
    return;
  }
  if (!payload.operatorName) {
    ElMessage.warning('请先填写操作人');
    return;
  }

  const normalizedSpecimens = completeForm.specimens.map((item) => ({
    blocks: item.blocks.map((block) => ({
      blockDescription: block.blockDescription?.trim() || null,
      blockSite: block.blockSite?.trim() || null,
      specialRequirement: block.specialRequirement?.trim() || null,
    })),
    bodyPartId: item.bodyPartId?.trim() || null,
    grossDescription: item.grossDescription?.trim() || null,
    mediaAssets:
      item.mediaAssets
        ?.filter((asset) => asset.fileUrl.trim())
        .map((asset) => ({
          fileName: asset.fileName?.trim() || null,
          fileUrl: asset.fileUrl.trim(),
        })) ?? [],
    samplingTemplateId: item.samplingTemplateId?.trim() || null,
    specimenId: item.specimenId.trim(),
    specimenType: item.specimenType.trim(),
  }));

  if (normalizedSpecimens.some((item) => !item.specimenId || !item.specimenType)) {
    ElMessage.warning('请补齐标本 ID 和标本类型');
    return;
  }
  if (
    normalizedSpecimens.some(
      (item) =>
        item.blocks.length === 0 ||
        item.blocks.every(
          (block) =>
            !block.blockDescription && !block.blockSite && !block.specialRequirement,
        ),
    )
  ) {
    ElMessage.warning('每个标本至少需要一条有效的蜡块明细');
    return;
  }

  actionLoading.value = true;
  pageError.value = '';
  try {
    const result = await completeGrossing({
      ...payload,
      caseId: completeForm.caseId.trim(),
      specimens: normalizedSpecimens,
      taskId: completeForm.taskId.trim(),
    });
    ElMessage.success(`取材完成，已生成 ${result.createdDehydrationTaskCount} 条脱水任务`);
    await Promise.all([loadPendingData(), loadTracking()]);
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    actionLoading.value = false;
  }
}

void loadPendingData();
if (completeForm.caseId) {
  void loadTracking();
}
</script>

<template>
  <Page
    title="取材描写"
    description="支持从任务池承接取材任务，查看病例上下文，录入标本、蜡块和附件占位，并完成后续脱水任务生成。"
  >
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
        show-icon
      />

      <WorkflowSectionCard title="操作上下文" description="开始任务和完成取材共用当前操作人、终端与备注信息。">
        <ElForm label-width="96px">
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ElFormItem label="操作人" required>
              <ElInput v-model="operatorForm.operatorName" placeholder="请输入操作人姓名" />
            </ElFormItem>
            <ElFormItem label="操作人 ID">
              <ElInput v-model="operatorForm.operatorUserId" placeholder="请输入操作人用户 ID" />
            </ElFormItem>
            <ElFormItem label="终端编码">
              <ElInput v-model="operatorForm.terminalCode" placeholder="取材终端编码" />
            </ElFormItem>
            <ElFormItem label="备注">
              <ElInput v-model="operatorForm.remarks" placeholder="必要时补充取材说明" />
            </ElFormItem>
          </div>
        </ElForm>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        title="病例上下文"
        description="输入病例 ID 或从待办列表带入后，可加载技术追踪摘要并辅助生成标本明细。"
      >
        <ElForm inline label-width="88px">
          <ElFormItem label="任务 ID">
            <ElInput v-model="completeForm.taskId" placeholder="请输入 taskId" style="width: 240px" />
          </ElFormItem>
          <ElFormItem label="病例 ID">
            <ElInput v-model="completeForm.caseId" placeholder="请输入 caseId" style="width: 240px" />
          </ElFormItem>
          <ElFormItem>
            <ElButton :loading="trackingLoading" type="primary" @click="loadTracking">
              加载病例追踪
            </ElButton>
          </ElFormItem>
        </ElForm>

        <ElDescriptions v-if="trackingResult" :column="3" border class="mt-2">
          <ElDescriptionsItem label="病理号">
            {{ formatNullable(trackingResult.pathologyNo) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="病例状态">
            {{ formatNullable(trackingResult.caseStatus) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="标本数">
            {{ trackingResult.specimens.length }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        title="取材完成表单"
        description="支持多标本、多蜡块录入，并预留附件占位给后续拍照归档或摄像设备接入。"
      >
        <div class="mb-4 flex justify-end">
          <ElButton @click="addSpecimen">新增标本</ElButton>
        </div>

        <div class="flex flex-col gap-4">
          <section
            v-for="(specimen, specimenIndex) in completeForm.specimens"
            :key="specimenIndex"
            class="rounded-lg border border-dashed border-border p-4"
          >
            <div class="mb-4 flex items-center justify-between">
              <h4 class="text-sm font-semibold text-foreground">
                标本 {{ specimenIndex + 1 }}
              </h4>
              <ElButton link type="danger" @click="removeSpecimen(specimenIndex)">
                删除标本
              </ElButton>
            </div>

            <ElForm label-width="96px">
              <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <ElFormItem label="标本 ID" required>
                  <ElInput v-model="specimen.specimenId" placeholder="请输入 specimenId" />
                </ElFormItem>
                <ElFormItem label="标本类型" required>
                  <ElInput v-model="specimen.specimenType" placeholder="例如：ROUTINE" />
                </ElFormItem>
                <ElFormItem label="部位 ID">
                  <ElInput v-model="specimen.bodyPartId" placeholder="请输入 bodyPartId" />
                </ElFormItem>
                <ElFormItem label="模板 ID">
                  <ElInput
                    v-model="specimen.samplingTemplateId"
                    placeholder="请输入 samplingTemplateId"
                  />
                </ElFormItem>
              </div>
              <ElFormItem label="大体描写">
                <ElInput
                  v-model="specimen.grossDescription"
                  :rows="3"
                  placeholder="请输入大体描写"
                  type="textarea"
                />
              </ElFormItem>
            </ElForm>

            <div class="mb-2 mt-4 flex items-center justify-between">
              <h5 class="text-sm font-medium text-foreground">蜡块明细</h5>
              <ElButton link type="primary" @click="addBlock(specimenIndex)">新增蜡块</ElButton>
            </div>
            <div class="flex flex-col gap-3">
              <section
                v-for="(block, blockIndex) in specimen.blocks"
                :key="blockIndex"
                class="rounded border border-border p-3"
              >
                <div class="mb-3 flex justify-end">
                  <ElButton
                    link
                    type="danger"
                    @click="removeBlock(specimenIndex, blockIndex)"
                  >
                    删除蜡块
                  </ElButton>
                </div>
                <div class="grid gap-4 md:grid-cols-3">
                  <ElInput v-model="block.blockSite" placeholder="蜡块部位" />
                  <ElInput v-model="block.blockDescription" placeholder="蜡块描述" />
                  <ElInput v-model="block.specialRequirement" placeholder="特殊要求" />
                </div>
              </section>
            </div>

            <div class="mb-2 mt-4 flex items-center justify-between">
              <h5 class="text-sm font-medium text-foreground">附件占位</h5>
              <ElButton link type="primary" @click="addMediaAsset(specimenIndex)">
                新增附件
              </ElButton>
            </div>
            <div v-if="specimen.mediaAssets?.length" class="flex flex-col gap-3">
              <section
                v-for="(asset, assetIndex) in specimen.mediaAssets"
                :key="assetIndex"
                class="rounded border border-border p-3"
              >
                <div class="mb-3 flex justify-end">
                  <ElButton
                    link
                    type="danger"
                    @click="removeMediaAsset(specimenIndex, assetIndex)"
                  >
                    删除附件
                  </ElButton>
                </div>
                <div class="grid gap-4 md:grid-cols-2">
                  <ElInput v-model="asset.fileUrl" placeholder="附件 URL" />
                  <ElInput v-model="asset.fileName" placeholder="附件名称" />
                </div>
              </section>
            </div>
          </section>
        </div>

        <div class="mt-4 flex justify-end">
          <ElButton :loading="actionLoading" type="primary" @click="submitGrossing">
            完成取材
          </ElButton>
        </div>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        title="待取材任务"
        description="当前按病理号筛选取材任务；可直接开始任务，或带入任务与病例上下文到完成表单。"
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
          <ElFormItem label="仅超时">
            <ElButton
              :type="filters.timedOutOnly ? 'primary' : 'default'"
              @click="filters.timedOutOnly = !filters.timedOutOnly; loadPendingData()"
            >
              {{ filters.timedOutOnly ? '已开启' : '未开启' }}
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
          <ElTableColumn label="任务状态" min-width="120">
            <template #default="{ row }">
              <ElTag :type="getTaskStatusTagType(row.taskStatus)">
                {{ formatNullable(row.taskStatus) }}
              </ElTag>
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
          <ElTableColumn label="创建时间" min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.createdAt) }}
            </template>
          </ElTableColumn>
          <ElTableColumn fixed="right" label="操作" min-width="180">
            <template #default="{ row }">
              <div class="flex gap-2">
                <ElButton link type="primary" @click="startTask(row)">开始取材</ElButton>
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
