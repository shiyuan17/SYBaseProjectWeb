import type {
  DashboardAlertItem,
  DashboardDomainData,
  DashboardQuickEntry,
  DashboardWorkspaceCard,
} from '../../types/dashboard';

import type {
  EquipmentWarningView,
  MaterialLoanView,
  ReagentWarningView,
} from '#/modules/operation-support/types/operation-support';

import {
  listEquipmentWarnings,
  listPendingMaterialLoans,
  listReagentWarnings,
} from '#/modules/operation-support/api/operation-support-service';
import { M5_PERMISSION_CODES } from '#/modules/operation-support/constants';

import { formatCount, hasAnyPermission } from './dashboard-shared';

export async function loadOperationDomainData(
  accessCodes: string[],
): Promise<DashboardDomainData | null> {
  if (
    !hasAnyPermission(accessCodes, [
      M5_PERMISSION_CODES.ARCHIVE_QUERY,
      M5_PERMISSION_CODES.LOAN_QUERY,
      M5_PERMISSION_CODES.REAGENT_WARNING_QUERY,
      M5_PERMISSION_CODES.EQUIPMENT_WARNING_QUERY,
    ])
  ) {
    return null;
  }

  const [loans, reagentWarnings, equipmentWarnings] = await Promise.all([
    listPendingMaterialLoans({}),
    listReagentWarnings(),
    listEquipmentWarnings(),
  ]);

  const cards: DashboardWorkspaceCard[] = [
    {
      description: '借阅待归还材料',
      id: 'operation-loans',
      route: '/operation-support/archive',
      title: '借阅待归还',
      tone: loans.length > 0 ? 'warning' : 'success',
      value: formatCount(loans.length),
    },
    {
      description: '低库存或近效期试剂',
      id: 'operation-reagent',
      route: '/operation-resources/reagents',
      title: '试剂预警',
      tone: reagentWarnings.length > 0 ? 'danger' : 'success',
      value: formatCount(reagentWarnings.length),
    },
    {
      description: '即将到期或逾期维护设备',
      id: 'operation-equipment',
      route: '/operation-resources/equipment',
      title: '设备预警',
      tone: equipmentWarnings.length > 0 ? 'danger' : 'success',
      value: formatCount(equipmentWarnings.length),
    },
  ];

  const alerts: DashboardAlertItem[] = [
    ...loans.slice(0, 2).map((item: MaterialLoanView) => ({
      description: `${item.materialType} / ${item.borrowedByName || '-'} 尚未归还`,
      id: item.loanId,
      route: '/operation-support/archive',
      severity: 'warning' as const,
      source: '归档与借记',
      title: item.objectCode || item.pathologyNo || item.loanId,
    })),
    ...reagentWarnings.slice(0, 2).map((item: ReagentWarningView) => ({
      description: `${item.reagentName} / ${item.warningType}`,
      id: item.stockId,
      route: '/operation-resources/reagents',
      severity: 'danger' as const,
      source: '设备及试剂',
      title: `${item.reagentCode} / ${item.batchNo}`,
    })),
    ...equipmentWarnings.slice(0, 2).map((item: EquipmentWarningView) => ({
      description: `${item.equipmentName} / ${item.warningType}`,
      id: item.equipmentId,
      route: '/operation-resources/equipment',
      severity: 'danger' as const,
      source: '设备及试剂',
      title: item.equipmentCode,
    })),
  ];

  const quickEntries: DashboardQuickEntry[] = [
    {
      description: '查看档案与借记管理',
      id: 'operation-entry-1',
      route: '/operation-support/archive',
      title: '归档管理',
    },
    {
      description: '维护试剂耗材和库存预警',
      id: 'operation-entry-2',
      route: '/operation-resources/reagents',
      title: '试剂耗材管理',
    },
    {
      description: '查看仪器设备与保养记录',
      id: 'operation-entry-3',
      route: '/operation-resources/equipment',
      title: '仪器设备管理',
    },
  ];

  return {
    alerts,
    cards,
    id: 'operation',
    quickEntries,
    title: '归档与借记',
  };
}
