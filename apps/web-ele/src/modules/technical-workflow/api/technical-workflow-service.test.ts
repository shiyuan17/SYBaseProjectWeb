import type { Mock } from 'vitest';

import type { TechnicalSpecimenRegistrationMaterial } from '../types/technical-workflow';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestClient } from '#/api/request';

import {
  assignTechnicalTask,
  cancelEmbedding,
  cancelSlicingSlidePrintMergeGroups,
  cancelTechnicalSpecimenRegistrationMaterialVerification,
  claimTechnicalTask,
  completeDehydration,
  completeDehydrationBatch,
  completeEmbedding,
  completeGrossing,
  completeSlicing,
  completeSlideStaining,
  completeTechnicalSpecimenRegistration,
  createDehydrationBatch,
  createReworkOrder,
  createSlicingSlidePrintMergeGroups,
  createSlideQcEvaluation,
  executeReworkOrder,
  getEmbeddingWorkstationSummary,
  getGrossingWorkbenchContext,
  getSlicingWorkbench,
  getTechnicalSpecimenRegistrationApplicationWorkbench,
  getTechnicalSpecimenRegistrationDetail,
  getTechnicalTracking,
  listPendingTechnicalSpecimenRegistrations,
  listPendingTechnicalTasks,
  listTechnicalSpecimenRegistrations,
  mapEmbeddingWorkstationSummaryResponse,
  mapGrossingWorkbenchContextResponse,
  mapPendingTechnicalSpecimenRegistrationPageResponse,
  mapPendingTechnicalTaskPageResponse,
  mapSlicingWorkbenchResponse,
  mapTechnicalSpecimenRegistrationDetailResponse,
  mapTechnicalSpecimenRegistrationWorkspaceResponse,
  mapTechnicalTrackingResponse,
  printSlicingSlideMergeGroup,
  printSlicingSlides,
  releaseTechnicalTask,
  saveTechnicalSpecimenRegistrationApplicationWorkbenchPatientInfo,
  saveTechnicalSpecimenRegistrationDetailSections,
  startDehydration,
  startDehydrationBatch,
  startEmbedding,
  startGrossing,
  startSlicing,
  startSlideStaining,
  updateEmbeddingQualityReview,
  updateTechnicalTaskPriority,
  updateTechnicalTaskRemarks,
  verifyTechnicalSpecimenRegistrationMaterial,
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
        patientIdDisplay: null,
        patientName: null,
        submittingDepartmentName: null,
      },
      checkItems: [],
      clinicalDiagnosis: null,
      clinicalHistory: null,
      clinicalSubmissionRequirements: null,
      contextSummary: null,
      externalPathologyDiagnosis: null,
      infectiousAndPastHistorySummary: null,
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
          applicationType: null,
          caseId: 'CASE-1',
          combinedSlide: false,
          completedAt: null,
          embeddingBoxId: '',
          embeddingBoxIds: [],
          embeddingBoxNo: null,
          embeddingClearRemark: null,
          embeddingRemarks: null,
          embeddingEvaluation: null,
          embeddingOperatorName: null,
          grossingEvaluation: null,
          pathologyNo: null,
          patientId: null,
          patientIdDisplay: null,
          patientName: null,
          printGroupId: null,
          selectable: false,
          shiftRemark: null,
          slideId: null,
          slideNo: null,
          slidePrintStatus: null,
          sliceNotice: null,
          slicingOperatorName: null,
          slicingRemark: null,
          specimenId: null,
          specimenName: null,
          submittingDepartmentName: null,
          taskId: 'TASK-1',
          taskIds: [],
          taskStatus: null,
          timedOut: false,
          mergedPrintGroup: false,
          printedSlideCount: 0,
        },
      ],
      pendingPrintList: [
        {
          applicationType: null,
          caseId: 'CASE-1',
          combinedSlide: false,
          completedAt: null,
          embeddingBoxId: '',
          embeddingBoxIds: [],
          embeddingBoxNo: null,
          embeddingClearRemark: null,
          embeddingRemarks: null,
          embeddingEvaluation: null,
          embeddingOperatorName: null,
          grossingEvaluation: null,
          pathologyNo: null,
          patientId: null,
          patientIdDisplay: null,
          patientName: null,
          printGroupId: null,
          selectable: false,
          shiftRemark: null,
          slideId: null,
          slideNo: null,
          slidePrintStatus: null,
          sliceNotice: null,
          slicingOperatorName: null,
          slicingRemark: null,
          specimenId: null,
          specimenName: null,
          submittingDepartmentName: null,
          taskId: 'TASK-1',
          taskIds: [],
          taskStatus: null,
          timedOut: false,
          mergedPrintGroup: false,
          printedSlideCount: 0,
        },
      ],
      pendingPrintTotal: 0,
      pendingPage: 1,
      pendingSize: 20,
      pendingSliceList: [],
      pendingSliceTotal: 0,
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

  it('maps slicing workbench print row embedding fields', () => {
    expect(
      mapSlicingWorkbenchResponse({
        pendingPrintList: [
          {
            caseId: 'CASE-1',
            combinedSlide: false,
            embeddingBoxId: 'BOX-1',
            embeddingBoxIds: ['BOX-1', 'BOX-2'],
            embeddingBoxNo: 'A1',
            embeddingRemarks: '包埋备注',
            mergedPrintGroup: true,
            printGroupId: 'GROUP-1',
            printedSlideCount: 0,
            selectable: true,
            submittingDepartmentName: '急诊科',
            taskId: 'TASK-1',
            taskIds: ['TASK-1', 'TASK-2'],
            timedOut: false,
          },
        ],
      }).pendingPrintList[0],
    ).toMatchObject({
      embeddingBoxId: 'BOX-1',
      embeddingBoxIds: ['BOX-1', 'BOX-2'],
      embeddingBoxNo: 'A1',
      embeddingRemarks: '包埋备注',
      mergedPrintGroup: true,
      printGroupId: 'GROUP-1',
      submittingDepartmentName: '急诊科',
      taskId: 'TASK-1',
      taskIds: ['TASK-1', 'TASK-2'],
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
      patientIdDisplay: null,
      patientName: null,
      receivedAt: null,
      registeredAt: null,
      registeredByName: null,
      registrationRemarks: null,
      registrationStatus: null,
      submittingDepartmentName: null,
    });
  });

  it('normalizes specimen registration material defaults and extended fields', () => {
    const materials: Partial<TechnicalSpecimenRegistrationMaterial>[] = [
      {
        sequenceNo: 1,
        sourcePart: '左甲状腺',
        specimenBarcode: 'BC-1',
        specimenId: 'SP-1',
        specimenName: '组织块',
      },
      {
        evaluationItems: ['密封不严'],
        frozen: true,
        sequenceNo: 2,
        sourcePart: '右甲状腺',
        specimenBarcode: 'BC-2',
        specimenId: 'SP-2',
        specimenName: '细胞样本',
        specimenSize: '大标本',
        specimenType: '细胞学',
        tissueCount: 3,
        verificationCompletedAt: '2026-06-02T11:30:00',
        verificationStatus: 'VERIFIED',
        verifiedByName: 'Receiver A',
      },
    ];

    expect(
      mapTechnicalSpecimenRegistrationWorkspaceResponse({
        materials: materials as TechnicalSpecimenRegistrationMaterial[],
      }).materials,
    ).toEqual([
      {
        evaluationItems: [],
        frozen: false,
        sequenceNo: 1,
        sourcePart: '左甲状腺',
        specimenBarcode: 'BC-1',
        specimenId: 'SP-1',
        specimenName: '组织块',
        specimenSize: '小标本',
        specimenType: '活体',
        tissueCount: 1,
        verificationCompletedAt: null,
        verificationStatus: 'UNVERIFIED',
        verifiedByName: null,
      },
      {
        evaluationItems: ['密封不严'],
        frozen: true,
        sequenceNo: 2,
        sourcePart: '右甲状腺',
        specimenBarcode: 'BC-2',
        specimenId: 'SP-2',
        specimenName: '细胞样本',
        specimenSize: '大标本',
        specimenType: '细胞学',
        tissueCount: 3,
        verificationCompletedAt: '2026-06-02T11:30:00',
        verificationStatus: 'VERIFIED',
        verifiedByName: 'Receiver A',
      },
    ]);
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

  it('maps patientIdDisplay with fallback for technical workflow payloads', () => {
    expect(
      mapPendingTechnicalSpecimenRegistrationPageResponse({
        items: [
          {
            applicationId: 'APP-1',
            applicationNo: 'APP-001',
            applicationType: 'ROUTINE',
            caseId: 'CASE-1',
            checkItem: null,
            inpatientNo: null,
            pathologyNo: null,
            patientAge: null,
            patientGender: null,
            patientId: 'UUID-1',
            patientIdDisplay: '08305',
            patientName: null,
            receivedAt: null,
            registeredAt: null,
            registeredByName: null,
            registrationStatus: null,
            submittingDepartmentName: null,
          },
        ],
      }).items[0],
    ).toMatchObject({
      patientId: 'UUID-1',
      patientIdDisplay: '08305',
    });

    expect(
      mapTechnicalSpecimenRegistrationWorkspaceResponse({
        basicInfo: {
          applicationNo: null,
          applicationType: null,
          fixationTime: null,
          inpatientNo: null,
          pathologyNo: null,
          patientAge: null,
          patientGender: null,
          patientId: 'UUID-2',
          patientIdDisplay: '08306',
          patientName: null,
          registrationStatus: null,
          specimenRemovalTime: null,
          submissionDate: null,
          submittingDepartmentName: null,
          submittingDoctorName: null,
        },
      }).basicInfo,
    ).toMatchObject({
      patientId: 'UUID-2',
      patientIdDisplay: '08306',
    });

    expect(
      mapSlicingWorkbenchResponse({
        pendingList: [
          {
            caseId: 'CASE-2',
            patientId: 'UUID-3',
            patientIdDisplay: '08307',
            taskId: 'TASK-2',
          },
        ],
      }).pendingList[0],
    ).toMatchObject({
      patientId: 'UUID-3',
      patientIdDisplay: '08307',
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

  it('queries embedding workstation summary with optional date range params', async () => {
    requestClientMock.get.mockResolvedValue({
      completedCount: 1,
      pendingCount: 2,
      workDate: '2026-06-01',
    });

    await expect(
      getEmbeddingWorkstationSummary({ workDate: '2026-06-01' }),
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
      applicationType: 'CONSULTATION',
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
        applicationType: 'CONSULTATION',
        remarks: '登记完成',
        terminalCode: 'T-1',
      },
    );
  });

  it('queries technical specimen registrations by registration status', async () => {
    requestClientMock.get.mockResolvedValueOnce({
      items: [],
      page: 1,
      size: 20,
      total: 0,
    });

    await listTechnicalSpecimenRegistrations({
      applicationType: 'ROUTINE',
      keyword: 'BL-001',
      page: 1,
      receivedFrom: '2026-06-01',
      receivedTo: '2026-06-03',
      registrationStatus: 'COMPLETED',
      size: 20,
    });

    expect(requestClientMock.get).toHaveBeenCalledWith(
      '/v1/technical-specimen-registrations',
      {
        params: {
          applicationType: 'ROUTINE',
          keyword: 'BL-001',
          page: 1,
          receivedFrom: '2026-06-01',
          receivedTo: '2026-06-03',
          registrationStatus: 'COMPLETED',
          size: 20,
        },
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
    await updateTechnicalTaskRemarks('TASK-5', {
      productionRemarks: '未脱钙',
      remarks: '复核备注',
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
    expect(requestClientMock.request).toHaveBeenCalledWith(
      '/v1/technical-tasks/TASK-5/remarks',
      {
        data: {
          productionRemarks: '未脱钙',
          remarks: '复核备注',
        },
        method: 'PATCH',
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

  it('passes workDate when querying technical tracking', async () => {
    requestClientMock.get.mockResolvedValue({
      caseId: 'CASE-001',
      pathologyNo: 'BL-001',
    });

    await getTechnicalTracking('CASE-001', { workDate: '2026-06-01' });

    expect(requestClientMock.get).toHaveBeenCalledWith(
      '/v1/pathology-cases/CASE-001/technical-tracking',
      {
        params: {
          workDate: '2026-06-01',
        },
      },
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
          embeddingBoxes: [
            {
              boxName: '包埋盒 1',
              embeddingBoxNo: 'A1',
              embeddingRemarks: '骨髓',
              sequenceNo: 1,
              status: 'CONFIRMED',
            },
          ],
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
            embeddingBoxes: [
              {
                boxName: '包埋盒 1',
                embeddingBoxNo: 'A1',
                embeddingRemarks: '骨髓',
                sequenceNo: 1,
                status: 'CONFIRMED',
              },
            ],
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

  it('posts task-level dehydration endpoints with exact paths', async () => {
    await startDehydration({
      taskId: 'TASK-DEHYDRATION-1',
      terminalCode: 'TERM-1',
    });
    await completeDehydration({
      remarks: '脱水完成',
      taskId: 'TASK-DEHYDRATION-1',
    });

    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      1,
      '/v1/dehydrations/start',
      {
        taskId: 'TASK-DEHYDRATION-1',
        terminalCode: 'TERM-1',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/dehydrations/complete',
      {
        remarks: '脱水完成',
        taskId: 'TASK-DEHYDRATION-1',
      },
    );
  });

  it('posts specimen registration material verification endpoints with exact paths', async () => {
    requestClientMock.post.mockResolvedValue({
      actionFlags: {},
      materials: [],
    });

    await verifyTechnicalSpecimenRegistrationMaterial('CASE-1', 'SP-1', {
      terminalCode: 'T-M3-SPEC-REG',
    });
    await cancelTechnicalSpecimenRegistrationMaterialVerification(
      'CASE-1',
      'SP-1',
      {
        terminalCode: 'T-M3-SPEC-REG',
      },
    );

    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      1,
      '/v1/technical-specimen-registrations/CASE-1/materials/SP-1/verify',
      { terminalCode: 'T-M3-SPEC-REG' },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/technical-specimen-registrations/CASE-1/materials/SP-1/cancel-verification',
      { terminalCode: 'T-M3-SPEC-REG' },
    );
  });

  it('posts embedding endpoints with exact paths', async () => {
    await startEmbedding({
      taskId: 'TASK-EMB',
    });
    await cancelEmbedding({
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
      '/v1/embeddings/cancel',
      {
        taskId: 'TASK-EMB',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      3,
      '/v1/embeddings/complete',
      {
        blockCount: 1,
        samplingBlockId: 'BLOCK-1',
        taskId: 'TASK-EMB',
      },
    );
  });

  it('patches embedding quality review with exact path and payload', async () => {
    requestClientMock.request.mockResolvedValue({
      record: {
        embeddingId: 'EMB-1',
      },
      reworkStatus: 'COMPLETED',
      reworkType: 'REGROSSING',
    });

    await updateEmbeddingQualityReview('EMB 1', {
      evaluationLevel: 'UNQUALIFIED',
      notifiedGrossingOperator: true,
      samplingEvaluation: '取材评价调整',
      sliceNotice: '皮肤',
      terminalCode: 'T-EMB',
      treatmentAction: 'REGROSSING',
      treatmentRemark: '重新取材',
      unqualifiedReasons: ['组织过厚'],
    });

    expect(requestClientMock.request).toHaveBeenCalledWith(
      '/v1/embeddings/EMB%201/quality-review',
      {
        data: {
          evaluationLevel: 'UNQUALIFIED',
          notifiedGrossingOperator: true,
          samplingEvaluation: '取材评价调整',
          sliceNotice: '皮肤',
          terminalCode: 'T-EMB',
          treatmentAction: 'REGROSSING',
          treatmentRemark: '重新取材',
          unqualifiedReasons: ['组织过厚'],
        },
        method: 'PATCH',
      },
    );
  });

  it('posts slicing endpoints with exact paths', async () => {
    await startSlicing({
      taskId: 'TASK-SLI',
    });
    await completeSlicing({
      embeddingBoxId: 'BOX-1',
      taskId: 'TASK-SLI',
    });
    await printSlicingSlides({
      embeddingBoxId: 'BOX-1',
      mergeAdjacent: true,
      sourceSlideCount: 4,
      taskId: 'TASK-SLI',
    });
    await createSlicingSlidePrintMergeGroups({
      remarks: '两两合片',
      taskIds: ['TASK-A1', 'TASK-A2'],
      terminalCode: 'TERM-1',
    });
    await cancelSlicingSlidePrintMergeGroups({
      printGroupIds: ['GROUP-1'],
      remarks: '取消合片',
      terminalCode: 'TERM-1',
    });
    await printSlicingSlideMergeGroup({
      printGroupId: 'GROUP-1',
      printerCode: 'PRINTER-1',
      remarks: '打印合片',
      terminalCode: 'TERM-1',
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
        taskId: 'TASK-SLI',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      3,
      '/v1/slicings/slide-print',
      {
        embeddingBoxId: 'BOX-1',
        mergeAdjacent: true,
        sourceSlideCount: 4,
        taskId: 'TASK-SLI',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      4,
      '/v1/slicings/slide-print-merge-groups',
      {
        remarks: '两两合片',
        taskIds: ['TASK-A1', 'TASK-A2'],
        terminalCode: 'TERM-1',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      5,
      '/v1/slicings/slide-print-merge-groups/cancel',
      {
        printGroupIds: ['GROUP-1'],
        remarks: '取消合片',
        terminalCode: 'TERM-1',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      6,
      '/v1/slicings/slide-print-merge-groups/print',
      {
        printGroupId: 'GROUP-1',
        printerCode: 'PRINTER-1',
        remarks: '打印合片',
        terminalCode: 'TERM-1',
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
      applicationType: 'ROUTINE',
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
          applicationType: 'ROUTINE',
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
