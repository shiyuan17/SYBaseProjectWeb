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
  mockCreateReagent,
  mockCreateReagentStock,
  mockListReagents,
  mockListReagentStocks,
  mockListReagentWarnings,
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
  mockCreateReagent: vi.fn(),
  mockCreateReagentStock: vi.fn(),
  mockListReagents: vi.fn(),
  mockListReagentStocks: vi.fn(),
  mockListReagentWarnings: vi.fn(),
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

  const ElDescriptions = defineComponent({
    setup(_, { slots }) {
      return () => h('div', slots.default?.());
    },
  });

  const ElDescriptionsItem = defineComponent({
    props: ['label'],
    setup(props, { slots }) {
      return () => h('div', [`${props.label ?? ''}`, slots.default?.()]);
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
          ? h('section', [h('h2', props.title), slots.default?.()])
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

  const ElTableColumn = defineComponent({
    setup() {
      return () => null;
    },
  });

  const ElTag = defineComponent({
    setup(_, { slots }) {
      return () => h('span', slots.default?.());
    },
  });

  return {
    ElAlert,
    ElButton,
    ElDescriptions,
    ElDescriptionsItem,
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
    ElTable,
    ElTableColumn,
    ElTag,
  };
});

vi.mock('../components/ReagentCatalogPanel.vue', () => ({
  default: defineComponent({
    emits: ['openCreateReagentDialog'],
    setup(_, { emit }) {
      return () =>
        h('div', [
          'reagent-catalog-panel',
          h(
            'button',
            {
              type: 'button',
              onClick: () => emit('openCreateReagentDialog'),
            },
            '目录新增试剂',
          ),
        ]);
    },
  }),
}));

vi.mock('../components/ReagentStockDetailPanel.vue', () => ({
  default: defineComponent({
    setup() {
      return () => h('div', 'reagent-stock-detail-panel');
    },
  }),
}));

vi.mock('../components/ReagentWarningPanel.vue', () => ({
  default: defineComponent({
    props: ['warnings'],
    emits: ['navigateToStockDetail'],
    setup(props, { emit }) {
      return () =>
        h('div', [
          'reagent-warning-panel',
          props.warnings?.map((warning: { batchNo: string; stockId: string }) =>
            h(
              'button',
              {
                type: 'button',
                onClick: () => emit('navigateToStockDetail', warning),
              },
              `定位-${warning.batchNo}`,
            ),
          ),
        ]);
    },
  }),
}));

vi.mock('../components/ReagentDialog.vue', () => ({
  default: defineComponent({
    props: ['modelValue'],
    setup(props) {
      return () => (props.modelValue ? h('div', 'reagent-dialog') : null);
    },
  }),
}));

vi.mock('../components/ReagentStockDialog.vue', () => ({
  default: defineComponent({
    props: ['modelValue'],
    setup(props) {
      return () => (props.modelValue ? h('div', 'reagent-stock-dialog') : null);
    },
  }),
}));

vi.mock('../api/operation-support-service', () => ({
  createReagent: mockCreateReagent,
  createReagentStock: mockCreateReagentStock,
  listReagents: mockListReagents,
  listReagentStocks: mockListReagentStocks,
  listReagentWarnings: mockListReagentWarnings,
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
        defaultLowStockThreshold: 5,
        defaultNearExpiryDays: 30,
        enabled: true,
        id: 'REAGENT-1',
        manufacturer: 'Maker',
        reagentCode: 'RG-1',
        reagentName: 'Hematoxylin',
        remarks: 'Ready',
        specification: '500ml',
        unit: 'bottle',
      },
    ]);
    mockListReagentStocks.mockResolvedValue([
      {
        batchNo: 'BATCH-1',
        expiryDate: '2027-01-01',
        id: 'STOCK-1',
        lowStockThreshold: 3,
        nearExpiryDays: 15,
        reagentCode: 'RG-1',
        reagentId: 'REAGENT-1',
        reagentName: 'Hematoxylin',
        remarks: 'Cold',
        stockQuantity: 20,
        stockStatus: 'ACTIVE',
        storageLocation: 'A1',
      },
    ]);
    mockListReagentWarnings.mockResolvedValue([
      {
        batchNo: 'BATCH-1',
        expiryDate: '2027-01-01',
        lowStockThreshold: 3,
        nearExpiryDays: 15,
        reagentCode: 'RG-1',
        reagentName: 'Hematoxylin',
        stockId: 'STOCK-1',
        stockQuantity: 2,
        warningType: 'LOW_STOCK',
      },
    ]);

    mockCreateReagent.mockResolvedValue(undefined);
    mockCreateReagentStock.mockResolvedValue(undefined);
    mockUpdateReagent.mockResolvedValue(undefined);
    mockUpdateReagentStock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    mockAccessStore.accessCodes = [];
    mockCreateReagent.mockReset();
    mockCreateReagentStock.mockReset();
    mockListReagents.mockReset();
    mockListReagentStocks.mockReset();
    mockListReagentWarnings.mockReset();
    mockUpdateReagent.mockReset();
    mockUpdateReagentStock.mockReset();
    messageErrorMock.mockReset();
    messageSuccessMock.mockReset();
    messageWarningMock.mockReset();
    document.body.innerHTML = '';
  });

  it('shows fallback when user has no reagent ledger access', async () => {
    mockAccessStore.accessCodes = [];

    const { app, root } = mountView();
    await flushView();

    expect(document.body.textContent).toContain('fallback-403');
    expect(mockListReagents).not.toHaveBeenCalled();
    expect(mockListReagentStocks).not.toHaveBeenCalled();
    expect(mockListReagentWarnings).not.toHaveBeenCalled();

    app.unmount();
    root.remove();
  });

  it('renders toolbar actions and keeps selected-row actions disabled before selection', async () => {
    const { app, root } = mountView();
    await flushView();

    expect(document.body.textContent).toContain('试剂耗材管理');
    expect(mockListReagents).toHaveBeenCalledTimes(1);
    expect(mockListReagentStocks).toHaveBeenCalledTimes(1);
    expect(mockListReagentWarnings).toHaveBeenCalledTimes(1);

    expect(findButton('试剂目录')).toBeTruthy();
    expect(findButton('新增试剂')).toBeTruthy();
    expect(findButton('新增库存')).toBeTruthy();
    expect(findButton('编辑试剂')?.disabled).toBe(true);
    expect(findButton('编辑库存')?.disabled).toBe(true);
    expect(findButton('批次详情')?.disabled).toBe(true);

    app.unmount();
    root.remove();
  });

  it('opens create reagent dialog from toolbar', async () => {
    const { app, root } = mountView();
    await flushView();

    findButton('新增试剂')?.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    await flushView();

    expect(document.body.textContent).toContain('reagent-dialog');

    app.unmount();
    root.remove();
  });

  it('opens reagent catalog drawer and stock detail after selecting a row', async () => {
    const { app, root } = mountView();
    await flushView();

    findButton('试剂目录')?.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    await flushView();
    expect(document.body.textContent).toContain('reagent-catalog-panel');

    document
      .querySelector('[data-row-id="STOCK-1"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushView();

    expect(findButton('编辑试剂')?.disabled).toBe(false);
    expect(findButton('编辑库存')?.disabled).toBe(false);
    expect(findButton('批次详情')?.disabled).toBe(false);

    findButton('批次详情')?.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    await flushView();

    expect(document.body.textContent).toContain('reagent-stock-detail-panel');

    app.unmount();
    root.remove();
  });

  it('navigates from warning drawer back to the stock list selection', async () => {
    const { app, root } = mountView();
    await flushView();

    findButton('库存预警')?.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    await flushView();

    expect(document.body.textContent).toContain('reagent-warning-panel');

    [...document.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('定位-BATCH-1'))
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushView();

    expect(messageSuccessMock).toHaveBeenCalledWith('已定位到批次 BATCH-1');
    expect(mockListReagentStocks).toHaveBeenCalledTimes(2);

    app.unmount();
    root.remove();
  });
});
