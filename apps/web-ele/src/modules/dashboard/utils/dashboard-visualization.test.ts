import type {
  AnalyticsOverviewResult,
  DashboardDomainData,
} from '../types/dashboard';

import { describe, expect, it } from 'vitest';

import {
  buildAnalyticsVisualSummary,
  buildQualityChartData,
  buildRiskDistribution,
  buildWorkspaceVisualSummary,
} from './dashboard-visualization';

function createOverview(
  overrides: Partial<AnalyticsOverviewResult> = {},
): AnalyticsOverviewResult {
  return {
    kpiCards: [
      {
        description: '本月病例量',
        id: 'kpi-case-volume',
        title: '病例量',
        unit: 'COUNT',
        value: '128',
      },
      {
        description: '本月收费',
        id: 'kpi-billing',
        title: '收费金额',
        unit: 'CNY',
        value: '56000.00',
      },
      {
        description: '质控达成',
        id: 'kpi-quality',
        title: '诊断及时率',
        unit: 'PERCENT',
        value: '96.50',
      },
      {
        description: '工作量',
        id: 'kpi-workload',
        title: '绩效工作量',
        unit: 'COUNT',
        value: '86',
      },
    ],
    operationRows: [
      {
        code: 'OP_CASE_VOLUME',
        label: '病例量',
        unit: 'COUNT',
        value: '128',
      },
      {
        code: 'OP_BILLING_AMOUNT',
        label: '收费金额',
        unit: 'CNY',
        value: '56000.00',
      },
      {
        code: 'OP_REAGENT_STOCK_ALERT',
        label: '试剂预警',
        unit: 'COUNT',
        value: '3',
      },
    ],
    qualityRows: [
      {
        code: 'QC_DIAGNOSIS_TIMELINESS_RATE',
        label: '诊断及时率',
        unit: 'PERCENT',
        value: '96.50',
      },
      {
        code: 'QC_CLINICAL_MATCH_RATE',
        label: '临床病理符合率',
        unit: 'PERCENT',
        value: '92.10',
      },
      {
        code: 'QC_TECHNICAL_QUALITY_COUNT',
        label: '技术质控异常数',
        unit: 'COUNT',
        value: '4',
      },
    ],
    riskCards: [
      {
        count: 5,
        description: '技术超时任务',
        id: 'risk-timeout',
        severity: 'danger',
        title: '技术超时',
      },
      {
        count: 2,
        description: '返工任务',
        id: 'risk-rework',
        severity: 'warning',
        title: '返工任务',
      },
      {
        count: 0,
        description: '未读通知',
        id: 'risk-notification',
        severity: 'info',
        title: '通知待办',
      },
    ],
    workloadRows: [
      {
        code: 'WL_DIAGNOSTIC_TASK_COUNT',
        label: '诊断任务数',
        unit: 'COUNT',
        value: '66',
      },
      {
        code: 'WL_MEDICAL_ORDER_COUNT',
        label: '病理医嘱数',
        unit: 'COUNT',
        value: '20',
      },
    ],
    ...overrides,
  };
}

function createDomainData(
  overrides: Partial<DashboardDomainData>,
): DashboardDomainData {
  return {
    alerts: [],
    cards: [],
    id: 'specimen',
    quickEntries: [],
    title: '临床送检',
    ...overrides,
  };
}

describe('dashboard visualization helpers', () => {
  it('keeps only percentage metrics for quality chart data', () => {
    expect(buildQualityChartData(createOverview().qualityRows)).toEqual([
      expect.objectContaining({
        id: 'QC_DIAGNOSIS_TIMELINESS_RATE',
        unit: '%',
        value: 96.5,
      }),
      expect.objectContaining({
        id: 'QC_CLINICAL_MATCH_RATE',
        unit: '%',
        value: 92.1,
      }),
    ]);
  });

  it('maps risk cards to chart-friendly distribution data', () => {
    expect(buildRiskDistribution(createOverview().riskCards)).toEqual([
      expect.objectContaining({
        id: 'risk-timeout',
        tone: 'danger',
        value: 5,
        valueText: '5',
      }),
      expect.objectContaining({
        id: 'risk-rework',
        tone: 'warning',
        value: 2,
      }),
      expect.objectContaining({
        id: 'risk-notification',
        tone: 'info',
        value: 0,
      }),
    ]);
  });

  it('aggregates workspace cards by domain and keeps highest-priority hero card first', () => {
    const summary = buildWorkspaceVisualSummary([
      createDomainData({
        cards: [
          {
            description: '待处理固定核对',
            id: 'specimen-fixation',
            title: '待固定标本',
            tone: 'warning',
            value: '12',
          },
        ],
      }),
      createDomainData({
        cards: [
          {
            description: '超时返工',
            id: 'technical-rework',
            title: '返工任务',
            tone: 'danger',
            value: '3',
          },
        ],
        id: 'technical',
        title: '制片管理',
      }),
    ]);

    expect(summary.heroCard).toEqual(
      expect.objectContaining({
        domainId: 'technical',
        title: '返工任务',
      }),
    );
    expect(summary.distribution).toEqual([
      expect.objectContaining({
        id: 'specimen',
        value: 1,
      }),
      expect.objectContaining({
        id: 'technical',
        value: 1,
      }),
    ]);
  });

  it('returns stable empty-state structures for empty input', () => {
    expect(buildAnalyticsVisualSummary(createOverview({
      kpiCards: [],
      operationRows: [],
      qualityRows: [],
      riskCards: [],
      workloadRows: [],
    }))).toEqual({
      heroMetrics: [],
      operationSignals: [],
      qualityChartData: [],
      riskDistribution: [],
      workloadChartData: [],
    });

    expect(buildWorkspaceVisualSummary([])).toEqual({
      alerts: [],
      distribution: [],
      domainSummaries: [],
      heroCard: null,
      quickEntries: [],
      secondaryCards: [],
      spotlight: {
        dangerCount: 0,
        infoCount: 0,
        warningCount: 0,
        warningRiskCount: 0,
      },
      todoCards: [],
    });
  });
});
