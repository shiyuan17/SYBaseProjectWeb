import type { PendingTechnicalTaskItem } from '../types/technical-workflow';

import { createApp, defineComponent, h, KeepAlive, nextTick, ref } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  messageSuccess,
  messageWarning,
  mockCompleteEmbedding,
  mockGetEmbeddingWorkstationSummary,
  mockGetTechnicalTracking,
  mockMessageBoxConfirm,
  mockListPendingTechnicalTasks,
  mockRoute,
  mockRouter,
  mockStartEmbedding,
  mockUpdateEmbeddingQualityReview,
  mockUpdateTechnicalTaskRemarks,
  mockUserStore,
} = vi.hoisted(() => ({
  messageSuccess: vi.fn(),
  messageWarning: vi.fn(),
  mockCompleteEmbedding: vi.fn(),
  mockGetEmbeddingWorkstationSummary: vi.fn(),
  mockGetTechnicalTracking: vi.fn(),
  mockMessageBoxConfirm: vi.fn(),
  mockListPendingTechnicalTasks: vi.fn(),
  mockRoute: {
    query: {},
  } as { query: Record<string, string> },
  mockRouter: {
    push: vi.fn(),
  },
  mockStartEmbedding: vi.fn(),
  mockUpdateEmbeddingQualityReview: vi.fn(),
  mockUpdateTechnicalTaskRemarks: vi.fn(),
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

vi.mock('@vben/icons', () => {
  const createIcon = (name: string) =>
    defineComponent({
      setup() {
        return () => h('span', { 'data-icon': name });
      },
    });

  return {
    Check: createIcon('Check'),
    UserRoundPen: createIcon('UserRoundPen'),
    X: createIcon('X'),
  };
});

vi.mock('#/utils/error-feedback', () => ({
  reportInlineErrorDisabled: vi.fn(),
}));

vi.mock('../api/technical-workflow-service', () => ({
  completeEmbedding: mockCompleteEmbedding,
  getEmbeddingWorkstationSummary: mockGetEmbeddingWorkstationSummary,
  getTechnicalTracking: mockGetTechnicalTracking,
  listPendingTechnicalTasks: mockListPendingTechnicalTasks,
  startEmbedding: mockStartEmbedding,
  updateEmbeddingQualityReview: mockUpdateEmbeddingQualityReview,
  updateTechnicalTaskRemarks: mockUpdateTechnicalTaskRemarks,
}));

vi.mock('../components/EmbeddingQualityReviewDialog.vue', () => ({
  default: defineComponent({
    props: ['modelValue', 'row'],
    emits: ['submitted', 'update:modelValue'],
    setup(props, { emit }) {
      return () =>
        props.modelValue
          ? h('section', { 'data-testid': 'quality-review-dialog' }, [
              h('div', props.row?.embeddingId ?? ''),
              h(
                'button',
                {
                  type: 'button',
                  onClick: () => emit('submitted'),
                },
                '保存评价',
              ),
            ])
          : null;
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

  const ElCheckbox = defineComponent({
    props: ['indeterminate', 'modelValue'],
    emits: ['update:modelValue'],
    setup(props, { attrs, emit }) {
      return () =>
        h('input', {
          ...attrs,
          'aria-checked': props.indeterminate ? 'mixed' : props.modelValue,
          checked: props.modelValue,
          type: 'checkbox',
          onClick: (event: MouseEvent) => event.stopPropagation(),
          onChange: (event: Event) =>
            emit(
              'update:modelValue',
              (event.target as HTMLInputElement).checked,
            ),
        });
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

  const ElOption = defineComponent({
    props: ['label', 'value'],
    setup(props) {
      return () => h('option', { value: props.value }, props.label);
    },
  });

  const ElSelect = defineComponent({
    props: ['modelValue', 'placeholder'],
    emits: ['change', 'update:modelValue'],
    setup(props, { emit, slots }) {
      return () =>
        h(
          'select',
          {
            'aria-label': props.placeholder,
            value: props.modelValue,
            onChange: (event: Event) => {
              const value = (event.target as HTMLSelectElement).value;
              emit('update:modelValue', value);
              emit('change', value);
            },
          },
          slots.default?.(),
        );
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
    ElDrawer,
    ElEmpty,
    ElInput,
    ElMessage: {
      success: messageSuccess,
      warning: messageWarning,
    },
    ElMessageBox: {
      confirm: mockMessageBoxConfirm,
    },
    ElOption,
    ElSelect,
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

function createTracking(
  caseId: string,
  blockCode: string,
  embeddingRemarks: string,
) {
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

function mountKeepAliveView() {
  const root = document.createElement('div');
  document.body.append(root);
  const visible = ref(true);

  const app = createApp({
    render: () =>
      h(KeepAlive, null, {
        default: () =>
          visible.value
            ? h(EmbeddingWorkstationView, { key: 'embedding-workstation' })
            : h('div', { key: 'placeholder' }, 'hidden'),
      }),
  });

  app.mount(root);
  return {
    app,
    root,
    setVisible: (nextVisible: boolean) => {
      visible.value = nextVisible;
    },
  };
}

function findButton(text: string) {
  const button = [...document.querySelectorAll('button')].find(
    (item) => item.textContent?.trim() === text,
  );
  expect(button).toBeTruthy();
  return button as HTMLButtonElement;
}

function queryButton(text: string) {
  return [...document.querySelectorAll('button')].find(
    (item) => item.textContent?.trim() === text,
  );
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
    mockMessageBoxConfirm.mockResolvedValue('confirm');
    mockUpdateEmbeddingQualityReview.mockResolvedValue({
      record: {},
      reworkStatus: null,
      reworkType: null,
    });
    mockUpdateTechnicalTaskRemarks.mockImplementation(
      async (
        taskId: string,
        data: { productionRemarks?: null | string; remarks?: null | string },
      ) => ({
        ...createPendingTask({ id: taskId }),
        productionRemarks: data.productionRemarks,
        remarks: data.remarks,
      }),
    );
  });

  afterEach(() => {
    document.body.innerHTML = '';
    messageSuccess.mockReset();
    messageWarning.mockReset();
    mockCompleteEmbedding.mockReset();
    mockGetEmbeddingWorkstationSummary.mockReset();
    mockGetTechnicalTracking.mockReset();
    mockMessageBoxConfirm.mockReset();
    mockListPendingTechnicalTasks.mockReset();
    mockRouter.push.mockReset();
    mockStartEmbedding.mockReset();
    mockUpdateEmbeddingQualityReview.mockReset();
    mockUpdateTechnicalTaskRemarks.mockReset();
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
    expect(document.body.textContent).not.toContain(
      '按病理号和病人ID筛选当前待处理包埋任务。',
    );
    expect(document.body.textContent).not.toContain(
      '展示当日已包埋蜡块，可调整切片备注并核对大体所见。',
    );
    expect(findButton('确认包埋完成')).toBeTruthy();

    const buttonLabels = [...document.querySelectorAll('button')].map((item) =>
      item.textContent?.trim(),
    );
    const taskButtonIndex = buttonLabels.indexOf('包埋任务');
    expect(buttonLabels.indexOf('包埋历史')).toBeGreaterThan(taskButtonIndex);
    expect(buttonLabels.indexOf('评价记录')).toBeGreaterThan(taskButtonIndex);

    app.unmount();
    root.remove();
  });

  it('refreshes workstation data when the cached tab is reactivated', async () => {
    const { app, root, setVisible } = mountKeepAliveView();
    await flushView();

    expect(mockGetEmbeddingWorkstationSummary).toHaveBeenCalledTimes(1);
    expect(mockListPendingTechnicalTasks).toHaveBeenCalledTimes(1);

    setVisible(false);
    await flushView();
    setVisible(true);
    await flushView();

    expect(mockGetEmbeddingWorkstationSummary).toHaveBeenCalledTimes(2);
    expect(mockListPendingTechnicalTasks).toHaveBeenCalledTimes(2);

    app.unmount();
    root.remove();
  });

  it('warns and keeps current state when clearing with pending tasks', async () => {
    const { app, root } = mountView();
    await flushView();

    const rows = document.querySelectorAll('tbody tr');
    expect(rows.length).toBeGreaterThan(1);
    (rows[1] as HTMLTableRowElement).click();
    await flushView();

    findButton('包埋历史').click();
    await flushView();
    expect(document.body.textContent).toContain('病例2包埋备注');
    expect(document.body.textContent).toContain('汇总备注');

    findButton('确认清零').click();
    await flushView();

    expect(messageWarning).toHaveBeenCalledWith('还有待处理的数据');
    expect(mockMessageBoxConfirm).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain('病例2包埋备注');

    app.unmount();
    root.remove();
  });

  it('confirms clearing when the pending list is empty', async () => {
    mockListPendingTechnicalTasks.mockResolvedValue({
      items: [],
      page: 1,
      size: 20,
      total: 0,
    });
    mockGetEmbeddingWorkstationSummary.mockResolvedValue({
      completedCount: 3,
      completedRecords: [],
      pendingCount: 0,
      pendingTasks: [],
      workDate: '2026-06-01',
    });

    const { app, root } = mountView();
    await flushView();

    findButton('确认清零').click();
    await flushView();

    expect(messageWarning).not.toHaveBeenCalledWith('还有待处理的数据');
    expect(mockMessageBoxConfirm).toHaveBeenCalledWith(
      '确认今日包埋工作已完成了吗？',
      '确认清零',
      {
        cancelButtonText: '取消',
        confirmButtonText: '确定',
        type: 'info',
      },
    );

    app.unmount();
    root.remove();
  });

  it('supports checkbox selection on pending and completed lists', async () => {
    const { app, root } = mountView();
    await flushView();

    const selectAllPending = document.querySelector<HTMLInputElement>(
      'input[aria-label="选择全部待包埋任务"]',
    );
    const pendingB2 = document.querySelector<HTMLInputElement>(
      'input[aria-label="选择待包埋任务 B2"]',
    );
    const selectAllCompleted = document.querySelector<HTMLInputElement>(
      'input[aria-label="选择全部已包埋蜡块"]',
    );
    const completedX1 = document.querySelector<HTMLInputElement>(
      'input[aria-label="选择已包埋蜡块 X1"]',
    );

    expect(selectAllPending).toBeTruthy();
    expect(pendingB2).toBeTruthy();
    expect(selectAllCompleted).toBeTruthy();
    expect(completedX1).toBeTruthy();

    pendingB2!.click();
    await flushView();
    expect(pendingB2!.checked).toBe(true);
    expect(selectAllPending!.getAttribute('aria-checked')).toBe('mixed');

    findButton('包埋历史').click();
    await flushView();
    expect(document.body.textContent).toContain('病例1包埋备注');

    selectAllPending!.click();
    await flushView();
    expect(selectAllPending!.checked).toBe(true);

    selectAllCompleted!.click();
    await flushView();
    expect(selectAllCompleted!.checked).toBe(true);
    expect(completedX1!.checked).toBe(true);

    app.unmount();
    root.remove();
  });

  it('edits pending task remarks and shift remarks inline', async () => {
    const { app, root } = mountView();
    await flushView();

    document
      .querySelector<HTMLButtonElement>('button[aria-label="编辑备注"]')!
      .click();
    await flushView();

    const remarksInput = document.querySelector<HTMLInputElement>(
      'input[placeholder="备注"]',
    );
    expect(remarksInput).toBeTruthy();
    remarksInput!.value = '复核备注';
    remarksInput!.dispatchEvent(new Event('input'));
    await flushView();

    document
      .querySelector<HTMLButtonElement>('button[aria-label="保存备注"]')!
      .click();
    await flushView();

    expect(mockUpdateTechnicalTaskRemarks).toHaveBeenCalledWith('TASK-1', {
      productionRemarks: '主班备注-1',
      remarks: '复核备注',
    });

    document
      .querySelector<HTMLButtonElement>('button[aria-label="编辑主班备注"]')!
      .click();
    await flushView();

    const shiftRemarkSelect = document.querySelector<HTMLSelectElement>(
      'select[aria-label="主班备注"]',
    );
    expect(shiftRemarkSelect).toBeTruthy();
    shiftRemarkSelect!.value = '未脱钙';
    shiftRemarkSelect!.dispatchEvent(new Event('change'));
    await flushView();

    document
      .querySelector<HTMLButtonElement>('button[aria-label="保存主班备注"]')!
      .click();
    await flushView();

    expect(mockUpdateTechnicalTaskRemarks).toHaveBeenLastCalledWith('TASK-1', {
      productionRemarks: '未脱钙',
      remarks: '复核备注',
    });

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

  it('edits completed embedding slice notice and opens quality review dialog', async () => {
    const { app, root } = mountView();
    await flushView();

    expect(document.body.textContent).toContain('已包埋蜡块列表');
    expect(document.body.textContent).toContain('汇总蜡块');
    expect(findButton('确认包埋完成')).toBeTruthy();
    expect(queryButton('保存')).toBeUndefined();
    expect(
      document.querySelector<HTMLInputElement>('input[placeholder="大体所见"]')
        ?.value,
    ).toBe('汇总大体所见');

    const sliceNoticeSelect = document.querySelector(
      'select[aria-label="切片备注"]',
    ) as HTMLSelectElement;
    expect(sliceNoticeSelect).toBeTruthy();
    sliceNoticeSelect.value = '皮肤';
    sliceNoticeSelect.dispatchEvent(new Event('change'));
    await flushView();

    expect(mockUpdateEmbeddingQualityReview).toHaveBeenCalledWith('EMB-X1', {
      evaluationLevel: 'QUALIFIED',
      samplingEvaluation: '汇总评价',
      sliceNotice: '皮肤',
    });

    document
      .querySelector<HTMLButtonElement>('button[aria-label="编辑取材评价"]')!
      .click();
    await flushView();
    expect(document.body.textContent).toContain('保存评价');

    app.unmount();
    root.remove();
  });

  it('starts and completes selected embedding from the top action', async () => {
    const { app, root } = mountView();
    await flushView();

    findButton('确认包埋').click();
    await flushView();

    expect(mockStartEmbedding).toHaveBeenCalledWith({
      remarks: null,
      taskId: 'TASK-1',
      terminalCode: null,
    });
    expect(mockCompleteEmbedding).toHaveBeenCalledWith(
      expect.objectContaining({
        blockCount: 1,
        evaluationLevel: 'QUALIFIED',
        remarks: null,
        samplingBlockId: 'BLOCK-1',
        samplingEvaluation: '合格',
        taskId: 'TASK-1',
        terminalCode: null,
      }),
    );
    expect(mockGetEmbeddingWorkstationSummary).toHaveBeenCalledTimes(2);
    expect(mockListPendingTechnicalTasks).toHaveBeenCalledTimes(2);
    expect(messageSuccess).toHaveBeenCalled();

    app.unmount();
    root.remove();
  });

  it('starts and completes selected embedding from the completed-list action', async () => {
    const { app, root } = mountView();
    await flushView();

    findButton('确认包埋完成').click();
    await flushView();

    expect(mockStartEmbedding).toHaveBeenCalledWith({
      remarks: null,
      taskId: 'TASK-1',
      terminalCode: null,
    });
    expect(mockCompleteEmbedding).toHaveBeenCalledWith(
      expect.objectContaining({
        evaluationLevel: 'QUALIFIED',
        samplingBlockId: 'BLOCK-1',
        samplingEvaluation: '合格',
        taskId: 'TASK-1',
      }),
    );

    app.unmount();
    root.remove();
  });

  it('completes an in-progress selected embedding without starting it again', async () => {
    mockListPendingTechnicalTasks.mockResolvedValue({
      items: [
        createPendingTask({
          startedAt: '2026-06-01T09:00:00',
          taskStatus: 'IN_PROGRESS',
        }),
      ],
      page: 1,
      size: 20,
      total: 1,
    });

    const { app, root } = mountView();
    await flushView();

    findButton('确认包埋完成').click();
    await flushView();

    expect(mockStartEmbedding).not.toHaveBeenCalled();
    expect(mockCompleteEmbedding).toHaveBeenCalledWith(
      expect.objectContaining({
        evaluationLevel: 'QUALIFIED',
        samplingBlockId: 'BLOCK-1',
        samplingEvaluation: '合格',
        taskId: 'TASK-1',
      }),
    );

    app.unmount();
    root.remove();
  });
});
