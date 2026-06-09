import type {
  PendingTechnicalTaskItem,
  TechnicalTrackingView,
} from '../types/technical-workflow';

import { createApp, defineComponent, h, inject, nextTick, provide } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const tableRowsKey = Symbol('staining-table-rows');

const {
  messageWarning,
  mockGetTechnicalTracking,
  mockListPendingTechnicalTasks,
  mockRoute,
  mockStartSlideStaining,
} = vi.hoisted(() => ({
  messageWarning: vi.fn(),
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
  getTechnicalTracking: mockGetTechnicalTracking,
  listPendingTechnicalTasks: mockListPendingTechnicalTasks,
  startSlideStaining: mockStartSlideStaining,
}));

vi.mock('../components/TechnicalTaskStartDialog.vue', () => ({
  default: defineComponent({
    props: ['modelValue', 'task', 'title'],
    emits: ['submitted', 'update:modelValue'],
    setup(props, { emit }) {
      return () =>
        props.modelValue
          ? h('section', { 'data-testid': 'start-dialog' }, [
              h('h2', props.title),
              h('div', props.task?.id ?? ''),
              h(
                'button',
                {
                  type: 'button',
                  onClick: () => emit('submitted'),
                },
                '提交开始',
              ),
            ])
          : null;
    },
  }),
}));

vi.mock('../components/StainingProcessDialog.vue', () => ({
  default: defineComponent({
    props: ['modelValue', 'task'],
    emits: ['submitted', 'update:modelValue'],
    setup(props, { emit }) {
      return () =>
        props.modelValue
          ? h('section', { 'data-testid': 'process-dialog' }, [
              h('h2', '染色处理'),
              h('div', props.task?.id ?? ''),
              h('div', props.task?.objectId ?? ''),
              h(
                'button',
                {
                  type: 'button',
                  onClick: () => emit('submitted'),
                },
                '提交出片',
              ),
            ])
          : null;
    },
  }),
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
      function clearSelection() {
        emit('selection-change', []);
      }

      function toggleRowSelection(row: unknown, selected = true) {
        emit('selection-change', selected ? [row] : []);
      }

      expose({
        clearSelection,
        toggleRowSelection,
      });
      provide(tableRowsKey, () => props.data ?? []);
      return () =>
        h('div', [
          slots.default?.(),
          ...(props.data ?? []).map((row: any) =>
            h(
              'button',
              {
                'data-testid': 'table-row',
                type: 'button',
                onClick: () => {
                  emit('selection-change', [row]);
                  emit('row-click', row);
                },
              },
              row.task?.id ?? row.id ?? row.slideId ?? '',
            ),
          ),
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
    ElEmpty,
    ElInput,
    ElMessage: {
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

function createTracking(): TechnicalTrackingView {
  return {
    blocks: [],
    caseId: 'CASE-1',
    caseStatus: 'DIAGNOSIS_PENDING',
    embeddingBoxes: [],
    events: [],
    pathologyNo: 'BL-001',
    qcEvaluations: [],
    reworks: [],
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
        objectId: 'SLIDE-1',
        objectType: 'SLIDE',
        startedAt: '2026-06-03T16:36:00',
        taskStatus: 'COMPLETED',
        taskType: 'STAINING',
      }),
    ],
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

  const app = createApp({
    render: () => h(StainingWorkstationView),
  });
  app.directive('loading', {});
  app.mount(root);
  return { app, root };
}

describe('StainingWorkstationView', () => {
  beforeEach(() => {
    mockRoute.query = {};
    mockListPendingTechnicalTasks.mockResolvedValue({
      items: [createTask()],
      page: 1,
      size: 20,
      total: 1,
    });
    mockGetTechnicalTracking.mockResolvedValue(createTracking());
    mockStartSlideStaining.mockResolvedValue({});
  });

  afterEach(() => {
    document.body.innerHTML = '';
    messageWarning.mockReset();
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
    expect(document.body.textContent).toContain('A1');
    expect(document.body.textContent).toContain('SLIDE-001');
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
    ).toEqual(['1', '0', '1']);
    expect(document.body.textContent).not.toContain('待染色总数');
    expect(document.body.textContent).not.toContain('染色中');
    expect(document.body.textContent).not.toContain('待开始');
    expect(document.body.textContent).not.toContain('超时风险');
    expect(document.body.textContent).not.toContain('未出片');
    expect(document.body.textContent).toContain('周永坚');
    expect(document.body.textContent).toContain('2026-06-03 16:35:50');
    expect(document.body.textContent).toContain('2026-06-03 16:38:32');
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

    findButton('染色出片(F9)').click();
    await flushView();

    expect(document.body.textContent).toContain('染色处理');
    expect(document.body.textContent).toContain('SLD-action-slide-id');

    app.unmount();
    root.remove();
  });

  it('formats completed slide operation fallback statuses in Chinese', async () => {
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

    expect(document.body.textContent).toContain('待质控');
    expect(document.body.textContent).toContain('待染色');
    expect(document.body.textContent).not.toContain('CREATED');
    expect(document.body.textContent).not.toContain('PENDING');

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

  it('opens start dialog by F9 and process dialog by primary action', async () => {
    const { app, root } = mountView();
    await flushView();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F9' }));
    await flushView();

    expect(document.body.textContent).toContain('开始染色');
    expect(document.body.textContent).toContain('TASK-1');

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

    findButton('染色出片(F9)').click();
    await flushView();

    expect(document.body.textContent).toContain('染色处理');
    expect(document.body.textContent).toContain('TASK-2');

    second.app.unmount();
    second.root.remove();
  });
});
