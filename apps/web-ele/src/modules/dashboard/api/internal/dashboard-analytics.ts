import type {
  AnalyticsKpiCard,
  AnalyticsOverviewResult,
  AnalyticsRiskCard,
} from '../../types/dashboard';

import dayjs from 'dayjs';

import {
  listStatIndicators,
  queryStatReport,
} from '#/modules/m6-statistics/api/m6-statistics-service';
import {
  listEquipmentWarnings,
  listReagentWarnings,
} from '#/modules/operation-support/api/operation-support-service';
import { M5_PERMISSION_CODES } from '#/modules/operation-support/constants';
import { listPendingTechnicalTasks } from '#/modules/technical-workflow/api/technical-workflow-service';
import { M3_PERMISSION_CODES } from '#/modules/technical-workflow/constants';

import { loadNotificationSummary } from './dashboard-notification';
import {
  formatCurrency,
  hasAnyPermission,
  mapRowsToTable,
} from './dashboard-shared';

export async function loadAnalyticsOverview(
  accessCodes: string[],
): Promise<AnalyticsOverviewResult> {
  const from = dayjs().startOf('month').format('YYYY-MM-DDTHH:mm:ss');
  const to = dayjs().endOf('day').format('YYYY-MM-DDTHH:mm:ss');

  const [
    quality,
    operation,
    workload,
    technical,
    reagents,
    equipment,
    notifications,
    indicators,
  ] = await Promise.all([
    queryStatReport({ category: 'QUALITY', from, to }),
    queryStatReport({ category: 'OPERATION', from, to }),
    queryStatReport({ category: 'WORKLOAD', from, to }),
    listPendingTechnicalTasks({ page: 1, size: 100, timedOutOnly: false }),
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
      unit:
        getMetric(operation.rows, 'OP_PERFORMANCE_WORKLOAD')?.metricUnit ??
        'COUNT',
      value:
        getMetric(operation.rows, 'OP_PERFORMANCE_WORKLOAD')?.metricValue ??
        '0',
    },
    {
      description: '标本固定合格率',
      id: 'kpi-fixation-rate',
      query: { category: 'QUALITY' },
      route: '/m6/statistics',
      title:
        indicatorNameMap.get('QC_SPECIMEN_FIXATION_RATE') ?? '标本固定合格率',
      unit: 'PERCENT',
      value:
        getMetric(quality.rows, 'QC_SPECIMEN_FIXATION_RATE')?.metricValue ??
        '0.00',
    },
    {
      description: '临床病理符合率',
      id: 'kpi-clinical-match',
      query: { category: 'QUALITY' },
      route: '/m6/statistics',
      title: indicatorNameMap.get('QC_CLINICAL_MATCH_RATE') ?? '临床病理符合率',
      unit: 'PERCENT',
      value:
        getMetric(quality.rows, 'QC_CLINICAL_MATCH_RATE')?.metricValue ??
        '0.00',
    },
    {
      description: '诊断及时率',
      id: 'kpi-diagnosis-timeliness',
      query: { category: 'QUALITY' },
      route: '/m6/statistics',
      title:
        indicatorNameMap.get('QC_DIAGNOSIS_TIMELINESS_RATE') ?? '诊断及时率',
      unit: 'PERCENT',
      value:
        getMetric(quality.rows, 'QC_DIAGNOSIS_TIMELINESS_RATE')?.metricValue ??
        '0.00',
    },
    {
      description: '技术与取材质控异常数',
      id: 'kpi-technical-qc',
      query: { category: 'QUALITY' },
      route: '/m6/statistics',
      title: '技术/取材质控异常数',
      unit: 'COUNT',
      value: String(
        Number(
          getMetric(quality.rows, 'QC_TECHNICAL_QUALITY_COUNT')?.metricValue ??
            0,
        ) +
          Number(
            getMetric(quality.rows, 'QC_GROSSING_QUALITY_COUNT')?.metricValue ??
              0,
          ),
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
      count: technical.items.filter((item) => item.taskType === 'REWORK')
        .length,
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
