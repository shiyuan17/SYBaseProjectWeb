import { createApp, defineComponent, h, inject, nextTick, provide } from 'vue';

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
  mockListMedicalOrderDicts,
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
  mockListMedicalOrderDicts: vi.fn(),
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
    setup(props, { attrs, emit, slots }) {
      return () =>
        h(
          tag,
          {
            ...attrs,
            ...(tag === 'input' || tag === 'select'
              ? {
                  onChange: (event: Event) =>
                    emit(
                      'update:modelValue',
                      (event.target as HTMLInputElement | HTMLSelectElement)
                        .value,
                    ),
                  onInput: (event: Event) =>
                    emit(
                      'update:modelValue',
                      (event.target as HTMLInputElement | HTMLSelectElement)
                        .value,
                    ),
                  value: props.modelValue ?? '',
                }
              : {}),
          },
          slots.default?.(),
        );
    },
  });
}

const radioGroupKey = Symbol('radio-group');

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
            h('div', { 'data-row-id': row.id }, [
              h(
                'button',
                {
                  type: 'button',
                  onClick: () => emit('current-change', row),
                },
                row.batchNo ?? row.id,
              ),
              slots.default?.({ row }),
            ]),
          ),
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
    ElFormItem: defineComponent({
      props: ['label'],
      setup(props, { slots }) {
        return () =>
          h('label', [
            props.label ? h('span', props.label) : null,
            slots.default?.(),
          ]);
      },
    }),
    ElInput: createModelComponent('input'),
    ElInputNumber: createModelComponent('input'),
    ElMessage: {
      error: messageErrorMock,
      success: messageSuccessMock,
      warning: messageWarningMock,
    },
    ElOption: defineComponent({
      props: ['label', 'value'],
      setup(props) {
        return () => h('option', { value: props.value }, props.label);
      },
    }),
    ElRadio: defineComponent({
      props: ['label'],
      setup(props, { slots }) {
        const group = inject<{
          modelValue: unknown;
          update: (value: unknown) => void;
        }>(radioGroupKey);
        return () =>
          h(
            'button',
            {
              'data-radio-label': props.label,
              type: 'button',
              onClick: () => group?.update(props.label),
            },
            slots.default?.(),
          );
      },
    }),
    ElRadioGroup: defineComponent({
      props: ['modelValue'],
      emits: ['update:modelValue'],
      setup(props, { emit, slots }) {
        provide(radioGroupKey, {
          modelValue: props.modelValue,
          update: (value: unknown) => emit('update:modelValue', value),
        });
        return () =>
          h(
            'div',
            {
              'data-radio-group-value': String(props.modelValue ?? ''),
            },
            slots.default?.(),
          );
      },
    }),
    ElScrollbar: defineComponent({
      setup(_, { attrs, slots }) {
        return () => h('div', attrs, slots.default?.());
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
  listMedicalOrderDicts: mockListMedicalOrderDicts,
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

function findSelectByLabel(dialog: HTMLElement, label: string) {
  return [...dialog.querySelectorAll('label')]
    .find((item) => item.textContent?.includes(label))
    ?.querySelector('select') as HTMLSelectElement | undefined;
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
        applicationDilution: '1:100',
        createdAt: '2026-06-16 09:00:00',
        createdByName: '试剂员甲',
        enabled: true,
        id: 'REAGENT-1',
        manufacturer: 'Lab Maker',
        orderItemName: 'CK',
        reagentCode: 'RG-1',
        reagentName: 'CK Working Solution',
        recommendedDilution: '1:200',
        reagentType: 'IMMUNO_WORKING_SOLUTION',
        specification: '200ml',
        stainCapacity: 100,
        stainThreshold: 10,
        templateStatus: 'ENABLED',
        unit: '瓶',
        updatedAt: '2026-06-16 10:00:00',
        updatedByName: '试剂员乙',
        validityDays: 365,
      },
    ]);
    mockListMedicalOrderDicts.mockResolvedValue([
      {
        categoryCode: 'IHC',
        categoryName: '免疫组化',
        children: [],
        enabled: true,
        id: 'CAT-1',
        items: [
          {
            categoryId: 'CAT-1',
            enabled: true,
            id: 'ODI-1',
            orderItemCode: 'ODI_IHC_CK',
            orderItemName: 'CK',
          },
        ],
        parentId: null,
        sortOrder: 1,
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
      mockListMedicalOrderDicts,
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
    expect(mockListMedicalOrderDicts).toHaveBeenCalledTimes(1);
    expect(mockListReagentStocks).toHaveBeenCalledTimes(1);

    app.unmount();
    root.remove();
  });

  it('enables stock actions after selecting a row and starts using stock', async () => {
    const { app, root } = mountView();
    await flushView();

    expect(findButton('开始使用')?.disabled).toBe(true);
    document
      .querySelector('[data-row-id="STOCK-1"] button')
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

    expect(document.body.textContent).toContain('新增试剂模板');
    expect(document.body.textContent).toContain('保存');
    expect(document.body.textContent).toContain('退出');
    expect(document.body.textContent).toContain('输入字母可搜索');
    expect(document.body.textContent).toContain('微升');
    expect(document.body.textContent).toContain('免疫组化');

    app.unmount();
    root.remove();
  });

  it('loads medical order options in template dialog and submits generated reagent code plus mapped fields', async () => {
    const { app, root } = mountView();
    await flushView();

    findButton('新增试剂模板')?.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    await flushView();

    const dialog = [...document.querySelectorAll('section')].find(
      (section) =>
        section.querySelector('h2')?.textContent?.trim() === '新增试剂模板',
    ) as HTMLElement | undefined;
    expect(dialog).toBeTruthy();
    const inputs = [...dialog!.querySelectorAll('input')];
    inputs[0]!.value = 'CK 抗体';
    inputs[0]!.dispatchEvent(new Event('input', { bubbles: true }));

    const selectMapping = [
      ['试剂类型', 'IMMUNO_WORKING_SOLUTION'],
      ['对应医嘱', 'ODI-1'],
      ['稀释比例', '1:100~200'],
      ['试剂用途', '免疫组化'],
      ['试剂状态', 'ENABLED'],
      ['试剂单位', '微升'],
    ] as const;
    selectMapping.forEach(([label, value]) => {
      const select = findSelectByLabel(dialog!, label);
      expect(select).toBeTruthy();
      select!.value = value;
      select!.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const plusOneYearButton = [...dialog!.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === '+1年',
    );
    plusOneYearButton?.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    await flushView();

    findButton('保存')?.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    await flushView();

    expect(mockCreateReagent).toHaveBeenCalledWith(
      expect.objectContaining({
        applicationDilution: '1:100~200',
        enabled: true,
        orderDictItemId: 'ODI-1',
        reagentName: 'CK 抗体',
        reagentType: 'IMMUNO_WORKING_SOLUTION',
        reagentUsage: '免疫组化',
        recommendedDilution: '1:100~200',
        templateStatus: 'ENABLED',
        unit: '微升',
        validityDays: 365,
      }),
    );
    expect(mockCreateReagent.mock.calls[0]?.[0]?.reagentCode).toMatch(
      /^RG-\d{14}\d{3}$/,
    );

    app.unmount();
    root.remove();
  });

  it('renders redesigned stock dialog and prefills stock fields from template selection', async () => {
    const { app, root } = mountView();
    await flushView();

    findButton('试剂入库')?.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    await flushView();

    expect(document.body.textContent).toContain('新增试剂库存信息');
    expect(document.body.textContent).toContain('试剂模板');
    expect(document.body.textContent).toContain('所属模板');
    expect(document.body.textContent).toContain('保存');
    expect(document.body.textContent).toContain('退出');
    expect(document.body.textContent).toContain('入库');
    expect(document.body.textContent).toContain('已测试');
    expect(document.body.textContent).toContain('使用中');

    const templateButton = [...document.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('CK Working Solution'),
    );
    expect(templateButton).toBeTruthy();

    templateButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushView();

    expect(
      document.querySelector('[data-testid="selected-template-name"]')
        ?.textContent,
    ).toContain('CK Working Solution');
    expect(
      document.querySelector('[data-testid="selected-template-code"]')
        ?.textContent,
    ).toContain('RG-1');
    expect(
      document.querySelector('[data-testid="selected-template-order"]')
        ?.textContent,
    ).toContain('CK');

    const recommendedInput = document.querySelector(
      '[data-testid="stock-form-recommended-dilution"]',
    ) as HTMLInputElement | null;
    const applicationInput = document.querySelector(
      '[data-testid="stock-form-application-dilution"]',
    ) as HTMLInputElement | null;

    expect(recommendedInput).toBeTruthy();
    expect(applicationInput).toBeTruthy();
    expect(recommendedInput?.value).toBe('1:200');
    expect(applicationInput?.value).toBe('1:100');

    app.unmount();
    root.remove();
  });
});
