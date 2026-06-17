import type { PendingTechnicalTaskItem } from '../types/technical-workflow';

import { createApp, defineComponent, h, inject, nextTick, provide } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const tableRowsKey = Symbol('dehydration-table-rows');

const {
  mockCompleteDehydration,
  mockListPendingTechnicalTasks,
  mockMessageSuccess,
  mockMessageWarning,
  mockRoute,
  mockStartDehydration,
} = vi.hoisted(() => ({
  mockCompleteDehydration: vi.fn(),
  mockListPendingTechnicalTasks: vi.fn(),
  mockMessageSuccess: vi.fn(),
  mockMessageWarning: vi.fn(),
  mockRoute: {
    query: {},
  } as { query: Record<string, string> },
  mockStartDehydration: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({}),
}));

vi.mock('@vben/common-ui', () => ({
  Page: defineComponent({
    setup(_, { slots }) {
      return () => h('main', slots.default?.());
    },
  }),
}));

vi.mock('#/utils/error-feedback', () => ({
  reportInlineErrorDisabled: vi.fn(),
}));

vi.mock('../api/technical-workflow-service', () => ({
  completeDehydration: mockCompleteDehydration,
  listPendingTechnicalTasks: mockListPendingTechnicalTasks,
  startDehydration: mockStartDehydration,
}));

vi.mock('element-plus', () => {
  const passthrough = defineComponent({
    props: ['label', 'title'],
    setup(props, { attrs, slots }) {
      return () =>
        h('div', attrs, [
          props.title ? h('strong', String(props.title)) : null,
          props.label ? h('span', String(props.label)) : null,
          slots.default?.(),
        ]);
    },
  });

  const ElBadge = defineComponent({
    setup(_, { slots }) {
      return () => h('span', slots.default?.());
    },
  });

  const ElButton = defineComponent({
    props: ['disabled', 'loading', 'type'],
    emits: ['click'],
    setup(props, { attrs, emit, slots }) {
      const resolvedType =
        (attrs['native-type'] as string | undefined) ?? props.type ?? 'button';
      return () =>
        h(
          'button',
          {
            ...attrs,
            disabled: Boolean(props.disabled || props.loading),
            type: resolvedType,
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
    emits: ['keydown', 'keyup', 'update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h('input', {
          placeholder: props.placeholder,
          value: props.modelValue,
          onInput: (event: Event) =>
            emit('update:modelValue', (event.target as HTMLInputElement).value),
          onKeydown: (event: KeyboardEvent) => emit('keydown', event),
          onKeyup: (event: KeyboardEvent) => emit('keyup', event),
        });
    },
  });

  const ElPagination = defineComponent({
    emits: ['change'],
    setup() {
      return () => h('nav');
    },
  });

  const ElTable = defineComponent({
    props: ['data', 'rowClassName'],
    emits: ['current-change', 'selection-change'],
    setup(props, { emit, slots }) {
      provide(tableRowsKey, () => props.data ?? []);
      const resolveRowClassName = (row: PendingTechnicalTaskItem) => {
        if (typeof props.rowClassName !== 'function') {
          return '';
        }
        return props.rowClassName({ row });
      };
      return () =>
        h('div', [
          slots.default?.(),
          h(
            'button',
            {
              'data-testid': 'select-all',
              type: 'button',
              onClick: () => emit('selection-change', props.data ?? []),
            },
            'select all',
          ),
          ...(props.data ?? []).map((row: PendingTechnicalTaskItem) =>
            h(
              'button',
              {
                class: resolveRowClassName(row),
                'data-testid': 'task-row',
                type: 'button',
                onClick: () => {
                  emit('selection-change', [row]);
                  emit('current-change', row);
                },
              },
              row.id,
            ),
          ),
        ]);
    },
  });

  const ElTableColumn = defineComponent({
    props: ['label', 'type'],
    setup(props, { slots }) {
      const getRows = inject<() => PendingTechnicalTaskItem[]>(
        tableRowsKey,
        () => [],
      );
      return () =>
        h('section', { 'data-column-label': props.label ?? props.type ?? '' }, [
          props.label ? h('strong', String(props.label)) : null,
          ...getRows().map((row, index) => {
            const cellContent = slots.default
              ? slots.default({ $index: index, row })
              : '';
            return h('div', cellContent);
          }),
        ]);
    },
  });

  const ElTag = defineComponent({
    setup(_, { slots }) {
      return () => h('span', slots.default?.());
    },
  });

  return {
    ElAlert: passthrough,
    ElBadge,
    ElButton,
    ElDatePicker,
    ElForm: defineComponent({
      setup(_, { attrs, slots }) {
        return () => h('form', attrs, slots.default?.());
      },
    }),
    ElFormItem: passthrough,
    ElInput,
    ElMessage: {
      success: mockMessageSuccess,
      warning: mockMessageWarning,
    },
    ElPagination,
    ElTable,
    ElTableColumn,
    ElTag,
  };
});

import DehydrationWorkstationView from './DehydrationWorkstationView.vue';

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
    objectId: 'BLOCK-1',
    objectType: 'SAMPLING_BLOCK',
    pathologyNo: 'BL-001',
    payload: null,
    remarks: null,
    sampledAt: '2026-06-01T09:00:00',
    sampledByName: '取材员',
    samplingBlockCode: 'BK-001',
    samplingBlockDescription: '蜡块一',
    specimenId: 'SPEC-1',
    startedAt: null,
    taskStatus: 'PENDING',
    taskType: 'DEHYDRATION',
    timedOut: false,
    timeoutRuleCode: null,
    ...overrides,
  };
}

