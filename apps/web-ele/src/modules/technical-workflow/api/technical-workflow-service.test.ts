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
  createSlideQcEvaluation,
  executeReworkOrder,
  getEmbeddingWorkstationSummary,
  getGrossingWorkbenchContext,
  getSlicingWorkbench,
  getTechnicalSpecimenRegistrationApplicationWorkbench,
  getTechnicalTracking,
  getTechnicalSpecimenRegistrationDetail,
  listPendingTechnicalSpecimenRegistrations,
  listPendingTechnicalTasks,
  mapEmbeddingWorkstationSummaryResponse,
  mapGrossingWorkbenchContextResponse,
  mapPendingTechnicalSpecimenRegistrationPageResponse,
  mapPendingTechnicalTaskPageResponse,
  mapSlicingWorkbenchResponse,
  mapTechnicalSpecimenRegistrationDetailResponse,
  mapTechnicalTrackingResponse,
  releaseTechnicalTask,
  saveTechnicalSpecimenRegistrationApplicationWorkbenchPatientInfo,
  saveTechnicalSpecimenRegistrationDetailSections,
  startDehydrationBatch,
  startEmbedding,
  startGrossing,
  startSlicing,
  startSlideStaining,
  updateTechnicalTaskPriority,
} from './technical-workflow-service';

vi.mock('#/api/request', () => ({
  requestClient: {
    delete: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    request: vi.fn(),
    upload: vi.fn(),
  },
}));

const requestClientMock = requestClient as unknown as {
  delete: Mock;
  get: Mock;
  post: Mock;
  put: Mock;
  request: Mock;
  upload: Mock;
};

