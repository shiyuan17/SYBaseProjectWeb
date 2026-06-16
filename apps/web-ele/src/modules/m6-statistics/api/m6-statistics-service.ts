import type {
  StatDashboardCard,
  StatDashboardQuery,
  StatDashboardResult,
  StatIndicatorView,
  StatReportDetailItem,
  StatReportDetailQuery,
  StatReportDetailResult,
  StatReportQuery,
  StatReportResult,
  StatReportRow,
  StatReportTemplateView,
} from '../types/m6-statistics';

import { requestClient } from '#/api/request';

type IndicatorListResponse = Partial<StatIndicatorView>[];
type StatReportDetailResponse = Partial<
  Omit<StatReportDetailResult, 'items'> & {
    items: Partial<StatReportDetailItem>[];
  }
>;
type StatReportResponse = Partial<StatReportResult>;
type TemplateListResponse = Partial<StatReportTemplateView>[];

const DASHBOARD_SUMMARY_INDICATOR_CODES = [
  'OP_CASE_VOLUME',
  'OP_BILLING_AMOUNT',
  'QC_SPECIMEN_FIXATION_RATE',
  'WL_DIAGNOSTIC_TASK_COUNT',
] as const;

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

function mapMetricValue(value: unknown) {
  return value === null || value === undefined ? '' : String(value);
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
    metricValue: mapMetricValue(item.metricValue),
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
    metricValue: mapMetricValue(item.metricValue),
    sourceNote: mapText(item.sourceNote),
  };
}

function mapReportRowsToDashboardCards(
  rows: StatReportRow[] | undefined,
  indicatorCategory: StatDashboardCard['indicatorCategory'],
) {
  return Array.isArray(rows)
    ? rows.map((row) =>
        mapDashboardCard(
          {
            indicatorCode: row.indicatorCode,
            indicatorName: row.indicatorName,
            metricStatus: row.metricStatus,
            metricUnit: row.metricUnit,
            metricValue: row.metricValue,
            sourceNote: row.sourceNote,
          },
          indicatorCategory,
        ),
      )
    : [];
}

function selectSummaryCards(cards: StatDashboardCard[]) {
  const selected = DASHBOARD_SUMMARY_INDICATOR_CODES.flatMap((indicatorCode) =>
    cards.filter((card) => card.indicatorCode === indicatorCode).slice(0, 1),
  );

  return selected.length > 0 ? selected : cards.slice(0, 4);
}

function mapStatReportDetailItem(
  item: Partial<StatReportDetailItem>,
): StatReportDetailItem {
  return {
    applicationNo: item.applicationNo ?? '',
    detailStatus: (item.detailStatus ?? 'INFO') as StatReportDetailItem['detailStatus'],
    occurredAt: mapText(item.occurredAt),
    pathologyNo: item.pathologyNo ?? '',
    reason: item.reason ?? '',
    specimenNo: mapText(item.specimenNo),
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
  const [qualityReport, operationReport, workloadReport] = await Promise.all([
    queryStatReport({ ...payload, category: 'QUALITY' }),
    queryStatReport({ ...payload, category: 'OPERATION' }),
    queryStatReport({ ...payload, category: 'WORKLOAD' }),
  ]);

  const qualityCards = mapReportRowsToDashboardCards(
    qualityReport.rows,
    'QUALITY',
  );
  const operationCards = mapReportRowsToDashboardCards(
    operationReport.rows,
    'OPERATION',
  );
  const workloadCards = mapReportRowsToDashboardCards(
    workloadReport.rows,
    'WORKLOAD',
  );

  return {
    operationCards,
    qualityCards,
    summaryCards: selectSummaryCards([
      ...operationCards,
      ...qualityCards,
      ...workloadCards,
    ]),
    workloadCards,
  } satisfies StatDashboardResult;
}

export async function queryStatReportDetails(payload: StatReportDetailQuery) {
  const response = await requestClient.post<StatReportDetailResponse>(
    '/v1/stat-reports/details/query',
    payload,
  );

  return {
    availabilityStatus: response.availabilityStatus ?? 'UNAVAILABLE',
    eligibleCount: Number(response.eligibleCount ?? 0),
    failCount: Number(response.failCount ?? 0),
    indicatorCode: response.indicatorCode ?? payload.indicatorCode,
    items: Array.isArray(response.items)
      ? response.items.map((item) => mapStatReportDetailItem(item))
      : [],
    page: response.page ?? payload.page ?? 1,
    passCount: Number(response.passCount ?? 0),
    size: response.size ?? payload.size ?? 20,
    sourceNote: mapText(response.sourceNote),
    total: Number(response.total ?? 0),
  } satisfies StatReportDetailResult;
}

export async function exportStatReport(payload: StatReportQuery) {
  return requestClient.download('/v1/stat-reports/export', {
    data: payload,
    method: 'POST',
    responseReturn: 'body',
  });
}

export async function exportStatReportDetails(payload: StatReportDetailQuery) {
  return requestClient.download('/v1/stat-reports/details/export', {
    data: payload,
    method: 'POST',
    responseReturn: 'body',
  });
}
