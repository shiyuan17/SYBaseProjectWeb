import type { Mock } from 'vitest';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestClient } from '#/api/request';

import {
  importHistoricalReports,
  listBillingRecords,
  listHistoricalImportJobs,
  listHistoricalReports,
  listIntegrationTasks,
  mapBillingRecordResponse,
  mapHistoricalImportJobResponse,
  mapHistoricalReportResponse,
  mapIntegrationTaskResponse,
  mapReconciliationResponse,
  receiveBillingReceipt,
  reconcileBilling,
  retryBilling,
} from './m6-management-service';

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

describe('m6-management-service mappers', () => {
  it('normalizes integration task payloads', () => {
    expect(mapIntegrationTaskResponse({ id: 'TASK-1' })).toEqual({
      businessId: '',
      businessType: '',
      compensationStatus: '',
      createdAt: '',
      externalSystem: '',
      id: 'TASK-1',
      lastAttemptAt: '',
      lastErrorCode: '',
      lastErrorMessage: '',
      maxRetryCount: 0,
      nextRetryAt: '',
      reconciliationStatus: '',
      requestPayload: '',
      resolvedAt: '',
      responsePayload: '',
      retryCount: 0,
      stageCode: '',
      taskStatus: '',
      taskType: '',
      updatedAt: '',
    });
  });

  it('normalizes billing, history and reconcile responses', () => {
    expect(mapBillingRecordResponse({ id: 'BILL-1' })).toMatchObject({
      id: 'BILL-1',
      billingStatus: '',
      amount: '',
    });
    expect(mapHistoricalImportJobResponse({ id: 'JOB-1' })).toMatchObject({
      id: 'JOB-1',
      importStatus: '',
      totalCount: 0,
    });
    expect(
      mapHistoricalReportResponse({
        id: 'REPORT-1',
        versions: [
          {
            createdAt: '',
            finalDiagnosis: '',
            id: 'VER-1',
            reportSummary: '',
            versionNo: 2,
          },
        ],
      }),
    ).toMatchObject({
      id: 'REPORT-1',
      versions: [{ id: 'VER-1', versionNo: 2 }],
    });
    expect(mapReconciliationResponse({ matchedCount: 2 })).toEqual({
      discrepancyCount: 0,
      from: '',
      matchedCount: 2,
      to: '',
      totalCount: 0,
    });
  });
});

describe('m6-management-service requests', () => {
  it('queries integration, billing and history endpoints with backend parameter names', async () => {
    requestClientMock.get
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    await listIntegrationTasks({
      businessId: 'BUS-1',
      businessType: 'BILLING_RECORD',
      compensationStatus: 'RETRY_PENDING',
      externalSystem: 'MOCK_BILLING',
      reconciliationStatus: 'MATCHED',
      stageCode: 'REPORT_PUBLISH',
      taskStatus: 'FAILED',
      taskType: 'BILLING_SUBMIT',
    });
    await listBillingRecords({
      billingStage: 'SPECIAL_ORDER',
      billingStatus: 'FAILED',
      caseId: 'CASE-1',
      externalSystem: 'MOCK_BILLING',
      from: '2026-05-01T00:00:00',
      orderId: 'ORDER-1',
      to: '2026-05-26T23:59:59',
    });
    await listHistoricalImportJobs({
      applicationNo: 'APP-1',
      importStatus: 'COMPLETED',
      pathologyNo: 'PATH-1',
      patientId: 'PAT-1',
      sourceSystem: 'MOCK_HIS',
    });
    await listHistoricalReports({
      applicationNo: 'APP-1',
      externalReportNo: 'HIS-RPT-001',
      from: '2026-05-01T00:00:00',
      pathologyNo: 'PATH-1',
      patientId: 'PAT-1',
      sourceSystem: 'MOCK_HIS',
      to: '2026-05-26T23:59:59',
    });

    expect(requestClientMock.get).toHaveBeenNthCalledWith(1, '/v1/integration-tasks', {
      params: {
        businessId: 'BUS-1',
        businessType: 'BILLING_RECORD',
        compensationStatus: 'RETRY_PENDING',
        externalSystem: 'MOCK_BILLING',
        reconciliationStatus: 'MATCHED',
        stageCode: 'REPORT_PUBLISH',
        taskStatus: 'FAILED',
        taskType: 'BILLING_SUBMIT',
      },
    });
    expect(requestClientMock.get).toHaveBeenNthCalledWith(2, '/v1/billing-records', {
      params: {
        billingStage: 'SPECIAL_ORDER',
        billingStatus: 'FAILED',
        caseId: 'CASE-1',
        externalSystem: 'MOCK_BILLING',
        from: '2026-05-01T00:00:00',
        orderId: 'ORDER-1',
        to: '2026-05-26T23:59:59',
      },
    });
    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      3,
      '/v1/historical-report-import-jobs',
      {
        params: {
          applicationNo: 'APP-1',
          importStatus: 'COMPLETED',
          pathologyNo: 'PATH-1',
          patientId: 'PAT-1',
          sourceSystem: 'MOCK_HIS',
        },
      },
    );
    expect(requestClientMock.get).toHaveBeenNthCalledWith(4, '/v1/historical-reports', {
      params: {
        applicationNo: 'APP-1',
        externalReportNo: 'HIS-RPT-001',
        from: '2026-05-01T00:00:00',
        pathologyNo: 'PATH-1',
        patientId: 'PAT-1',
        sourceSystem: 'MOCK_HIS',
        to: '2026-05-26T23:59:59',
      },
    });
  });

  it('posts billing and history action endpoints with exact paths', async () => {
    requestClientMock.post.mockResolvedValue({});

    await receiveBillingReceipt('BILL/1', {
      billingStatus: 'SUCCESS',
      externalBillNo: 'EXT-1',
      operatorName: 'admin',
    });
    await retryBilling('BILL-2', {
      operatorName: 'admin',
      operatorUserId: 'USER-ADMIN',
    });
    await reconcileBilling({
      from: '2026-05-01T00:00:00',
      operatorName: 'admin',
      operatorUserId: 'USER-ADMIN',
      to: '2026-05-26T23:59:59',
    });
    await importHistoricalReports({
      operatorName: 'archive-user',
      operatorUserId: 'USER-ARCHIVE',
      remarks: 'first import',
      sourceSystem: 'MOCK_HIS',
    });

    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      1,
      '/v1/billing-records/BILL%2F1/receipt',
      {
        billingStatus: 'SUCCESS',
        externalBillNo: 'EXT-1',
        operatorName: 'admin',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/billing-records/BILL-2/retry',
      {
        operatorName: 'admin',
        operatorUserId: 'USER-ADMIN',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      3,
      '/v1/billing-records/reconcile',
      {
        from: '2026-05-01T00:00:00',
        operatorName: 'admin',
        operatorUserId: 'USER-ADMIN',
        to: '2026-05-26T23:59:59',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      4,
      '/v1/historical-report-import-jobs',
      {
        operatorName: 'archive-user',
        operatorUserId: 'USER-ARCHIVE',
        remarks: 'first import',
        sourceSystem: 'MOCK_HIS',
      },
    );
  });
});
