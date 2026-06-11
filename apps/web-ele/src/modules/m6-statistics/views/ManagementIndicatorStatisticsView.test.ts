import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockExportStatReport, mockListRoles, mockQueryStatReport } = vi.hoisted(
  () => ({
    mockExportStatReport: vi.fn(),
    mockListRoles: vi.fn(),
    mockQueryStatReport: vi.fn(),
  }),
);

vi.mock('vue-router', () => ({
  useRoute: () => ({
    meta: {
      description: '管理指标统计描述',
      title: '管理指标统计',
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

vi.mock('@vben/stores', () => ({
  useUserStore: () => ({
    userInfo: {
      realName: '当前用户',
      userId: 'USER-MANAGEMENT-1',
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
    setup(props) {
      return () =>
        h(
          'table',
          (props.data ?? []).map((row: Record<string, unknown>) =>
            h('tr', [
              h('td', row.indicatorName as string),
              h('td', row.metricValue as string),
              h('td', row.metricStatus as string),
              h('td', row.sourceNote as string),
            ]),
          ),
        );
    },
  }),
  ElTableColumn: defineComponent({
    props: ['label'],
    setup(props) {
      return () => h('span', props.label ? String(props.label) : '');
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
  queryStatReport: mockQueryStatReport,
}));

import ManagementIndicatorStatisticsView from './ManagementIndicatorStatisticsView.vue';

function mountView() {
  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp({
    render: () => h(ManagementIndicatorStatisticsView),
  });
  app.mount(root);
  return { app, root };
}

async function flushView() {
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

describe('ManagementIndicatorStatisticsView', () => {
  beforeEach(() => {
    mockListRoles.mockResolvedValue([
      {
        id: 'ROLE_M4_DIAGNOSIS',
        roleName: '诊断医生',
      },
    ]);
    mockQueryStatReport.mockImplementation((payload: { category: string }) =>
      Promise.resolve(
        payload.category === 'WORKLOAD'
          ? {
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
                },
                {
                  indicatorCode: 'WL_MEDICAL_ORDER_COUNT',
                  indicatorName: '医嘱执行数',
                  metricStatus: 'AVAILABLE',
                  metricUnit: 'COUNT',
                  metricValue: '2',
                  sourceNote: 'medical_orders',
                },
              ],
            }
          : {
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
                },
                {
                  indicatorCode: 'OP_BILLING_AMOUNT',
                  indicatorName: '收费金额',
                  metricStatus: 'AVAILABLE',
                  metricUnit: 'CNY',
                  metricValue: '128.00',
                  sourceNote: 'billing_records',
                },
                {
                  indicatorCode: 'OP_REAGENT_STOCK_ALERT',
                  indicatorName: '试剂库存预警',
                  metricStatus: 'AVAILABLE',
                  metricUnit: 'COUNT',
                  metricValue: '1',
                  sourceNote: 'reagent_stocks',
                },
                {
                  indicatorCode: 'OP_PERFORMANCE_WORKLOAD',
                  indicatorName: '综合工作量',
                  metricStatus: 'AVAILABLE',
                  metricUnit: 'COUNT',
                  metricValue: '5',
                  sourceNote: 'diagnostic_tasks / medical_orders',
                },
              ],
            },
      ),
    );
  });

  afterEach(() => {
    mockExportStatReport.mockReset();
    mockListRoles.mockReset();
    mockQueryStatReport.mockReset();
    document.body.innerHTML = '';
  });

  it('renders management metrics and queries operation/workload with workload user filter', async () => {
    const { app, root } = mountView();
    await flushView();

    expect(mockListRoles).toHaveBeenCalledTimes(1);
    expect(mockQueryStatReport).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'OPERATION',
        workloadUserId: 'USER-MANAGEMENT-1',
      }),
    );
    expect(mockQueryStatReport).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'WORKLOAD',
        workloadUserId: 'USER-MANAGEMENT-1',
      }),
    );
    expect(document.body.textContent).toContain('管理指标统计');
    expect(document.body.textContent).toContain('月度');
    expect(document.body.textContent).toContain('季度');
    expect(document.body.textContent).toContain('年度');
    expect(document.body.textContent).toContain('业务量分类');
    expect(document.body.textContent).toContain('收费分析');
    expect(document.body.textContent).toContain('物资/试剂预警');
    expect(document.body.textContent).toContain('绩效/工作量统计');
    expect(document.body.textContent).toContain('病例量');
    expect(document.body.textContent).toContain('128.00 CNY');
    expect(document.body.textContent).toContain('试剂库存预警');
    expect(document.body.textContent).toContain('诊断任务数');
    expect(document.body.textContent).toContain('导出运营 CSV');
    expect(document.body.textContent).toContain('导出工作量 CSV');

    app.unmount();
    root.remove();
  });
});
