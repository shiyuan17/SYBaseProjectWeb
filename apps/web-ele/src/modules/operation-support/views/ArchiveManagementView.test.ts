import type { ArchiveRecordView } from '../types/operation-support';

import {
  createApp,
  defineComponent,
  h,
  inject,
  provide,
  reactive,
  ref,
} from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockUseArchiveManagementPage } = vi.hoisted(() => ({
  mockUseArchiveManagementPage: vi.fn(),
}));

function getVisibleModelValue(modelValue: unknown) {
  return typeof modelValue === 'object' && modelValue !== null
    ? (modelValue as { value?: boolean }).value
    : modelValue;
}

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
      return () =>
        h(
          'form',
          { ...attrs, 'data-testid': 'record-filter-form' },
          slots.default?.(),
        );
    },
  });

  const ElFormItem = defineComponent({
    props: ['label'],
    setup(props, { slots }) {
      return () => h('label', [props.label, slots.default?.()]);
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

  const ElInput = defineComponent({
    setup(_, { attrs }) {
      return () => h('input', attrs);
    },
  });

  const ElInputNumber = defineComponent({
    setup(_, { attrs }) {
      return () => h('input', { ...attrs, type: 'number' });
    },
  });

  const ElPagination = defineComponent({
    props: ['currentPage', 'pageSize', 'total'],
    emits: ['current-change', 'size-change'],
    setup(props) {
      return () =>
        h(
          'nav',
          `pagination-${props.currentPage}-${props.pageSize}-${props.total}`,
        );
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

  const ElTreeSelect = defineComponent({
    setup(_, { attrs }) {
      return () => h('select', attrs);
    },
  });

  const ElTable = defineComponent({
    props: ['data'],
    emits: ['selection-change'],
    setup(props, { attrs, emit, slots }) {
      provide('elTableRows', () => props.data ?? []);
      return () =>
        h(
          'div',
          {
            ...attrs,
            class: ['mock-el-table', attrs.class],
            onSelectionChange: (event: CustomEvent<unknown[]> | unknown[]) =>
              emit(
                'selection-change',
                Array.isArray(event) ? event : (event.detail ?? []),
              ),
          },
          slots.default?.(),
        );
    },
  });

  const ElTableColumn = defineComponent({
    props: ['label', 'prop', 'type'],
    setup(props, { slots }) {
      const getRows = inject<() => unknown[]>('elTableRows', () => []);
      return () =>
        props.type === 'selection'
          ? h('span', { 'data-column-type': 'selection' }, '选择')
          : h('span', [
              props.label,
              ...getRows().map((row) => {
                if (slots.default) {
                  return slots.default({ row });
                }
                if (!props.prop || typeof row !== 'object' || row === null) {
                  return '';
                }
                const value = (row as Record<string, unknown>)[props.prop];
                return value === null || value === undefined
                  ? ''
                  : String(value);
              }),
            ]);
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
    ElDialog,
    ElForm,
    ElFormItem,
    ElInput,
    ElInputNumber,
    ElOption,
    ElPagination,
    ElSelect,
    ElTabPane,
    ElTable,
    ElTableColumn,
    ElTabs,
    ElTag,
    ElTreeSelect,
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

vi.mock('../components/ArchiveSubmissionDialog.vue', () => ({
  default: createMarkerComponent('archive-submission-dialog'),
}));

vi.mock('../components/ApplicationFormArchiveDialog.vue', () => ({
  default: defineComponent({
    props: [
      'modelValue',
      'archiveCabinetId',
      'cabinets',
      'selectedRecords',
      'submitting',
      'archivePermissionWarning',
    ],
    emits: ['update:modelValue', 'update:archiveCabinetId', 'submitArchive'],
    setup(props, { emit }) {
      return () =>
        getVisibleModelValue(props.modelValue)
          ? h('section', { 'data-testid': 'application-form-archive-dialog' }, [
              'application-form-archive-dialog',
              h('div', `selected-cabinet-${props.archiveCabinetId ?? ''}`),
              h('div', `application-cabinets-${props.cabinets?.length ?? 0}`),
              h(
                'pre',
                { 'data-testid': 'application-form-selected-records' },
                JSON.stringify(props.selectedRecords ?? []),
              ),
              h(
                'button',
                {
                  type: 'button',
                  onClick: () => emit('submitArchive'),
                },
                '保存申请单归档',
              ),
            ])
          : null;
    },
  }),
}));

vi.mock('../components/ArchiveLoanBorrowDialog.vue', () => ({
  default: defineComponent({
    props: ['modelValue', 'materialSummary', 'selectedCount'],
    emits: ['submit'],
    setup(props, { emit }) {
      return () =>
        getVisibleModelValue(props.modelValue)
          ? h('section', { 'data-testid': 'archive-loan-borrow-dialog' }, [
              'archive-loan-borrow-dialog',
              h('div', `borrow-summary-${props.materialSummary}`),
              h('div', `borrow-selected-${props.selectedCount}`),
              h(
                'button',
                {
                  type: 'button',
                  onClick: () => emit('submit'),
                },
                '保存借记',
              ),
            ])
          : null;
    },
  }),
}));

vi.mock('../components/PhysicalArchiveDialog.vue', () => ({
  default: defineComponent({
    props: ['modelValue', 'objectType', 'selectedRecords'],
    emits: ['submitArchive'],
    setup(props, { emit }) {
      return () =>
        getVisibleModelValue(props.modelValue)
          ? h('section', { 'data-testid': 'physical-archive-dialog' }, [
              'physical-archive-dialog',
              h('div', `physical-object-type-${props.objectType}`),
              h(
                'div',
                `physical-selected-${props.selectedRecords?.length ?? 0}`,
              ),
              h(
                'button',
                {
                  type: 'button',
                  onClick: () => emit('submitArchive'),
                },
                '保存物理归档',
              ),
            ])
          : null;
    },
  }),
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
  const setActiveArchiveObjectType = vi.fn();
  const queryArchiveObjects = vi.fn();
  const setArchiveObjectPage = vi.fn();
  const setArchiveObjectSize = vi.fn();

  return {
    archiveWorkspace: {
      archiveForm: reactive({
        archiveCabinetId: '',
        archiveExpiresAt: '',
        archiveReminderDays: null,
        caseId: '',
        embeddingBoxId: '',
        fileName: '',
        fileUrl: '',
        objectType: 'APPLICATION_FORM',
        operatorName: '归档员甲',
        operatorUserId: 'USER-1',
        remarks: '',
        slideId: '',
        specimenId: '',
        terminalCode: '',
      }),
      archivePermissionWarning: '',
      archiveSubmitButtonText: '提交申请单归档',
      canSubmitArchive: true,
      applicationFormDialogVisible: ref(false),
      physicalArchiveDialogVisible: ref(false),
      openArchiveDialog: vi.fn(),
      openApplicationFormArchiveDialog: vi.fn(),
      archiveDialogVisible: ref(false),
      submitArchive: vi.fn(),
    },
    cabinetWorkspace: {
      batchCabinetDialogVisible: ref(false),
      batchCabinetForm: reactive({
        cabinetCodePrefix: '',
        cabinetNamePrefix: '',
        cabinetType: 'APPLICATION_FORM',
        count: 1,
        layerCount: 1,
        locationDescription: '',
        numberWidth: 3,
        operatorName: '归档员甲',
        operatorUserId: 'USER-1',
        parentId: '',
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
        capacity: 4,
        cabinetCode: '',
        cabinetName: '',
        cabinetStatus: 'ACTIVE',
        cabinetType: 'APPLICATION_FORM',
        layerCount: 2,
        locationDescription: '',
        nodeCode: '',
        nodeType: 'CABINET',
        operatorName: '归档员甲',
        operatorUserId: 'USER-1',
        parentId: '',
        pathLocation: '',
        remainingCapacity: 4,
        remarks: '',
        slotCountPerLayer: 2,
        terminalCode: '',
      }),
      cabinetPositionRulePreview: 'CAB-01-L1-S1',
      cabinetNodes: [
        {
          cabinetId: null,
          cabinetType: 'APPLICATION_FORM',
          capacity: 0,
          id: 'NODE-AREA-1',
          nodeCode: '申请单',
          nodeType: 'AREA',
          parentId: null,
          pathLocation: '库房A',
          remainingCapacity: 4,
          remarks: '',
        },
        {
          cabinetId: 'CABINET-1',
          cabinetType: 'STANDARD',
          capacity: 4,
          id: 'NODE-CABINET-1',
          nodeCode: 'CAB-01',
          nodeType: 'CABINET',
          parentId: 'NODE-AREA-1',
          pathLocation: 'B1',
          remainingCapacity: 2,
          remarks: '可用',
        },
        {
          cabinetId: 'CABINET-1',
          cabinetType: 'STANDARD',
          capacity: 2,
          id: 'NODE-DRAWER-1',
          layerNo: 1,
          nodeCode: '1-2',
          nodeType: 'DRAWER',
          parentId: 'NODE-CABINET-1',
          pathLocation: 'B1',
          remainingCapacity: 1,
          remarks: '',
        },
      ],
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
      loadCabinetNodes: vi.fn(),
      loadPositions: vi.fn(),
      loading: reactive({
        cabinets: false,
        cabinetNodes: false,
        positions: false,
      }),
      openCreateCabinetDialog,
      openBatchCreateCabinetDialog,
      openEditCabinetDialog: vi.fn(),
      openEditCabinetNodeDialog: vi.fn(),
      positionError: '',
      positionFilters: reactive({
        cabinetId: '',
        cabinetType: '',
      }),
      positionRows: [] as never[],
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
      canArchiveApplicationForm: true,
      canArchiveEmbeddingBox: true,
      canArchiveSlide: true,
      canArchiveSpecimen: true,
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
    loanWorkspace: {
      borrowDialogVisible: ref(false),
      borrowDialogMode: 'GENERIC',
      loanForm: reactive({
        borrowerPhone: '',
        borrowerUnit: '',
        borrowPurpose: '',
        borrowedByName: '',
        borrowedByUserId: '',
        depositAmount: '',
        materialId: '',
        materialType: 'EMBEDDING_BOX',
        operatorName: '归档员甲',
        operatorUserId: 'USER-1',
        remarks: '',
        terminalCode: '',
      }),
      openBorrowDialogForRecords: vi.fn(),
      openBorrowDialogForRecordsWithMode: vi.fn(),
      selectedMaterialRecords: [] as ArchiveRecordView[],
      selectedMaterialSummary: '',
      submitLoan: vi.fn(),
    },
    recordWorkspace: {
      activeObjectType: ref('APPLICATION_FORM'),
      objectLists: reactive({
        APPLICATION_FORM: {
          error: '',
          filters: {
            keyword: '',
            page: 1,
            size: 20,
          },
          items: [
            {
              applicationNo: 'APP-001',
              applicantDoctorName: '申请医生甲',
              applicationDate: '2026-06-15',
              archiveLocation: 'CAB-01-L1-S1',
              archiveStatus: 'IN_STORAGE',
              archivedAt: '2026-06-11 10:00:00',
              caseId: 'CASE-APP-1',
              objectCode: 'APP-001',
              objectId: 'CASE-APP-1',
              objectType: 'APPLICATION_FORM',
              pathologyNo: 'BL-2026-001',
              patientId: 'PAT-APP-1',
              patientName: '张三',
              storedByName: '归档员甲',
            },
          ],
          loading: false,
          total: 1,
        },
        EMBEDDING_BOX: {
          error: '',
          filters: {
            keyword: '',
            page: 1,
            size: 20,
          },
          items: [
            {
              archiveStatus: 'NOT_ARCHIVED',
              caseId: 'CASE-BOX-1',
              loanStatus: 'NONE',
              objectCode: 'A1',
              objectId: 'BOX-1',
              objectStatus: 'ACTIVE',
              objectType: 'EMBEDDING_BOX',
              pathologyNo: 'BL-2026-002',
              patientId: 'PAT-BOX-1',
              patientName: '李四',
            },
          ],
          loading: false,
          total: 1,
        },
        SLIDE: {
          error: '',
          filters: {
            keyword: '',
            page: 1,
            size: 20,
          },
          items: [
            {
              archiveStatus: 'IN_STORAGE',
              borrowedByName: '医生乙',
              caseId: 'CASE-SLIDE-1',
              loanStatus: 'BORROWED',
              objectCode: 'S1',
              objectId: 'SLIDE-1',
              objectType: 'SLIDE',
              pathologyNo: 'BL-2026-003',
              patientId: 'PAT-SLIDE-1',
              patientName: '王五',
            },
          ],
          loading: false,
          total: 1,
        },
        SPECIMEN: {
          error: '',
          filters: {
            keyword: '',
            page: 1,
            size: 20,
          },
          items: [
            {
              archiveStatus: 'IN_STORAGE',
              caseId: 'CASE-SPECIMEN-1',
              objectCode: 'SP-001',
              objectId: 'SPECIMEN-1',
              objectType: 'SPECIMEN',
              pathologyNo: 'BL-2026-004',
              patientId: 'PAT-SPECIMEN-1',
              patientName: '赵六',
            },
          ],
          loading: false,
          total: 1,
        },
      }),
      selectedRecordsByType: reactive({
        APPLICATION_FORM: [] as ArchiveRecordView[],
        EMBEDDING_BOX: [] as ArchiveRecordView[],
        SLIDE: [] as ArchiveRecordView[],
        SPECIMEN: [] as ArchiveRecordView[],
      }),
      selectedApplicationFormRecords: [
        {
          applicationNo: 'APP-001',
          applicantDoctorName: '申请医生甲',
          applicationDate: '2026-06-15',
          archiveLocation: 'CAB-01-L1-S1',
          archiveStatus: 'IN_STORAGE',
          archivedAt: '2026-06-11 10:00:00',
          caseId: 'CASE-APP-1',
          objectCode: 'APP-001',
          objectId: 'CASE-APP-1',
          objectType: 'APPLICATION_FORM',
          pathologyNo: 'BL-2026-001',
          patientId: 'PAT-APP-1',
          patientName: '张三',
          storedByName: '归档员甲',
        },
      ],
      selectedEmbeddingBoxRecords: [] as ArchiveRecordView[],
      selectedSlideRecords: [] as ArchiveRecordView[],
      selectedSpecimenRecords: [] as ArchiveRecordView[],
      queryArchiveObjects,
      setSelectedApplicationFormRecords: vi.fn(),
      setSelectedArchiveObjectRecords: vi.fn(),
      setActiveArchiveObjectType,
      setArchiveObjectPage,
      setArchiveObjectSize,
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

    state.archiveWorkspace.applicationFormDialogVisible.value = false;

    const { app, root } = mountView();

    expect(document.body.textContent).toContain('申请单归档');
    expect(document.body.textContent).toContain('蜡块归档');
    expect(document.body.textContent).toContain('玻片归档');
    expect(document.body.textContent).toContain('标本归档');
    expect(document.body.textContent).not.toContain('申请单归档列表');
    expect(document.body.textContent).not.toContain('蜡块归档列表');
    expect(document.body.textContent).not.toContain('玻片归档列表');
    expect(document.body.textContent).not.toContain('标本归档列表');
    expect(document.body.textContent).not.toContain(
      '按对象分页接口展示可查询对象',
    );
    expect(document.body.textContent).toContain('申请医生甲');
    expect(document.body.textContent).toContain('2026-06-15');
    expect(document.body.textContent).toContain('PAT-APP-1');
    expect(document.body.textContent).toContain('当前状态启用');
    expect(document.body.textContent).toContain('未归档');
    expect(document.body.textContent).toContain('未借阅');
    expect(document.body.textContent).not.toContain('当前状态ACTIVE');
    expect(document.body.textContent).toContain('pagination-1-20-1');
    expect(document.body.textContent).toContain('归档柜列表');
    expect(document.body.textContent).not.toContain(
      '按归档类型、柜体和号段展示柜位结构',
    );
    expect(document.body.textContent).not.toContain('柜位查询与选择');
    expect(document.body.textContent).toContain('快速检索');
    expect(document.body.textContent).toContain('不限类型');
    expect(document.body.textContent).toContain('标准柜');
    expect(document.body.textContent).toContain('申请单');
    expect(document.body.textContent).toContain('展开/折叠');
    expect(document.body.textContent).toContain('批量添加');
    expect(document.body.textContent).toContain('ROOT');
    expect(document.body.textContent).toContain('柜子类型');
    expect(document.body.textContent).toContain('路径');
    expect(document.body.textContent).toContain('层级');
    expect(document.body.textContent).toContain('总容量');
    expect(document.body.textContent).toContain('剩余容量');
    expect(document.body.textContent).not.toContain('借白片');
    expect(document.body.textContent).not.toContain('标本柜');
    expect(document.body.textContent).not.toContain('archive-submission-panel');
    expect(document.body.textContent).toContain('archive-submission-dialog');
    expect(document.body.textContent).not.toContain('保存申请单归档');
    expect(document.body.textContent).toContain('归档操作');
    expect(document.body.textContent).toContain('申请医生');
    expect(document.body.textContent).toContain('申请时间');
    expect(document.body.textContent).toContain('归档状态');
    expect(document.body.textContent).toContain('归档路径');
    expect(document.body.textContent).toContain('总容量');
    expect(document.body.textContent).toContain('剩余容量');
    expect(document.body.textContent).not.toContain(
      'archive-position-workbench-panel',
    );
    expect(document.body.textContent).toContain('archive-cabinet-dialog');
    expect(document.body.textContent).toContain('batch-archive-cabinet-dialog');
    expect(document.body.innerHTML).not.toContain('legacy-toolbar');
    expect(document.body.innerHTML).not.toContain('legacy-grid-table');
    expect(document.body.innerHTML).not.toContain('legacy-status-cell');
    expect(
      state.recordWorkspace.setActiveArchiveObjectType,
    ).toHaveBeenCalledWith(
      'APPLICATION_FORM',
      expect.objectContaining({ loadIfNeeded: true }),
    );

    const archiveButton = [...document.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === '归档操作',
    );
    expect(archiveButton).toBeTruthy();

    archiveButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(state.archiveWorkspace.openArchiveDialog).toHaveBeenCalledWith(
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

  it('disables application-form archive action without selected records and renders dedicated dialog data when visible', async () => {
    const state = createMockPageState();
    state.recordWorkspace.selectedApplicationFormRecords = [];
    state.archiveWorkspace.applicationFormDialogVisible.value = false;
    mockUseArchiveManagementPage.mockReturnValue(state);

    const { app, root } = mountView();

    const archiveButton = [...document.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === '归档操作',
    ) as HTMLButtonElement | undefined;

    expect(archiveButton).toBeTruthy();
    expect(archiveButton?.disabled).toBe(true);

    app.unmount();
    root.remove();
  });

  it('shows dedicated application-form archive dialog with externally selected records', async () => {
    const state = createMockPageState();
    state.recordWorkspace.selectedApplicationFormRecords = [
      {
        applicationNo: 'APP-001',
        applicantDoctorName: '申请医生甲',
        applicationDate: '2026-06-15',
        archiveLocation: 'CAB-01-L1-S1',
        archiveStatus: 'IN_STORAGE',
        archivedAt: '2026-06-11 10:00:00',
        caseId: 'CASE-APP-1',
        objectCode: 'APP-001',
        objectId: 'CASE-APP-1',
        objectType: 'APPLICATION_FORM',
        pathologyNo: 'BL-2026-001',
        patientId: 'PAT-APP-1',
        patientName: '张三',
        storedByName: '归档员甲',
      },
      {
        applicationNo: 'APP-002',
        applicantDoctorName: '申请医生乙',
        applicationDate: '2026-06-16',
        archiveLocation: '',
        archiveStatus: 'NOT_ARCHIVED',
        archivedAt: '',
        caseId: 'CASE-APP-2',
        objectCode: 'APP-002',
        objectId: 'CASE-APP-2',
        objectType: 'APPLICATION_FORM',
        pathologyNo: 'BL-2026-002',
        patientId: 'PAT-APP-2',
        patientName: '李四',
        storedByName: '',
      },
    ];
    state.archiveWorkspace.applicationFormDialogVisible.value = true;
    mockUseArchiveManagementPage.mockReturnValue(state);

    const { app, root } = mountView();

    expect(document.body.textContent).toContain(
      'application-form-archive-dialog',
    );
    expect(document.body.textContent).toContain('selected-cabinet-');
    expect(document.body.textContent).toContain('application-cabinets-1');
    expect(document.body.textContent).toContain('BL-2026-001');
    expect(document.body.textContent).toContain('BL-2026-002');
    expect(document.body.textContent).toContain('申请医生甲');
    expect(document.body.textContent).toContain('申请医生乙');
    expect(document.body.textContent).toContain('2026-06-15');
    expect(document.body.textContent).toContain('2026-06-16');

    const archiveButton = [...document.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === '归档操作',
    ) as HTMLButtonElement | undefined;
    expect(archiveButton?.disabled).toBe(false);

    const saveButton = [...document.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === '保存申请单归档',
    );
    saveButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(state.archiveWorkspace.submitArchive).toHaveBeenCalledTimes(1);

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

  it('wires physical archive selections and borrow actions while keeping specimen archive-only', () => {
    const state = createMockPageState();
    const embeddingBoxRecord =
      state.recordWorkspace.objectLists.EMBEDDING_BOX.items[0]!;
    const slideRecord = state.recordWorkspace.objectLists.SLIDE.items[0]!;
    const specimenRecord = state.recordWorkspace.objectLists.SPECIMEN.items[0]!;
    state.recordWorkspace.selectedEmbeddingBoxRecords = [embeddingBoxRecord];
    state.recordWorkspace.selectedSlideRecords = [slideRecord];
    state.recordWorkspace.selectedSpecimenRecords = [specimenRecord];
    mockUseArchiveManagementPage.mockReturnValue(state);

    const { app, root } = mountView();

    const borrowButtons = [...document.querySelectorAll('button')].filter(
      (button) => button.textContent?.trim() === '借记',
    );
    expect(borrowButtons).toHaveLength(2);

    const tables = [...document.querySelectorAll('.mock-el-table')];
    for (const table of tables.slice(1, 4)) {
      const selectionColumn = table.querySelector(
        '[data-column-type="selection"]',
      );
      const indexTextOffset = table.textContent?.indexOf('序') ?? -1;
      const selectionTextOffset = table.textContent?.indexOf('选择') ?? -1;

      expect(selectionColumn).not.toBeNull();
      expect(selectionTextOffset).toBeGreaterThanOrEqual(0);
      expect(indexTextOffset).toBeGreaterThan(selectionTextOffset);
    }

    tables[1]?.dispatchEvent(
      new CustomEvent('selection-change', {
        bubbles: true,
        detail: [embeddingBoxRecord],
      }),
    );
    tables[2]?.dispatchEvent(
      new CustomEvent('selection-change', {
        bubbles: true,
        detail: [slideRecord],
      }),
    );
    tables[3]?.dispatchEvent(
      new CustomEvent('selection-change', {
        bubbles: true,
        detail: [specimenRecord],
      }),
    );

    expect(
      state.recordWorkspace.setSelectedArchiveObjectRecords,
    ).toHaveBeenCalledWith('EMBEDDING_BOX', expect.any(Array));
    expect(
      state.recordWorkspace.setSelectedArchiveObjectRecords,
    ).toHaveBeenCalledWith('SLIDE', expect.any(Array));
    expect(
      state.recordWorkspace.setSelectedArchiveObjectRecords,
    ).toHaveBeenCalledWith('SPECIMEN', expect.any(Array));

    borrowButtons[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    borrowButtons[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(
      state.loanWorkspace.openBorrowDialogForRecordsWithMode,
    ).toHaveBeenNthCalledWith(
      1,
      'EMBEDDING_BOX',
      [embeddingBoxRecord],
      'GENERIC',
    );
    expect(
      state.loanWorkspace.openBorrowDialogForRecordsWithMode,
    ).toHaveBeenNthCalledWith(2, 'SLIDE', [slideRecord], 'GENERIC');

    app.unmount();
    root.remove();
  });

  it('renders archive-page borrow dialog and submits through loan workspace', () => {
    const state = createMockPageState();
    state.loanWorkspace.borrowDialogVisible.value = true;
    state.loanWorkspace.selectedMaterialRecords = [
      state.recordWorkspace.objectLists.EMBEDDING_BOX.items[0]!,
      state.recordWorkspace.objectLists.EMBEDDING_BOX.items[0]!,
    ];
    state.loanWorkspace.selectedMaterialSummary = '2 条：A1、A2';
    mockUseArchiveManagementPage.mockReturnValue(state);

    const { app, root } = mountView();

    expect(document.body.textContent).toContain('archive-loan-borrow-dialog');
    expect(document.body.textContent).toContain('borrow-summary-2 条：A1、A2');
    expect(document.body.textContent).toContain('borrow-selected-2');

    const saveButton = [...document.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === '保存借记',
    );
    saveButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(state.loanWorkspace.submitLoan).toHaveBeenCalledTimes(1);

    app.unmount();
    root.remove();
  });
});
