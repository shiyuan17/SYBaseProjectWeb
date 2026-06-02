import type { TechnicalTrackingEmbeddingRecordSummary } from '../types/technical-workflow';

import { createApp, defineComponent, h, inject, nextTick, provide, ref } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

const radioGroupKey = Symbol('radio-group');
const checkboxGroupKey = Symbol('checkbox-group');

const {
  messageSuccess,
  messageWarning,
  mockUpdateEmbeddingQualityReview,
} = vi.hoisted(() => ({
  messageSuccess: vi.fn(),
  messageWarning: vi.fn(),
  mockUpdateEmbeddingQualityReview: vi.fn(),
}));

vi.mock('../api/technical-workflow-service', () => ({
  updateEmbeddingQualityReview: mockUpdateEmbeddingQualityReview,
}));

vi.mock('#/utils/error-feedback', () => ({
  reportInlineErrorDisabled: vi.fn(),
}));

vi.mock('element-plus', () => {
  function slotText(slots: { default?: () => unknown[] }) {
    const first = slots.default?.()[0] as { children?: unknown } | undefined;
    return typeof first?.children === 'string' ? first.children : '';
  }

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

  const ElCheckboxGroup = defineComponent({
    props: ['modelValue'],
    emits: ['update:modelValue'],
    setup(props, { emit, slots }) {
      provide(checkboxGroupKey, {
        isChecked: (label: string) =>
          Array.isArray(props.modelValue) && props.modelValue.includes(label),
        toggle: (label: string) => {
          const current = Array.isArray(props.modelValue)
            ? [...props.modelValue]
            : [];
          emit(
            'update:modelValue',
            current.includes(label)
              ? current.filter((item) => item !== label)
              : [...current, label],
          );
        },
      });
      return () => h('div', slots.default?.());
    },
  });

  const ElCheckbox = defineComponent({
    props: ['label', 'modelValue'],
    emits: ['update:modelValue'],
    setup(props, { emit, slots }) {
      const group = inject<null | {
        isChecked: (label: string) => boolean;
        toggle: (label: string) => void;
      }>(checkboxGroupKey, null);
      return () => {
        const label = props.label || slotText(slots);
        const checked = group
          ? group.isChecked(label)
          : Boolean(props.modelValue);
        return h('label', [
          h('input', {
            'aria-label': label,
            checked,
            type: 'checkbox',
            onChange: () => {
              if (group) {
                group.toggle(label);
                return;
              }
              emit('update:modelValue', !checked);
            },
          }),
          slots.default?.() ?? label,
        ]);
      };
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

  const ElForm = passthrough('form');
  const ElFormItem = passthrough();
  const ElDescriptions = passthrough();
  const ElDescriptionsItem = passthrough();

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

  const ElRadioGroup = defineComponent({
    props: ['modelValue'],
    emits: ['update:modelValue'],
    setup(props, { emit, slots }) {
      provide(radioGroupKey, {
        isChecked: (label: string) => props.modelValue === label,
        select: (label: string) => emit('update:modelValue', label),
      });
      return () => h('div', slots.default?.());
    },
  });

  const ElRadio = defineComponent({
    props: ['label'],
    setup(props, { slots }) {
      const group = inject<{
        isChecked: (label: string) => boolean;
        select: (label: string) => void;
      }>(radioGroupKey);
      return () =>
        h('label', [
          h('input', {
            'aria-label': props.label,
            checked: group?.isChecked(props.label) ?? false,
            type: 'radio',
            onChange: () => group?.select(props.label),
          }),
          slots.default?.(),
        ]);
    },
  });

  return {
    ElAlert,
    ElButton,
    ElCheckbox,
    ElCheckboxGroup,
    ElDescriptions,
    ElDescriptionsItem,
    ElDialog,
    ElForm,
    ElFormItem,
    ElInput,
    ElMessage: {
      success: messageSuccess,
      warning: messageWarning,
    },
    ElRadio,
    ElRadioGroup,
  };
});

import EmbeddingQualityReviewDialog from './EmbeddingQualityReviewDialog.vue';

function createRecord(): TechnicalTrackingEmbeddingRecordSummary {
  return {
    caseId: 'CASE-1',
    embeddingBoxId: 'BOX-1',
    embeddingBoxNo: 'BX-1',
    embeddingId: 'EMB-1',
    embeddingRemarks: '包埋备注',
    embeddedByName: '包埋员',
    endedAt: '2026-06-02T10:00:00',
    evaluationLevel: 'QUALIFIED',
    grossDescription: '大体所见',
    pathologyNo: 'BL-001',
    sampledAt: '2026-06-02T09:00:00',
    sampledByName: '取材员',
    samplingBlockCode: 'A1',
    samplingBlockDescription: '蜡块 A1',
    samplingBlockId: 'BLOCK-1',
    samplingEvaluation: '原取材评价',
    sliceNotice: '原切片备注',
    specimenId: 'SPEC-1',
    specimenName: '胃组织',
    startedAt: '2026-06-02T09:30:00',
    taskId: 'TASK-1',
    taskStatus: 'COMPLETED',
  };
}

async function flushAll() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

function mountDialog(row = createRecord()) {
  const root = document.createElement('div');
  document.body.append(root);
  const submitted = vi.fn();
  const app = createApp({
    setup() {
      const visible = ref(true);
      return () =>
        h(EmbeddingQualityReviewDialog, {
          modelValue: visible.value,
          row,
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

function toggleInput(root: HTMLElement, label: string) {
  let input = root.querySelector<HTMLInputElement>(
    `input[aria-label="${label}"]`,
  );
  if (!input) {
    input =
      [...root.querySelectorAll<HTMLLabelElement>('label')]
        .find((item) => item.textContent?.includes(label))
        ?.querySelector<HTMLInputElement>('input') ?? null;
  }
  if (!input) {
    throw new Error(`Missing input: ${label}`);
  }
  input.click();
}

function setInputValue(root: HTMLElement, placeholder: string, value: string) {
  const input = root.querySelector<HTMLInputElement>(
    `input[placeholder="${placeholder}"]`,
  );
  if (!input) {
    throw new Error(`Missing input: ${placeholder}`);
  }
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

describe('EmbeddingQualityReviewDialog', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    messageSuccess.mockReset();
    messageWarning.mockReset();
    mockUpdateEmbeddingQualityReview.mockReset();
  });

  it('submits a qualified review without creating rework', async () => {
    mockUpdateEmbeddingQualityReview.mockResolvedValue({
      record: createRecord(),
      reworkStatus: null,
      reworkType: null,
    });
    const { app, root, submitted } = mountDialog();
    await flushAll();

    findButton(root, '保存评价').click();
    await flushAll();

    expect(mockUpdateEmbeddingQualityReview).toHaveBeenCalledWith('EMB-1', {
      evaluationLevel: 'QUALIFIED',
      notifiedGrossingOperator: false,
      samplingEvaluation: '合格',
      sliceNotice: '原切片备注',
      treatmentAction: null,
      treatmentRemark: null,
      unqualifiedReasons: [],
    });
    expect(messageSuccess).toHaveBeenCalledWith('取材评价已保存');
    expect(submitted).toHaveBeenCalledTimes(1);

    app.unmount();
  });

  it('submits unqualified regrossing reasons and notifies grossing operator', async () => {
    mockUpdateEmbeddingQualityReview.mockResolvedValue({
      record: createRecord(),
      reworkStatus: 'COMPLETED',
      reworkType: 'REGROSSING',
    });
    const { app, root } = mountDialog();
    await flushAll();

    toggleInput(root, 'UNQUALIFIED');
    await flushAll();
    toggleInput(root, '组织过厚');
    await flushAll();
    toggleInput(root, '其他原因');
    setInputValue(root, '其他原因说明', '线头残留');
    toggleInput(root, 'REGROSSING');
    setInputValue(root, '处理说明', '请重新取材');
    toggleInput(root, '已通知取材人');
    await flushAll();

    findButton(root, '保存评价').click();
    await flushAll();

    expect(mockUpdateEmbeddingQualityReview).toHaveBeenCalledWith('EMB-1', {
      evaluationLevel: 'UNQUALIFIED',
      notifiedGrossingOperator: true,
      samplingEvaluation: '不合格',
      sliceNotice: '原切片备注',
      treatmentAction: 'REGROSSING',
      treatmentRemark: '请重新取材',
      unqualifiedReasons: ['组织过厚', '其他原因', '线头残留'],
    });
    expect(messageSuccess).toHaveBeenCalledWith(
      '取材评价已保存，并已生成重新取材待办',
    );

    app.unmount();
  });
});
