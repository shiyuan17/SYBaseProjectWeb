import type {
  PathologyScreenDashboardResponse,
  PathologyScreenMetricCard,
  PathologyScreenMetricItem,
  PathologyScreenSection,
  PathologyScreenStatus,
  PathologyScreenStructuredReportSummary,
  PathologyScreenSummaryCards,
  PathologyScreenThreeYearRow,
  PathologyScreenTrendItem,
  PathologyScreenWorkloadRow,
} from '../types/pathology-screen';

import { requestClient } from '#/api/request';

type PartialMetricCard = Partial<PathologyScreenMetricCard>;
type PartialMetricItem = Partial<PathologyScreenMetricItem>;
type PartialTrendItem = Partial<PathologyScreenTrendItem>;
type PartialWorkloadRow = Partial<PathologyScreenWorkloadRow>;
type PartialThreeYearRow = Partial<PathologyScreenThreeYearRow>;

type DashboardResponse = Partial<
  Omit<
    PathologyScreenDashboardResponse,
    | 'diagnosisWorkloadRows'
    | 'lastMonthWorkload'
    | 'overallComplianceRates'
    | 'reportRevisionRateTrend'
    | 'structuredReportSummary'
    | 'summaryCards'
    | 'technicalQualificationRates'
    | 'threeYearReportQualityRates'
    | 'threeYearTechnicalRates'
  >
> & {
  diagnosisWorkloadRows?: null | Partial<
    PathologyScreenSection<PartialWorkloadRow>
  >;
  lastMonthWorkload?: null | Partial<PathologyScreenSection<PartialMetricItem>>;
  overallComplianceRates?: null | Partial<
    PathologyScreenSection<PartialMetricItem>
  >;
  reportRevisionRateTrend?: null | Partial<
    PathologyScreenSection<PartialTrendItem>
  >;
  structuredReportSummary?: null | Partial<
    Omit<
      PathologyScreenStructuredReportSummary,
      'reportCount' | 'templateTypeCount' | 'topTemplates'
    > & {
      reportCount?: null | PartialMetricCard;
      templateTypeCount?: null | PartialMetricCard;
      topTemplates?: null | PartialMetricItem[];
    }
  >;
  summaryCards?: null | Partial<Omit<PathologyScreenSummaryCards, never>>;
  technicalQualificationRates?: null | Partial<
    PathologyScreenSection<PartialMetricItem>
  >;
  threeYearReportQualityRates?: null | Partial<
    PathologyScreenSection<PartialThreeYearRow>
  >;
  threeYearTechnicalRates?: null | Partial<
    PathologyScreenSection<PartialThreeYearRow>
  >;
};

function mapStatus(value: unknown): PathologyScreenStatus {
  return value === 'AVAILABLE' || value === 'PARTIAL' || value === 'UNAVAILABLE'
    ? value
    : 'UNAVAILABLE';
}

function mapMetricCard(
  item: null | PartialMetricCard | undefined,
  fallbackLabel: string,
): PathologyScreenMetricCard {
  return {
    label: item?.label ?? fallbackLabel,
    sourceNote:
      item?.sourceNote === null || item?.sourceNote === undefined
        ? null
        : String(item.sourceNote),
    status: mapStatus(item?.status),
    value:
      item?.value === null || item?.value === undefined
        ? '--'
        : String(item.value),
  };
}

function mapMetricItem(item: null | PartialMetricItem | undefined) {
  return {
    label: item?.label ?? '',
    sourceNote:
      item?.sourceNote === null || item?.sourceNote === undefined
        ? null
        : String(item.sourceNote),
    status: mapStatus(item?.status),
    value:
      item?.value === null || item?.value === undefined
        ? '--'
        : String(item.value),
  } satisfies PathologyScreenMetricItem;
}

function mapTrendItem(item: null | PartialTrendItem | undefined) {
  return {
    label: item?.label ?? '',
    sourceNote:
      item?.sourceNote === null || item?.sourceNote === undefined
        ? null
        : String(item.sourceNote),
    status: mapStatus(item?.status),
    value:
      item?.value === null || item?.value === undefined
        ? '--'
        : String(item.value),
  } satisfies PathologyScreenTrendItem;
}

