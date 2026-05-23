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

export function createEmptyWorkflowReferenceOptions(): WorkflowReferenceOptionsResponse {
  return {
    clinicalSymptoms: [],
    collectionModes: [],
    fixationLiquidTypes: [],
    specimenTypes: [],
  };
}

export function mapWorkflowReferenceOptionsResponse(
  response: null | Partial<WorkflowReferenceOptionsResponse> | undefined,
): WorkflowReferenceOptionsResponse {
  return {
    clinicalSymptoms: normalizeReferenceOptions(response?.clinicalSymptoms),
    collectionModes: normalizeReferenceOptions(response?.collectionModes),
    fixationLiquidTypes: normalizeReferenceOptions(response?.fixationLiquidTypes),
    specimenTypes: normalizeReferenceOptions(response?.specimenTypes),
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

export async function loadWorkflowReferenceOptionsSafely() {
  try {
    return await listWorkflowReferenceOptions({ skipErrorMessage: true });
  } catch {
    return createEmptyWorkflowReferenceOptions();
  }
}

export function resetWorkflowReferenceOptionsCache() {
  cachedWorkflowReferenceOptions = null;
  pendingWorkflowReferenceOptionsRequest = null;
}
