import type { PendingTechnicalTaskItem } from '../types/technical-workflow';

import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  messageSuccess,
  messageWarning,
  mockCompleteEmbedding,
  mockGetEmbeddingWorkstationSummary,
  mockGetTechnicalTracking,
  mockListPendingTechnicalTasks,
  mockRoute,
  mockRouter,
  mockStartEmbedding,
  mockUserStore,
} = vi.hoisted(() => ({
  messageSuccess: vi.fn(),
  messageWarning: vi.fn(),
  mockCompleteEmbedding: vi.fn(),
  mockGetEmbeddingWorkstationSummary: vi.fn(),
  mockGetTechnicalTracking: vi.fn(),
  mockListPendingTechnicalTasks: vi.fn(),
  mockRoute: {
    query: {},
  } as { query: Record<string, string> },
  mockRouter: {
    push: vi.fn(),
  },
  mockStartEmbedding: vi.fn(),
  mockUserStore: {
    userInfo: {
      realName: '包埋技师',
      userId: 'USER-EMB-1',
    },
  },
}));

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => mockRouter,
}));

vi.mock('@vben/common-ui', () => ({
  Page: defineComponent({
    setup(_, { slots }) {
      return () => h('main', slots.default?.());
    },
  }),
}));

vi.mock('@vben/stores', () => ({
  useUserStore: () => mockUserStore,
}));

vi.mock('#/utils/error-feedback', () => ({
  reportInlineErrorDisabled: vi.fn(),
}));

vi.mock('../api/technical-workflow-service', () => ({
  completeEmbedding: mockCompleteEmbedding,
  getEmbeddingWorkstationSummary: mockGetEmbeddingWorkstationSummary,
  getTechnicalTracking: mockGetTechnicalTracking,
  listPendingTechnicalTasks: mockListPendingTechnicalTasks,
  startEmbedding: mockStartEmbedding,
}));

