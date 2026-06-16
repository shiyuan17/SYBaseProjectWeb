import type { PendingDiagnosticTaskItem } from '../types/doctor-workflow';

export interface DiagnosisWorkbenchQueueStats {
  acceptedCount: number;
  assignedCount: number;
  consultationCount: number;
  completedCount: number;
  currentPageCount: number;
  frozenCount: number;
  inProgressCount: number;
  primaryCount: number;
  reviewCount: number;
  unsignedReportCount: number;
}

export type DiagnosisWorkbenchQueueQuickFilter =
  | 'ALL'
  | 'ASSIGNED'
  | 'COMPLETED'
  | 'CONSULTATION'
  | 'FROZEN'
  | 'IN_PROGRESS'
  | 'PRIMARY'
  | 'REVIEW'
  | 'UNSIGNED_REPORT';

export interface DiagnosisWorkbenchQuickFilterOption {
  count: number;
  key: DiagnosisWorkbenchQueueQuickFilter;
  label: string;
  taskStatus?: string;
  taskType?: string;
}

export function resolveWorkbenchSelection(
  items: PendingDiagnosticTaskItem[],
  preferredTaskId: string,
  preferredCaseId: string,
) {
  if (items.length === 0) {
    return null;
  }

  if (preferredTaskId) {
    const matchedTask = items.find((item) => item.id === preferredTaskId);
    if (matchedTask) {
      return matchedTask;
    }
  }

  if (preferredCaseId) {
    const matchedCase = items.find((item) => item.caseId === preferredCaseId);
    if (matchedCase) {
      return matchedCase;
    }
  }

  return items[0] ?? null;
}

export function buildDiagnosisWorkbenchQueueStats(
  items: PendingDiagnosticTaskItem[],
): DiagnosisWorkbenchQueueStats {
  return {
    acceptedCount: items.filter((item) => item.taskStatus === 'ACCEPTED')
      .length,
    assignedCount: items.filter((item) => item.taskStatus === 'ASSIGNED')
      .length,
    consultationCount: items.filter((item) => item.taskType === 'CONSULTATION')
      .length,
    completedCount: items.filter((item) => item.taskStatus === 'COMPLETED')
      .length,
    currentPageCount: items.length,
    frozenCount: items.filter((item) => item.taskType === 'FROZEN').length,
    inProgressCount: items.filter((item) => item.taskStatus === 'IN_PROGRESS')
      .length,
    primaryCount: items.filter((item) => item.taskType === 'PRIMARY').length,
    reviewCount: items.filter((item) => item.taskType === 'REVIEW').length,
    unsignedReportCount: items.filter(
      (item) =>
        item.reportStatus !== 'SIGNED' &&
        item.reportStatus !== 'PUBLISHED' &&
        item.taskStatus !== 'COMPLETED',
    ).length,
  };
}

export function buildDiagnosisWorkbenchQuickFilterOptions(
  stats: DiagnosisWorkbenchQueueStats,
): DiagnosisWorkbenchQuickFilterOption[] {
  return [
    {
      count: stats.unsignedReportCount,
      key: 'UNSIGNED_REPORT',
      label: '未签发报告',
    },
    {
      count: stats.primaryCount,
      key: 'PRIMARY',
      label: '我的初步',
      taskType: 'PRIMARY',
    },
    {
      count: stats.assignedCount,
      key: 'ASSIGNED',
      label: '未接单',
      taskStatus: 'ASSIGNED',
    },
    {
      count: stats.inProgressCount,
      key: 'IN_PROGRESS',
      label: '诊断中',
      taskStatus: 'IN_PROGRESS',
    },
    {
      count: stats.completedCount,
      key: 'COMPLETED',
      label: '已完成',
      taskStatus: 'COMPLETED',
    },
    {
      count: stats.reviewCount,
      key: 'REVIEW',
      label: '我的复诊',
      taskType: 'REVIEW',
    },
    {
      count: stats.frozenCount,
      key: 'FROZEN',
      label: '冰冻',
      taskType: 'FROZEN',
    },
    {
      count: stats.consultationCount,
      key: 'CONSULTATION',
      label: '科内会诊',
      taskType: 'CONSULTATION',
    },
  ];
}

export function filterDiagnosisWorkbenchQueueItems(
  items: PendingDiagnosticTaskItem[],
  quickFilter: DiagnosisWorkbenchQueueQuickFilter,
  assignedRange: string[],
) {
  return items.filter((item) => {
    if (!matchesAssignedRange(item, assignedRange)) {
      return false;
    }

    if (quickFilter === 'ALL') {
      return true;
    }
    if (quickFilter === 'UNSIGNED_REPORT') {
      return (
        item.reportStatus !== 'SIGNED' &&
        item.reportStatus !== 'PUBLISHED' &&
        item.taskStatus !== 'COMPLETED'
      );
    }
    if (
      quickFilter === 'ASSIGNED' ||
      quickFilter === 'COMPLETED' ||
      quickFilter === 'IN_PROGRESS'
    ) {
      return item.taskStatus === quickFilter;
    }
    return item.taskType === quickFilter;
  });
}

export function getDiagnosisTaskStatusTagType(status?: null | string) {
  if (status === 'COMPLETED') {
    return 'success';
  }
  if (status === 'IN_PROGRESS' || status === 'ACCEPTED') {
    return 'warning';
  }
  if (status === 'ASSIGNED') {
    return 'primary';
  }
  if (status === 'CANCELLED') {
    return 'info';
  }
  return 'danger';
}

export function getDiagnosisTaskTypeTagType(taskType?: null | string) {
  if (taskType === 'PRIMARY') {
    return 'primary';
  }
  if (taskType === 'REVIEW') {
    return 'success';
  }
  if (taskType === 'FROZEN') {
    return 'warning';
  }
  return 'info';
}

function matchesAssignedRange(
  item: PendingDiagnosticTaskItem,
  assignedRange: string[],
) {
  if (assignedRange.length < 2) {
    return true;
  }

  const [start, end] = assignedRange;
  if (!start || !end || !item.assignedAt) {
    return true;
  }

  const assignedAt = item.assignedAt.slice(0, 10);
  return assignedAt >= start && assignedAt <= end;
}
