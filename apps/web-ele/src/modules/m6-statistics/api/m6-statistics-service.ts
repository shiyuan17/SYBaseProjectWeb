import type {
  StatIndicatorView,
  StatReportQuery,
  StatReportResult,
  StatReportTemplateView,
} from '../types/m6-statistics';

import { requestClient } from '#/api/request';

type IndicatorListResponse = Partial<StatIndicatorView>[];
type StatReportResponse = Partial<StatReportResult>;
type TemplateListResponse = Partial<StatReportTemplateView>[];

function mapIndicator(item: Partial<StatIndicatorView>): StatIndicatorView {
  return {
    aggregationType: item.aggregationType ?? '',
    description: item.description ?? '',
    enabled: item.enabled ?? false,
    id: item.id ?? '',
    indicatorCategory: (item.indicatorCategory ?? 'QUALITY') as StatIndicatorView['indicatorCategory'],
    indicatorCode: item.indicatorCode ?? '',
    indicatorName: item.indicatorName ?? '',
    metricScope: item.metricScope ?? '',
    sortOrder: item.sortOrder ?? 0,
  };
}

function mapTemplate(
  item: Partial<StatReportTemplateView>,
): StatReportTemplateView {
  return {
    defaultColumns: item.defaultColumns ?? '',
    enabled: item.enabled ?? false,
    id: item.id ?? '',
    indicatorCode: item.indicatorCode ?? null,
    parameterSchema: item.parameterSchema ?? '',
    sortOrder: item.sortOrder ?? 0,
    templateCode: item.templateCode ?? '',
    templateName: item.templateName ?? '',
    templateType: (item.templateType ?? 'QUALITY') as StatReportTemplateView['templateType'],
  };
}

export async function listStatIndicators(category?: null | string) {
  const response = await requestClient.get<IndicatorListResponse>(
    '/v1/stat-indicators',
    {
      params: {
        category: category || undefined,
      },
    },
  );

  return Array.isArray(response) ? response.map(mapIndicator) : [];
}

export async function listStatReportTemplates(templateType?: null | string) {
  const response = await requestClient.get<TemplateListResponse>(
    '/v1/stat-report-templates',
    {
      params: {
        templateType: templateType || undefined,
      },
    },
  );

  return Array.isArray(response) ? response.map(mapTemplate) : [];
}

export async function queryStatReport(payload: StatReportQuery) {
  const response = await requestClient.post<StatReportResponse>(
    '/v1/stat-reports/query',
    payload,
  );

  return {
    columns: response.columns ?? [],
    reportCode: response.reportCode ?? '',
    rows: response.rows ?? [],
  } satisfies StatReportResult;
}

export async function exportStatReport(payload: StatReportQuery) {
  return requestClient.download('/v1/stat-reports/export', {
    data: payload,
    method: 'POST',
    responseReturn: 'body',
  });
}
