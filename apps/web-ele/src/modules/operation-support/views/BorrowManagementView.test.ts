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
  const ElTabs = defineComponent({
    setup(_, { slots }) {
      return () => h('div', slots.default?.());
    },
  });

  const ElTabPane = defineComponent({
    props: ['label'],
    setup(props, { slots }) {
      return () => h('section', [h('h3', props.label), slots.default?.()]);
    },
  });

  return {
    ElTabPane,
    ElTabs,
  };
});

function createMarkerComponent(label: string) {
  return defineComponent({
    setup() {
      return () => h('div', label);
    },
  });
}

vi.mock('../components/ArchiveLoanCreatePanel.vue', () => ({
  default: createMarkerComponent('archive-loan-create-panel'),
}));

vi.mock('../components/ArchiveLoanPendingPanel.vue', () => ({
  default: createMarkerComponent('archive-loan-pending-panel'),
}));

vi.mock('../components/ArchivePositionWorkbenchPanel.vue', () => ({
  default: createMarkerComponent('archive-position-workbench-panel'),
}));

vi.mock('../components/ArchiveReturnDialog.vue', () => ({
  default: createMarkerComponent('archive-return-dialog'),
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
      canQueryCabinets: true,
      canQueryLoans: true,
      canReturnLoan: true,
      canViewBorrowPage: true,
    },
    display: {
      getLoanStatusTagType: vi.fn(() => 'warning'),
      getPositionStatusTagType: vi.fn(() => 'success'),
    },
    loanWorkspace: {
      loadLoans: vi.fn(),
      loading: false,
      loanError: '',
      loanFilters: reactive({
        keyword: '',
        materialType: '',
      }),
      loanForm: reactive({
        borrowPurpose: '',
        borrowedByName: '',
        borrowedByUserId: '',
        materialId: '',
        materialType: 'SLIDE',
        operatorName: '归档员甲',
        operatorUserId: 'USER-1',
        remarks: '',
        terminalCode: '',
      }),
      openReturnDialog: vi.fn(),
      pendingLoans: [],
      returnDialogVisible: false,
      returnForm: reactive({
        operatorName: '归档员甲',
        operatorUserId: 'USER-1',
        remarks: '',
        terminalCode: '',
      }),
      returningLoan: null,
      selectedReturnPositionDescription: '默认归还到原始归档柜位',
      submitLoan: vi.fn(),
      submitReturn: vi.fn(),
    },
    pageState: {
      submitting: false,
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

    expect(document.body.textContent).toContain('玻片借记');
    expect(document.body.textContent).toContain('蜡块借记');
    expect(document.body.textContent).toContain('待归还/归还');
    expect(document.body.textContent).toContain('archive-loan-create-panel');
    expect(document.body.textContent).toContain('archive-loan-pending-panel');
    expect(document.body.textContent).toContain(
      'archive-position-workbench-panel',
    );
    expect(document.body.textContent).toContain('archive-return-dialog');
    expect(state.loanWorkspace.loanForm.materialType).toBe('SLIDE');

    app.unmount();
    root.remove();
  });
});
