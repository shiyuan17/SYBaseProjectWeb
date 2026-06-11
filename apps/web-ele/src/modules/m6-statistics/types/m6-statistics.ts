export type StatIndicatorCategory =
  | 'CUSTOM'
  | 'OPERATION'
  | 'QUALITY'
  | 'WORKLOAD';

export interface StatIndicatorView {
  aggregationType: string;
  description: string;
  enabled: boolean;
  id: string;
  indicatorCategory: StatIndicatorCategory;
  indicatorCode: string;
  indicatorName: string;
  metricScope: string;
  sortOrder: number;
}

export interface StatReportTemplateView {
  defaultColumns: string;
  enabled: boolean;
  id: string;
  indicatorCode: null | string;
  parameterSchema: string;
  sortOrder: number;
  templateCode: string;
  templateName: string;
  templateType: StatIndicatorCategory;
}

export interface StatReportQuery {
  category?: null | string;
  departmentId?: null | string;
  from?: null | string;
  indicatorCode?: null | string;
  roleId?: null | string;
  templateCode?: null | string;
  to?: null | string;
  workloadUserId?: null | string;
}

export interface StatDashboardQuery {
  departmentId?: null | string;
  from?: null | string;
  roleId?: null | string;
  to?: null | string;
  workloadUserId?: null | string;
}

export type MetricStatus = 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE';

export interface StatReportBreakdown {
  label: string;
  value: string;
}

export interface StatReportTrendPoint {
  label: string;
  value: string;
}

export interface StatReportRow {
  breakdowns?: StatReportBreakdown[];
  denominator?: null | string;
  indicatorCode: string;
  indicatorName: string;
  metricStatus?: MetricStatus;
  metricUnit: string;
  metricValue: string;
  numerator?: null | string;
  sourceNote?: null | string;
  trendPoints?: StatReportTrendPoint[];
}

export interface StatReportResult {
  columns: string[];
  reportCode: string;
  rows: StatReportRow[];
}

export interface StatDashboardCard {
  indicatorCategory: StatIndicatorCategory;
  indicatorCode: string;
  indicatorName: string;
  metricStatus?: MetricStatus;
  metricUnit: string;
  metricValue: string;
  sourceNote?: null | string;
}

export interface StatDashboardResult {
  operationCards: StatDashboardCard[];
  qualityCards: StatDashboardCard[];
  summaryCards: StatDashboardCard[];
  workloadCards: StatDashboardCard[];
}
