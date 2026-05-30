import type { PendingTechnicalTaskItem } from '../types/technical-workflow';

import { TASK_TYPE_TITLE_MAP } from '../constants';
import { formatTaskType } from './format';

export function getTaskStatusTagType(status?: null | string) {
  if (status === 'COMPLETED') {
    return 'success';
  }
  if (status === 'IN_PROGRESS') {
    return 'warning';
  }
  return 'info';
}

export function getPriorityTagType(priority?: null | string) {
  if (priority === 'STAT') {
    return 'danger';
  }
  if (priority === 'PRIORITY') {
    return 'warning';
  }
  return 'info';
}

export function formatCurrentNode(row: PendingTechnicalTaskItem) {
  return (
    TASK_TYPE_TITLE_MAP[row.currentNode ?? row.taskType ?? ''] ??
    formatTaskType(row.currentNode ?? row.taskType)
  );
}

export function formatResponsible(row: PendingTechnicalTaskItem) {
  return row.assignedToName?.trim() || '未分派';
}
