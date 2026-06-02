import {
  computed,
  createApp,
  defineComponent,
  h,
  nextTick,
  reactive,
  ref,
} from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createAlertStub,
  createButtonStub,
  createEmptyStub,
  createInputStub,
  createPassthroughStub,
  createTableColumnStub,
  createTableStub,
  createTabPaneStub,
  createTabsStub,
  createTagStub,
} from '#/modules/specimen-workflow/test-utils/component-stubs';

const tabsContextKey = vi.hoisted(() =>
  Symbol('grossing-workstation-tabs'),
);
const tableRowContextKey = vi.hoisted(() =>
  Symbol('grossing-workstation-table-row'),
);

const {
  mockInitializeWorkbench,
  mockListPendingTechnicalTasks,
  mockLoadWorkbenchContext,
  mockMessageSuccess,
  mockMessageWarning,
  mockNavigation,
  mockResetWorkbenchState,
  mockStartGrossing,
  mockSubmitGrossing,
} = vi.hoisted(() => {
  const mockInitializeWorkbench = vi.fn();
  const mockListPendingTechnicalTasks = vi.fn();
  const mockLoadWorkbenchContext = vi.fn();
  const mockMessageSuccess = vi.fn();
  const mockMessageWarning = vi.fn();
  const mockNavigation = {
    goToTracking: vi.fn(),
  };
  const mockResetWorkbenchState = vi.fn();
  const mockStartGrossing = vi.fn();
  const mockSubmitGrossing = vi.fn();
  return {
    mockInitializeWorkbench,
    mockListPendingTechnicalTasks,
    mockLoadWorkbenchContext,
    mockMessageSuccess,
    mockMessageWarning,
    mockNavigation,
    mockResetWorkbenchState,
    mockStartGrossing,
    mockSubmitGrossing,
  };
});

const descriptionTab = ref<
  'clinicalHistory' | 'grossDescription' | 'relatedExaminations'
>('grossDescription');
const activeSpecimenKey = ref('specimen-1');
const completeForm = reactive({
  caseId: 'CASE-001',
  specimens: [
    {
      blocks: [
        {
          blockDescription: 'A1',
          blockSite: '左叶',
          specialRequirement: '',
        },
      ],
      blockCount: 1,
      bodyPartId: '',
      cutSurfaceFeature: '',
      embeddingBoxes: [
        {
          boxName: '包埋盒 1',
          embeddingBoxNo: 'A1',
          embeddingRemarks: '皮肤组织',
          sequenceNo: 1,
          status: 'PENDING',
        },
      ],
      grossDescription: '甲状腺左叶灰白结节，质中。',
      marginMarking: '',
      mediaAssets: [
        {
          fileName: 'current-1.jpg',
          fileUrl: 'https://example.com/current-1.jpg',
        },
      ],
      samplingTemplateId: '',
      sizeText: '1.5x1.0x0.8cm',
      specimenId: 'SPEC-001',
      specimenType: 'ROUTINE',
    },
  ],
  taskId: 'TASK-001',
});
const specimenTabMetas = ref([
  {
    key: 'specimen-1',
    trackingLabel: 'SP-001',
  },
]);
const currentTask = ref(null);
const workbenchContext = ref({
  caseSummary: {
    applicationId: 'APP-001',
    applicationNo: 'APP-001',
    applicationType: 'ROUTINE',
    caseId: 'CASE-001',
    caseStatus: 'SAMPLING',
    inpatientNo: 'ZY-001',
    pathologyNo: 'BL-001',
    patientId: 'P-001',
    patientName: '患者甲',
    submittingDepartmentName: '手术室',
  },
  checkItems: [
    {
      name: '术中病理',
      sequenceNo: 1,
    },
    {
      name: '免疫组化复核',
      sequenceNo: 2,
    },
  ],
  clinicalDiagnosis: 'Papillary thyroid carcinoma',
  clinicalHistory: '甲状腺结节病史，近一个月增大。',
  contextSummary: '术中见甲状腺左叶结节样病灶。\n\n立即送检。',
  mediaAssets: [
    {
      assetId: 'MED-001',
      capturedAt: '2026-06-01T08:30:00',
      capturedByName: '技师甲',
      fileName: 'history-1.jpg',
      fileUrl: 'https://example.com/history-1.jpg',
      specimenId: 'SPEC-001',
    },
  ],
  relatedExaminations: '影像检查: 超声提示甲状腺左叶低回声结节',
  task: {
    objectId: 'CASE-001',
    objectType: 'CASE',
    taskId: 'TASK-001',
    taskStatus: 'PENDING',
  },
  tracking: {
    blocks: [
      {
        blockCode: 'A1',
        blockId: 'BLOCK-001',
        description: 'A1',
        embeddingBoxNo: null,
        specimenId: 'SPEC-001',
      },
    ],
    caseId: 'CASE-001',
    caseStatus: 'SAMPLING',
    embeddingBoxes: [],
    events: [],
    pathologyNo: 'BL-001',
    qcEvaluations: [],
    reworks: [],
    slides: [],
    specimens: [
      {
        barcode: 'BC-001',
        specimenId: 'SPEC-001',
        specimenName: '甲状腺左叶',
        specimenNo: 'SP-001',
        specimenStatus: 'REGISTERED',
      },
    ],
    technicalTasks: [],
  },
});
const trackingResult = computed(() => workbenchContext.value.tracking);
const enteredMediaAssets = computed(() =>
  completeForm.specimens.flatMap((specimen, specimenIndex) =>
    (specimen.mediaAssets ?? []).map((asset, assetIndex) => ({
      ...asset,
      assetIndex,
      specimenId: specimen.specimenId,
      specimenIndex,
    })),
  ),
);