vi.mock('../components/EmbeddingWorkstationProcessPanel.vue', () => ({
  default: defineComponent({
    props: ['active', 'canComplete', 'selectedBlock', 'selectedTask'],
    emits: ['cancel', 'complete'],
    setup(props, { emit }) {
      return () =>
        h('section', { 'data-testid': 'process-panel' }, [
          h('div', { 'data-testid': 'panel-task-id' }, props.selectedTask?.id ?? ''),
          h(
            'div',
            { 'data-testid': 'panel-block-code' },
            props.selectedBlock?.blockCode ?? '',
          ),
          h(
            'div',
            { 'data-testid': 'panel-active' },
            String(props.active),
          ),
          h(
            'div',
            { 'data-testid': 'panel-can-complete' },
            String(props.canComplete),
          ),
          h(
            'button',
            {
              type: 'button',
              onClick: () => emit('cancel'),
            },
            '取消包埋',
          ),
          h(
            'button',
            {
              type: 'button',
              onClick: () => emit('complete'),
            },
            '确认包埋完成(F9)',
          ),
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
    props: ['disabled', 'loading', 'plain', 'type'],
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

  const ElDrawer = defineComponent({
    props: ['modelValue', 'title'],
    setup(props, { slots }) {
      return () =>
        props.modelValue
          ? h('section', { 'data-testid': 'drawer' }, [
              h('h2', props.title),
              slots.default?.(),
            ])
          : null;
    },
  });

  const ElEmpty = defineComponent({
    props: ['description'],
    setup(props) {
      return () => h('div', props.description);
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
            emit('update:modelValue', (event.target as HTMLInputElement).value),
        });
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
    ElDrawer,
    ElEmpty,
    ElInput,
    ElMessage: {
      success: messageSuccess,
      warning: messageWarning,
    },
    ElTag,
  };
});

import EmbeddingWorkstationView from './EmbeddingWorkstationView.vue';

function createPendingTask(
  overrides: Partial<PendingTechnicalTaskItem> = {},
): PendingTechnicalTaskItem {
  return {
    applicationId: 'APP-1',
    applicationNo: 'APP-1',
    caseId: 'CASE-1',
    completedAt: null,
    createdAt: '2026-06-01T08:00:00',
    deadlineAt: null,
    id: 'TASK-1',
    objectId: 'BLOCK-1',
    objectType: 'SAMPLING_BLOCK',
    pathologyNo: 'BL-001',
    payload: null,
    productionRemarks: '主班备注-1',
    remarks: '任务备注-1',
    sampledAt: '2026-06-01T08:10:00',
    sampledByName: '取材技师-1',
    samplingBlockCode: 'A1',
    samplingBlockDescription: '左叶',
    specimenId: 'SPEC-1',
    startedAt: null,
    taskStatus: 'PENDING',
    taskType: 'EMBEDDING',
    timedOut: false,
    timeoutRuleCode: null,
    ...overrides,
  };
}

function createTracking(caseId: string, blockCode: string, embeddingRemarks: string) {
  return {
    blocks: [
      {
        blockCode,
        blockId: `BLOCK-${blockCode}`,
        description: `${blockCode}-描述`,
        embeddingBoxNo: `BOX-${blockCode}`,
        grossDescription: `${blockCode}-大体所见`,
        specimenId: `SPEC-${blockCode}`,
        specimenName: `${blockCode}-标本`,
      },
    ],
    caseId,
    caseStatus: 'EMBEDDING',
    embeddingBoxes: [],
    embeddingEvaluationRecords: [
      {
        caseId,
        embeddingBoxNo: `BOX-${blockCode}`,
        embeddingId: `EMB-${blockCode}`,
        embeddingRemarks,
        embeddedByName: '包埋技师',
        endedAt: '2026-06-01T10:10:00',
        evaluationLevel: 'QUALIFIED',
        pathologyNo: `BL-${blockCode}`,
        samplingBlockCode: blockCode,
        samplingBlockId: `BLOCK-${blockCode}`,
        samplingEvaluation: `${blockCode}-评价`,
        specimenId: `SPEC-${blockCode}`,
        specimenName: `${blockCode}-标本`,
      },
    ],
    embeddingRecords: [
      {
        caseId,
        embeddingBoxId: `BOX-ID-${blockCode}`,
        embeddingBoxNo: `BOX-${blockCode}`,
        embeddingId: `EMB-${blockCode}`,
        embeddingRemarks,
        embeddedByName: '包埋技师',
        endedAt: '2026-06-01T10:10:00',
        evaluationLevel: 'QUALIFIED',
        grossDescription: `${blockCode}-大体所见`,
        pathologyNo: `BL-${blockCode}`,
        sampledAt: '2026-06-01T08:10:00',
        sampledByName: '取材技师',
        samplingBlockCode: blockCode,
        samplingBlockDescription: `${blockCode}-蜡块`,
        samplingBlockId: `BLOCK-${blockCode}`,
        samplingEvaluation: `${blockCode}-评价`,
        sliceNotice: `${blockCode}-切片提示`,
        specimenId: `SPEC-${blockCode}`,
        specimenName: `${blockCode}-标本`,
        startedAt: '2026-06-01T09:00:00',
        taskId: `TASK-${blockCode}`,
        taskStatus: 'COMPLETED',
      },
    ],
    events: [],
    pathologyNo: `BL-${blockCode}`,
    qcEvaluations: [
      {
        evaluatedAt: '2026-06-01T11:00:00',
        evaluationResult: 'REWORK_REQUIRED',
        evaluatorName: '质控老师',
        improvementSuggestion: '重新切片',
        issueDescription: '边缘皱褶',
        qcEvaluationId: 'QC-1',
        qcType: 'HE',
        remarks: null,
        slideId: 'SLIDE-1',
        slideNo: 'S-1',
        specimenId: `SPEC-${blockCode}`,
      },
    ],
    reworks: [
      {
        reason: '补做',
        reworkOrderId: 'RW-1',
        reworkType: 'REEMBED',
        status: 'PENDING',
      },
    ],
    slides: [],
    specimens: [],
    technicalTasks: [],
  };
}

async function flushView() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

function mountView() {
  const root = document.createElement('div');
  document.body.append(root);

  const app = createApp({
    render: () => h(EmbeddingWorkstationView),
  });

  app.mount(root);
  return { app, root };
}

function findButton(text: string) {
  const button = [...document.querySelectorAll('button')].find(
    (item) => item.textContent?.trim() === text,
  );
  expect(button).toBeTruthy();
  return button as HTMLButtonElement;
}

describe('EmbeddingWorkstationView', () => {
  beforeEach(() => {
    mockRoute.query = {};
    mockListPendingTechnicalTasks.mockResolvedValue({
      items: [
        createPendingTask(),
        createPendingTask({
          caseId: 'CASE-2',
          id: 'TASK-2',
          objectId: 'BLOCK-B2',
          pathologyNo: 'BL-002',
          productionRemarks: '主班备注-2',
          remarks: '任务备注-2',
          sampledByName: '取材技师-2',
          samplingBlockCode: 'B2',
          samplingBlockDescription: '右叶',
        }),
      ],
      page: 1,
      size: 20,
      total: 2,
    });
    mockGetEmbeddingWorkstationSummary.mockResolvedValue({
      completedCount: 3,
      completedRecords: [
        {
          caseId: 'CASE-9',
          embeddingBoxId: 'BOX-ID-X1',
          embeddingBoxNo: 'BOX-X1',
          embeddingId: 'EMB-X1',
          embeddingRemarks: '汇总备注',
          embeddedByName: '汇总技师',
          endedAt: '2026-06-01T12:00:00',
          evaluationLevel: 'QUALIFIED',
          grossDescription: '汇总大体所见',
          pathologyNo: 'BL-X1',
          sampledAt: '2026-06-01T08:00:00',
          sampledByName: '汇总取材',
          samplingBlockCode: 'X1',
          samplingBlockDescription: '汇总蜡块',
          samplingBlockId: 'BLOCK-X1',
          samplingEvaluation: '汇总评价',
          sliceNotice: '汇总切片提示',
          specimenId: 'SPEC-X1',
          specimenName: '汇总标本',
          startedAt: '2026-06-01T09:00:00',
          taskId: 'TASK-X1',
          taskStatus: 'COMPLETED',
        },
      ],
      pendingCount: 5,
      pendingTasks: [createPendingTask()],
      workDate: '2026-06-01',
    });
    mockGetTechnicalTracking.mockImplementation(async (caseId: string) => {
      if (caseId === 'CASE-2') {
        return createTracking('CASE-2', 'B2', '病例2包埋备注');
      }
      return createTracking('CASE-1', 'A1', '病例1包埋备注');
    });
    mockStartEmbedding.mockResolvedValue({});
    mockCompleteEmbedding.mockResolvedValue({
      caseStatus: 'SLICING',
      embeddingBoxId: 'BOX-ID-A1',
      embeddingId: 'EMB-A1',
      markingMessage: 'success',
      markingSuccess: true,
      taskId: 'TASK-1',
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    messageSuccess.mockReset();
    messageWarning.mockReset();
    mockCompleteEmbedding.mockReset();
    mockGetEmbeddingWorkstationSummary.mockReset();
    mockGetTechnicalTracking.mockReset();
    mockListPendingTechnicalTasks.mockReset();
    mockRouter.push.mockReset();
    mockStartEmbedding.mockReset();
  });

  it('renders summary cards and pending list', async () => {
    const { app, root } = mountView();
    await flushView();

    expect(document.body.textContent).toContain('待包埋数');
    expect(document.body.textContent).toContain('5');
    expect(document.body.textContent).toContain('已包埋数');
    expect(document.body.textContent).toContain('3');
    expect(document.body.textContent).toContain('BL-001');
    expect(document.body.textContent).toContain('任务备注-1');

    app.unmount();
    root.remove();
  });

  it('updates right-side selection and clears current state', async () => {
    const { app, root } = mountView();
    await flushView();

    const rows = document.querySelectorAll('tbody tr');
    expect(rows.length).toBeGreaterThan(1);
    (rows[1] as HTMLTableRowElement).click();
    await flushView();

    expect(
      document.querySelector('[data-testid="panel-task-id"]')?.textContent,
    ).toBe('TASK-2');
    expect(
      document.querySelector('[data-testid="panel-block-code"]')?.textContent,
    ).toBe('B2');
    expect(document.body.textContent).toContain('病例2包埋备注');

    findButton('确认清零').click();
    await flushView();

    expect(
      document.querySelector('[data-testid="panel-task-id"]')?.textContent,
    ).toBe('');
    expect(document.body.textContent).toContain('当前病例暂无已包埋记录');

    app.unmount();
    root.remove();
  });

  it('opens history, evaluation and task drawers with expected content', async () => {
    const { app, root } = mountView();
    await flushView();

    findButton('包埋历史').click();
    await flushView();
    expect(document.body.textContent).toContain('病例1包埋备注');

    findButton('评价记录').click();
    await flushView();
    expect(document.body.textContent).toContain('重新切片');
    expect(document.body.textContent).toContain('补做');

    findButton('包埋任务').click();
    await flushView();
    expect(document.body.textContent).toContain('汇总备注');
    expect(document.body.textContent).toContain('当日待处理任务');

    app.unmount();
    root.remove();
  });

  it('keeps start and complete embedding on the existing API chain', async () => {
    const { app, root } = mountView();
    await flushView();

    findButton('确认包埋').click();
    await flushView();

    expect(mockStartEmbedding).toHaveBeenCalledWith({
      remarks: null,
      taskId: 'TASK-1',
      terminalCode: null,
    });

    findButton('确认包埋完成(F9)').click();
    await flushView();

    expect(mockCompleteEmbedding).toHaveBeenCalledWith(
      expect.objectContaining({
        blockCount: 1,
        remarks: null,
        samplingBlockId: 'BLOCK-1',
        taskId: 'TASK-1',
        terminalCode: null,
      }),
    );
    expect(messageSuccess).toHaveBeenCalled();

    app.unmount();
    root.remove();
  });
});
