import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { M5_PERMISSION_CODES } from '../constants';

vi.mock('element-plus/theme-chalk/base.css', () => ({}));
vi.mock('vue-router', () => ({
  useRoute: () => ({
    meta: {
      description: '试剂页面描述',
      title: '试剂耗材管理',
    },
  }),
}));

const {
  messageErrorMock,
  messageSuccessMock,
  messageWarningMock,
  mockAccessStore,
  mockConsumeReagentStock,
  mockCreateReagent,
  mockCreateReagentStock,
  mockExportReagentStocks,
  mockFinishUsingReagentStock,
  mockImportReagentStocks,
  mockListReagents,
  mockListReagentStockEvents,
  mockListReagentStocks,
  mockStartUsingReagentStock,
  mockTestReagentStock,
  mockUpdateReagent,
  mockUpdateReagentStock,
  mockUserStore,
} = vi.hoisted(() => ({
  messageErrorMock: vi.fn(),
  messageSuccessMock: vi.fn(),
  messageWarningMock: vi.fn(),
  mockAccessStore: {
    accessCodes: [] as string[],
  },
  mockConsumeReagentStock: vi.fn(),
  mockCreateReagent: vi.fn(),
  mockCreateReagentStock: vi.fn(),
  mockExportReagentStocks: vi.fn(),
  mockFinishUsingReagentStock: vi.fn(),
  mockImportReagentStocks: vi.fn(),
  mockListReagents: vi.fn(),
  mockListReagentStockEvents: vi.fn(),
  mockListReagentStocks: vi.fn(),
  mockStartUsingReagentStock: vi.fn(),
  mockTestReagentStock: vi.fn(),
  mockUpdateReagent: vi.fn(),
  mockUpdateReagentStock: vi.fn(),
  mockUserStore: {
    userInfo: {
      realName: '试剂员甲',
    },
  },
}));

