<script setup lang="ts">
import type { UploadProps, UploadRequestOptions } from 'element-plus';

import type {
  GrossingBlockItemRequest,
  GrossingSpecimenItemRequest,
  MediaAssetItem,
  PendingTechnicalTaskItem,
  TechnicalOperatorFormValue,
  TechnicalTrackingView as TechnicalTrackingViewModel,
} from '../types/technical-workflow';

import type {
  BodyPartNode,
  TemplateCategoryNode,
} from '#/modules/system-management/types/system-management';

import { computed, reactive, ref, watch } from 'vue';

import { useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElForm,
  ElInput,
  ElInputNumber,
  ElLink,
  ElMessage,
  ElTabPane,
  ElTabs,
  ElTreeSelect,
  ElUpload,
} from 'element-plus';

import {
  listBodyParts,
  listSamplingTemplates,
} from '#/modules/system-management/api/system-management-service';
import {
  createEmptyWorkflowReferenceOptions,
  loadWorkflowReferenceOptionsSafely,
} from '#/modules/system-management/api/workflow-reference-service';
import ReferenceOptionSelect from '#/modules/system-management/components/ReferenceOptionSelect.vue';

import {
  completeGrossing,
  getTechnicalTracking,
  uploadGrossingMediaAsset,
} from '../api/technical-workflow-service';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  formatCaseStatus,
  formatNullable,
  formatObjectType,
} from '../utils/format';
import {
  assignTechnicalOperatorForm,
  createTechnicalOperatorDefaults,
  normalizeTechnicalOperatorPayload,
} from '../utils/operator-form';
import TechnicalOperatorFields from './TechnicalOperatorFields.vue';

const props = defineProps<{
  modelValue: boolean;
  task: null | PendingTechnicalTaskItem;
}>();

const emit = defineEmits<{
  submitted: [];
  'update:modelValue': [value: boolean];
}>();

const userStore = useUserStore();

const pageError = ref('');
const submitting = ref(false);
const trackingLoading = ref(false);
const selectLoading = ref(false);
const trackingResult = ref<null | TechnicalTrackingViewModel>(null);
const bodyPartTreeOptions = ref<BodyPartNode[]>([]);
const samplingTemplateTreeOptions = ref<SamplingTemplateTreeOption[]>([]);
const workflowReferenceOptions = ref(createEmptyWorkflowReferenceOptions());
const initialized = ref(false);
const activeSpecimenKey = ref('');
const uploadingSpecimenKeys = ref<string[]>([]);

const grossingImageAccept = 'image/jpeg,image/png,image/webp,image/bmp';
const grossingImageMaxSize = 20 * 1024 * 1024;
const grossingImageTypes = new Set(grossingImageAccept.split(','));

type GrossingUploadError = Parameters<UploadRequestOptions['onError']>[0];

interface SamplingTemplateTreeOption {
  children?: SamplingTemplateTreeOption[];
  disabled?: boolean;
  id: string;
  name: string;
}

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const operatorForm = reactive<TechnicalOperatorFormValue>(
  createTechnicalOperatorDefaults(userStore.userInfo ?? undefined),
);

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
    blockCount: 1,
    bodyPartId: '',
    cutSurfaceFeature: '',
    grossDescription: '',
    marginMarking: '',
    mediaAssets: [],
    samplingTemplateId: '',
    sizeText: '',
    specimenId: '',
    specimenType: 'ROUTINE',
  };
}

const completeForm = reactive({
  caseId: '',
  specimens: [createEmptySpecimen()],
  taskId: '',
});
const specimenTabMetas = ref<Array<{ key: string; trackingLabel: string }>>([]);

const currentTaskContext = computed(() => ({
  caseId: completeForm.caseId || props.task?.caseId || '',
  objectId: props.task?.objectId ?? '',
  objectType: props.task?.objectType ?? '',
  pathologyNo: props.task?.pathologyNo ?? '',
  taskId: completeForm.taskId || props.task?.id || '',
}));
const activeSpecimenIndex = computed(() =>
  specimenTabMetas.value.findIndex(
    (item) => item.key === activeSpecimenKey.value,
  ),
);

