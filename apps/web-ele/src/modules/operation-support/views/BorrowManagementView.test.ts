import { createApp, defineComponent, h, reactive } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockUseBorrowManagementPage } = vi.hoisted(() => ({
  mockUseBorrowManagementPage: vi.fn(),
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

vi.mock('element-plus', () => {
  const ElAlert = defineComponent({
    props: ['title'],
    setup(props, { slots }) {
      return () => h('div', [props.title, slots.default?.()]);
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

  const ElCheckbox = defineComponent({
    props: ['modelValue'],
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h('input', {
          checked: Boolean(props.modelValue),
          type: 'checkbox',
          onChange: (event: Event) =>
            emit(
              'update:modelValue',
              (event.target as HTMLInputElement).checked,
            ),
        });
    },
  });

  const ElForm = defineComponent({
    setup(_, { attrs, slots }) {
      return () => h('form', attrs, slots.default?.());
    },
  });

  const ElDialog = defineComponent({
    props: ['modelValue', 'title'],
    setup(props, { slots }) {
      return () => h('div', [props.title, slots.default?.(), slots.footer?.()]);
    },
  });

  const ElDatePicker = defineComponent({
    props: ['modelValue'],
    emits: ['update:modelValue'],
    setup(props, { attrs, emit }) {
      return () =>
        h('input', {
          ...attrs,
          value: props.modelValue,
          onInput: (event: Event) =>
            emit('update:modelValue', (event.target as HTMLInputElement).value),
        });
    },
  });

  const ElFormItem = defineComponent({
    props: ['label'],
    setup(props, { slots }) {
      return () => h('label', [props.label, slots.default?.()]);
    },
  });

  const ElInput = defineComponent({
    props: ['modelValue'],
    emits: ['update:modelValue'],
    setup(props, { attrs, emit }) {
      return () =>
        h('input', {
          ...attrs,
          value: props.modelValue,
          onInput: (event: Event) =>
            emit('update:modelValue', (event.target as HTMLInputElement).value),
        });
    },
  });

  const ElInputNumber = ElInput;

  const ElOption = defineComponent({
    props: ['label'],
    setup(props) {
      return () => h('option', props.label);
    },
  });

  const ElSelect = defineComponent({
    props: ['modelValue'],
    emits: ['update:modelValue'],
    setup(props, { attrs, emit, slots }) {
      return () =>
        h(
          'select',
          {
            ...attrs,
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

  const ElPagination = defineComponent({
    setup() {
      return () => h('nav', 'pagination');
    },
  });

  const ElRadio = defineComponent({
    props: ['value'],
    setup(props, { slots }) {
      return () => h('label', [String(props.value), slots.default?.()]);
    },
  });

  const ElRadioGroup = defineComponent({
    setup(_, { slots }) {
      return () => h('div', slots.default?.());
    },
  });

  const ElTable = defineComponent({
    setup(_, { attrs, slots }) {
      return () => h('div', attrs, slots.default?.());
    },
  });

  const ElTableColumn = defineComponent({
    props: ['label'],
    setup(props) {
      return () => h('span', props.label);
    },
  });

  const ElTabs = defineComponent({
    setup(_, { slots }) {
      return () => h('div', slots.default?.());
    },
  });

  const ElTabPane = defineComponent({
    props: ['label'],
    setup(props, { slots }) {
      return () =>
        h('section', [
          h('button', { role: 'tab' }, props.label),
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
    ElForm,
    ElFormItem,
    ElInput,
    ElInputNumber,
    ElOption,
    ElPagination,
    ElRadio,
    ElRadioGroup,
    ElSelect,
    ElTabPane,
    ElTable,
    ElTableColumn,
    ElTabs,
    ElTag,
  };
});

function createMarkerComponent(label: string) {
  return defineComponent({
    setup() {
      return () => h('div', label);
    },
  });
}

vi.mock('../components/ArchiveReturnDialog.vue', () => ({
  default: createMarkerComponent('archive-return-dialog'),
}));

vi.mock('../components/EmbeddingBoxBorrowDialog.vue', () => ({
  default: createMarkerComponent('embedding-box-borrow-dialog'),
}));

vi.mock('../components/ArchiveLoanMaterialListPanel.vue', () => ({
  default: defineComponent({
    emits: ['borrow'],
    setup(_, { emit }) {
      return () =>
        h(
          'button',
          {
            type: 'button',
            onClick: () => emit('borrow'),
          },
          'mock-material-borrow',
        );
    },
  }),
}));

vi.mock('../composables/useBorrowManagementPage', () => ({
  useBorrowManagementPage: () => mockUseBorrowManagementPage(),
}));

import BorrowManagementView from './BorrowManagementView.vue';

function createMockPageState() {
  return {
    cabinetWorkspace: {
      cabinets: [],
      clearSelectedPosition: vi.fn(),
      loadPositions: vi.fn(),
      loading: reactive({
        positions: false,
      }),
      positionError: '',
      positionFilters: reactive({
        cabinetId: '',
        cabinetType: '',
      }),
      positionRows: [],
      positionSummary: {
        available: 0,
        disabled: 0,
        occupied: 0,
        total: 0,
      },
      selectPosition: vi.fn(),
      selectedPosition: null,
      selectedPositionCode: '',
      selectedPositionLabel: '未选择柜位',
    },
    capabilities: {
      canCreateLoan: true,
      canCreateWhiteSlideLoan: true,
      canQueryCabinets: true,
      canQueryLoans: true,
      canQueryRecords: true,
      canQueryWhiteSlideLoans: true,
      canRegisterLoanAbnormal: true,
      canReturnLoan: true,
      canReturnWhiteSlideLoan: true,
      canViewBorrowPage: true,
    },
    display: {
      getArchiveStatusTagType: vi.fn(() => 'success'),
      getLoanStatusTagType: vi.fn(() => 'warning'),
      getPositionStatusTagType: vi.fn(() => 'success'),
    },
    loanWorkspace: {
      abnormalDialogVisible: false,
      abnormalForm: reactive({
        abnormalReason: '',
        borrowedAt: '',
        borrowedContent: '',
        borrowedSlideNo: '',
        borrowerIdentityNo: '',
        borrowerName: '',
        borrowerPhone: '',
        borrowerRelationship: '',
        borrowerUnit: '',
        contactResult: '',
        contacted: false,
        depositAmount: '',
        expectedReturnAt: '',
        loanId: '',
        materialId: '',
        materialType: 'SLIDE',
        returnAbnormalInfo: '',
        slideCount: 1,
        terminalCode: '',
      }),
      archiveObjectError: '',
      archiveObjectLoading: false,
      borrowDialogVisible: false,
      borrowDialogMode: 'EMBEDDING_BOX',
      loadMaterialObjects: vi.fn(),
      loadLoans: vi.fn(),
      loading: false,
      loanError: '',
      loanFilters: reactive({
        keyword: '',
        loanStatus: 'BORROWED',
        materialType: '',
      }),
      loanForm: reactive({
        borrowerPhone: '',
        borrowerUnit: '',
        borrowPurpose: '',
        borrowedByName: '',
        borrowedByUserId: '',
        depositAmount: '',
        materialId: '',
        materialType: 'SLIDE',
        operatorName: '归档员甲',
        operatorUserId: 'USER-1',
        remarks: '',
        terminalCode: '',
      }),
      materialObjectFilters: reactive({
        keyword: '',
        page: 1,
        size: 20,
      }),
      materialObjectPage: reactive({
        items: [],
        total: 0,
      }),
      openAbnormalDialog: vi.fn(),
      openBorrowDialog: vi.fn(),
      openReturnDialog: vi.fn(),
      openSelectedReturnDialog: vi.fn(),
      pendingLoans: [],
      queryMaterialObjects: vi.fn(),
      returnDialogVisible: false,
      returnForm: reactive({
        operatorName: '归档员甲',
        remarks: '',
        terminalCode: '',
      }),
      returningLoan: null,
      returningLoans: [],
      selectMaterialRecord: vi.fn(),
      selectedMaterialRecords: [],
      selectedMaterialSummary: '',
      selectedReturnPositionDescription: '默认归还到原始归档柜位',
      setActiveMaterialType: vi.fn(),
      setMaterialObjectPage: vi.fn(),
      setMaterialObjectSize: vi.fn(),
      setSelectedMaterialRecords: vi.fn(),
      submitAbnormalRecord: vi.fn(),
      submitLoan: vi.fn(),
      submitReturn: vi.fn(),
    },
    pageState: {
      submitting: false,
    },
    whiteSlideWorkspace: {
      borrowDialogVisible: false,
      borrowForm: reactive({
        amount: null,
        borrowerIdentityNo: '',
        borrowerName: '',
        borrowerPhone: '',
        borrowerUnit: '',
        caseId: '',
        embeddingBoxNo: '',
        pathologyNo: '',
        patientName: '',
        quantity: 1,
        remarks: '',
        saveDirectPrint: false,
        slicePurpose: '',
        sliceThickness: '',
        stockId: 'WS-STOCK-DEFAULT',
        stockNo: 'WS-DEFAULT',
        terminalCode: '',
        unitPrice: null,
        waxBlockUsage: '',
      }),
      calculatedAmount: null,
      filters: reactive({
        keyword: '',
        loanStatus: 'BORROWED',
        stockStatus: 'ACTIVE',
      }),
      listError: '',
      loading: false,
      loans: [],
      openBorrowDialog: vi.fn(),
      openReturnDialog: vi.fn(),
      printDraftLoan: vi.fn(),
      printLoan: vi.fn(),
      query: vi.fn(),
      reloadAll: vi.fn(),
      returnDialogVisible: false,
      returnForm: reactive({
        remarks: '',
        terminalCode: '',
      }),
      selectedLoan: null,
      selectedStock: null,
      stocks: [],
      submitBorrow: vi.fn(),
      submitReturn: vi.fn(),
    },
  };
}

function mountView() {
  const root = document.createElement('div');
  document.body.append(root);

  const app = createApp({
    render: () => h(BorrowManagementView),
  });

  app.directive('loading', {});
  app.mount(root);

  return {
    app,
    root,
  };
}

describe('BorrowManagementView', () => {
  beforeEach(() => {
    mockUseBorrowManagementPage.mockReturnValue(createMockPageState());
  });

  afterEach(() => {
    mockUseBorrowManagementPage.mockReset();
    document.body.innerHTML = '';
  });

  it('shows fallback when user cannot access borrow page', () => {
    const state = createMockPageState();
    state.capabilities.canViewBorrowPage = false;
    mockUseBorrowManagementPage.mockReturnValue(state);

    const { app, root } = mountView();

    expect(document.body.textContent).toContain('fallback-403');
    expect(document.body.textContent).not.toContain('借记管理');

    app.unmount();
    root.remove();
  });

  it('renders borrow tabs and wires panel components', () => {
    const state = createMockPageState();
    mockUseBorrowManagementPage.mockReturnValue(state);

    const { app, root } = mountView();

    expect(document.body.textContent).toContain('蜡块借记');
    expect(document.body.textContent).toContain('玻片借记');
    expect(document.body.textContent).toContain('白片借记');
    expect(document.body.textContent).toContain('待归还/归还');
    expect(document.body.textContent).toContain('archive-return-dialog');
    expect(document.body.textContent).toContain('embedding-box-borrow-dialog');
    expect(document.body.textContent).toContain('mock-material-borrow');
    expect(state.loanWorkspace.setActiveMaterialType).toHaveBeenCalledWith(
      'EMBEDDING_BOX',
    );

    app.unmount();
    root.remove();
  });

  it('uses embedding-box borrow mode for wax block tab', () => {
    const state = createMockPageState();
    mockUseBorrowManagementPage.mockReturnValue(state);

    const { app, root } = mountView();

    const borrowButton = [...document.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('mock-material-borrow'),
    );
    borrowButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(state.loanWorkspace.openBorrowDialog).toHaveBeenCalledWith(
      'EMBEDDING_BOX',
    );

    app.unmount();
    root.remove();
  });

  it('falls back to generic borrow dialog for non-embedding-box mode', () => {
    const state = createMockPageState();
    state.loanWorkspace.borrowDialogMode = 'GENERIC';
    mockUseBorrowManagementPage.mockReturnValue(state);

    const { app, root } = mountView();

    expect(document.body.textContent).not.toContain(
      'embedding-box-borrow-dialog',
    );

    app.unmount();
    root.remove();
  });

  it('does not render secondary section titles in borrow tabs', () => {
    const state = createMockPageState();
    mockUseBorrowManagementPage.mockReturnValue(state);

    const { app, root } = mountView();

    expect(document.body.textContent).toContain('蜡块借记');
    expect(document.body.textContent).toContain('玻片借记');
    expect(document.body.textContent).toContain('白片借记');
    expect(document.body.textContent).toContain('待归还/归还');
    expect(document.body.textContent).not.toContain('蜡块借记列表');
    expect(document.body.textContent).not.toContain('玻片借记列表');
    expect(document.body.textContent).not.toContain(
      '按现有借阅待归还契约展示列表',
    );
    expect(document.body.textContent).not.toContain('柜位查询与选择');
    expect(document.body.textContent).not.toContain(
      '按归档柜或柜体类型查询柜位',
    );
    expect(document.body.textContent).not.toContain('待归还与归还');
    expect(document.body.textContent).not.toContain(
      '查询当前借出中材料，并从列表中发起归还。',
    );
    expect(document.body.textContent).not.toContain('蜡块借出登记');
    expect(document.body.textContent).not.toContain('玻片借出登记');
    expect(document.body.textContent).not.toContain('登记材料借出信息');

    app.unmount();
    root.remove();
  });

  it('shows permission warning when loan query is limited', () => {
    const state = createMockPageState();
    state.capabilities.canQueryLoans = false;
    mockUseBorrowManagementPage.mockReturnValue(state);

    const { app, root } = mountView();

    expect(document.body.textContent).toContain(
      '当前账号缺少待归还列表查询权限',
    );

    app.unmount();
    root.remove();
  });
});
