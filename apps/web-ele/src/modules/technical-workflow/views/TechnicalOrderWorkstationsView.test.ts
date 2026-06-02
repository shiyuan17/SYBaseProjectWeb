import { createApp, defineComponent, h, inject, nextTick, provide } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import CytologyWorkstationView from './CytologyWorkstationView.vue';
import IhcWorkstationView from './IhcWorkstationView.vue';
import LiquidCytologyWorkstationView from './LiquidCytologyWorkstationView.vue';
import RoutineOrderWorkstationView from './RoutineOrderWorkstationView.vue';
import SpecialOrderWorkstationView from './SpecialOrderWorkstationView.vue';

const tableRowsKey = Symbol('technical-order-workstation-table-rows');

const { messageInfo } = vi.hoisted(() => ({
  messageInfo: vi.fn(),
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
            disabled: props.disabled,
            type: 'button',
            onClick: (event: MouseEvent) => emit('click', event),
          },
          slots.default?.(),
        );
    },
  });

  const ElCheckbox = defineComponent({
    props: ['modelValue'],
    emits: ['update:modelValue'],
    setup(props, { emit, slots }) {
      return () =>
        h('label', [
          h('input', {
            checked: Boolean(props.modelValue),
            type: 'checkbox',
            onChange: (event: Event) =>
              emit(
                'update:modelValue',
                (event.target as HTMLInputElement).checked,
              ),
          }),
          slots.default?.(),
        ]);
    },
  });

  const ElEmpty = defineComponent({
    props: ['description'],
    setup(props) {
      return () => h('div', props.description);
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

  const ElTable = defineComponent({
    props: ['data'],
    emits: ['selection-change'],
    setup(props, { emit, slots }) {
      provide(tableRowsKey, () => props.data ?? []);

      return () =>
        h('section', [
          slots.default?.(),
          ...(props.data ?? []).map((row: any) =>
            h(
              'button',
              {
                'data-testid': `select-row-${row.id}`,
                type: 'button',
                onClick: () => emit('selection-change', [row]),
              },
              row.id,
            ),
          ),
        ]);
    },
  });

  const ElTableColumn = defineComponent({
    props: ['label'],
    setup(props, { slots }) {
      const getRows = inject<() => any[]>(tableRowsKey, () => []);

      return () =>
        h('div', [
          props.label ? h('span', props.label) : null,
          ...getRows().flatMap((row, index) => slots.default?.({ row, $index: index }) ?? []),
        ]);
    },
  });

  return {
    ElButton,
    ElCheckbox,
    ElEmpty,
    ElInput,
    ElMessage: {
      info: messageInfo,
    },
    ElTable,
    ElTableColumn,
  };
});

function renderView(component: object) {
  const root = document.createElement('div');
  document.body.append(root);

  const app = createApp(component);
  app.mount(root);

  return {
    root,
    unmount() {
      app.unmount();
      root.remove();
    },
  };
}

describe('technical order workstation views', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    messageInfo.mockReset();
  });

  it.each([
    [
      RoutineOrderWorkstationView,
      '常规医嘱工作站',
      '确认',
      '原病理号',
    ],
    [
      SpecialOrderWorkstationView,
      '特检医嘱工作站',
      '确认',
      '项目类型',
    ],
    [IhcWorkstationView, '免疫组化工作站', '染色', '分配设备'],
    [CytologyWorkstationView, '细胞学工作站', '生成蜡块', '送检类型'],
    [
      LiquidCytologyWorkstationView,
      '液基细胞学工作站',
      '打印玻片',
      '流程状态',
    ],
  ])('renders %s shell content', async (component, title, actionLabel, columnLabel) => {
    const wrapper = renderView(component);

    expect(wrapper.root.textContent).toContain(title);
    expect(wrapper.root.textContent).toContain(actionLabel);
    expect(wrapper.root.textContent).toContain(columnLabel);
    expect(wrapper.root.textContent).toContain('首页');
    expect(wrapper.root.textContent).toContain('共');

    wrapper.unmount();
  });

  it('filters local rows by search keyword and restores them when cleared', async () => {
    const wrapper = renderView(RoutineOrderWorkstationView);

    expect(wrapper.root.textContent).toContain('王淑琴');
    expect(wrapper.root.textContent).toContain('李美荣');

    const input = wrapper.root.querySelector(
      'input[placeholder="病理号/病人ID/原病理号"]',
    ) as HTMLInputElement | null;

    expect(input).not.toBeNull();

    input!.value = '李美荣';
    input!.dispatchEvent(new Event('input'));
    await nextTick();

    expect(wrapper.root.textContent).toContain('李美荣');
    expect(wrapper.root.textContent).not.toContain('王淑琴');

    input!.value = '';
    input!.dispatchEvent(new Event('input'));
    await nextTick();

    expect(wrapper.root.textContent).toContain('王淑琴');
    expect(wrapper.root.textContent).toContain('李美荣');

    wrapper.unmount();
  });

  it('keeps selection actions disabled until a row is selected and then shows placeholder feedback', async () => {
    const wrapper = renderView(RoutineOrderWorkstationView);

    const confirmButton = Array.from(wrapper.root.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('确认'),
    ) as HTMLButtonElement | undefined;

    expect(confirmButton).toBeDefined();
    expect(confirmButton?.disabled).toBe(true);

    const rowSelector = wrapper.root.querySelector(
      '[data-testid="select-row-routine-1"]',
    ) as HTMLButtonElement | null;

    expect(rowSelector).not.toBeNull();

    rowSelector!.click();
    await nextTick();

    expect(confirmButton?.disabled).toBe(false);

    confirmButton?.click();

    expect(messageInfo).toHaveBeenCalledWith('确认功能待接入');

    wrapper.unmount();
  });

  it('updates the summary when switching workday tabs and toggling checkbox filters', async () => {
    const wrapper = renderView(RoutineOrderWorkstationView);

    expect(wrapper.root.textContent).toContain('共 3 条记录');

    const rapidCheckbox = Array.from(wrapper.root.querySelectorAll('label')).find(
      (label) => label.textContent?.includes('快速切片'),
    )?.querySelector('input') as HTMLInputElement | null;

    expect(rapidCheckbox).not.toBeNull();

    rapidCheckbox!.checked = true;
    rapidCheckbox!.dispatchEvent(new Event('change'));
    await nextTick();

    expect(wrapper.root.textContent).toContain('共 1 条记录');

    const previousDayButton = Array.from(
      wrapper.root.querySelectorAll('button'),
    ).find((button) => button.textContent?.includes('前1天')) as
      | HTMLButtonElement
      | undefined;

    expect(previousDayButton).toBeDefined();

    previousDayButton?.click();
    await nextTick();

    expect(wrapper.root.textContent).toContain('共 0 条记录');

    wrapper.unmount();
  });
});
