import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockQueryStatDashboard } = vi.hoisted(() => ({
  mockQueryStatDashboard: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({
    meta: {
      description: '统计仪表盘描述',
      title: '统计仪表盘',
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

function createModelComponent(tag = 'div') {
  return defineComponent({
    props: ['modelValue'],
    emits: ['update:modelValue'],
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
  ElDatePicker: createModelComponent(),
  ElEmpty: defineComponent({
    props: ['description'],
    setup(props) {
      return () => h('div', props.description);
    },
  }),
  ElForm: createModelComponent('form'),
  ElFormItem: createModelComponent(),
  ElSkeleton: defineComponent({
    setup() {
      return () => h('div', 'loading');
    },
  }),
  ElTag: defineComponent({
    props: ['type'],
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
  default: createModelComponent(),
}));

vi.mock('../api/m6-statistics-service', () => ({
  queryStatDashboard: mockQueryStatDashboard,
}));

import StatisticsDashboardView from './StatisticsDashboardView.vue';

function mountView() {
  const root = document.createElement('div');
  document.body.append(root);

  const app = createApp({
    render: () => h(StatisticsDashboardView),
  });
  app.mount(root);

  return {
    app,
    root,
  };
}

async function flushView() {
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

describe('StatisticsDashboardView', () => {
  beforeEach(() => {
    mockQueryStatDashboard.mockResolvedValue({
      operationCards: [
        {
          indicatorCategory: 'OPERATION',
          indicatorCode: 'OP_CASE_VOLUME',
          indicatorName: '业务量',
          metricStatus: 'AVAILABLE',
          metricUnit: 'COUNT',
          metricValue: '1',
          sourceNote: 'pathology_cases',
        },
      ],
      qualityCards: [
        {
          indicatorCategory: 'QUALITY',
          indicatorCode: 'QC_FROZEN_PARAFFIN_MATCH_RATE',
          indicatorName: '冰冻石蜡符合率',
          metricStatus: 'UNAVAILABLE',
          metricUnit: '',
          metricValue: '',
          sourceNote: '数据源未接入',
        },
      ],
      summaryCards: [
        {
          indicatorCategory: 'OPERATION',
          indicatorCode: 'OP_BILLING_AMOUNT',
          indicatorName: '收费金额',
          metricStatus: 'AVAILABLE',
          metricUnit: 'CNY',
          metricValue: '128.00',
          sourceNote: 'billing_records',
        },
      ],
      workloadCards: [
        {
          indicatorCategory: 'WORKLOAD',
          indicatorCode: 'WL_DIAGNOSTIC_TASK_COUNT',
          indicatorName: '诊断任务数',
          metricStatus: 'AVAILABLE',
          metricUnit: 'COUNT',
          metricValue: '2',
          sourceNote: 'diagnostic_tasks',
        },
      ],
    });
  });

  afterEach(() => {
    mockQueryStatDashboard.mockReset();
    document.body.innerHTML = '';
  });

  it('loads and renders dashboard metric groups from backend', async () => {
    const { app, root } = mountView();
    await flushView();

    expect(mockQueryStatDashboard).toHaveBeenCalledTimes(1);
    expect(document.body.textContent).toContain('统计仪表盘');
    expect(document.body.textContent).toContain('核心概览');
    expect(document.body.textContent).toContain('质控指标');
    expect(document.body.textContent).toContain('运营指标');
    expect(document.body.textContent).toContain('工作量指标');
    expect(document.body.textContent).toContain('收费金额');
    expect(document.body.textContent).toContain('128.00 CNY');
    expect(document.body.textContent).toContain('冰冻石蜡符合率');
    expect(document.body.textContent).toContain('不可用');

    app.unmount();
    root.remove();
  });
});
