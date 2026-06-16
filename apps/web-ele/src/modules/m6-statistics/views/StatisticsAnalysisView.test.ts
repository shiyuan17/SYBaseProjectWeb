import { cloneVNode, createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const routeQueryState: {
  qualityGroup?: string;
  tab?: string;
} = {};

const {
  mockExportStatReport,
  mockExportStatReportDetails,
  mockListRoles,
  mockListStatIndicators,
  mockListStatReportTemplates,
  mockQueryStatReport,
  mockQueryStatReportDetails,
  mockRenderEcharts,
} = vi.hoisted(() => ({
  mockExportStatReport: vi.fn(),
  mockExportStatReportDetails: vi.fn(),
  mockListRoles: vi.fn(),
  mockListStatIndicators: vi.fn(),
  mockListStatReportTemplates: vi.fn(),
  mockQueryStatReport: vi.fn(),
  mockQueryStatReportDetails: vi.fn(),
  mockRenderEcharts: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({
    meta: {
      description: '统计报表工作台描述',
      title: '统计报表工作台',
    },
    query: routeQueryState,
  }),
  useRouter: () => ({
    replace: vi.fn(
      async (next: { query?: { qualityGroup?: string; tab?: string } }) => {
        routeQueryState.tab = next.query?.tab;
        routeQueryState.qualityGroup = next.query?.qualityGroup;
      },
    ),
  }),
}));

vi.mock('@vben/common-ui', () => ({
  Page: defineComponent({
    props: ['description', 'title'],
    setup(props, { slots }) {
      return () =>
        h('main', [
          h('h1', props.title),
          props.description ? h('p', props.description) : null,
          slots.default?.(),
        ]);
    },
  }),
}));

vi.mock('@vben/plugins/echarts', () => ({
  EchartsUI: defineComponent({
    setup() {
      return () => h('div', 'chart');
    },
  }),
  useEcharts: () => ({
    renderEcharts: mockRenderEcharts,
  }),
}));

vi.mock('@vben/stores', () => ({
  useUserStore: () => ({
    userInfo: {
      realName: '当前用户',
      userId: 'USER-M6-001',
    },
  }),
}));

function passthroughComponent(tag = 'div') {
  return defineComponent({
    props: ['modelValue', 'options'],
    emits: ['change', 'update:modelValue'],
    setup(_, { attrs, slots }) {
      return () => h(tag, attrs, slots.default?.());
    },
  });
}

vi.mock('element-plus', () => ({
  ElButton: defineComponent({
    emits: ['click'],
    setup(_, { emit, slots }) {
      return () =>
        h(
          'button',
          {
            type: 'button',
            onClick: (event: MouseEvent) => emit('click', event),
          },
          slots.default?.(),
        );
    },
  }),
  ElDatePicker: passthroughComponent(),
  ElDrawer: defineComponent({
    props: ['modelValue', 'title'],
    setup(props, { slots }) {
      return () =>
        props.modelValue
          ? h('aside', [h('h2', String(props.title ?? '')), slots.default?.()])
          : null;
    },
  }),
  ElEmpty: defineComponent({
    props: ['description'],
    setup(props) {
      return () => h('div', props.description);
    },
  }),
  ElForm: passthroughComponent('form'),
  ElFormItem: defineComponent({
    props: ['label'],
    setup(props, { slots }) {
      return () => h('div', [props.label, slots.default?.()]);
    },
  }),
  ElMessage: {
    error: vi.fn(),
    success: vi.fn(),
  },
  ElOption: defineComponent({
    props: ['label'],
    setup(props) {
      return () => h('option', props.label);
    },
  }),
  ElPagination: defineComponent({
    props: ['currentPage', 'pageSize', 'total'],
    emits: ['update:currentPage', 'update:pageSize'],
    setup(props, { emit }) {
      return () =>
        h('nav', [
          `分页 ${String(props.currentPage ?? '')}/${String(
            props.pageSize ?? '',
          )} 共 ${String(props.total ?? '')} 条`,
          h(
            'button',
            {
              type: 'button',
              onClick: () => emit('update:currentPage', 2),
            },
            '下一页',
          ),
          h(
            'button',
            {
              type: 'button',
              onClick: () => emit('update:pageSize', 20),
            },
            '每页20条',
          ),
        ]);
    },
  }),
  ElSegmented: defineComponent({
    props: ['modelValue', 'options'],
    emits: ['update:modelValue'],
    setup(props, { attrs, emit }) {
      type SegmentedOption = { label?: string; value?: string };
      return () =>
        h(
          'div',
          attrs,
          Array.isArray(props.options)
            ? (props.options as SegmentedOption[]).map((item) =>
                h(
                  'button',
                  {
                    type: 'button',
                    onClick: () => emit('update:modelValue', item.value),
                  },
                  item.label ?? '',
                ),
              )
            : [],
        );
    },
  }),
  ElSelect: passthroughComponent('select'),
  ElSkeleton: defineComponent({
    setup() {
      return () => h('div', 'loading');
    },
  }),
  ElTable: defineComponent({
    props: ['data'],
    setup(props, { slots }) {
      const renderColumns = (row: Record<string, unknown>) =>
        (slots.default?.() ?? []).map((column, index) =>
          cloneVNode(column, {
            key: `${String(row.indicatorCode ?? row.pathologyNo ?? index)}-${index}`,
            row,
          }),
        );
      return () =>
        h('table', [
          h(
            'tbody',
            (props.data ?? []).map((row: Record<string, unknown>) =>
              h('tr', renderColumns(row)),
            ),
          ),
        ]);
    },
  }),
  ElTableColumn: defineComponent({
    props: ['label', 'prop', 'row'],
    setup(props, { slots }) {
      return () =>
        h('td', [
          props.label ? h('strong', String(props.label)) : null,
          slots.default?.({ row: props.row }) ??
            String(
              props.prop && props.row && typeof props.row === 'object'
                ? ((props.row as Record<string, unknown>)[
                    props.prop as string
                  ] ?? '')
                : '',
            ),
        ]);
    },
  }),
  ElTag: defineComponent({
    setup(_, { slots }) {
      return () => h('span', slots.default?.());
    },
  }),
}));

vi.mock('#/modules/dashboard/components/DashboardSectionCard.vue', () => ({
  default: defineComponent({
    props: ['description', 'title'],
    setup(props, { slots }) {
      return () =>
        h('section', [
          h('h2', props.title),
          props.description ? h('p', props.description) : null,
          slots.default?.(),
          slots['header-extra']?.(),
        ]);
    },
  }),
}));

vi.mock('#/modules/system-management/api/system-management-service', () => ({
  listRoles: mockListRoles,
}));

vi.mock('#/modules/system-management/components/DepartmentSelect.vue', () => ({
  default: passthroughComponent(),
}));

vi.mock('#/modules/system-management/components/SystemUserSelect.vue', () => ({
  default: passthroughComponent(),
}));

vi.mock('../api/m6-statistics-service', () => ({
  exportStatReport: mockExportStatReport,
  exportStatReportDetails: mockExportStatReportDetails,
  listStatIndicators: mockListStatIndicators,
  listStatReportTemplates: mockListStatReportTemplates,
  queryStatReport: mockQueryStatReport,
  queryStatReportDetails: mockQueryStatReportDetails,
}));

import StatisticsAnalysisView from './StatisticsAnalysisView.vue';

function mountView() {
  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp({
    render: () => h(StatisticsAnalysisView),
  });
  app.mount(root);
  return { app, root };
}

async function flushView() {
  await nextTick();
  await Promise.resolve();
  await Promise.resolve();
  await nextTick();
}

function buildMockReport(category: string) {
  if (category === 'WORKLOAD') {
    return {
      columns: [],
      reportCode: 'WORKLOAD',
      rows: [
        {
          indicatorCode: 'WL_DIAGNOSTIC_TASK_COUNT',
          indicatorName: '诊断任务数',
          metricStatus: 'AVAILABLE',
          metricUnit: 'COUNT',
          metricValue: '3',
          sourceNote: 'diagnostic_tasks',
          trendPoints: [
            { label: '2026-06', value: '3' },
            { label: '2026-07', value: '5' },
          ],
        },
      ],
    };
  }

  if (category === 'OPERATION') {
    return {
      columns: [],
      reportCode: 'OPERATION',
      rows: [
        {
          indicatorCode: 'OP_CASE_VOLUME',
          indicatorName: '病例量',
          metricStatus: 'AVAILABLE',
          metricUnit: 'COUNT',
          metricValue: '8',
          sourceNote: 'pathology_cases',
          trendPoints: [
            { label: '2026-06', value: '8' },
            { label: '2026-07', value: '13' },
          ],
        },
      ],
    };
  }

  return {
    columns: [],
    reportCode: 'QUALITY',
    rows: [
      {
        denominator: '10',
        indicatorCode: 'QC_SPECIMEN_FIXATION_RATE',
        indicatorName: '标本规范化固定率',
        metricStatus: 'AVAILABLE',
        metricUnit: 'PERCENT',
        metricValue: '90.00',
        numerator: '9',
        sourceNote: 'specimens',
      },
      {
        indicatorCode: 'QC_FROZEN_PARAFFIN_MATCH_RATE',
        indicatorName: '冰冻石蜡符合率',
        metricStatus: 'AVAILABLE',
        metricUnit: 'PERCENT',
        metricValue: '96.00',
        sourceNote: '冰冻代理口径',
      },
      {
        indicatorCode: 'QC_CRITICAL_VALUE_COUNT',
        indicatorName: '危急值数量',
        metricStatus: 'PARTIAL',
        metricUnit: 'COUNT',
        metricValue: '2',
        sourceNote: '危急值通知代理口径',
        trendPoints: [
          { label: '2026-06', value: '1' },
          { label: '2026-07', value: '1' },
        ],
      },
      {
        denominator: '2',
        indicatorCode: 'QC_CRITICAL_VALUE_REPORT_TIMELINESS_RATE',
        indicatorName: '危急值上报及时率',
        metricStatus: 'AVAILABLE',
        metricUnit: 'PERCENT',
        metricValue: '50.00',
        numerator: '1',
        sourceNote: '30 分钟内已读确认',
      },
      {
        indicatorCode: 'QC_CRITICAL_VALUE_REASON_ANALYSIS_COUNT',
        indicatorName: '危急值原因分析',
        metricStatus: 'PARTIAL',
        metricUnit: 'COUNT',
        metricValue: '2',
        sourceNote: '危急值原因代理口径',
        breakdowns: [{ label: 'HIGH；病例危急值', value: '2' }],
      },
      {
        denominator: '5',
        indicatorCode: 'QC_FROZEN_DIAGNOSIS_TIMELINESS_RATE',
        indicatorName: '冰冻诊断及时率',
        metricStatus: 'AVAILABLE',
        metricUnit: 'PERCENT',
        metricValue: '80.00',
        numerator: '4',
        sourceNote: '默认 SLA 30 分钟',
        trendPoints: [{ label: '2026-06', value: '80.00' }],
      },
      {
        indicatorCode: 'QC_FROZEN_TIMEOUT_COUNT',
        indicatorName: '冰冻超时数',
        metricStatus: 'AVAILABLE',
        metricUnit: 'COUNT',
        metricValue: '3',
        sourceNote: '取材/切片/诊断超时汇总',
        breakdowns: [
          { label: '取材耗时', value: '1' },
          { label: '切片耗时', value: '1' },
          { label: '诊断耗时', value: '1' },
        ],
      },
      {
        indicatorCode: 'QC_FROZEN_GROSSING_TIMEOUT_COUNT',
        indicatorName: '冰冻取材超时数',
        metricStatus: 'AVAILABLE',
        metricUnit: 'COUNT',
        metricValue: '1',
        sourceNote: '取材默认 SLA 30 分钟',
      },
      {
        indicatorCode: 'QC_FROZEN_SLICING_TIMEOUT_COUNT',
        indicatorName: '冰冻切片超时数',
        metricStatus: 'AVAILABLE',
        metricUnit: 'COUNT',
        metricValue: '1',
        sourceNote: '切片默认 SLA 30 分钟',
      },
      {
        indicatorCode: 'QC_FROZEN_DIAGNOSIS_TIMEOUT_COUNT',
        indicatorName: '冰冻诊断超时数',
        metricStatus: 'AVAILABLE',
        metricUnit: 'COUNT',
        metricValue: '1',
        sourceNote: '诊断默认 SLA 30 分钟',
      },
      {
        indicatorCode: 'QC_REPORT_CHANGE_COUNT',
        indicatorName: '更改报告数量',
        metricStatus: 'AVAILABLE',
        metricUnit: 'COUNT',
        metricValue: '2',
        sourceNote: 'report_versions + report_revision_requests',
        trendPoints: [{ label: '2026-06', value: '2' }],
      },
      {
        indicatorCode: 'QC_REPORT_CHANGE_DOCTOR_COUNT',
        indicatorName: '更改报告医生数',
        metricStatus: 'AVAILABLE',
        metricUnit: 'COUNT',
        metricValue: '1',
        sourceNote: 'signed_by_name + requested_by_name',
      },
      {
        indicatorCode: 'QC_REPORT_MODIFICATION_REASON_COUNT',
        indicatorName: '修改原因分析',
        metricStatus: 'AVAILABLE',
        metricUnit: 'COUNT',
        metricValue: '1',
        sourceNote: 'version_status 代理分布',
        breakdowns: [{ label: '版本状态：SIGNED', value: '1' }],
      },
      {
        indicatorCode: 'QC_REPORT_REVISION_REASON_COUNT',
        indicatorName: '修订原因分析',
        metricStatus: 'AVAILABLE',
        metricUnit: 'COUNT',
        metricValue: '1',
        sourceNote: 'request_reason 分布',
        breakdowns: [{ label: 'Goal7 revision reason', value: '1' }],
      },
      {
        indicatorCode: 'QC_UNQUALIFIED_SPECIMEN_COUNT',
        indicatorName: '不合格标本数量',
        metricStatus: 'AVAILABLE',
        metricUnit: 'COUNT',
        metricValue: '1',
        sourceNote: 'qualified_flag=0',
        trendPoints: [{ label: '2026-06', value: '1' }],
      },
      {
        denominator: '10',
        indicatorCode: 'QC_UNQUALIFIED_SPECIMEN_RATE',
        indicatorName: '不合格标本占比',
        metricStatus: 'AVAILABLE',
        metricUnit: 'PERCENT',
        metricValue: '10.00',
        numerator: '1',
        sourceNote: '真实字段与代理口径',
      },
      {
        indicatorCode: 'QC_UNQUALIFIED_SPECIMEN_REASON_COUNT',
        indicatorName: '不合格原因分析',
        metricStatus: 'AVAILABLE',
        metricUnit: 'COUNT',
        metricValue: '1',
        sourceNote: 'unqualified_reason',
        breakdowns: [{ label: '固定不足', value: '1' }],
      },
    ],
  };
}

describe('StatisticsAnalysisView', () => {
  beforeEach(() => {
    routeQueryState.tab = undefined;
    routeQueryState.qualityGroup = undefined;
    mockListStatIndicators.mockResolvedValue([
      {
        enabled: true,
        id: 'IND-OP-1',
        indicatorCategory: 'OPERATION',
        indicatorCode: 'OP_CASE_VOLUME',
        indicatorName: '病例量',
      },
      {
        enabled: true,
        id: 'IND-WL-1',
        indicatorCategory: 'WORKLOAD',
        indicatorCode: 'WL_DIAGNOSTIC_TASK_COUNT',
        indicatorName: '诊断任务数',
      },
      {
        enabled: true,
        id: 'IND-QC-1',
        indicatorCategory: 'QUALITY',
        indicatorCode: 'QC_SPECIMEN_FIXATION_RATE',
        indicatorName: '标本规范化固定率',
      },
      {
        enabled: true,
        id: 'IND-QC-2',
        indicatorCategory: 'QUALITY',
        indicatorCode: 'QC_FROZEN_PARAFFIN_MATCH_RATE',
        indicatorName: '冰冻石蜡符合率',
      },
      {
        enabled: true,
        id: 'IND-QC-3',
        indicatorCategory: 'QUALITY',
        indicatorCode: 'QC_CRITICAL_VALUE_COUNT',
        indicatorName: '危急值数量',
      },
      {
        enabled: true,
        id: 'IND-QC-4',
        indicatorCategory: 'QUALITY',
        indicatorCode: 'QC_CRITICAL_VALUE_REPORT_TIMELINESS_RATE',
        indicatorName: '危急值上报及时率',
      },
      {
        enabled: true,
        id: 'IND-QC-5',
        indicatorCategory: 'QUALITY',
        indicatorCode: 'QC_CRITICAL_VALUE_REASON_ANALYSIS_COUNT',
        indicatorName: '危急值原因分析',
      },
      {
        enabled: true,
        id: 'IND-QC-6',
        indicatorCategory: 'QUALITY',
        indicatorCode: 'QC_FROZEN_DIAGNOSIS_TIMELINESS_RATE',
        indicatorName: '冰冻诊断及时率',
      },
      {
        enabled: true,
        id: 'IND-QC-7',
        indicatorCategory: 'QUALITY',
        indicatorCode: 'QC_FROZEN_TIMEOUT_COUNT',
        indicatorName: '冰冻超时数',
      },
      {
        enabled: true,
        id: 'IND-QC-8',
        indicatorCategory: 'QUALITY',
        indicatorCode: 'QC_FROZEN_GROSSING_TIMEOUT_COUNT',
        indicatorName: '冰冻取材超时数',
      },
      {
        enabled: true,
        id: 'IND-QC-9',
        indicatorCategory: 'QUALITY',
        indicatorCode: 'QC_FROZEN_SLICING_TIMEOUT_COUNT',
        indicatorName: '冰冻切片超时数',
      },
      {
        enabled: true,
        id: 'IND-QC-10',
        indicatorCategory: 'QUALITY',
        indicatorCode: 'QC_FROZEN_DIAGNOSIS_TIMEOUT_COUNT',
        indicatorName: '冰冻诊断超时数',
      },
      {
        enabled: true,
        id: 'IND-QC-11',
        indicatorCategory: 'QUALITY',
        indicatorCode: 'QC_REPORT_CHANGE_COUNT',
        indicatorName: '更改报告数量',
      },
      {
        enabled: true,
        id: 'IND-QC-12',
        indicatorCategory: 'QUALITY',
        indicatorCode: 'QC_REPORT_CHANGE_DOCTOR_COUNT',
        indicatorName: '更改报告医生数',
      },
      {
        enabled: true,
        id: 'IND-QC-13',
        indicatorCategory: 'QUALITY',
        indicatorCode: 'QC_REPORT_MODIFICATION_REASON_COUNT',
        indicatorName: '修改原因分析',
      },
      {
        enabled: true,
        id: 'IND-QC-14',
        indicatorCategory: 'QUALITY',
        indicatorCode: 'QC_REPORT_REVISION_REASON_COUNT',
        indicatorName: '修订原因分析',
      },
      {
        enabled: true,
        id: 'IND-QC-15',
        indicatorCategory: 'QUALITY',
        indicatorCode: 'QC_UNQUALIFIED_SPECIMEN_COUNT',
        indicatorName: '不合格标本数量',
      },
      {
        enabled: true,
        id: 'IND-QC-16',
        indicatorCategory: 'QUALITY',
        indicatorCode: 'QC_UNQUALIFIED_SPECIMEN_RATE',
        indicatorName: '不合格标本占比',
      },
      {
        enabled: true,
        id: 'IND-QC-17',
        indicatorCategory: 'QUALITY',
        indicatorCode: 'QC_UNQUALIFIED_SPECIMEN_REASON_COUNT',
        indicatorName: '不合格原因分析',
      },
    ]);
    mockListStatReportTemplates.mockResolvedValue([
      {
        enabled: true,
        id: 'TPL-WL',
        templateCode: 'TPL_WORKLOAD_OVERVIEW',
        templateName: '工作量总览',
        templateType: 'WORKLOAD',
      },
    ]);
    mockListRoles.mockResolvedValue([
      {
        id: 'ROLE-M6',
        roleName: '质控主管',
      },
    ]);
    mockQueryStatReport.mockImplementation((payload: { category: string }) =>
      Promise.resolve(buildMockReport(payload.category)),
    );
    mockQueryStatReportDetails.mockResolvedValue({
      availabilityStatus: 'AVAILABLE',
      eligibleCount: 2,
      failCount: 1,
      indicatorCode: 'QC_SPECIMEN_FIXATION_RATE',
      items: [
        {
          applicationNo: 'APP-M6-001',
          detailStatus: 'PASS',
          occurredAt: '2026-06-01T10:00:00',
          pathologyNo: 'BC-M6-001',
          reason: '固定完成',
          specimenNo: 'SP-M6-001',
        },
      ],
      page: 1,
      passCount: 1,
      size: 10,
      sourceNote: '明细口径',
      total: 1,
    });
  });

  afterEach(() => {
    mockExportStatReport.mockReset();
    mockExportStatReportDetails.mockReset();
    mockListRoles.mockReset();
    mockListStatIndicators.mockReset();
    mockListStatReportTemplates.mockReset();
    mockQueryStatReport.mockReset();
    mockQueryStatReportDetails.mockReset();
    mockRenderEcharts.mockReset();
    document.body.innerHTML = '';
  });

  it('renders the report workbench tabs and loads workload reports by default', async () => {
    const { app, root } = mountView();
    await flushView();

    expect(mockListStatIndicators).toHaveBeenCalledTimes(1);
    expect(mockListStatReportTemplates).toHaveBeenCalledTimes(1);
    expect(mockListRoles).toHaveBeenCalledTimes(1);
    expect(mockQueryStatReport).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'OPERATION',
        periodMode: 'month',
        workloadUserId: 'USER-M6-001',
      }),
    );
    expect(mockQueryStatReport).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'WORKLOAD',
        periodMode: 'month',
        workloadUserId: 'USER-M6-001',
      }),
    );
    expect(document.body.textContent).toContain('统计报表工作台');
    expect(document.body.textContent).toContain('工作量报表');
    expect(document.body.textContent).toContain('质量与安全控制');
    expect(document.body.textContent).toContain('关键质控指标');
    expect(document.body.textContent).toContain('冰冻时效分析');
    expect(document.body.textContent).toContain('更改报告分析');
    expect(document.body.textContent).toContain('不合格标本分析');
    expect(document.body.textContent).toContain('病例量');
    expect(document.body.textContent).toContain('诊断任务数');
    expect(document.body.textContent).toContain('导出 CSV');

    app.unmount();
    root.remove();
  });

  it('restores tab state from the route query and syncs query changes', async () => {
    routeQueryState.tab = 'quality';
    routeQueryState.qualityGroup = 'medical';
    const { app, root } = mountView();
    await flushView();

    expect(document.body.textContent).toContain('质量与安全控制');
    expect(document.body.textContent).not.toContain('统计报表工作台描述');

    const workloadTabButton = [...root.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('工作量报表'),
    );
    workloadTabButton?.click();
    await flushView();

    expect(routeQueryState.tab).toBe('workload');
    expect(routeQueryState.qualityGroup).toBe('medical');

    app.unmount();
    root.remove();
  });

  it('can switch to quality reports and open backend detail rows', async () => {
    const { app, root } = mountView();
    await flushView();

    mockQueryStatReport.mockClear();
    const qualityTabButton = [...root.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('质量与安全控制'),
    );
    qualityTabButton?.click();
    await flushView();

    expect(mockQueryStatReport).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'QUALITY',
      }),
    );
    expect(document.body.textContent).toContain('重点专业指标');
    expect(document.body.textContent).toContain('医疗质量指标');
    expect(document.body.textContent).toContain('冰冻石蜡符合率');

    const detailButton = [...root.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('查看明细'),
    );
    detailButton?.click();
    await flushView();

    expect(mockQueryStatReportDetails).toHaveBeenCalledWith(
      expect.objectContaining({
        indicatorCode: 'QC_FROZEN_PARAFFIN_MATCH_RATE',
        page: 1,
        size: 10,
      }),
    );
    expect(document.body.textContent).toContain('指标明细');
    expect(document.body.textContent).toContain('SP-M6-001');
    expect(document.body.textContent).toContain('导出明细 CSV');

    app.unmount();
    root.remove();
  });

  it('supports detail pagination and detail csv export', async () => {
    mockExportStatReportDetails.mockResolvedValue(new Blob(['detail']));
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    const revokeSpy = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => undefined);
    const createSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:detail-report');

    const { app, root } = mountView();
    await flushView();

    const qualityTabButton = [...root.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('质量与安全控制'),
    );
    qualityTabButton?.click();
    await flushView();

    const detailButton = [...root.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('查看明细'),
    );
    detailButton?.click();
    await flushView();

    const nextPageButton = [...root.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('下一页'),
    );
    nextPageButton?.click();
    await flushView();

    expect(mockQueryStatReportDetails).toHaveBeenLastCalledWith(
      expect.objectContaining({
        indicatorCode: 'QC_FROZEN_PARAFFIN_MATCH_RATE',
        page: 2,
        size: 10,
      }),
    );

    const pageSizeButton = [...root.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('每页20条'),
    );
    pageSizeButton?.click();
    await flushView();

    expect(mockQueryStatReportDetails).toHaveBeenLastCalledWith(
      expect.objectContaining({
        indicatorCode: 'QC_FROZEN_PARAFFIN_MATCH_RATE',
        page: 1,
        size: 20,
      }),
    );

    const detailExportButton = [...root.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('导出明细 CSV'),
    );
    detailExportButton?.click();
    await flushView();

    expect(mockExportStatReportDetails).toHaveBeenCalledWith(
      expect.objectContaining({
        indicatorCode: 'QC_FROZEN_PARAFFIN_MATCH_RATE',
        page: 1,
        size: 20,
      }),
    );
    expect(createSpy).toHaveBeenCalledWith(expect.any(Blob));
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeSpy).toHaveBeenCalledWith('blob:detail-report');

    clickSpy.mockRestore();
    revokeSpy.mockRestore();
    createSpy.mockRestore();
    app.unmount();
    root.remove();
  });

  it('uses the shared report flow for specialized quality tabs', async () => {
    const { app, root } = mountView();
    await flushView();

    mockQueryStatReport.mockClear();
    const frozenTabButton = [...root.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('冰冻时效分析'),
    );
    frozenTabButton?.click();
    await flushView();

    expect(mockQueryStatReport).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'QUALITY',
        periodMode: 'month',
      }),
    );
    expect(document.body.textContent).toContain('冰冻诊断及时率');
    expect(document.body.textContent).toContain('冰冻超时数');
    expect(document.body.textContent).toContain('冰冻取材超时数');
    expect(document.body.textContent).toContain('冰冻切片超时数');
    expect(document.body.textContent).toContain('冰冻诊断超时数');
    expect(document.body.textContent).not.toContain('冰冻石蜡符合率');
    expect(document.body.textContent).toContain('查看明细');
    expect(routeQueryState.tab).toBe('frozen');

    app.unmount();
    root.remove();
  });

  it('shows report change metrics on the report-change tab', async () => {
    const { app, root } = mountView();
    await flushView();

    mockQueryStatReport.mockClear();
    const reportChangeTabButton = [...root.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('更改报告分析'),
    );
    reportChangeTabButton?.click();
    await flushView();

    expect(mockQueryStatReport).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'QUALITY',
        periodMode: 'month',
      }),
    );
    expect(document.body.textContent).toContain('更改报告数量');
    expect(document.body.textContent).toContain('更改报告医生数');
    expect(document.body.textContent).toContain('修改原因分析');
    expect(document.body.textContent).toContain('修订原因分析');
    expect(document.body.textContent).not.toContain('报告发布天数');
    expect(routeQueryState.tab).toBe('reportChange');

    app.unmount();
    root.remove();
  });

  it('shows unqualified specimen metrics on the unqualified tab', async () => {
    const { app, root } = mountView();
    await flushView();

    mockQueryStatReport.mockClear();
    const unqualifiedTabButton = [...root.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('不合格标本分析'),
    );
    unqualifiedTabButton?.click();
    await flushView();

    expect(mockQueryStatReport).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'QUALITY',
        periodMode: 'month',
      }),
    );
    expect(document.body.textContent).toContain('不合格标本数量');
    expect(document.body.textContent).toContain('不合格标本占比');
    expect(document.body.textContent).toContain('不合格原因分析');
    expect(document.body.textContent).not.toContain('标本规范化固定率');
    expect(routeQueryState.tab).toBe('unqualified');

    app.unmount();
    root.remove();
  });

  it('shows critical value metrics on the key quality tab', async () => {
    const { app, root } = mountView();
    await flushView();

    mockQueryStatReport.mockClear();
    const keyQualityTabButton = [...root.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('关键质控指标'),
    );
    keyQualityTabButton?.click();
    await flushView();

    expect(mockQueryStatReport).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'QUALITY',
        periodMode: 'month',
      }),
    );
    expect(document.body.textContent).toContain('冰冻石蜡符合率');
    expect(document.body.textContent).toContain('危急值数量');
    expect(document.body.textContent).toContain('危急值上报及时率');
    expect(document.body.textContent).toContain('危急值原因分析');
    expect(document.body.textContent).not.toContain('标本规范化固定率');
    expect(routeQueryState.tab).toBe('keyQuality');

    app.unmount();
    root.remove();
  });

  it('exports workload csv through the shared workbench flow', async () => {
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    const revokeSpy = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => undefined);
    const createSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:report');

    const { app, root } = mountView();
    await flushView();

    const exportButton = [...root.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('导出 CSV'),
    );
    exportButton?.click();
    await flushView();

    expect(mockExportStatReport).not.toHaveBeenCalled();
    expect(createSpy).toHaveBeenCalledWith(expect.any(Blob));
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeSpy).toHaveBeenCalledWith('blob:report');
    const { ElMessage } = await import('element-plus');
    expect(ElMessage.success).toHaveBeenCalledWith('导出成功');

    clickSpy.mockRestore();
    revokeSpy.mockRestore();
    createSpy.mockRestore();
    app.unmount();
    root.remove();
  });
});
