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
      route: '/m6/quality-indicators',
      title: '质控指标统计',
      tone: 'info',
      value:
        metricMap.get('QC_DIAGNOSIS_TIMELINESS_RATE')?.metricValue ?? '0.00',
    },
    {
      description: '查看运营和工作量相关指标',
      id: 'quality-management',
      route: '/m6/management-indicators',
      title: '管理指标统计',
      tone: 'info',
      value: '入口',
    },
    {
      description: '进入正式统计分析与导出页面',
      id: 'quality-custom',
      route: '/m6/custom-analysis',
      title: '自定义统计分析',
      tone: 'info',
      value: '入口',
    },
  ];

  const alerts: DashboardAlertItem[] = [
    {
      description: '查看正式统计报表与导出结果',
      id: 'quality-alert-stat',
      route: '/m6/custom-analysis',
      severity: 'info',
      source: '数据统计与分析',
      title: '进入自定义统计分析',
    },
  ];

  const quickEntries: DashboardQuickEntry[] = [
    {
      description: '查看质控指标统计入口',
      highlight: true,
      id: 'quality-entry-1',
      route: '/m6/quality-indicators',
      title: '质控指标统计',
    },
    {
      description: '查看管理指标统计入口',
      id: 'quality-entry-2',
      route: '/m6/management-indicators',
      title: '管理指标统计',
    },
    {
      description: '进入正式统计分析与导出',
      id: 'quality-entry-3',
      route: '/m6/custom-analysis',
      title: '自定义统计分析',
    },
  ];

  return {
    alerts,
    cards,
    id: 'quality',
    quickEntries,
    title: '数据统计与分析',
  };
}
