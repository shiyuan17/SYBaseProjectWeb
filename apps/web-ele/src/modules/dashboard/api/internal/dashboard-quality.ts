import type {
  DashboardAlertItem,
  DashboardDomainData,
  DashboardQuickEntry,
  DashboardWorkspaceCard,
} from '../../types/dashboard';

import dayjs from 'dayjs';

import { queryStatReport } from '#/modules/m6-statistics/api/m6-statistics-service';
import { M6_PERMISSION_CODES } from '#/modules/m6-statistics/constants';

import { hasAnyPermission } from './dashboard-shared';

export async function loadQualityDomainData(
  accessCodes: string[],
): Promise<DashboardDomainData | null> {
  if (
    !hasAnyPermission(accessCodes, [
      M6_PERMISSION_CODES.STAT_INDICATOR_QUERY,
      M6_PERMISSION_CODES.STAT_REPORT_QUERY,
      M6_PERMISSION_CODES.STAT_REPORT_EXPORT,
      M6_PERMISSION_CODES.INTEGRATION_TASK_QUERY,
      M6_PERMISSION_CODES.HISTORY_QUERY,
      M6_PERMISSION_CODES.BILLING_QUERY,
    ])
  ) {
    return null;
  }

  const range = {
    from: dayjs().startOf('month').format('YYYY-MM-DDTHH:mm:ss'),
    to: dayjs().endOf('day').format('YYYY-MM-DDTHH:mm:ss'),
  };
  const report = await queryStatReport({
    category: 'QUALITY',
    ...range,
  });

  const metricMap = new Map(report.rows.map((row) => [row.indicatorCode, row]));
  const cards: DashboardWorkspaceCard[] = [
    {
      description: '本月质控统计查询入口',
      id: 'quality-statistics',
      route: '/m6/statistics',
      title: '质控统计',
      tone: 'info',
      value:
        metricMap.get('QC_DIAGNOSIS_TIMELINESS_RATE')?.metricValue ?? '0.00',
    },
    {
      description: '集成任务与外围系统联动',
      id: 'quality-integration',
      route: '/m6/integration',
      title: '集成任务',
      tone: 'info',
      value: '入口',
    },
    {
      description: '历史报告与运营查询',
      id: 'quality-history',
      route: '/m6/history',
      title: '历史报告',
      tone: 'info',
      value: '入口',
    },
  ];

  const alerts: DashboardAlertItem[] = [
    {
      description: '查看正式统计报表与导出结果',
      id: 'quality-alert-stat',
      route: '/m6/statistics',
      severity: 'info',
      source: '统计分析',
      title: '进入统计分析',
    },
  ];

  const quickEntries: DashboardQuickEntry[] = [
    {
      description: '统计分析入口',
      highlight: true,
      id: 'quality-entry-1',
      route: '/m6/statistics',
      title: '统计分析',
    },
    {
      description: '查看集成任务轨迹与补偿状态',
      id: 'quality-entry-2',
      route: '/m6/integration',
      title: '集成任务',
    },
    {
      description: '查看历史报告导入任务与入库结果',
      id: 'quality-entry-3',
      route: '/m6/history',
      title: '历史报告',
    },
  ];

  return {
    alerts,
    cards,
    id: 'quality',
    quickEntries,
    title: '质控与管理',
  };
}
