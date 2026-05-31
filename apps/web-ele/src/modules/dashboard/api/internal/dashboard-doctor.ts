import type {
  DashboardAlertItem,
  DashboardDomainData,
  DashboardQuickEntry,
  DashboardWorkspaceCard,
} from '../../types/dashboard';

import type { PendingDiagnosticTaskItem } from '#/modules/doctor-workflow/types/doctor-workflow';

import { listPendingDiagnosticTasks } from '#/modules/doctor-workflow/api/doctor-workflow-service';
import { M4_PERMISSION_CODES } from '#/modules/doctor-workflow/constants';

import { formatCount, hasAnyPermission } from './dashboard-shared';

export async function loadDoctorDomainData(
  accessCodes: string[],
): Promise<DashboardDomainData | null> {
  if (
    !hasAnyPermission(accessCodes, [
      M4_PERMISSION_CODES.DIAG_TASK_QUERY,
      M4_PERMISSION_CODES.ASSIGN,
      M4_PERMISSION_CODES.WORKBENCH_QUERY,
      M4_PERMISSION_CODES.REPORT_CREATE,
      M4_PERMISSION_CODES.REPORT_TRACKING_QUERY,
      M4_PERMISSION_CODES.REVISION_REQUEST_CREATE,
      M4_PERMISSION_CODES.CONSULTATION_CREATE,
    ])
  ) {
    return null;
  }

  const result = await listPendingDiagnosticTasks({
    page: 1,
    size: 50,
  });

  const assigned = result.items.filter(
    (item) => item.taskStatus === 'ASSIGNED',
  );
  const accepted = result.items.filter(
    (item) => item.taskStatus === 'ACCEPTED',
  );
  const inProgress = result.items.filter(
    (item) => item.taskStatus === 'IN_PROGRESS',
  );

  const cards: DashboardWorkspaceCard[] = [
    {
      description: '待分派诊断任务',
      id: 'doctor-assignment',
      route: '/doctor-workflow/assignment',
      title: '待分派',
      tone: assigned.length > 0 ? 'warning' : 'success',
      value: formatCount(assigned.length),
    },
    {
      description: '已接单待开始病例',
      id: 'doctor-accepted',
      route: '/doctor-workflow/assignment',
      title: '待开始诊断',
      tone: accepted.length > 0 ? 'warning' : 'info',
      value: formatCount(accepted.length),
    },
    {
      description: '诊断中病例',
      id: 'doctor-progress',
      route: '/doctor-workflow/assignment',
      title: '诊断中',
      tone: inProgress.length > 0 ? 'info' : 'success',
      value: formatCount(inProgress.length),
    },
  ];

  const alerts: DashboardAlertItem[] = result.items
    .slice(0, 5)
    .map((item: PendingDiagnosticTaskItem) => ({
      description: `${item.patientName || '未命名患者'} / ${item.taskStatus || 'PENDING'}`,
      id: `doctor-${item.id}`,
      query: {
        caseId: item.caseId,
        pathologyNo: item.pathologyNo ?? '',
        taskId: item.id,
      },
      route: '/doctor-workflow/workbench',
      severity: (() => {
        if (item.taskStatus === 'IN_PROGRESS') {
          return 'info';
        }
        if (item.taskStatus === 'ASSIGNED') {
          return 'warning';
        }
        return 'danger';
      })(),
      source: '诊断管理',
      title: item.pathologyNo || item.caseId,
    }));

  const quickEntries: DashboardQuickEntry[] = [
    {
      description: '进入诊断任务分片',
      id: 'doctor-entry-1',
      route: '/doctor-workflow/assignment',
      title: '诊断分配',
    },
    {
      description: '按病例进入诊断工作台',
      highlight: true,
      id: 'doctor-entry-2',
      route: '/doctor-workflow/workbench',
      title: '诊断工作台',
    },
    {
      description: '查看报告追踪与修订',
      id: 'doctor-entry-3',
      route: '/doctor-workflow/tracking',
      title: '报告追踪',
    },
  ];

  return {
    alerts,
    cards,
    id: 'doctor',
    quickEntries,
    title: '诊断管理',
  };
}
