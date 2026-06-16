import type { StatReportResult } from '../types/m6-statistics';

import { describe, expect, it } from 'vitest';

import {
  buildBreakdownChartOption,
  buildDefaultDateRange,
  buildDetailSummaryItems,
  buildDisplayRows,
  buildReportPayload,
  buildTrendChartOption,
  buildWorkbenchRowsCsv,
  filterIndicatorsForTab,
  filterRowsForTab,
  filterTemplatesForTab,
  KEY_QUALITY_INDICATORS,
  localizeIndicatorName,
  localizeSourceNote,
  mergeWorkloadReports,
  normalizeQualityGroup,
  normalizeWorkbenchTab,
  QUALITY_MEDICAL_INDICATORS,
  QUALITY_PROFESSIONAL_INDICATORS,
  reportWorkbenchTabs,
  splitQualityRows,
} from './report-workbench';

function getTab(index: number) {
  const tab = reportWorkbenchTabs[index];
  if (!tab) {
    throw new Error(`Missing report workbench tab ${index}`);
  }
  return tab;
}

describe('report-workbench', () => {
  it('builds date ranges by period mode', () => {
    expect(buildDefaultDateRange('month')).toHaveLength(2);
    expect(buildDefaultDateRange('quarter')).toHaveLength(2);
    expect(buildDefaultDateRange('year')).toHaveLength(2);
  });

  it('normalizes route state for tab and quality group', () => {
    expect(normalizeWorkbenchTab('quality')).toBe('quality');
    expect(normalizeWorkbenchTab('unknown')).toBe('workload');
    expect(normalizeQualityGroup('medical')).toBe('medical');
    expect(normalizeQualityGroup('unknown')).toBe('professional');
  });

  it('builds tab payload and filters by tab type', () => {
    const filters = {
      dateRange: ['2026-06-01T00:00:00', '2026-06-30T23:59:59'],
      departmentId: 'DEP-1',
      departmentName: '病理科',
      indicatorCode: 'OP_CASE_VOLUME',
      periodMode: 'month' as const,
      roleId: 'ROLE-1',
      templateCode: 'TPL-1',
      workloadUserId: 'USER-1',
      workloadUserName: '张三',
    };
    const workloadTab = getTab(0);
    expect(buildReportPayload(workloadTab, filters)).toMatchObject({
      category: 'WORKLOAD',
      departmentId: 'DEP-1',
      indicatorCode: 'OP_CASE_VOLUME',
      periodMode: 'month',
      roleId: 'ROLE-1',
      templateCode: 'TPL-1',
      workloadUserId: 'USER-1',
    });
    expect(
      filterTemplatesForTab(
        [
          {
            defaultColumns: '',
            enabled: true,
            id: '1',
            indicatorCode: null,
            parameterSchema: '',
            sortOrder: 0,
            templateCode: 'a',
            templateName: 'A',
            templateType: 'WORKLOAD',
          },
          {
            defaultColumns: '',
            enabled: true,
            id: '2',
            indicatorCode: null,
            parameterSchema: '',
            sortOrder: 0,
            templateCode: 'b',
            templateName: 'B',
            templateType: 'QUALITY',
          },
        ],
        'workload',
        workloadTab,
      ).map((item) => item.templateCode),
    ).toEqual(['a']);
    expect(
      filterIndicatorsForTab(
        [
          {
            aggregationType: '',
            description: '',
            enabled: true,
            id: '1',
            indicatorCategory: 'WORKLOAD',
            indicatorCode: 'WL_DIAGNOSTIC_TASK_COUNT',
            indicatorName: '任务数',
            metricScope: '',
            sortOrder: 0,
          },
          {
            aggregationType: '',
            description: '',
            enabled: true,
            id: '2',
            indicatorCategory: 'QUALITY',
            indicatorCode: 'QC_SPECIMEN_FIXATION_RATE',
            indicatorName: '固定率',
            metricScope: '',
            sortOrder: 0,
          },
        ],
        'workload',
        workloadTab,
      ).map((item) => item.indicatorCode),
    ).toEqual(['WL_DIAGNOSTIC_TASK_COUNT']);
  });

  it('keeps key quality tab focused on critical value indicators', () => {
    const keyQualityTab = getTab(2);
    expect(keyQualityTab.indicatorCodes).toEqual(KEY_QUALITY_INDICATORS);
    expect(KEY_QUALITY_INDICATORS).toEqual([
      'QC_FROZEN_PARAFFIN_MATCH_RATE',
      'QC_CRITICAL_VALUE_COUNT',
      'QC_CRITICAL_VALUE_REPORT_TIMELINESS_RATE',
      'QC_CRITICAL_VALUE_REASON_ANALYSIS_COUNT',
    ]);
    expect(
      filterRowsForTab(
        [
          {
            indicatorCode: 'QC_FROZEN_PARAFFIN_MATCH_RATE',
            indicatorName: '冰冻石蜡符合率',
            metricUnit: 'PERCENT',
            metricValue: '95.00',
          },
          {
            indicatorCode: 'QC_CRITICAL_VALUE_COUNT',
            indicatorName: '危急值数量',
            metricUnit: 'COUNT',
            metricValue: '2',
          },
          {
            indicatorCode: 'QC_UNQUALIFIED_SPECIMEN_COUNT',
            indicatorName: '不合格标本',
            metricUnit: 'COUNT',
            metricValue: '1',
          },
          {
            indicatorCode: 'QC_FROZEN_DIAGNOSIS_TIMELINESS_RATE',
            indicatorName: '冰冻诊断及时率',
            metricUnit: 'PERCENT',
            metricValue: '80.00',
          },
        ],
        keyQualityTab,
      ).map((row) => row.indicatorCode),
    ).toEqual(['QC_FROZEN_PARAFFIN_MATCH_RATE', 'QC_CRITICAL_VALUE_COUNT']);
  });

  it('splits the thirteen quality indicators into professional and medical groups', () => {
    const professionalIndicators = [...QUALITY_PROFESSIONAL_INDICATORS];
    const medicalIndicators = [...QUALITY_MEDICAL_INDICATORS];
    const allQualityIndicators = new Set([
      ...professionalIndicators,
      ...medicalIndicators,
    ]);

    expect(professionalIndicators).toEqual([
      'QC_CONSULTATION_MATCH_RATE',
      'QC_CYTOLOGY_MATCH_RATE',
      'QC_FROZEN_PARAFFIN_MATCH_RATE',
      'QC_GROSSING_QUALITY_COUNT',
      'QC_TECHNICAL_QUALITY_COUNT',
    ]);
    expect(medicalIndicators).toEqual([
      'QC_CANCELLED_REVIEW_COUNT',
      'QC_CLINICAL_MATCH_RATE',
      'QC_DIAGNOSIS_TIMELINESS_RATE',
      'QC_FIRST_LINE_MATCH_RATE',
      'QC_REPORT_RELEASE_DAYS',
      'QC_SPECIMEN_FIXATION_RATE',
      'QC_SPECIMEN_PROCESS_HOURS',
      'QC_UNQUALIFIED_SPECIMEN_COUNT',
    ]);
    expect(allQualityIndicators.size).toBe(13);
  });

  it('keeps specialized quality tabs on goal-specific indicators', () => {
    expect(getTab(3).indicatorCodes).toEqual([
      'QC_FROZEN_DIAGNOSIS_TIMELINESS_RATE',
      'QC_FROZEN_TIMEOUT_COUNT',
      'QC_FROZEN_GROSSING_TIMEOUT_COUNT',
      'QC_FROZEN_SLICING_TIMEOUT_COUNT',
      'QC_FROZEN_DIAGNOSIS_TIMEOUT_COUNT',
    ]);
    expect(getTab(4).indicatorCodes).toEqual([
      'QC_REPORT_CHANGE_COUNT',
      'QC_REPORT_CHANGE_DOCTOR_COUNT',
      'QC_REPORT_MODIFICATION_REASON_COUNT',
      'QC_REPORT_REVISION_REASON_COUNT',
    ]);
    expect(getTab(5).indicatorCodes).toEqual([
      'QC_UNQUALIFIED_SPECIMEN_COUNT',
      'QC_UNQUALIFIED_SPECIMEN_RATE',
      'QC_UNQUALIFIED_SPECIMEN_REASON_COUNT',
    ]);
  });

  it('builds rows and chart options', () => {
    const rows = buildDisplayRows([
      {
        denominator: '10',
        indicatorCode: 'QC_SPECIMEN_FIXATION_RATE',
        indicatorName: '固定率',
        metricStatus: 'AVAILABLE',
        metricUnit: 'PERCENT',
        metricValue: '90.00',
        numerator: '9',
        sourceNote: 'specimens',
      },
    ]);
    expect(rows[0]?.metricValueText).toBe('90.00%');
    expect(rows[0]?.displayIndicatorName).toBe('标本规范化固定率');
    expect(rows[0]?.displaySourceNote).toBe('按标本数据统计');
    expect(buildTrendChartOption(rows)).toBeTruthy();
    expect(buildBreakdownChartOption(rows)).toBeTruthy();
    expect(splitQualityRows(rows, 'medical')).toEqual(rows);
    expect(filterRowsForTab(rows, getTab(1))).toEqual(rows);
  });

  it('localizes visible indicator and source text', () => {
    expect(
      localizeIndicatorName('QC_CRITICAL_VALUE_COUNT', 'Critical Value Count'),
    ).toBe('危急值数量');
    expect(localizeSourceNote('diagnostic_tasks / medical_orders')).toBe(
      '按诊断任务与医嘱执行综合统计',
    );
  });

  it('builds detail summary and workload merge', () => {
    expect(buildDetailSummaryItems(null)).toEqual([
      { count: 0, label: '纳入病例', status: 'AVAILABLE' },
      { count: 0, label: '通过', status: 'AVAILABLE' },
      { count: 0, label: '未通过', status: 'UNAVAILABLE' },
    ]);
    const merged = mergeWorkloadReports(
      {
        columns: ['a'],
        reportCode: 'OPERATION',
        rows: [],
      } satisfies StatReportResult,
      {
        columns: ['b'],
        reportCode: 'WORKLOAD',
        rows: [],
      } satisfies StatReportResult,
    );
    expect(merged.columns).toEqual(['a', 'b']);
  });

  it('builds csv for merged workbench rows', () => {
    expect(
      buildWorkbenchRowsCsv([
        {
          denominator: null,
          indicatorCode: 'OP_CASE_VOLUME',
          indicatorName: '病例量',
          metricStatus: 'AVAILABLE',
          metricUnit: 'COUNT',
          metricValue: '8',
          numerator: null,
          sourceNote: 'pathology,cases',
        },
        {
          denominator: null,
          indicatorCode: 'WL_DIAGNOSTIC_TASK_COUNT',
          indicatorName: '诊断任务数',
          metricStatus: 'AVAILABLE',
          metricUnit: 'COUNT',
          metricValue: '3',
          numerator: null,
          sourceNote: 'diagnostic_tasks',
        },
      ]),
    ).toContain('OP_CASE_VOLUME,病例量,8,COUNT,AVAILABLE,,,"pathology,cases"');
  });
});
