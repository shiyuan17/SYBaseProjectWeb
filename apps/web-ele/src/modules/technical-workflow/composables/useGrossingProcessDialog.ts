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
import type { WorkflowReferenceOptionsResponse } from '#/modules/system-management/types/workflow-reference';

import { computed, reactive, ref, watch } from 'vue';

import { useUserStore } from '@vben/stores';

import { ElMessage } from 'element-plus';

import {
  listBodyParts,
  listSamplingTemplates,
} from '#/modules/system-management/api/system-management-service';
import {
  createEmptyWorkflowReferenceOptions,
  loadWorkflowReferenceOptionsSafely,
} from '#/modules/system-management/api/workflow-reference-service';

import {
  completeGrossing,
  getTechnicalTracking,
  uploadGrossingMediaAsset,
} from '../api/technical-workflow-service';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  assignTechnicalOperatorForm,
  createTechnicalOperatorDefaults,
  normalizeTechnicalOperatorPayload,
} from '../utils/operator-form';

export interface SamplingTemplateTreeOption {
  children?: SamplingTemplateTreeOption[];
  disabled?: boolean;
  id: string;
  name: string;
}

export interface GrossingDialogProps {
  modelValue: boolean;
  task: null | PendingTechnicalTaskItem;
}

export interface GrossingDialogEmits {
  (event: 'submitted'): void;
  (event: 'update:modelValue', value: boolean): void;
}

export function useGrossingProcessDialog(
  props: GrossingDialogProps,
  emit: GrossingDialogEmits,
) {
  const userStore = useUserStore();

  const pageError = ref('');
  const submitting = ref(false);
  const trackingLoading = ref(false);
  const selectLoading = ref(false);
  const trackingResult = ref<null | TechnicalTrackingViewModel>(null);
  const bodyPartTreeOptions = ref<BodyPartNode[]>([]);
  const samplingTemplateTreeOptions = ref<SamplingTemplateTreeOption[]>([]);
  const workflowReferenceOptions = ref<WorkflowReferenceOptionsResponse>(
    createEmptyWorkflowReferenceOptions(),
  );
  const initialized = ref(false);
  const activeSpecimenKey = ref('');
  const uploadingSpecimenKeys = ref<string[]>([]);

  const grossingImageAccept = 'image/jpeg,image/png,image/webp,image/bmp';
  const grossingImageMaxSize = 20 * 1024 * 1024;
  const grossingImageTypes = new Set(grossingImageAccept.split(','));
  const labelClass = 'text-sm font-medium text-foreground';

  type GrossingUploadError = Parameters<UploadRequestOptions['onError']>[0];

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
  const specimenTabMetas = ref<Array<{ key: string; trackingLabel: string }>>(
    [],
  );

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
      trackingResult.value.specimens.map(
        (item) => item.specimenNo?.trim() || '',
      ),
    );
  }

  function mapSamplingTemplateTree(
    nodes: TemplateCategoryNode[],
  ): SamplingTemplateTreeOption[] {
    return nodes.map<SamplingTemplateTreeOption>((item) => ({
      children: [
        ...(item.children?.length
          ? mapSamplingTemplateTree(item.children)
          : []),
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
      const [bodyParts, samplingTemplates, referenceOptions] =
        await Promise.all([
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

    let nextActiveIndex = activeSpecimenIndex.value;
    if (activeSpecimenIndex.value === index) {
      nextActiveIndex = Math.max(
        0,
        Math.min(index, completeForm.specimens.length - 2),
      );
    } else if (activeSpecimenIndex.value > index) {
      nextActiveIndex = activeSpecimenIndex.value - 1;
    }

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
        completeForm.specimens[specimenIndex]?.mediaAssets?.push({
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
    if (!operatorForm.operatorName.trim()) {
      ElMessage.warning('请先确认当前登录人');
      return;
    }

    const normalizedSpecimens = completeForm.specimens.map((item) => ({
      blocks: item.blocks.map((block) => ({
        blockDescription: block.blockDescription?.trim() || null,
        blockSite: block.blockSite?.trim() || null,
        specialRequirement: block.specialRequirement?.trim() || null,
      })),
      blockCount: Math.max(item.blockCount ?? 0, item.blocks.length),
      bodyPartId: item.bodyPartId?.trim() || null,
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

  return {
    activeSpecimenKey,
    beforeGrossingImageUpload,
    bodyPartTreeOptions,
    completeForm,
    createGrossingImageUploadRequest,
    currentTaskContext,
    dialogVisible,
    getSpecimenTabLabel,
    isSpecimenUploading,
    labelClass,
    loadTracking,
    operatorForm,
    pageError,
    removeBlock,
    removeMediaAsset,
    removeSpecimen,
    resetDialogState,
    samplingTemplateTreeOptions,
    selectLoading,
    specimenTabMetas,
    submitGrossing,
    submitting,
    trackingLoading,
    trackingResult,
    workflowReferenceOptions,
    grossingImageAccept,
    addBlock,
    addMediaAsset,
    addSpecimen,
  };
}
