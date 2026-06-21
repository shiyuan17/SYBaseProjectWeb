import type {
  PendingTechnicalTaskItem,
  TechnicalTrackingEmbeddingBoxSummary,
  TechnicalTrackingView,
} from '../types/technical-workflow';

import {
  createApp,
  defineComponent,
  h,
  inject,
  nextTick,
  provide,
  ref,
  watch,
} from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const tableRowsKey = Symbol('staining-table-rows');

const {
  messageSuccess,
  messageWarning,
  mockCompleteSlideStaining,
  mockGetTechnicalTracking,
  mockListPendingTechnicalTasks,
  mockRoute,
  mockStartSlideStaining,
} = vi.hoisted(() => ({
  messageSuccess: vi.fn(),
  messageWarning: vi.fn(),
  mockCompleteSlideStaining: vi.fn(),
  mockGetTechnicalTracking: vi.fn(),
  mockListPendingTechnicalTasks: vi.fn(),
  mockRoute: {
    query: {},
  } as { query: Record<string, string> },
  mockStartSlideStaining: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
}));

vi.mock('@vben/common-ui', () => ({
  Page: defineComponent({
    props: ['description', 'title'],
    setup(props, { slots }) {
      return () =>
        h('main', [
          props.title ? h('h1', props.title) : null,
          props.description ? h('p', props.description) : null,
          slots.default?.(),
        ]);
    },
  }),
}));

vi.mock('#/utils/error-feedback', () => ({
  reportInlineErrorDisabled: vi.fn(),
}));

vi.mock('../api/technical-workflow-service', () => ({
  completeSlideStaining: mockCompleteSlideStaining,
  getTechnicalTracking: mockGetTechnicalTracking,
  listPendingTechnicalTasks: mockListPendingTechnicalTasks,
  startSlideStaining: mockStartSlideStaining,
}));

