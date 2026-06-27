export type PathologyScreenStatus = 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE';

export interface PathologyScreenMetricCard {
  label: string;
  sourceNote: null | string;
  status: PathologyScreenStatus;
  value: string;
}

export interface PathologyScreenMetricItem {
  label: string;
  sourceNote: null | string;
  status: PathologyScreenStatus;
  value: string;
}

export interface PathologyScreenTrendItem {
  label: string;
  sourceNote: null | string;
  status: PathologyScreenStatus;
  value: string;
}

export interface PathologyScreenWorkloadRow {
  februaryCount: string;
  januaryCount: string;
  label: string;
  momRate: string;
  sourceNote: null | string;
  status: PathologyScreenStatus;
}

export interface PathologyScreenSection<TItem> {
  items: TItem[];
  sourceNote: null | string;
  status: PathologyScreenStatus;
}

export interface PathologyScreenThreeYearRow {
  metrics: PathologyScreenMetricItem[];
  year: string;
}

export interface PathologyScreenStructuredReportSummary {
  reportCount: PathologyScreenMetricCard;
  sourceNote: null | string;
  status: PathologyScreenStatus;
  templateTypeCount: PathologyScreenMetricCard;
  topTemplates: PathologyScreenMetricItem[];
}

export interface PathologyScreenSummaryCards {
  annualCaseTotal: PathologyScreenMetricCard;
  lastMonthCaseTotal: PathologyScreenMetricCard;
  lastMonthReportTimelinessRate: PathologyScreenMetricCard;
}

export interface PathologyScreenDashboardResponse {
  diagnosisWorkloadRows: PathologyScreenSection<PathologyScreenWorkloadRow>;
  lastMonthWorkload: PathologyScreenSection<PathologyScreenMetricItem>;
  overallComplianceRates: PathologyScreenSection<PathologyScreenMetricItem>;
  reportRevisionRateTrend: PathologyScreenSection<PathologyScreenTrendItem>;
  structuredReportSummary: PathologyScreenStructuredReportSummary;
  summaryCards: PathologyScreenSummaryCards;
  technicalQualificationRates: PathologyScreenSection<PathologyScreenMetricItem>;
  threeYearReportQualityRates: PathologyScreenSection<PathologyScreenThreeYearRow>;
  threeYearTechnicalRates: PathologyScreenSection<PathologyScreenThreeYearRow>;
}

export type PathologyDashboardLoadState =
  | 'error'
  | 'forbidden'
  | 'loading'
  | 'ready';

export interface PathologyDashboardSnapshot {
  cachedAt: number;
  dashboard: PathologyScreenDashboardResponse;
  userId: string;
}
