import type { UploadProps, UploadRequestOptions } from 'element-plus';

import type {
  GrossingBlockItemRequest,
  GrossingEmbeddingBoxItemRequest,
  GrossingSpecimenItemRequest,
  GrossingWorkbenchContext,
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

import { computed, reactive, ref } from 'vue';

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
  getGrossingWorkbenchContext,
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

export type GrossingDescriptionTab =
  | 'clinicalHistory'
  | 'grossDescription'
  | 'relatedExaminations';

interface UseGrossingWorkbenchOptions {
  onSubmitted?: () => void | Promise<void>;
}

export function useGrossingWorkbench(
  options: UseGrossingWorkbenchOptions = {},
) {
  const userStore = useUserStore();

  const pageError = ref('');
  const submitting = ref(false);
  const contextLoading = ref(false);
  const selectLoading = ref(false);
  const initialized = ref(false);
  const currentTask = ref<null | PendingTechnicalTaskItem>(null);
  const workbenchContext = ref<null | GrossingWorkbenchContext>(null);
  const trackingResult = ref<null | TechnicalTrackingViewModel>(null);
  const activeSpecimenKey = ref('');
  const descriptionTab = ref<GrossingDescriptionTab>('grossDescription');
  const uploadingSpecimenKeys = ref<string[]>([]);
  const bodyPartTreeOptions = ref<BodyPartNode[]>([]);
  const samplingTemplateTreeOptions = ref<SamplingTemplateTreeOption[]>([]);
  const workflowReferenceOptions = ref<WorkflowReferenceOptionsResponse>(
    createEmptyWorkflowReferenceOptions(),
  );

  const grossingImageAccept = 'image/jpeg,image/png,image/webp,image/bmp';
  const grossingImageMaxSize = 20 * 1024 * 1024;
  const grossingImageTypes = new Set(grossingImageAccept.split(','));
  const labelClass = 'text-sm font-medium text-foreground';

  type GrossingUploadError = Parameters<UploadRequestOptions['onError']>[0];

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

  function createEmbeddingBox(
    sequenceNo: number,
    embeddingBoxNo = `A${sequenceNo}`,
  ): GrossingEmbeddingBoxItemRequest {
    return {
      boxName: `包埋盒 ${sequenceNo}`,
      embeddingBoxNo,
      embeddingRemarks: '',
      sequenceNo,
      status: 'PENDING',
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
      embeddingBoxes: [createEmbeddingBox(1)],
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
    caseId: completeForm.caseId || currentTask.value?.caseId || '',
    objectId:
      workbenchContext.value?.task.objectId ?? currentTask.value?.objectId ?? '',
    objectType:
      workbenchContext.value?.task.objectType ??
      currentTask.value?.objectType ??
      '',
    pathologyNo:
      workbenchContext.value?.caseSummary.pathologyNo ??
      currentTask.value?.pathologyNo ??
      '',
    taskId: completeForm.taskId || currentTask.value?.id || '',
  }));

  const activeSpecimenIndex = computed(() =>
    specimenTabMetas.value.findIndex(
      (item) => item.key === activeSpecimenKey.value,
    ),
  );

  const activeSpecimen = computed(
    () => completeForm.specimens[activeSpecimenIndex.value] ?? null,
  );

  const enteredMediaAssets = computed(() =>
    completeForm.specimens.flatMap((specimen, specimenIndex) =>
      (specimen.mediaAssets ?? []).map((asset, assetIndex) => ({
        ...asset,
        assetIndex,
        specimenId: specimen.specimenId || getSpecimenTabLabel(specimenIndex),
        specimenIndex,
      })),
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

  function resetWorkbenchState(task: null | PendingTechnicalTaskItem = null) {
    currentTask.value = task;
    workbenchContext.value = null;
    trackingResult.value = null;
    pageError.value = '';
    descriptionTab.value = 'grossDescription';
    assignTechnicalOperatorForm(operatorForm, userStore.userInfo ?? undefined);
    completeForm.caseId = task?.caseId ?? '';
    completeForm.taskId = task?.id ?? '';
    syncSpecimenTabs([createEmptySpecimen()]);
  }

  function seedSpecimensFromTracking(tracking: null | TechnicalTrackingViewModel) {
    if (!tracking || tracking.specimens.length === 0) {
      syncSpecimenTabs([createEmptySpecimen()]);
      return;
    }

    syncSpecimenTabs(
      tracking.specimens.map((item) => {
        const specimenBlocks = tracking.blocks.filter(
          (block) => block.specimenId === item.specimenId,
        );
        const blockCount = Math.max(specimenBlocks.length, 1);
        return {
          blocks: Array.from({ length: blockCount }, (_, index) => ({
            ...createEmptyBlock(),
            blockDescription: specimenBlocks[index]?.description ?? '',
          })),
          blockCount,
          bodyPartId: '',
          cutSurfaceFeature: '',
          embeddingBoxes: Array.from({ length: blockCount }, (_, index) =>
            createEmbeddingBox(
              index + 1,
              specimenBlocks[index]?.embeddingBoxNo?.trim() || `A${index + 1}`,
            ),
          ),
          grossDescription: '',
          marginMarking: '',
          mediaAssets: [],
          samplingTemplateId: '',
          sizeText: '',
          specimenId: item.specimenId,
          specimenType: 'ROUTINE',
        };
      }),
      tracking.specimens.map((item) => item.specimenNo?.trim() || ''),
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

  async function loadWorkbenchContext() {
    const taskId = completeForm.taskId.trim();
    if (!taskId) {
      ElMessage.warning('当前缺少待处理任务');
      return;
    }

    contextLoading.value = true;
    pageError.value = '';
    try {
      const result = await getGrossingWorkbenchContext(taskId);
      workbenchContext.value = result;
      trackingResult.value = result.tracking;
      seedSpecimensFromTracking(result.tracking);
    } catch (error) {
      workbenchContext.value = null;
      trackingResult.value = null;
      pageError.value = getWorkflowPageErrorMessage(error);
    } finally {
      contextLoading.value = false;
    }
  }

  async function initializeWorkbench(task: null | PendingTechnicalTaskItem) {
    resetWorkbenchState(task);
    if (!task) {
      return;
    }
    await ensureSelectOptionsLoaded();
    await loadWorkbenchContext();
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
    const specimen = completeForm.specimens[specimenIndex];
    if (!specimen) {
      return;
    }
    specimen.blocks.push(createEmptyBlock());
    specimen.embeddingBoxes ??= [];
    specimen.embeddingBoxes.push(
      createEmbeddingBox(
        specimen.embeddingBoxes.length + 1,
        getNextEmbeddingBoxNo(specimen),
      ),
    );
    specimen.blockCount = Math.max(
      specimen.blockCount ?? 0,
      specimen.blocks.length,
    );
  }

  function removeBlock(specimenIndex: number, blockIndex: number) {
    const specimen = completeForm.specimens[specimenIndex];
    const blocks = specimen?.blocks;
    if (!specimen || !blocks) {
      return;
    }
    if (blocks.length === 1) {
      ElMessage.warning('每个标本至少保留一个蜡块明细');
      return;
    }
    blocks.splice(blockIndex, 1);
    specimen.embeddingBoxes?.splice(blockIndex, 1);
    resequenceEmbeddingBoxes(specimen.embeddingBoxes);
    specimen.blockCount = Math.max(
      specimen.blockCount ?? 0,
      specimen.blocks.length,
    );
  }

  function getNextEmbeddingBoxNo(specimen: GrossingSpecimenItemRequest) {
    const maxSequence = (specimen.embeddingBoxes ?? []).reduce((max, box) => {
      const match = box.embeddingBoxNo.trim().match(/^A(\d+)$/i);
      if (!match) {
        return max;
      }
      return Math.max(max, Number(match[1]));
    }, 0);
    return `A${maxSequence + 1}`;
  }

  function resequenceEmbeddingBoxes(
    embeddingBoxes: GrossingEmbeddingBoxItemRequest[] | undefined,
  ) {
    embeddingBoxes?.forEach((box, index) => {
      box.sequenceNo = index + 1;
      box.boxName ||= `包埋盒 ${index + 1}`;
    });
  }

  function addEmbeddingBoxes(count: number) {
    const specimen = activeSpecimen.value;
    if (!specimen) {
      ElMessage.warning('请先选择可编辑标本');
      return;
    }
    specimen.embeddingBoxes ??= [];
    for (let index = 0; index < count; index++) {
      const nextSequenceNo = specimen.embeddingBoxes.length + 1;
      specimen.embeddingBoxes.push(
        createEmbeddingBox(nextSequenceNo, getNextEmbeddingBoxNo(specimen)),
      );
      specimen.blocks.push(createEmptyBlock());
    }
    specimen.blockCount = Math.max(
      specimen.blockCount ?? 0,
      specimen.blocks.length,
    );
  }

  function removeEmbeddingBox(index: number) {
    const specimen = activeSpecimen.value;
    if (!specimen?.embeddingBoxes) {
      return;
    }
    if (specimen.embeddingBoxes.length === 1) {
      ElMessage.warning('至少保留一个包埋盒');
      return;
    }
    specimen.embeddingBoxes.splice(index, 1);
    if (specimen.blocks.length > 1) {
      specimen.blocks.splice(index, 1);
    }
    resequenceEmbeddingBoxes(specimen.embeddingBoxes);
    specimen.blockCount = Math.max(
      specimen.blockCount ?? 0,
      specimen.blocks.length,
    );
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
    uploadOptions: UploadRequestOptions,
  ): GrossingUploadError {
    const uploadError = (
      error instanceof Error
        ? error
        : new Error(getWorkflowPageErrorMessage(error))
    ) as GrossingUploadError;
    uploadError.status = 0;
    uploadError.method = uploadOptions.method;
    uploadError.url = uploadOptions.action;
    return uploadError;
  }

  function createGrossingImageUploadRequest(specimenIndex: number) {
    return async (uploadOptions: UploadRequestOptions) => {
      setSpecimenUploading(specimenIndex, true);
      try {
        const result = await uploadGrossingMediaAsset(uploadOptions.file);
        completeForm.specimens[specimenIndex]?.mediaAssets?.push({
          fileName: result.fileName,
          fileUrl: result.fileUrl,
        });
        uploadOptions.onSuccess(result);
        ElMessage.success('标本摄影像上传成功');
      } catch (error) {
        uploadOptions.onError(createGrossingUploadError(error, uploadOptions));
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

    const normalizedSpecimens = completeForm.specimens.map((item) => {
      const normalizedEmbeddingBoxes =
        item.embeddingBoxes?.map((box, index) => ({
          boxName: box.boxName?.trim() || null,
          embeddingBoxNo: box.embeddingBoxNo.trim(),
          embeddingRemarks: box.embeddingRemarks?.trim() || null,
          sequenceNo: index + 1,
          status: 'CONFIRMED' as const,
        })) ?? [];

      return {
        blocks: item.blocks.map((block) => ({
          blockDescription: block.blockDescription?.trim() || null,
          blockSite: block.blockSite?.trim() || null,
          specialRequirement: block.specialRequirement?.trim() || null,
        })),
        blockCount: Math.max(item.blockCount ?? 0, item.blocks.length),
        bodyPartId: item.bodyPartId?.trim() || null,
        cutSurfaceFeature: item.cutSurfaceFeature?.trim() || null,
        embeddingBoxes: normalizedEmbeddingBoxes,
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
      };
    });

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
    if (
      normalizedSpecimens.some(
        (item) =>
          item.embeddingBoxes.length === 0 ||
          item.embeddingBoxes.length !== item.blocks.length ||
          item.embeddingBoxes.some((box) => !box.embeddingBoxNo),
      )
    ) {
      ElMessage.warning('请补齐包埋盒信息，并保持包埋盒数量与蜡块数量一致');
      return;
    }
    const embeddingBoxNos = normalizedSpecimens.flatMap((item) =>
      item.embeddingBoxes.map((box) => box.embeddingBoxNo),
    );
    if (new Set(embeddingBoxNos).size !== embeddingBoxNos.length) {
      ElMessage.warning('包埋盒号不能重复');
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
      await options.onSubmitted?.();
    } catch (error) {
      pageError.value = getWorkflowPageErrorMessage(error);
    } finally {
      submitting.value = false;
    }
  }

  return {
    activeSpecimen,
    activeSpecimenKey,
    addBlock,
    addEmbeddingBoxes,
    addMediaAsset,
    addSpecimen,
    beforeGrossingImageUpload,
    bodyPartTreeOptions,
    completeForm,
    contextLoading,
    createGrossingImageUploadRequest,
    currentTask,
    currentTaskContext,
    descriptionTab,
    ensureSelectOptionsLoaded,
    enteredMediaAssets,
    getSpecimenTabLabel,
    grossingImageAccept,
    initializeWorkbench,
    isSpecimenUploading,
    labelClass,
    loadWorkbenchContext,
    operatorForm,
    pageError,
    removeBlock,
    removeEmbeddingBox,
    removeMediaAsset,
    removeSpecimen,
    resetWorkbenchState,
    samplingTemplateTreeOptions,
    selectLoading,
    specimenTabMetas,
    submitGrossing,
    submitting,
    trackingResult,
    workflowReferenceOptions,
    workbenchContext,
  };
}
