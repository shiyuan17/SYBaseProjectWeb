import {
  computed,
  createApp,
  defineComponent,
  h,
  inject,
  nextTick,
  provide,
  reactive,
  ref,
  watch,
} from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

const tabsContextKey = Symbol('grossing-workstation-tabs');

const {
  mockInitializeWorkbench,
  mockListPendingTechnicalTasks,
  mockLoadWorkbenchContext,
  mockNavigation,
  mockResetWorkbenchState,
  mockStartGrossing,
} = vi.hoisted(() => {
  const mockInitializeWorkbench = vi.fn();
  const mockListPendingTechnicalTasks = vi.fn();
  const mockLoadWorkbenchContext = vi.fn();
  const mockNavigation = {
    goToTracking: vi.fn(),
  };
  const mockResetWorkbenchState = vi.fn();
  const mockStartGrossing = vi.fn();
  return {
    mockInitializeWorkbench,
    mockListPendingTechnicalTasks,
    mockLoadWorkbenchContext,
    mockNavigation,
    mockResetWorkbenchState,
    mockStartGrossing,
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
    patientName: 'Patient A',
    submittingDepartmentName: 'OR',
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
    blocks: [],
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
  workbenchContext.value = {
    ...workbenchContext.value,
    caseSummary: {
      ...workbenchContext.value.caseSummary,
      caseId: task?.caseId ?? '',
      pathologyNo: task?.pathologyNo ?? '',
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
  removeMediaAsset: vi.fn(),
  removeSpecimen: vi.fn(),
  resetWorkbenchState: mockResetWorkbenchState,
  samplingTemplateTreeOptions: ref([]),
  selectLoading: ref(false),
  specimenTabMetas,
  submitGrossing: vi.fn(),
  submitting: ref(false),
  trackingResult,
  workflowReferenceOptions: ref({
    cutSurfaceFeatures: [],
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

vi.mock('../utils/workstation', () => ({
  buildWorkstationQueueItems: (items: unknown[]) =>
    items.map((task) => ({
      alertLevel: 'info',
      badges: [],
      task,
    })),
}));

vi.mock('../utils/format', () => ({
  formatCaseStatus: (value: string) => value || '-',
  formatNullable: (value: string) => value || '-',
  formatTaskStatus: (value: string) => value || '-',
}));

vi.mock('../components/WorkflowSectionCard.vue', () => ({
  default: defineComponent({
    props: ['description', 'title'],
    setup(props, { slots }) {
      return () =>
        h('section', [
          h('h3', props.title),
          props.description ? h('p', props.description) : null,
          slots.extra?.(),
          slots.default?.(),
        ]);
    },
  }),
}));

vi.mock('../components/TechnicalTaskQueuePanel.vue', () => ({
  default: defineComponent({
    props: ['items', 'selectedTaskId', 'title'],
    emits: ['select'],
    setup(props, { emit, slots }) {
      return () =>
        h('section', [
          h('h3', props.title),
          slots.filters?.(),
          slots.extra?.(),
          ...(props.items ?? []).map((item: any) =>
            h(
              'button',
              {
                'data-selected': item.task.id === props.selectedTaskId,
                type: 'button',
                onClick: () => emit('select', item.task.id),
              },
              item.task.pathologyNo,
            ),
          ),
        ]);
    },
  }),
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
          `active:${props.activeSpecimenKey}`,
        );
    },
  }),
}));

vi.mock('element-plus', () => {
  const passthrough = (tag = 'div') =>
    defineComponent({
      props: ['description', 'label', 'title', 'type'],
      setup(props, { slots }) {
        return () =>
          h(tag, [
            props.title ? h('div', props.title) : null,
            props.label ? h('label', props.label) : null,
            props.description ? h('div', props.description) : null,
            slots.default?.(),
          ]);
      },
    });

  const ElAlert = defineComponent({
    props: ['title'],
    setup(props) {
      return () => h('section', props.title);
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

  const ElInput = defineComponent({
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h('input', {
          placeholder: props.placeholder,
          value: props.modelValue,
          onInput: (event: Event) =>
            emit(
              'update:modelValue',
              (event.target as HTMLInputElement).value,
            ),
        });
    },
  });

  const ElLink = defineComponent({
    props: ['href'],
    setup(props, { slots }) {
      return () => h('a', { href: props.href }, slots.default?.());
    },
  });

  const ElPagination = passthrough();
  const ElEmpty = passthrough();
  const ElForm = passthrough('form');
  const ElFormItem = passthrough();
  const ElTag = passthrough('span');

  const ElTabs = defineComponent({
    props: ['modelValue'],
    emits: ['update:modelValue'],
    setup(props, { emit, slots }) {
      const activeName = ref(props.modelValue);
      watch(
        () => props.modelValue,
        (value) => {
          activeName.value = value;
        },
      );
      provide(tabsContextKey, {
        activeName,
        selectTab: (name: string) => {
          activeName.value = name;
          emit('update:modelValue', name);
        },
      });
      return () => h('div', slots.default?.());
    },
  });

  const ElTabPane = defineComponent({
    props: ['label', 'name'],
    setup(props, { slots }) {
      const tabsContext = inject<null | {
        activeName: { value: string };
        selectTab: (name: string) => void;
      }>(tabsContextKey, null);
      return () => {
        const isActive = tabsContext?.activeName.value === props.name;
        return h('div', [
          h(
            'button',
            {
              type: 'button',
              onClick: () => tabsContext?.selectTab(String(props.name)),
            },
            props.label,
          ),
          isActive ? h('div', slots.default?.()) : null,
        ]);
      };
    },
  });

  return {
    ElAlert,
    ElButton,
    ElEmpty,
    ElForm,
    ElFormItem,
    ElInput,
    ElLink,
    ElPagination,
    ElTabPane,
    ElTabs,
    ElTag,
    ElMessage: {
      success: vi.fn(),
      warning: vi.fn(),
    },
  };
});

import GrossingWorkstationView from './GrossingWorkstationView.vue';

function createTask(id: string, pathologyNo: string, status = 'PENDING') {
  return {
    applicationId: 'APP-001',
    applicationNo: 'APP-001',
    caseId: id === 'TASK-001' ? 'CASE-001' : 'CASE-002',
    completedAt: null,
    createdAt: '2026-06-01T08:00:00',
    deadlineAt: null,
    id,
    objectId: id === 'TASK-001' ? 'CASE-001' : 'CASE-002',
    objectType: 'CASE',
    pathologyNo,
    payload: null,
    remarks: null,
    specimenId: null,
    startedAt: null,
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
  workbenchContext.value = {
    ...workbenchContext.value,
    caseSummary: {
      ...workbenchContext.value.caseSummary,
      caseId: 'CASE-001',
      pathologyNo: 'BL-001',
    },
    task: {
      ...workbenchContext.value.task,
      objectId: 'CASE-001',
      taskId: 'TASK-001',
      taskStatus: 'PENDING',
    },
    tracking: {
      ...workbenchContext.value.tracking,
      caseId: 'CASE-001',
      pathologyNo: 'BL-001',
    },
  };
  mockListPendingTechnicalTasks.mockResolvedValue({
    items: [createTask('TASK-001', 'BL-001'), createTask('TASK-002', 'BL-002')],
    page: 1,
    size: 20,
    total: 2,
  });

  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp(GrossingWorkstationView);
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

describe('GrossingWorkstationView', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    mockInitializeWorkbench.mockReset();
    mockListPendingTechnicalTasks.mockReset();
    mockLoadWorkbenchContext.mockReset();
    mockNavigation.goToTracking.mockReset();
    mockResetWorkbenchState.mockReset();
    mockStartGrossing.mockReset();
  });

  it('loads the queue and switches the selected task inside the inline workbench', async () => {
    const { app, root } = await mountView();

    expect(mockListPendingTechnicalTasks).toHaveBeenCalledTimes(1);
    expect(mockInitializeWorkbench).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'TASK-001',
      }),
    );
    expect(root.textContent).toContain('BL-001');

    findButton(root, 'BL-002').click();
    await flushAll();

    expect(mockInitializeWorkbench).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: 'TASK-002',
      }),
    );
    expect(root.textContent).toContain('BL-002');

    app.unmount();
  });

  it('navigates previous and next tasks using the queue order', async () => {
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

  it('switches context tabs and shows current plus historical images in the workbench', async () => {
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
});
