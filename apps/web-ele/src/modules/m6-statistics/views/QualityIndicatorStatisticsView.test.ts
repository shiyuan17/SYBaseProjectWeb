import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockExportStatReport, mockListStatIndicators, mockQueryStatReport } =
  vi.hoisted(() => ({
    mockExportStatReport: vi.fn(),
    mockListStatIndicators: vi.fn(),
    mockQueryStatReport: vi.fn(),
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
  ElSegmented: passthroughComponent(),
  ElSelect: passthroughComponent('select'),
  ElSkeleton: defineComponent({
    setup() {
      return () => h('div', 'loading');
    },
  }),
  ElTable: defineComponent({
    props: ['data'],
    setup(props, { slots }) {
      return () =>
        h('table', [
          h(
            'tbody',
            (props.data ?? []).map((row: Record<string, unknown>) =>
              h('tr', [
                h('td', row.indicatorName as string),
                h('td', row.metricValue as string),
                h('td', row.metricStatus as string),
                h('td', row.sourceNote as string),
              ]),
            ),
          ),
          slots.default?.(),
        ]);
    },
  }),
  ElTableColumn: defineComponent({
    setup() {
      return () => null;
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

vi.mock('#/modules/system-management/components/DepartmentSelect.vue', () => ({
  default: passthroughComponent(),
}));

vi.mock('../api/m6-statistics-service', () => ({
  exportStatReport: mockExportStatReport,
  listStatIndicators: mockListStatIndicators,
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
  });

  afterEach(() => {
    mockExportStatReport.mockReset();
    mockListStatIndicators.mockReset();
    mockQueryStatReport.mockReset();
    document.body.innerHTML = '';
  });

  it('renders quality overview filters, status summary, source notes and query payload', async () => {
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
    expect(document.body.textContent).toContain('状态分布');
    expect(document.body.textContent).toContain('标本规范化固定率');
    expect(document.body.textContent).toContain('可用');
    expect(document.body.textContent).toContain('冰冻石蜡符合率');
    expect(document.body.textContent).toContain('不可用');
    expect(document.body.textContent).toContain('数据源未接入');
    expect(document.body.textContent).toContain('导出 CSV');

    app.unmount();
    root.remove();
  });
});
