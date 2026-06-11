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

  const ElForm = defineComponent({
    setup(_, { attrs, slots }) {
      return () => h('form', attrs, slots.default?.());
    },
  });

  const ElFormItem = defineComponent({
    props: ['label'],
    setup(props, { slots }) {
      return () => h('label', [props.label, slots.default?.()]);
    },
  });

  const ElInput = defineComponent({
    setup(_, { attrs }) {
      return () => h('input', attrs);
    },
  });

  const ElOption = defineComponent({
    props: ['label'],
    setup(props) {
      return () => h('option', props.label);
    },
  });

  const ElSelect = defineComponent({
    setup(_, { attrs, slots }) {
      return () => h('select', attrs, slots.default?.());
    },
  });

  const ElTable = defineComponent({
    props: ['data'],
    setup(props, { attrs, slots }) {
      return () =>
        h('div', attrs, [
          slots.default?.(),
          h('pre', JSON.stringify(props.data ?? [])),
        ]);
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
      return () => h('section', [h('h3', props.label), slots.default?.()]);
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
    ElForm,
    ElFormItem,
    ElInput,
    ElOption,
    ElSelect,
    ElTabPane,
    ElTable,
    ElTableColumn,
    ElTabs,
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

vi.mock('../components/BatchArchiveCabinetDialog.vue', () => ({
  default: createMarkerComponent('batch-archive-cabinet-dialog'),
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

vi.mock('../composables/useArchiveManagementPage', () => ({
  useArchiveManagementPage: () => mockUseArchiveManagementPage(),
}));

import ArchiveManagementView from './ArchiveManagementView.vue';

function createMockPageState() {
  const openCreateCabinetDialog = vi.fn();
  const openBatchCreateCabinetDialog = vi.fn();

  return {
    archiveWorkspace: {
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
      canSubmitArchive: true,
      submitArchive: vi.fn(),
    },
    cabinetWorkspace: {
      batchCabinetDialogVisible: ref(false),
      batchCabinetForm: reactive({
        cabinetCodePrefix: '',
        cabinetNamePrefix: '',
        cabinetType: 'STANDARD',
        count: 1,
        layerCount: 1,
        locationDescription: '',
        numberWidth: 3,
        operatorName: '归档员甲',
        operatorUserId: 'USER-1',
        remarks: '',
        slotCountPerLayer: 10,
        startNo: 1,
        terminalCode: '',
      }),
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
      cabinets: [
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
      ],
      clearSelectedPosition: vi.fn(),
      isEditingCabinet: false,
      loadCabinets: vi.fn(),
      loadPositions: vi.fn(),
      loading: reactive({
        cabinets: false,
        positions: false,
      }),
      openCreateCabinetDialog,
      openBatchCreateCabinetDialog,
      openEditCabinetDialog: vi.fn(),
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
      submitCabinet: vi.fn(),
      submitBatchCabinets: vi.fn(),
      deleteCabinet: vi.fn(),
      toggleCabinetStatus: vi.fn(),
    },
    capabilities: {
      canCreateCabinet: true,
      canDeleteCabinet: true,
      canCreateLoan: true,
      canQueryCabinets: true,
      canQueryLoans: true,
      canQueryRecords: true,
      canReturnLoan: true,
      canUpdateCabinet: true,
      canViewArchivePage: true,
    },
    display: {
      getArchiveStatusTagType: vi.fn(() => 'success'),
      getCabinetStatusTagType: vi.fn(() => 'success'),
      getLoanStatusTagType: vi.fn(() => 'warning'),
      getPositionStatusTagType: vi.fn(() => 'success'),
      getToggleCabinetActionLabel: vi.fn(() => '停用'),
    },
    pageState: {
      submitting: false,
    },
    recordWorkspace: {
      loadRecords: vi.fn(),
      loading: false,
      recordError: '',
      recordFilters: reactive({
        caseId: '',
        keyword: '',
        objectType: '',
      }),
      records: [],
    },
  };
}

function mountView() {
  const root = document.createElement('div');
  document.body.append(root);

  const app = createApp({
    render: () => h(ArchiveManagementView),
  });

  app.directive('loading', {});
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
    state.capabilities.canViewArchivePage = false;
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

    expect(document.body.textContent).toContain('申请单归档');
    expect(document.body.textContent).toContain('蜡块归档');
    expect(document.body.textContent).toContain('玻片归档');
    expect(document.body.textContent).toContain('归档柜列表');
    expect(document.body.textContent).toContain('快速检索');
    expect(document.body.textContent).toContain('不限类型');
    expect(document.body.textContent).toContain('标准柜');
    expect(document.body.textContent).toContain('展开/折叠');
    expect(document.body.textContent).toContain('批量添加');
    expect(document.body.textContent).toContain('ROOT');
    expect(document.body.textContent).toContain('柜子类型');
    expect(document.body.textContent).toContain('路径');
    expect(document.body.textContent).toContain('层级');
    expect(document.body.textContent).not.toContain('标本归档');
    expect(document.body.textContent).not.toContain('借白片');
    expect(document.body.textContent).not.toContain('标本柜');
    expect(document.body.textContent).toContain('申请医生');
    expect(document.body.textContent).toContain('申请时间');
    expect(document.body.textContent).toContain('归档状态');
    expect(document.body.textContent).toContain('归档路径');
    expect(document.body.textContent).toContain('总容量');
    expect(document.body.textContent).toContain('剩余容量');
    expect(document.body.textContent).toContain(
      'archive-position-workbench-panel',
    );
    expect(document.body.textContent).toContain('archive-submission-panel');
    expect(document.body.textContent).toContain('archive-cabinet-dialog');
    expect(document.body.textContent).toContain('batch-archive-cabinet-dialog');
    expect(document.body.innerHTML).not.toContain('legacy-toolbar');
    expect(document.body.innerHTML).not.toContain('legacy-grid-table');
    expect(document.body.innerHTML).not.toContain('legacy-status-cell');
    expect(state.recordWorkspace.recordFilters.objectType).toBe(
      'APPLICATION_FORM',
    );

    const createButton = [...document.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === '新增',
    );
    expect(createButton).toBeTruthy();

    createButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(
      state.cabinetWorkspace.openCreateCabinetDialog,
    ).toHaveBeenCalledTimes(1);

    const batchButton = [...document.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === '批量添加',
    );
    expect(batchButton).toBeTruthy();

    batchButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(
      state.cabinetWorkspace.openBatchCreateCabinetDialog,
    ).toHaveBeenCalledTimes(1);

    app.unmount();
    root.remove();
  });

  it('shows permission warnings for record and cabinet query limits', () => {
    const state = createMockPageState();
    state.capabilities.canQueryRecords = false;
    state.capabilities.canQueryCabinets = false;
    mockUseArchiveManagementPage.mockReturnValue(state);

    const { app, root } = mountView();

    expect(document.body.textContent).toContain('当前账号缺少归档记录查询权限');
    expect(document.body.textContent).toContain('当前账号缺少归档柜查询权限');

    app.unmount();
    root.remove();
  });
});
