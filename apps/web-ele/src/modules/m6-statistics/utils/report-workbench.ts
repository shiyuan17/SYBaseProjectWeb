import type {
  MetricStatus,
  StatIndicatorCategory,
  StatIndicatorView,
  StatReportDetailItem,
  StatReportDetailQuery,
  StatReportDetailResult,
  StatReportQuery,
  StatReportResult,
  StatReportRow,
  StatReportTemplateView,
} from '../types/m6-statistics';

export type PeriodMode = 'month' | 'quarter' | 'year';
export type WorkbenchTab =
  | 'custom'
  | 'frozen'
  | 'keyQuality'
  | 'quality'
  | 'reportChange'
  | 'unqualified'
  | 'workload';

export interface ReportWorkbenchTab {
  category: StatIndicatorCategory;
  description: string;
  detailEnabled: boolean;
  indicatorCodes: string[];
  key: WorkbenchTab;
  title: string;
}

export interface ReportWorkbenchFilterState {
  dateRange: string[];
  departmentId: string;
  departmentName: string;
  indicatorCode: string;
  periodMode: PeriodMode;
  roleId: string;
  templateCode: string;
  workloadUserId: string;
  workloadUserName: string;
}

export interface DisplayStatReportRow extends StatReportRow {
  metricValueText: string;
}

export type ReportChartOption = Record<string, unknown>;

export const QUALITY_PROFESSIONAL_INDICATORS = new Set([
  'QC_CONSULTATION_MATCH_RATE',
  'QC_CYTOLOGY_MATCH_RATE',
  'QC_FROZEN_PARAFFIN_MATCH_RATE',
  'QC_GROSSING_QUALITY_COUNT',
  'QC_TECHNICAL_QUALITY_COUNT',
]);

export const QUALITY_MEDICAL_INDICATORS = new Set([
  'QC_CANCELLED_REVIEW_COUNT',
  'QC_CLINICAL_MATCH_RATE',
  'QC_DIAGNOSIS_TIMELINESS_RATE',
  'QC_FIRST_LINE_MATCH_RATE',
  'QC_REPORT_RELEASE_DAYS',
  'QC_SPECIMEN_FIXATION_RATE',
  'QC_SPECIMEN_PROCESS_HOURS',
  'QC_UNQUALIFIED_SPECIMEN_COUNT',
]);

export const KEY_QUALITY_INDICATORS = [
  'QC_FROZEN_PARAFFIN_MATCH_RATE',
  'QC_CRITICAL_VALUE_COUNT',
  'QC_CRITICAL_VALUE_REPORT_TIMELINESS_RATE',
  'QC_CRITICAL_VALUE_REASON_ANALYSIS_COUNT',
];

export const FROZEN_ANALYSIS_INDICATORS = [
  'QC_FROZEN_DIAGNOSIS_TIMELINESS_RATE',
  'QC_FROZEN_TIMEOUT_COUNT',
  'QC_FROZEN_GROSSING_TIMEOUT_COUNT',
  'QC_FROZEN_SLICING_TIMEOUT_COUNT',
  'QC_FROZEN_DIAGNOSIS_TIMEOUT_COUNT',
];

export const REPORT_CHANGE_INDICATORS = [
  'QC_REPORT_CHANGE_COUNT',
  'QC_REPORT_CHANGE_DOCTOR_COUNT',
  'QC_REPORT_MODIFICATION_REASON_COUNT',
  'QC_REPORT_REVISION_REASON_COUNT',
];

export const UNQUALIFIED_INDICATORS = [
  'QC_UNQUALIFIED_SPECIMEN_COUNT',
  'QC_UNQUALIFIED_SPECIMEN_RATE',
  'QC_UNQUALIFIED_SPECIMEN_REASON_COUNT',
];

export const WORKLOAD_INDICATORS = [
  'OP_CASE_VOLUME',
  'OP_BILLING_AMOUNT',
  'OP_PERFORMANCE_WORKLOAD',
  'WL_DIAGNOSTIC_TASK_COUNT',
  'WL_MEDICAL_ORDER_COUNT',
];