vi.mock('@vben/common-ui', () => ({
  Fallback: defineComponent({
    props: ['status'],
    setup(props) {
      return () => h('div', `fallback-${props.status}`);
    },
  }),
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

vi.mock('@vben/icons', () => ({
  Download: 'Download',
  FileText: 'FileText',
  FlaskConical: 'FlaskConical',
  PackagePlus: 'PackagePlus',
  Play: 'Play',
  Plus: 'Plus',
  RefreshCw: 'RefreshCw',
  Search: 'Search',
  Square: 'Square',
  Upload: 'Upload',
}));

vi.mock('@vben/stores', () => ({
  useAccessStore: () => mockAccessStore,
  useUserStore: () => mockUserStore,
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

vi.mock('element-plus', () => {
  const ElAlert = defineComponent({
    props: ['title'],
    setup(props, { slots }) {
      return () => h('section', [props.title, slots.default?.()]);
    },
  });

  const ElButton = defineComponent({
    props: ['disabled'],
    emits: ['click'],
    setup(props, { attrs, emit, slots }) {
      return () =>
        h(
          'button',
          {
            ...attrs,
            disabled: props.disabled,
            type: 'button',
            onClick: (event: MouseEvent) => emit('click', event),
          },
          slots.default?.(),
        );
    },
  });

  const ElDialog = defineComponent({
    props: ['modelValue', 'title'],
    emits: ['update:modelValue'],
    setup(props, { slots }) {
      return () =>
        props.modelValue
          ? h('section', [
              h('h2', props.title),
              slots.default?.(),
              slots.footer?.(),
            ])
          : null;
    },
  });

  const ElDrawer = defineComponent({
    props: ['modelValue', 'title'],
    emits: ['update:modelValue'],
    setup(props, { slots }) {
      return () =>
        props.modelValue
          ? h('aside', [h('h2', props.title), slots.default?.()])
          : null;
    },
  });

  const ElTable = defineComponent({
    props: ['data'],
    emits: ['current-change'],
    setup(props, { slots, emit }) {
      return () =>
        h('div', [
          props.data?.map((row: { batchNo?: string; id: string }) =>
            h(
              'button',
              {
                type: 'button',
                'data-row-id': row.id,
                onClick: () => emit('current-change', row),
              },
              row.batchNo ?? row.id,
            ),
          ),
          slots.default?.(),
        ]);
    },
  });

  const ElTabs = defineComponent({
    props: ['modelValue'],
    emits: ['update:modelValue'],
    setup(props, { emit, slots }) {
      return () =>
        h('div', [
          h(
            'button',
            {
              type: 'button',
              onClick: () => emit('update:modelValue', 'STOCK'),
            },
            '试剂库存',
          ),
          h(
            'button',
            {
              type: 'button',
              onClick: () => emit('update:modelValue', 'TEMPLATE'),
            },
            '试剂模板',
          ),
          h('span', `active-${props.modelValue}`),
          slots.default?.(),
        ]);
    },
  });

  return {
    ElAlert,
    ElButton,
    ElDatePicker: createModelComponent('input'),
    ElDialog,
    ElDrawer,
    ElForm: createModelComponent('form'),
    ElFormItem: createModelComponent('div'),
    ElInput: createModelComponent('input'),
    ElInputNumber: createModelComponent('input'),
    ElMessage: {
      error: messageErrorMock,
      success: messageSuccessMock,
      warning: messageWarningMock,
    },
    ElOption: defineComponent({
      props: ['label'],
      setup(props) {
        return () => h('option', props.label);
      },
    }),
    ElSelect: createModelComponent('select'),
    ElSwitch: createModelComponent('button'),
    ElTabPane: defineComponent({
      props: ['label', 'name'],
      setup(props, { slots }) {
        return () =>
          h('section', [
            `pane-${props.name}-${props.label}`,
            slots.default?.(),
          ]);
      },
    }),
    ElTable,
    ElTableColumn: defineComponent({
      setup() {
        return () => null;
      },
    }),
    ElTabs,
    ElTag: defineComponent({
      setup(_, { slots }) {
        return () => h('span', slots.default?.());
      },
    }),
  };
});

vi.mock('../api/operation-support-service', () => ({
  consumeReagentStock: mockConsumeReagentStock,
  createReagent: mockCreateReagent,
  createReagentStock: mockCreateReagentStock,
  exportReagentStocks: mockExportReagentStocks,
  finishUsingReagentStock: mockFinishUsingReagentStock,
  importReagentStocks: mockImportReagentStocks,
  listReagents: mockListReagents,
  listReagentStockEvents: mockListReagentStockEvents,
  listReagentStocks: mockListReagentStocks,
  startUsingReagentStock: mockStartUsingReagentStock,
  testReagentStock: mockTestReagentStock,
  updateReagent: mockUpdateReagent,
  updateReagentStock: mockUpdateReagentStock,
}));

import ReagentLedgerView from './ReagentLedgerView.vue';

function mountView() {
  const root = document.createElement('div');
  document.body.append(root);

  const app = createApp({
    render: () => h(ReagentLedgerView),
  });
  app.directive('loading', {});

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

function findButton(label: string) {
  return [...document.querySelectorAll('button')].find(
    (button) => button.textContent?.trim() === label,
  ) as HTMLButtonElement | undefined;
}

describe('ReagentLedgerView', () => {
  beforeEach(() => {
    mockAccessStore.accessCodes = [
      M5_PERMISSION_CODES.REAGENT_QUERY,
      M5_PERMISSION_CODES.REAGENT_CREATE,
      M5_PERMISSION_CODES.REAGENT_UPDATE,
      M5_PERMISSION_CODES.REAGENT_STOCK_QUERY,
      M5_PERMISSION_CODES.REAGENT_STOCK_UPDATE,
      M5_PERMISSION_CODES.REAGENT_WARNING_QUERY,
    ];

    mockListReagents.mockResolvedValue([
      {
        enabled: true,
        id: 'REAGENT-1',
        orderItemName: 'CK',
        reagentCode: 'RG-1',
        reagentName: 'CK Working Solution',
        reagentType: 'IMMUNO_WORKING_SOLUTION',
        templateStatus: 'ENABLED',
      },
    ]);
    mockListReagentStocks.mockResolvedValue([
      {
        batchNo: 'BATCH-1',
        expiryDate: '2027-01-01',
        id: 'STOCK-1',
        initialQuantity: 20,
        orderItemName: 'CK',
        reagentCode: 'RG-1',
        reagentId: 'REAGENT-1',
        reagentName: 'CK Working Solution',
        reagentType: 'IMMUNO_WORKING_SOLUTION',
        remainingQuantity: 18,
        stockStatus: 'IN_USE',
      },
    ]);
    mockListReagentStockEvents.mockResolvedValue([]);
    mockCreateReagent.mockResolvedValue(undefined);
    mockCreateReagentStock.mockResolvedValue(undefined);
    mockUpdateReagent.mockResolvedValue(undefined);
    mockUpdateReagentStock.mockResolvedValue(undefined);
    mockStartUsingReagentStock.mockResolvedValue(undefined);
    mockFinishUsingReagentStock.mockResolvedValue(undefined);
    mockTestReagentStock.mockResolvedValue(undefined);
    mockConsumeReagentStock.mockResolvedValue(undefined);
    mockExportReagentStocks.mockResolvedValue(new Blob(['csv']));
    mockImportReagentStocks.mockResolvedValue({
      errors: [],
      failureCount: 0,
      successCount: 1,
    });
  });

  afterEach(() => {
    mockAccessStore.accessCodes = [];
    [
      mockConsumeReagentStock,
      mockCreateReagent,
      mockCreateReagentStock,
      mockExportReagentStocks,
      mockFinishUsingReagentStock,
      mockImportReagentStocks,
      mockListReagents,
      mockListReagentStockEvents,
      mockListReagentStocks,
      mockStartUsingReagentStock,
      mockTestReagentStock,
      mockUpdateReagent,
      mockUpdateReagentStock,
      messageErrorMock,
      messageSuccessMock,
      messageWarningMock,
    ].forEach((mock) => mock.mockReset());
    document.body.innerHTML = '';
  });

  it('shows fallback when user has no reagent ledger access', async () => {
    mockAccessStore.accessCodes = [];

    const { app, root } = mountView();
    await flushView();

    expect(document.body.textContent).toContain('fallback-403');
    expect(mockListReagents).not.toHaveBeenCalled();
    expect(mockListReagentStocks).not.toHaveBeenCalled();

    app.unmount();
    root.remove();
  });

  it('renders stock and template tabs with default stock toolbar', async () => {
    const { app, root } = mountView();
    await flushView();

    expect(document.body.textContent).toContain('active-STOCK');
    expect(document.body.textContent).toContain('试剂库存');
    expect(document.body.textContent).toContain('试剂模板');
    expect(findButton('试剂入库')).toBeTruthy();
    expect(findButton('测试')?.disabled).toBe(true);
    expect(findButton('消耗')?.disabled).toBe(true);
    expect(findButton('消耗明细')?.disabled).toBe(true);
    expect(findButton('导出Excel')).toBeTruthy();
    expect(findButton('导入Excel')).toBeTruthy();
    expect(findButton('新增试剂模板')).toBeTruthy();
    expect(findButton('刷新')).toBeTruthy();
    expect(mockListReagents).toHaveBeenCalledTimes(1);
    expect(mockListReagentStocks).toHaveBeenCalledTimes(1);

    app.unmount();
    root.remove();
  });

  it('enables stock actions after selecting a row and starts using stock', async () => {
    const { app, root } = mountView();
    await flushView();

    document
      .querySelector('[data-row-id="STOCK-1"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushView();

    expect(findButton('开始使用')?.disabled).toBe(false);
    findButton('开始使用')?.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    await flushView();

    expect(mockStartUsingReagentStock).toHaveBeenCalledWith('STOCK-1', {
      remarks: undefined,
    });
    expect(messageSuccessMock).toHaveBeenCalledWith('已开始使用');

    app.unmount();
    root.remove();
  });

  it('opens template dialog from template toolbar', async () => {
    const { app, root } = mountView();
    await flushView();

    findButton('新增试剂模板')?.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    await flushView();

    expect(document.body.textContent).toContain('试剂模板维护');

    app.unmount();
    root.remove();
  });
});