function mapWorkloadRow(item: null | PartialWorkloadRow | undefined) {
  return {
    februaryCount:
      item?.februaryCount === null || item?.februaryCount === undefined
        ? '--'
        : String(item.februaryCount),
    januaryCount:
      item?.januaryCount === null || item?.januaryCount === undefined
        ? '--'
        : String(item.januaryCount),
    label: item?.label ?? '',
    momRate:
      item?.momRate === null || item?.momRate === undefined
        ? '--'
        : String(item.momRate),
    sourceNote:
      item?.sourceNote === null || item?.sourceNote === undefined
        ? null
        : String(item.sourceNote),
    status: mapStatus(item?.status),
  } satisfies PathologyScreenWorkloadRow;
}

function mapThreeYearRow(item: null | PartialThreeYearRow | undefined) {
  return {
    metrics: Array.isArray(item?.metrics)
      ? item.metrics.map((metric) => mapMetricItem(metric))
      : [],
    year: item?.year ?? '',
  } satisfies PathologyScreenThreeYearRow;
}

function mapSection<TSource, TResult>(
  section: null | Partial<PathologyScreenSection<TSource>> | undefined,
  mapper: (item: null | TSource | undefined) => TResult,
) {
  return {
    items: Array.isArray(section?.items)
      ? section.items.map((item) => mapper(item))
      : [],
    sourceNote:
      section?.sourceNote === null || section?.sourceNote === undefined
        ? null
        : String(section.sourceNote),
    status: mapStatus(section?.status),
  } satisfies PathologyScreenSection<TResult>;
}

export async function queryPathologyScreenDashboard() {
  const response = await requestClient.get<DashboardResponse>(
    '/v1/dashboard/pathology-screen',
  );

  return {
    diagnosisWorkloadRows: mapSection(
      response.diagnosisWorkloadRows,
      mapWorkloadRow,
    ),
    lastMonthWorkload: mapSection(response.lastMonthWorkload, mapMetricItem),
    overallComplianceRates: mapSection(
      response.overallComplianceRates,
      mapMetricItem,
    ),
    reportRevisionRateTrend: mapSection(
      response.reportRevisionRateTrend,
      mapTrendItem,
    ),
    structuredReportSummary: {
      reportCount: mapMetricCard(
        response.structuredReportSummary?.reportCount,
        '结构化报告工作量（例）',
      ),
      sourceNote:
        response.structuredReportSummary?.sourceNote === null ||
        response.structuredReportSummary?.sourceNote === undefined
          ? null
          : String(response.structuredReportSummary.sourceNote),
      status: mapStatus(response.structuredReportSummary?.status),
      templateTypeCount: mapMetricCard(
        response.structuredReportSummary?.templateTypeCount,
        '结构化报告类型（种）',
      ),
      topTemplates: Array.isArray(
        response.structuredReportSummary?.topTemplates,
      )
        ? response.structuredReportSummary.topTemplates.map((item) =>
            mapMetricItem(item),
          )
        : [],
    } satisfies PathologyScreenStructuredReportSummary,
    summaryCards: {
      annualCaseTotal: mapMetricCard(
        response.summaryCards?.annualCaseTotal,
        '全年病例总数（例）',
      ),
      lastMonthCaseTotal: mapMetricCard(
        response.summaryCards?.lastMonthCaseTotal,
        '上月病例总数（例）',
      ),
      lastMonthReportTimelinessRate: mapMetricCard(
        response.summaryCards?.lastMonthReportTimelinessRate,
        '上月报告及时率',
      ),
    } satisfies PathologyScreenSummaryCards,
    technicalQualificationRates: mapSection(
      response.technicalQualificationRates,
      mapMetricItem,
    ),
    threeYearReportQualityRates: mapSection(
      response.threeYearReportQualityRates,
      mapThreeYearRow,
    ),
    threeYearTechnicalRates: mapSection(
      response.threeYearTechnicalRates,
      mapThreeYearRow,
    ),
  } satisfies PathologyScreenDashboardResponse;
}
