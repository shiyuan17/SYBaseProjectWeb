<script setup lang="ts">
import type {
  GrossingBlockItemRequest,
  GrossingSpecimenItemRequest,
  MediaAssetItem,
  PendingTechnicalTaskItem,
  TechnicalTrackingView as TechnicalTrackingViewModel,
} from '../types/technical-workflow';
import type {
  BodyPartNode,
  TemplateCategoryNode,
} from '#/modules/system-management/types/system-management';

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

import { listBodyParts, listSamplingTemplates } from '#/modules/system-management/api/system-management-service';
import {
  createEmptyWorkflowReferenceOptions,
  loadWorkflowReferenceOptionsSafely,
} from '#/modules/system-management/api/workflow-reference-service';
import ReferenceOptionSelect from '#/modules/system-management/components/ReferenceOptionSelect.vue';
import SystemUserSelect from '#/modules/system-management/components/SystemUserSelect.vue';

import {
  completeGrossing,
  getTechnicalTracking,
  listPendingTechnicalTasks,
  startGrossing,
} from '../api/technical-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  formatCaseStatus,
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
const trackingLoading = ref(false);
const pendingItems = ref<PendingTechnicalTaskItem[]>([]);
const total = ref(0);
const trackingResult = ref<null | TechnicalTrackingViewModel>(null);
const selectedTask = ref<null | PendingTechnicalTaskItem>(null);
const bodyPartOptions = ref<Array<{ label: string; value: string }>>([]);
const samplingTemplateOptions = ref<Array<{ label: string; value: string }>>([]);
const workflowReferenceOptions = ref(createEmptyWorkflowReferenceOptions());

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

function flattenBodyPartOptions(nodes: BodyPartNode[]) {
  const options: Array<{ label: string; value: string }> = [];
  const walk = (items: BodyPartNode[], path: string[] = []) => {
    items.forEach((item) => {
      const nextPath = [...path, item.partName];
      options.push({
        label: nextPath.join(' / '),
        value: item.id,
      });
      if (item.children?.length) {
        walk(item.children, nextPath);
      }
    });
  };
  walk(nodes);
  bodyPartOptions.value = options;
}

function flattenSamplingTemplateOptions(nodes: TemplateCategoryNode[]) {
  const options: Array<{ label: string; value: string }> = [];
  const walk = (items: TemplateCategoryNode[], path: string[] = []) => {
    items.forEach((item) => {
      const nextPath = [...path, item.categoryName];
      item.templates?.forEach((template) => {
        options.push({
          label: `${nextPath.join(' / ')} / ${template.templateName}`,
          value: template.id,
        });
      });
      if (item.children?.length) {
        walk(item.children, nextPath);
      }
    });
  };
  walk(nodes);
  samplingTemplateOptions.value = options;
}

async function loadSelectOptions() {
  try {
    const [bodyParts, samplingTemplates] = await Promise.all([
      listBodyParts(),
      listSamplingTemplates(),
    ]);
    flattenBodyPartOptions(bodyParts);
    flattenSamplingTemplateOptions(samplingTemplates);
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  }
}

async function loadWorkflowReferenceOptions() {
  workflowReferenceOptions.value = await loadWorkflowReferenceOptionsSafely();
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
    ElMessage.warning('请先从待办任务中选择当前任务');
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
  selectedTask.value = row;
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
    ElMessage.warning('请先选择操作人');
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
    ElMessage.warning('请先选择待处理任务');
    return;
  }
  if (!completeForm.caseId.trim()) {
    ElMessage.warning('请先选择病例上下文');
    return;
  }
  if (!payload.operatorName) {
    ElMessage.warning('请先选择操作人');
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
    ElMessage.warning('请补齐标本编号和标本类型');
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
void loadSelectOptions();
void loadWorkflowReferenceOptions();
if (completeForm.caseId) {
  void loadTracking();
}

const currentTaskContext = computed(() => ({
  caseId: completeForm.caseId || selectedTask.value?.caseId || '',
  objectId: selectedTask.value?.objectId ?? '',
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
              <SystemUserSelect
                v-model="operatorForm.operatorUserId"
                :selected-label="operatorForm.operatorName"
                placeholder="请选择操作人"
                @change="handleOperatorChange"
              />
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
        description="优先从待办列表带入当前任务；带入后可加载病例追踪摘要并辅助生成标本明细。"
      >
        <ElDescriptions :column="3" border>
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

        <div class="mt-4 flex justify-end">
          <ElButton :loading="trackingLoading" type="primary" @click="loadTracking">
            加载病例追踪
          </ElButton>
        </div>

        <ElDescriptions v-if="trackingResult" :column="3" border class="mt-2">
          <ElDescriptionsItem label="病理号">
            {{ formatNullable(trackingResult.pathologyNo) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="病例状态">
            {{ formatCaseStatus(trackingResult.caseStatus) }}
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
                <ElFormItem label="标本编号" required>
                  <ElInput v-model="specimen.specimenId" disabled placeholder="由病例上下文带入" />
                </ElFormItem>
                <ElFormItem label="标本类型" required>
                  <ReferenceOptionSelect
                    v-model="specimen.specimenType"
                    :options="workflowReferenceOptions.specimenTypes"
                    placeholder="请选择或输入标本类型"
                  />
                </ElFormItem>
                <ElFormItem label="取材部位">
                  <ElSelect
                    v-model="specimen.bodyPartId"
                    clearable
                    filterable
                    placeholder="请选择取材部位"
                  >
                    <ElOption
                      v-for="option in bodyPartOptions"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </ElSelect>
                </ElFormItem>
                <ElFormItem label="取材模板">
                  <ElSelect
                    v-model="specimen.samplingTemplateId"
                    clearable
                    filterable
                    placeholder="请选择取材模板"
                  >
                    <ElOption
                      v-for="option in samplingTemplateOptions"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </ElSelect>
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
                  <ElInput v-model="asset.fileUrl" placeholder="附件地址" />
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
              placeholder="请输入病理号"
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
          <ElTableColumn label="任务号" min-width="180" prop="id" />
          <ElTableColumn label="病理号" min-width="140">
            <template #default="{ row }">
              {{ formatNullable(row.pathologyNo) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="任务状态" min-width="120">
            <template #default="{ row }">
              <ElTag :type="getTaskStatusTagType(row.taskStatus)">
                {{ formatTaskStatus(row.taskStatus) }}
              </ElTag>
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
          <ElTableColumn label="创建时间" min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.createdAt) }}
            </template>
          </ElTableColumn>
          <ElTableColumn fixed="right" label="操作" min-width="180">
            <template #default="{ row }">
              <div class="flex gap-2">
                <ElButton link type="primary" @click="startTask(row)">开始取材</ElButton>
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
