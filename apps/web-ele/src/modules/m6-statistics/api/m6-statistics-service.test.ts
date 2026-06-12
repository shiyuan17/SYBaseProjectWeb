import type { Mock } from 'vitest';

import type { StatReportDetailQuery } from '../types/m6-statistics';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestClient } from '#/api/request';

import {
  exportStatReport,
  exportStatReportDetails,
  listStatIndicators,
  listStatReportTemplates,
  queryStatDashboard,
  queryStatReport,
  queryStatReportDetails,
} from './m6-statistics-service';

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

describe('m6-statistics-service', () => {
  it('loads and normalizes statistic indicators', async () => {
    requestClientMock.get.mockResolvedValue([
      {
        id: 'IND-1',
        indicatorCode: 'QUALITY_RATE',
        indicatorName: 'Quality rate',
      },
      {},
    ]);

    await expect(listStatIndicators('QUALITY')).resolves.toEqual([
      {
        aggregationType: '',
        description: '',
        enabled: false,
        id: 'IND-1',
        indicatorCategory: 'QUALITY',
        indicatorCode: 'QUALITY_RATE',
        indicatorName: 'Quality rate',
        metricScope: '',
        sortOrder: 0,
      },
      {
        aggregationType: '',
        description: '',
        enabled: false,
        id: '',
        indicatorCategory: 'QUALITY',
        indicatorCode: '',
        indicatorName: '',
        metricScope: '',
        sortOrder: 0,
      },
    ]);
    expect(requestClientMock.get).toHaveBeenCalledWith('/v1/stat-indicators', {
      params: { category: 'QUALITY' },
    });
  });

  it('loads and normalizes statistic report templates', async () => {
    requestClientMock.get.mockResolvedValue([
      {
        enabled: true,
        id: 'TPL-1',
        templateCode: 'QUALITY_MONTHLY',
        templateName: 'Quality monthly',
        templateType: 'QUALITY',
      },
      {},
    ]);

    await expect(listStatReportTemplates('QUALITY')).resolves.toEqual([
      {
        defaultColumns: '',
        enabled: true,
        id: 'TPL-1',
        indicatorCode: null,
        parameterSchema: '',
        sortOrder: 0,
        templateCode: 'QUALITY_MONTHLY',
        templateName: 'Quality monthly',
        templateType: 'QUALITY',
      },
      {
        defaultColumns: '',
        enabled: false,
        id: '',
        indicatorCode: null,
        parameterSchema: '',
        sortOrder: 0,
        templateCode: '',
        templateName: '',
        templateType: 'QUALITY',
      },
    ]);
    expect(requestClientMock.get).toHaveBeenCalledWith(
      '/v1/stat-report-templates',
      {
        params: { templateType: 'QUALITY' },
      },
    );
  });

  it('queries and exports statistic reports with stable endpoints', async () => {
    const payload = {
      category: 'QUALITY',
      departmentId: 'DEP-1',
      templateCode: 'QUALITY_MONTHLY',
    };
    const reportBlob = new Blob(['csv']);

    requestClientMock.post.mockResolvedValue({
      columns: ['indicatorCode', 'indicatorName', 'metricStatus'],
      rows: [
        {
          breakdowns: [
            {
              label: '已发布',
              value: '49',
            },
          ],
          denominator: '50',
          indicatorCode: 'QUALITY_RATE',
          indicatorName: 'Quality rate',
          metricStatus: 'AVAILABLE',
          metricUnit: '%',
          metricValue: '98',
          numerator: '49',
          sourceNote: '来自真实报告数据',
          trendPoints: [
            {
              label: '2026-05',
              value: '98',
            },
          ],
        },
      ],
    });
    requestClientMock.download.mockResolvedValue(reportBlob);

    await expect(queryStatReport(payload)).resolves.toEqual({
      columns: ['indicatorCode', 'indicatorName', 'metricStatus'],
      reportCode: '',
      rows: [
        {
          breakdowns: [
            {
              label: '已发布',
              value: '49',
            },
          ],
          denominator: '50',
          indicatorCode: 'QUALITY_RATE',
          indicatorName: 'Quality rate',
          metricStatus: 'AVAILABLE',
          metricUnit: '%',
          metricValue: '98',
          numerator: '49',
          sourceNote: '来自真实报告数据',
          trendPoints: [
            {
              label: '2026-05',
              value: '98',
            },
          ],
        },
      ],
    });
    await expect(exportStatReport(payload)).resolves.toBe(reportBlob);

    expect(requestClientMock.post).toHaveBeenCalledWith(
      '/v1/stat-reports/query',
      payload,
    );
    expect(requestClientMock.download).toHaveBeenCalledWith(
      '/v1/stat-reports/export',
      {
        data: payload,
        method: 'POST',
        responseReturn: 'body',
      },
    );
  });

  it('queries and normalizes statistic dashboard overview cards', async () => {
    requestClientMock.post
      .mockResolvedValueOnce({
        rows: [
          {
            indicatorCode: 'QC_FROZEN_PARAFFIN_MATCH_RATE',
            indicatorName: '冰冻石蜡符合率',
            metricStatus: 'UNAVAILABLE',
            sourceNote: '数据源未接入',
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            indicatorCode: 'OP_CASE_VOLUME',
            indicatorName: '业务量',
            metricStatus: 'AVAILABLE',
            metricUnit: 'COUNT',
            metricValue: 8,
            sourceNote: 'pathology_cases',
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            indicatorCode: 'WL_DIAGNOSTIC_TASK_COUNT',
            indicatorName: '诊断任务数',
            metricValue: '3',
          },
        ],
      });

    await expect(
      queryStatDashboard({
        departmentId: 'DEPT-1',
        from: '2026-01-01T00:00:00',
        to: '2026-12-31T23:59:59',
      }),
    ).resolves.toEqual({
      operationCards: [
        {
          indicatorCategory: 'OPERATION',
          indicatorCode: 'OP_CASE_VOLUME',
          indicatorName: '业务量',
          metricStatus: 'AVAILABLE',
          metricUnit: 'COUNT',
          metricValue: '8',
          sourceNote: 'pathology_cases',
        },
      ],
      qualityCards: [
        {
          indicatorCategory: 'QUALITY',
          indicatorCode: 'QC_FROZEN_PARAFFIN_MATCH_RATE',
          indicatorName: '冰冻石蜡符合率',
          metricStatus: 'UNAVAILABLE',
          metricUnit: '',
          metricValue: '',
          sourceNote: '数据源未接入',
        },
      ],
      summaryCards: [
        {
          indicatorCategory: 'OPERATION',
          indicatorCode: 'OP_CASE_VOLUME',
          indicatorName: '业务量',
          metricStatus: 'AVAILABLE',
          metricUnit: 'COUNT',
          metricValue: '8',
          sourceNote: 'pathology_cases',
        },
        {
          indicatorCategory: 'WORKLOAD',
          indicatorCode: 'WL_DIAGNOSTIC_TASK_COUNT',
          indicatorName: '诊断任务数',
          metricStatus: undefined,
          metricUnit: '',
          metricValue: '3',
          sourceNote: null,
        },
      ],
      workloadCards: [
        {
          indicatorCategory: 'WORKLOAD',
          indicatorCode: 'WL_DIAGNOSTIC_TASK_COUNT',
          indicatorName: '诊断任务数',
          metricStatus: undefined,
          metricUnit: '',
          metricValue: '3',
          sourceNote: null,
        },
      ],
    });

    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      1,
      '/v1/stat-reports/query',
      {
        category: 'QUALITY',
        departmentId: 'DEPT-1',
        from: '2026-01-01T00:00:00',
        to: '2026-12-31T23:59:59',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/stat-reports/query',
      {
        category: 'OPERATION',
        departmentId: 'DEPT-1',
        from: '2026-01-01T00:00:00',
        to: '2026-12-31T23:59:59',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      3,
      '/v1/stat-reports/query',
      {
        category: 'WORKLOAD',
        departmentId: 'DEPT-1',
        from: '2026-01-01T00:00:00',
        to: '2026-12-31T23:59:59',
      },
    );
    expect(requestClientMock.post).not.toHaveBeenCalledWith(
      '/v1/stat-dashboard/query',
      expect.anything(),
    );
  });

  it('queries and exports statistic report details without patient-sensitive fields', async () => {
    const payload: StatReportDetailQuery = {
      detailType: 'REPORT_REVISION',
      from: '2026-01-01T00:00:00',
      page: 1,
      size: 10,
      to: '2026-12-31T23:59:59',
    };
    const detailBlob = new Blob(['detail csv']);

    requestClientMock.post.mockResolvedValue({
      availabilityStatus: 'AVAILABLE',
      detailType: 'REPORT_REVISION',
      items: [
        {
          applicationNo: 'APP-M6-001',
          detailType: 'REPORT_REVISION',
          occurredAt: '2026-06-01T10:00:00',
          pathologyNo: 'BC-M6-001',
          patientName: 'should be ignored',
          reason: '诊断术语修正',
          richTextContent: '<p>should be ignored</p>',
          sourceNote: 'report_revision_requests',
          status: 'PENDING',
        },
      ],
      page: 1,
      reasonDistribution: [{ count: 2, reason: '诊断术语修正' }],
      size: 10,
      sourceNote: 'report_revision_requests',
      total: 2,
    });
    requestClientMock.download.mockResolvedValue(detailBlob);

    await expect(queryStatReportDetails(payload)).resolves.toEqual({
      availabilityStatus: 'AVAILABLE',
      detailType: 'REPORT_REVISION',
      items: [
        {
          applicationNo: 'APP-M6-001',
          detailType: 'REPORT_REVISION',
          occurredAt: '2026-06-01T10:00:00',
          pathologyNo: 'BC-M6-001',
          reason: '诊断术语修正',
          sourceNote: 'report_revision_requests',
          status: 'PENDING',
        },
      ],
      page: 1,
      reasonDistribution: [{ count: 2, reason: '诊断术语修正' }],
      size: 10,
      sourceNote: 'report_revision_requests',
      total: 2,
    });
    await expect(exportStatReportDetails(payload)).resolves.toBe(detailBlob);

    expect(requestClientMock.post).toHaveBeenCalledWith(
      '/v1/stat-report-details/query',
      payload,
    );
    expect(requestClientMock.download).toHaveBeenCalledWith(
      '/v1/stat-report-details/export',
      {
        data: payload,
        method: 'POST',
        responseReturn: 'body',
      },
    );
  });
});
