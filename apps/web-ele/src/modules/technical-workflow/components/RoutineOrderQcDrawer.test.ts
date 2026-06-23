import {
  createApp,
  defineComponent,
  h,
  inject,
  nextTick,
  provide,
  ref,
} from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

const { messageError, messageWarning } = vi.hoisted(() => ({
  messageError: vi.fn(),
  messageWarning: vi.fn(),
}));

const rowContextKey = Symbol('routine-order-qc-row-context');
const radioGroupKey = Symbol('routine-order-qc-radio-group');

vi.mock('element-plus', () => {
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

  const ElCheckbox = defineComponent({
    props: ['label', 'modelValue'],
    emits: ['update:modelValue', 'change'],
    setup(props, { emit, slots }) {
      return () =>
        h('label', [
          h('input', {
            'aria-label': props.label,
            checked: Boolean(props.modelValue),
            type: 'checkbox',
            onChange: (event: Event) => {
              const checked = (event.target as HTMLInputElement).checked;
              emit('update:modelValue', checked);
              emit('change', checked);
            },
          }),
          slots.default?.() ?? props.label,
        ]);
    },
  });

  const ElDialog = defineComponent({
    props: ['modelValue', 'title'],
    emits: ['update:modelValue'],
    setup(props, { slots }) {
      return () =>
        props.modelValue
          ? h('section', [
              h('h4', props.title),
              slots.default?.(),
              slots.footer?.(),
            ])
          : null;
    },
  });

  const ElDrawer = defineComponent({
    props: ['modelValue', 'title'],
    emits: ['update:modelValue'],
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
    props: ['modelValue', 'placeholder', 'type'],
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      const tag = props.type === 'textarea' ? 'textarea' : 'input';
      return () =>
        h(tag, {
          placeholder: props.placeholder,
          value: props.modelValue,
          onInput: (event: Event) =>
            emit(
              'update:modelValue',
              (event.target as HTMLInputElement | HTMLTextAreaElement).value,
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

  const ElRadioGroup = defineComponent({
    props: ['modelValue'],
    emits: ['update:modelValue'],
    setup(props, { emit, slots }) {
      provide(radioGroupKey, {
        getValue: () => props.modelValue,
        update: (value: string) => emit('update:modelValue', value),
      });
      return () => h('div', slots.default?.());
    },
  });

  const ElRadio = defineComponent({
    props: ['label'],
    setup(props, { slots }) {
      const group = inject<{
        getValue: () => unknown;
        update: (value: string) => void;
      }>(radioGroupKey);
      return () =>
        h('label', [
          h('input', {
            'aria-label': props.label,
            checked: group?.getValue() === props.label,
            type: 'radio',
            value: props.label,
            onChange: () => group?.update(String(props.label)),
          }),
          slots.default?.() ?? props.label,
        ]);
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

  const ElTable = defineComponent({
    props: ['data'],
    setup(props, { slots }) {
      return () =>
        h('div', [
          slots.empty?.(),
          ...(props.data && props.data.length > 0 ? props.data : [{}]).map(
            (row: Record<string, unknown>, index: number) =>
              h(
                defineComponent({
                  setup(_, { slots: providerSlots }) {
                    provide(rowContextKey, { row, $index: index });
                    return () => h('div', providerSlots.default?.());
                  },
                }),
                { key: `qc-row-${index}` },
                {
                  default: () => slots.default?.(),
                },
              ),
          ),
        ]);
    },
  });

  const ElTableColumn = defineComponent({
    props: ['label', 'type'],
    setup(props, { slots }) {
      const rowContext = inject<null | { $index: number; row: unknown }>(
        rowContextKey,
        null,
      );
      return () =>
        h('section', [
          h('span', props.label ?? props.type),
          slots.default?.({
            $index: rowContext?.$index ?? 0,
            row: rowContext?.row ?? {},
          }),
        ]);
    },
  });

  const ElTabPane = defineComponent({
    setup(_, { slots }) {
      return () => h('div', slots.default?.());
    },
  });

  const ElTabs = defineComponent({
    props: ['modelValue'],
    emits: ['update:modelValue'],
    setup(props, { emit, slots }) {
      return () =>
        h('div', [
          h(
            'button',
            {
              type: 'button',
              onClick: () => emit('update:modelValue', 'SLIDE'),
            },
            '切片评价',
          ),
          h(
            'button',
            {
              type: 'button',
              onClick: () => emit('update:modelValue', 'GROSSING'),
            },
            '取材评价',
          ),
          h('div', { 'data-testid': 'active-tab' }, props.modelValue),
          slots.default?.(),
        ]);
    },
  });

  const ElTag = defineComponent({
    setup(_, { slots }) {
      return () => h('span', slots.default?.());
    },
  });

  return {
    ElButton,
    ElCheckbox,
    ElDialog,
    ElDrawer,
    ElInput,
    ElMessage: {
      error: messageError,
      warning: messageWarning,
    },
    ElOption,
    ElRadio,
    ElRadioGroup,
    ElSelect,
    ElTable,
    ElTableColumn,
    ElTabPane,
    ElTabs,
    ElTag,
  };
});

import RoutineOrderQcDrawer from './RoutineOrderQcDrawer.vue';

function createRow(overrides: Record<string, unknown> = {}) {
  return {
    blockNo: 'A1',
    caseId: 'CASE-1',
    checkItem: 'HE染色',
    id: 'ORDER-1',
    orderId: 'ORDER-1',
    pathologyNo: 'S2600058-1',
    patientName: '患者甲',
    releaseStatus: '未确认',
    remarks: '薄切',
    slideNo: 'SLIDE-001',
    specimenNo: 'SP-001',
    targetBlockId: 'BLOCK-1',
    targetSlideId: 'SLIDE-001',
    targetSpecimenId: 'SPEC-1',
    targetType: 'BLOCK',
    ...overrides,
  };
}

async function flushAll() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

function mountDrawer(rows = [createRow()]) {
  const root = document.createElement('div');
  document.body.append(root);
  const activeRowChange = vi.fn();
  const submit = vi.fn();
  const updateModelValue = vi.fn();

  const app = createApp({
    setup() {
      const visible = ref(true);
      return () =>
        h(RoutineOrderQcDrawer, {
          latestEvaluation: {
            evaluatedAt: '2026-06-22 10:00:00',
            evaluationReason: '既往评价',
            evaluatorName: '技师甲',
            grade: '乙',
            orderId: 'ORDER-1',
            processingAction: 'NO_ACTION',
            qcAspect: 'SLIDE',
            qcEvaluationId: 'QC-1',
            remarks: '历史备注',
            totalScore: 88,
          },
          modelValue: visible.value,
          rows,
          'onUpdate:modelValue': (value: boolean) => {
            updateModelValue(value);
            visible.value = value;
          },
          onActiveRowChange: activeRowChange,
          onSubmit: submit,
        });
    },
  });
  app.mount(root);

  return {
    activeRowChange,
    app,
    root,
    submit,
    updateModelValue,
  };
}

function clickButton(root: HTMLElement, text: string) {
  const button = [...root.querySelectorAll<HTMLButtonElement>('button')].find(
    (item) => item.textContent?.includes(text),
  );
  if (!button) {
    throw new Error(`Missing button: ${text}`);
  }
  button.click();
}

function setFieldValue(root: HTMLElement, placeholder: string, value: string) {
  const field = root.querySelector<HTMLInputElement | HTMLTextAreaElement>(
    `[placeholder="${placeholder}"]`,
  );
  if (!field) {
    throw new Error(`Missing field: ${placeholder}`);
  }
  field.value = value;
  field.dispatchEvent(new Event('input'));
}

describe('RoutineOrderQcDrawer', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    messageError.mockReset();
    messageWarning.mockReset();
  });

  it('renders the high-density column sets for slide and grossing tabs', async () => {
    const { app, root } = mountDrawer();
    await flushAll();

    for (const label of [
      '病理号',
      '蜡块号',
      '项目',
      '评价',
      '评价原因',
      '分数',
      '评价日期',
      '状态',
      '备注',
    ]) {
      expect(root.textContent).toContain(label);
    }
    expect(root.textContent).toContain(
      '评分规则: 甲(>90分)、乙(75-89分)、丙(60-74)、丁(<60分)',
    );
    expect(root.textContent).toContain('扣分项');
    expect(root.textContent).toContain('处理动作');

    clickButton(root, '取材评价');
    await flushAll();

    for (const label of [
      '病理号',
      '蜡块号',
      '项目',
      '评价原因',
      '分数',
      '状态',
      '备注',
    ]) {
      expect(root.textContent).toContain(label);
    }
    expect(root.textContent).toContain('取材不足');
    expect(root.textContent).toContain('组织方向错误');
    expect(root.textContent).toContain('描述与蜡块不符');
    expect(root.textContent).not.toContain('作废原片');

    app.unmount();
  });

  it('submits slide qc payload with selected deduction items and rework action', async () => {
    const { app, root, submit } = mountDrawer();
    await flushAll();

    clickButton(root, '空气污染');
    await flushAll();
    clickButton(root, '立即重打');
    await flushAll();
    setFieldValue(root, '补充备注', '双切复核');
    await flushAll();

    clickButton(root, '保存评价');
    await flushAll();

    expect(submit).toHaveBeenCalledWith({
      detailItems: [
        {
          checked: true,
          deductionGroup: '切片',
          deductionSuggestion: '建议重新制片',
          deductionValue: 5,
          itemName: '空气污染',
        },
      ],
      evaluationReason: '空气污染',
      grade: '甲',
      processingAction: 'FAST_REMAKE',
      qcAspect: 'SLIDE',
      remarks: '双切复核',
      reworkType: 'RESLICE',
      totalScore: 95,
    });

    app.unmount();
  });

  it('submits grossing qc payload with no-action processing', async () => {
    const { app, root, submit } = mountDrawer();
    await flushAll();

    clickButton(root, '取材评价');
    await flushAll();
    clickButton(root, '取材不足');
    await flushAll();
    clickButton(root, '无需处理');
    await flushAll();

    clickButton(root, '保存评价');
    await flushAll();

    expect(submit).toHaveBeenCalledWith({
      detailItems: [
        {
          checked: true,
          deductionGroup: '取材',
          deductionSuggestion: '建议重新取材',
          deductionValue: 30,
          itemName: '取材不足',
        },
      ],
      evaluationReason: '取材不足',
      grade: '丙',
      processingAction: 'NO_ACTION',
      qcAspect: 'GROSSING',
      remarks: '',
      reworkType: null,
      totalScore: 70,
    });

    app.unmount();
  });

  it('closes the drawer without submitting', async () => {
    const { app, root, submit, updateModelValue } = mountDrawer();
    await flushAll();

    clickButton(root, '空气污染');
    await flushAll();
    clickButton(root, '关闭');
    await flushAll();

    expect(updateModelValue).toHaveBeenCalledWith(false);
    expect(submit).not.toHaveBeenCalled();

    app.unmount();
  });
});