mockInitializeWorkbench.mockImplementation(async (task) => {
  currentTask.value = task;
  completeForm.caseId = task?.caseId ?? '';
  completeForm.taskId = task?.id ?? '';

  const payload =
    typeof task?.payload === 'string' ? JSON.parse(task.payload) : {};
  workbenchContext.value = {
    ...workbenchContext.value,
    caseSummary: {
      ...workbenchContext.value.caseSummary,
      caseId: task?.caseId ?? '',
      inpatientNo: payload.inpatientNo ?? 'ZY-001',
      pathologyNo: task?.pathologyNo ?? '',
      patientId: payload.patientId ?? 'P-001',
      patientName: payload.patientName ?? '患者甲',
      submittingDepartmentName:
        payload.submittingDepartmentName ?? '手术室',
    },
    task: {
      ...workbenchContext.value.task,
      objectId: task?.objectId ?? '',
      taskId: task?.id ?? '',
      taskStatus: task?.taskStatus ?? null,
    },
    tracking: {
      ...workbenchContext.value.tracking,
      caseId: task?.caseId ?? '',
      pathologyNo: task?.pathologyNo ?? '',
    },
  };
});

const workbenchState = {
  activeSpecimen: computed(() => completeForm.specimens[0]),
  activeSpecimenKey,
  addBlock: vi.fn(),
  addEmbeddingBoxes: vi.fn(),
  addMediaAsset: vi.fn(),
  addSpecimen: vi.fn(),
  beforeGrossingImageUpload: vi.fn(),
  bodyPartTreeOptions: ref([]),
  completeForm,
  contextLoading: ref(false),
  createGrossingImageUploadRequest: vi.fn(),
  currentTask,
  currentTaskContext: computed(() => ({
    caseId: completeForm.caseId,
    objectId: workbenchContext.value.task.objectId,
    objectType: workbenchContext.value.task.objectType,
    pathologyNo: workbenchContext.value.caseSummary.pathologyNo,
    taskId: completeForm.taskId,
  })),
  descriptionTab,
  ensureSelectOptionsLoaded: vi.fn(),
  enteredMediaAssets,
  getSpecimenTabLabel: vi.fn(() => 'SP-001'),
  grossingImageAccept: 'image/jpeg',
  initializeWorkbench: mockInitializeWorkbench,
  isSpecimenUploading: vi.fn(() => false),
  labelClass: 'text-sm',
  loadWorkbenchContext: mockLoadWorkbenchContext,
  operatorForm: reactive({
    operatorName: '当前取材员',
    operatorUserId: 'USER-001',
    remarks: '开始备注',
    terminalCode: 'TG-01',
  }),
  pageError: ref(''),
  removeBlock: vi.fn(),
  removeEmbeddingBox: vi.fn(),
  removeMediaAsset: vi.fn(),
  removeSpecimen: vi.fn(),
  resetWorkbenchState: mockResetWorkbenchState,
  samplingTemplateTreeOptions: ref([]),
  selectLoading: ref(false),
  specimenTabMetas,
  submitGrossing: mockSubmitGrossing,
  submitting: ref(false),
  trackingResult,
  workflowReferenceOptions: ref({
    clinicalSymptoms: [],
    collectionModes: [],
    containerNames: [],
    cutSurfaceFeatures: [],
    embeddingRemarks: [{ label: '皮肤组织', value: '皮肤组织' }],
    fixationLiquidTypes: [],
    marginMarkings: [],
    specimenImageSizes: [],
    specimenTypes: [],
  }),
  workbenchContext,
};

