const EMPTY_TEXT = '-';

const DIAGNOSTIC_TASK_STATUS_LABELS: Record<string, string> = {
  ACCEPTED: '已接单',
  ASSIGNED: '已分派',
  CANCELLED: '已取消',
  COMPLETED: '已完成',
  IN_PROGRESS: '诊断中',
  PENDING: '待分派',
};

const DIAGNOSTIC_TASK_TYPE_LABELS: Record<string, string> = {
  CONSULTATION: '会诊',
  FROZEN: '冰冻',
  PRIMARY: '初诊',
  REVIEW: '复诊',
};

const REPORT_STATUS_LABELS: Record<string, string> = {
  DRAFT: '草稿',
  PUBLISHED: '已发布',
  REVIEWED: '已审核',
  SIGNED: '已签发',
  SUBMITTED: '已提交',
};

export function formatNullable(value?: null | number | string) {
  if (value === null || value === undefined || value === '') {
    return EMPTY_TEXT;
  }
  return String(value);
}

export function formatDateTime(value?: null | string) {
  return formatNullable(value);
}

export function formatDiagnosticTaskStatus(value?: null | string) {
  if (!value) {
    return EMPTY_TEXT;
  }
  return DIAGNOSTIC_TASK_STATUS_LABELS[value] ?? value;
}

export function formatDiagnosticTaskType(value?: null | string) {
  if (!value) {
    return EMPTY_TEXT;
  }
  return DIAGNOSTIC_TASK_TYPE_LABELS[value] ?? value;
}

export function formatReportStatus(value?: null | string) {
  if (!value) {
    return EMPTY_TEXT;
  }
  return REPORT_STATUS_LABELS[value] ?? value;
}
