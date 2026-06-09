import type { SlicingWorkbenchRow } from '../types/technical-workflow';

import { createApp, defineComponent, h, nextTick, ref } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

const {
  messageSuccess,
  messageWarning,
  mockCreateReworkOrder,
  mockCreateSlideQcEvaluation,
} = vi.hoisted(() => ({
  messageSuccess: vi.fn(),
  messageWarning: vi.fn(),
  mockCreateReworkOrder: vi.fn(),
  mockCreateSlideQcEvaluation: vi.fn(),
}));

vi.mock('#/utils/error-feedback', () => ({
  reportInlineErrorDisabled: vi.fn(),
}));

vi.mock('../api/technical-workflow-service', () => ({
  createReworkOrder: mockCreateReworkOrder,
  createSlideQcEvaluation: mockCreateSlideQcEvaluation,
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

  const ElOption = defineComponent({
    props: ['label', 'value'],
    setup(props) {
      return () => h('option', { value: props.value }, props.label);
    },
  });

  const ElSelect = defineComponent({
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue'],
    setup(props, { emit, slots }) {
      return () =>
        h(
          'select',
          {
            'aria-label': props.placeholder,
            value: props.modelValue,
            onChange: (event: Event) =>
              emit(
                'update:modelValue',
                (event.target as HTMLSelectElement).value,
              ),
          },
          slots.default?.(),
        );
    },
  });

  return {
    ElAlert: passthrough('section'),
    ElButton,
    ElDescriptions: passthrough(),
    ElDescriptionsItem: passthrough(),
    ElDialog,
    ElForm: passthrough('form'),
    ElFormItem: passthrough(),
    ElInput,
    ElMessage: {
      success: messageSuccess,
      warning: messageWarning,
    },
    ElOption,
    ElSelect,
  };
});

import SlicingQcEvaluationDialog from './SlicingQcEvaluationDialog.vue';

function createRow(overrides: Partial<SlicingWorkbenchRow> = {}) {
  return {
    applicationType: 'ROUTINE',
    caseId: 'CASE-1',
    combinedSlide: false,
    completedAt: '2026-06-01T10:00:00',
    embeddingBoxId: 'BOX-1',
    pathologyNo: 'BL-001',
    patientId: 'P-001',
    patientName: '患者甲',
    selectable: true,
    slideId: 'SLIDE-1',
    slideNo: 'S-001',
    slidePrintStatus: 'PRINTED',
    specimenId: 'SPEC-1',
    taskId: 'TASK-1',
    taskStatus: 'COMPLETED',
    timedOut: false,
    printedSlideCount: 1,
    ...overrides,
  } satisfies SlicingWorkbenchRow;
}

async function flushAll() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

function mountDialog(rows: SlicingWorkbenchRow[]) {
  const root = document.createElement('div');
  document.body.append(root);
  const submitted = vi.fn();
  const app = createApp({
    setup() {
      const visible = ref(true);
      return () =>
        h(SlicingQcEvaluationDialog, {
          modelValue: visible.value,
          row: rows.length === 1 ? (rows[0] ?? null) : null,
          rows,
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

describe('SlicingQcEvaluationDialog', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    messageSuccess.mockReset();
    messageWarning.mockReset();
    mockCreateReworkOrder.mockReset();
    mockCreateSlideQcEvaluation.mockReset();
  });

  it('creates quality evaluations for all selected completed slides', async () => {
    mockCreateSlideQcEvaluation.mockResolvedValue({});
    const { app, root, submitted } = mountDialog([
      createRow(),
      createRow({
        caseId: 'CASE-2',
        slideId: 'SLIDE-2',
        slideNo: 'S-002',
        specimenId: 'SPEC-2',
        taskId: 'TASK-2',
      }),
    ]);
    await flushAll();

    findButton(root, '提交评价').click();
    await flushAll();

    expect(mockCreateSlideQcEvaluation).toHaveBeenCalledTimes(2);
    expect(mockCreateSlideQcEvaluation).toHaveBeenNthCalledWith(1, {
      caseId: 'CASE-1',
      evaluationResult: 'QUALIFIED',
      improvementSuggestion: null,
      issueDescription: null,
      qcType: 'HE',
      remarks: null,
      slideId: 'SLIDE-1',
      specimenId: 'SPEC-1',
      terminalCode: null,
    });
    expect(mockCreateSlideQcEvaluation).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        caseId: 'CASE-2',
        slideId: 'SLIDE-2',
        specimenId: 'SPEC-2',
      }),
    );
    expect(mockCreateReworkOrder).not.toHaveBeenCalled();
    expect(messageSuccess).toHaveBeenCalledWith('质控评价提交成功 2 条');
    expect(submitted).toHaveBeenCalledTimes(1);

    app.unmount();
  });
});