vi.mock('vue-router', () => ({
  useRoute: () => ({
    query: {},
  }),
  useRouter: () => ({}),
}));

vi.mock('@vben/common-ui', () => ({
  Page: defineComponent({
    setup(_, { slots }) {
      return () => h('div', slots.default?.());
    },
  }),
}));

vi.mock('../api/technical-workflow-service', () => ({
  listPendingTechnicalTasks: mockListPendingTechnicalTasks,
  startGrossing: mockStartGrossing,
}));

vi.mock('../composables/useGrossingWorkbench', () => ({
  useGrossingWorkbench: () => workbenchState,
}));

vi.mock('../utils/navigation', () => ({
  useTechnicalWorkflowNavigation: () => mockNavigation,
}));

vi.mock('../components/TechnicalOperatorFields.vue', () => ({
  default: defineComponent({
    setup() {
      return () => h('div', 'technical-operator-fields');
    },
  }),
}));

vi.mock('../components/GrossingSpecimenTabs.vue', () => ({
  default: defineComponent({
    props: ['activeSpecimenKey'],
    setup(props) {
      return () =>
        h(
          'div',
          { 'data-component': 'grossing-specimen-tabs' },
          `grossing-specimen-tabs:${props.activeSpecimenKey}`,
        );
    },
  }),
}));

vi.mock('../components/GrossingEmbeddingBoxTable.vue', () => ({
  default: defineComponent({
    emits: ['addEmbeddingBoxes', 'removeEmbeddingBox'],
    props: ['specimen'],
    setup(props, { emit }) {
      return () =>
        h('section', { 'data-component': 'grossing-embedding-box-table' }, [
          `grossing-embedding-box-table:${props.specimen?.embeddingBoxes?.[0]?.embeddingBoxNo ?? '-'}`,
          h(
            'button',
            {
              type: 'button',
              onClick: () => emit('addEmbeddingBoxes', 1),
            },
            '添加包埋盒1',
          ),
          h(
            'button',
            {
              type: 'button',
              onClick: () => emit('removeEmbeddingBox', 0),
            },
            '删除包埋盒',
          ),
        ]);
    },
  }),
}));

vi.mock('element-plus', () => {
  const ElBadge = defineComponent({
    props: ['value'],
    setup(props, { slots }) {
      return () =>
        h('span', [
          slots.default?.(),
          props.value === undefined ? null : h('sup', String(props.value)),
        ]);
    },
  });

  const ElCheckbox = defineComponent({
    emits: ['change', 'update:modelValue'],
    inheritAttrs: false,
    props: ['disabled', 'modelValue'],
    setup(props, { attrs, emit }) {
      return () =>
        h('input', {
          ...attrs,
          checked: Boolean(props.modelValue),
          disabled: Boolean(props.disabled),
          type: 'checkbox',
          onClick: (event: MouseEvent) => event.stopPropagation(),
          onChange: (event: Event) => {
            const checked = (event.target as HTMLInputElement).checked;
            emit('update:modelValue', checked);
            emit('change', checked);
          },
        });
    },
  });

  const ElDrawer = defineComponent({
    props: ['modelValue', 'title'],
    setup(props, { slots }) {
      return () =>
        props.modelValue
          ? h('section', { 'data-testid': 'drawer' }, [
              h('h2', String(props.title ?? '')),
              slots.default?.(),
            ])
          : null;
    },
  });

  const ElLink = defineComponent({
    props: ['href'],
    setup(props, { slots }) {
      return () => h('a', { href: props.href }, slots.default?.());
    },
  });

  return {
    ElAlert: createAlertStub(),
    ElBadge,
    ElButton: createButtonStub(),
    ElCheckbox,
    ElDrawer,
    ElEmpty: createEmptyStub(),
    ElForm: createPassthroughStub('form'),
    ElInput: createInputStub(),
    ElLink,
    ElMessage: {
      success: mockMessageSuccess,
      warning: mockMessageWarning,
    },
    ElPagination: createPassthroughStub(),
    ElTabPane: createTabPaneStub(tabsContextKey),
    ElTabs: createTabsStub(tabsContextKey),
    ElTable: createTableStub(tableRowContextKey),
    ElTableColumn: createTableColumnStub(tableRowContextKey),
    ElTag: createTagStub(),
    ElTooltip: createPassthroughStub(),
  };
});

