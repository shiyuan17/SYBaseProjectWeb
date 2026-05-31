import type {
  DashboardAlertItem,
  DashboardDomainData,
  DashboardQuickEntry,
  DashboardWorkspaceCard,
} from '../../types/dashboard';

import type { PendingTechnicalTaskItem } from '#/modules/technical-workflow/types/technical-workflow';

import { listPendingTechnicalTasks } from '#/modules/technical-workflow/api/technical-workflow-service';
import {
  M3_PERMISSION_CODES,
  TASK_TYPE_ROUTE_MAP,
  TASK_TYPE_TITLE_MAP,
} from '#/modules/technical-workflow/constants';

import { formatCount, hasAnyPermission } from './dashboard-shared';

function canViewTechnicalTask(
  accessCodes: string[],
  task: PendingTechnicalTaskItem,
) {
  const route = task.taskType ? TASK_TYPE_ROUTE_MAP[task.taskType] : '';
  if (!route) {
    return accessCodes.includes(M3_PERMISSION_CODES.TECHNICAL_TASK_QUERY);
  }
  if (route.includes('/grossing')) {
    return accessCodes.includes(M3_PERMISSION_CODES.GROSSING);
  }
  if (route.includes('/dehydration')) {
    return accessCodes.includes(M3_PERMISSION_CODES.DEHYDRATION);
  }
  if (route.includes('/embedding')) {
    return accessCodes.includes(M3_PERMISSION_CODES.EMBEDDING);
  }
  if (route.includes('/slicing')) {
    return accessCodes.includes(M3_PERMISSION_CODES.SLICING);
  }
  if (route.includes('/staining')) {
    return accessCodes.includes(M3_PERMISSION_CODES.STAINING);
  }
  if (route.includes('/rework')) {
    return accessCodes.includes(M3_PERMISSION_CODES.REWORK);
  }
  return true;
}

export async function loadTechnicalDomainData(
  accessCodes: string[],
): Promise<DashboardDomainData | null> {
  if (
    !hasAnyPermission(accessCodes, [
      M3_PERMISSION_CODES.TECHNICAL_TASK_QUERY,
      M3_PERMISSION_CODES.GROSSING,
      M3_PERMISSION_CODES.DEHYDRATION,
      M3_PERMISSION_CODES.EMBEDDING,
      M3_PERMISSION_CODES.SLICING,
      M3_PERMISSION_CODES.STAINING,
      M3_PERMISSION_CODES.REWORK,
      M3_PERMISSION_CODES.TECHNICAL_TRACKING_QUERY,
    ])
  ) {
    return null;
  }

  const result = await listPendingTechnicalTasks({
    page: 1,
    size: 200,
    timedOutOnly: false,
  });

  const visibleItems = result.items.filter((item) =>
    canViewTechnicalTask(accessCodes, item),
  );

  const taskBuckets = new Map<string, PendingTechnicalTaskItem[]>();
  visibleItems.forEach((item) => {
    const key = item.taskType ?? 'UNKNOWN';
    taskBuckets.set(key, [...(taskBuckets.get(key) ?? []), item]);
  });

  const cards: DashboardWorkspaceCard[] = [...taskBuckets.entries()]
    .slice(0, 6)
    .map(([taskType, items]) => ({
      description: `待处理 ${items.filter((item) => item.taskStatus === 'PENDING').length} 条，处理中 ${
        items.filter((item) => item.taskStatus === 'IN_PROGRESS').length
      } 条`,
      id: `technical-${taskType}`,
      query: {
        mode: items.some((item) => item.timedOut) ? 'exception' : 'queue',
      },
      route: TASK_TYPE_ROUTE_MAP[taskType] ?? '/technical-workflow/tasks',
      tag: items.some((item) => item.timedOut) ? '含超时' : undefined,
      title: TASK_TYPE_TITLE_MAP[taskType] ?? taskType,
      tone: items.some((item) => item.timedOut) ? 'danger' : 'info',
      value: formatCount(items.length),
    }));

  const alerts: DashboardAlertItem[] = visibleItems
    .filter(
      (item) => item.timedOut || item.taskType === 'REWORK' || item.remarks,
    )
    .slice(0, 5)
    .map((item) => ({
      description: item.remarks || `${item.pathologyNo || item.caseId} 待处理`,
      id: item.id,
      query: { caseId: item.caseId, mode: 'exception' },
      route: item.taskType
        ? (TASK_TYPE_ROUTE_MAP[item.taskType] ?? '/technical-workflow/tasks')
        : '/technical-workflow/tasks',
      severity: (() => {
        if (item.timedOut) {
          return 'danger';
        }
        if (item.taskType === 'REWORK') {
          return 'warning';
        }
        return 'info';
      })(),
      source: '制片管理',
      title: `${TASK_TYPE_TITLE_MAP[item.taskType ?? ''] ?? item.taskType ?? '技术任务'} / ${
        item.pathologyNo || item.caseId
      }`,
    }));

  const quickEntries: DashboardQuickEntry[] = [
    {
      description: '按工位查看待办与异常',
      highlight: true,
      id: 'technical-entry-1',
      route: '/technical-workflow/entry',
      title: '生产总控台',
    },
    {
      description: '统一查看技术任务池',
      id: 'technical-entry-2',
      route: '/technical-workflow/tasks',
      title: '任务池',
    },
    {
      description: '查看病例技术轨迹',
      id: 'technical-entry-3',
      route: '/technical-workflow/tracking',
      title: '技术追踪',
    },
  ];

  return {
    alerts,
    cards,
    id: 'technical',
    quickEntries,
    title: '制片管理',
  };
}
