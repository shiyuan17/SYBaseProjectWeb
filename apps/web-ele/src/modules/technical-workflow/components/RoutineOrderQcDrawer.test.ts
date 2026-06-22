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

const { messageWarning } = vi.hoisted(() => ({
  messageWarning: vi.fn(),
}));

const rowContextKey = Symbol('routine-order-qc-row-context');

vi.mock('element-plus', () => {
  const ElButton = defineComponent({
    props: ['disabled'],
    emits: ['click'],
    setup(props, { attrs, emit, slots }) {
      return () =>
        h(
          'button',
          {
            ...attrs,
            disabled: Boolean(props.disabled),
            type: 'button',
            onClick: (event: MouseEvent) => emit('click', event),
          },
          slots.default?.(),
        );
    },
  });

  const ElDrawer = defineComponent({
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

  const ElRadioGroup = defineComponent({
    props: ['modelValue'],
    emits: ['update:modelValue'],
    setup(props, { emit, slots }) {
      return () =>
        h(
          'div',
          {
            'data-value': props.modelValue,
          },
          slots.default?.({
            update: (value: string) => emit('update:modelValue', value),
          }),
        );
    },
  });

  const ElRadio = defineComponent({
    props: ['label', 'modelValue'],
    setup(props, { slots }) {
      return () =>
        h('label', [
          h('input', {
            'aria-label': props.label,
            type: 'radio',
            value: props.label,
          }),
          slots.default?.() ?? props.label,
        ]);
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
          h('div', { 'data-testid': 'tabs-value' }, props.modelValue),
          slots.default?.(),
        ]);
    },
  });

  const ElTabPane = defineComponent({
    props: ['label', 'name'],
    setup(_, { slots }) {
      return () => h('div', slots.default?.());
    },
  });

  const ElTable = defineComponent({
    props: ['data'],
    setup(props, { slots }) {
      return () =>
        h('div', [
          ...(props.data ?? []).map(
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
                  default: () => [
                    slots.default?.(),
                    h(
                      'div',
                      { 'data-testid': `qc-row-${index}` },
                      JSON.stringify(row),
                    ),
                  ],
                },
              ),
          ),
        ]);
    },
  });

  const ElTableColumn = defineComponent({
    props: ['label'],
    setup(props, { slots }) {
      const rowContext = inject<null | { $index: number; row: unknown }>(
        rowContextKey,
        null,
      );
      return () =>
        h('section', [
          h('span', props.label),
          slots.default?.({
            $index: rowContext?.$index ?? 0,
            row: rowContext?.row ?? {},
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
    ElButton,
    ElDrawer,
    ElInput,
    ElMessage: {
      warning: messageWarning,
    },
    ElRadio,
    ElRadioGroup,
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
    checkItem: 'HE染色',
    id: 'ORDER-1',
    pathologyNo: 'BL-001',
    patientName: '患者甲',
    releaseStatus: '待出片',
    slideNo: 'SLIDE-001',
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
  const submit = vi.fn();
  const activeRowChange = vi.fn();

  const app = createApp({
    setup() {
      const visible = ref(true);
      return () =>
        h(RoutineOrderQcDrawer, {
          latestEvaluation: {
            evaluatedAt: '2026-06-22 10:00:00',
            evaluatorName: '技师甲',
            grade: '乙',
            orderId: 'ORDER-1',
            processingAction: 'NO_ACTION',
            qcAspect: 'SLIDE',
            qcEvaluationId: 'QC-1',
            totalScore: 88,
          },
          modelValue: visible.value,
          rows,
          'onUpdate:modelValue': (value: boolean) => {
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
  };
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

function setInputValue(root: HTMLElement, placeholder: string, value: string) {
  const input = root.querySelector<HTMLInputElement | HTMLTextAreaElement>(
    `[placeholder="${placeholder}"]`,
  );
  if (!input) {
    throw new Error(`Missing input: ${placeholder}`);
  }
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

describe('RoutineOrderQcDrawer', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    messageWarning.mockReset();
  });

  it('calculates total score and grade from deduction items', async () => {
    const { app, root } = mountDrawer();
    await flushAll();

    expect(root.textContent).toContain('最近评价');
    expect(root.textContent).toContain('总分');
    expect(root.textContent).toContain('100');
    expect(root.textContent).toContain('甲');

    findButton(root, '空气污染').click();
    await flushAll();

    expect(root.textContent).toContain('95');
    expect(root.textContent).toContain('甲');

    findButton(root, '组织折叠').click();
    await flushAll();

    expect(root.textContent).toContain('85');
    expect(root.textContent).toContain('乙');

    app.unmount();
  });

  it('switches qc aspect and emits the assembled qc payload', async () => {
    const { app, root, submit } = mountDrawer([
      createRow(),
      createRow({
        blockNo: 'A2',
        id: 'ORDER-2',
        pathologyNo: 'BL-002',
      }),
    ]);
    await flushAll();

    findButton(root, '取材评价').click();
    await flushAll();

    findButton(root, '取材不足').click();
    await flushAll();

    findButton(root, '重新制片').click();
    await flushAll();

    setInputValue(root, '补充备注', '需要尽快返工');
    await flushAll();

    findButton(root, '保存评价').click();
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
      processingAction: 'REMAKE',
      qcAspect: 'GROSSING',
      remarks: '需要尽快返工',
      reworkType: 'REGROSSING',
      totalScore: 70,
    });

    app.unmount();
  });

  it('requires selecting a processing action before submitting', async () => {
    const { app, root, submit } = mountDrawer();
    await flushAll();

    findButton(root, '空气污染').click();
    await flushAll();

    findButton(root, '保存评价').click();
    await flushAll();

    expect(messageWarning).toHaveBeenCalledWith('请选择处理动作');
    expect(submit).not.toHaveBeenCalled();

    app.unmount();
  });
});