async function flushView() {
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

function scanPathologyNo(pathologyNo: string) {
  const input = document.querySelector<HTMLInputElement>(
    'input[placeholder="请输入病理号"]',
  );
  expect(input).toBeTruthy();
  input!.value = pathologyNo;
  input!.dispatchEvent(new InputEvent('input', { bubbles: true }));
  input!.dispatchEvent(
    new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }),
  );
}

function mountView(query?: Record<string, string>) {
  query ??= { pathologyNo: 'BL-001' };
  mockRoute.query = query;
  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp(DehydrationWorkstationView);
  app.directive('loading', {});
  app.mount(root);
  return { app, root };
}

describe('DehydrationWorkstationView', () => {
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
    mockStartDehydration.mockResolvedValue({});
    mockCompleteDehydration.mockResolvedValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
    mockCompleteDehydration.mockReset();
    mockListPendingTechnicalTasks.mockReset();
    mockMessageSuccess.mockReset();
    mockMessageWarning.mockReset();
    mockStartDehydration.mockReset();
  });

  it('keeps the ordinary entry empty until the user queries', async () => {
    const { app } = mountView({});
    await flushView();

    expect(mockListPendingTechnicalTasks).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain('开始脱水');

    app.unmount();
  });

  it('allows date-only query and sends work-date range', async () => {
    const { app } = mountView({});
    await flushView();

    const queryButton = findButton('查询');
    queryButton.click();
    await flushView();

    expect(mockListPendingTechnicalTasks).toHaveBeenCalledWith(
      expect.objectContaining({
        createdFrom: '2026-06-17T00:00:00',
        createdTo: '2026-06-18T00:00:00',
        pathologyNo: undefined,
        taskType: 'DEHYDRATION',
      }),
    );

    app.unmount();
  });

  it('renders dehydration controls without operation column', async () => {
    const { app } = mountView();
    await flushView();

    expect(mockListPendingTechnicalTasks).toHaveBeenCalledWith(
      expect.objectContaining({
        includeAllStatuses: true,
        pathologyNo: 'BL-001',
        taskType: 'DEHYDRATION',
      }),
    );
    expect(document.body.textContent).toContain('开始脱水');
    expect(document.body.textContent).toContain('脱水完成');
    expect(document.body.textContent).toContain('脱水开始时间');
    expect(document.body.textContent).toContain('脱水完成时间');
    expect(document.body.textContent).not.toContain('执行脱水');
    expect(document.body.textContent).not.toContain('创建批次');
    expect(document.body.textContent).not.toContain('批次操作');
    expect(document.body.textContent).not.toContain('脱水追踪');
    expect(document.body.textContent).not.toContain('异常任务');
    expect(document.querySelector('[data-column-label="操作"]')).toBeFalsy();

    app.unmount();
  });

  it('applies row tone classes by dehydration task status', async () => {
    mockListPendingTechnicalTasks.mockResolvedValue({
      items: [
        createTask({ id: 'TASK-PENDING', taskStatus: 'PENDING' }),
        createTask({
          id: 'TASK-IN-PROGRESS',
          startedAt: '2026-06-01T10:00:00',
          taskStatus: 'IN_PROGRESS',
        }),
        createTask({
          completedAt: '2026-06-01T11:00:00',
          id: 'TASK-COMPLETED',
          taskStatus: 'COMPLETED',
        }),
        createTask({
          id: 'TASK-TIMED-OUT',
          taskStatus: 'PENDING',
          timedOut: true,
        }),
      ],
      page: 1,
      size: 20,
      total: 4,
    });
    const { app } = mountView();
    await flushView();

    const rows = [
      ...document.querySelectorAll<HTMLButtonElement>(
        '[data-testid="task-row"]',
      ),
    ];
    expect(rows.map((row) => row.className)).toEqual([
      'specimen-workflow-row--actionable',
      'specimen-workflow-row--in-progress',
      'specimen-workflow-row--completed',
      'specimen-workflow-row--failed',
    ]);

    app.unmount();
  });
  it('starts the selected pending dehydration task directly', async () => {
    const { app } = mountView();
    await flushView();

    findButton('开始脱水').click();
    await flushView();

    expect(mockStartDehydration).toHaveBeenCalledWith({
      taskId: 'TASK-1',
    });
    expect(mockMessageSuccess).toHaveBeenCalledWith('任务 TASK-1 已开始脱水');
    expect(mockListPendingTechnicalTasks).toHaveBeenCalledTimes(2);

    app.unmount();
  });

  it('starts a single pending dehydration task after scanning pathology no', async () => {
    const { app } = mountView({});
    await flushView();

    scanPathologyNo('BL-SCAN');
    await flushView();

    expect(mockListPendingTechnicalTasks).toHaveBeenCalledTimes(2);
    expect(mockListPendingTechnicalTasks).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        createdFrom: '2026-06-17T00:00:00',
        createdTo: '2026-06-18T00:00:00',
        includeAllStatuses: true,
        pathologyNo: 'BL-SCAN',
        taskType: 'DEHYDRATION',
      }),
    );
    expect(mockStartDehydration).toHaveBeenCalledWith({
      taskId: 'TASK-1',
    });
    expect(mockMessageSuccess).toHaveBeenCalledWith('任务 TASK-1 已开始脱水');

    app.unmount();
  });

  it('starts the first current task after scanning a pathology no with multiple rows', async () => {
    mockListPendingTechnicalTasks.mockResolvedValue({
      items: [
        createTask({ id: 'TASK-FIRST' }),
        createTask({ id: 'TASK-SECOND', objectId: 'BLOCK-2' }),
      ],
      page: 1,
      size: 20,
      total: 2,
    });
    const { app } = mountView({});
    await flushView();

    scanPathologyNo('BL-MULTI');
    await flushView();

    expect(mockStartDehydration).toHaveBeenCalledTimes(1);
    expect(mockStartDehydration).toHaveBeenCalledWith({
      taskId: 'TASK-FIRST',
    });
    expect(mockMessageSuccess).toHaveBeenCalledWith(
      '任务 TASK-FIRST 已开始脱水',
    );

    app.unmount();
  });

  it('queries completed dehydration history by scan and blocks repeat start', async () => {
    mockListPendingTechnicalTasks.mockResolvedValue({
      items: [
        createTask({
          completedAt: '2026-06-01T11:00:00',
          id: 'TASK-DONE',
          taskStatus: 'COMPLETED',
        }),
      ],
      page: 1,
      size: 20,
      total: 1,
    });
    const { app } = mountView({});
    await flushView();

    scanPathologyNo('BL-DONE');
    await flushView();

    expect(mockListPendingTechnicalTasks).toHaveBeenLastCalledWith(
      expect.objectContaining({
        includeAllStatuses: true,
        pathologyNo: 'BL-DONE',
        taskType: 'DEHYDRATION',
      }),
    );
    expect(document.body.textContent).toContain('已完成');
    expect(mockStartDehydration).not.toHaveBeenCalled();
    expect(mockMessageWarning).toHaveBeenCalledWith('仅待处理任务可以开始脱水');

    app.unmount();
  });

  it('clears rows and skips start when scan input is blank', async () => {
    const { app } = mountView();
    await flushView();
    mockListPendingTechnicalTasks.mockClear();

    scanPathologyNo('   ');
    await flushView();

    expect(mockListPendingTechnicalTasks).not.toHaveBeenCalled();
    expect(mockStartDehydration).not.toHaveBeenCalled();

    app.unmount();
  });

  it('starts all selected pending dehydration tasks directly', async () => {
    mockListPendingTechnicalTasks.mockResolvedValue({
      items: [
        createTask({ id: 'TASK-1' }),
        createTask({ id: 'TASK-2', objectId: 'BLOCK-2' }),
      ],
      page: 1,
      size: 20,
      total: 2,
    });
    const { app } = mountView();
    await flushView();

    document
      .querySelector<HTMLButtonElement>('[data-testid="select-all"]')
      ?.click();
    await flushView();
    findButton('开始脱水').click();
    await flushView();

    expect(mockStartDehydration).toHaveBeenCalledTimes(2);
    expect(mockStartDehydration).toHaveBeenNthCalledWith(1, {
      taskId: 'TASK-1',
    });
    expect(mockStartDehydration).toHaveBeenNthCalledWith(2, {
      taskId: 'TASK-2',
    });
    expect(mockMessageSuccess).toHaveBeenCalledWith('已开始脱水 2 条任务');
    expect(mockListPendingTechnicalTasks).toHaveBeenCalledTimes(2);

    app.unmount();
  });

  it('starts selected pending dehydration tasks while skipping already started and completed rows', async () => {
    mockListPendingTechnicalTasks.mockResolvedValue({
      items: [
        createTask({ id: 'TASK-PENDING' }),
        createTask({
          id: 'TASK-IN-PROGRESS',
          objectId: 'BLOCK-2',
          startedAt: '2026-06-01T10:00:00',
          taskStatus: 'IN_PROGRESS',
        }),
        createTask({
          completedAt: '2026-06-01T11:00:00',
          id: 'TASK-COMPLETED',
          objectId: 'BLOCK-3',
          taskStatus: 'COMPLETED',
        }),
      ],
      page: 1,
      size: 20,
      total: 3,
    });
    const { app } = mountView();
    await flushView();

    document
      .querySelector<HTMLButtonElement>('[data-testid="select-all"]')
      ?.click();
    await flushView();
    findButton('开始脱水').click();
    await flushView();

    expect(mockStartDehydration).toHaveBeenCalledTimes(1);
    expect(mockStartDehydration).toHaveBeenCalledWith({
      taskId: 'TASK-PENDING',
    });
    expect(mockMessageSuccess).toHaveBeenCalledWith(
      '已开始脱水 1 条任务，跳过 2 条',
    );
    expect(mockListPendingTechnicalTasks).toHaveBeenCalledTimes(2);

    app.unmount();
  });

  it('completes the selected in-progress dehydration task directly', async () => {
    mockListPendingTechnicalTasks.mockResolvedValue({
      items: [
        createTask({
          id: 'TASK-2',
          startedAt: '2026-06-01T10:00:00',
          taskStatus: 'IN_PROGRESS',
        }),
      ],
      page: 1,
      size: 20,
      total: 1,
    });
    const { app } = mountView();
    await flushView();

    findButton('脱水完成').click();
    await flushView();

    expect(mockCompleteDehydration).toHaveBeenCalledWith({
      taskId: 'TASK-2',
    });
    expect(mockMessageSuccess).toHaveBeenCalledWith('任务 TASK-2 已完成脱水');
    expect(mockListPendingTechnicalTasks).toHaveBeenCalledTimes(2);

    app.unmount();
  });

  it('starts and completes a selected pending dehydration task from the complete action', async () => {
    const { app } = mountView();
    await flushView();

    findButton('脱水完成').click();
    await flushView();

    expect(mockStartDehydration).toHaveBeenCalledWith({
      taskId: 'TASK-1',
    });
    expect(mockCompleteDehydration).toHaveBeenCalledWith({
      taskId: 'TASK-1',
    });
    expect(mockStartDehydration.mock.invocationCallOrder[0]).toBeLessThan(
      mockCompleteDehydration.mock.invocationCallOrder[0]!,
    );
    expect(mockMessageSuccess).toHaveBeenCalledWith('任务 TASK-1 已完成脱水');
    expect(mockListPendingTechnicalTasks).toHaveBeenCalledTimes(2);

    app.unmount();
  });

  it('completes all selected in-progress dehydration tasks directly', async () => {
    mockListPendingTechnicalTasks.mockResolvedValue({
      items: [
        createTask({
          id: 'TASK-2',
          startedAt: '2026-06-01T10:00:00',
          taskStatus: 'IN_PROGRESS',
        }),
        createTask({
          id: 'TASK-3',
          objectId: 'BLOCK-3',
          startedAt: '2026-06-01T10:05:00',
          taskStatus: 'IN_PROGRESS',
        }),
      ],
      page: 1,
      size: 20,
      total: 2,
    });
    const { app } = mountView();
    await flushView();

    document
      .querySelector<HTMLButtonElement>('[data-testid="select-all"]')
      ?.click();
    await flushView();
    findButton('脱水完成').click();
    await flushView();

    expect(mockCompleteDehydration).toHaveBeenCalledTimes(2);
    expect(mockCompleteDehydration).toHaveBeenNthCalledWith(1, {
      taskId: 'TASK-2',
    });
    expect(mockCompleteDehydration).toHaveBeenNthCalledWith(2, {
      taskId: 'TASK-3',
    });
    expect(mockMessageSuccess).toHaveBeenCalledWith('已完成脱水 2 条任务');
    expect(mockListPendingTechnicalTasks).toHaveBeenCalledTimes(2);

    app.unmount();
  });

  it('completes selected pending and in-progress dehydration tasks while skipping completed rows', async () => {
    mockListPendingTechnicalTasks.mockResolvedValue({
      items: [
        createTask({ id: 'TASK-PENDING' }),
        createTask({
          id: 'TASK-IN-PROGRESS',
          objectId: 'BLOCK-2',
          startedAt: '2026-06-01T10:00:00',
          taskStatus: 'IN_PROGRESS',
        }),
        createTask({
          completedAt: '2026-06-01T11:00:00',
          id: 'TASK-COMPLETED',
          objectId: 'BLOCK-3',
          taskStatus: 'COMPLETED',
        }),
      ],
      page: 1,
      size: 20,
      total: 3,
    });
    const { app } = mountView();
    await flushView();

    document
      .querySelector<HTMLButtonElement>('[data-testid="select-all"]')
      ?.click();
    await flushView();
    findButton('脱水完成').click();
    await flushView();

    expect(mockStartDehydration).toHaveBeenCalledTimes(1);
    expect(mockStartDehydration).toHaveBeenCalledWith({
      taskId: 'TASK-PENDING',
    });
    expect(mockCompleteDehydration).toHaveBeenCalledTimes(2);
    expect(mockCompleteDehydration).toHaveBeenCalledWith({
      taskId: 'TASK-PENDING',
    });
    expect(mockCompleteDehydration).toHaveBeenCalledWith({
      taskId: 'TASK-IN-PROGRESS',
    });
    const pendingCompleteCallIndex =
      mockCompleteDehydration.mock.calls.findIndex(
        ([payload]) => payload.taskId === 'TASK-PENDING',
      );
    expect(mockStartDehydration.mock.invocationCallOrder[0]).toBeLessThan(
      mockCompleteDehydration.mock.invocationCallOrder[
        pendingCompleteCallIndex
      ]!,
    );
    expect(mockMessageSuccess).toHaveBeenCalledWith(
      '已完成脱水 2 条任务，跳过 1 条',
    );
    expect(mockListPendingTechnicalTasks).toHaveBeenCalledTimes(2);

    app.unmount();
  });

  it('warns without duplicate dehydration calls when the selected row is already completed', async () => {
    mockListPendingTechnicalTasks.mockResolvedValue({
      items: [
        createTask({
          completedAt: '2026-06-01T11:00:00',
          id: 'TASK-COMPLETED',
          taskStatus: 'COMPLETED',
        }),
      ],
      page: 1,
      size: 20,
      total: 1,
    });
    const { app } = mountView();
    await flushView();

    findButton('开始脱水').click();
    await flushView();
    findButton('脱水完成').click();
    await flushView();

    expect(mockStartDehydration).not.toHaveBeenCalled();
    expect(mockCompleteDehydration).not.toHaveBeenCalled();
    expect(mockMessageWarning).toHaveBeenCalledWith('没有可开始脱水的任务');
    expect(mockMessageWarning).toHaveBeenCalledWith('没有可完成脱水的任务');
    expect(mockListPendingTechnicalTasks).toHaveBeenCalledTimes(1);

    app.unmount();
  });

  it('reports partial failures while refreshing dehydration task actions', async () => {
    mockListPendingTechnicalTasks.mockResolvedValue({
      items: [
        createTask({ id: 'TASK-1' }),
        createTask({ id: 'TASK-2', objectId: 'BLOCK-2' }),
      ],
      page: 1,
      size: 20,
      total: 2,
    });
    mockStartDehydration.mockImplementation(({ taskId }) =>
      taskId === 'TASK-1'
        ? Promise.reject(new Error('start failed'))
        : Promise.resolve({}),
    );
    const { app } = mountView();
    await flushView();

    document
      .querySelector<HTMLButtonElement>('[data-testid="select-all"]')
      ?.click();
    await flushView();
    findButton('开始脱水').click();
    await flushView();

    expect(mockStartDehydration).toHaveBeenCalledTimes(2);
    expect(mockMessageWarning).toHaveBeenCalledWith(
      '已开始脱水 1 条任务，1 条失败',
    );
    expect(mockListPendingTechnicalTasks).toHaveBeenCalledTimes(2);

    app.unmount();
  });
});
