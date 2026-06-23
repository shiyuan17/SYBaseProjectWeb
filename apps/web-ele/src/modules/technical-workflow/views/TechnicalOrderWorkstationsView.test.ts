import type { PendingMedicalOrderPage } from '../../doctor-workflow/types/doctor-workflow';

import { createApp, defineComponent, h, inject, nextTick, provide } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { listPendingMedicalOrders } from '../../doctor-workflow/api/doctor-workflow-service';
import CytologyWorkstationView from './CytologyWorkstationView.vue';
import IhcWorkstationView from './IhcWorkstationView.vue';
import LiquidCytologyWorkstationView from './LiquidCytologyWorkstationView.vue';
import RoutineOrderWorkstationView from './RoutineOrderWorkstationView.vue';
import SpecialOrderWorkstationView from './SpecialOrderWorkstationView.vue';

const tableRowsKey = Symbol('technical-order-workstation-table-rows');

const { messageInfo, mockRoute } = vi.hoisted(() => ({
  messageInfo: vi.fn(),
  mockRoute: {
    query: {},
  } as { query: Record<string, string> },
}));

vi.mock('../../doctor-workflow/api/doctor-workflow-service', () => ({
  listPendingMedicalOrders: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
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

vi.mock('element-plus', () => {
  const ElAlert = defineComponent({
    props: ['title'],
    setup(props, { slots }) {
      return () =>
        h('div', { role: 'alert' }, [
          slots.title?.() ?? props.title,
          slots.default?.(),
        ]);
    },
  });

  const ElButton = defineComponent({
    props: ['disabled', 'link', 'type'],
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

  const ElCheckbox = defineComponent({
    props: ['modelValue'],
    emits: ['update:modelValue'],
    setup(props, { emit, slots }) {
      return () =>
        h('label', [
          h('input', {
            checked: Boolean(props.modelValue),
            type: 'checkbox',
            onChange: (event: Event) =>
              emit(
                'update:modelValue',
                (event.target as HTMLInputElement).checked,
              ),
          }),
          slots.default?.(),
        ]);
    },
  });

  const ElDatePicker = defineComponent({
    props: ['modelValue', 'placeholder', 'shortcuts'],
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h('input', {
          'data-shortcuts': Array.isArray(props.shortcuts)
            ? props.shortcuts
                .map((item: { text: string }) => item.text)
                .join(',')
            : '',
          'data-testid': 'work-date-picker',
          placeholder: props.placeholder,
          value: props.modelValue,
          onInput: (event: Event) =>
            emit('update:modelValue', (event.target as HTMLInputElement).value),
        });
    },
  });

  const ElEmpty = defineComponent({
    props: ['description'],
    setup(props) {
      return () => h('div', props.description);
    },
  });

  const ElDialog = defineComponent({
    props: ['modelValue', 'title'],
    emits: ['update:modelValue'],
    setup(props, { slots }) {
      return () =>
        props.modelValue
          ? h('div', [
              props.title ? h('h2', props.title) : null,
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
          ? h('div', [
              props.title ? h('h2', props.title) : null,
              slots.default?.(),
              slots.footer?.(),
            ])
          : null;
    },
  });

  const ElForm = defineComponent({
    setup(_, { slots }) {
      return () => h('form', slots.default?.());
    },
  });

  const ElFormItem = defineComponent({
    props: ['label'],
    setup(props, { slots }) {
      return () =>
        h('label', [
          props.label ? h('span', props.label) : null,
          slots.default?.(),
        ]);
    },
  });

  const ElInput = defineComponent({
    props: ['modelValue', 'placeholder'],
    emits: ['keyup', 'update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h('input', {
          placeholder: props.placeholder,
          value: props.modelValue,
          onInput: (event: Event) =>
            emit('update:modelValue', (event.target as HTMLInputElement).value),
          onKeyup: (event: KeyboardEvent) => emit('keyup', event),
        });
    },
  });

  const ElOption = defineComponent({
    props: ['label', 'value'],
    setup(props) {
      return () =>
        h('option', { value: props.value }, props.label ?? props.value);
    },
  });

  const ElPagination = defineComponent({
    props: ['currentPage', 'pageSize', 'total'],
    emits: ['update:currentPage', 'update:pageSize'],
    setup(props, { emit }) {
      return () =>
        h(
          'div',
          {
            'data-testid': 'pagination',
          },
          [
            `total:${props.total};page:${props.currentPage};size:${props.pageSize}`,
            h(
              'button',
              {
                'data-testid': 'next-page',
                type: 'button',
                onClick: () =>
                  emit('update:currentPage', Number(props.currentPage) + 1),
              },
              'next',
            ),
            h(
              'button',
              {
                'data-testid': 'page-size-50',
                type: 'button',
                onClick: () => emit('update:pageSize', 50),
              },
              'size50',
            ),
          ],
        );
    },
  });

  const ElSelect = defineComponent({
    props: ['modelValue'],
    emits: ['update:modelValue'],
    setup(props, { emit, slots }) {
      return () =>
        h(
          'select',
          {
            value: props.modelValue,
            onChange: (event: Event) =>
              emit(
                'update:modelValue',
                (event.target as HTMLSelectElement).value,
              ),
          },
          slots.default?.(),
        );
    },
  });

  const ElTable = defineComponent({
    props: ['data', 'loading'],
    emits: ['selection-change'],
    setup(props, { emit, slots }) {
      provide(tableRowsKey, () => props.data ?? []);

      return () =>
        h('section', { 'data-loading': props.loading ? 'true' : 'false' }, [
          props.loading ? h('span', '加载中') : null,
          slots.default?.(),
          ...(props.data ?? []).map((row: any) =>
            h(
              'button',
              {
                'data-testid': `select-row-${row.id}`,
                type: 'button',
                onClick: () => emit('selection-change', [row]),
              },
              row.id,
            ),
          ),
        ]);
    },
  });

  const ElTableColumn = defineComponent({
    props: ['label'],
    setup(props, { slots }) {
      const getRows = inject<() => any[]>(tableRowsKey, () => []);

      return () =>
        h('div', [
          props.label ? h('span', props.label) : null,
          ...getRows().flatMap(
            (row, index) => slots.default?.({ row, $index: index }) ?? [],
          ),
        ]);
    },
  });

  const ElTabs = defineComponent({
    props: ['modelValue'],
    emits: ['update:modelValue'],
    setup(_, { slots }) {
      return () => h('div', slots.default?.());
    },
  });

  const ElTabPane = defineComponent({
    props: ['label', 'name'],
    setup(props, { slots }) {
      return () =>
        h('div', [
          props.label ? h('span', props.label) : null,
          slots.default?.(),
        ]);
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
    ElCheckbox,
    ElDatePicker,
    ElDialog,
    ElDrawer,
    ElEmpty,
    ElForm,
    ElFormItem,
    ElInput,
    ElMessage: {
      info: messageInfo,
      success: vi.fn(),
      warning: vi.fn(),
    },
    ElOption,
    ElPagination,
    ElSelect,
    ElTable,
    ElTableColumn,
    ElTabPane,
    ElTabs,
    ElTag,
  };
});

const listPendingMedicalOrdersMock = vi.mocked(listPendingMedicalOrders);

function createPendingMedicalOrderPage(
  orderCategoryCode = 'IHC',
): PendingMedicalOrderPage {
  return {
    items: [
      {
        caseId: 'CASE-001',
        doctorName: '张医生',
        orderCategoryCode,
        orderCategoryName: '免疫组化',
        orderContent: 'CK（蜡块: A1）',
        orderDate: '2026-06-05 09:12:30',
        orderId: `ORDER-${orderCategoryCode}`,
        orderItemName: 'CK',
        orderNumber: 'MO-001',
        orderType: orderCategoryCode,
        pathologyNo: `BL-${orderCategoryCode}`,
        patientName: '王女士',
        remarks: '加做',
        status: 'PENDING',
      },
    ],
    page: 1,
    size: 20,
    total: 1,
  };
}

function renderView(component: object) {
  const root = document.createElement('div');
  document.body.append(root);

  const app = createApp(component);
  app.mount(root);

  return {
    root,
    unmount() {
      app.unmount();
      root.remove();
    },
  };
}

async function flushAsyncUpdates() {
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

describe('technical order workstation views', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-17T09:00:00'));
    listPendingMedicalOrdersMock.mockResolvedValue(
      createPendingMedicalOrderPage(),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
    messageInfo.mockReset();
    listPendingMedicalOrdersMock.mockReset();
  });

  it.each([
    [
      RoutineOrderWorkstationView,
      '常规医嘱工作站',
      '确认',
      '住院号',
      'ROUTINE,EXAM,CGRS,BLOCK,QP',
    ],
    [SpecialOrderWorkstationView, '特检医嘱工作站', '确认', '项目类型', 'TSRS'],
    [IhcWorkstationView, '免疫组化工作站', '染色', '分配设备', 'IHC'],
    [
      CytologyWorkstationView,
      '细胞学工作站',
      '生成蜡块',
      '送检类型',
      'CYTOLOGY',
    ],
    [
      LiquidCytologyWorkstationView,
      '液基细胞学工作站',
      '打印玻片',
      '流程状态',
      'LIQUID_CYTOLOGY',
    ],
  ])(
    'loads %s real medical orders with fixed category code',
    async (component, title, actionLabel, columnLabel, orderCategoryCode) => {
      listPendingMedicalOrdersMock.mockResolvedValueOnce(
        createPendingMedicalOrderPage(orderCategoryCode),
      );

      const wrapper = renderView(component);
      await flushAsyncUpdates();

      expect(wrapper.root.textContent).not.toContain(title);
      expect(wrapper.root.textContent).toContain(actionLabel);
      expect(wrapper.root.textContent).toContain(columnLabel);
      expect(wrapper.root.textContent).toContain(`BL-${orderCategoryCode}`);
      expect(
        wrapper.root.querySelector<HTMLInputElement>(
          '[data-testid="work-date-picker"]',
        )?.dataset.shortcuts,
      ).toBe('今天,昨天,本周,本月');
      if (orderCategoryCode === 'ROUTINE,EXAM,CGRS,BLOCK,QP') {
        expect(wrapper.root.textContent).toContain('收费状态');
      }
      expect(listPendingMedicalOrdersMock).toHaveBeenCalledWith({
        dateFrom: undefined,
        dateTo: undefined,
        orderCategoryCode,
        page: 1,
        pathologyNo: undefined,
        size: orderCategoryCode === 'ROUTINE,EXAM,CGRS,BLOCK,QP' ? 30 : 100,
        status: undefined,
      });

      wrapper.unmount();
    },
  );

  it('shows charged HE staining orders in routine workstation results', async () => {
    listPendingMedicalOrdersMock.mockResolvedValueOnce({
      items: [
        {
          billingStatus: 'SUCCESS',
          caseId: 'CASE-HE',
          doctorName: '石医生',
          orderCategoryCode: 'ROUTINE',
          orderCategoryName: '常规医嘱',
          orderContent: 'HE染色（蜡块: A1）',
          orderDate: '2026-06-08T00:00:00',
          orderId: 'ORDER-HE-CHARGED',
          orderItemCode: 'HE',
          orderItemName: 'HE染色',
          orderNumber: 'MO-HE-001',
          orderType: 'ROUTINE',
          pathologyNo: 'BL20260608003',
          patientName: '测试患者',
          remarks: null,
          status: 'PENDING',
        },
      ],
      page: 1,
      size: 30,
      total: 1,
    });

    const wrapper = renderView(RoutineOrderWorkstationView);
    await flushAsyncUpdates();

    expect(wrapper.root.textContent).toContain('HE染色');
    expect(wrapper.root.textContent).toContain('已收费');
    expect(wrapper.root.textContent).toContain('2026-06-08 00:00:00');
    expect(listPendingMedicalOrdersMock).toHaveBeenCalledWith({
      dateFrom: undefined,
      dateTo: undefined,
      orderCategoryCode: 'ROUTINE,EXAM,CGRS,BLOCK,QP',
      page: 1,
      pathologyNo: undefined,
      size: 30,
      status: undefined,
    });

    wrapper.unmount();
  });

  it('searches remote rows by pathology number', async () => {
    const wrapper = renderView(RoutineOrderWorkstationView);
    await flushAsyncUpdates();

    const input = wrapper.root.querySelector(
      'input[placeholder="请输入病理号"]',
    ) as HTMLInputElement | null;
    expect(input).not.toBeNull();

    listPendingMedicalOrdersMock.mockResolvedValueOnce({
      items: [],
      page: 1,
      size: 30,
      total: 0,
    });
    input!.value = 'BL-202606050001';
    input!.dispatchEvent(new Event('input'));
    await nextTick();

    const queryButton = [...wrapper.root.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('查询'),
    );
    queryButton?.click();
    await flushAsyncUpdates();

    expect(listPendingMedicalOrdersMock).toHaveBeenLastCalledWith({
      dateFrom: undefined,
      dateTo: undefined,
      orderCategoryCode: 'ROUTINE,EXAM,CGRS,BLOCK,QP',
      page: 1,
      pathologyNo: 'BL-202606050001',
      size: 30,
      status: undefined,
    });
    expect(wrapper.root.textContent).toContain('暂无常规医嘱数据');

    wrapper.unmount();
  });

  it('reloads remote rows when status or pagination changes', async () => {
    const wrapper = renderView(IhcWorkstationView);
    await flushAsyncUpdates();

    listPendingMedicalOrdersMock.mockResolvedValue({
      items: [],
      page: 2,
      size: 100,
      total: 101,
    });
    const statusSelect = wrapper.root.querySelector(
      'select',
    ) as HTMLSelectElement | null;
    expect(statusSelect).not.toBeNull();

    statusSelect!.value = 'PENDING';
    statusSelect!.dispatchEvent(new Event('change'));
    await flushAsyncUpdates();

    expect(listPendingMedicalOrdersMock).toHaveBeenLastCalledWith({
      dateFrom: undefined,
      dateTo: undefined,
      orderCategoryCode: 'IHC',
      page: 1,
      pathologyNo: undefined,
      size: 100,
      status: 'PENDING',
    });

    wrapper.root
      .querySelector<HTMLButtonElement>('[data-testid="next-page"]')
      ?.click();
    await flushAsyncUpdates();

    expect(listPendingMedicalOrdersMock).toHaveBeenLastCalledWith({
      dateFrom: undefined,
      dateTo: undefined,
      orderCategoryCode: 'IHC',
      page: 2,
      pathologyNo: undefined,
      size: 100,
      status: 'PENDING',
    });

    wrapper.unmount();
  });

  it('renders the ihc workstation with display patient id and without removed columns', async () => {
    listPendingMedicalOrdersMock.mockResolvedValueOnce({
      items: [
        {
          caseId: 'CASE-001',
          doctorName: '张医生',
          orderCategoryCode: 'IHC',
          orderCategoryName: '免疫组化',
          orderContent: 'CK（蜡块: A1）',
          orderDate: '2026-06-05 09:12:30',
          orderId: 'ORDER-IHC',
          orderItemName: 'CK',
          orderNumber: 'MO-001',
          orderType: 'IHC',
          pathologyNo: 'BL-IHC',
          patientId: '946db168-2158-4a78-8fe2-4de5a14650a',
          patientIdDisplay: '08305',
          patientName: '王女士',
          remarks: '加做',
          status: 'PENDING',
        },
      ],
      page: 1,
      size: 100,
      total: 1,
    });

    const wrapper = renderView(IhcWorkstationView);
    await flushAsyncUpdates();

    expect(wrapper.root.textContent).toContain('08305');
    expect(wrapper.root.textContent).not.toContain(
      '946db168-2158-4a78-8fe2-4de5a14650a',
    );
    expect(wrapper.root.textContent).not.toContain('MO-001');
    expect(wrapper.root.textContent).not.toContain('玻片序号');
    expect(wrapper.root.textContent).not.toContain('打印指令回传结果');
    expect(wrapper.root.textContent).toContain('原病理号');

    wrapper.unmount();
  });

  it('shows failure state and retries loading medical orders', async () => {
    listPendingMedicalOrdersMock.mockRejectedValueOnce(new Error('接口异常'));

    const wrapper = renderView(SpecialOrderWorkstationView);
    await flushAsyncUpdates();

    expect(wrapper.root.textContent).toContain('接口异常');

    listPendingMedicalOrdersMock.mockResolvedValueOnce(
      createPendingMedicalOrderPage('TSRS'),
    );
    const retryButton = [...wrapper.root.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('重试'),
    );
    retryButton?.click();
    await flushAsyncUpdates();

    expect(wrapper.root.textContent).toContain('BL-TSRS');
    expect(listPendingMedicalOrdersMock).toHaveBeenCalledTimes(2);

    wrapper.unmount();
  });

  it('keeps fallback patient id on the special workstation', async () => {
    listPendingMedicalOrdersMock.mockResolvedValueOnce({
      items: [
        {
          caseId: 'CASE-TSRS-UUID',
          doctorName: '张医生',
          orderCategoryCode: 'TSRS',
          orderCategoryName: '特检',
          orderContent: '特检项目',
          orderDate: '2026-06-22 08:30:00',
          orderId: 'ORDER-TSRS-UUID',
          orderItemName: '特检项目',
          orderNumber: 'MO-TSRS-UUID',
          pathologyNo: 'BL-TSRS-UUID',
          patientId: '946db168-2158-4a71-8fe2-4de5a146f50a',
          patientIdDisplay: null,
          patientName: '患者丁',
          remarks: null,
          status: 'PENDING',
        },
      ],
      page: 1,
      size: 100,
      total: 1,
    });

    const wrapper = renderView(SpecialOrderWorkstationView);
    await flushAsyncUpdates();

    expect(wrapper.root.textContent).toContain(
      '946db168-2158-4a71-8fe2-4de5a146f50a',
    );

    wrapper.unmount();
  });

  it('keeps selection actions disabled until a remote row is selected', async () => {
    const wrapper = renderView(IhcWorkstationView);
    await flushAsyncUpdates();

    const confirmButton = [...wrapper.root.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('确认'),
    ) as HTMLButtonElement | undefined;
    expect(confirmButton).toBeDefined();
    expect(confirmButton?.disabled).toBe(true);

    wrapper.root
      .querySelector<HTMLButtonElement>('[data-testid="select-row-ORDER-IHC"]')
      ?.click();
    await nextTick();

    expect(confirmButton?.disabled).toBe(false);

    confirmButton?.click();

    expect(messageInfo).toHaveBeenCalledWith('确认功能待接入');

    wrapper.unmount();
  });

  it('shows routine medical order execution columns from backend fields', async () => {
    listPendingMedicalOrdersMock.mockResolvedValueOnce({
      items: [
        {
          acceptedAt: '2026-06-22T09:00:00',
          blockNo: 'A1',
          canConfirm: false,
          canPrint: true,
          canQc: true,
          canRelease: false,
          canTerminate: true,
          caseId: 'CASE-001',
          doctorName: '张医生',
          executorName: '技师甲',
          orderCategoryCode: 'ROUTINE',
          orderCategoryName: '常规医嘱',
          orderContent: 'HE染色',
          orderDate: '2026-06-22T08:30:00',
          orderId: 'ORDER-ROUTINE-1',
          orderItemName: 'HE染色',
          orderNumber: 'MO-001',
          orderType: 'ROUTINE',
          pathologyNo: 'BL-ROUTINE-1',
          patientName: '患者甲',
          printedAt: '2026-06-22T09:30:00',
          printedByName: '技师甲',
          remarks: '备注',
          slideNo: 'SLIDE-001',
          status: 'IN_PROGRESS',
          targetBlockId: 'BLOCK-1',
          targetSlideId: 'SLIDE-ID-1',
          targetSpecimenId: 'SPEC-1',
          targetType: 'BLOCK',
          terminationReasonLabel: null,
        },
      ],
      page: 1,
      size: 30,
      total: 1,
    });

    const wrapper = renderView(RoutineOrderWorkstationView);
    await flushAsyncUpdates();

    expect(wrapper.root.textContent).toContain('已确认');
    expect(wrapper.root.textContent).toContain('已打印');
    expect(wrapper.root.textContent).toContain('待出片');
    expect(wrapper.root.textContent).toContain('A1');
    expect(wrapper.root.textContent).toContain('HE染色');
    expect(wrapper.root.textContent).toContain('备注');

    wrapper.unmount();
  });

  it('shows submitting department on cytology and liquid cytology workstations', async () => {
    listPendingMedicalOrdersMock.mockResolvedValue({
      items: [
        {
          caseId: 'CASE-CYTOLOGY-001',
          doctorName: '张医生',
          orderCategoryCode: 'CYTOLOGY',
          orderCategoryName: '细胞学',
          orderContent: '细胞学检查',
          orderDate: '2026-06-22 08:30:00',
          orderId: 'ORDER-CYTOLOGY-001',
          orderItemName: '细胞学检查',
          orderNumber: 'MO-CYTOLOGY-001',
          pathologyNo: 'BL-CYTOLOGY-001',
          patientId: 'UUID-CYTOLOGY-001',
          patientIdDisplay: '08305',
          patientName: '患者甲',
          remarks: null,
          status: 'PENDING',
          submittingDepartmentName: '病理科',
        },
      ],
      page: 1,
      size: 100,
      total: 1,
    });

    const cytology = renderView(CytologyWorkstationView);
    await flushAsyncUpdates();
    expect(cytology.root.textContent).toContain('病理科');
    cytology.unmount();

    listPendingMedicalOrdersMock.mockResolvedValue({
      items: [
        {
          caseId: 'CASE-LBC-001',
          doctorName: '李医生',
          orderCategoryCode: 'LIQUID_CYTOLOGY',
          orderCategoryName: '液基细胞学',
          orderContent: '液基细胞学检查',
          orderDate: '2026-06-22 08:30:00',
          orderId: 'ORDER-LBC-001',
          orderItemName: '液基细胞学检查',
          orderNumber: 'MO-LBC-001',
          pathologyNo: 'BL-LBC-001',
          patientId: 'UUID-LBC-001',
          patientIdDisplay: '08306',
          patientName: '患者乙',
          remarks: null,
          status: 'PENDING',
          submittingDepartmentName: '妇科门诊',
        },
      ],
      page: 1,
      size: 100,
      total: 1,
    });

    const liquid = renderView(LiquidCytologyWorkstationView);
    await flushAsyncUpdates();
    expect(liquid.root.textContent).toContain('妇科门诊');
    liquid.unmount();
  });

  it('shows dash instead of internal patient id when patientIdDisplay is missing', async () => {
    listPendingMedicalOrdersMock.mockResolvedValue({
      items: [
        {
          caseId: 'CASE-LBC-UUID',
          doctorName: '李医生',
          orderCategoryCode: 'LIQUID_CYTOLOGY',
          orderCategoryName: '液基细胞学',
          orderContent: '液基细胞学检查',
          orderDate: '2026-06-22 08:30:00',
          orderId: 'ORDER-LBC-UUID',
          orderItemName: '液基细胞学检查',
          orderNumber: 'MO-LBC-UUID',
          pathologyNo: 'BL-LBC-UUID',
          patientId: '946db168-2158-4a71-8fe2-4de5a146f50a',
          patientIdDisplay: null,
          patientName: '患者丙',
          remarks: null,
          status: 'PENDING',
          submittingDepartmentName: '妇科门诊',
        },
      ],
      page: 1,
      size: 100,
      total: 1,
    });

    const liquid = renderView(LiquidCytologyWorkstationView);
    await flushAsyncUpdates();

    expect(liquid.root.textContent).not.toContain(
      '946db168-2158-4a71-8fe2-4de5a146f50a',
    );
    expect(liquid.root.textContent).toContain('妇科门诊');

    liquid.unmount();
  });

  it('shows work date picker only on the 4 targeted medical-order workstations', async () => {
    const routine = renderView(RoutineOrderWorkstationView);
    await flushAsyncUpdates();
    expect(
      routine.root.querySelector('[data-testid="work-date-picker"]'),
    ).toBeTruthy();
    routine.unmount();

    const special = renderView(SpecialOrderWorkstationView);
    await flushAsyncUpdates();
    expect(
      special.root.querySelector('[data-testid="work-date-picker"]'),
    ).toBeTruthy();
    special.unmount();

    const ihc = renderView(IhcWorkstationView);
    await flushAsyncUpdates();
    expect(
      ihc.root.querySelector('[data-testid="work-date-picker"]'),
    ).toBeTruthy();
    ihc.unmount();

    const liquid = renderView(LiquidCytologyWorkstationView);
    await flushAsyncUpdates();
    expect(
      liquid.root.querySelector('[data-testid="work-date-picker"]'),
    ).toBeTruthy();
    liquid.unmount();

    const cytology = renderView(CytologyWorkstationView);
    await flushAsyncUpdates();
    expect(
      cytology.root.querySelector('[data-testid="work-date-picker"]'),
    ).toBeTruthy();
    cytology.unmount();
  });
});
