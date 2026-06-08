import type { UploadProps, UploadRequestOptions } from 'element-plus';

import type {
  GrossingBlockItemRequest,
  GrossingEmbeddingBoxItemRequest,
  GrossingMediaAssetUploadResponse,
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
  onSubmitted?: () => Promise<void> | void;
}

type GrossingEmbeddingBoxPrefix = string;
const GENERATED_EMBEDDING_BOX_NO_PREFIX = 'BX';
const GENERATED_EMBEDDING_BOX_NO_SCOPE_FALLBACK = 'CASE';
const MAX_EMBEDDING_BOX_NO_LENGTH = 64;

interface GrossingSpecimenTabMeta {
  key: string;
  specimenName: string;
  trackingLabel: string;
}

export interface GrossingEmbeddingBoxTableRow {
  box: GrossingEmbeddingBoxItemRequest;
  boxIndex: number;
  specimenIndex: number;
  specimenName: string;
}

function createSpecimenPrefix(index: number) {
  let current = Math.max(index, 0);
  let prefix = '';
  do {
    prefix = String.fromCodePoint(65 + (current % 26)) + prefix;
    current = Math.floor(current / 26) - 1;
  } while (current >= 0);
  return prefix;
}

function getEmbeddingBoxPrefixRank(prefix: string) {
  const normalizedPrefix = prefix.trim().toUpperCase();
  let rank = 0;
  for (const character of normalizedPrefix) {
    const characterCode = character.codePointAt(0) ?? 0;
    if (characterCode < 65 || characterCode > 90) {
      return Number.MAX_SAFE_INTEGER;
    }
    rank = rank * 26 + characterCode - 64;
  }
  return rank || Number.MAX_SAFE_INTEGER;
}

