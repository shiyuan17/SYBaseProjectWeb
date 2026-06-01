import type { PendingTechnicalTaskItem } from '../types/technical-workflow';

export interface DehydrationWorkbenchStat {
  label: string;
  tone: 'danger' | 'info' | 'success' | 'warning';
  value: number;
}

function countByStatus(
  items: PendingTechnicalTaskItem[],
  taskStatus: null | string,
) {
  return items.filter((item) => item.taskStatus === taskStatus).length;
}

export function buildDehydrationWorkbenchStats(
  items: PendingTechnicalTaskItem[],
): DehydrationWorkbenchStat[] {
  return [
    {
      label: '总蜡块',
      tone: 'info',
      value: items.length,
    },
    {
      label: '未脱水',
      tone: 'danger',
      value: countByStatus(items, 'PENDING'),
    },
    {
      label: '脱水中',
      tone: 'warning',
      value: countByStatus(items, 'IN_PROGRESS'),
    },
    {
      label: '脱水完成',
      tone: 'success',
      value: countByStatus(items, 'COMPLETED'),
    },
  ];
}

export function getDehydrationTaskRemark(task: PendingTechnicalTaskItem) {
  return task.productionRemarks || task.remarks || '';
}

export function getDehydrationTaskOperator(task: PendingTechnicalTaskItem) {
  return task.assignedToName || '';
}

