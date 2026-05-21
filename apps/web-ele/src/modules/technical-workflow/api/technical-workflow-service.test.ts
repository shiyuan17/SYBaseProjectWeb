import type { Mock } from 'vitest';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestClient } from '#/api/request';

import {
  completeDehydrationBatch,
  completeEmbedding,
  completeGrossing,
  completeSlicing,
  completeSlideStaining,
  createDehydrationBatch,
  createReworkOrder,
  executeReworkOrder,
  getTechnicalTracking,
  listPendingTechnicalTasks,
  mapPendingTechnicalTaskPageResponse,
  mapTechnicalTrackingResponse,
  startDehydrationBatch,
  startEmbedding,
  startGrossing,
  startSlicing,
  startSlideStaining,
} from './technical-workflow-service';

vi.mock('#/api/request', () => ({
  requestClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const requestClientMock = requestClient as unknown as {
  get: Mock;
  post: Mock;
};

beforeEach(() => {
  requestClientMock.get.mockReset();
  requestClientMock.post.mockReset();
});

describe('technical-workflow-service mappers', () => {
  it('normalizes pending technical task pagination', () => {
    expect(mapPendingTechnicalTaskPageResponse({})).toEqual({
      items: [],
      page: 1,
      size: 20,
      total: 0,
    });
  });

  it('normalizes technical tracking arrays', () => {
    expect(
      mapTechnicalTrackingResponse({
        caseId: 'CASE-001',
        caseStatus: 'GROSSING_PENDING',
        pathologyNo: 'BL-001',
      }),
    ).toEqual({
      blocks: [],
      caseId: 'CASE-001',
      caseStatus: 'GROSSING_PENDING',
      embeddingBoxes: [],
      events: [],
      pathologyNo: 'BL-001',
      qcEvaluations: [],
      reworks: [],
      slides: [],
      specimens: [],
      technicalTasks: [],
    });
  });
});

describe('technical-workflow-service requests', () => {
  it('queries pending technical tasks with backend query names', async () => {
    requestClientMock.get.mockResolvedValue({
      items: [],
      page: 1,
      size: 20,
      total: 0,
    });

    await listPendingTechnicalTasks({
      page: 1,
      pathologyNo: 'BL-001',
      size: 20,
      taskType: 'GROSSING',
      timedOutOnly: true,
    });

    expect(requestClientMock.get).toHaveBeenCalledWith(
      '/v1/technical-tasks/pending',
      {
        params: {
          page: 1,
          pathologyNo: 'BL-001',
          size: 20,
          taskType: 'GROSSING',
          timedOutOnly: true,
        },
      },
    );
  });

  it('maps technical tracking through requestClient data unwrapping', async () => {
    requestClientMock.get.mockResolvedValue({
      caseId: 'CASE-001',
      pathologyNo: 'BL-001',
      caseStatus: 'DIAGNOSIS_PENDING',
    });

    await expect(getTechnicalTracking('CASE-001')).resolves.toMatchObject({
      caseId: 'CASE-001',
      pathologyNo: 'BL-001',
      technicalTasks: [],
      slides: [],
    });

    expect(requestClientMock.get).toHaveBeenCalledWith(
      '/v1/pathology-cases/CASE-001/technical-tracking',
    );
  });

  it('posts grossing endpoints with exact paths', async () => {
    await startGrossing({
      operatorName: '取材员',
      taskId: 'TASK-1',
    });
    await completeGrossing({
      caseId: 'CASE-1',
      operatorName: '取材员',
      specimens: [
        {
          blocks: [{ blockDescription: 'A1' }],
          specimenId: 'SPEC-1',
          specimenType: 'ROUTINE',
        },
      ],
      taskId: 'TASK-1',
    });

    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      1,
      '/v1/grossings/start',
      {
        operatorName: '取材员',
        taskId: 'TASK-1',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/grossings/complete',
      {
        caseId: 'CASE-1',
        operatorName: '取材员',
        specimens: [
          {
            blocks: [{ blockDescription: 'A1' }],
            specimenId: 'SPEC-1',
            specimenType: 'ROUTINE',
          },
        ],
        taskId: 'TASK-1',
      },
    );
  });

  it('posts dehydration endpoints with exact paths', async () => {
    await createDehydrationBatch({
      basketNo: 'B-001',
      caseId: 'CASE-1',
      operatorName: '脱水员',
      samplingBlockIds: ['BLOCK-1'],
    });
    await startDehydrationBatch('BATCH-1', {
      operatorName: '脱水员',
    });
    await completeDehydrationBatch('BATCH-1', {
      mediaAssets: [{ fileName: '1.jpg', fileUrl: 'http://example.com/1.jpg' }],
      operatorName: '脱水员',
    });

    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      1,
      '/v1/dehydration-batches',
      {
        basketNo: 'B-001',
        caseId: 'CASE-1',
        operatorName: '脱水员',
        samplingBlockIds: ['BLOCK-1'],
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/dehydration-batches/BATCH-1/start',
      {
        operatorName: '脱水员',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      3,
      '/v1/dehydration-batches/BATCH-1/complete',
      {
        mediaAssets: [{ fileName: '1.jpg', fileUrl: 'http://example.com/1.jpg' }],
        operatorName: '脱水员',
      },
    );
  });

  it('posts embedding endpoints with exact paths', async () => {
    await startEmbedding({
      operatorName: '包埋员',
      taskId: 'TASK-EMB',
    });
    await completeEmbedding({
      blockCount: 1,
      operatorName: '包埋员',
      samplingBlockId: 'BLOCK-1',
      taskId: 'TASK-EMB',
    });

    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      1,
      '/v1/embeddings/start',
      {
        operatorName: '包埋员',
        taskId: 'TASK-EMB',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/embeddings/complete',
      {
        blockCount: 1,
        operatorName: '包埋员',
        samplingBlockId: 'BLOCK-1',
        taskId: 'TASK-EMB',
      },
    );
  });

  it('posts slicing endpoints with exact paths', async () => {
    await startSlicing({
      operatorName: '切片员',
      taskId: 'TASK-SLI',
    });
    await completeSlicing({
      embeddingBoxId: 'BOX-1',
      operatorName: '切片员',
      slideCount: 2,
      taskId: 'TASK-SLI',
    });

    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      1,
      '/v1/slicings/start',
      {
        operatorName: '切片员',
        taskId: 'TASK-SLI',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/slicings/complete',
      {
        embeddingBoxId: 'BOX-1',
        operatorName: '切片员',
        slideCount: 2,
        taskId: 'TASK-SLI',
      },
    );
  });

  it('posts staining and rework endpoints with exact paths', async () => {
    await startSlideStaining({
      operatorName: '染色员',
      taskId: 'TASK-STN',
    });
    await completeSlideStaining({
      operatorName: '染色员',
      slideId: 'SLIDE-1',
      stainingType: 'HE',
      taskId: 'TASK-STN',
    });
    await createReworkOrder({
      caseId: 'CASE-1',
      operatorName: '返工员',
      reason: '颜色偏浅',
      reworkType: 'RESTAIN',
    });
    await executeReworkOrder('RW-1', {
      operatorName: '返工员',
    });

    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      1,
      '/v1/slide-stainings/start',
      {
        operatorName: '染色员',
        taskId: 'TASK-STN',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/slide-stainings/complete',
      {
        operatorName: '染色员',
        slideId: 'SLIDE-1',
        stainingType: 'HE',
        taskId: 'TASK-STN',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      3,
      '/v1/rework-orders',
      {
        caseId: 'CASE-1',
        operatorName: '返工员',
        reason: '颜色偏浅',
        reworkType: 'RESTAIN',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      4,
      '/v1/rework-orders/RW-1/execute',
      {
        operatorName: '返工员',
      },
    );
  });
});
