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
  operatorName?: null | string;
  operatorUserId?: null | string;
  roleId?: null | string;
  templateCode?: null | string;
  to?: null | string;
}

export interface StatReportRow {
  indicatorCode: string;
  indicatorName: string;
  metricUnit: string;
  metricValue: string;
}

export interface StatReportResult {
  columns: string[];
  reportCode: string;
  rows: StatReportRow[];
}
