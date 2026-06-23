import type { Mock } from 'vitest';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestClient } from '#/api/request';

import {
  acceptDiagnosticTask,
  acceptMedicalOrder,
  approveReportRevisionRequest,
  assignDiagnosticTask,
  cancelMedicalOrder,
  commentConsultationParticipant,
  completeConsultation,
  completeMedicalOrder,
  confirmMedicalOrderBilling,
  createConsultation,
  createMedicalOrder,
  createMedicalOrderQcEvaluation,
  createPathologyReport,
  createReportRevisionRequest,
  executeMedicalOrderBilling,
  exportRoutineMedicalOrders,
  getCaseLifecycleTracking,
  getDiagnosticWorkbench,
  getLatestMedicalOrderQcEvaluation,
  getReportTracking,
  issueFormalReportVersions,
  listAssignableDiagnosticTasks,
  listCaseReportVersions,
  listFormalReportVersions,
  listMedicalOrderDicts,
  listMedicalOrderPackagesPage,
  listPendingDiagnosticTasks,
  listPendingMedicalOrders,
  mapCaseLifecycleTrackingResponse,
  mapCaseReportVersionSummary,
  mapDiagnosticWorkbenchResponse,
  mapFormalReportVersionBatchActionResult,
  mapFormalReportVersionSummary,
  mapMedicalOrderBillingResponse,
  mapMedicalOrderPackagePageResponse,
  mapPendingDiagnosticTaskPageResponse,
  mapPendingMedicalOrderPageResponse,
  mapReportTrackingResponse,
  mergeRoutineMedicalOrderSlides,
  printFormalReportVersions,
  printMedicalOrderSlide,
  publishPathologyReport,
  recallFormalReportVersions,
  rejectPathologyReport,
  rejectReportRevisionRequest,
  reviewPathologyReport,
  savePathologyReportDraft,
  signPathologyReport,
  startDiagnosticTask,
  submitPathologyReport,
  terminateMedicalOrder,
  unmergeRoutineMedicalOrderSlides,
} from './doctor-workflow-service';

