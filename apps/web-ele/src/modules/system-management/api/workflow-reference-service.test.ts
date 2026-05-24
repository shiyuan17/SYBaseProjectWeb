import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestClient } from '#/api/request';

import {
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
        containerNames: [{ label: '标本瓶', value: '' }],
      }),
    ).toEqual({
      clinicalSymptoms: [{ label: '肿物', value: '肿物' }],
      collectionModes: [{ label: '手术', value: 'SURGERY' }],
      containerNames: [{ label: '标本瓶', value: '标本瓶' }],
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
    });
  });

  it('caches workflow reference options between repeated queries', async () => {
    requestClientMock.get.mockResolvedValue({
      specimenTypes: [{ label: '常规', value: 'ROUTINE' }],
    });

    await expect(listWorkflowReferenceOptions()).resolves.toEqual({
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
      specimenTypes: [{ label: '常规', value: 'ROUTINE' }],
    });

    await listWorkflowReferenceOptions();

    expect(requestClientMock.get).toHaveBeenCalledTimes(1);
    expect(requestClientMock.get).toHaveBeenCalledWith('/v1/workflow-reference-options', {
      skipErrorMessage: undefined,
    });
  });

  it('returns default options when safe loading fails', async () => {
    requestClientMock.get.mockRejectedValue(new Error('boom'));

    await expect(loadWorkflowReferenceOptionsSafely()).resolves.toMatchObject({
      clinicalSymptoms: expect.arrayContaining([{ label: '肿物', value: '肿物' }]),
      collectionModes: expect.arrayContaining([{ label: '手术', value: 'SURGERY' }]),
      containerNames: expect.arrayContaining([{ label: '标本瓶', value: '标本瓶' }]),
      fixationLiquidTypes: expect.arrayContaining([
        { label: '10% 中性福尔马林', value: 'FORMALIN' },
      ]),
      specimenTypes: expect.arrayContaining([{ label: '常规', value: 'ROUTINE' }]),
    });

    expect(requestClientMock.get).toHaveBeenCalledWith('/v1/workflow-reference-options', {
      skipErrorMessage: true,
    });
  });
});
