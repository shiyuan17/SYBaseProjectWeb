import type { Mock } from 'vitest';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestClient } from '#/api/request';

import {
  assignTechnicalTask,
  claimTechnicalTask,
  completeDehydrationBatch,
  completeTechnicalSpecimenRegistration,
  completeEmbedding,
  completeGrossing,
  completeSlicing,
  completeSlideStaining,
  createDehydrationBatch,
  createReworkOrder,
  executeReworkOrder,
  getTechnicalTracking,
  getTechnicalSpecimenRegistrationDetail,
  listPendingTechnicalSpecimenRegistrations,
  listPendingTechnicalTasks,
  mapPendingTechnicalSpecimenRegistrationPageResponse,
  mapPendingTechnicalTaskPageResponse,
  mapTechnicalSpecimenRegistrationDetailResponse,
  mapTechnicalTrackingResponse,
  releaseTechnicalTask,
  startDehydrationBatch,
  startEmbedding,
  startGrossing,
  startSlicing,
  startSlideStaining,
  updateTechnicalTaskPriority,
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

  it('normalizes pending specimen registration pagination', () => {
    expect(mapPendingTechnicalSpecimenRegistrationPageResponse({})).toEqual({
      items: [],
      page: 1,
      size: 20,
      total: 0,
    });
  });

  it('normalizes specimen registration detail arrays', () => {
    expect(mapTechnicalSpecimenRegistrationDetailResponse({})).toEqual({
      applicationId: '',
      applicationNo: '',
      applicationType: null,
      caseId: '',
      checkItems: [],
      clinicalDiagnosis: null,
      inpatientNo: null,
      materials: [],
      pathologyNo: null,
      patientId: null,
      patientName: null,
      receivedAt: null,
      registeredAt: null,
      registeredByName: null,
      registrationRemarks: null,
      registrationStatus: null,
      submittingDepartmentName: null,
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
      priority: 'STAT',
      currentNode: 'GROSSING',
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
          priority: 'STAT',
          currentNode: 'GROSSING',
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

  it('queries and completes technical specimen registrations with exact paths', async () => {
    requestClientMock.get.mockResolvedValueOnce({
      items: [],
      page: 1,
      size: 20,
      total: 0,
    });
    requestClientMock.get.mockResolvedValueOnce({
      caseId: 'CASE-001',
    });

    await listPendingTechnicalSpecimenRegistrations({
      keyword: 'BL-001',
      page: 1,
      size: 20,
    });
    await getTechnicalSpecimenRegistrationDetail('CASE-001');
    await completeTechnicalSpecimenRegistration('CASE-001', {
      remarks: '登记完成',
      terminalCode: 'T-1',
    });

    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      1,
      '/v1/technical-specimen-registrations/pending',
      {
        params: {
          keyword: 'BL-001',
          page: 1,
          size: 20,
        },
      },
    );
    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      2,
      '/v1/technical-specimen-registrations/CASE-001',
    );
    expect(requestClientMock.post).toHaveBeenCalledWith(
      '/v1/technical-specimen-registrations/CASE-001/complete',
      {
        remarks: '登记完成',
        terminalCode: 'T-1',
      },
    );
  });

  it('posts task management endpoints with exact paths', async () => {
    await assignTechnicalTask('TASK/1', {
      assignedToName: '技师A',
      priority: 'STAT',
      stationCode: 'GROSSING',
    });
    await claimTechnicalTask('TASK-2', {
      assignedToName: '技师B',
      assignedToUserId: 'USER-B',
    });
    await releaseTechnicalTask('TASK-3', {
      remarks: '释放',
    });
    await updateTechnicalTaskPriority('TASK-4', {
      priority: 'PRIORITY',
    });

    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      1,
      '/v1/technical-tasks/TASK%2F1/assign',
      {
        assignedToName: '技师A',
        priority: 'STAT',
        stationCode: 'GROSSING',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/technical-tasks/TASK-2/claim',
      {
        assignedToName: '技师B',
        assignedToUserId: 'USER-B',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      3,
      '/v1/technical-tasks/TASK-3/release',
      {
        remarks: '释放',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      4,
      '/v1/technical-tasks/TASK-4/priority',
      {
        priority: 'PRIORITY',
      },
    );
  });

  it('encodes technical tracking identifiers in the path', async () => {
    requestClientMock.get.mockResolvedValue({
      caseId: 'CASE-001',
      pathologyNo: 'BL/2026/001',
    });

    await getTechnicalTracking('BL/2026/001');

    expect(requestClientMock.get).toHaveBeenCalledWith(
      '/v1/pathology-cases/BL%2F2026%2F001/technical-tracking',
    );
  });

  it('posts grossing endpoints with exact paths', async () => {
    await startGrossing({
      taskId: 'TASK-1',
    });
    await completeGrossing({
      caseId: 'CASE-1',
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
        taskId: 'TASK-1',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/grossings/complete',
      {
        caseId: 'CASE-1',
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
      samplingBlockIds: ['BLOCK-1'],
    });
    await startDehydrationBatch('BATCH-1', {});
    await completeDehydrationBatch('BATCH-1', {
      mediaAssets: [{ fileName: '1.jpg', fileUrl: 'http://example.com/1.jpg' }],
    });

    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      1,
      '/v1/dehydration-batches',
      {
        basketNo: 'B-001',
        caseId: 'CASE-1',
        samplingBlockIds: ['BLOCK-1'],
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/dehydration-batches/BATCH-1/start',
      {},
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      3,
      '/v1/dehydration-batches/BATCH-1/complete',
      {
        mediaAssets: [
          { fileName: '1.jpg', fileUrl: 'http://example.com/1.jpg' },
        ],
      },
    );
  });

  it('posts embedding endpoints with exact paths', async () => {
    await startEmbedding({
      taskId: 'TASK-EMB',
    });
    await completeEmbedding({
      blockCount: 1,
      samplingBlockId: 'BLOCK-1',
      taskId: 'TASK-EMB',
    });

    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      1,
      '/v1/embeddings/start',
      {
        taskId: 'TASK-EMB',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/embeddings/complete',
      {
        blockCount: 1,
        samplingBlockId: 'BLOCK-1',
        taskId: 'TASK-EMB',
      },
    );
  });

  it('posts slicing endpoints with exact paths', async () => {
    await startSlicing({
      taskId: 'TASK-SLI',
    });
    await completeSlicing({
      embeddingBoxId: 'BOX-1',
      slideCount: 2,
      taskId: 'TASK-SLI',
    });

    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      1,
      '/v1/slicings/start',
      {
        taskId: 'TASK-SLI',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/slicings/complete',
      {
        embeddingBoxId: 'BOX-1',
        slideCount: 2,
        taskId: 'TASK-SLI',
      },
    );
  });

  it('posts staining and rework endpoints with exact paths', async () => {
    await startSlideStaining({
      taskId: 'TASK-STN',
    });
    await completeSlideStaining({
      slideId: 'SLIDE-1',
      stainingType: 'HE',
      taskId: 'TASK-STN',
    });
    await createReworkOrder({
      caseId: 'CASE-1',
      reason: '颜色偏浅',
      reworkType: 'RESTAIN',
    });
    await executeReworkOrder('RW-1', {});

    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      1,
      '/v1/slide-stainings/start',
      {
        taskId: 'TASK-STN',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/slide-stainings/complete',
      {
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
        reason: '颜色偏浅',
        reworkType: 'RESTAIN',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      4,
      '/v1/rework-orders/RW-1/execute',
      {},
    );
  });
});
