import { cloneVNode, createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockExportStatReport,
  mockExportStatReportDetails,
  mockListStatIndicators,
  mockQueryStatReport,
  mockQueryStatReportDetails,
} = vi.hoisted(() => ({
  mockExportStatReport: vi.fn(),
  mockExportStatReportDetails: vi.fn(),
  mockListStatIndicators: vi.fn(),
  mockQueryStatReport: vi.fn(),
  mockQueryStatReportDetails: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({
    meta: {
      description: '质控指标统计描述',
      title: '质控指标统计',
    },
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
  ElSegmented: defineComponent({
    props: ['options'],
    setup(props, { attrs }) {
      return () =>
        h(
          'div',
          attrs,
          Array.isArray(props.options)
            ? props.options.map((item: { label?: string }) =>
                h('span', item.label ?? ''),
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
  ElPagination: defineComponent({
    props: ['currentPage', 'pageSize', 'total'],
    setup(props) {
      return () =>
        h(
          'nav',
          `分页 ${String(props.currentPage ?? '')}/${String(
            props.pageSize ?? '',
          )} 共 ${String(props.total ?? '')} 条`,
        );
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

vi.mock('#/modules/system-management/components/DepartmentSelect.vue', () => ({
  default: passthroughComponent(),
}));

vi.mock('../api/m6-statistics-service', () => ({
  exportStatReportDetails: mockExportStatReportDetails,
  exportStatReport: mockExportStatReport,
  listStatIndicators: mockListStatIndicators,
  queryStatReportDetails: mockQueryStatReportDetails,
  queryStatReport: mockQueryStatReport,
}));

import QualityIndicatorStatisticsView from './QualityIndicatorStatisticsView.vue';

function mountView() {
  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp({
    render: () => h(QualityIndicatorStatisticsView),
  });
  app.mount(root);
  return { app, root };
}

async function flushView() {
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

describe('QualityIndicatorStatisticsView', () => {
  beforeEach(() => {
    mockListStatIndicators.mockResolvedValue([
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
    ]);
    mockQueryStatReport.mockResolvedValue({
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
          sourceNote: 'pathology_reports / pathology_cases',
        },
        {
          indicatorCode: 'QC_FROZEN_PARAFFIN_MATCH_RATE',
          indicatorName: '冰冻石蜡符合率',
          metricStatus: 'UNAVAILABLE',
          metricUnit: '',
          metricValue: '',
          sourceNote: '数据源未接入',
        },
      ],
    });
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
          reason: '固定完成且无不合格原因',
          specimenNo: 'SP-M6-001',
        },
        {
          applicationNo: 'APP-M6-002',
          detailStatus: 'FAIL',
          occurredAt: '2026-06-01T11:00:00',
          pathologyNo: 'BC-M6-002',
          reason: '固定未完成',
          specimenNo: 'SP-M6-002',
        },
      ],
      page: 1,
      passCount: 1,
      size: 10,
      sourceNote: '代理口径：按标本固定状态与不合格原因统计。',
      total: 2,
    });
  });

  afterEach(() => {
    mockExportStatReport.mockReset();
    mockExportStatReportDetails.mockReset();
    mockListStatIndicators.mockReset();
    mockQueryStatReport.mockReset();
    mockQueryStatReportDetails.mockReset();
    document.body.innerHTML = '';
  });

  it('renders quality overview filters and query payload', async () => {
    const { app, root } = mountView();
    await flushView();

    expect(mockListStatIndicators).toHaveBeenCalledWith('QUALITY');
    expect(mockQueryStatReport).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'QUALITY' }),
    );
    expect(document.body.textContent).toContain('质控指标统计');
    expect(document.body.textContent).toContain('月度');
    expect(document.body.textContent).toContain('季度');
    expect(document.body.textContent).toContain('年度');
    expect(document.body.textContent).toContain('指标筛选');
    expect(document.body.textContent).toContain('标本规范化固定率');
    expect(document.body.textContent).toContain('90.00%');
    expect(document.body.textContent).toContain('可用');
    expect(document.body.textContent).toContain('冰冻石蜡符合率');
    expect(document.body.textContent).toContain('未接入');
    expect(document.body.textContent).toContain('不可用');
    expect(document.body.textContent).toContain('导出 CSV');
    expect(document.body.textContent).not.toContain('状态分布');
    expect(document.body.textContent).not.toContain('分子/分母');
    expect(document.body.textContent).not.toContain('数据来源与口径');

    app.unmount();
    root.remove();
  });

  it('opens quality detail drawer with summary cards and detail rows', async () => {
    const { app, root } = mountView();
    await flushView();

    const detailButton = [...root.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('查看明细'),
    );
    detailButton?.click();
    await flushView();

    expect(mockQueryStatReportDetails).toHaveBeenCalledWith(
      expect.objectContaining({
        indicatorCode: 'QC_SPECIMEN_FIXATION_RATE',
        page: 1,
        size: 10,
      }),
    );
    expect(document.body.textContent).toContain('质控明细');
    expect(document.body.textContent).toContain(
      '代理口径：按标本固定状态与不合格原因统计。',
    );
    expect(document.body.textContent).toContain('纳入病例');
    expect(document.body.textContent).toContain('通过');
    expect(document.body.textContent).toContain('未通过');
    expect(document.body.textContent).toContain('SP-M6-001');
    expect(document.body.textContent).toContain('固定未完成');
    expect(document.body.textContent).toContain('分页 1/10 共 2 条');
    expect(document.body.textContent).toContain('导出明细 CSV');

    app.unmount();
    root.remove();
  });
});
