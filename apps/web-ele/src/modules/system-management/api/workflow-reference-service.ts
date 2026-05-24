import type {
  WorkflowReferenceOption,
  WorkflowReferenceOptionsResponse,
} from '../types/workflow-reference';

import { requestClient } from '#/api/request';

let cachedWorkflowReferenceOptions: null | WorkflowReferenceOptionsResponse = null;
let pendingWorkflowReferenceOptionsRequest:
  | null
  | Promise<WorkflowReferenceOptionsResponse> = null;

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
    fixationLiquidTypes: [
      { label: '10% 中性福尔马林', value: 'FORMALIN' },
      { label: '酒精', value: 'ETHANOL' },
      { label: '生理盐水', value: 'SALINE' },
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
  options: null | WorkflowReferenceOption[] | undefined,
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
    fixationLiquidTypes: [],
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
    fixationLiquidTypes: withDefaultOptions(
      normalizeReferenceOptions(response?.fixationLiquidTypes),
      defaults.fixationLiquidTypes,
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
    .get<Partial<WorkflowReferenceOptionsResponse>>('/v1/workflow-reference-options', {
      skipErrorMessage: options.skipErrorMessage,
    })
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
