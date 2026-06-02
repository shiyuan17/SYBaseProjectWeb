import type {
  WorkflowReferenceOption,
  WorkflowReferenceOptionsResponse,
} from '../types/workflow-reference';

import { requestClient } from '#/api/request';

let cachedWorkflowReferenceOptions: null | WorkflowReferenceOptionsResponse =
  null;
let pendingWorkflowReferenceOptionsRequest: null | Promise<WorkflowReferenceOptionsResponse> =
  null;

function normalizeText(value: null | string | undefined) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}

function createDefaultWorkflowReferenceOptions(): WorkflowReferenceOptionsResponse {
  return {
    clinicalSymptoms: [
      { label: '肿物', value: '肿物' },
      { label: '疼痛', value: '疼痛' },
      { label: '出血', value: '出血' },
      { label: '发热', value: '发热' },
    ],
    collectionModes: [
      { label: '手术', value: 'SURGERY' },
      { label: '活检', value: 'BIOPSY' },
      { label: '穿刺', value: 'PUNCTURE' },
      { label: '细胞学', value: 'CYTOLOGY' },
    ],
    containerNames: [
      { label: '标本瓶', value: '标本瓶' },
      { label: '广口标本瓶', value: '广口标本瓶' },
      { label: '细胞保存液瓶', value: '细胞保存液瓶' },
      { label: '离心管', value: '离心管' },
      { label: '无菌采样杯', value: '无菌采样杯' },
    ],
    cutSurfaceFeatures: [
      { label: '灰白', value: '灰白' },
      { label: '质硬', value: '质硬' },
      { label: '坏死', value: '坏死' },
    ],
    embeddingRemarks: [
      { label: '骨髓', value: '骨髓' },
      { label: '皮肤组织', value: '皮肤组织' },
      { label: '脱钙', value: '脱钙' },
      { label: '粘膜活检', value: '粘膜活检' },
      { label: '补取', value: '补取' },
      { label: '前列腺穿刺', value: '前列腺穿刺' },
      { label: '其他', value: '其他' },
    ],
    fixationLiquidTypes: [
      { label: '10% 中性福尔马林', value: 'FORMALIN' },
      { label: '酒精', value: 'ETHANOL' },
      { label: '生理盐水', value: 'SALINE' },
    ],
    marginMarkings: [
      { label: '上缘墨染', value: '上缘墨染' },
      { label: '下缘墨染', value: '下缘墨染' },
      { label: '基底部墨染', value: '基底部墨染' },
    ],
    specimenImageSizes: [
      { label: '3.2x2.1x1.0cm', value: '3.2x2.1x1.0cm' },
      { label: '1.5x1.0x0.3cm', value: '1.5x1.0x0.3cm' },
    ],
    specimenTypes: [
      { label: '常规', value: 'ROUTINE' },
      { label: '冰冻', value: 'FROZEN' },
      { label: '活检', value: 'BIOPSY' },
      { label: '细胞学', value: 'CYTOLOGY' },
    ],
  };
}

function normalizeReferenceOptions(
  options: null | undefined | WorkflowReferenceOption[],
) {
  return (options ?? [])
    .map((option) => {
      const label = normalizeText(option?.label);
      const value = normalizeText(option?.value) || label;
      if (!label || !value) {
        return null;
      }
      return { label, value };
    })
    .filter((option): option is WorkflowReferenceOption => option !== null);
}

function withDefaultOptions(
  options: WorkflowReferenceOption[],
  fallbackOptions: WorkflowReferenceOption[],
) {
  return options.length > 0 ? options : fallbackOptions;
}

export function createEmptyWorkflowReferenceOptions(): WorkflowReferenceOptionsResponse {
  return {
    clinicalSymptoms: [],
    collectionModes: [],
    containerNames: [],
    cutSurfaceFeatures: [],
    embeddingRemarks: [],
    fixationLiquidTypes: [],
    marginMarkings: [],
    specimenImageSizes: [],
    specimenTypes: [],
  };
}

export function mapWorkflowReferenceOptionsResponse(
  response: null | Partial<WorkflowReferenceOptionsResponse> | undefined,
): WorkflowReferenceOptionsResponse {
  const defaults = createDefaultWorkflowReferenceOptions();
  return {
    clinicalSymptoms: withDefaultOptions(
      normalizeReferenceOptions(response?.clinicalSymptoms),
      defaults.clinicalSymptoms,
    ),
    collectionModes: withDefaultOptions(
      normalizeReferenceOptions(response?.collectionModes),
      defaults.collectionModes,
    ),
    containerNames: withDefaultOptions(
      normalizeReferenceOptions(response?.containerNames),
      defaults.containerNames,
    ),
    cutSurfaceFeatures: withDefaultOptions(
      normalizeReferenceOptions(response?.cutSurfaceFeatures),
      defaults.cutSurfaceFeatures,
    ),
    embeddingRemarks: withDefaultOptions(
      normalizeReferenceOptions(response?.embeddingRemarks),
      defaults.embeddingRemarks,
    ),
    fixationLiquidTypes: withDefaultOptions(
      normalizeReferenceOptions(response?.fixationLiquidTypes),
      defaults.fixationLiquidTypes,
    ),
    marginMarkings: withDefaultOptions(
      normalizeReferenceOptions(response?.marginMarkings),
      defaults.marginMarkings,
    ),
    specimenImageSizes: withDefaultOptions(
      normalizeReferenceOptions(response?.specimenImageSizes),
      defaults.specimenImageSizes,
    ),
    specimenTypes: withDefaultOptions(
      normalizeReferenceOptions(response?.specimenTypes),
      defaults.specimenTypes,
    ),
  };
}

export async function listWorkflowReferenceOptions(
  options: { force?: boolean; skipErrorMessage?: boolean } = {},
) {
  if (!options.force && cachedWorkflowReferenceOptions) {
    return cachedWorkflowReferenceOptions;
  }

  if (!options.force && pendingWorkflowReferenceOptionsRequest) {
    return pendingWorkflowReferenceOptionsRequest;
  }

  pendingWorkflowReferenceOptionsRequest = requestClient
    .get<Partial<WorkflowReferenceOptionsResponse>>(
      '/v1/workflow-reference-options',
      {
        skipErrorMessage: options.skipErrorMessage,
      },
    )
    .then((response) => {
      const normalized = mapWorkflowReferenceOptionsResponse(response);
      cachedWorkflowReferenceOptions = normalized;
      return normalized;
    })
    .finally(() => {
      pendingWorkflowReferenceOptionsRequest = null;
    });

  return pendingWorkflowReferenceOptionsRequest;
}

export async function loadWorkflowReferenceOptionsSafely(
  options: { enabled?: boolean } = {},
) {
  if (options.enabled === false) {
    const defaults = createDefaultWorkflowReferenceOptions();
    cachedWorkflowReferenceOptions ??= defaults;
    return cachedWorkflowReferenceOptions;
  }
  try {
    return await listWorkflowReferenceOptions({ skipErrorMessage: true });
  } catch {
    const defaults = createDefaultWorkflowReferenceOptions();
    cachedWorkflowReferenceOptions ??= defaults;
    return cachedWorkflowReferenceOptions;
  }
}

export function resetWorkflowReferenceOptionsCache() {
  cachedWorkflowReferenceOptions = null;
  pendingWorkflowReferenceOptionsRequest = null;
}
