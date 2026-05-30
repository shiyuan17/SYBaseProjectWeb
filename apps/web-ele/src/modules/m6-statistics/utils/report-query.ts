import type {
  StatIndicatorCategory,
  StatReportQuery,
} from '../types/m6-statistics';

export interface StatReportFilterState {
  dateRange: string[];
  departmentId: string;
  indicatorCode: string;
  operatorName: string;
  operatorUserId: string;
  roleId: string;
  templateCode: string;
}

export function buildStatReportPayload(
  category: StatIndicatorCategory,
  filters: StatReportFilterState,
): StatReportQuery {
  return {
    category,
    departmentId: filters.departmentId || undefined,
    from: filters.dateRange[0] || undefined,
    indicatorCode: filters.indicatorCode || undefined,
    operatorName: filters.operatorName || undefined,
    operatorUserId: filters.operatorUserId || undefined,
    roleId: filters.roleId || undefined,
    templateCode: filters.templateCode || undefined,
    to: filters.dateRange[1] || undefined,
  };
}

export function buildStatReportFileName(
  category: StatIndicatorCategory,
  templateCode: string,
) {
  return `${templateCode || category.toLowerCase()}-stat-report.csv`;
}
