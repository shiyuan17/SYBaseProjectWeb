import type {
  DashboardAlertItem,
  DashboardDomainData,
  DashboardQuickEntry,
  DashboardWorkspaceCard,
} from '../../types/dashboard';

import type { PendingSpecimenItem } from '#/modules/specimen-workflow/types/specimen-workflow';

import {
  listApplications,
  listPendingFixations,
  listPendingReceipts,
  listPendingTransportOrders,
} from '#/modules/specimen-workflow/api/specimen-workflow-service';
import { M2_PERMISSION_CODES } from '#/modules/specimen-workflow/constants';

import { formatCount, hasAnyPermission } from './dashboard-shared';

export async function loadSpecimenDomainData(
  accessCodes: string[],
): Promise<DashboardDomainData | null> {
  if (
    !hasAnyPermission(accessCodes, [
      M2_PERMISSION_CODES.APPLICATION_DETAIL_QUERY,
      M2_PERMISSION_CODES.APPLICATION_CREATE,
      M2_PERMISSION_CODES.CLINICAL_IMPORT,
      M2_PERMISSION_CODES.SPECIMEN_REGISTER,
      M2_PERMISSION_CODES.FIXATION_VERIFY,
      M2_PERMISSION_CODES.TRANSPORT_HANDOVER,
      M2_PERMISSION_CODES.SPECIMEN_RECEIVE,
      M2_PERMISSION_CODES.SPECIMEN_TRACKING_QUERY,
    ])
  ) {
    return null;
  }

  const [applications, fixations, transportOrders, receipts] =
    await Promise.all([
      listApplications({ page: 1, size: 5 }),
      listPendingFixations({ page: 1, size: 5 }),
      listPendingTransportOrders({ page: 1, size: 5 }),
      listPendingReceipts({ page: 1, size: 5 }),
    ]);

  const cards: DashboardWorkspaceCard[] = [
    {
      description: '待处理申请与登记入口',
      id: 'specimen-applications',
      route: '/workflow/submission-registration',
      title: '申请/登记待办',
      tone: 'info',
      value: formatCount(applications.total),
    },
    {
      description: '未固定标本提醒',
      id: 'specimen-fixation',
      route: '/workflow/fixation-transport',
      title: '待固定标本',
      tone: fixations.total > 0 ? 'warning' : 'success',
      value: formatCount(fixations.total),
    },
    {
      description: '待交接转运单',
      id: 'specimen-transport',
      query: { tab: 'transport' },
      route: '/workflow/fixation-transport',
      title: '待转运单',
      tone: transportOrders.total > 0 ? 'warning' : 'success',
      value: formatCount(transportOrders.total),
    },
    {
      description: '病理科待接收标本',
      id: 'specimen-receipt',
      route: '/workflow/pathology-receipt',
      title: '待接收标本',
      tone: receipts.total > 0 ? 'warning' : 'success',
      value: formatCount(receipts.total),
    },
  ];

  const alerts: DashboardAlertItem[] = [
    ...fixations.items.slice(0, 3).map((item: PendingSpecimenItem) => ({
      description: `申请单 ${item.applicationNo} 仍未完成固定核对`,
      id: `fixation-${item.specimenId}`,
      query: { tab: 'fixation' },
      route: '/workflow/fixation-transport',
      severity: 'warning' as const,
      source: '临床送检',
      title: item.specimenNo || item.barcode,
    })),
    ...receipts.items.slice(0, 3).map((item: PendingSpecimenItem) => ({
      description: `申请单 ${item.applicationNo} 尚未完成标本接收`,
      id: `receipt-${item.specimenId}`,
      route: '/workflow/pathology-receipt',
      severity: 'warning' as const,
      source: '临床送检',
      title: item.specimenNo || item.barcode,
    })),
  ];

  const quickEntries: DashboardQuickEntry[] = [
    {
      description: '进入申请、登记与条码管理',
      id: 'specimen-entry-1',
      route: '/workflow/submission-registration',
      title: '申请与登记',
    },
    {
      description: '处理固定核对与转运交接',
      id: 'specimen-entry-2',
      route: '/workflow/fixation-transport',
      title: '固定与转运',
    },
    {
      description: '查看条码轨迹与异常',
      id: 'specimen-entry-3',
      route: '/workflow/tracking-exception',
      title: '追踪与异常',
    },
  ];

  return {
    alerts,
    cards,
    id: 'specimen',
    quickEntries,
    title: '临床送检',
  };
}
