import type {
  AnalyticsKpiCard,
  AnalyticsOverviewResult,
  AnalyticsRiskCard,
  DashboardAlertItem,
  DashboardDomainData,
  DashboardNotificationItem,
  DashboardNotificationSummary,
  DashboardQuickEntry,
  DashboardWorkspaceCard,
} from '../types/dashboard';

import type { NotificationViewModel } from '#/modules/notification-center/types/notification-center';
import type { PendingDiagnosticTaskItem } from '#/modules/doctor-workflow/types/doctor-workflow';
import type { EquipmentWarningView, MaterialLoanView, ReagentWarningView } from '#/modules/operation-support/types/operation-support';
import type { PendingSpecimenItem } from '#/modules/specimen-workflow/types/specimen-workflow';
import type { PendingTechnicalTaskItem } from '#/modules/technical-workflow/types/technical-workflow';

import dayjs from 'dayjs';

import { getMyNotificationUnreadCount, listMyNotifications } from '#/modules/notification-center/api/notification-center-service';
import { listPendingDiagnosticTasks } from '#/modules/doctor-workflow/api/doctor-workflow-service';
import { M4_PERMISSION_CODES } from '#/modules/doctor-workflow/constants';
import {
  listEquipmentWarnings,
  listPendingMaterialLoans,
  listReagentWarnings,
} from '#/modules/operation-support/api/operation-support-service';
import { M5_PERMISSION_CODES } from '#/modules/operation-support/constants';
import {
  listApplications,
  listPendingFixations,
  listPendingReceipts,
  listPendingTransportOrders,
} from '#/modules/specimen-workflow/api/specimen-workflow-service';
import { M2_PERMISSION_CODES } from '#/modules/specimen-workflow/constants';
import { listPendingTechnicalTasks } from '#/modules/technical-workflow/api/technical-workflow-service';
import {
  M3_PERMISSION_CODES,
  TASK_TYPE_ROUTE_MAP,
  TASK_TYPE_TITLE_MAP,
} from '#/modules/technical-workflow/constants';
import { listStatIndicators, queryStatReport } from '#/modules/m6-statistics/api/m6-statistics-service';
import { M6_PERMISSION_CODES } from '#/modules/m6-statistics/constants';

function hasAnyPermission(accessCodes: string[], codes: string[]) {
  return codes.some((code) => accessCodes.includes(code));
}

function formatCount(value: number) {
  return String(value);
}

function formatCurrency(value: string) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return value;
  }
  return numeric.toFixed(2);
}

function mapNotificationItem(
  item: NotificationViewModel,
): DashboardNotificationItem {
  return {
    actionRoute: item.actionRoute,
    category: item.category,
    createdAt: item.createdAt,
    id: item.id,
    query: item.actionQuery,
    status: item.status,
    summary: item.summary,
    title: item.title,
    topicCode: item.topicCode,
  };
}

