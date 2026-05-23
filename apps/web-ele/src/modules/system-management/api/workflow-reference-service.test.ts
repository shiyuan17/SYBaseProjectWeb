import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestClient } from '#/api/request';

import {
  createEmptyWorkflowReferenceOptions,
  listWorkflowReferenceOptions,
  loadWorkflowReferenceOptionsSafely,
  mapWorkflowReferenceOptionsResponse,
  resetWorkflowReferenceOptionsCache,
} from './workflow-reference-service';

vi.mock('#/api/request', () => ({
  requestClient: {
    get: vi.fn(),
  },
}));

const requestClientMock = requestClient as unknown as {
  get: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  requestClientMock.get.mockReset();
  resetWorkflowReferenceOptionsCache();
});

describe('workflow-reference-service', () => {
  it('normalizes grouped reference options and falls back to label when value is empty', () => {
    expect(
      mapWorkflowReferenceOptionsResponse({
        clinicalSymptoms: [{ label: '肿物', value: '' }],
        collectionModes: [{ label: '手术', value: 'SURGERY' }],
      }),
    ).toEqual({
      clinicalSymptoms: [{ label: '肿物', value: '肿物' }],
      collectionModes: [{ label: '手术', value: 'SURGERY' }],
      fixationLiquidTypes: [],
      specimenTypes: [],
    });
  });

  it('caches workflow reference options between repeated queries', async () => {
    requestClientMock.get.mockResolvedValue({
      specimenTypes: [{ label: '常规', value: 'ROUTINE' }],
    });

    await expect(listWorkflowReferenceOptions()).resolves.toEqual({
      clinicalSymptoms: [],
      collectionModes: [],
      fixationLiquidTypes: [],
      specimenTypes: [{ label: '常规', value: 'ROUTINE' }],
    });

    await listWorkflowReferenceOptions();

    expect(requestClientMock.get).toHaveBeenCalledTimes(1);
    expect(requestClientMock.get).toHaveBeenCalledWith('/v1/workflow-reference-options', {
      skipErrorMessage: undefined,
    });
  });

  it('returns empty options when safe loading fails', async () => {
    requestClientMock.get.mockRejectedValue(new Error('boom'));

    await expect(loadWorkflowReferenceOptionsSafely()).resolves.toEqual(
      createEmptyWorkflowReferenceOptions(),
    );

    expect(requestClientMock.get).toHaveBeenCalledWith('/v1/workflow-reference-options', {
      skipErrorMessage: true,
    });
  });
});