function normalizeEmbeddingBoxScope(scope: null | string | undefined) {
  const normalizedScope = (scope ?? '')
    .trim()
    .toUpperCase()
    .replaceAll(/[^A-Z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '');
  return normalizedScope || GENERATED_EMBEDDING_BOX_NO_SCOPE_FALLBACK;
}

function buildGeneratedEmbeddingBoxNo(
  scope: string,
  prefix: GrossingEmbeddingBoxPrefix,
  sequenceNo: number,
) {
  const suffix = `${prefix.toUpperCase()}${sequenceNo}`;
  const normalizedScope = normalizeEmbeddingBoxScope(scope);
  const maxScopeLength = Math.max(
    1,
    MAX_EMBEDDING_BOX_NO_LENGTH -
      GENERATED_EMBEDDING_BOX_NO_PREFIX.length -
      suffix.length -
      2,
  );
  const truncatedScope =
    normalizedScope.slice(0, maxScopeLength).replaceAll(/-+$/g, '') ||
    GENERATED_EMBEDDING_BOX_NO_SCOPE_FALLBACK;

  return `${GENERATED_EMBEDDING_BOX_NO_PREFIX}-${truncatedScope}-${suffix}`;
}

function parseGeneratedEmbeddingBoxNo(embeddingBoxNo: string) {
  const normalizedValue = embeddingBoxNo.trim().toUpperCase();
  const scopedMatch = normalizedValue.match(/^BX-(.+)-([A-Z]+)(\d+)$/);
  const legacyMatch =
    scopedMatch === null ? normalizedValue.match(/^([A-Z]+)(\d+)$/) : null;
  const match = scopedMatch ?? legacyMatch;
  if (!match) {
    return null;
  }
  const rawPrefix = scopedMatch ? scopedMatch[2] : match[1];
  const rawSequence = scopedMatch ? scopedMatch[3] : match[2];
  if (!rawPrefix || !rawSequence) {
    return null;
  }
  return {
    prefix: rawPrefix.toUpperCase() as GrossingEmbeddingBoxPrefix,
    sequence: Number(rawSequence),
  };
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
  const workbenchContext = ref<GrossingWorkbenchContext | null>(null);
  const trackingResult = ref<null | TechnicalTrackingViewModel>(null);
  const activeSpecimenKey = ref('');
  const selectedEmbeddingBoxSpecimenKey = ref('');
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
    embeddingBoxNo = buildGeneratedEmbeddingBoxNo(
      GENERATED_EMBEDDING_BOX_NO_SCOPE_FALLBACK,
      'A',
      sequenceNo,
    ),
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

  function getResolvedEmbeddingBoxScope() {
    return normalizeEmbeddingBoxScope(
      workbenchContext.value?.caseSummary?.pathologyNo ??
        currentTask.value?.pathologyNo ??
        currentTask.value?.caseId,
    );
  }

  function createEmptySpecimen(specimenIndex = 0): GrossingSpecimenItemRequest {
    return {
      blocks: [createEmptyBlock()],
      blockCount: 1,
      bodyPartId: '',
      cutSurfaceFeature: '',
      embeddingBoxes: [
        createEmbeddingBox(
          1,
          buildGeneratedEmbeddingBoxNo(
            getResolvedEmbeddingBoxScope(),
            getSpecimenPrefix(specimenIndex),
            1,
          ),
        ),
      ],
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
  const specimenTabMetas = ref<GrossingSpecimenTabMeta[]>([]);

  const currentTaskContext = computed(() => ({
    caseId: completeForm.caseId || currentTask.value?.caseId || '',
    objectId:
      workbenchContext.value?.task.objectId ??
      currentTask.value?.objectId ??
      '',
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

  const activeSpecimenPrefix = computed(() =>
    getSpecimenPrefix(activeSpecimenIndex.value),
  );

  const activeSpecimenName = computed(() =>
    getSpecimenDisplayName(activeSpecimenIndex.value),
  );

  const specimenNameOptions = computed(() =>
    specimenTabMetas.value.map((item, index) => ({
      label: getSpecimenDisplayName(index),
      value: item.key,
    })),
  );

  const selectedEmbeddingBoxSpecimenIndex = computed(() =>
    specimenTabMetas.value.findIndex(
      (item) => item.key === selectedEmbeddingBoxSpecimenKey.value,
    ),
  );

  const selectedEmbeddingBoxSpecimenPrefix = computed(() =>
    getSpecimenPrefix(selectedEmbeddingBoxSpecimenIndex.value),
  );

  const embeddingBoxRows = computed<GrossingEmbeddingBoxTableRow[]>(() =>
    completeForm.specimens.flatMap((specimen, specimenIndex) =>
      (specimen.embeddingBoxes ?? []).map((box, boxIndex) => ({
        box,
        boxIndex,
        specimenIndex,
        specimenName: getSpecimenDisplayName(specimenIndex),
      })),
    ),
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

  function createSpecimenTabMeta(trackingLabel = '', specimenName = '') {
    return {
      key: `specimen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      specimenName,
      trackingLabel,
    };
  }

  function activateSpecimenAt(index: number) {
    activeSpecimenKey.value = specimenTabMetas.value[index]?.key ?? '';
  }

  function syncSpecimenTabs(
    specimens: GrossingSpecimenItemRequest[],
    trackingLabels: string[] = [],
    specimenNames: string[] = [],
  ) {
    completeForm.specimens = specimens;
    specimenTabMetas.value = specimens.map((_, index) =>
      createSpecimenTabMeta(
        trackingLabels[index] ?? '',
        specimenNames[index] ?? '',
      ),
    );
    activateSpecimenAt(0);
    selectedEmbeddingBoxSpecimenKey.value =
      specimenTabMetas.value[0]?.key ?? '';
  }

  function getSpecimenTrackingLabel(index: number) {
    return specimenTabMetas.value[index]?.trackingLabel?.trim() ?? '';
  }

  function getSpecimenPrefix(index: number) {
    return createSpecimenPrefix(Math.max(index, 0));
  }

  function getSpecimenDisplayName(index: number) {
    if (index < 0) {
      return '';
    }
    const specimenName = specimenTabMetas.value[index]?.specimenName?.trim();
    return specimenName || getSpecimenPrefix(index);
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

  function seedSpecimensFromTracking(
    tracking: null | TechnicalTrackingViewModel,
  ) {
    if (!tracking || tracking.specimens.length === 0) {
      syncSpecimenTabs([createEmptySpecimen()]);
      return;
    }

    syncSpecimenTabs(
      tracking.specimens.map((item, itemIndex) => {
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
              buildGeneratedEmbeddingBoxNo(
                getResolvedEmbeddingBoxScope(),
                getSpecimenPrefix(itemIndex),
                index + 1,
              ),
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
      tracking.specimens.map((item) => item.specimenName?.trim() || ''),
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
    const specimenIndex = completeForm.specimens.length;
    completeForm.specimens.push(createEmptySpecimen(specimenIndex));
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
    if (
      !specimenTabMetas.value.some(
        (item) => item.key === selectedEmbeddingBoxSpecimenKey.value,
      )
    ) {
      selectedEmbeddingBoxSpecimenKey.value =
        specimenTabMetas.value[nextActiveIndex]?.key ?? '';
    }
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
        getNextEmbeddingBoxNo(specimen, getSpecimenPrefix(specimenIndex)),
      ),
    );
    sortEmbeddingBoxPairs(specimen);
    syncSpecimenBlockCount(specimen);
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
    sortEmbeddingBoxPairs(specimen);
    syncSpecimenBlockCount(specimen);
  }

  function getNextEmbeddingBoxNo(
    specimen: GrossingSpecimenItemRequest,
    prefix: GrossingEmbeddingBoxPrefix,
  ) {
    const usedSequences = new Set<number>();
    for (const box of specimen.embeddingBoxes ?? []) {
      const parsedBoxNo = parseGeneratedEmbeddingBoxNo(box.embeddingBoxNo);
      if (
        parsedBoxNo?.prefix === prefix &&
        Number.isSafeInteger(parsedBoxNo.sequence) &&
        parsedBoxNo.sequence > 0
      ) {
        usedSequences.add(parsedBoxNo.sequence);
      }
    }
    let nextSequence = 1;
    while (usedSequences.has(nextSequence)) {
      nextSequence += 1;
    }
    return buildGeneratedEmbeddingBoxNo(
      getResolvedEmbeddingBoxScope(),
      prefix,
      nextSequence,
    );
  }

  function compareEmbeddingBoxPairs(
    left: {
      box: GrossingEmbeddingBoxItemRequest;
      originalIndex: number;
    },
    right: {
      box: GrossingEmbeddingBoxItemRequest;
      originalIndex: number;
    },
  ) {
    const leftParsed = parseGeneratedEmbeddingBoxNo(left.box.embeddingBoxNo);
    const rightParsed = parseGeneratedEmbeddingBoxNo(right.box.embeddingBoxNo);

    if (leftParsed && rightParsed) {
      const prefixDiff =
        getEmbeddingBoxPrefixRank(leftParsed.prefix) -
        getEmbeddingBoxPrefixRank(rightParsed.prefix);
      if (prefixDiff !== 0) {
        return prefixDiff;
      }
      return (
        leftParsed.sequence - rightParsed.sequence ||
        left.originalIndex - right.originalIndex
      );
    }
    if (leftParsed) {
      return -1;
    }
    if (rightParsed) {
      return 1;
    }
    return left.originalIndex - right.originalIndex;
  }

  function resequenceEmbeddingBoxes(
    embeddingBoxes: GrossingEmbeddingBoxItemRequest[] | undefined,
  ) {
    embeddingBoxes?.forEach((box, index) => {
      box.sequenceNo = index + 1;
      box.boxName ||= `包埋盒 ${index + 1}`;
    });
  }

  function sortEmbeddingBoxPairs(specimen: GrossingSpecimenItemRequest) {
    const embeddingBoxes = specimen.embeddingBoxes;
    if (!embeddingBoxes?.length) {
      return;
    }

    const pairs = embeddingBoxes.map((box, index) => ({
      block: specimen.blocks[index] ?? createEmptyBlock(),
      box,
      originalIndex: index,
    }));
    pairs.sort(compareEmbeddingBoxPairs);
    specimen.embeddingBoxes = pairs.map((pair) => pair.box);
    specimen.blocks = pairs.map((pair) => pair.block);
    resequenceEmbeddingBoxes(specimen.embeddingBoxes);
  }

  function syncSpecimenBlockCount(specimen: GrossingSpecimenItemRequest) {
    specimen.blockCount = Math.max(
      specimen.blockCount ?? 0,
      specimen.blocks.length,
    );
  }

  function addEmbeddingBoxes(
    count: number,
    prefix: GrossingEmbeddingBoxPrefix = selectedEmbeddingBoxSpecimenPrefix.value,
    specimenIndex = selectedEmbeddingBoxSpecimenIndex.value,
  ) {
    const specimen = completeForm.specimens[specimenIndex];
    if (!specimen) {
      ElMessage.warning('请先选择可编辑标本');
      return;
    }
    specimen.embeddingBoxes ??= [];
    for (let index = 0; index < count; index++) {
      const nextSequenceNo = specimen.embeddingBoxes.length + 1;
      specimen.embeddingBoxes.push(
        createEmbeddingBox(
          nextSequenceNo,
          getNextEmbeddingBoxNo(specimen, prefix),
        ),
      );
      specimen.blocks.push(createEmptyBlock());
    }
    sortEmbeddingBoxPairs(specimen);
    syncSpecimenBlockCount(specimen);
  }

  function removeEmbeddingBox(
    index: number,
    specimenIndex = activeSpecimenIndex.value,
  ) {
    const specimen = completeForm.specimens[specimenIndex];
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
    sortEmbeddingBoxPairs(specimen);
    syncSpecimenBlockCount(specimen);
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
    return validateGrossingImageFile(file);
  };

  function validateGrossingImageFile(file: File) {
    if (!grossingImageTypes.has(file.type)) {
      ElMessage.warning('仅支持 JPG、PNG、WEBP、BMP 格式的标本摄影像');
      return false;
    }
    if (file.size > grossingImageMaxSize) {
      ElMessage.warning('单张标本摄影像不能超过 20MB');
      return false;
    }
    return true;
  }

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

  async function performGrossingImageUpload(
    specimenIndex: number,
    file: File,
  ): Promise<GrossingMediaAssetUploadResponse> {
    setSpecimenUploading(specimenIndex, true);
    try {
      const result = await uploadGrossingMediaAsset(file);
      completeForm.specimens[specimenIndex]?.mediaAssets?.push({
        fileName: result.fileName,
        fileUrl: result.fileUrl,
      });
      ElMessage.success('标本摄影像上传成功');
      return result;
    } finally {
      setSpecimenUploading(specimenIndex, false);
    }
  }

  async function uploadGrossingImageFile(specimenIndex: number, file: File) {
    if (!validateGrossingImageFile(file)) {
      return false;
    }
    try {
      await performGrossingImageUpload(specimenIndex, file);
      return true;
    } catch (error) {
      ElMessage.warning(getWorkflowPageErrorMessage(error));
      return false;
    }
  }

  function createGrossingImageUploadRequest(specimenIndex: number) {
    return async (uploadOptions: UploadRequestOptions) => {
      try {
        const file = uploadOptions.file as File;
        const result = await performGrossingImageUpload(specimenIndex, file);
        uploadOptions.onSuccess(result);
      } catch (error) {
        uploadOptions.onError(createGrossingUploadError(error, uploadOptions));
        ElMessage.warning(getWorkflowPageErrorMessage(error));
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
    if (normalizedSpecimens.some((item) => item.blocks.length === 0)) {
      ElMessage.warning('每个标本至少需要一个蜡块明细');
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
    activeSpecimenName,
    activeSpecimenPrefix,
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
    embeddingBoxRows,
    ensureSelectOptionsLoaded,
    enteredMediaAssets,
    getSpecimenDisplayName,
    getSpecimenPrefix,
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
    selectedEmbeddingBoxSpecimenKey,
    selectedEmbeddingBoxSpecimenPrefix,
    specimenNameOptions,
    specimenTabMetas,
    submitGrossing,
    submitting,
    trackingResult,
    uploadGrossingImageFile,
    workflowReferenceOptions,
    workbenchContext,
  };
}
