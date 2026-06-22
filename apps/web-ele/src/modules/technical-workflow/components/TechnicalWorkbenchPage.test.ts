import type {
  TechnicalWorkbenchPageConfig,
  TechnicalWorkbenchPageExpose,
  TechnicalWorkbenchQueryActionEventPayload,
  TechnicalWorkbenchRow,
} from '../types/technical-workbench';

import { createApp, defineComponent, h, nextTick, ref } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

const tableRowsKey = Symbol('technical-workbench-page-table-rows');

const { messageInfo, mockRoute } = vi.hoisted(() => ({
  messageInfo: vi.fn(),
  mockRoute: {
    query: {},
  } as { query: Record<string, string> },
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
          h('h1', props.title),
          props.description ? h('p', props.description) : null,
          slots.default?.(),
        ]);
    },
  }),
}));

vi.mock('element-plus', async () => {
  const { inject, provide } = await import('vue');

  const ElAlert = defineComponent({
    props: ['title'],
    setup(props, { slots }) {
      return () =>
        h('div', { role: 'alert' }, [
          slots.title?.() ?? props.title,
          slots.default?.(),
        ]);
    },
  });

  const ElButton = defineComponent({
    props: ['disabled', 'link', 'type'],
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

  const ElDatePicker = defineComponent({
    props: ['modelValue'],
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h('input', {
          'data-testid': 'work-date-picker',
          value: Array.isArray(props.modelValue)
            ? props.modelValue.join(',')
            : props.modelValue,
          onInput: (event: Event) =>
            emit('update:modelValue', (event.target as HTMLInputElement).value),
        });
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

  const ElOption = defineComponent({
    props: ['label', 'value'],
    setup(props) {
      return () =>
        h('option', { value: props.value }, props.label ?? props.value);
    },
  });

  const ElPagination = defineComponent({
    props: ['currentPage', 'pageSize', 'total'],
    emits: ['update:currentPage', 'update:pageSize'],
    setup(props, { emit }) {
      return () =>
        h('div', [
          `total:${props.total};page:${props.currentPage};size:${props.pageSize}`,
          h(
            'button',
            {
              'data-testid': 'page-size-50',
              type: 'button',
              onClick: () => emit('update:pageSize', 50),
            },
            'size50',
          ),
        ]);
    },
  });

  const ElSelect = defineComponent({
    props: ['modelValue'],
    emits: ['update:modelValue'],
    setup(props, { emit, slots }) {
      return () =>
        h(
          'select',
          {
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
    props: ['data', 'loading'],
    emits: ['selection-change'],
    setup(props, { emit, slots }) {
      provide(tableRowsKey, () => props.data ?? []);

      return () =>
        h('section', { 'data-loading': props.loading ? 'true' : 'false' }, [
          slots.default?.(),
          ...(props.data ?? []).map((row: TechnicalWorkbenchRow) =>
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
      const getRows = inject<() => TechnicalWorkbenchRow[]>(
        tableRowsKey,
        () => [],
      );

      return () =>
        h('div', [
          props.label ? h('span', props.label) : null,
          ...getRows().flatMap(
            (row, index) => slots.default?.({ row, $index: index }) ?? [],
          ),
        ]);
    },
  });

  return {
    ElAlert,
    ElButton,
    ElCheckbox,
    ElDatePicker,
    ElEmpty,
    ElInput,
    ElMessage: {
      info: messageInfo,
    },
    ElOption,
    ElPagination,
    ElSelect,
    ElTable,
    ElTableColumn,
  };
});

import TechnicalWorkbenchPage from './TechnicalWorkbenchPage.vue';

function createConfig(
  overrides: Partial<TechnicalWorkbenchPageConfig> = {},
): TechnicalWorkbenchPageConfig {
  return {
    columns: [{ key: 'pathologyNo', label: '病理号', minWidth: 120 }],
    dataSource: {
      load: vi.fn().mockResolvedValue({
        page: 1,
        rows: [
          {
            id: 'ROW-1',
            pathologyNo: 'BL-001',
            searchableText: 'bl-001',
          },
        ],
        size: 20,
        total: 1,
      }),
    },
    defaultPageSize: 20,
    defaultWorkday: 'today',
    description: '技术工作站测试页',
    emptyText: '暂无数据',
    queryActions: [{ id: 'more', label: '更多' }],
    searchPlaceholder: '请输入病理号',
    showPageHeader: false,
    title: '测试工作站',
    toolbarGroups: [
      [{ id: 'confirm', label: '确认', requiresSelection: true }],
    ],
    ...overrides,
  };
}

function renderPage(
  options: {
    config?: TechnicalWorkbenchPageConfig;
    onQueryAction?: (
      payload: TechnicalWorkbenchQueryActionEventPayload,
    ) => void;
    onSelectionChange?: (rows: TechnicalWorkbenchRow[]) => void;
    onToolbarAction?: (payload: unknown) => void;
  } = {},
) {
  const root = document.createElement('div');
  document.body.append(root);
  const pageRef = ref<null | TechnicalWorkbenchPageExpose>(null);
  const app = createApp({
    setup() {
      return () =>
        h(TechnicalWorkbenchPage, {
          ref: pageRef,
          config: options.config ?? createConfig(),
          onQueryAction: options.onQueryAction,
          onSelectionChange: options.onSelectionChange,
          onToolbarAction: options.onToolbarAction,
        });
    },
  });
  app.mount(root);

  return {
    pageRef,
    root,
    unmount() {
      app.unmount();
      root.remove();
    },
  };
}

async function flushAll() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
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

describe('TechnicalWorkbenchPage', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    messageInfo.mockReset();
  });

  it('emits toolbar-action and selection-change when parent takes over', async () => {
    const toolbarAction = vi.fn();
    const selectionChange = vi.fn();

    const wrapper = renderPage({
      onSelectionChange: selectionChange,
      onToolbarAction: toolbarAction,
    });
    await flushAll();

    expect(findButton(wrapper.root, '确认').disabled).toBe(true);

    wrapper.root
      .querySelector<HTMLButtonElement>('[data-testid="select-row-ROW-1"]')
      ?.click();
    await flushAll();

    expect(selectionChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'ROW-1', pathologyNo: 'BL-001' }),
    ]);
    expect(findButton(wrapper.root, '确认').disabled).toBe(false);

    findButton(wrapper.root, '确认').click();

    expect(toolbarAction).toHaveBeenCalledWith({
      action: expect.objectContaining({ id: 'confirm', label: '确认' }),
      selectedRows: [
        expect.objectContaining({ id: 'ROW-1', pathologyNo: 'BL-001' }),
      ],
    });
    expect(messageInfo).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it('emits query-action and exposes reload for parent refresh', async () => {
    const queryAction = vi.fn();
    const config = createConfig();
    const load = vi.mocked(config.dataSource!.load);

    const wrapper = renderPage({
      config,
      onQueryAction: queryAction,
    });
    await flushAll();

    expect(load).toHaveBeenCalledTimes(1);

    findButton(wrapper.root, '更多').click();
    expect(queryAction).toHaveBeenCalledWith({
      action: expect.objectContaining({ id: 'more', label: '更多' }),
      dateRange: [],
      page: 1,
      pageSize: 20,
      searchKeyword: '',
      selectedRows: [],
      status: '',
      trigger: 'action',
    });
    expect(messageInfo).not.toHaveBeenCalled();

    await wrapper.pageRef.value?.reload();
    await flushAll();

    expect(load).toHaveBeenCalledTimes(2);

    wrapper.unmount();
  });

  it('keeps placeholder toast when parent does not take over toolbar or query actions', async () => {
    const wrapper = renderPage();
    await flushAll();

    wrapper.root
      .querySelector<HTMLButtonElement>('[data-testid="select-row-ROW-1"]')
      ?.click();
    await flushAll();

    findButton(wrapper.root, '确认').click();
    findButton(wrapper.root, '更多').click();

    expect(messageInfo).toHaveBeenNthCalledWith(1, '确认功能待接入');
    expect(messageInfo).toHaveBeenNthCalledWith(2, '更多功能待接入');

    wrapper.unmount();
  });
});