export async function loadNotificationSummary(): Promise<DashboardNotificationSummary> {
  const [page, unreadCount] = await Promise.all([
    listMyNotifications({
      page: 1,
      size: 5,
      status: 'ALL',
    }),
    getMyNotificationUnreadCount(),
  ]);

  return {
    items: page.items.map(mapNotificationItem),
    unreadCount,
  };
}

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

  const [applications, fixations, transportOrders, receipts] = await Promise.all([
    listApplications({
      page: 1,
      size: 5,
    }),
    listPendingFixations({
      page: 1,
      size: 5,
    }),
    listPendingTransportOrders({
      page: 1,
      size: 5,
    }),
    listPendingReceipts({
      page: 1,
      size: 5,
    }),
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
      route: '/workflow/fixation-transport',
      query: { tab: 'transport' },
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
      description: `申请单 ${item.applicationNo} 尚未完成病理接收`,
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

  const visibleItems = result.items.filter((item) => {
    const route = item.taskType ? TASK_TYPE_ROUTE_MAP[item.taskType] : '';
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
  });

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
      query: { mode: items.some((item) => item.timedOut) ? 'exception' : 'queue' },
      route: TASK_TYPE_ROUTE_MAP[taskType] ?? '/technical-workflow/tasks',
      tag: items.some((item) => item.timedOut) ? '含超时' : undefined,
      title: TASK_TYPE_TITLE_MAP[taskType] ?? taskType,
      tone: items.some((item) => item.timedOut) ? 'danger' : 'info',
      value: formatCount(items.length),
    }));

  const alerts: DashboardAlertItem[] = visibleItems
    .filter((item) => item.timedOut || item.taskType === 'REWORK' || item.remarks)
    .slice(0, 5)
    .map((item) => ({
      description: item.remarks || `${item.pathologyNo || item.caseId} 待处理`,
      id: item.id,
      query: { caseId: item.caseId, mode: 'exception' },
      route:
        (item.taskType && TASK_TYPE_ROUTE_MAP[item.taskType]) ||
        '/technical-workflow/tasks',
      severity: item.timedOut ? 'danger' : item.taskType === 'REWORK' ? 'warning' : 'info',
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

  const assigned = result.items.filter((item) => item.taskStatus === 'ASSIGNED');
  const accepted = result.items.filter((item) => item.taskStatus === 'ACCEPTED');
  const inProgress = result.items.filter((item) => item.taskStatus === 'IN_PROGRESS');

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

  const alerts: DashboardAlertItem[] = result.items.slice(0, 5).map((item: PendingDiagnosticTaskItem) => ({
    description: `${item.patientName || '未命名患者'} / ${
      item.taskStatus || 'PENDING'
    }`,
    id: `doctor-${item.id}`,
    query: {
      caseId: item.caseId,
      pathologyNo: item.pathologyNo ?? '',
      taskId: item.id,
    },
    route: '/doctor-workflow/workbench',
    severity:
      item.taskStatus === 'IN_PROGRESS'
        ? 'info'
        : item.taskStatus === 'ASSIGNED'
          ? 'warning'
          : 'danger',
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
      route: '/operation-support/reagents',
      title: '试剂预警',
      tone: reagentWarnings.length > 0 ? 'danger' : 'success',
      value: formatCount(reagentWarnings.length),
    },
    {
      description: '即将到期或逾期维护设备',
      id: 'operation-equipment',
      route: '/operation-support/equipment',
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
      source: '归档运营',
      title: item.objectCode || item.pathologyNo || item.loanId,
    })),
    ...reagentWarnings.slice(0, 2).map((item: ReagentWarningView) => ({
      description: `${item.reagentName} / ${item.warningType}`,
      id: item.stockId,
      route: '/operation-support/reagents',
      severity: 'danger' as const,
      source: '归档运营',
      title: `${item.reagentCode} / ${item.batchNo}`,
    })),
    ...equipmentWarnings.slice(0, 2).map((item: EquipmentWarningView) => ({
      description: `${item.equipmentName} / ${item.warningType}`,
      id: item.equipmentId,
      route: '/operation-support/equipment',
      severity: 'danger' as const,
      source: '归档运营',
      title: item.equipmentCode,
    })),
  ];

  const quickEntries: DashboardQuickEntry[] = [
    {
      description: '查看档案与借阅管理',
      id: 'operation-entry-1',
      route: '/operation-support/archive',
      title: '归档管理',
    },
    {
      description: '维护试剂台账和库存预警',
      id: 'operation-entry-2',
      route: '/operation-support/reagents',
      title: '试剂台账',
    },
    {
      description: '查看设备台账与保养记录',
      id: 'operation-entry-3',
      route: '/operation-support/equipment',
      title: '设备台账',
    },
  ];

  return {
    alerts,
    cards,
    id: 'operation',
    quickEntries,
    title: '归档运营',
  };
}

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
      value: metricMap.get('QC_DIAGNOSIS_TIMELINESS_RATE')?.metricValue ?? '0.00',
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

function mapRowsToTable(
  rows: Array<{ indicatorCode: string; indicatorName: string; metricUnit: string; metricValue: string }>,
  wantedCodes: string[],
) {
  return wantedCodes
    .map((code) => rows.find((row) => row.indicatorCode === code))
    .filter((row): row is NonNullable<typeof row> => row !== undefined)
    .map((row) => ({
      code: row.indicatorCode,
      label: row.indicatorName,
      unit: row.metricUnit,
      value: row.metricValue,
    }));
}

export async function loadAnalyticsOverview(
  accessCodes: string[],
): Promise<AnalyticsOverviewResult> {
  const from = dayjs().startOf('month').format('YYYY-MM-DDTHH:mm:ss');
  const to = dayjs().endOf('day').format('YYYY-MM-DDTHH:mm:ss');

  const [quality, operation, workload, technical, reagents, equipment, notifications, indicators] =
    await Promise.all([
      queryStatReport({
        category: 'QUALITY',
        from,
        to,
      }),
      queryStatReport({
        category: 'OPERATION',
        from,
        to,
      }),
      queryStatReport({
        category: 'WORKLOAD',
        from,
        to,
      }),
      listPendingTechnicalTasks({
        page: 1,
        size: 100,
        timedOutOnly: false,
      }),
      listReagentWarnings(),
      listEquipmentWarnings(),
      loadNotificationSummary(),
      listStatIndicators(),
    ]);

  const indicatorNameMap = new Map(
    indicators.map((item) => [item.indicatorCode, item.indicatorName]),
  );
  const getMetric = (rows: typeof quality.rows, code: string) =>
    rows.find((item) => item.indicatorCode === code);

  const kpiCards: AnalyticsKpiCard[] = [
    {
      description: '本月病例量',
      id: 'kpi-case-volume',
      query: { category: 'OPERATION' },
      route: '/m6/statistics',
      title: indicatorNameMap.get('OP_CASE_VOLUME') ?? '病例量',
      unit: getMetric(operation.rows, 'OP_CASE_VOLUME')?.metricUnit ?? 'COUNT',
      value: getMetric(operation.rows, 'OP_CASE_VOLUME')?.metricValue ?? '0',
    },
    {
      description: '本月收费金额',
      id: 'kpi-billing',
      query: { category: 'OPERATION' },
      route: '/m6/statistics',
      title: indicatorNameMap.get('OP_BILLING_AMOUNT') ?? '收费金额',
      unit: 'CNY',
      value: formatCurrency(
        getMetric(operation.rows, 'OP_BILLING_AMOUNT')?.metricValue ?? '0',
      ),
    },
    {
      description: '试剂库存预警总数',
      id: 'kpi-reagent-warning',
      route: '/operation-support/reagents',
      title: '试剂预警数',
      unit: 'COUNT',
      value: String(reagents.length),
    },
    {
      description: '绩效工作量',
      id: 'kpi-workload',
      query: { category: 'WORKLOAD' },
      route: '/m6/statistics',
      title: indicatorNameMap.get('OP_PERFORMANCE_WORKLOAD') ?? '绩效工作量',
      unit: getMetric(operation.rows, 'OP_PERFORMANCE_WORKLOAD')?.metricUnit ?? 'COUNT',
      value: getMetric(operation.rows, 'OP_PERFORMANCE_WORKLOAD')?.metricValue ?? '0',
    },
    {
      description: '标本固定合格率',
      id: 'kpi-fixation-rate',
      query: { category: 'QUALITY' },
      route: '/m6/statistics',
      title: indicatorNameMap.get('QC_SPECIMEN_FIXATION_RATE') ?? '标本固定合格率',
      unit: 'PERCENT',
      value: getMetric(quality.rows, 'QC_SPECIMEN_FIXATION_RATE')?.metricValue ?? '0.00',
    },
    {
      description: '临床病理符合率',
      id: 'kpi-clinical-match',
      query: { category: 'QUALITY' },
      route: '/m6/statistics',
      title: indicatorNameMap.get('QC_CLINICAL_MATCH_RATE') ?? '临床病理符合率',
      unit: 'PERCENT',
      value: getMetric(quality.rows, 'QC_CLINICAL_MATCH_RATE')?.metricValue ?? '0.00',
    },
    {
      description: '诊断及时率',
      id: 'kpi-diagnosis-timeliness',
      query: { category: 'QUALITY' },
      route: '/m6/statistics',
      title: indicatorNameMap.get('QC_DIAGNOSIS_TIMELINESS_RATE') ?? '诊断及时率',
      unit: 'PERCENT',
      value: getMetric(quality.rows, 'QC_DIAGNOSIS_TIMELINESS_RATE')?.metricValue ?? '0.00',
    },
    {
      description: '技术与取材质控异常数',
      id: 'kpi-technical-qc',
      query: { category: 'QUALITY' },
      route: '/m6/statistics',
      title: '技术/取材质控异常数',
      unit: 'COUNT',
      value: String(
        Number(getMetric(quality.rows, 'QC_TECHNICAL_QUALITY_COUNT')?.metricValue ?? 0) +
          Number(getMetric(quality.rows, 'QC_GROSSING_QUALITY_COUNT')?.metricValue ?? 0),
      ),
    },
  ];

  const riskCards: AnalyticsRiskCard[] = [
    {
      count: technical.items.filter((item) => item.timedOut).length,
      description: '技术超时任务',
      id: 'risk-technical-timeout',
      route: '/technical-workflow/entry',
      severity: 'danger',
      title: '技术超时',
    },
    {
      count: technical.items.filter((item) => item.taskType === 'REWORK').length,
      description: '返工单与返工任务',
      id: 'risk-rework',
      route: '/technical-workflow/rework',
      severity: 'warning',
      title: '返工任务',
    },
    {
      count: reagents.length,
      description: '低库存与近效期试剂',
      id: 'risk-reagent',
      route: '/operation-support/reagents',
      severity: reagents.length > 0 ? 'danger' : 'info',
      title: '试剂预警',
    },
    {
      count: equipment.length,
      description: '到期与逾期维护设备',
      id: 'risk-equipment',
      route: '/operation-support/equipment',
      severity: equipment.length > 0 ? 'danger' : 'info',
      title: '设备预警',
    },
    {
      count: notifications.unreadCount,
      description: '未读质控/待办消息',
      id: 'risk-notification',
      route: '/notifications',
      severity: notifications.unreadCount > 0 ? 'warning' : 'info',
      title: '通知待办',
    },
  ];

  return {
    kpiCards,
    operationRows: mapRowsToTable(operation.rows, [
      'OP_CASE_VOLUME',
      'OP_BILLING_AMOUNT',
      'OP_REAGENT_STOCK_ALERT',
      'OP_PERFORMANCE_WORKLOAD',
    ]),
    qualityRows: mapRowsToTable(quality.rows, [
      'QC_SPECIMEN_FIXATION_RATE',
      'QC_CLINICAL_MATCH_RATE',
      'QC_DIAGNOSIS_TIMELINESS_RATE',
      'QC_TECHNICAL_QUALITY_COUNT',
      'QC_GROSSING_QUALITY_COUNT',
    ]),
    riskCards: riskCards.filter((item) => {
      if (item.id === 'risk-technical-timeout' || item.id === 'risk-rework') {
        return hasAnyPermission(accessCodes, [
          M3_PERMISSION_CODES.TECHNICAL_TASK_QUERY,
          M3_PERMISSION_CODES.REWORK,
        ]);
      }
      if (item.id === 'risk-reagent') {
        return hasAnyPermission(accessCodes, [
          M5_PERMISSION_CODES.REAGENT_QUERY,
          M5_PERMISSION_CODES.REAGENT_WARNING_QUERY,
        ]);
      }
      if (item.id === 'risk-equipment') {
        return hasAnyPermission(accessCodes, [
          M5_PERMISSION_CODES.EQUIPMENT_QUERY,
          M5_PERMISSION_CODES.EQUIPMENT_WARNING_QUERY,
        ]);
      }
      return true;
    }),
    workloadRows: mapRowsToTable(workload.rows, [
      'WL_DIAGNOSTIC_TASK_COUNT',
      'WL_MEDICAL_ORDER_COUNT',
    ]),
  };
}