beforeEach(() => {
  requestClientMock.delete.mockReset();
  requestClientMock.get.mockReset();
  requestClientMock.post.mockReset();
  requestClientMock.put.mockReset();
  requestClientMock.request.mockReset();
  requestClientMock.upload.mockReset();
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
      embeddingEvaluationRecords: [],
      embeddingRecords: [],
      events: [],
      pathologyNo: 'BL-001',
      qcEvaluations: [],
      reworks: [],
      slides: [],
      specimens: [],
      technicalTasks: [],
    });
  });

  it('normalizes grossing workbench context payload', () => {
    expect(mapGrossingWorkbenchContextResponse({})).toEqual({
      caseSummary: {
        applicationId: '',
        applicationNo: '',
        applicationType: null,
        caseId: '',
        caseStatus: null,
        inpatientNo: null,
        pathologyNo: null,
        patientId: null,
        patientName: null,
        submittingDepartmentName: null,
      },
      checkItems: [],
      clinicalDiagnosis: null,
      clinicalHistory: null,
      contextSummary: null,
      mediaAssets: [],
      relatedExaminations: null,
      task: {
        objectId: null,
        objectType: null,
        taskId: '',
        taskStatus: null,
      },
      tracking: {
        blocks: [],
        caseId: '',
        caseStatus: null,
        embeddingBoxes: [],
        embeddingEvaluationRecords: [],
        embeddingRecords: [],
        events: [],
        pathologyNo: null,
        qcEvaluations: [],
        reworks: [],
        slides: [],
        specimens: [],
        technicalTasks: [],
      },
    });
  });

  it('normalizes slicing workbench payload', () => {
    expect(
      mapSlicingWorkbenchResponse({
        pendingList: [{ caseId: 'CASE-1', taskId: 'TASK-1' }],
        stats: { overdueCount: 2, pendingTodayCount: 3 },
      }),
    ).toEqual({
      completedPage: 1,
      completedSize: 20,
      completedTodayList: [],
      completedTotal: 0,
      pendingList: [
        {
          caseId: 'CASE-1',
          completedAt: null,
          embeddingBoxId: '',
          embeddingClearRemark: null,
          embeddingEvaluation: null,
          embeddingOperatorName: null,
          grossingEvaluation: null,
          pathologyNo: null,
          patientId: null,
          patientName: null,
          selectable: false,
          shiftRemark: null,
          slideId: null,
          slideNo: null,
          sliceNotice: null,
          slicingOperatorName: null,
          slicingRemark: null,
          specimenId: null,
          specimenName: null,
          taskId: 'TASK-1',
          taskStatus: null,
          timedOut: false,
        },
      ],
      pendingPage: 1,
      pendingSize: 20,
      pendingTotal: 0,
      stats: {
        completedDeptTodayCount: 0,
        completedMineTodayCount: 0,
        overdueCount: 2,
        pendingPrintCount: 0,
        pendingTodayCount: 3,
        pendingTomorrowCount: 0,
      },
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

  it('normalizes embedding workstation summary arrays', () => {
    expect(mapEmbeddingWorkstationSummaryResponse({})).toEqual({
      completedCount: 0,
      completedRecords: [],
      pendingCount: 0,
      pendingTasks: [],
      workDate: null,
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
      keyword: 'P-001',
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
          keyword: 'P-001',
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

  it('queries embedding workstation summary with optional work date', async () => {
    requestClientMock.get.mockResolvedValue({
      completedCount: 1,
      pendingCount: 2,
      workDate: '2026-06-01',
    });

    await expect(
      getEmbeddingWorkstationSummary('2026-06-01'),
    ).resolves.toEqual({
      completedCount: 1,
      completedRecords: [],
      pendingCount: 2,
      pendingTasks: [],
      workDate: '2026-06-01',
    });

    expect(requestClientMock.get).toHaveBeenCalledWith(
      '/v1/embeddings/workstation-summary',
      {
        params: {
          workDate: '2026-06-01',
        },
      },
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

  it('patches technical specimen registration detail sections with exact path', async () => {
    requestClientMock.request.mockResolvedValue({
      actionFlags: {
        canCompleteRegistration: true,
        canDeleteMediaAssets: true,
        canSaveDetailSections: true,
        canSaveMaterials: true,
        canUploadMediaAssets: true,
      },
      detailSections: {
        clinicalExaminationAndSurgeryFindings: '临床检查',
        clinicalSubmissionRequirements: '送检要求',
        externalPathologyDiagnosis: null,
        historySummary: '病史摘要',
        infectiousAndPastHistorySummary: '既往信息',
        labAndImagingExaminations: '检验检查',
      },
    });

    await saveTechnicalSpecimenRegistrationDetailSections('CASE-001', {
      detailSections: {
        clinicalExaminationAndSurgeryFindings: '临床检查',
        clinicalSubmissionRequirements: '送检要求',
        externalPathologyDiagnosis: null,
        historySummary: '病史摘要',
        infectiousAndPastHistorySummary: '既往信息',
        labAndImagingExaminations: '检验检查',
      },
      terminalCode: 'T-1',
    });

    expect(requestClientMock.request).toHaveBeenCalledWith(
      '/v1/technical-specimen-registrations/CASE-001/detail-sections',
      {
        data: {
          detailSections: {
            clinicalExaminationAndSurgeryFindings: '临床检查',
            clinicalSubmissionRequirements: '送检要求',
            externalPathologyDiagnosis: null,
            historySummary: '病史摘要',
            infectiousAndPastHistorySummary: '既往信息',
            labAndImagingExaminations: '检验检查',
          },
          terminalCode: 'T-1',
        },
        method: 'PATCH',
      },
    );
  });

  it('queries and saves the receive-scoped application workbench with exact paths', async () => {
    requestClientMock.get.mockResolvedValueOnce({
      applicationId: 'APP-001',
      patientInfo: {
        applicationNo: 'APP-001',
        patientName: '患者甲',
      },
    });
    requestClientMock.request.mockResolvedValueOnce({
      applicationId: 'APP-001',
      patientInfo: {
        applicationNo: 'APP-001',
        clinicalDiagnosis: '更新后的诊断',
        patientName: '患者甲',
      },
    });

    await expect(
      getTechnicalSpecimenRegistrationApplicationWorkbench('CASE-001'),
    ).resolves.toMatchObject({
      applicationId: 'APP-001',
      patientInfo: {
        applicationNo: 'APP-001',
        patientName: '患者甲',
      },
    });

    await expect(
      saveTechnicalSpecimenRegistrationApplicationWorkbenchPatientInfo(
        'CASE-001',
        {
          contagiousSpecimen: {
            hepatitis: false,
            hiv: false,
            isolation: false,
            syphilis: false,
            tuberculosis: false,
          },
          gynecologyInfo: {
            additionalNotes: '',
            hpvResult: '',
            lastMenstrualPeriod: '',
            menopause: false,
            previousCytology: '',
            previousTreatment: '',
            specialConditions: {
              abnormalBleeding: false,
              birthControl: false,
              hormoneReplacement: false,
              hysterectomy: false,
              iud: false,
              lactation: false,
              menopause: false,
              other: '',
              pregnancy: false,
              radiotherapy: false,
            },
          },
          patientInfo: {
            age: '',
            applicationDate: '',
            applicationNo: 'APP-001',
            applyDept: '',
            applyDoctor: '',
            bedNo: '',
            checkItem: '',
            clinicalDiagnosis: '更新后的诊断',
            clinicalHistory: '',
            deliveryRequirement: '',
            endoscopyDiagnosis: '',
            frozenReminder: false,
            gender: '',
            idNo: '',
            imagingResult: '',
            inpatientNo: '',
            patientName: '患者甲',
            patientVerified: false,
            phone: '',
            registrationStatus: '',
            remark: '',
            specimenType: '',
            wardName: '',
          },
          surgeryInfo: {
            buildingId: '',
            clinicalFindings: '',
            fixativeType: '',
            fixationPerson: '',
            fixationTime: '',
            roomId: '',
            specimenRemovalTime: '',
            surgeryName: '',
          },
        },
      ),
    ).resolves.toMatchObject({
      applicationId: 'APP-001',
      patientInfo: {
        clinicalDiagnosis: '更新后的诊断',
      },
    });

    expect(requestClientMock.get).toHaveBeenCalledWith(
      '/v1/technical-specimen-registrations/CASE-001/application-workbench',
    );
    expect(requestClientMock.request).toHaveBeenCalledWith(
      '/v1/technical-specimen-registrations/CASE-001/application-workbench/patient-info',
      {
        data: expect.objectContaining({
          patientInfo: expect.objectContaining({
            clinicalDiagnosis: '更新后的诊断',
          }),
        }),
        method: 'PATCH',
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
    requestClientMock.get.mockResolvedValueOnce({
      caseSummary: {
        caseId: 'CASE-1',
      },
      tracking: {
        caseId: 'CASE-1',
      },
    });

    await getGrossingWorkbenchContext('TASK/1');
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

    expect(requestClientMock.get).toHaveBeenCalledWith(
      '/v1/grossings/TASK%2F1/context',
    );
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

  it('queries slicing workbench with dedicated aggregate params', async () => {
    requestClientMock.get.mockResolvedValue({
      completedTodayList: [],
      pendingList: [],
      stats: {},
    });

    await getSlicingWorkbench({
      completedPage: 2,
      completedSize: 10,
      keyword: 'BL-001',
      overdueOnly: true,
      pendingPage: 1,
      pendingSize: 20,
      pendingTodayOnly: true,
    });

    expect(requestClientMock.get).toHaveBeenCalledWith(
      '/v1/slicings/workbench',
      {
        params: {
          completedPage: 2,
          completedSize: 10,
          keyword: 'BL-001',
          overdueOnly: true,
          pendingPage: 1,
          pendingSize: 20,
          pendingTodayOnly: true,
        },
      },
    );
  });

  it('posts slide qc evaluation endpoint with exact path', async () => {
    await createSlideQcEvaluation({
      caseId: 'CASE-1',
      evaluationResult: 'UNQUALIFIED',
      issueDescription: '切片有折痕',
      qcType: 'HE',
      slideId: 'SLIDE-1',
      specimenId: 'SPEC-1',
    });

    expect(requestClientMock.post).toHaveBeenCalledWith(
      '/v1/slide-qc-evaluations',
      {
        caseId: 'CASE-1',
        evaluationResult: 'UNQUALIFIED',
        issueDescription: '切片有折痕',
        qcType: 'HE',
        slideId: 'SLIDE-1',
        specimenId: 'SPEC-1',
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