export const reportWorkbenchTabs: ReportWorkbenchTab[] = [
  {
    category: 'WORKLOAD',
    description: '按月度、季度、年度对比业务量、收费与人员工作量。',
    detailEnabled: false,
    indicatorCodes: WORKLOAD_INDICATORS,
    key: 'workload',
    title: '工作量报表',
  },
  {
    category: 'QUALITY',
    description: '分重点专业指标与医疗质量指标查看病理十三项质控。',
    detailEnabled: true,
    indicatorCodes: [],
    key: 'quality',
    title: '质量与安全控制',
  },
  {
    category: 'QUALITY',
    description: '聚焦冰冻石蜡符合率、危急值数量、上报及时率与原因分布。',
    detailEnabled: true,
    indicatorCodes: KEY_QUALITY_INDICATORS,
    key: 'keyQuality',
    title: '关键质控指标',
  },
  {
    category: 'QUALITY',
    description: '查看术中快速冰冻诊断及时率、冰冻相关超时与处理周期。',
    detailEnabled: true,
    indicatorCodes: FROZEN_ANALYSIS_INDICATORS,
    key: 'frozen',
    title: '冰冻时效分析',
  },
  {
    category: 'QUALITY',
    description: '分析报告修改、修订申请、发放周期和医生相关工作量。',
    detailEnabled: true,
    indicatorCodes: REPORT_CHANGE_INDICATORS,
    key: 'reportChange',
    title: '更改报告分析',
  },
  {
    category: 'QUALITY',
    description: '按周期查看不合格标本数量、固定质量和原因分布。',
    detailEnabled: true,
    indicatorCodes: UNQUALIFIED_INDICATORS,
    key: 'unqualified',
    title: '不合格标本分析',
  },
  {
    category: 'CUSTOM',
    description: '按模板或单指标执行正式自定义统计查询并导出。',
    detailEnabled: false,
    indicatorCodes: [],
    key: 'custom',
    title: '自定义统计',
  },
];

export const periodModeOptions = [
  { label: '月度', value: 'month' },
  { label: '季度', value: 'quarter' },
  { label: '年度', value: 'year' },
];