import GrossingWorkstationView from './GrossingWorkstationView.vue';

function createTask(
  id: string,
  pathologyNo: string,
  status = 'PENDING',
) {
  const isPrimaryTask = id === 'TASK-001';
  return {
    applicationId: isPrimaryTask ? 'APP-001' : 'APP-002',
    applicationNo: isPrimaryTask ? 'APP-001' : 'APP-002',
    assignedToName: isPrimaryTask ? '接收人甲' : '接收人乙',
    assignedToUserId: null,
    caseId: isPrimaryTask ? 'CASE-001' : 'CASE-002',
    completedAt: null,
    createdAt: '2026-06-01T08:00:00',
    currentNode: 'GROSSING',
    deadlineAt: null,
    expectedCompletedAt: null,
    id,
    objectId: isPrimaryTask ? 'CASE-001' : 'CASE-002',
    objectType: 'CASE',
    pathologyNo,
    payload: JSON.stringify({
      blockCount: isPrimaryTask ? 1 : 2,
      inpatientNo: isPrimaryTask ? 'ZY-001' : 'ZY-002',
      patientId: isPrimaryTask ? 'P-001' : 'P-002',
      patientName: isPrimaryTask ? '患者甲' : '患者乙',
      printedBlockCount: 0,
      submittingDepartmentName: isPrimaryTask ? '手术室' : '消化内科',
    }),
    priority: null,
    productionRemarks: null,
    receivedAt: null,
    remarks: null,
    sampledAt: null,
    sampledByName: null,
    samplingBlockCode: null,
    samplingBlockDescription: null,
    specimenId: null,
    startedAt: null,
    stationCode: null,
    stationName: '取材台',
    taskStatus: status,
    taskType: 'GROSSING',
    timedOut: false,
    timeoutRuleCode: null,
  };
}

async function flushAll() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

async function mountView() {
  descriptionTab.value = 'grossDescription';
  activeSpecimenKey.value = 'specimen-1';
  completeForm.caseId = 'CASE-001';
  completeForm.taskId = 'TASK-001';
  currentTask.value = null;
  mockSubmitGrossing.mockResolvedValue(undefined);
  mockStartGrossing.mockResolvedValue({
    caseId: 'CASE-001',
    caseStatus: 'SAMPLING',
    taskId: 'TASK-001',
    taskStatus: 'IN_PROGRESS',
  });
  mockListPendingTechnicalTasks.mockResolvedValue({
    items: [createTask('TASK-001', 'BL-001'), createTask('TASK-002', 'BL-002')],
    page: 1,
    size: 20,
    total: 2,
  });

  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp(GrossingWorkstationView);
  app.directive('loading', {});
  app.mount(root);
  await flushAll();
  return { app, root };
}

function findButton(root: HTMLElement, text: string) {
  const button = [...root.querySelectorAll<HTMLButtonElement>('button')].find(
    (item) => item.textContent?.includes(text),
  );
  if (!button) {
    throw new Error(`Missing button: ${text}`);
  }
  return button;
}

function selectTaskCheckbox(root: HTMLElement, checkNo: string) {
  const checkbox = root.querySelector<HTMLInputElement>(
    `input[aria-label="选择任务 ${checkNo}"]`,
  );
  if (!checkbox) {
    throw new Error(`Missing task checkbox: ${checkNo}`);
  }
  checkbox.click();
}