vi.mock('#/api/request', () => ({
  requestClient: {
    download: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const requestClientMock = requestClient as unknown as {
  download: Mock;
  get: Mock;
  post: Mock;
};

beforeEach(() => {
  requestClientMock.download.mockReset();
  requestClientMock.get.mockReset();
  requestClientMock.post.mockReset();
});

describe('doctor-workflow-service mappers', () => {
  it('normalizes pending diagnostic task pagination', () => {
    expect(mapPendingDiagnosticTaskPageResponse({})).toEqual({
      items: [],
      page: 1,
      size: 20,
      total: 0,
    });
  });

  it('normalizes pending diagnostic task summary fields', () => {
    expect(
      mapPendingDiagnosticTaskPageResponse({
        items: [
          {
            applicationType: 'ROUTINE',
            blockCount: 3,
            caseId: 'CASE-001',
            checkItem: '切片检查',
            id: 'TASK-001',
            patientId: 'UUID-001',
            patientIdDisplay: '08305',
            pathologyNo: 'BL202606170001',
            specimenName: '胃窦组织、胃体组织',
            submittingDepartmentName: '消化内科',
            taskStatus: 'PENDING',
            taskType: 'PRIMARY',
          },
        ],
      }),
    ).toEqual({
      items: [
        {
          acceptedAt: null,
          applicationId: null,
          applicationNo: null,
          applicationType: 'ROUTINE',
          assignedAt: null,
          blockCount: 3,
          caseId: 'CASE-001',
          checkItem: '切片检查',
          completedAt: null,
          diagnosisDoctorName: null,
          diagnosisDoctorUserId: null,
          id: 'TASK-001',
          pathologyNo: 'BL202606170001',
          patientId: 'UUID-001',
          patientIdDisplay: '08305',
          patientName: null,
          primaryDoctorName: null,
          primaryDoctorUserId: null,
          remarks: null,
          reportPrintedAt: null,
          reportStatus: null,
          reviewerName: null,
          reviewerUserId: null,
          specimenName: '胃窦组织、胃体组织',
          submittingDepartmentName: '消化内科',
          taskStatus: 'PENDING',
          taskType: 'PRIMARY',
        },
      ],
      page: 1,
      size: 20,
      total: 0,
    });
  });

  it('normalizes pending medical order pagination', () => {
    expect(
      mapPendingMedicalOrderPageResponse({
        items: [
          {
            caseId: 'CASE-001',
            inpatientNo: 'IP-001',
            orderCategoryCode: 'IHC',
            orderCategoryId: 'CAT-IHC',
            orderCategoryName: '免疫组化',
            orderContent: 'CK',
            orderId: 'ORDER-001',
            orderItemCode: 'CK',
            orderItemId: 'ITEM-CK',
            orderItemName: 'CK',
            patientId: 'UUID-001',
            patientIdDisplay: '08305',
            slicingMergedPrintGroup: true,
            slicingPrintGroupId: 'GROUP-001',
            slicingTaskId: 'TASK-001',
            slicingTaskIds: ['TASK-001', 'TASK-002'],
          },
        ],
      }),
    ).toEqual({
      items: [
        {
          caseId: 'CASE-001',
          inpatientNo: 'IP-001',
          orderCategoryCode: 'IHC',
          orderCategoryId: 'CAT-IHC',
          orderCategoryName: '免疫组化',
          orderContent: 'CK',
          orderId: 'ORDER-001',
          orderItemCode: 'CK',
          orderItemId: 'ITEM-CK',
          orderItemName: 'CK',
          patientId: 'UUID-001',
          patientIdDisplay: '08305',
          slicingMergedPrintGroup: true,
          slicingPrintGroupId: 'GROUP-001',
          slicingTaskId: 'TASK-001',
          slicingTaskIds: ['TASK-001', 'TASK-002'],
        },
      ],
      page: 1,
      size: 20,
      total: 0,
    });
  });

  it('normalizes medical order package pagination', () => {
    expect(mapMedicalOrderPackagePageResponse({}, 2, 50)).toEqual({
      items: [],
      page: 2,
      size: 50,
      total: 0,
    });
  });

  it('normalizes medical order billing results', () => {
    expect(
      mapMedicalOrderBillingResponse({
        items: [
          {
            billingRecordId: 'BR-001',
            billingStatus: 'SUCCESS',
            message: 'done',
            orderId: 'ORDER-001',
          },
        ],
        successCount: 1,
        totalCount: 1,
      }),
    ).toEqual({
      failureCount: 0,
      items: [
        {
          billingRecordId: 'BR-001',
          billingStatus: 'SUCCESS',
          message: 'done',
          orderId: 'ORDER-001',
        },
      ],
      successCount: 1,
      totalCount: 1,
    });
  });

  it('normalizes diagnostic workbench arrays and nullable report', () => {
    expect(
      mapDiagnosticWorkbenchResponse({
        caseId: 'CASE-001',
        consultations: [
          {
            consultationId: 'CONS-001',
            participants: [
              {
                commentedAt: '2026-06-15T10:00:00',
                draftedByName: '会诊医生甲',
                opinion: '建议补充免疫组化',
                participantId: 'PART-001',
                participantName: '会诊医生甲',
                participantRole: 'EXPERT',
                participantUserId: 'USER-EXPERT',
              },
            ],
          },
        ],
        pathologyNo: 'BL-001',
      }),
    ).toMatchObject({
      blocks: [],
      caseId: 'CASE-001',
      chargeItems: [],
      consultations: [
        {
          consultationId: 'CONS-001',
          participants: [
            {
              participantId: 'PART-001',
              participantUserId: 'USER-EXPERT',
            },
          ],
        },
      ],
      currentReport: null,
      diagnosticTasks: [],
      hasPendingRevision: false,
      historicalPathologies: [],
      medicalOrders: [],
      pacsExaminations: [],
      pathologyNo: 'BL-001',
      recentEvents: [],
      remarkSections: [],
      reportTraces: [],
      revisions: [],
      slides: [],
      specimens: [],
    });
  });

  it('preserves diagnostic workbench material tabs extension fields', () => {
    expect(
      mapDiagnosticWorkbenchResponse({
        caseId: 'CASE-001',
        chargeItems: [
          {
            chargedAt: '2026-06-01 11:00:00',
            chargedByName: '收费员甲',
            itemName: '免疫组化 CK',
          },
        ],
        historicalPathologies: [
          {
            age: '30岁',
            diagnosis: '历史诊断',
            examinationNo: 'F2600039',
            inpatientNo: 'IP-001',
            reportTime: '2026-05-14 11:40:00',
            submissionType: '冰冻病理',
          },
        ],
        pacsExaminations: [
          {
            examinationNo: 'NPA250003',
            imagingDescription: '影像描述',
            imagingDiagnosis: '影像诊断',
            reportStatus: '未写',
            reportTime: '2026-05-14 12:00:00',
            submissionType: '化验',
          },
        ],
        remarkSections: [
          {
            content: '申请备注',
            sectionKey: 'APPLICATION',
            title: '申请备注',
          },
        ],
        reportTraces: [
          {
            diagnosisInfo: '诊断信息',
            reportDoctorName: '报告医生',
            reportStatus: 'DRAFT',
            reportTime: '2026-06-01 10:20:00',
            sequenceNo: 1,
          },
        ],
      }),
    ).toMatchObject({
      chargeItems: [{ itemName: '免疫组化 CK' }],
      historicalPathologies: [{ examinationNo: 'F2600039' }],
      pacsExaminations: [{ examinationNo: 'NPA250003' }],
      remarkSections: [{ sectionKey: 'APPLICATION' }],
      reportTraces: [{ sequenceNo: 1 }],
    });
  });

  it('normalizes report tracking arrays and version numbers', () => {
    expect(
      mapReportTrackingResponse({
        caseId: 'CASE-001',
        consultations: [
          {
            consultationId: 'CONS-001',
            participants: [
              {
                participantId: 'PART-001',
                participantUserId: 'USER-EXPERT',
              },
            ],
          },
        ],
      }),
    ).toMatchObject({
      caseId: 'CASE-001',
      consultations: [
        {
          consultationId: 'CONS-001',
          participants: [
            {
              participantId: 'PART-001',
              participantUserId: 'USER-EXPERT',
            },
          ],
        },
      ],
      currentDraftVersionNo: null,
      currentReport: null,
      diagnosticTasks: [],
      events: [],
      hasPendingRevision: false,
      latestEffectiveVersionNo: null,
      medicalOrders: [],
      revisions: [],
      versions: [],
    });
  });

  it('normalizes lifecycle tracking arrays and missing nested fields', () => {
    expect(
      mapCaseLifecycleTrackingResponse({
        caseSummary: {
          caseId: 'CASE-001',
          pathologyNo: 'BL-001',
        },
      }),
    ).toMatchObject({
      applicationForm: null,
      caseSummary: {
        caseId: 'CASE-001',
        hasPendingRevision: false,
        pathologyNo: 'BL-001',
      },
      overallTimeline: [],
      reportLifecycle: {
        consultations: [],
        currentReport: null,
        diagnosticTasks: [],
        medicalOrders: [],
        revisions: [],
        versions: [],
      },
      specimens: [],
    });
  });

  it('maps lifecycle tracking nested stage and object trees', () => {
    expect(
      mapCaseLifecycleTrackingResponse({
        applicationForm: {
          archiveStatus: 'IN_STORAGE',
        },
        caseSummary: {
          caseId: 'CASE-001',
        },
        overallTimeline: [
          {
            nodes: [
              {
                keyFacts: [{ label: '节点', value: '值' }],
                operatorDevice: 'Chrome Lifecycle Browser',
                operatorIp: '10.9.0.1',
                status: 'COMPLETED',
                title: '申请创建',
              },
            ],
            stageCode: 'APPLICATION',
            stageTitle: '申请创建',
          },
        ],
        specimens: [
          {
            blocks: [
              {
                blockEvents: [{ keyFacts: [], title: '取材' }],
                blockId: 'BLOCK-1',
                slides: [
                  {
                    slideEvents: [{ keyFacts: [], title: '切片' }],
                    slideId: 'SLIDE-1',
                  },
                ],
              },
            ],
            specimenEvents: [{ keyFacts: [], title: '标本创建' }],
            specimenId: 'SPEC-1',
          },
        ],
      }),
    ).toMatchObject({
      applicationForm: {
        archiveStatus: 'IN_STORAGE',
      },
      overallTimeline: [
        {
          nodes: [
            {
              keyFacts: [{ label: '节点', value: '值' }],
              operatorDevice: 'Chrome Lifecycle Browser',
              operatorIp: '10.9.0.1',
              title: '申请创建',
            },
          ],
          stageCode: 'APPLICATION',
        },
      ],
      specimens: [
        {
          blocks: [
            {
              blockEvents: [{ title: '取材' }],
              blockId: 'BLOCK-1',
              slides: [
                { slideEvents: [{ title: '切片' }], slideId: 'SLIDE-1' },
              ],
            },
          ],
          specimenEvents: [{ title: '标本创建' }],
          specimenId: 'SPEC-1',
        },
      ],
    });
  });

  it('normalizes formal report version items and batch action results', () => {
    expect(
      mapFormalReportVersionSummary({
        deliveryStatus: 'ISSUED',
        reportId: 'REPORT-1',
        reportNo: 'RPT-001',
        versionId: 'RV-1',
        versionNo: 2,
        versionStatus: 'PUBLISHED',
      }),
    ).toEqual({
      deliveryStatus: 'ISSUED',
      issuedAt: null,
      plannedIssueAt: null,
      printStatus: null,
      printedAt: null,
      publishedAt: null,
      recalledAt: null,
      reportId: 'REPORT-1',
      reportNo: 'RPT-001',
      signedAt: null,
      signedByName: null,
      versionId: 'RV-1',
      versionNo: 2,
      versionStatus: 'PUBLISHED',
    });

    expect(
      mapFormalReportVersionBatchActionResult({
        items: [
          {
            message: '报告已发放',
            success: true,
            versionId: 'RV-1',
          },
        ],
        successCount: 1,
        totalCount: 1,
      }),
    ).toEqual({
      failureCount: 0,
      items: [
        {
          message: '报告已发放',
          success: true,
          versionId: 'RV-1',
        },
      ],
      successCount: 1,
      totalCount: 1,
    });
  });

  it('normalizes case report version items', () => {
    expect(
      mapCaseReportVersionSummary({
        deliveryStatus: 'PENDING',
        printStatus: 'UNPRINTED',
        reportId: 'REPORT-1',
        reportNo: 'RPT-001',
        reviewedAt: '2026-06-15T09:50:00',
        submittedAt: '2026-06-15T09:30:00',
        versionId: 'RV-1',
        versionNo: 2,
        versionStatus: 'REVIEWED',
      }),
    ).toEqual({
      deliveryStatus: 'PENDING',
      issuedAt: null,
      plannedIssueAt: null,
      printStatus: 'UNPRINTED',
      printedAt: null,
      publishedAt: null,
      recalledAt: null,
      reportId: 'REPORT-1',
      reportNo: 'RPT-001',
      reviewedAt: '2026-06-15T09:50:00',
      signedAt: null,
      signedByName: null,
      submittedAt: '2026-06-15T09:30:00',
      versionId: 'RV-1',
      versionNo: 2,
      versionStatus: 'REVIEWED',
    });
  });
});

describe('doctor-workflow-service requests', () => {
  it('queries pending diagnostic tasks with backend query names', async () => {
    requestClientMock.get.mockResolvedValue({
      items: [],
      page: 1,
      size: 20,
      total: 0,
    });

    await listPendingDiagnosticTasks({
      page: 1,
      pathologyNo: 'BL-001',
      size: 20,
      taskStatus: 'PENDING',
      taskType: 'PRIMARY',
    });

    expect(requestClientMock.get).toHaveBeenCalledWith(
      '/v1/diagnostic-tasks/pending',
      {
        params: {
          page: 1,
          pathologyNo: 'BL-001',
          size: 20,
          taskStatus: 'PENDING',
          taskType: 'PRIMARY',
        },
      },
    );
  });

  it('passes trimmed pathology number to pending diagnostic task query', async () => {
    requestClientMock.get.mockResolvedValue({
      items: [],
      page: 1,
      size: 20,
      total: 0,
    });

    await listPendingDiagnosticTasks({
      page: 1,
      pathologyNo: 'BL202606030001'.trim(),
      size: 20,
    });

    expect(requestClientMock.get).toHaveBeenCalledWith(
      '/v1/diagnostic-tasks/pending',
      {
        params: {
          page: 1,
          pathologyNo: 'BL202606030001',
          size: 20,
        },
      },
    );
  });

  it('queries assignable diagnostic tasks with assignment endpoint', async () => {
    requestClientMock.get.mockResolvedValue({
      items: [],
      page: 1,
      size: 20,
      total: 0,
    });

    await listAssignableDiagnosticTasks({
      dateFrom: '2026-06-20',
      dateTo: '2026-06-21',
      page: 1,
      pathologyNo: 'BL-001',
      size: 20,
      taskStatus: 'PENDING',
      taskType: 'PRIMARY',
    });

    expect(requestClientMock.get).toHaveBeenCalledWith(
      '/v1/diagnostic-tasks/assignment',
      {
        params: {
          dateFrom: '2026-06-20',
          dateTo: '2026-06-21',
          page: 1,
          pathologyNo: 'BL-001',
          size: 20,
          taskStatus: 'PENDING',
          taskType: 'PRIMARY',
        },
      },
    );
  });

  it('queries pending medical orders with backend query names', async () => {
    requestClientMock.get.mockResolvedValue({
      items: [],
      page: 1,
      size: 20,
      total: 0,
    });

    await listPendingMedicalOrders({
      orderCategoryCode: 'IHC',
      page: 1,
      pathologyNo: 'BL-001',
      size: 20,
      status: 'PENDING',
    });

    expect(requestClientMock.get).toHaveBeenCalledWith(
      '/v1/medical-orders/pending',
      {
        params: {
          orderCategoryCode: 'IHC',
          page: 1,
          pathologyNo: 'BL-001',
          size: 20,
          status: 'PENDING',
        },
      },
    );
  });

  it('posts routine merge and unmerge endpoints with exact payloads', async () => {
    await mergeRoutineMedicalOrderSlides(['ORDER-1', 'ORDER-2']);
    await unmergeRoutineMedicalOrderSlides(['GROUP-1', 'GROUP-2']);

    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      1,
      '/v1/medical-orders/merge-slides',
      {
        orderIds: ['ORDER-1', 'ORDER-2'],
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/medical-orders/unmerge-slides',
      {
        printGroupIds: ['GROUP-1', 'GROUP-2'],
      },
    );
  });

  it('exports routine medical orders with pending query params and blob download contract', async () => {
    const exportBlob = new Blob(['csv'], { type: 'text/csv;charset=utf-8' });
    requestClientMock.download.mockResolvedValue(exportBlob);

    await expect(
      exportRoutineMedicalOrders({
        dateFrom: '2026-06-20',
        dateTo: '2026-06-22',
        page: 1,
        pathologyNo: 'BL-001',
        size: 20,
        status: 'PENDING',
        workDate: '2026-06-22',
      }),
    ).resolves.toBe(exportBlob);

    expect(requestClientMock.download).toHaveBeenCalledWith(
      '/v1/medical-orders/export',
      {
        method: 'GET',
        params: {
          dateFrom: '2026-06-20',
          dateTo: '2026-06-22',
          page: 1,
          pathologyNo: 'BL-001',
          size: 20,
          status: 'PENDING',
          workDate: '2026-06-22',
        },
        responseReturn: 'body',
      },
    );
  });

  it('queries medical order dictionaries and packages with backend paths', async () => {
    requestClientMock.get.mockResolvedValueOnce([]).mockResolvedValueOnce({
      items: [],
      page: 1,
      size: 100,
      total: 0,
    });

    await expect(listMedicalOrderDicts()).resolves.toEqual([]);
    await expect(
      listMedicalOrderPackagesPage({
        enabled: true,
        keyword: '免疫',
        packageType: 'IHC',
        page: 1,
        size: 100,
      }),
    ).resolves.toEqual({
      items: [],
      page: 1,
      size: 100,
      total: 0,
    });

    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      1,
      '/v1/medical-order-dicts',
    );
    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      2,
      '/v1/medical-order-packages/page',
      {
        params: {
          enabled: true,
          keyword: '免疫',
          packageType: 'IHC',
          page: 1,
          size: 100,
        },
      },
    );
  });

  it('posts diagnostic task action endpoints with exact paths', async () => {
    await assignDiagnosticTask('TASK-1', {
      diagnosisDoctorName: '责任医生',
      diagnosisDoctorUserId: 'DOC-1',
      primaryDoctorName: '初诊医生',
      primaryDoctorUserId: 'DOC-2',
      reviewerName: '审核医生',
      reviewerUserId: 'DOC-3',
    });
    await acceptDiagnosticTask('TASK-1', { operatorName: '责任医生' });
    await startDiagnosticTask('TASK-1', { operatorName: '责任医生' });

    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      1,
      '/v1/diagnostic-tasks/TASK-1/assign',
      {
        diagnosisDoctorName: '责任医生',
        diagnosisDoctorUserId: 'DOC-1',
        primaryDoctorName: '初诊医生',
        primaryDoctorUserId: 'DOC-2',
        reviewerName: '审核医生',
        reviewerUserId: 'DOC-3',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/diagnostic-tasks/TASK-1/accept',
      { operatorName: '责任医生' },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      3,
      '/v1/diagnostic-tasks/TASK-1/start',
      { operatorName: '责任医生' },
    );
  });

  it('posts medical order endpoints with exact paths', async () => {
    await createMedicalOrder({
      blockNo: 'A1',
      caseId: 'CASE-1',
      orderContent: '补做特殊染色',
      orderItemId: 'ITEM-TSRS-PAS',
      orderType: 'SPECIAL_STAIN',
      targetBlockId: 'BLOCK-1',
      targetBlockNo: 'A1',
    });
    await acceptMedicalOrder('ORDER-1', { terminalCode: 'TERM-1' });
    await completeMedicalOrder('ORDER-1', { remarks: '已完成' });
    await cancelMedicalOrder('ORDER-1', { remarks: '诊断医生取消' });

    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      1,
      '/v1/medical-orders',
      {
        blockNo: 'A1',
        caseId: 'CASE-1',
        orderContent: '补做特殊染色',
        orderItemId: 'ITEM-TSRS-PAS',
        orderType: 'SPECIAL_STAIN',
        targetBlockId: 'BLOCK-1',
        targetBlockNo: 'A1',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/medical-orders/ORDER-1/accept',
      { terminalCode: 'TERM-1' },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      3,
      '/v1/medical-orders/ORDER-1/complete',
      { remarks: '已完成' },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      4,
      '/v1/medical-orders/ORDER-1/cancel',
      { remarks: '诊断医生取消' },
    );
  });

  it('posts routine medical order execution endpoints with exact paths', async () => {
    requestClientMock.post.mockResolvedValueOnce({
      labels: [
        {
          orderId: 'ORDER-1',
          pathologyNo: 'BL-001',
          patientName: '患者甲',
          slideNo: 'SLIDE-001',
        },
      ],
      orderId: 'ORDER-1',
      printedAt: '2026-06-22T10:00:00',
      printedByName: '技师甲',
    });
    requestClientMock.post.mockResolvedValueOnce({
      orderId: 'ORDER-1',
      status: 'TERMINATED',
    });
    requestClientMock.post.mockResolvedValueOnce({
      evaluatedAt: '2026-06-22T10:30:00',
      grade: '甲',
      orderId: 'ORDER-1',
      processingAction: 'FAST_TRACK',
      qcAspect: 'SLIDE',
      qcEvaluationId: 'QC-1',
      totalScore: 98,
    });
    requestClientMock.get.mockResolvedValueOnce({
      evaluatedAt: '2026-06-22T10:30:00',
      grade: '甲',
      orderId: 'ORDER-1',
      processingAction: 'FAST_TRACK',
      qcAspect: 'SLIDE',
      qcEvaluationId: 'QC-1',
      totalScore: 98,
    });

    await expect(
      printMedicalOrderSlide('ORDER-1', {
        terminalCode: 'TERM-PRINT',
      }),
    ).resolves.toMatchObject({
      labels: [{ slideNo: 'SLIDE-001' }],
      orderId: 'ORDER-1',
      printedByName: '技师甲',
    });
    await terminateMedicalOrder('ORDER-1', {
      remarks: '蜡块损坏',
      terminationReasonCode: 'BLOCK_DAMAGED',
      terminationReasonLabel: '蜡块已损坏无法使用',
    });
    await createMedicalOrderQcEvaluation('ORDER-1', {
      caseId: 'CASE-1',
      detailItems: [
        {
          deductionGroup: '切片评价',
          deductionSuggestion: '重切',
          deductionValue: 2,
          itemName: '皱褶',
        },
      ],
      evaluationReason: '皱褶',
      grade: '甲',
      processingAction: 'FAST_TRACK',
      qcAspect: 'SLIDE',
      remarks: '优先处理',
      reworkType: 'RESLICE',
      totalScore: 98,
    });
    await expect(
      getLatestMedicalOrderQcEvaluation('ORDER-1'),
    ).resolves.toMatchObject({
      grade: '甲',
      qcEvaluationId: 'QC-1',
      totalScore: 98,
    });

    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      1,
      '/v1/medical-orders/ORDER-1/print-slide',
      {
        terminalCode: 'TERM-PRINT',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/medical-orders/ORDER-1/terminate',
      {
        remarks: '蜡块损坏',
        terminationReasonCode: 'BLOCK_DAMAGED',
        terminationReasonLabel: '蜡块已损坏无法使用',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      3,
      '/v1/medical-orders/ORDER-1/qc-evaluations',
      {
        caseId: 'CASE-1',
        detailPayload: [
          {
            deductionGroup: '切片评价',
            deductionSuggestion: '重切',
            deductionValue: 2,
            itemName: '皱褶',
          },
        ],
        evaluationReason: '皱褶',
        grade: '甲',
        processingAction: 'FAST_TRACK',
        qcAspect: 'SLIDE',
        remarks: '优先处理',
        totalScore: 98,
      },
    );
    expect(requestClientMock.get).toHaveBeenCalledWith(
      '/v1/medical-orders/ORDER-1/qc-evaluations/latest',
    );
  });

  it('posts medical order billing endpoints with exact paths', async () => {
    requestClientMock.post.mockResolvedValue({
      items: [{ billingStatus: 'SUCCESS', orderId: 'ORDER-1' }],
      successCount: 1,
      totalCount: 1,
    });

    await executeMedicalOrderBilling({
      caseId: 'CASE-1',
      orderIds: ['ORDER-1'],
      remarks: '执行收费',
    });
    await confirmMedicalOrderBilling({
      caseId: 'CASE-1',
      remarks: '确认完成收费',
    });

    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      1,
      '/v1/medical-orders/billing/execute',
      {
        caseId: 'CASE-1',
        orderIds: ['ORDER-1'],
        remarks: '执行收费',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/medical-orders/billing/confirm',
      {
        caseId: 'CASE-1',
        remarks: '确认完成收费',
      },
    );
  });

  it('queries diagnostic aggregate endpoints', async () => {
    requestClientMock.get
      .mockResolvedValueOnce({ caseId: 'CASE-1' })
      .mockResolvedValueOnce({ caseSummary: { caseId: 'CASE-1' } })
      .mockResolvedValueOnce({ caseId: 'CASE-1' })
      .mockResolvedValueOnce([{ reportId: 'REPORT-1', versionId: 'RV-1' }])
      .mockResolvedValueOnce([{ reportId: 'REPORT-1', versionId: 'RV-1' }]);

    await expect(getDiagnosticWorkbench('CASE-1')).resolves.toMatchObject({
      caseId: 'CASE-1',
      diagnosticTasks: [],
    });
    await expect(getCaseLifecycleTracking('CASE-1')).resolves.toMatchObject({
      caseSummary: {
        caseId: 'CASE-1',
      },
    });
    await expect(getReportTracking('CASE-1')).resolves.toMatchObject({
      caseId: 'CASE-1',
      versions: [],
    });
    await expect(listFormalReportVersions('CASE-1')).resolves.toMatchObject([
      {
        reportId: 'REPORT-1',
        versionId: 'RV-1',
      },
    ]);
    await expect(listCaseReportVersions('CASE-1')).resolves.toMatchObject([
      {
        reportId: 'REPORT-1',
        versionId: 'RV-1',
      },
    ]);

    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      1,
      '/v1/pathology-cases/CASE-1/diagnostic-workbench',
    );
    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      2,
      '/v1/pathology-cases/CASE-1/lifecycle-tracking',
    );
    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      3,
      '/v1/pathology-cases/CASE-1/report-tracking',
    );
    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      4,
      '/v1/pathology-cases/CASE-1/formal-report-versions',
    );
    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      5,
      '/v1/pathology-cases/CASE-1/report-versions',
    );
  });

  it('keeps pathology number identifiers in report tracking request paths', async () => {
    requestClientMock.get.mockResolvedValue({ caseId: 'CASE-1' });

    await getReportTracking('BL-202605240003');

    expect(requestClientMock.get).toHaveBeenCalledWith(
      '/v1/pathology-cases/BL-202605240003/report-tracking',
    );
  });

  it('posts pathology report lifecycle endpoints with exact paths', async () => {
    await createPathologyReport({
      caseId: 'CASE-1',
      taskId: 'TASK-1',
    });
    await savePathologyReportDraft('REPORT-1', {
      finalDiagnosis: '诊断',
    });
    await submitPathologyReport('REPORT-1', {});
    await reviewPathologyReport('REPORT-1', {});
    await rejectPathologyReport('REPORT-1', {
      rejectReason: '需补充',
    });
    await signPathologyReport('REPORT-1', {});
    await publishPathologyReport('REPORT-1', {});

    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      1,
      '/v1/pathology-reports',
      {
        caseId: 'CASE-1',
        taskId: 'TASK-1',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/pathology-reports/REPORT-1/save-draft',
      {
        finalDiagnosis: '诊断',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      3,
      '/v1/pathology-reports/REPORT-1/submit',
      {},
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      4,
      '/v1/pathology-reports/REPORT-1/review',
      {},
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      5,
      '/v1/pathology-reports/REPORT-1/reject',
      {
        rejectReason: '需补充',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      6,
      '/v1/pathology-reports/REPORT-1/sign',
      {},
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      7,
      '/v1/pathology-reports/REPORT-1/publish',
      {},
    );
  });

  it('posts formal report batch action endpoints with exact paths', async () => {
    requestClientMock.post.mockResolvedValue({
      items: [{ success: true, versionId: 'RV-1' }],
      successCount: 1,
      totalCount: 1,
    });

    await printFormalReportVersions({ versionIds: ['RV-1'] });
    await issueFormalReportVersions({
      issueMode: 'DELAY_2_HOURS',
      plannedIssueAt: '2026-06-16T12:00:00',
      remarks: '批量发放',
      versionIds: ['RV-1'],
    });
    await recallFormalReportVersions({
      terminalCode: 'TERM-1',
      versionIds: ['RV-1'],
    });

    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      1,
      '/v1/pathology-reports/formal-versions/print',
      { versionIds: ['RV-1'] },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/pathology-reports/formal-versions/issue',
      {
        issueMode: 'DELAY_2_HOURS',
        plannedIssueAt: '2026-06-16T12:00:00',
        remarks: '批量发放',
        versionIds: ['RV-1'],
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      3,
      '/v1/pathology-reports/formal-versions/recall',
      {
        terminalCode: 'TERM-1',
        versionIds: ['RV-1'],
      },
    );
  });

  it('posts revision and consultation endpoints with exact paths', async () => {
    await createReportRevisionRequest({
      operatorName: '医生',
      reportId: 'REPORT-1',
      requestReason: '补充诊断',
    });
    await approveReportRevisionRequest('REV-1', { operatorName: '主任' });
    await rejectReportRevisionRequest('REV-2', {
      operatorName: '主任',
      rejectReason: '理由不足',
    });
    await createConsultation({
      caseId: 'CASE-1',
      operatorName: '医生',
      participants: [
        {
          participantName: '会诊医生',
          participantRole: 'MEMBER',
          participantUserId: 'DOC-2',
        },
      ],
    });
    await commentConsultationParticipant('CONS-1', 'PART-1', {
      operatorName: '会诊医生',
      opinion: '同意',
    });
    await completeConsultation('CONS-1', {
      operatorName: '主持人',
      opinion: '完成',
    });

    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      1,
      '/v1/report-revision-requests',
      {
        operatorName: '医生',
        reportId: 'REPORT-1',
        requestReason: '补充诊断',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/report-revision-requests/REV-1/approve',
      { operatorName: '主任' },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      3,
      '/v1/report-revision-requests/REV-2/reject',
      {
        operatorName: '主任',
        rejectReason: '理由不足',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      4,
      '/v1/consultations',
      {
        caseId: 'CASE-1',
        operatorName: '医生',
        participants: [
          {
            participantName: '会诊医生',
            participantRole: 'MEMBER',
            participantUserId: 'DOC-2',
          },
        ],
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      5,
      '/v1/consultations/CONS-1/participants/PART-1/comment',
      {
        operatorName: '会诊医生',
        opinion: '同意',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      6,
      '/v1/consultations/CONS-1/complete',
      {
        operatorName: '主持人',
        opinion: '完成',
      },
    );
  });
});
