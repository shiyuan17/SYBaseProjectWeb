import type { PendingTechnicalTaskItem } from '../types/technical-workflow';

import { createApp, defineComponent, h, inject, nextTick, provide } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const tableRowsKey = Symbol('dehydration-table-rows');

const {
  mockCompleteDehydration,
  mockListPendingTechnicalTasks,
  mockMessageSuccess,
  mockMessageWarning,
  mockNavigation,
  mockRoute,
  mockStartDehydration,
} = vi.hoisted(() => ({
  mockCompleteDehydration: vi.fn(),
  mockListPendingTechnicalTasks: vi.fn(),
  mockMessageSuccess: vi.fn(),
  mockMessageWarning: vi.fn(),
  mockNavigation: {
    goToTracking: vi.fn(),
  },
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

vi.mock('../utils/navigation', () => ({
  useTechnicalWorkflowNavigation: () => mockNavigation,
}));

vi.mock('../components/DehydrationCreateBatchDialog.vue', () => ({
  default: defineComponent({
    props: ['modelValue', 'task', 'tasks'],
    emits: ['created', 'update:modelValue'],
    setup(props, { emit }) {
      return () =>
        props.modelValue
          ? h(
              'button',
              {
                'data-testid': 'submit-create-batch',
                type: 'button',
                onClick: () => emit('created', { batchId: 'BATCH-1' }),
              },
              `创建批次弹窗 ${props.tasks?.length ?? 0}`,
            )
          : null;
    },
  }),
}));

vi.mock('../components/DehydrationBatchOperationDialog.vue', () => ({
  default: defineComponent({
    props: ['initialBatchId', 'modelValue'],
    emits: ['submitted', 'update:modelValue'],
    setup(props, { emit }) {
      return () =>
        props.modelValue
          ? h(
              'button',
              {
                'data-testid': 'submit-batch-operation',
                type: 'button',
                onClick: () =>
                  emit('submitted', {
                    batchId: props.initialBatchId || 'BATCH-2',
                  }),
              },
              `批次操作弹窗 ${props.initialBatchId || ''}`,
            )
          : null;
    },
  }),
}));

vi.mock('element-plus', () => {
  const passthrough = defineComponent({
    props: ['label', 'title'],
    setup(props, { slots }) {
      return () =>
        h('div', [
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
      return () =>
        h(
          'button',
          {
            ...attrs,
            disabled: Boolean(props.disabled || props.loading),
            type: 'button',
            onClick: (event: MouseEvent) => emit('click', event),
          },
          slots.default?.(),
        );
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

  const ElPagination = defineComponent({
    emits: ['change'],
    setup() {
      return () => h('nav');
    },
  });

  const ElTable = defineComponent({
    props: ['data'],
    emits: ['current-change', 'selection-change'],
    setup(props, { emit, slots }) {
      provide(tableRowsKey, () => props.data ?? []);
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
    ElForm: passthrough,
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

function mountView() {
  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp(DehydrationWorkstationView);
  app.directive('loading', {});
  app.mount(root);
  return { app, root };
}

describe('DehydrationWorkstationView', () => {
  beforeEach(() => {
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
    document.body.innerHTML = '';
    mockCompleteDehydration.mockReset();
    mockListPendingTechnicalTasks.mockReset();
    mockMessageSuccess.mockReset();
    mockMessageWarning.mockReset();
    mockNavigation.goToTracking.mockReset();
    mockStartDehydration.mockReset();
  });

  it('renders task-level and batch dehydration controls without operation column', async () => {
    const { app } = mountView();
    await flushView();

    expect(document.body.textContent).toContain('创建批次');
    expect(document.body.textContent).toContain('批次操作');
    expect(document.body.textContent).toContain('开始脱水');
    expect(document.body.textContent).toContain('脱水完成');
    expect(document.body.textContent).toContain('脱水追踪');
    expect(document.body.textContent).toContain('脱水开始时间');
    expect(document.body.textContent).toContain('脱水完成时间');
    expect(document.body.textContent).not.toContain('执行脱水');
    expect(document.querySelector('[data-column-label="操作"]')).toBeFalsy();

    app.unmount();
  });

  it('opens create batch dialog with selected tasks and refreshes after creation', async () => {
    const { app } = mountView();
    await flushView();

    findButton('创建批次').click();
    await flushView();

    expect(document.body.textContent).toContain('创建批次弹窗 1');

    document
      .querySelector<HTMLButtonElement>('[data-testid="submit-create-batch"]')
      ?.click();
    await flushView();

    expect(document.body.textContent).toContain('批次操作弹窗 BATCH-1');
    expect(mockListPendingTechnicalTasks).toHaveBeenCalledTimes(2);

    app.unmount();
  });

  it('warns when creating a batch from different cases', async () => {
    mockListPendingTechnicalTasks.mockResolvedValue({
      items: [
        createTask({ caseId: 'CASE-1', id: 'TASK-1', objectId: 'BLOCK-1' }),
        createTask({ caseId: 'CASE-2', id: 'TASK-2', objectId: 'BLOCK-2' }),
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
    findButton('创建批次').click();
    await flushView();

    expect(mockMessageWarning).toHaveBeenCalledWith(
      '创建脱水批次仅支持选择同一病例的蜡块任务',
    );
    expect(document.body.textContent).not.toContain('创建批次弹窗');

    app.unmount();
  });

  it('opens batch operation dialog directly and refreshes after submission', async () => {
    const { app } = mountView();
    await flushView();

    findButton('批次操作').click();
    await flushView();

    expect(document.body.textContent).toContain('批次操作弹窗');

    document
      .querySelector<HTMLButtonElement>(
        '[data-testid="submit-batch-operation"]',
      )
      ?.click();
    await flushView();

    expect(mockListPendingTechnicalTasks).toHaveBeenCalledTimes(2);

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

  it('warns when task status does not match direct action requirements', async () => {
    const { app } = mountView();
    await flushView();

    findButton('脱水完成').click();
    await flushView();

    expect(mockCompleteDehydration).not.toHaveBeenCalled();
    expect(mockMessageWarning).toHaveBeenCalledWith('请先开始脱水');

    app.unmount();
  });
});
