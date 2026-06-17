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

const tabsContextKey = vi.hoisted(() => Symbol('grossing-workstation-tabs'));
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
  mockRoute,
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
  const mockRoute = {
    query: {} as Record<string, string>,
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
    mockRoute,
    mockResetWorkbenchState,
    mockStartGrossing,
    mockSubmitGrossing,
  };
});

const descriptionTab = ref<
  'clinicalHistory' | 'grossDescription' | 'relatedExaminations'
>('grossDescription');
const activeSpecimenKey = ref('specimen-1');
const selectedEmbeddingBoxSpecimenKey = ref('specimen-1');
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
    specimenName: '骨髓',
    trackingLabel: 'SP-001',
  },
  {
    key: 'specimen-2',
    specimenName: '皮肤组织',
    trackingLabel: 'SP-002',
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
  clinicalSubmissionRequirements: '术中立即送检，优先取材。',
  contextSummary: '术中见甲状腺左叶结节样病灶。\n\n立即送检。',
  externalPathologyDiagnosis: '外院提示甲状腺乳头状癌。',
  infectiousAndPastHistorySummary: '乙肝病史，甲状腺结节手术史。',
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
      patientId: task?.patientId ?? payload.patientId ?? 'P-001',
      patientName: task?.patientName ?? payload.patientName ?? '患者甲',
      submittingDepartmentName: payload.submittingDepartmentName ?? '手术室',
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
  activeSpecimenName: computed(() => '骨髓'),
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
  embeddingBoxRows: computed(() =>
    completeForm.specimens.flatMap((specimen, specimenIndex) =>
      (specimen.embeddingBoxes ?? []).map((box, boxIndex) => ({
        box,
        boxIndex,
        specimenIndex,
        specimenName: specimenTabMetas.value[specimenIndex]?.specimenName ?? '',
      })),
    ),
  ),
  ensureSelectOptionsLoaded: vi.fn(),
  enteredMediaAssets,
  getSpecimenDisplayName: vi.fn(
    (index: number) =>
      specimenTabMetas.value[index]?.specimenName || `标本 ${index + 1}`,
  ),
  getSpecimenPrefix: vi.fn((index: number) => (index === 0 ? 'A' : 'B')),
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
  selectedEmbeddingBoxSpecimenKey,
  selectedEmbeddingBoxSpecimenPrefix: computed(() =>
    selectedEmbeddingBoxSpecimenKey.value === 'specimen-2' ? 'B' : 'A',
  ),
  specimenNameOptions: computed(() =>
    specimenTabMetas.value.map((item) => ({
      label: item.specimenName,
      value: item.key,
    })),
  ),
  specimenTabMetas,
  submitGrossing: mockSubmitGrossing,
  submitting: ref(false),
  trackingResult,
  uploadGrossingImageFile: vi.fn().mockResolvedValue(true),
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
  useRoute: () => mockRoute,
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
    props: [
      'canAddEmbeddingBox',
      'embeddingBoxRows',
      'selectedSpecimenKey',
      'specimenOptions',
    ],
    emits: [
      'addEmbeddingBoxes',
      'removeEmbeddingBox',
      'update:selectedSpecimenKey',
    ],
    setup(props, { emit }) {
      return () =>
        h('section', { 'data-component': 'grossing-embedding-box-table' }, [
          `grossing-embedding-box-table:${props.embeddingBoxRows?.[0]?.box?.embeddingBoxNo ?? '-'}`,
          h(
            'select',
            {
              'aria-label': '标本名称',
              value: props.selectedSpecimenKey,
              onChange: (event: Event) =>
                emit(
                  'update:selectedSpecimenKey',
                  (event.target as HTMLSelectElement).value,
                ),
            },
            (props.specimenOptions ?? []).map(
              (option: { label: string; value: string }) =>
                h('option', { value: option.value }, option.label),
            ),
          ),
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
              onClick: () => emit('removeEmbeddingBox', 0, 0),
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
    inheritAttrs: false,
    props: ['disabled', 'modelValue'],
    emits: ['change', 'update:modelValue'],
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

  const ElDatePicker = defineComponent({
    inheritAttrs: false,
    props: [
      'clearable',
      'endPlaceholder',
      'modelValue',
      'shortcuts',
      'startPlaceholder',
      'type',
    ],
    emits: ['update:modelValue'],
    setup(props, { attrs, emit }) {
      return () =>
        h('input', {
          ...attrs,
          'data-shortcuts': Array.isArray(props.shortcuts)
            ? props.shortcuts
                .map((item: { text: string }) => item.text)
                .join(',')
            : '',
          'data-testid': 'date-range-picker',
          placeholder:
            props.type === 'daterange'
              ? `${String(props.startPlaceholder ?? '')} ~ ${String(props.endPlaceholder ?? '')}`
              : '',
          value: Array.isArray(props.modelValue)
            ? props.modelValue.join(',')
            : props.modelValue,
          onInput: (event: Event) => {
            const value = (event.target as HTMLInputElement).value;
            emit(
              'update:modelValue',
              value
                ? value
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean)
                : [],
            );
          },
        });
    },
  });

  const ElImage = defineComponent({
    props: ['alt', 'initialIndex', 'previewSrcList', 'src'],
    setup(props, { slots }) {
      return () =>
        props.src
          ? h('img', {
              alt: props.alt,
              'data-initial-index': props.initialIndex,
              'data-preview-src-list': Array.isArray(props.previewSrcList)
                ? props.previewSrcList.join(',')
                : '',
              src: props.src,
            })
          : slots.error?.();
    },
  });

  const ElSwitch = defineComponent({
    props: ['disabled', 'modelValue'],
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h('input', {
          'aria-label': '预览开关',
          checked: props.modelValue,
          disabled: props.disabled,
          role: 'switch',
          type: 'checkbox',
          onChange: (event: Event) =>
            emit(
              'update:modelValue',
              (event.target as HTMLInputElement).checked,
            ),
        });
    },
  });

  return {
    ElAlert: createAlertStub(),
    ElBadge,
    ElButton: createButtonStub(),
    ElCheckbox,
    ElDatePicker,
    ElEmpty: createEmptyStub(),
    ElForm: createPassthroughStub('form'),
    ElImage,
    ElInput: createInputStub(),
    ElMessage: {
      success: mockMessageSuccess,
      warning: mockMessageWarning,
    },
    ElPagination: createPassthroughStub(),
    ElSwitch,
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
  overrides: Record<string, unknown> = {},
) {
  const isPrimaryTask = id === 'TASK-001';
  const patientId = isPrimaryTask ? 'P-001' : 'P-002';
  const patientName = isPrimaryTask ? '患者甲' : '患者乙';
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
    patientId,
    patientName,
    payload: JSON.stringify({
      blockCount: isPrimaryTask ? 1 : 2,
      inpatientNo: isPrimaryTask ? 'ZY-001' : 'ZY-002',
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
    ...overrides,
  };
}

async function flushAll() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

async function mountView(query?: Record<string, string>) {
  mockRoute.query = query ?? { pathologyNo: 'BL-001' };
  descriptionTab.value = 'grossDescription';
  activeSpecimenKey.value = 'specimen-1';
  selectedEmbeddingBoxSpecimenKey.value = 'specimen-1';
  completeForm.caseId = 'CASE-001';
  completeForm.taskId = 'TASK-001';
  completeForm.specimens[0]!.grossDescription = '甲状腺左叶灰白结节，质中。';
  currentTask.value = null;
  mockSubmitGrossing.mockResolvedValue(undefined);
  mockStartGrossing.mockResolvedValue({
    caseId: 'CASE-001',
    caseStatus: 'SAMPLING',
    taskId: 'TASK-001',
    taskStatus: 'IN_PROGRESS',
  });
  mockListPendingTechnicalTasks.mockResolvedValue({
    items: [
      createTask('TASK-001', 'BL-001', 'IN_PROGRESS'),
      createTask('TASK-002', 'BL-002', 'IN_PROGRESS'),
    ],
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

function setInputValue(
  input: HTMLInputElement | HTMLTextAreaElement,
  value: string,
) {
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function setDateRangeValue(root: HTMLElement, values: [string, string]) {
  const input = root.querySelector<HTMLInputElement>(
    'input[data-testid="date-range-picker"]',
  );
  if (!input) {
    throw new Error('Missing date range picker');
  }
  input.value = values.join(',');
  input.dispatchEvent(new Event('input'));
}

describe('GrossingWorkstationView', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
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
    workbenchState.uploadGrossingImageFile.mockClear();
  });

  it('keeps the ordinary entry empty until the user queries', async () => {
    const { app } = await mountView({});

    expect(mockListPendingTechnicalTasks).not.toHaveBeenCalled();
    expect(mockInitializeWorkbench).not.toHaveBeenCalled();

    app.unmount();
  });

  it('loads the legacy table and switches the selected task', async () => {
    const { app, root } = await mountView();

    expect(mockListPendingTechnicalTasks).toHaveBeenCalledTimes(1);
    expect(mockListPendingTechnicalTasks).toHaveBeenLastCalledWith(
      expect.objectContaining({
        includeAllStatuses: true,
        keyword: 'BL-001',
        taskType: 'GROSSING',
      }),
    );
    expect(mockInitializeWorkbench).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'TASK-001',
      }),
    );
    expect(root.textContent).toContain('BL-001');
    expect(root.textContent).toContain('患者乙');
    expect(root.querySelector('[data-column-label="检查组"]')).toBeNull();
    expect(root.querySelector('[data-column-label="申请机构"]')).toBeNull();
    expect(root.querySelector('[data-column-label="住院号"]')).toBeNull();
    expect(root.querySelector('[data-column-label="病人ID"]')).toBeNull();
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

  it('renders frozen reminder as a live countdown', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-03T18:00:00'));
    mockListPendingTechnicalTasks.mockResolvedValue({
      items: [
        createTask('TASK-001', 'BL-001', 'PENDING', {
          deadlineAt: '2026-06-03T18:30:05',
        }),
        createTask('TASK-002', 'BL-002', 'PENDING', {
          deadlineAt: '2026-06-03T17:59:30',
          timedOut: true,
        }),
      ],
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

    expect(root.textContent).toContain('剩余 0:30:05');
    expect(root.textContent).toContain('已超时 0:00:30');

    await vi.advanceTimersByTimeAsync(1000);
    await flushAll();

    expect(root.textContent).toContain('剩余 0:30:04');
    expect(root.textContent).toContain('已超时 0:00:31');

    app.unmount();
    vi.useRealTimers();
  });

  it('queries and starts grossing from the compact toolbar', async () => {
    const { app, root } = await mountView();
    mockListPendingTechnicalTasks.mockClear();
    mockListPendingTechnicalTasks.mockResolvedValue({
      items: [
        createTask('TASK-001', 'BL-001'),
        createTask('TASK-002', 'BL-002'),
      ],
      page: 1,
      size: 20,
      total: 2,
    });

    const input = root.querySelector<HTMLInputElement>(
      'input[placeholder="病人ID / 病理号 / 姓名"]',
    );
    expect(input).toBeTruthy();
    setInputValue(input!, 'BL-002');
    setDateRangeValue(root, ['2026-06-01', '2026-06-03']);
    findButton(root, '查询').click();
    await flushAll();

    expect(mockListPendingTechnicalTasks).toHaveBeenLastCalledWith(
      expect.objectContaining({
        createdFrom: '2026-06-01T00:00:00',
        createdTo: '2026-06-03T23:59:59',
        includeAllStatuses: true,
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

  it('keeps the query button styled in the compact toolbar', async () => {
    const { app, root } = await mountView();

    const queryButton = findButton(root, '查询');
    const toolbarButtons = [...root.querySelectorAll('button')].map((button) =>
      button.textContent?.trim(),
    );

    expect(queryButton.className).toContain('grossing-query-button');
    expect(toolbarButtons).not.toContain('取材任务');

    app.unmount();
  });

  it('renders a date range picker instead of the more button and shifts the range by day', async () => {
    const { app, root } = await mountView();

    expect(
      root.querySelector('input[data-testid="date-range-picker"]'),
    ).toBeTruthy();
    expect(
      root.querySelector<HTMLInputElement>(
        'input[data-testid="date-range-picker"]',
      )?.dataset.shortcuts,
    ).toBe('今天,昨天,本周,本月');
    expect(
      [...root.querySelectorAll('button')].some((item) =>
        item.textContent?.includes('更多'),
      ),
    ).toBe(false);

    mockListPendingTechnicalTasks.mockClear();
    setDateRangeValue(root, ['2026-06-10', '2026-06-12']);
    findButton(root, '前1天').click();
    await flushAll();

    expect(mockListPendingTechnicalTasks).toHaveBeenLastCalledWith(
      expect.objectContaining({
        createdFrom: '2026-06-09T00:00:00',
        createdTo: '2026-06-11T23:59:59',
      }),
    );

    findButton(root, '后1天').click();
    await flushAll();

    expect(mockListPendingTechnicalTasks).toHaveBeenLastCalledWith(
      expect.objectContaining({
        createdFrom: '2026-06-10T00:00:00',
        createdTo: '2026-06-12T23:59:59',
      }),
    );

    app.unmount();
  });

  it('does not render the grossing task button when total is zero', async () => {
    mockListPendingTechnicalTasks.mockResolvedValue({
      items: [],
      page: 1,
      size: 20,
      total: 0,
    });

    const { app, root } = await mountView({});
    await flushAll();

    const badge = [...root.querySelectorAll('sup')].find(
      (element) => element.textContent === '0',
    );
    const toolbarButtons = [...root.querySelectorAll('button')].map((button) =>
      button.textContent?.trim(),
    );

    expect(badge).toBeUndefined();
    expect(toolbarButtons).not.toContain('取材任务');

    app.unmount();
  });

  it('shows historical task data status without loading inactive workbench on enter query', async () => {
    const { app, root } = await mountView({});
    mockListPendingTechnicalTasks.mockResolvedValue({
      items: [createTask('TASK-009', 'BD202606080002', 'COMPLETED')],
      page: 1,
      size: 20,
      total: 1,
    });

    const input = root.querySelector<HTMLInputElement>(
      'input[placeholder="病人ID / 病理号 / 姓名"]',
    );
    expect(input).toBeTruthy();
    setInputValue(input!, 'BD202606080002');
    input!.dispatchEvent(
      new KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }),
    );
    await flushAll();

    expect(mockListPendingTechnicalTasks).toHaveBeenCalledWith(
      expect.objectContaining({
        includeAllStatuses: true,
        keyword: 'BD202606080002',
        taskType: 'GROSSING',
      }),
    );
    expect(mockInitializeWorkbench).not.toHaveBeenCalled();
    expect(mockResetWorkbenchState).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'TASK-009',
        taskStatus: 'COMPLETED',
      }),
    );
    expect(root.querySelector('[data-column-label="数据状态"]')).toBeTruthy();
    expect(root.textContent).toContain('描写完成');
    expect(root.textContent).not.toContain('技术任务未处于激活状态');

    app.unmount();
  });

  it('does not render previous and next task controls in the right panel', async () => {
    const { app, root } = await mountView();

    expect(root.textContent).not.toContain('上一例');
    expect(root.textContent).not.toContain('下一例');

    app.unmount();
  });

  it('switches context tabs and hides annotation content in clinical history', async () => {
    const { app, root } = await mountView();

    expect(root.textContent).toContain('病人: 患者甲');
    expect(root.textContent).toContain('病理号: BL-001');
    expect(root.textContent).toContain('history-1.jpg');
    expect(root.textContent).toContain('current-1.jpg');

    findButton(root, '临床病史').click();
    await flushAll();

    expect(
      root.querySelector('textarea[placeholder="请输入病例描述"]'),
    ).toBeNull();
    expect(
      root.querySelector('textarea[placeholder="请输入临床诊断"]'),
    ).toBeNull();
    expect(root.textContent).not.toContain('已采图像');
    expect(root.textContent).not.toContain('history-1.jpg');
    expect(root.textContent).not.toContain('current-1.jpg');

    const historySummaryInput = root.querySelector<HTMLTextAreaElement>(
      'textarea[placeholder="请输入病史摘要"]',
    );
    const clinicalExaminationInput = root.querySelector<HTMLTextAreaElement>(
      'textarea[placeholder="请输入临床检查"]',
    );
    const laboratoryExaminationInput = root.querySelector<HTMLTextAreaElement>(
      'textarea[placeholder="请输入检验"]',
    );
    const clinicalSubmissionRequirementsInput =
      root.querySelector<HTMLTextAreaElement>(
        'textarea[placeholder="请输入临床送检要求"]',
      );
    const infectiousAndPastHistorySummaryInput =
      root.querySelector<HTMLTextAreaElement>(
        'textarea[placeholder="请输入传染病史和过往病史"]',
      );
    const externalPathologyDiagnosisInput =
      root.querySelector<HTMLTextAreaElement>(
        'textarea[placeholder="请输入外院病理诊断"]',
      );
    const imagingExaminationInput = root.querySelector<HTMLTextAreaElement>(
      'textarea[placeholder="请输入影像检查"]',
    );

    expect(root.textContent).toContain('病史摘要');
    expect(root.textContent).toContain('临床检查');
    expect(root.textContent).toContain('临床送检要求');
    expect(root.textContent).toContain('传染病史和过往病史');
    expect(root.textContent).toContain('外院病理诊断');
    expect(root.textContent).toContain('检验');
    expect(root.textContent).toContain('影像检查');
    expect(historySummaryInput).toBeTruthy();
    expect(clinicalExaminationInput).toBeTruthy();
    expect(clinicalSubmissionRequirementsInput).toBeTruthy();
    expect(infectiousAndPastHistorySummaryInput).toBeTruthy();
    expect(externalPathologyDiagnosisInput).toBeTruthy();
    expect(laboratoryExaminationInput).toBeTruthy();
    expect(imagingExaminationInput).toBeTruthy();
    expect(historySummaryInput!.value).toBe('甲状腺结节病史，近一个月增大。');
    expect(clinicalExaminationInput!.value).toBe('');
    expect(clinicalSubmissionRequirementsInput!.value).toBe(
      '术中立即送检，优先取材。',
    );
    expect(infectiousAndPastHistorySummaryInput!.value).toBe(
      '乙肝病史，甲状腺结节手术史。',
    );
    expect(externalPathologyDiagnosisInput!.value).toBe(
      '外院提示甲状腺乳头状癌。',
    );
    expect(laboratoryExaminationInput!.value).toBe('');
    expect(imagingExaminationInput!.value).toBe(
      '影像检查: 超声提示甲状腺左叶低回声结节',
    );

    setInputValue(historySummaryInput!, '病史摘要可编辑');
    setInputValue(clinicalExaminationInput!, '临床检查可编辑');
    setInputValue(clinicalSubmissionRequirementsInput!, '送检要求可编辑');
    setInputValue(infectiousAndPastHistorySummaryInput!, '传染既往可编辑');
    setInputValue(externalPathologyDiagnosisInput!, '外院诊断可编辑');
    setInputValue(laboratoryExaminationInput!, '检验可编辑');
    setInputValue(imagingExaminationInput!, '影像检查可编辑');
    await flushAll();

    expect(historySummaryInput!.value).toBe('病史摘要可编辑');
    expect(clinicalExaminationInput!.value).toBe('临床检查可编辑');
    expect(clinicalSubmissionRequirementsInput!.value).toBe('送检要求可编辑');
    expect(infectiousAndPastHistorySummaryInput!.value).toBe('传染既往可编辑');
    expect(externalPathologyDiagnosisInput!.value).toBe('外院诊断可编辑');
    expect(laboratoryExaminationInput!.value).toBe('检验可编辑');
    expect(imagingExaminationInput!.value).toBe('影像检查可编辑');

    findButton(root, '相关检查').click();
    await flushAll();
    expect(root.textContent).toContain(
      '影像检查: 超声提示甲状腺左叶低回声结节',
    );
    expect(root.textContent).toContain('术中病理');
    expect(root.textContent).toContain('免疫组化复核');

    app.unmount();
  });

  it('keeps gross description compact and exposes the new save and labeled actions', async () => {
    const { app, root } = await mountView();

    const grossDescriptionInput = root.querySelector<HTMLTextAreaElement>(
      'textarea[placeholder="请输入当前标本的大体描写"]',
    );
    const descriptionInput = root.querySelector<HTMLTextAreaElement>(
      'textarea[placeholder="请输入病例描述"]',
    );
    const diagnosisInput = root.querySelector<HTMLTextAreaElement>(
      'textarea[placeholder="请输入临床诊断"]',
    );

    expect(grossDescriptionInput).toBeTruthy();
    expect(grossDescriptionInput!.getAttribute('rows')).toBe('6');
    expect(descriptionInput).toBeNull();
    expect(diagnosisInput).toBeNull();
    expect(root.textContent).not.toContain('保存描述');
    expect(root.textContent).not.toContain('暂存');
    expect(root.textContent).toContain('取材模板');
    expect(root.textContent).toContain('拍照');
    expect(root.textContent).toContain('导入图片');
    expect(root.textContent).toContain('已采图像');

    findButton(root, '保存').click();
    await flushAll();

    expect(mockMessageSuccess).toHaveBeenCalledWith(
      '大体描写已保存，取材完成时将一并提交',
    );
    app.unmount();
  });

  it('keeps the grossing template panel on the right and appends a selected template', async () => {
    const { app, root } = await mountView();

    const grossDescriptionInput = root.querySelector<HTMLTextAreaElement>(
      'textarea[placeholder="请输入当前标本的大体描写"]',
    );
    expect(grossDescriptionInput).toBeTruthy();
    expect(grossDescriptionInput!.value).toBe('甲状腺左叶灰白结节，质中。');
    expect(root.querySelector('[data-testid="drawer"]')).toBeNull();
    expect(root.textContent).toContain('当前标本：骨髓');
    expect(root.textContent).toContain('淋巴造血系统');
    expect(root.textContent).toContain('骨髓');

    findButton(root, '取材模板').click();
    await flushAll();

    findButton(root, '追加模板').click();
    await flushAll();

    expect(mockMessageSuccess).toHaveBeenCalledWith('已追加取材模板');
    expect(grossDescriptionInput!.value).toContain('甲状腺左叶灰白结节');
    expect(grossDescriptionInput!.value).toContain('灰褐色条索状组织一条');
    expect(root.textContent).toContain('取材模板');

    app.unmount();
  });

  it('renders resizable workbench columns and lets captured images scroll with the workspace', async () => {
    const { app, root } = await mountView();

    const layout = root.querySelector<HTMLElement>(
      '[data-testid="grossing-workbench-layout"]',
    );
    const leftResizer = root.querySelector<HTMLButtonElement>(
      '[data-testid="grossing-workbench-resizer-left"]',
    );
    const rightResizer = root.querySelector<HTMLButtonElement>(
      '[data-testid="grossing-workbench-resizer-right"]',
    );
    const imagePanel = root.querySelector<HTMLElement>(
      '[data-testid="workbench-captured-image-panel"]',
    );
    const imagePanelBody = root.querySelector<HTMLElement>(
      '[data-testid="workbench-captured-image-panel-body"]',
    );

    expect(layout).toBeTruthy();
    expect(leftResizer).toBeTruthy();
    expect(rightResizer).toBeTruthy();
    expect(layout!.style.gridTemplateColumns).toContain('30fr');
    expect(layout!.style.gridTemplateColumns).toContain('45fr');
    expect(layout!.style.gridTemplateColumns).toContain('25fr');
    expect(imagePanel?.className).toContain('flex-none');
    expect(imagePanelBody?.className).not.toContain('overflow-auto');

    layout!.getBoundingClientRect = vi.fn(
      () =>
        ({
          width: 2000,
        }) as DOMRect,
    );
    leftResizer!.dispatchEvent(
      new MouseEvent('pointerdown', {
        bubbles: true,
        button: 0,
        clientX: 100,
      }),
    );
    window.dispatchEvent(
      new MouseEvent('pointermove', {
        clientX: 200,
      }),
    );
    window.dispatchEvent(new MouseEvent('pointerup'));
    await flushAll();

    expect(layout!.style.gridTemplateColumns).toContain('35fr');
    expect(layout!.style.gridTemplateColumns).toContain('40fr');

    app.unmount();
  });

  it('appends a grossing template directly when double-clicking the template card', async () => {
    const { app, root } = await mountView();

    const grossDescriptionInput = root.querySelector<HTMLTextAreaElement>(
      'textarea[placeholder="请输入当前标本的大体描写"]',
    );
    expect(grossDescriptionInput).toBeTruthy();

    const appendCheckbox = root.querySelector<HTMLInputElement>(
      'input[type="checkbox"]:not([disabled])',
    );
    expect(appendCheckbox).toBeTruthy();
    appendCheckbox!.click();
    await flushAll();
    expect(appendCheckbox!.checked).toBe(false);

    findButton(root, '灰褐色条索状组织一条').dispatchEvent(
      new MouseEvent('dblclick', { bubbles: true }),
    );
    await flushAll();

    expect(mockMessageSuccess).toHaveBeenCalledWith('已追加取材模板');
    expect(grossDescriptionInput!.value).toContain('甲状腺左叶灰白结节');
    expect(grossDescriptionInput!.value).toContain('灰褐色条索状组织一条');

    app.unmount();
  });

  it('renders captured image actions and imports files into the current specimen', async () => {
    const { app, root } = await mountView();

    findButton(root, '导入图片').click();
    await flushAll();

    const fileInput = root.querySelector<HTMLInputElement>(
      'input[type="file"][accept="image/jpeg"]',
    );
    expect(fileInput).toBeTruthy();

    const file = new File(['image-bytes'], 'grossing-upload.jpg', {
      type: 'image/jpeg',
    });
    Object.defineProperty(fileInput!, 'files', {
      configurable: true,
      value: [file],
    });
    fileInput!.dispatchEvent(new Event('change'));
    await flushAll();

    expect(workbenchState.uploadGrossingImageFile).toHaveBeenCalledWith(
      0,
      file,
    );
    expect(root.textContent).toContain('摄像头预览');
    expect(root.querySelectorAll('img').length).toBeGreaterThan(0);
    expect(root.textContent).toContain('current-1.jpg');
    expect(root.textContent).toContain('history-1.jpg');

    app.unmount();
  });

  it('shows camera unsupported text after enabling preview switch without mediaDevices', async () => {
    const originalMediaDevices = navigator.mediaDevices;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: undefined,
    });

    const { app, root } = await mountView();

    const previewSwitch = root.querySelector<HTMLInputElement>(
      'input[role="switch"]',
    );
    expect(previewSwitch).toBeTruthy();
    previewSwitch!.checked = true;
    previewSwitch!.dispatchEvent(new Event('change'));
    await flushAll();

    expect(root.textContent).toContain('当前浏览器不支持摄像头拍照');

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: originalMediaDevices,
    });

    app.unmount();
  });

  it('keeps operator fields and specimen editor reachable from the main workspace', async () => {
    const { app, root } = await mountView();

    expect(root.textContent).toContain('操作信息');
    expect(root.textContent).toContain('标本 / 蜡块 / 影像编辑');
    expect(root.textContent).toContain('technical-operator-fields');
    expect(root.textContent).toContain('grossing-specimen-tabs:specimen-1');

    app.unmount();
  });

  it('renders embedding boxes and submits from the right panel', async () => {
    const { app, root } = await mountView();

    const embeddingBoxSection = root.querySelector<HTMLElement>(
      '[data-component="grossing-embedding-box-table"]',
    );
    const tabsSection = root.querySelector<HTMLElement>('[data-active-tab]');
    expect(embeddingBoxSection).toBeTruthy();
    expect(tabsSection).toBeTruthy();
    expect(
      embeddingBoxSection!.compareDocumentPosition(tabsSection!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(tabsSection!.contains(embeddingBoxSection)).toBe(false);
    expect(root.textContent).toContain('grossing-embedding-box-table:A1');

    const specimenNameSelect = root.querySelector<HTMLSelectElement>(
      'select[aria-label="标本名称"]',
    );
    expect(specimenNameSelect).toBeTruthy();
    specimenNameSelect!.value = 'specimen-2';
    specimenNameSelect!.dispatchEvent(new Event('change'));
    await flushAll();
    expect(selectedEmbeddingBoxSpecimenKey.value).toBe('specimen-2');
    expect(activeSpecimenKey.value).toBe('specimen-1');

    findButton(root, '添加包埋盒1').click();
    await flushAll();
    expect(workbenchState.addEmbeddingBoxes).toHaveBeenCalledWith(1);

    findButton(root, '删除包埋盒').click();
    await flushAll();
    expect(workbenchState.removeEmbeddingBox).toHaveBeenCalledWith(0, 0);

    findButton(root, '取材完成').click();
    await flushAll();
    expect(mockSubmitGrossing).toHaveBeenCalledTimes(1);

    app.unmount();
  });

  it('renders unsupported legacy toolbar actions as disabled placeholders', async () => {
    const { app, root } = await mountView();

    expect(findButton(root, '导出Excel').disabled).toBe(true);
    expect(findButton(root, '前1天').disabled).toBe(false);
    expect(findButton(root, '后1天').disabled).toBe(false);

    app.unmount();
  });
});
