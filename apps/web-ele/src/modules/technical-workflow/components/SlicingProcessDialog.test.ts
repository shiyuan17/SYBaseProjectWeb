import type { PendingTechnicalTaskItem } from '../types/technical-workflow';

import { createApp, defineComponent, h, nextTick, ref } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

const {
  messageSuccess,
  messageWarning,
  mockCompleteSlicing,
  mockStartSlicing,
  mockUserStore,
} = vi.hoisted(() => ({
  messageSuccess: vi.fn(),
  messageWarning: vi.fn(),
  mockCompleteSlicing: vi.fn(),
  mockStartSlicing: vi.fn(),
  mockUserStore: {
    userInfo: {
      realName: '切片技师',
      userId: 'USER-SLC-1',
    },
  },
}));

vi.mock('@vben/stores', () => ({
  useUserStore: () => mockUserStore,
}));

vi.mock('#/utils/error-feedback', () => ({
  reportInlineErrorDisabled: vi.fn(),
}));

vi.mock('../api/technical-workflow-service', () => ({
  completeSlicing: mockCompleteSlicing,
  startSlicing: mockStartSlicing,
}));

vi.mock('./TechnicalOperatorFields.vue', () => ({
  default: defineComponent({
    props: ['form'],
    setup() {
      return () => null;
    },
  }),
}));

vi.mock('element-plus', () => {
  const passthrough = (tag = 'div') =>
    defineComponent({
      props: ['label', 'title'],
      setup(props, { slots }) {
        return () =>
          h(tag, [
            props.title ? h('h3', props.title) : null,
            props.label ? h('label', props.label) : null,
            slots.default?.(),
            slots.footer?.(),
          ]);
      },
    });

  const ElButton = defineComponent({
    props: ['loading'],
    emits: ['click'],
    setup(props, { attrs, emit, slots }) {
      return () =>
        h(
          'button',
          {
            ...attrs,
            disabled: Boolean(props.loading),
            type: 'button',
            onClick: (event: MouseEvent) => emit('click', event),
          },
          slots.default?.(),
        );
    },
  });

  const ElDialog = defineComponent({
    props: ['modelValue', 'title'],
    setup(props, { slots }) {
      return () =>
        props.modelValue
          ? h('section', [
              h('h3', props.title),
              slots.default?.(),
              slots.footer?.(),
            ])
          : null;
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

  const ElInputNumber = defineComponent({
    props: ['modelValue'],
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h('input', {
          type: 'number',
          value: props.modelValue,
          onInput: (event: Event) =>
            emit(
              'update:modelValue',
              Number((event.target as HTMLInputElement).value),
            ),
        });
    },
  });

  return {
    ElButton,
    ElDescriptions: passthrough(),
    ElDescriptionsItem: passthrough(),
    ElDialog,
    ElForm: passthrough('form'),
    ElFormItem: passthrough(),
    ElInput,
    ElInputNumber,
    ElMessage: {
      success: messageSuccess,
      warning: messageWarning,
    },
  };
});

import SlicingProcessDialog from './SlicingProcessDialog.vue';

function createTask(
  overrides: Partial<PendingTechnicalTaskItem> = {},
): PendingTechnicalTaskItem {
  return {
    applicationId: 'APP-1',
    applicationNo: 'BL-001',
    caseId: 'CASE-1',
    completedAt: null,
    createdAt: null,
    deadlineAt: null,
    id: 'TASK-1',
    objectId: 'BOX-1',
    objectType: 'EMBEDDING_BOX',
    pathologyNo: 'BL-001',
    payload: null,
    remarks: null,
    specimenId: 'SPEC-1',
    startedAt: null,
    taskStatus: 'PENDING',
    taskType: 'SLICING',
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

function mountDialog(tasks: PendingTechnicalTaskItem[]) {
  const root = document.createElement('div');
  document.body.append(root);
  const submitted = vi.fn();
  const app = createApp({
    setup() {
      const visible = ref(true);
      return () =>
        h(SlicingProcessDialog, {
          modelValue: visible.value,
          task: tasks.length === 1 ? (tasks[0] ?? null) : null,
          tasks,
          'onUpdate:modelValue': (value: boolean) => {
            visible.value = value;
          },
          onSubmitted: submitted,
        });
    },
  });
  app.mount(root);
  return { app, root, submitted };
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

describe('SlicingProcessDialog', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    messageSuccess.mockReset();
    messageWarning.mockReset();
    mockCompleteSlicing.mockReset();
    mockStartSlicing.mockReset();
  });

  it('starts pending tasks and completes all selected slicing tasks', async () => {
    mockStartSlicing.mockResolvedValue({});
    mockCompleteSlicing.mockResolvedValue({
      caseStatus: 'SLICING',
      slicingId: 'SLC-1',
      slideIds: ['SLIDE-1'],
      taskId: 'TASK-1',
    });
    const { app, root, submitted } = mountDialog([
      createTask(),
      createTask({
        id: 'TASK-2',
        objectId: 'BOX-2',
        startedAt: '2026-06-01T10:00:00',
        taskStatus: 'IN_PROGRESS',
      }),
    ]);
    await flushAll();

    findButton(root, '完成切片').click();
    await flushAll();

    expect(mockStartSlicing).toHaveBeenCalledTimes(1);
    expect(mockStartSlicing).toHaveBeenCalledWith({
      remarks: null,
      taskId: 'TASK-1',
      terminalCode: null,
    });
    expect(mockCompleteSlicing).toHaveBeenCalledTimes(2);
    expect(mockCompleteSlicing).toHaveBeenCalledWith(
      expect.objectContaining({
        embeddingBoxId: 'BOX-1',
        taskId: 'TASK-1',
      }),
    );
    expect(mockCompleteSlicing).toHaveBeenCalledWith(
      expect.objectContaining({
        embeddingBoxId: 'BOX-2',
        taskId: 'TASK-2',
      }),
    );
    expect(messageSuccess).toHaveBeenCalledWith('已完成切片 2 条任务');
    expect(submitted).toHaveBeenCalledTimes(1);

    app.unmount();
  });
});
