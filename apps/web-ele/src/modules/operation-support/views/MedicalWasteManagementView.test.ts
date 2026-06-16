import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { M5_PERMISSION_CODES } from '../constants';

vi.mock('element-plus/theme-chalk/base.css', () => ({}));
vi.mock('vue-router', () => ({
  useRoute: () => ({
    meta: {
      description: '维护医疗废物袋打印与交接记录。',
      title: '医疗废物管理',
    },
  }),
}));

const {
  mockBuildMedicalWasteReagentPrintHtml,
  mockBuildMedicalWasteSpecimenPrintHtml,
  messageErrorMock,
  messageSuccessMock,
  messageWarningMock,
  mockAccessStore,
  mockDestroyMedicalWasteSpecimenBatch,
  mockGetMedicalWasteSpecimenOptions,
  mockHandoverMedicalWasteReagentBag,
  mockListMedicalWasteReagentBags,
  mockListMedicalWasteSpecimenBatches,
  mockPreviewMedicalWasteSpecimenLabels,
  mockPrintMedicalWasteSpecimenBatch,
  mockSaveMedicalWasteReagentBag,
  mockUserStore,
  mockOpenMedicalWastePrintWindow,
  mockValidateMedicalWasteReagentBagRequest,
  mockValidateMedicalWasteSpecimenPreviewRequest,
  openWindowMock,
} = vi.hoisted(() => ({
  mockBuildMedicalWasteReagentPrintHtml: vi.fn(() => '<html></html>'),
  mockBuildMedicalWasteSpecimenPrintHtml: vi.fn(() => '<html></html>'),
  messageErrorMock: vi.fn(),
  messageSuccessMock: vi.fn(),
  messageWarningMock: vi.fn(),
  mockAccessStore: {
    accessCodes: [] as string[],
  },
  mockDestroyMedicalWasteSpecimenBatch: vi.fn(),
  mockGetMedicalWasteSpecimenOptions: vi.fn(),
  mockHandoverMedicalWasteReagentBag: vi.fn(),
  mockListMedicalWasteReagentBags: vi.fn(),
  mockListMedicalWasteSpecimenBatches: vi.fn(),
  mockPreviewMedicalWasteSpecimenLabels: vi.fn(),
  mockPrintMedicalWasteSpecimenBatch: vi.fn(),
  mockSaveMedicalWasteReagentBag: vi.fn(),
  mockUserStore: {
    userInfo: {
      realName: '管理员甲',
    },
  },
  mockOpenMedicalWastePrintWindow: vi.fn(() => true),
  mockValidateMedicalWasteReagentBagRequest: vi.fn(() => ''),
  mockValidateMedicalWasteSpecimenPreviewRequest: vi.fn(() => ''),
  openWindowMock: vi.fn(),
}));

vi.stubGlobal('window', {
  ...window,
  open: openWindowMock,
});

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
    setup(props, { attrs, emit, slots }) {
      return () =>
        h(
          tag,
          {
            ...attrs,
            ...(tag === 'input' || tag === 'select'
              ? { value: props.modelValue ?? '' }
              : {}),
            onInput: (event: Event) =>
              emit(
                'update:modelValue',
                (event.target as HTMLInputElement).value,
              ),
            onChange: (event: Event) =>
              emit(
                'update:modelValue',
                (event.target as HTMLInputElement).value,
              ),
          },
          slots.default?.(),
        );
    },
  });
}

const tabsState = { activeName: 'SPECIMEN' };