export const qualityGroupOptions = [
  { label: '重点专业指标', value: 'professional' },
  { label: '医疗质量指标', value: 'medical' },
];

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function formatDateTime(value: Date) {
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(
    value.getDate(),
  )}T${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(
    value.getSeconds(),
  )}`;
}

export function buildDefaultDateRange(mode: PeriodMode) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const quarterStartMonth = Math.floor(month / 3) * 3;

  if (mode === 'year') {
    return [
      formatDateTime(new Date(year, 0, 1, 0, 0, 0)),
      formatDateTime(new Date(year, 11, 31, 23, 59, 59)),
    ];
  }
  if (mode === 'quarter') {
    return [
      formatDateTime(new Date(year, quarterStartMonth, 1, 0, 0, 0)),
      formatDateTime(new Date(year, quarterStartMonth + 3, 0, 23, 59, 59)),
    ];
  }
  return [
    formatDateTime(new Date(year, month, 1, 0, 0, 0)),
    formatDateTime(new Date(year, month + 1, 0, 23, 59, 59)),
  ];
}

export function getReportWorkbenchTab(key: WorkbenchTab) {
  return (
    reportWorkbenchTabs.find((item) => item.key === key) ??
    (reportWorkbenchTabs[0] as ReportWorkbenchTab)
  );
}

export function normalizeWorkbenchTab(value: unknown): WorkbenchTab {
  const tab = String(value ?? '');
  return reportWorkbenchTabs.some((item) => item.key === tab)
    ? (tab as WorkbenchTab)
    : 'workload';
}

export function normalizeQualityGroup(
  value: unknown,
): 'medical' | 'professional' {
  return String(value ?? '') === 'medical' ? 'medical' : 'professional';
}

export function metricStatusLabel(status?: MetricStatus) {
  if (status === 'AVAILABLE') {
    return '可用';
  }
  if (status === 'PARTIAL') {
    return '部分可用';
  }
  if (status === 'UNAVAILABLE') {
    return '不可用';
  }
  return '未知';
}

export function metricStatusTagType(status?: MetricStatus) {
  if (status === 'AVAILABLE') {
    return 'success';
  }
  if (status === 'PARTIAL') {
    return 'warning';
  }
  if (status === 'UNAVAILABLE') {
    return 'info';
  }
  return undefined;
}

export function detailStatusLabel(
  status: StatReportDetailItem['detailStatus'],
) {
  if (status === 'PASS') {
    return '通过';
  }
  if (status === 'FAIL') {
    return '未通过';
  }
  return '记录';
}

export function detailStatusTagType(
  status: StatReportDetailItem['detailStatus'],
) {
  if (status === 'PASS') {
    return 'success';
  }
  if (status === 'FAIL') {
    return 'danger';
  }
  return 'info';
}

function parseMetricNumber(row: StatReportRow) {
  const value = Number(row.metricValue);
  return Number.isFinite(value) ? value : 0;
}

export function displayMetric(row: StatReportRow) {
  if (row.metricStatus === 'UNAVAILABLE') {
    return '未接入';
  }
  const metricValue = row.metricValue.trim();
  if (!metricValue) {
    return '-';
  }
  const metricUnit = row.metricUnit.trim().toUpperCase();
  if (metricUnit === 'PERCENT' || metricUnit === '%') {
    return `${metricValue}%`;
  }
  if (metricUnit === 'COUNT') {
    return `${metricValue} 例`;
  }
  if (metricUnit === 'CNY' || metricUnit === 'RMB') {
    return `${metricValue} 元`;
  }
  return row.metricUnit ? `${metricValue} ${row.metricUnit}` : metricValue;
}

export function buildDisplayRows(
  rows: StatReportRow[],
): DisplayStatReportRow[] {
  return rows.map((row) => ({
    ...row,
    metricValue: displayMetric(row),
    metricValueText: displayMetric(row),
  }));
}

export function buildTrendChartOption(
  rows: StatReportRow[],
): null | ReportChartOption {
  const rowWithTrend = rows.find((row) => row.trendPoints?.length);
  if (rowWithTrend?.trendPoints?.length) {
    return {
      grid: { bottom: 28, left: 42, right: 18, top: 24 },
      series: [
        {
          data: rowWithTrend.trendPoints.map((item) => Number(item.value) || 0),
          smooth: true,
          type: 'line',
        },
      ],
      tooltip: { trigger: 'axis' },
      xAxis: {
        data: rowWithTrend.trendPoints.map((item) => item.label),
        type: 'category',
      },
      yAxis: { type: 'value' },
    };
  }

  const chartRows = rows.filter((row) => row.metricStatus !== 'UNAVAILABLE');
  if (chartRows.length === 0) {
    return null;
  }

  return {
    grid: { bottom: 60, left: 44, right: 18, top: 24 },
    series: [
      {
        barMaxWidth: 28,
        data: chartRows.map((row) => parseMetricNumber(row)),
        type: 'bar',
      },
    ],
    tooltip: { trigger: 'axis' },
    xAxis: {
      axisLabel: { interval: 0, rotate: 24 },
      data: chartRows.map((row) => row.indicatorName),
      type: 'category',
    },
    yAxis: { type: 'value' },
  };
}

export function buildBreakdownChartOption(
  rows: StatReportRow[],
): null | ReportChartOption {
  const rowWithBreakdowns =
    rows.find(
      (row) =>
        row.indicatorCode === 'QC_CRITICAL_VALUE_REASON_ANALYSIS_COUNT' &&
        row.breakdowns?.length,
    ) ?? rows.find((row) => row.breakdowns?.length);
  if (rowWithBreakdowns?.breakdowns?.length) {
    return {
      legend: { bottom: 0 },
      series: [
        {
          data: rowWithBreakdowns.breakdowns.map((item) => ({
            name: item.label,
            value: Number(item.value) || 0,
          })),
          radius: ['38%', '68%'],
          type: 'pie',
        },
      ],
      tooltip: { trigger: 'item' },
    };
  }

  const available = rows.filter(
    (row) => row.metricStatus === 'AVAILABLE',
  ).length;
  const partial = rows.filter((row) => row.metricStatus === 'PARTIAL').length;
  const unavailable = rows.filter(
    (row) => row.metricStatus === 'UNAVAILABLE',
  ).length;
  const data = [
    { name: '可用', value: available },
    { name: '部分可用', value: partial },
    { name: '不可用', value: unavailable },
  ].filter((item) => item.value > 0);

  if (data.length === 0) {
    return null;
  }

  return {
    legend: { bottom: 0 },
    series: [
      {
        data,
        radius: ['38%', '68%'],
        type: 'pie',
      },
    ],
    tooltip: { trigger: 'item' },
  };
}

export function buildReportPayload(
  tab: ReportWorkbenchTab,
  filters: ReportWorkbenchFilterState,
): StatReportQuery {
  const [from, to] = filters.dateRange;
  return {
    category: tab.category,
    departmentId: filters.departmentId || null,
    from: from || null,
    indicatorCode: filters.indicatorCode || null,
    periodMode: filters.periodMode,
    roleId: filters.roleId || null,
    templateCode: filters.templateCode || null,
    to: to || null,
    workloadUserId: filters.workloadUserId || null,
  };
}

export function buildDetailPayload(
  indicatorCode: string,
  filters: ReportWorkbenchFilterState,
  pagination: { page: number; size: number },
): StatReportDetailQuery {
  const [from, to] = filters.dateRange;
  return {
    departmentId: filters.departmentId || null,
    from: from || null,
    indicatorCode,
    page: pagination.page,
    size: pagination.size,
    to: to || null,
  };
}

export function buildDetailSummaryItems(
  detailResult: null | StatReportDetailResult,
) {
  return [
    {
      count: detailResult?.eligibleCount ?? 0,
      label: '纳入病例',
      status: 'AVAILABLE' as MetricStatus,
    },
    {
      count: detailResult?.passCount ?? 0,
      label: '通过',
      status: 'AVAILABLE' as MetricStatus,
    },
    {
      count: detailResult?.failCount ?? 0,
      label: '未通过',
      status: 'UNAVAILABLE' as MetricStatus,
    },
  ];
}

export function buildDetailFileName(indicatorCode: string) {
  return `${indicatorCode.toLowerCase()}-details.csv`;
}

function escapeCsvValue(value: null | string | undefined = '') {
  const text = value ?? '';
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function buildWorkbenchRowsCsv(rows: StatReportRow[]) {
  const headers = [
    'indicatorCode',
    'indicatorName',
    'metricValue',
    'metricUnit',
    'metricStatus',
    'numerator',
    'denominator',
    'sourceNote',
  ];
  const lines = rows.map((row) =>
    [
      row.indicatorCode,
      row.indicatorName,
      row.metricValue,
      row.metricUnit,
      row.metricStatus ?? '',
      row.numerator,
      row.denominator,
      row.sourceNote,
    ]
      .map((value) => escapeCsvValue(value))
      .join(','),
  );
  return [headers.join(','), ...lines].join('\r\n');
}

export function buildWorkbenchRowsCsvBlob(rows: StatReportRow[]) {
  return new Blob(['\uFEFF', buildWorkbenchRowsCsv(rows)], {
    type: 'text/csv;charset=utf-8',
  });
}

export function buildInitialFilters(
  user: null | undefined | { realName?: string; userId?: string },
): ReportWorkbenchFilterState {
  return {
    dateRange: buildDefaultDateRange('month'),
    departmentId: '',
    departmentName: '',
    indicatorCode: '',
    periodMode: 'month',
    roleId: '',
    templateCode: '',
    workloadUserId: user?.userId ?? '',
    workloadUserName: user?.realName ?? '',
  };
}

export function resetFilters(
  filters: ReportWorkbenchFilterState,
  user: null | undefined | { realName?: string; userId?: string },
) {
  filters.dateRange = buildDefaultDateRange(filters.periodMode);
  filters.departmentId = '';
  filters.departmentName = '';
  filters.indicatorCode = '';
  filters.roleId = '';
  filters.templateCode = '';
  filters.workloadUserId = user?.userId ?? '';
  filters.workloadUserName = user?.realName ?? '';
}

export function filterTemplatesForTab(
  templates: StatReportTemplateView[],
  activeTab: WorkbenchTab,
  tab: ReportWorkbenchTab,
) {
  return templates.filter(
    (item) =>
      item.templateType === tab.category ||
      (activeTab === 'workload' &&
        (item.templateType === 'OPERATION' ||
          item.templateType === 'WORKLOAD')),
  );
}

export function filterIndicatorsForTab(
  indicators: StatIndicatorView[],
  activeTab: WorkbenchTab,
  tab: ReportWorkbenchTab,
) {
  const category = activeTab === 'workload' ? null : tab.category;
  const indicatorCodes = new Set(tab.indicatorCodes);

  return indicators.filter((item) => {
    if (category && item.indicatorCategory !== category) {
      return false;
    }
    if (indicatorCodes.size > 0) {
      return indicatorCodes.has(item.indicatorCode);
    }
    if (activeTab === 'workload') {
      return (
        item.indicatorCategory === 'OPERATION' ||
        item.indicatorCategory === 'WORKLOAD'
      );
    }
    if (activeTab === 'custom') {
      return true;
    }
    return item.indicatorCategory === 'QUALITY';
  });
}

export function filterRowsForTab(
  rows: StatReportRow[],
  tab: ReportWorkbenchTab,
) {
  const allowedCodes = new Set(tab.indicatorCodes);
  return allowedCodes.size > 0
    ? rows.filter((row) => allowedCodes.has(row.indicatorCode))
    : rows;
}

export function mergeWorkloadReports(
  operationReport: StatReportResult,
  workloadReport: StatReportResult,
) {
  return {
    columns: [...operationReport.columns, ...workloadReport.columns],
    reportCode: 'WORKLOAD_ANALYSIS',
    rows: [...operationReport.rows, ...workloadReport.rows].filter(
      (row) =>
        WORKLOAD_INDICATORS.length === 0 ||
        WORKLOAD_INDICATORS.includes(row.indicatorCode),
    ),
  } satisfies StatReportResult;
}

export function splitQualityRows(
  rows: DisplayStatReportRow[],
  group: 'medical' | 'professional',
) {
  const indicatorSet =
    group === 'professional'
      ? QUALITY_PROFESSIONAL_INDICATORS
      : QUALITY_MEDICAL_INDICATORS;

  return rows.filter((row) => indicatorSet.has(row.indicatorCode));
}
