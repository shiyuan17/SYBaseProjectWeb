import type {
  StatDashboardCard,
  StatDashboardQuery,
  StatDashboardResult,
  StatIndicatorView,
  StatReportQuery,
  StatReportResult,
  StatReportRow,
  StatReportTemplateView,
} from '../types/m6-statistics';

import { requestClient } from '#/api/request';

type IndicatorListResponse = Partial<StatIndicatorView>[];
type StatDashboardResponse = Partial<
  Record<keyof StatDashboardResult, Partial<StatDashboardCard>[]>
>;
type StatReportResponse = Partial<StatReportResult>;
type TemplateListResponse = Partial<StatReportTemplateView>[];

function mapIndicator(item: Partial<StatIndicatorView>): StatIndicatorView {
  return {
    aggregationType: item.aggregationType ?? '',
    description: item.description ?? '',
    enabled: item.enabled ?? false,
    id: item.id ?? '',
    indicatorCategory: (item.indicatorCategory ??
      'QUALITY') as StatIndicatorView['indicatorCategory'],
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
    templateType: (item.templateType ??
      'QUALITY') as StatReportTemplateView['templateType'],
  };
}

function mapText(value: unknown) {
  return value === null || value === undefined ? null : String(value);
}

function mapBreakdownItems(
  items: Partial<StatReportRow>['breakdowns'],
): StatReportRow['breakdowns'] {
  return Array.isArray(items)
    ? items.map((item) => ({
        label: item?.label ?? '',
        value: item?.value ?? '',
      }))
    : undefined;
}

function mapTrendPoints(
  items: Partial<StatReportRow>['trendPoints'],
): StatReportRow['trendPoints'] {
  return Array.isArray(items)
    ? items.map((item) => ({
        label: item?.label ?? '',
        value: item?.value ?? '',
      }))
    : undefined;
}

function mapStatReportRow(item: Partial<StatReportRow>): StatReportRow {
  return {
    breakdowns: mapBreakdownItems(item.breakdowns),
    denominator: mapText(item.denominator),
    indicatorCode: item.indicatorCode ?? '',
    indicatorName: item.indicatorName ?? '',
    metricStatus: item.metricStatus,
    metricUnit: item.metricUnit ?? '',
    metricValue: item.metricValue ?? '',
    numerator: mapText(item.numerator),
    sourceNote: mapText(item.sourceNote),
    trendPoints: mapTrendPoints(item.trendPoints),
  };
}

function mapDashboardCard(
  item: Partial<StatDashboardCard>,
  indicatorCategory: StatDashboardCard['indicatorCategory'],
): StatDashboardCard {
  return {
    indicatorCategory: item.indicatorCategory ?? indicatorCategory,
    indicatorCode: item.indicatorCode ?? '',
    indicatorName: item.indicatorName ?? '',
    metricStatus: item.metricStatus,
    metricUnit: item.metricUnit ?? '',
    metricValue:
      item.metricValue === null || item.metricValue === undefined
        ? ''
        : String(item.metricValue),
    sourceNote: mapText(item.sourceNote),
  };
}

function mapDashboardCards(
  items: Partial<StatDashboardCard>[] | undefined,
  indicatorCategory: StatDashboardCard['indicatorCategory'],
) {
  return Array.isArray(items)
    ? items.map((item) => mapDashboardCard(item, indicatorCategory))
    : [];
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

  return Array.isArray(response)
    ? response.map((item) => mapIndicator(item))
    : [];
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

  return Array.isArray(response)
    ? response.map((item) => mapTemplate(item))
    : [];
}

export async function queryStatReport(payload: StatReportQuery) {
  const response = await requestClient.post<StatReportResponse>(
    '/v1/stat-reports/query',
    payload,
  );

  return {
    columns: response.columns ?? [],
    reportCode: response.reportCode ?? '',
    rows: Array.isArray(response.rows)
      ? response.rows.map((item) => mapStatReportRow(item))
      : [],
  } satisfies StatReportResult;
}

export async function queryStatDashboard(payload: StatDashboardQuery = {}) {
  const response = await requestClient.post<StatDashboardResponse>(
    '/v1/stat-dashboard/query',
    payload,
  );

  return {
    operationCards: mapDashboardCards(response.operationCards, 'OPERATION'),
    qualityCards: mapDashboardCards(response.qualityCards, 'QUALITY'),
    summaryCards: mapDashboardCards(response.summaryCards, 'OPERATION'),
    workloadCards: mapDashboardCards(response.workloadCards, 'WORKLOAD'),
  } satisfies StatDashboardResult;
}

export async function exportStatReport(payload: StatReportQuery) {
  return requestClient.download('/v1/stat-reports/export', {
    data: payload,
    method: 'POST',
    responseReturn: 'body',
  });
}
