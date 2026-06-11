import type { Mock } from 'vitest';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestClient } from '#/api/request';

import {
  exportStatReport,
  listStatIndicators,
  listStatReportTemplates,
  queryStatReport,
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
});
