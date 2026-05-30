import type { PendingDiagnosticTaskItem } from '../types/doctor-workflow';

import { formatDiagnosticTaskStatus } from './format';

export const ACCEPTABLE_TASK_STATUSES = ['PENDING', 'ASSIGNED'] as const;
export const STARTABLE_TASK_STATUSES = ['ASSIGNED', 'ACCEPTED'] as const;

export function matchesAllowedStatus(
  status: string,
  allowedStatuses: readonly string[],
) {
  return allowedStatuses.includes(status);
}

export function buildTaskActionBlockedMessage(
  action: 'accept' | 'start',
  task: null | PendingDiagnosticTaskItem,
  isAssignedToCurrentUser: boolean,
  selectedTaskAssigneeLabel: string,
) {
  if (!task) {
    return '当前病例没有可操作的诊断任务';
  }

  if (!isAssignedToCurrentUser) {
    if (selectedTaskAssigneeLabel) {
      return `当前登录账号未被分配到该诊断任务，责任/初诊医生：${selectedTaskAssigneeLabel}。请使用被分配账号操作，或先回分派页核对人员。`;
    }
    return '当前诊断任务尚未分配到当前登录账号，请先回分派页核对责任/初诊医生';
  }

  const status = task.taskStatus ?? '';
  const isAllowedStatus =
    action === 'accept'
      ? ACCEPTABLE_TASK_STATUSES.includes(
          status as (typeof ACCEPTABLE_TASK_STATUSES)[number],
        )
      : STARTABLE_TASK_STATUSES.includes(
          status as (typeof STARTABLE_TASK_STATUSES)[number],
        );

  if (!isAllowedStatus) {
    return action === 'accept'
      ? `当前任务状态为${formatDiagnosticTaskStatus(status)}，不可接单`
      : `当前任务状态为${formatDiagnosticTaskStatus(status)}，不可开始诊断`;
  }

  return '';
}
