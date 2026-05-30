import type { PendingTechnicalTaskItem } from '../types/technical-workflow';

import { createApp, defineComponent, h, inject, nextTick, provide } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assignedUserSelectProps,
  messageError,
  messageSuccess,
  messageWarning,
  mockAssignTechnicalTask,
  mockListPendingTechnicalTasks,
  mockReleaseTechnicalTask,
  mockRouter,
  mockUserStore,
} = vi.hoisted(() => ({
  assignedUserSelectProps: {
    modelValue: '',
    selectedLabel: '',
  },
  messageError: vi.fn(),
  messageSuccess: vi.fn(),
  messageWarning: vi.fn(),
  mockAssignTechnicalTask: vi.fn(),
  mockListPendingTechnicalTasks: vi.fn(),
  mockReleaseTechnicalTask: vi.fn(),
  mockRouter: {
    push: vi.fn(),
  },
  mockUserStore: {
    userInfo: {
      realName: '调度员',
      userId: 'OPERATOR-1',
    },
  },
}));

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
}));

vi.mock('@vben/common-ui', () => ({
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

vi.mock('@vben/stores', () => ({
  useUserStore: () => mockUserStore,
}));

vi.mock('#/modules/system-management/components/SystemUserSelect.vue', () => ({
  default: defineComponent({
    props: ['modelValue', 'placeholder', 'selectedLabel'],
    emits: ['change', 'update:modelValue'],
    setup(props, { emit }) {
      return () => {
        assignedUserSelectProps.modelValue = String(props.modelValue ?? '');
        assignedUserSelectProps.selectedLabel = String(
          props.selectedLabel ?? '',
        );

        return h('div', { 'data-testid': 'assigned-user-select' }, [
          h(
            'span',
            { 'data-testid': 'assigned-user-label' },
            props.selectedLabel,
          ),
          h(
            'button',
            {
              'data-testid': 'choose-user',
              type: 'button',
              onClick: () => {
                emit('update:modelValue', 'USER-TECH-2');
                emit('change', { id: 'USER-TECH-2', name: '新技师' });
              },
            },
            '选择新技师',
          ),
          h(
            'button',
            {
              'data-testid': 'clear-user',
              type: 'button',
              onClick: () => {
                emit('update:modelValue', '');
                emit('change', null);
              },
            },
            '清空责任技师',
          ),
        ]);
      };
    },
  }),
}));

vi.mock('../api/technical-workflow-service', () => ({
  assignTechnicalTask: mockAssignTechnicalTask,
  listPendingTechnicalTasks: mockListPendingTechnicalTasks,
  releaseTechnicalTask: mockReleaseTechnicalTask,
}));

vi.mock('element-plus', () => {
  const tableRowsKey = Symbol('table-rows');

  const passthrough = (tag = 'div') =>
    defineComponent({
      props: ['label', 'title'],
      setup(props, { slots }) {
        return () =>
          h(tag, [
            props.title ? h('div', props.title) : null,
            props.label ? h('label', props.label) : null,
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

  const ElDatePicker = defineComponent({
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

  const ElDialog = defineComponent({
    props: ['modelValue', 'title'],
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

  const ElForm = passthrough('form');
  const ElFormItem = passthrough();

  const ElInput = defineComponent({
    props: ['disabled', 'modelValue', 'placeholder', 'rows', 'type'],
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () =>
        props.type === 'textarea'
          ? h('textarea', {
              disabled: props.disabled,
              placeholder: props.placeholder,
              rows: props.rows,
              value: props.modelValue,
              onInput: (event: Event) =>
                emit(
                  'update:modelValue',
                  (event.target as HTMLTextAreaElement).value,
                ),
            })
          : h('input', {
              disabled: props.disabled,
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
    props: ['modelValue'],
    emits: ['change', 'update:modelValue'],
    setup(props, { emit, slots }) {
      return () =>
        h(
          'select',
          {
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

  const ElSwitch = defineComponent({
    props: ['modelValue'],
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h('input', {
          checked: props.modelValue,
          type: 'checkbox',
          onChange: (event: Event) =>
            emit(
              'update:modelValue',
              (event.target as HTMLInputElement).checked,
            ),
        });
    },
  });

  const ElTable = defineComponent({
    props: ['data'],
    setup(props, { slots }) {
      provide(tableRowsKey, () => props.data ?? []);
      return () => h('div', slots.default?.());
    },
  });

  const ElTableColumn = defineComponent({
    props: ['label'],
    setup(props, { slots }) {
      const getRows = inject<() => unknown[]>(tableRowsKey, () => []);
      return () =>
        h('section', [
          h('strong', props.label),
          ...getRows().map((row) => h('div', slots.default?.({ row }))),
        ]);
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
    ElDatePicker,
    ElDialog,
    ElForm,
    ElFormItem,
    ElInput,
    ElMessage: {
      error: messageError,
      success: messageSuccess,
      warning: messageWarning,
    },
    ElOption,
    ElPagination,
    ElSelect,
    ElSwitch,
    ElTable,
    ElTableColumn,
    ElTag,
  };
});

import TechnicalTasksView from './TechnicalTasksView.vue';

function createTask(
  overrides: Partial<PendingTechnicalTaskItem> = {},
): PendingTechnicalTaskItem {
  return {
    applicationId: 'APP-1',
    applicationNo: 'APP-20260525-001',
    caseId: 'CASE-1',
    completedAt: null,
    createdAt: '2026-05-25T08:00:00',
    deadlineAt: null,
    id: 'TASK-1',
    objectId: 'SPEC-1',
    objectType: 'SPECIMEN',
    pathologyNo: 'BL-20260525-001',
    payload: null,
    remarks: null,
    specimenId: 'SPEC-1',
    startedAt: null,
    taskStatus: 'PENDING',
    taskType: 'GROSSING',
    timedOut: false,
    timeoutRuleCode: null,
    ...overrides,
  };
}

async function flushView() {
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
    render: () => h(TechnicalTasksView),
  });
  app.directive('loading', {});

  app.mount(root);
  return { app, root };
}

describe('TechnicalTasksView', () => {
  beforeEach(() => {
    mockListPendingTechnicalTasks.mockResolvedValue({
      items: [
        createTask({
          assignedToName: '既有技师',
          assignedToUserId: 'USER-TECH-1',
          expectedCompletedAt: '2026-05-25T18:00:00',
          priority: 'STAT',
          productionRemarks: '优先处理',
          stationCode: 'GROSSING',
          stationName: '取材台',
        }),
      ],
      page: 1,
      size: 20,
      total: 1,
    });
    mockAssignTechnicalTask.mockResolvedValue({});
    mockReleaseTechnicalTask.mockResolvedValue({});
  });

  afterEach(() => {
    assignedUserSelectProps.modelValue = '';
    assignedUserSelectProps.selectedLabel = '';
    messageError.mockReset();
    messageSuccess.mockReset();
    messageWarning.mockReset();
    mockAssignTechnicalTask.mockReset();
    mockListPendingTechnicalTasks.mockReset();
    mockReleaseTechnicalTask.mockReset();
    mockRouter.push.mockReset();
    document.body.innerHTML = '';
  });

  it('shows existing assigned technician in searchable user select', async () => {
    const { app, root } = mountView();
    await flushView();

    findButton('分派').click();
    await nextTick();

    expect(document.body.textContent).toContain('任务分派');
    expect(document.body.textContent).not.toContain('责任技师ID');
    expect(assignedUserSelectProps.modelValue).toBe('USER-TECH-1');
    expect(assignedUserSelectProps.selectedLabel).toBe('既有技师');

    app.unmount();
    root.remove();
  });

  it('submits selected technician id and name from user select', async () => {
    const { app, root } = mountView();
    await flushView();

    findButton('分派').click();
    await nextTick();
    document
      .querySelector<HTMLButtonElement>('[data-testid="choose-user"]')
      ?.click();
    await nextTick();
    findButton('确认分派').click();
    await flushView();

    expect(mockAssignTechnicalTask).toHaveBeenCalledWith(
      'TASK-1',
      expect.objectContaining({
        assignedToName: '新技师',
        assignedToUserId: 'USER-TECH-2',
        operatorName: '调度员',
      }),
    );

    app.unmount();
    root.remove();
  });

  it('submits null technician fields after clearing user select', async () => {
    const { app, root } = mountView();
    await flushView();

    findButton('分派').click();
    await nextTick();
    document
      .querySelector<HTMLButtonElement>('[data-testid="clear-user"]')
      ?.click();
    await nextTick();
    findButton('确认分派').click();
    await flushView();

    expect(mockAssignTechnicalTask).toHaveBeenCalledWith(
      'TASK-1',
      expect.objectContaining({
        assignedToName: null,
        assignedToUserId: null,
      }),
    );

    app.unmount();
    root.remove();
  });
});