vi.mock('element-plus', () => {
  const ElAlert = defineComponent({
    props: ['title'],
    setup(props) {
      return () => h('section', props.title);
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

  const ElDatePicker = defineComponent({
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h('input', {
          'data-testid': 'work-date-picker',
          placeholder: props.placeholder,
          value: props.modelValue,
          onInput: (event: Event) =>
            emit('update:modelValue', (event.target as HTMLInputElement).value),
        });
    },
  });

  const ElInput = defineComponent({
    props: ['modelValue', 'placeholder'],
    emits: ['keyup', 'update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h('input', {
          placeholder: props.placeholder,
          value: props.modelValue,
          onInput: (event: Event) =>
            emit('update:modelValue', (event.target as HTMLInputElement).value),
          onKeyup: (event: KeyboardEvent) => emit('keyup', event),
        });
    },
  });

  const ElEmpty = defineComponent({
    props: ['description'],
    setup(props) {
      return () => h('div', props.description);
    },
  });

  const ElOption = defineComponent({
    props: ['label', 'value'],
    setup(props) {
      return () => h('option', { value: props.value }, props.label);
    },
  });

  const ElPagination = defineComponent({
    emits: ['change'],
    setup() {
      return () => h('nav');
    },
  });

  const ElSelect = defineComponent({
    props: ['disabled', 'modelValue'],
    emits: ['change', 'update:modelValue'],
    setup(props, { emit, slots }) {
      return () =>
        h(
          'select',
          {
            disabled: props.disabled,
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

  const ElTable = defineComponent({
    props: ['data'],
    emits: ['row-click', 'selection-change'],
    setup(props, { emit, expose, slots }) {
      const selectedRows = ref<unknown[]>([]);

      function clearSelection() {
        selectedRows.value = [];
        emit('selection-change', []);
      }

      function toggleRowSelection(row: unknown, selected = true) {
        selectedRows.value = selected
          ? [
              ...selectedRows.value.filter(
                (selectedRow) => selectedRow !== row,
              ),
              row,
            ]
          : selectedRows.value.filter((selectedRow) => selectedRow !== row);
        emit('selection-change', selectedRows.value);
      }

      expose({
        clearSelection,
        toggleRowSelection,
      });
      watch(
        () => props.data,
        () => {
          selectedRows.value = [];
          emit('selection-change', []);
        },
      );
      provide(tableRowsKey, () => props.data ?? []);
      return () =>
        h('div', [
          slots.default?.(),
          ...(props.data ?? []).flatMap((row: any) => {
            const rowId = row.task?.id ?? row.id ?? row.slideId ?? '';
            return [
              h(
                'button',
                {
                  'data-testid': 'table-row',
                  type: 'button',
                  onClick: () => {
                    emit('row-click', row);
                  },
                },
                rowId,
              ),
              h(
                'button',
                {
                  'data-testid': `select-row-${rowId}`,
                  type: 'button',
                  onClick: () => {
                    const isSelected = selectedRows.value.includes(row);
                    toggleRowSelection(row, !isSelected);
                  },
                },
                `选择${rowId}`,
              ),
            ];
          }),
        ]);
    },
  });

  const ElTableColumn = defineComponent({
    props: ['label', 'type'],
    setup(props, { slots }) {
      const getRows = inject<() => unknown[]>(tableRowsKey, () => []);
      const renderFallbackCell = (index: number) => {
        if (props.type === 'index') {
          return String(index + 1);
        }
        return '';
      };
      return () =>
        h('section', [
          props.label ? h('strong', props.label) : null,
          ...getRows().map((row, index) =>
            h(
              'div',
              slots.default
                ? slots.default({ $index: index, row })
                : renderFallbackCell(index),
            ),
          ),
        ]);
    },
  });

  const ElTag = defineComponent({
    setup(_, { slots }) {
      return () => h('span', slots.default?.());
    },
  });

  const ElTooltip = defineComponent({
    setup(_, { slots }) {
      return () => h('span', slots.default?.());
    },
  });

  return {
    ElAlert,
    ElButton,
    ElDatePicker,
    ElEmpty,
    ElInput,
    ElMessage: {
      success: messageSuccess,
      warning: messageWarning,
    },
    ElOption,
    ElPagination,
    ElSelect,
    ElTable,
    ElTableColumn,
    ElTag,
    ElTooltip,
  };
});

import StainingWorkstationView from './StainingWorkstationView.vue';

function createTask(
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
    objectDisplayNo: 'A1',
    objectId: 'SLD-3aa4f9b-2427-413d-bf12-080de1c4a43d',
    objectType: 'SLIDE',
    pathologyNo: 'BL-001',
    patientId: 'P-001',
    patientIdDisplay: '08305',
    patientName: '患者甲',
    payload: null,
    productionRemarks: '主班备注',
    remarks: '染色备注',
    sampledAt: null,
    sampledByName: null,
    specimenId: 'SPEC-1',
    startedAt: null,
    taskStatus: 'PENDING',
    taskType: 'STAINING',
    timedOut: false,
    timeoutRuleCode: null,
    ...overrides,
  };
}

function createTracking(
  overrides: Partial<TechnicalTrackingView> = {},
): TechnicalTrackingView {
  const slideId = overrides.slides?.[0]?.slideId ?? 'SLIDE-1';
  const defaultEmbeddingBoxes: TechnicalTrackingEmbeddingBoxSummary[] = [
    {
      embeddingBoxId: 'BOX-1',
      embeddingBoxNo: 'A1',
      slideCount: 1,
      sliceNotice: null,
      specimenId: 'SPEC-1',
    },
  ];
  return {
    blocks: [],
    caseId: 'CASE-1',
    caseStatus: 'DIAGNOSIS_PENDING',
    embeddingBoxes: overrides.embeddingBoxes ?? defaultEmbeddingBoxes,
    events: [],
    pathologyNo: 'BL-001',
    qcEvaluations: [],
    reworks: [],
    slides: [
      {
        embeddingBoxId: 'BOX-1',
        qualityStatus: 'QUALIFIED',
        slideId,
        slideNo: 'SLIDE-001',
        slideStatus: 'STAINED',
        specimenId: 'SPEC-1',
      },
    ],
    specimens: [],
    technicalTasks: [
      createTask({
        assignedToName: '周永坚',
        completedAt: '2026-06-03T16:35:50',
        id: 'TASK-SLICING',
        objectId: 'BOX-1',
        objectType: 'EMBEDDING_BOX',
        startedAt: '2026-06-03T16:30:00',
        taskStatus: 'COMPLETED',
        taskType: 'SLICING',
      }),
      createTask({
        assignedToName: '周永坚',
        completedAt: '2026-06-03T16:38:32',
        id: 'TASK-STAINING',
        objectId: slideId,
        objectType: 'SLIDE',
        startedAt: '2026-06-03T16:36:00',
        taskStatus: 'COMPLETED',
        taskType: 'STAINING',
      }),
    ],
    ...overrides,
  };
}

async function flushView() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

function findButton(text: string) {
  const button = [...document.querySelectorAll('button')].find(
    (item) => item.textContent?.trim() === text,
  );
  expect(button).toBeTruthy();
  return button as HTMLButtonElement;
}

async function clickPrimaryAction() {
  findButton('染色出片(F9)').click();
  await flushView();
  await flushView();
}

function findTableRow(text: string) {
  const row = [...document.querySelectorAll('[data-testid="table-row"]')].find(
    (item) => item.textContent?.trim() === text,
  );
  expect(row).toBeTruthy();
  return row as HTMLButtonElement;
}

async function selectTableRow(rowId: string) {
  const button = document.querySelector<HTMLButtonElement>(
    `[data-testid="select-row-${rowId}"]`,
  );
  expect(button).toBeTruthy();
  button!.click();
  await flushView();
  return button!;
}

function hasTableRow(text: string) {
  return [...document.querySelectorAll('[data-testid="table-row"]')].some(
    (item) => item.textContent?.trim() === text,
  );
}

function mountView() {
  const root = document.createElement('div');
  document.body.append(root);

  const app = createApp({
    render: () => h(StainingWorkstationView),
  });
  app.directive('loading', {});
  app.mount(root);
  return { app, root };
}

describe('StainingWorkstationView', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-17T09:00:00'));
    mockRoute.query = {};
    mockListPendingTechnicalTasks.mockResolvedValue({
      items: [createTask()],
      page: 1,
      size: 20,
      total: 1,
    });
    mockGetTechnicalTracking.mockResolvedValue(createTracking());
    mockStartSlideStaining.mockResolvedValue({});
    mockCompleteSlideStaining.mockImplementation(async (payload) => ({
      caseStatus: 'DIAGNOSIS_PENDING',
      slideId: payload.slideId,
      taskId: payload.taskId,
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
    messageSuccess.mockReset();
    messageWarning.mockReset();
    mockCompleteSlideStaining.mockReset();
    mockGetTechnicalTracking.mockReset();
    mockListPendingTechnicalTasks.mockReset();
    mockStartSlideStaining.mockReset();
  });

  it('renders workstation controls, same-source stats, and patient identity', async () => {
    const { app, root } = mountView();
    await flushView();

    expect(document.body.textContent).toContain('染色出片(F9)');
    expect(
      document.querySelector('input[placeholder="病人ID/病理号"]'),
    ).toBeTruthy();
    expect(document.body.textContent).toContain('待出片列表');
    expect(document.body.textContent).toContain('已完成出片');
    expect(document.body.textContent).toContain('本次暂无已完成出片记录');
    expect(document.body.textContent).toContain('A1');
    expect(document.body.textContent).not.toContain('SLIDE-001');
    expect(document.body.textContent).not.toContain(
      'SLD-3aa4f9b-2427-413d-bf12-080de1c4a43d',
    );
    expect(document.body.textContent).toContain('患者甲');
    expect(
      [...document.querySelectorAll('.legacy-stat-card__label')].map((item) =>
        item.textContent?.trim(),
      ),
    ).toEqual(['待染色', '超时', '完成']);
    expect(
      [...document.querySelectorAll('.legacy-stat-card__value')].map((item) =>
        item.textContent?.trim(),
      ),
    ).toEqual(['1', '0', '0']);
    expect(document.body.textContent).not.toContain('待染色总数');
    expect(document.body.textContent).not.toContain('染色中');
    expect(document.body.textContent).not.toContain('待开始');
    expect(document.body.textContent).not.toContain('超时风险');
    expect(document.body.textContent).not.toContain('未出片');
    expect(mockGetTechnicalTracking).not.toHaveBeenCalled();
    expect(findButton('扫码清零').disabled).toBe(true);
    expect(findButton('打印清零码').disabled).toBe(true);

    app.unmount();
    root.remove();
  });

  it('keeps slide object id for staining actions while displaying block number', async () => {
    mockListPendingTechnicalTasks.mockResolvedValue({
      items: [
        createTask({
          objectDisplayNo: 'A2',
          objectId: 'SLD-action-slide-id',
          taskStatus: 'IN_PROGRESS',
        }),
      ],
      page: 1,
      size: 20,
      total: 1,
    });

    const { app, root } = mountView();
    await flushView();

    expect(document.body.textContent).toContain('A2');
    expect(document.body.textContent).not.toContain('SLD-action-slide-id');

    await selectTableRow('TASK-1');
    await clickPrimaryAction();

    expect(document.body.textContent).not.toContain('染色处理');
    expect(mockCompleteSlideStaining).toHaveBeenCalledWith({
      qualityIssue: null,
      remarks: null,
      slideId: 'SLD-action-slide-id',
      stainingType: 'HE',
      taskId: 'TASK-1',
      terminalCode: null,
    });

    app.unmount();
    root.remove();
  });

  it('formats completed slide operation fallback statuses in Chinese', async () => {
    mockListPendingTechnicalTasks.mockResolvedValue({
      items: [createTask({ objectId: 'SLIDE-1', taskStatus: 'IN_PROGRESS' })],
      page: 1,
      size: 20,
      total: 1,
    });
    mockGetTechnicalTracking.mockResolvedValue({
      ...createTracking(),
      slides: [
        {
          embeddingBoxId: 'BOX-1',
          qualityStatus: 'CREATED',
          slideId: 'SLIDE-1',
          slideNo: 'SLIDE-001',
          slideStatus: 'PENDING',
          specimenId: 'SPEC-1',
        },
      ],
      technicalTasks: [],
    });

    const { app, root } = mountView();
    await flushView();

    await selectTableRow('TASK-1');
    await clickPrimaryAction();

    expect(document.body.textContent).toContain('待质控');
    expect(document.body.textContent).toContain('待染色');
    expect(document.body.textContent).not.toContain('CREATED');
    expect(document.body.textContent).not.toContain('PENDING');

    app.unmount();
    root.remove();
  });

  it('prefers short display number for completed rows instead of tracking slide serial', async () => {
    mockListPendingTechnicalTasks.mockResolvedValue({
      items: [
        createTask({
          objectDisplayNo: 'A1',
          objectId: 'SLIDE-1',
          taskStatus: 'IN_PROGRESS',
        }),
      ],
      page: 1,
      size: 20,
      total: 1,
    });
    mockGetTechnicalTracking.mockResolvedValue(
      createTracking({
        slides: [
          {
            embeddingBoxId: 'BOX-1',
            qualityStatus: 'QUALIFIED',
            slideId: 'SLIDE-1',
            slideNo: 'SL20260619001',
            slideStatus: 'STAINED',
            specimenId: 'SPEC-1',
          },
        ],
      }),
    );

    const { app, root } = mountView();
    await flushView();

    await selectTableRow('TASK-1');
    await clickPrimaryAction();

    expect(document.body.textContent).toContain('A1');
    expect(document.body.textContent).not.toContain('SL20260619001');

    app.unmount();
    root.remove();
  });

  it('shows merged short display number with hyphen in pending and completed areas', async () => {
    mockListPendingTechnicalTasks.mockResolvedValue({
      items: [
        createTask({
          objectDisplayNo: 'A1+A2',
          objectId: 'SLIDE-1',
          samplingBlockCode: 'A1+A2',
          taskStatus: 'IN_PROGRESS',
        }),
      ],
      page: 1,
      size: 20,
      total: 1,
    });
    mockGetTechnicalTracking.mockResolvedValue(
      createTracking({
        embeddingBoxes: [
          {
            embeddingBoxId: 'BOX-1',
            embeddingBoxNo: 'A1+A2',
            slideCount: 2,
            sliceNotice: null,
            specimenId: 'SPEC-1',
          },
        ],
        slides: [
          {
            embeddingBoxId: 'BOX-1',
            qualityStatus: 'QUALIFIED',
            slideId: 'SLIDE-1',
            slideNo: 'SL20260619001',
            slideStatus: 'STAINED',
            specimenId: 'SPEC-1',
          },
        ],
      }),
    );

    const { app, root } = mountView();
    await flushView();

    expect(document.body.textContent).toContain('A1-A2');
    expect(document.body.textContent).not.toContain('A1+A2');

    await selectTableRow('TASK-1');
    await clickPrimaryAction();

    expect(document.body.textContent).toContain('A1-A2');
    expect(document.body.textContent).not.toContain('A1+A2');
    expect(document.body.textContent).not.toContain('SL20260619001');

    app.unmount();
    root.remove();
  });

  it('keeps completed slides accumulated when switching pending tasks', async () => {
    const firstTask = createTask({
      id: 'TASK-1',
      objectDisplayNo: 'SLIDE-001',
      objectId: 'SLIDE-1',
      taskStatus: 'IN_PROGRESS',
    });
    const secondTask = createTask({
      caseId: 'CASE-2',
      id: 'TASK-2',
      objectDisplayNo: 'SLIDE-002',
      objectId: 'SLIDE-2',
      pathologyNo: 'BL-002',
      patientId: 'P-002',
      patientIdDisplay: '08306',
      patientName: '患者乙',
      taskStatus: 'IN_PROGRESS',
    });

    mockListPendingTechnicalTasks.mockResolvedValue({
      items: [firstTask, secondTask],
      page: 1,
      size: 20,
      total: 2,
    });
    mockGetTechnicalTracking.mockImplementation(async (caseId: string) =>
      caseId === 'CASE-2'
        ? createTracking({
            caseId: 'CASE-2',
            pathologyNo: 'BL-002',
            slides: [
              {
                embeddingBoxId: 'BOX-2',
                qualityStatus: 'QUALIFIED',
                slideId: 'SLIDE-2',
                slideNo: 'SLIDE-002',
                slideStatus: 'STAINED',
                specimenId: 'SPEC-2',
              },
            ],
          })
        : createTracking({
            slides: [
              {
                embeddingBoxId: 'BOX-1',
                qualityStatus: 'QUALIFIED',
                slideId: 'SLIDE-1',
                slideNo: 'SLIDE-001',
                slideStatus: 'STAINED',
                specimenId: 'SPEC-1',
              },
            ],
          }),
    );

    const { app, root } = mountView();
    await flushView();

    await selectTableRow('TASK-1');
    await clickPrimaryAction();

    expect(hasTableRow('SLIDE-1')).toBe(true);
    expect(hasTableRow('SLIDE-2')).toBe(false);
    expect(mockGetTechnicalTracking).toHaveBeenCalledTimes(1);

    findTableRow('TASK-2').click();
    await flushView();

    expect(document.body.textContent).toContain('SLIDE-001');
    expect(mockGetTechnicalTracking).toHaveBeenCalledTimes(1);

    await selectTableRow('TASK-2');
    await clickPrimaryAction();

    expect(hasTableRow('SLIDE-1')).toBe(true);
    expect(hasTableRow('SLIDE-2')).toBe(true);
    expect(document.body.textContent).toContain('BL-001');
    expect(document.body.textContent).toContain('BL-002');
    expect(
      [...document.querySelectorAll('.legacy-stat-card__value')].map((item) =>
        item.textContent?.trim(),
      ),
    ).toEqual(['2', '0', '2']);

    app.unmount();
    root.remove();
  });

  it('queries staining tasks with keyword and overdue mode', async () => {
    mockRoute.query = {
      mode: 'exception',
      pathologyNo: 'BL-ROUTE',
    };
    const { app, root } = mountView();
    await flushView();

    expect(mockListPendingTechnicalTasks).toHaveBeenLastCalledWith({
      keyword: 'BL-ROUTE',
      page: 1,
      size: 20,
      taskType: 'STAINING',
      timedOutOnly: true,
    });

    const input = document.querySelector<HTMLInputElement>(
      'input[placeholder="病人ID/病理号"]',
    );
    expect(input).toBeTruthy();
    input!.value = 'BL-QUERY';
    input!.dispatchEvent(new Event('input'));
    await nextTick();
    findButton('查询').click();
    await flushView();

    expect(mockListPendingTechnicalTasks).toHaveBeenLastCalledWith({
      keyword: 'BL-QUERY',
      page: 1,
      size: 20,
      taskType: 'STAINING',
      timedOutOnly: true,
    });

    app.unmount();
    root.remove();
  });

  it('records selected tasks directly by F9 and primary action without dialogs', async () => {
    const { app, root } = mountView();
    await flushView();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F9' }));
    await flushView();

    expect(messageWarning).toHaveBeenCalledWith('请先从左侧勾选待出片玻片');
    expect(document.body.textContent).not.toContain('开始染色');
    expect(document.body.textContent).not.toContain('染色处理');
    expect(mockStartSlideStaining).not.toHaveBeenCalled();
    expect(mockCompleteSlideStaining).not.toHaveBeenCalled();

    await selectTableRow('TASK-1');
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F9' }));
    await flushView();

    expect(mockStartSlideStaining).toHaveBeenCalledWith({
      remarks: null,
      taskId: 'TASK-1',
      terminalCode: null,
    });
    expect(mockCompleteSlideStaining).toHaveBeenCalledWith({
      qualityIssue: null,
      remarks: null,
      slideId: 'SLD-3aa4f9b-2427-413d-bf12-080de1c4a43d',
      stainingType: 'HE',
      taskId: 'TASK-1',
      terminalCode: null,
    });

    app.unmount();
    root.remove();

    mockListPendingTechnicalTasks.mockResolvedValue({
      items: [createTask({ id: 'TASK-2', taskStatus: 'IN_PROGRESS' })],
      page: 1,
      size: 20,
      total: 1,
    });

    const second = mountView();
    await flushView();

    await selectTableRow('TASK-2');
    await clickPrimaryAction();

    expect(document.body.textContent).not.toContain('染色处理');
    expect(mockCompleteSlideStaining).toHaveBeenLastCalledWith({
      qualityIssue: null,
      remarks: null,
      slideId: 'SLD-3aa4f9b-2427-413d-bf12-080de1c4a43d',
      stainingType: 'HE',
      taskId: 'TASK-2',
      terminalCode: null,
    });

    second.app.unmount();
    second.root.remove();
  });

  it('clears session completed rows when re-querying', async () => {
    mockListPendingTechnicalTasks.mockResolvedValue({
      items: [createTask({ objectId: 'SLIDE-1', taskStatus: 'IN_PROGRESS' })],
      page: 1,
      size: 20,
      total: 1,
    });
    const { app, root } = mountView();
    await flushView();

    await selectTableRow('TASK-1');
    await clickPrimaryAction();
    expect(hasTableRow('SLIDE-1')).toBe(true);

    findButton('查询').click();
    await flushView();
    expect(hasTableRow('SLIDE-1')).toBe(false);

    app.unmount();
    root.remove();
  });

  it('records multiple selected staining tasks in one action', async () => {
    const firstTask = createTask({
      id: 'TASK-1',
      objectDisplayNo: 'SLIDE-001',
      objectId: 'SLIDE-1',
      taskStatus: 'IN_PROGRESS',
    });
    const secondTask = createTask({
      caseId: 'CASE-2',
      id: 'TASK-2',
      objectDisplayNo: 'SLIDE-002',
      objectId: 'SLIDE-2',
      pathologyNo: 'BL-002',
      patientId: 'P-002',
      patientIdDisplay: '08306',
      patientName: '患者乙',
      taskStatus: 'PENDING',
    });

    mockListPendingTechnicalTasks.mockResolvedValue({
      items: [firstTask, secondTask],
      page: 1,
      size: 20,
      total: 2,
    });
    mockGetTechnicalTracking.mockImplementation(async (caseId: string) =>
      caseId === 'CASE-2'
        ? createTracking({
            caseId: 'CASE-2',
            pathologyNo: 'BL-002',
            slides: [
              {
                embeddingBoxId: 'BOX-2',
                qualityStatus: 'QUALIFIED',
                slideId: 'SLIDE-2',
                slideNo: 'SLIDE-002',
                slideStatus: 'STAINED',
                specimenId: 'SPEC-2',
              },
            ],
          })
        : createTracking({
            slides: [
              {
                embeddingBoxId: 'BOX-1',
                qualityStatus: 'QUALIFIED',
                slideId: 'SLIDE-1',
                slideNo: 'SLIDE-001',
                slideStatus: 'STAINED',
                specimenId: 'SPEC-1',
              },
            ],
          }),
    );

    const { app, root } = mountView();
    await flushView();

    await selectTableRow('TASK-1');
    await selectTableRow('TASK-2');
    await clickPrimaryAction();

    expect(mockStartSlideStaining).toHaveBeenCalledTimes(1);
    expect(mockStartSlideStaining).toHaveBeenCalledWith({
      remarks: null,
      taskId: 'TASK-2',
      terminalCode: null,
    });
    expect(mockCompleteSlideStaining).toHaveBeenCalledTimes(2);
    expect(mockCompleteSlideStaining).toHaveBeenNthCalledWith(1, {
      qualityIssue: null,
      remarks: null,
      slideId: 'SLIDE-1',
      stainingType: 'HE',
      taskId: 'TASK-1',
      terminalCode: null,
    });
    expect(mockCompleteSlideStaining).toHaveBeenNthCalledWith(2, {
      qualityIssue: null,
      remarks: null,
      slideId: 'SLIDE-2',
      stainingType: 'HE',
      taskId: 'TASK-2',
      terminalCode: null,
    });
    expect(hasTableRow('SLIDE-1')).toBe(true);
    expect(hasTableRow('SLIDE-2')).toBe(true);
    expect(messageSuccess).toHaveBeenCalledWith('已记录染色出片 2 条');

    app.unmount();
    root.remove();
  });

  it('warns when selected task status or slide id cannot be processed', async () => {
    mockListPendingTechnicalTasks.mockResolvedValue({
      items: [
        createTask({
          id: 'TASK-DONE',
          taskStatus: 'COMPLETED',
        }),
      ],
      page: 1,
      size: 20,
      total: 1,
    });

    const { app, root } = mountView();
    await flushView();

    await selectTableRow('TASK-DONE');
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F9' }));
    await flushView();

    expect(messageWarning).toHaveBeenCalledWith('当前任务状态不支持染色出片');
    expect(mockCompleteSlideStaining).not.toHaveBeenCalled();

    app.unmount();
    root.remove();

    mockListPendingTechnicalTasks.mockResolvedValue({
      items: [
        createTask({
          id: 'TASK-NO-SLIDE',
          objectId: '',
          taskStatus: 'IN_PROGRESS',
        }),
      ],
      page: 1,
      size: 20,
      total: 1,
    });

    const second = mountView();
    await flushView();

    await selectTableRow('TASK-NO-SLIDE');
    await clickPrimaryAction();

    expect(messageWarning).toHaveBeenCalledWith('当前任务缺少玻片编号');
    expect(mockCompleteSlideStaining).not.toHaveBeenCalled();

    second.app.unmount();
    second.root.remove();
  });

  it('keeps successful rows and reports partial failures', async () => {
    const firstTask = createTask({
      id: 'TASK-OK',
      objectDisplayNo: 'SLIDE-OK',
      objectId: 'SLIDE-OK',
      taskStatus: 'IN_PROGRESS',
    });
    const secondTask = createTask({
      id: 'TASK-FAIL',
      objectDisplayNo: 'SLIDE-FAIL',
      objectId: 'SLIDE-FAIL',
      taskStatus: 'IN_PROGRESS',
    });

    mockListPendingTechnicalTasks.mockResolvedValue({
      items: [firstTask, secondTask],
      page: 1,
      size: 20,
      total: 2,
    });
    mockCompleteSlideStaining.mockImplementation(async (payload) => {
      if (payload.taskId === 'TASK-FAIL') {
        throw new Error('接口失败');
      }
      return {
        caseStatus: 'DIAGNOSIS_PENDING',
        slideId: payload.slideId,
        taskId: payload.taskId,
      };
    });
    mockGetTechnicalTracking.mockResolvedValue(
      createTracking({
        slides: [
          {
            embeddingBoxId: 'BOX-1',
            qualityStatus: 'QUALIFIED',
            slideId: 'SLIDE-OK',
            slideNo: 'SLIDE-OK',
            slideStatus: 'STAINED',
            specimenId: 'SPEC-1',
          },
        ],
      }),
    );

    const { app, root } = mountView();
    await flushView();

    await selectTableRow('TASK-OK');
    await selectTableRow('TASK-FAIL');
    await clickPrimaryAction();

    expect(hasTableRow('SLIDE-OK')).toBe(true);
    expect(hasTableRow('SLIDE-FAIL')).toBe(false);
    expect(messageWarning).toHaveBeenCalledWith('已记录 1 条，1 条失败');
    expect(document.body.textContent).toContain('接口失败');

    app.unmount();
    root.remove();
  });
});
