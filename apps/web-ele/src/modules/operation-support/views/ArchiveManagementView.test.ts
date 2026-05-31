import { createApp, defineComponent, h, reactive, ref } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockUseArchiveManagementPage } = vi.hoisted(() => ({
  mockUseArchiveManagementPage: vi.fn(),
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

  const ElTable = defineComponent({
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
    ElTable,
    ElTableColumn,
    ElTag,
  };
});

vi.mock('../components/OperationSectionCard.vue', () => ({
  default: defineComponent({
    props: ['description', 'title'],
    setup(props, { slots }) {
      return () =>
        h('section', [
          h('h2', props.title),
          props.description ? h('p', props.description) : null,
          slots.extra?.(),
          slots.default?.(),
        ]);
    },
  }),
}));

function createMarkerComponent(label: string) {
  return defineComponent({
    setup() {
      return () => h('div', label);
    },
  });
}

vi.mock('../components/ArchiveCabinetDialog.vue', () => ({
  default: createMarkerComponent('archive-cabinet-dialog'),
}));

vi.mock('../components/ArchivePositionWorkbenchPanel.vue', () => ({
  default: createMarkerComponent('archive-position-workbench-panel'),
}));

vi.mock('../components/ArchiveSubmissionPanel.vue', () => ({
  default: createMarkerComponent('archive-submission-panel'),
}));

vi.mock('../components/ArchiveRecordQueryPanel.vue', () => ({
  default: createMarkerComponent('archive-record-query-panel'),
}));

vi.mock('../components/ArchiveLoanWorkbenchPanel.vue', () => ({
  default: createMarkerComponent('archive-loan-workbench-panel'),
}));

vi.mock('../components/ArchiveReturnDialog.vue', () => ({
  default: createMarkerComponent('archive-return-dialog'),
}));

vi.mock('../composables/useArchiveManagementPage', () => ({
  useArchiveManagementPage: () => mockUseArchiveManagementPage(),
}));

import ArchiveManagementView from './ArchiveManagementView.vue';

function createMockPageState() {
  return {
    archiveForm: reactive({
      caseId: '',
      embeddingBoxId: '',
      fileName: '',
      fileUrl: '',
      objectType: 'APPLICATION_FORM',
      operatorName: '归档员甲',
      operatorUserId: 'USER-1',
      remarks: '',
      slideId: '',
      terminalCode: '',
    }),
    archivePermissionWarning: '',
    archiveSubmitButtonText: '提交申请单归档',
    cabinetCapacityPreview: 4,
    cabinetDialogMode: ref<'create' | 'edit' | null>(null),
    cabinetDialogVisible: ref(false),
    cabinetError: '',
    cabinetForm: reactive({
      cabinetCode: '',
      cabinetName: '',
      cabinetStatus: 'ACTIVE',
      cabinetType: 'STANDARD',
      layerCount: 2,
      locationDescription: '',
      operatorName: '归档员甲',
      operatorUserId: 'USER-1',
      remarks: '',
      slotCountPerLayer: 2,
      terminalCode: '',
    }),
    cabinetPositionRulePreview: 'CAB-01-L1-S1',
    cabinets: ref([
      {
        cabinetCode: 'CAB-01',
        cabinetName: '一号归档柜',
        cabinetStatus: 'ACTIVE',
        cabinetType: 'STANDARD',
        capacity: 4,
        id: 'CABINET-1',
        layerCount: 2,
        locationDescription: 'B1',
        remarks: '可用',
        slotCountPerLayer: 2,
      },
    ]),
    canCreateCabinet: true,
    canCreateLoan: true,
    canQueryCabinets: true,
    canQueryLoans: true,
    canQueryRecords: true,
    canReturnLoan: true,
    canSubmitArchive: true,
    canUpdateCabinet: true,
    canViewArchivePage: true,
    clearSelectedPosition: vi.fn(),
    getArchiveStatusTagType: vi.fn(() => 'success'),
    getCabinetStatusTagType: vi.fn(() => 'success'),
    getLoanStatusTagType: vi.fn(() => 'warning'),
    getPositionStatusTagType: vi.fn(() => 'success'),
    getToggleCabinetActionLabel: vi.fn(() => '停用'),
    isEditingCabinet: ref(false),
    loadLoans: vi.fn(),
    loadPositions: vi.fn(),
    loadRecords: vi.fn(),
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
    loading: reactive({
      cabinets: false,
      loans: false,
      positions: false,
      records: false,
    }),
    openCreateCabinetDialog: vi.fn(),
    openEditCabinetDialog: vi.fn(),
    openReturnDialog: vi.fn(),
    pendingLoans: ref([]),
    positionError: '',
    positionFilters: reactive({
      cabinetId: '',
      cabinetType: '',
    }),
    positionRows: ref([]),
    positionSummary: ref({
      available: 0,
      disabled: 0,
      occupied: 0,
      total: 0,
    }),
    recordError: '',
    recordFilters: reactive({
      caseId: '',
      keyword: '',
      objectType: '',
    }),
    records: ref([]),
    returnDialogVisible: ref(false),
    returnForm: reactive({
      operatorName: '归档员甲',
      operatorUserId: 'USER-1',
      remarks: '',
      terminalCode: '',
    }),
    returningLoan: ref(null),
    selectedPosition: ref(null),
    selectedPositionCode: ref(''),
    selectedPositionLabel: ref('未选择柜位'),
    selectedReturnPositionDescription: ref('默认归还到原始归档柜位'),
    selectPosition: vi.fn(),
    submitArchive: vi.fn(),
    submitCabinet: vi.fn(),
    submitLoan: vi.fn(),
    submitReturn: vi.fn(),
    submitting: ref(false),
    toggleCabinetStatus: vi.fn(),
  };
}

function mountView() {
  const root = document.createElement('div');
  document.body.append(root);

  const app = createApp({
    render: () => h(ArchiveManagementView),
  });

  app.mount(root);

  return {
    app,
    root,
  };
}

describe('ArchiveManagementView', () => {
  beforeEach(() => {
    mockUseArchiveManagementPage.mockReturnValue(createMockPageState());
  });

  afterEach(() => {
    mockUseArchiveManagementPage.mockReset();
    document.body.innerHTML = '';
  });

  it('shows fallback when user cannot access the archive page', () => {
    const state = createMockPageState();
    state.canViewArchivePage = false;
    mockUseArchiveManagementPage.mockReturnValue(state);

    const { app, root } = mountView();

    expect(document.body.textContent).toContain('fallback-403');
    expect(document.body.textContent).not.toContain('归档管理');

    app.unmount();
    root.remove();
  });

  it('renders key archive workbench sections and keeps create action wired', async () => {
    const state = createMockPageState();
    mockUseArchiveManagementPage.mockReturnValue(state);

    const { app, root } = mountView();

    expect(document.body.textContent).toContain('归档管理');
    expect(document.body.textContent).toContain('医生工作台状态回流');
    expect(document.body.textContent).toContain('柜位编码规则');
    expect(document.body.textContent).toContain('归档柜工作站');
    expect(document.body.textContent).toContain(
      'archive-position-workbench-panel',
    );
    expect(document.body.textContent).toContain('archive-submission-panel');
    expect(document.body.textContent).toContain('archive-record-query-panel');
    expect(document.body.textContent).toContain('archive-loan-workbench-panel');
    expect(document.body.textContent).toContain('archive-cabinet-dialog');
    expect(document.body.textContent).toContain('archive-return-dialog');

    const createButton = [...document.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === '新增归档柜',
    );
    expect(createButton).toBeTruthy();

    createButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(state.openCreateCabinetDialog).toHaveBeenCalledTimes(1);

    app.unmount();
    root.remove();
  });
});