vi.mock('element-plus', () => {
  const ElAlert = defineComponent({
    props: ['title'],
    setup(props, { slots }) {
      return () => h('section', [props.title, slots.default?.()]);
    },
  });
  const ElButton = defineComponent({
    props: ['disabled', 'loading'],
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
  const ElPopconfirm = defineComponent({
    emits: ['confirm'],
    setup(_, { emit, slots }) {
      return () =>
        h('div', [
          slots.reference?.(),
          h(
            'button',
            {
              type: 'button',
              onClick: () => emit('confirm'),
            },
            '确认',
          ),
        ]);
    },
  });
  const ElTable = defineComponent({
    props: ['data'],
    emits: ['current-change'],
    setup(props, { emit, slots }) {
      return () =>
        h('div', [
          props.data?.map((row: { bagName?: string; id: string }) =>
            h(
              'button',
              {
                type: 'button',
                'data-row-id': row.id,
                onClick: () => emit('current-change', row),
              },
              row.bagName ?? row.id,
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
      tabsState.activeName = String(props.modelValue ?? '');
      return () =>
        h('div', [
          h(
            'button',
            {
              type: 'button',
              onClick: () => {
                tabsState.activeName = 'SPECIMEN';
                emit('update:modelValue', 'SPECIMEN');
              },
            },
            '人体标本',
          ),
          h(
            'button',
            {
              type: 'button',
              onClick: () => {
                tabsState.activeName = 'REAGENT';
                emit('update:modelValue', 'REAGENT');
              },
            },
            '药物试剂',
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
    ElForm: createModelComponent('form'),
    ElFormItem: createModelComponent('div'),
    ElInput: createModelComponent('input'),
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
    ElPopconfirm,
    ElSelect: createModelComponent('select'),
    ElTabPane: defineComponent({
      props: ['label', 'name'],
      setup(props, { slots }) {
        return () =>
          tabsState.activeName === props.name
            ? h('section', [
                `pane-${props.name}-${props.label}`,
                slots.default?.(),
              ])
            : null;
      },
    }),
    ElTable,
    ElTableColumn: defineComponent({
      setup() {
        return () => null;
      },
    }),
    ElTabs,
  };
});

vi.mock('../api/operation-support-service', () => ({
  destroyMedicalWasteSpecimenBatch: mockDestroyMedicalWasteSpecimenBatch,
  getMedicalWasteSpecimenOptions: mockGetMedicalWasteSpecimenOptions,
  handoverMedicalWasteReagentBag: mockHandoverMedicalWasteReagentBag,
  listMedicalWasteReagentBags: mockListMedicalWasteReagentBags,
  listMedicalWasteSpecimenBatches: mockListMedicalWasteSpecimenBatches,
  previewMedicalWasteSpecimenLabels: mockPreviewMedicalWasteSpecimenLabels,
  printMedicalWasteSpecimenBatch: mockPrintMedicalWasteSpecimenBatch,
  saveMedicalWasteReagentBag: mockSaveMedicalWasteReagentBag,
}));

vi.mock('../utils/medical-waste', async () => {
  const actual = await vi.importActual<typeof import('../utils/medical-waste')>(
    '../utils/medical-waste',
  );
  return {
    ...actual,
    buildMedicalWasteReagentPrintHtml: mockBuildMedicalWasteReagentPrintHtml,
    buildMedicalWasteSpecimenPrintHtml: mockBuildMedicalWasteSpecimenPrintHtml,
    openMedicalWastePrintWindow: mockOpenMedicalWastePrintWindow,
    validateMedicalWasteReagentBagRequest:
      mockValidateMedicalWasteReagentBagRequest,
    validateMedicalWasteSpecimenPreviewRequest:
      mockValidateMedicalWasteSpecimenPreviewRequest,
  };
});

import MedicalWasteManagementView from './MedicalWasteManagementView.vue';

function mountView() {
  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp({
    render: () => h(MedicalWasteManagementView),
  });
  app.directive('loading', {});
  app.mount(root);
  return { app, root };
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

describe('MedicalWasteManagementView', () => {
  beforeEach(() => {
    mockAccessStore.accessCodes = [M5_PERMISSION_CODES.REAGENT_QUERY];
    mockGetMedicalWasteSpecimenOptions.mockResolvedValue({
      grossingOperators: [{ label: '张三', value: '张三' }],
      grossingPeriods: [{ label: '上午', value: 'AM' }],
      grossingStations: [{ label: '取材台A', value: '取材台A' }],
    });
    mockListMedicalWasteSpecimenBatches.mockResolvedValue([
      {
        bagName: 'HB-01',
        grossingOperatorName: '张三',
        grossingStationName: '取材台A',
        id: 'BATCH-1',
        labelCount: 2,
        printedAt: '2026-06-16T09:00:00',
      },
    ]);
    mockListMedicalWasteReagentBags.mockResolvedValue([
      {
        bagName: 'DW-01',
        createdInfo: '管理员甲 / 2026-06-16T10:00:00',
        id: 'BAG-1',
        remarks: '备注',
        wasteType: 'DRUG',
      },
    ]);
    mockPreviewMedicalWasteSpecimenLabels.mockResolvedValue([
      {
        patientId: 'P-01',
        patientName: '王五',
        pathologyNo: 'BL-001',
        sourceLabelId: 'LBL-1',
        specimenName: '胃组织',
      },
    ]);
    mockPrintMedicalWasteSpecimenBatch.mockResolvedValue({
      batch: {
        bagName: 'HB-01',
        grossingOperatorName: '张三',
        grossingStationName: '取材台A',
        id: 'BATCH-NEW',
        labelCount: 1,
        printedAt: '2026-06-16T09:00:00',
      },
      labels: [
        {
          patientId: 'P-01',
          patientName: '王五',
          pathologyNo: 'BL-001',
          sourceLabelId: 'LBL-1',
          specimenName: '胃组织',
        },
      ],
      printTitle: 'HB-01',
      printSubtitle: '打印副标题',
    });
    mockSaveMedicalWasteReagentBag.mockResolvedValue({
      bagName: 'DW-01',
      createdInfo: '管理员甲 / 2026-06-16T10:00:00',
      id: 'BAG-1',
      printedAt: '2026-06-16T10:00:00',
      remarks: '备注',
      wasteType: 'DRUG',
    });
    mockHandoverMedicalWasteReagentBag.mockResolvedValue({});
    mockDestroyMedicalWasteSpecimenBatch.mockResolvedValue({});
    openWindowMock.mockReturnValue({
      document: {
        close: vi.fn(),
        open: vi.fn(),
        title: '',
        write: vi.fn(),
      },
    });
  });

  afterEach(() => {
    mockAccessStore.accessCodes = [];
    [
      mockDestroyMedicalWasteSpecimenBatch,
      mockGetMedicalWasteSpecimenOptions,
      mockHandoverMedicalWasteReagentBag,
      mockListMedicalWasteReagentBags,
      mockListMedicalWasteSpecimenBatches,
      mockOpenMedicalWastePrintWindow,
      mockPreviewMedicalWasteSpecimenLabels,
      mockPrintMedicalWasteSpecimenBatch,
      mockSaveMedicalWasteReagentBag,
      mockValidateMedicalWasteReagentBagRequest,
      mockValidateMedicalWasteSpecimenPreviewRequest,
      messageErrorMock,
      messageSuccessMock,
      messageWarningMock,
      openWindowMock,
    ].forEach((mock) => mock.mockReset());
    document.body.innerHTML = '';
  });

  it('renders double tabs and loads both specimen and reagent data', async () => {
    const { app, root } = mountView();
    await flushView();

    expect(document.body.textContent).toContain('active-SPECIMEN');
    expect(document.body.textContent).toContain('人体标本');
    expect(document.body.textContent).toContain('药物试剂');
    expect(mockGetMedicalWasteSpecimenOptions).toHaveBeenCalledTimes(1);
    expect(mockListMedicalWasteSpecimenBatches).toHaveBeenCalledTimes(1);
    expect(mockListMedicalWasteReagentBags).toHaveBeenCalledTimes(0);

    [...document.querySelectorAll('button')]
      .find((button) => button.textContent?.trim() === '药物试剂')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushView();

    expect(mockListMedicalWasteReagentBags).toHaveBeenCalledTimes(1);

    app.unmount();
    root.remove();
  });

  it('opens specimen print dialog, queries labels and prints', async () => {
    const { app, root } = mountView();
    await flushView();

    findButton('打印标签')?.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    await flushView();

    expect(document.body.textContent).toContain('打印标签');
    expect(findButton('查询')).toBeTruthy();

    const inputs = [
      ...document.querySelectorAll('input'),
    ] as HTMLInputElement[];
    inputs[0]!.value = 'HB-01';
    inputs[0]!.dispatchEvent(new Event('input', { bubbles: true }));
    inputs[1]!.value = '2026-06-16';
    inputs[1]!.dispatchEvent(new Event('input', { bubbles: true }));
    const selects = [
      ...document.querySelectorAll('select'),
    ] as HTMLSelectElement[];
    selects[0]!.value = '张三';
    selects[0]!.dispatchEvent(new Event('change', { bubbles: true }));
    selects[1]!.value = '取材台A';
    selects[1]!.dispatchEvent(new Event('change', { bubbles: true }));
    selects[2]!.value = 'AM';
    selects[2]!.dispatchEvent(new Event('change', { bubbles: true }));
    await flushView();

    [...document.querySelectorAll('button')]
      .findLast((button) => button.textContent?.trim() === '查询')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushView();

    expect(mockPreviewMedicalWasteSpecimenLabels).toHaveBeenCalledTimes(1);

    [...document.querySelectorAll('button')]
      .findLast((button) => button.textContent?.trim() === '打印标签')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushView();

    expect(mockPrintMedicalWasteSpecimenBatch).toHaveBeenCalledTimes(1);
    expect(mockOpenMedicalWastePrintWindow).toHaveBeenCalledTimes(1);

    app.unmount();
    root.remove();
  });

  it('switches to reagent tab and saves reagent print dialog', async () => {
    const { app, root } = mountView();
    await flushView();

    [...document.querySelectorAll('button')]
      .find((button) => button.textContent?.trim() === '药物试剂')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushView();

    expect(document.body.textContent).toContain('active-REAGENT');

    const reagentPrintButtons = [...document.querySelectorAll('button')].filter(
      (button) => button.textContent?.trim() === '打印标签',
    );
    reagentPrintButtons
      .findLast(() => true)
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushView();

    expect(document.body.textContent).toContain('保存');
    expect(document.body.textContent).toContain('退出');

    const reagentInputs = [
      ...document.querySelectorAll('input'),
    ] as HTMLInputElement[];
    reagentInputs[0]!.value = 'DW-01';
    reagentInputs[0]!.dispatchEvent(new Event('input', { bubbles: true }));
    const reagentSelects = [
      ...document.querySelectorAll('select'),
    ] as HTMLSelectElement[];
    reagentSelects[0]!.value = 'DRUG';
    reagentSelects[0]!.dispatchEvent(new Event('change', { bubbles: true }));
    await flushView();

    [...document.querySelectorAll('button')]
      .findLast((button) => button.textContent?.trim() === '保存')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushView();

    expect(mockSaveMedicalWasteReagentBag).toHaveBeenCalledTimes(1);
    expect(mockOpenMedicalWastePrintWindow).toHaveBeenCalledTimes(1);

    app.unmount();
    root.remove();
  });

  it('submits reagent handover for selected row', async () => {
    const { app, root } = mountView();
    await flushView();

    [...document.querySelectorAll('button')]
      .find((button) => button.textContent?.trim() === '药物试剂')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushView();

    document
      .querySelector('[data-row-id="BAG-1"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushView();

    findButton('确认')?.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    await flushView();

    const handoverInputs = [
      ...document.querySelectorAll('input'),
    ] as HTMLInputElement[];
    handoverInputs.at(-2)!.value = '管理员甲';
    handoverInputs.at(-2)!.dispatchEvent(new Event('input', { bubbles: true }));
    handoverInputs.at(-1)!.value = '2026-06-16T11:00:00';
    handoverInputs.at(-1)!.dispatchEvent(new Event('input', { bubbles: true }));
    await flushView();

    [...document.querySelectorAll('button')]
      .findLast((button) => button.textContent?.trim() === '保存')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushView();

    expect(mockHandoverMedicalWasteReagentBag).toHaveBeenCalledTimes(1);

    app.unmount();
    root.remove();
  });
});