function setInputValue(input: HTMLInputElement, value: string) {
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

describe('GrossingWorkstationView', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    mockInitializeWorkbench.mockClear();
    mockListPendingTechnicalTasks.mockReset();
    mockLoadWorkbenchContext.mockClear();
    mockMessageSuccess.mockClear();
    mockMessageWarning.mockClear();
    mockNavigation.goToTracking.mockClear();
    mockResetWorkbenchState.mockClear();
    mockStartGrossing.mockReset();
    mockSubmitGrossing.mockReset();
    workbenchState.addEmbeddingBoxes.mockClear();
    workbenchState.removeEmbeddingBox.mockClear();
  });

  it('loads the legacy table and switches the selected task', async () => {
    const { app, root } = await mountView();

    expect(mockListPendingTechnicalTasks).toHaveBeenCalledTimes(1);
    expect(mockInitializeWorkbench).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'TASK-001',
      }),
    );
    expect(root.textContent).toContain('BL-001');
    expect(root.textContent).toContain('患者乙');
    expect(root.textContent).not.toContain('(国家)冰冻提醒');
    expect(root.textContent).not.toContain('Pacs流水号');
    expect(root.textContent).not.toContain('SP-001 / ROUTINE / 1.5x1.0x0.8cm');

    selectTaskCheckbox(root, 'BL-002');
    await flushAll();

    expect(mockInitializeWorkbench).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: 'TASK-002',
      }),
    );

    app.unmount();
  });

  it('queries and starts grossing from the compact toolbar', async () => {
    const { app, root } = await mountView();
    mockListPendingTechnicalTasks.mockClear();

    const input = root.querySelector<HTMLInputElement>(
      'input[placeholder="病人ID / 病理号 / 姓名"]',
    );
    expect(input).toBeTruthy();
    setInputValue(input!, 'BL-002');
    findButton(root, '查询').click();
    await flushAll();

    expect(mockListPendingTechnicalTasks).toHaveBeenLastCalledWith(
      expect.objectContaining({
        keyword: 'BL-002',
        page: 1,
        taskType: 'GROSSING',
      }),
    );

    findButton(root, '取材').click();
    await flushAll();

    expect(mockStartGrossing).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: 'TASK-001',
        terminalCode: 'TG-01',
      }),
    );

    app.unmount();
  });

  it('navigates previous and next tasks using the right panel controls', async () => {
    const { app, root } = await mountView();

    findButton(root, '下一例').click();
    await flushAll();

    expect(mockInitializeWorkbench).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: 'TASK-002',
      }),
    );

    findButton(root, '上一例').click();
    await flushAll();

    expect(mockInitializeWorkbench).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: 'TASK-001',
      }),
    );

    app.unmount();
  });

  it('switches context tabs and keeps current plus historical images visible', async () => {
    const { app, root } = await mountView();

    expect(root.textContent).toContain('history-1.jpg');
    expect(root.textContent).toContain('current-1.jpg');

    findButton(root, '临床病史').click();
    await flushAll();
    expect(root.textContent).toContain('甲状腺结节病史，近一个月增大。');

    findButton(root, '相关检查').click();
    await flushAll();
    expect(root.textContent).toContain('影像检查: 超声提示甲状腺左叶低回声结节');
    expect(root.textContent).toContain('术中病理');
    expect(root.textContent).toContain('免疫组化复核');

    app.unmount();
  });

  it('opens the more drawer and submits through the preserved specimen editor', async () => {
    const { app, root } = await mountView();

    findButton(root, '更多').click();
    await flushAll();

    expect(root.textContent).toContain('标本 / 蜡块 / 影像编辑');
    expect(root.textContent).toContain('technical-operator-fields');
    expect(root.textContent).toContain('grossing-specimen-tabs:specimen-1');

    findButton(root, '完成取材').click();
    await flushAll();

    expect(mockSubmitGrossing).toHaveBeenCalledTimes(1);

    app.unmount();
  });

  it('renders embedding boxes and submits from the right panel', async () => {
    const { app, root } = await mountView();

    expect(root.textContent).toContain('grossing-embedding-box-table:A1');

    findButton(root, '添加包埋盒1').click();
    await flushAll();
    expect(workbenchState.addEmbeddingBoxes).toHaveBeenCalledWith(1);

    findButton(root, '删除包埋盒').click();
    await flushAll();
    expect(workbenchState.removeEmbeddingBox).toHaveBeenCalledWith(0);

    findButton(root, '取材完成').click();
    await flushAll();
    expect(mockSubmitGrossing).toHaveBeenCalledTimes(1);

    app.unmount();
  });

  it('renders unsupported legacy toolbar actions as disabled placeholders', async () => {
    const { app, root } = await mountView();

    expect(findButton(root, '导出Excel').disabled).toBe(true);
    expect(findButton(root, '前1天').disabled).toBe(true);

    app.unmount();
  });
});
