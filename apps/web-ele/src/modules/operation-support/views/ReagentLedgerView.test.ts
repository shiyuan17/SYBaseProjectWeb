import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { M5_PERMISSION_CODES } from '../constants';

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
    emits: ['click'],
    setup(_, { attrs, emit, slots }) {
      return () =>
        h(
          'button',
          {
            ...attrs,
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

  const ElTable = defineComponent({
    emits: ['current-change'],
    setup(_, { slots }) {
      return () => h('div', slots.default?.());
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

  it('renders main reagent sections and opens create dialog from catalog panel', async () => {
    const { app, root } = mountView();
    await flushView();

    expect(document.body.textContent).toContain('试剂台账');
    expect(document.body.textContent).toContain('试剂基础信息');
    expect(document.body.textContent).toContain('试剂库存批次');
    expect(document.body.textContent).toContain('批次详情');
    expect(document.body.textContent).toContain('试剂预警');
    expect(document.body.textContent).toContain('新增试剂');
    expect(document.body.textContent).toContain('新增库存');
    expect(mockListReagents).toHaveBeenCalledTimes(1);
    expect(mockListReagentStocks).toHaveBeenCalledTimes(1);
    expect(mockListReagentWarnings).toHaveBeenCalledTimes(1);

    const createReagentButton = [...document.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === '新增试剂',
    );
    expect(createReagentButton).toBeTruthy();

    createReagentButton?.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    await flushView();

    expect(document.body.textContent).toContain('试剂维护');

    app.unmount();
    root.remove();
  });
});