function createSpecimenTabMeta(trackingLabel = '') {
  return {
    key: `specimen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    trackingLabel,
  };
}

function activateSpecimenAt(index: number) {
  activeSpecimenKey.value = specimenTabMetas.value[index]?.key ?? '';
}

function syncSpecimenTabs(
  specimens: GrossingSpecimenItemRequest[],
  trackingLabels: string[] = [],
) {
  completeForm.specimens = specimens;
  specimenTabMetas.value = specimens.map((_, index) =>
    createSpecimenTabMeta(trackingLabels[index] ?? ''),
  );
  activateSpecimenAt(0);
}

function getSpecimenTrackingLabel(index: number) {
  return specimenTabMetas.value[index]?.trackingLabel?.trim() ?? '';
}

function getSpecimenTabLabel(index: number) {
  const trackingLabel = getSpecimenTrackingLabel(index);
  if (trackingLabel) {
    return trackingLabel;
  }
  const specimenId = completeForm.specimens[index]?.specimenId?.trim();
  return specimenId || `标本 ${index + 1}`;
}

function resetDialogState() {
  pageError.value = '';
  trackingResult.value = null;
  assignTechnicalOperatorForm(operatorForm, userStore.userInfo ?? undefined);
  completeForm.caseId = props.task?.caseId ?? '';
  completeForm.taskId = props.task?.id ?? '';
  syncSpecimenTabs([createEmptySpecimen()]);
}

function seedSpecimensFromTracking() {
  if (!trackingResult.value || trackingResult.value.specimens.length === 0) {
    syncSpecimenTabs([createEmptySpecimen()]);
    return;
  }

  syncSpecimenTabs(
    trackingResult.value.specimens.map((item) => ({
      blocks: [createEmptyBlock()],
      blockCount: 1,
      bodyPartId: '',
      cutSurfaceFeature: '',
      grossDescription: '',
      marginMarking: '',
      mediaAssets: [],
      samplingTemplateId: '',
      sizeText: '',
      specimenId: item.specimenId,
      specimenType: 'ROUTINE',
    })),
    trackingResult.value.specimens.map((item) => item.specimenNo?.trim() || ''),
  );
}

function mapSamplingTemplateTree(
  nodes: TemplateCategoryNode[],
): SamplingTemplateTreeOption[] {
  return nodes.map<SamplingTemplateTreeOption>((item) => ({
    children: [
      ...(item.children?.length ? mapSamplingTemplateTree(item.children) : []),
      ...(item.templates?.map((template) => ({
        id: template.id,
        name: template.templateName,
      })) ?? []),
    ],
    disabled: true,
    id: item.id,
    name: item.categoryName,
  }));
}

async function ensureSelectOptionsLoaded() {
  if (initialized.value) {
    return;
  }

  selectLoading.value = true;
  pageError.value = '';
  try {
    const [bodyParts, samplingTemplates, referenceOptions] = await Promise.all([
      listBodyParts(),
      listSamplingTemplates(),
      loadWorkflowReferenceOptionsSafely(),
    ]);
    bodyPartTreeOptions.value = bodyParts;
    samplingTemplateTreeOptions.value =
      mapSamplingTemplateTree(samplingTemplates);
    workflowReferenceOptions.value = referenceOptions;
    initialized.value = true;
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    selectLoading.value = false;
  }
}

async function loadTracking() {
  const caseId = completeForm.caseId.trim();
  if (!caseId) {
    ElMessage.warning('当前任务缺少病例编号');
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

function addSpecimen() {
  completeForm.specimens.push(createEmptySpecimen());
  specimenTabMetas.value.push(createSpecimenTabMeta());
  activateSpecimenAt(completeForm.specimens.length - 1);
}

function removeSpecimen(index: number) {
  if (completeForm.specimens.length === 1) {
    ElMessage.warning('至少保留一条标本明细');
    return;
  }

  const nextActiveIndex =
    activeSpecimenIndex.value === index
      ? Math.max(0, Math.min(index, completeForm.specimens.length - 2))
      : activeSpecimenIndex.value > index
        ? activeSpecimenIndex.value - 1
        : activeSpecimenIndex.value;

  completeForm.specimens.splice(index, 1);
  specimenTabMetas.value.splice(index, 1);
  activateSpecimenAt(nextActiveIndex);
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
  completeForm.specimens[specimenIndex]?.mediaAssets?.push(
    createEmptyMediaAsset(),
  );
}

function removeMediaAsset(specimenIndex: number, assetIndex: number) {
  completeForm.specimens[specimenIndex]?.mediaAssets?.splice(assetIndex, 1);
}

function getSpecimenUploadKey(specimenIndex: number) {
  return (
    specimenTabMetas.value[specimenIndex]?.key ?? `specimen-${specimenIndex}`
  );
}

function isSpecimenUploading(specimenIndex: number) {
  return uploadingSpecimenKeys.value.includes(
    getSpecimenUploadKey(specimenIndex),
  );
}

function setSpecimenUploading(specimenIndex: number, uploading: boolean) {
  const key = getSpecimenUploadKey(specimenIndex);
  uploadingSpecimenKeys.value = uploading
    ? [...new Set([...uploadingSpecimenKeys.value, key])]
    : uploadingSpecimenKeys.value.filter((item) => item !== key);
}

const beforeGrossingImageUpload: UploadProps['beforeUpload'] = (file) => {
  if (!grossingImageTypes.has(file.type)) {
    ElMessage.warning('仅支持 JPG、PNG、WEBP、BMP 格式的标本摄影像');
    return false;
  }
  if (file.size > grossingImageMaxSize) {
    ElMessage.warning('单张标本摄影像不能超过 20MB');
    return false;
  }
  return true;
};

function createGrossingUploadError(
  error: unknown,
  options: UploadRequestOptions,
): GrossingUploadError {
  const uploadError = (
    error instanceof Error
      ? error
      : new Error(getWorkflowPageErrorMessage(error))
  ) as GrossingUploadError;
  uploadError.status = 0;
  uploadError.method = options.method;
  uploadError.url = options.action;
  return uploadError;
}

function createGrossingImageUploadRequest(specimenIndex: number) {
  return async (options: UploadRequestOptions) => {
    setSpecimenUploading(specimenIndex, true);
    try {
      const result = await uploadGrossingMediaAsset(options.file);
      const mediaAssets = completeForm.specimens[specimenIndex]?.mediaAssets;
      mediaAssets?.push({
        fileName: result.fileName,
        fileUrl: result.fileUrl,
      });
      options.onSuccess(result);
      ElMessage.success('标本摄影像上传成功');
    } catch (error) {
      options.onError(createGrossingUploadError(error, options));
      ElMessage.warning(getWorkflowPageErrorMessage(error));
    } finally {
      setSpecimenUploading(specimenIndex, false);
    }
  };
}

async function submitGrossing() {
  const payload = normalizeTechnicalOperatorPayload(operatorForm);
  if (!completeForm.taskId.trim()) {
    ElMessage.warning('当前缺少待处理任务');
    return;
  }
  if (!completeForm.caseId.trim()) {
    ElMessage.warning('当前缺少病例编号');
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
    blockCount: Math.max(item.blockCount ?? 0, item.blocks.length),
    cutSurfaceFeature: item.cutSurfaceFeature?.trim() || null,
    grossDescription: item.grossDescription?.trim() || null,
    marginMarking: item.marginMarking?.trim() || null,
    mediaAssets:
      item.mediaAssets
        ?.filter((asset) => asset.fileUrl.trim())
        .map((asset) => ({
          fileName: asset.fileName?.trim() || null,
          fileUrl: asset.fileUrl.trim(),
        })) ?? [],
    samplingTemplateId: item.samplingTemplateId?.trim() || null,
    sizeText: item.sizeText?.trim() || null,
    specimenId: item.specimenId.trim(),
    specimenType: item.specimenType.trim(),
  }));

  if (
    normalizedSpecimens.some((item) => !item.specimenId || !item.specimenType)
  ) {
    ElMessage.warning('请补齐标本编号和标本类型');
    return;
  }
  if (
    normalizedSpecimens.some((item) =>
      item.blocks.every(
        (block) =>
          !block.blockDescription &&
          !block.blockSite &&
          !block.specialRequirement,
      ),
    )
  ) {
    ElMessage.warning('每个标本至少需要一条有效的蜡块明细');
    return;
  }

  submitting.value = true;
  pageError.value = '';
  try {
    const result = await completeGrossing({
      ...payload,
      caseId: completeForm.caseId.trim(),
      specimens: normalizedSpecimens,
      taskId: completeForm.taskId.trim(),
    });
    ElMessage.success(
      `取材完成，已生成 ${result.createdDehydrationTaskCount} 条脱水任务`,
    );
    emit('submitted');
    dialogVisible.value = false;
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    submitting.value = false;
  }
}

watch(
  () => props.modelValue,
  async (visible) => {
    if (!visible) {
      return;
    }
    resetDialogState();
    await ensureSelectOptionsLoaded();
    if (completeForm.caseId) {
      await loadTracking();
    }
  },
);
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    :close-on-click-modal="false"
    destroy-on-close
    title="取材处理"
    width="1200px"
    @closed="resetDialogState"
  >
    <div class="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
        show-icon
      />

      <ElDescriptions :column="3" border>
        <ElDescriptionsItem label="任务号">
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

      <ElForm label-width="96px">
        <TechnicalOperatorFields
          :form="operatorForm"
          remarks-placeholder="必要时补充取材说明"
          terminal-placeholder="取材终端编码"
        />
      </ElForm>

      <div class="flex items-center justify-between">
        <div class="text-sm text-[var(--el-text-color-secondary)]">
          优先从病例追踪带入标本，弹窗内仅保留当前处理所需的信息。
        </div>
        <ElButton
          :loading="trackingLoading || selectLoading"
          @click="loadTracking"
        >
          加载病例追踪
        </ElButton>
      </div>

      <ElDescriptions v-if="trackingResult" :column="3" border>
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

      <div class="flex items-center justify-between">
        <div>
          <h4 class="text-sm font-semibold text-foreground">标本明细</h4>
          <p class="mt-1 text-xs text-[var(--el-text-color-secondary)]">
            支持录入标本、蜡块和标本摄影像。
          </p>
        </div>
        <ElButton @click="addSpecimen">新增标本</ElButton>
      </div>

      <ElTabs v-model="activeSpecimenKey" class="grossing-specimen-tabs">
        <ElTabPane
          v-for="(specimen, specimenIndex) in completeForm.specimens"
          :key="specimenTabMetas[specimenIndex]?.key"
          :label="getSpecimenTabLabel(specimenIndex)"
          :name="specimenTabMetas[specimenIndex]?.key"
        >
          <section class="rounded-lg border border-dashed border-border p-4">
            <div class="mb-4">
              <div>
                <h4 class="text-sm font-semibold text-foreground">
                  {{ getSpecimenTabLabel(specimenIndex) }}
                </h4>
                <p class="mt-1 text-xs text-[var(--el-text-color-secondary)]">
                  当前仅编辑该标本对应的取材、蜡块和影像信息。
                </p>
              </div>
            </div>

            <div class="overflow-x-auto rounded-lg border border-border">
              <div class="min-w-[1340px]">
                <div
                  class="hidden grid-cols-[210px_160px_220px_220px_minmax(300px,1fr)_140px] gap-3 border-b border-border bg-muted/30 px-4 py-3 text-sm font-medium text-muted-foreground lg:grid"
                >
                  <span>标本编号</span>
                  <span>标本类型</span>
                  <span>取材部位</span>
                  <span>取材模板</span>
                  <span>大体描写</span>
                  <span class="text-right">操作</span>
                </div>
                <div class="px-4 py-3">
                  <div
                    class="grid gap-3 lg:grid-cols-[210px_160px_220px_220px_minmax(300px,1fr)_140px] lg:items-start"
                  >
                    <ElInput
                      v-model="specimen.specimenId"
                      placeholder="优先由病例追踪带入，也可手工录入"
                    />
                    <ReferenceOptionSelect
                      v-model="specimen.specimenType"
                      :options="workflowReferenceOptions.specimenTypes"
                      placeholder="请选择或输入标本类型"
                    />
                    <ElTreeSelect
                      v-model="specimen.bodyPartId"
                      :data="bodyPartTreeOptions"
                      :props="{ children: 'children', label: 'partName' }"
                      clearable
                      filterable
                      node-key="id"
                      placeholder="请选择取材部位"
                      :render-after-expand="false"
                      value-key="id"
                      check-strictly
                    />
                    <ElTreeSelect
                      v-model="specimen.samplingTemplateId"
                      :data="samplingTemplateTreeOptions"
                      :props="{
                        children: 'children',
                        disabled: 'disabled',
                        label: 'name',
                      }"
                      clearable
                      filterable
                      node-key="id"
                      placeholder="请选择取材模板"
                      :render-after-expand="false"
                      value-key="id"
                      check-strictly
                    />
                    <ElInput
                      v-model="specimen.grossDescription"
                      :rows="3"
                      class="min-w-[300px] w-full"
                      placeholder="请输入大体描写"
                      type="textarea"
                    />
                    <div class="flex flex-wrap items-start justify-end gap-2">
                      <ElButton
                        link
                        type="primary"
                        @click="addMediaAsset(specimenIndex)"
                      >
                        手工补充影像
                      </ElButton>
                      <ElButton
                        link
                        type="danger"
                        @click="removeSpecimen(specimenIndex)"
                      >
                        删除标本
                      </ElButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-4 rounded-lg border border-border p-4">
              <div class="mb-3 flex items-center justify-between">
                <h5 class="text-sm font-medium text-foreground">
                  标本影像与取材要素
                </h5>
                <span class="text-xs text-[var(--el-text-color-secondary)]">
                  影像可通过下方上传区关联到当前标本。
                </span>
              </div>
              <div
                class="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]"
              >
                <ReferenceOptionSelect
                  v-model="specimen.sizeText"
                  :options="workflowReferenceOptions.specimenImageSizes"
                  placeholder="大小，如 3.2x2.1x1.0cm"
                />
                <ReferenceOptionSelect
                  v-model="specimen.cutSurfaceFeature"
                  :options="workflowReferenceOptions.cutSurfaceFeatures"
                  placeholder="切面特征，如灰白、质硬、坏死"
                />
                <ReferenceOptionSelect
                  v-model="specimen.marginMarking"
                  :options="workflowReferenceOptions.marginMarkings"
                  placeholder="切缘标记，如上缘墨染"
                />
                <ElInputNumber
                  v-model="specimen.blockCount"
                  :min="1"
                  :step="1"
                  controls-position="right"
                  placeholder="取材块数"
                  class="w-full"
                />
              </div>
            </div>

            <div class="mb-2 mt-4 flex items-center justify-between">
              <h5 class="text-sm font-medium text-foreground">蜡块明细</h5>
              <span class="text-xs text-[var(--el-text-color-secondary)]">
                每个标本至少保留一个蜡块明细。
              </span>
            </div>
            <div class="overflow-x-auto rounded-lg border border-border">
              <div class="min-w-[880px]">
                <div
                  class="hidden grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_180px] items-center gap-3 border-b border-border bg-muted/30 px-4 py-3 text-sm font-medium text-muted-foreground md:grid"
                >
                  <span>序号</span>
                  <span>蜡块部位</span>
                  <span>蜡块描述</span>
                  <span>特殊要求</span>
                  <span class="text-right">操作</span>
                </div>
                <div class="flex flex-col">
                  <section
                    v-for="(block, blockIndex) in specimen.blocks"
                    :key="blockIndex"
                    class="border-b border-border px-4 py-3 last:border-b-0"
                  >
                    <div
                      class="grid gap-3 md:grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_180px] md:items-center"
                    >
                      <div class="text-sm font-medium text-foreground">
                        蜡块 {{ blockIndex + 1 }}
                      </div>
                      <ElInput
                        v-model="block.blockSite"
                        placeholder="蜡块部位"
                      />
                      <ElInput
                        v-model="block.blockDescription"
                        placeholder="蜡块描述"
                      />
                      <ElInput
                        v-model="block.specialRequirement"
                        placeholder="特殊要求"
                      />
                      <div
                        class="flex flex-wrap items-center justify-end gap-2"
                      >
                        <ElButton
                          link
                          type="primary"
                          @click="addBlock(specimenIndex)"
                        >
                          新增蜡块
                        </ElButton>
                        <ElButton
                          link
                          type="danger"
                          @click="removeBlock(specimenIndex, blockIndex)"
                        >
                          删除蜡块
                        </ElButton>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>

            <div class="mb-2 mt-4 flex items-center justify-between">
              <div>
                <h5 class="text-sm font-medium text-foreground">标本摄影像</h5>
                <span class="text-xs text-[var(--el-text-color-secondary)]">
                  上传后自动关联到当前标本，也可手工补充影像地址。
                </span>
              </div>
              <ElUpload
                :accept="grossingImageAccept"
                :before-upload="beforeGrossingImageUpload"
                :http-request="createGrossingImageUploadRequest(specimenIndex)"
                :show-file-list="false"
                :disabled="isSpecimenUploading(specimenIndex)"
              >
                <ElButton
                  :loading="isSpecimenUploading(specimenIndex)"
                  type="primary"
                >
                  上传影像
                </ElButton>
              </ElUpload>
            </div>
            <div
              v-if="specimen.mediaAssets?.length"
              class="flex flex-col gap-3"
            >
              <section
                v-for="(asset, assetIndex) in specimen.mediaAssets"
                :key="assetIndex"
                class="rounded border border-border p-3"
              >
                <div class="mb-3 flex items-center justify-between gap-3">
                  <span class="text-sm font-medium text-foreground"
                    >影像 {{ assetIndex + 1 }}</span
                  >
                  <ElButton
                    link
                    type="danger"
                    @click="removeMediaAsset(specimenIndex, assetIndex)"
                  >
                    删除影像
                  </ElButton>
                </div>
                <div class="grid gap-4 md:grid-cols-2">
                  <ElInput v-model="asset.fileUrl" placeholder="影像地址" />
                  <ElInput v-model="asset.fileName" placeholder="影像名称" />
                </div>
                <ElLink
                  v-if="asset.fileUrl"
                  :href="asset.fileUrl"
                  class="mt-3"
                  target="_blank"
                  type="primary"
                >
                  查看影像
                </ElLink>
              </section>
            </div>
          </section>
        </ElTabPane>
      </ElTabs>
    </div>

    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton :loading="submitting" type="primary" @click="submitGrossing">
        完成取材
      </ElButton>
    </template>
  </ElDialog>
</template>
