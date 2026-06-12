import type {
  StatIndicatorCategory,
  StatReportQuery,
} from '../types/m6-statistics';

export interface StatReportFilterState {
  dateRange: string[];
  departmentId: string;
  indicatorCode: string;
  roleId: string;
  templateCode: string;
  workloadUserId: string;
  workloadUserName: string;
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
    roleId: filters.roleId || undefined,
    templateCode: filters.templateCode || undefined,
    to: filters.dateRange[1] || undefined,
    workloadUserId: filters.workloadUserId || undefined,
  };
}

export function buildStatReportFileName(
  category: StatIndicatorCategory,
  templateCode: string,
) {
  return `${templateCode || category.toLowerCase()}-stat-report.csv`;
}
