import type {
  SpecimenDictionaryEntryOption,
  WorkbenchSpecimenItem,
  WorkbenchSpecimenPrintContext,
} from '../types/application-registration-workbench';

import {
  computed,
  createApp,
  defineComponent,
  h,
  inject,
  provide,
  type ComputedRef,
} from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

const tableDataKey = Symbol('table-data');
const buildSpecimenPrintDocumentMock = vi.hoisted(() => vi.fn());
const buildSpecimenBatchPrintDocumentMock = vi.hoisted(() => vi.fn());
const warningMock = vi.hoisted(() => vi.fn());
const errorMock = vi.hoisted(() => vi.fn());

vi.mock('element-plus', () => ({
  ElAutocomplete: defineComponent({
    props: {
      modelValue: { default: '', type: String },
    },
    emits: ['blur', 'select', 'update:model-value'],
    setup(props) {
      return () => h('div', { 'data-testid': 'autocomplete' }, props.modelValue);
    },
  }),
  ElButton: defineComponent({
    emits: ['click'],
    setup(_, { emit, slots }) {
      return () =>
        h(
          'button',
          {
            onClick: () => emit('click'),
            type: 'button',
          },
          slots.default?.(),
        );
    },
  }),
  ElEmpty: defineComponent({
    props: {
      description: { default: '', type: String },
    },
    setup(props) {
      return () => h('div', { 'data-testid': 'empty' }, props.description);
    },
  }),
  ElInputNumber: defineComponent({
    props: {
      modelValue: { default: 1, type: Number },
    },
    emits: ['update:model-value'],
    setup(props) {
      return () => h('div', { 'data-testid': 'input-number' }, String(props.modelValue));
    },
  }),
  ElMessage: {
    error: errorMock,
    warning: warningMock,
  },
  ElTable: defineComponent({
    props: {
      data: { default: () => [], type: Array },
      height: { default: undefined, type: [Number, String] },
    },
    emits: ['selection-change'],
    setup(props, { slots }) {
      provide(
        tableDataKey,
        computed(() => props.data),
      );
      return () =>
        h(
          'div',
          {
            'data-height': props.height === undefined ? '' : String(props.height),
            'data-testid': 'table',
          },
          slots.default?.(),
        );
    },
  }),
  ElTableColumn: defineComponent({
    props: {
      label: { default: '', type: String },
      prop: { default: '', type: String },
    },
    setup(props, { slots }) {
      const data = inject<ComputedRef<WorkbenchSpecimenItem[]>>(tableDataKey);

      return () =>
        h(
          'div',
          { 'data-column-label': props.label },
          (data?.value ?? []).map((row, index) =>
            h(
              'div',
              {
                'data-column-cell': `${props.label}-${index}`,
              },
              slots.default?.({ $index: index, row }) ??
                (props.prop ? String(row[props.prop as keyof WorkbenchSpecimenItem] ?? '') : ''),
            ),
          ),
        );
    },
  }),
  ElTag: defineComponent({
    props: {
      type: { default: '', type: String },
    },
    setup(props, { slots }) {
      return () => h('span', { 'data-tag-type': props.type }, slots.default?.());
    },
  }),
}));

vi.mock('./WorkflowSectionCard.vue', () => ({
  default: defineComponent({
    setup(_, { slots }) {
      return () => h('section', slots.default?.());
    },
  }),
}));

vi.mock('../utils/specimen-print', () => ({
  buildSpecimenBatchPrintDocument: buildSpecimenBatchPrintDocumentMock,
  buildSpecimenPrintDocument: buildSpecimenPrintDocumentMock,
}));

import ApplicationRegistrationSpecimenTable from './ApplicationRegistrationSpecimenTable.vue';

type Wrapper = {
  container: HTMLElement;
  unmount: () => void;
};

function createSpecimenItem(status: string): WorkbenchSpecimenItem {
  return {
    id: `item-${status}`,
    quantity: 1,
    specimenName: `标本-${status}`,
    specimenNo: `SP-${status}`,
    specimenSite: '胃',
    status,
  };
}

function createProps(items: WorkbenchSpecimenItem[]) {
  return {
    commonSpecimenOptions: [] as SpecimenDictionaryEntryOption[],
    items,
    printContext: null as WorkbenchSpecimenPrintContext | null,
    roomLabel: 'A01',
    specimenEntryOptions: [] as SpecimenDictionaryEntryOption[],
  };
}

function renderComponent(items: WorkbenchSpecimenItem[]): Wrapper {
  const container = document.createElement('div');
  document.body.append(container);

  const app = createApp(ApplicationRegistrationSpecimenTable, createProps(items));
  app.mount(container);

  return {
    container,
    unmount() {
      app.unmount();
      container.remove();
    },
  };
}

describe('ApplicationRegistrationSpecimenTable', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    buildSpecimenPrintDocumentMock.mockReset();
    buildSpecimenBatchPrintDocumentMock.mockReset();
    warningMock.mockReset();
    errorMock.mockReset();
  });

  it('uses Chinese labels for known specimen status codes and keeps fallback values', () => {
    const wrapper = renderComponent([
      createSpecimenItem('FIXED'),
      createSpecimenItem('RECEIVED'),
      createSpecimenItem('REGISTERED'),
      createSpecimenItem('新增'),
      createSpecimenItem('UNKNOWN_STATUS'),
    ]);

    const tagTexts = [...wrapper.container.querySelectorAll('[data-tag-type]')].map((node) =>
      node.textContent?.trim(),
    );

    expect(tagTexts).toEqual([
      '固定完成',
      '已接收',
      '已登记',
      '新增',
      'UNKNOWN_STATUS',
    ]);
    expect(tagTexts).not.toContain('FIXED');
    expect(tagTexts).not.toContain('RECEIVED');
    expect(tagTexts).not.toContain('REGISTERED');

    wrapper.unmount();
  });

  it('matches tag types by raw status values', () => {
    const wrapper = renderComponent([
      createSpecimenItem('FIXED'),
      createSpecimenItem('新增'),
      createSpecimenItem('RETURNED'),
    ]);

    const tagTypes = [...wrapper.container.querySelectorAll('[data-tag-type]')].map((node) =>
      node.getAttribute('data-tag-type'),
    );

    expect(tagTypes).toEqual(['primary', 'info', 'warning']);

    wrapper.unmount();
  });

  it('does not force table full height when there are no specimen rows', () => {
    const wrapper = renderComponent([]);

    const table = wrapper.container.querySelector('[data-testid="table"]');
    expect(table?.getAttribute('data-height')).toBe('');
    expect(wrapper.container.textContent).toContain('暂无标本，请从下方字典、常用标本或套餐中快速追加');

    wrapper.unmount();
  });

  it('shows print action text instead of preview', () => {
    const wrapper = renderComponent([createSpecimenItem('FIXED')]);

    expect(wrapper.container.textContent).toContain('打印');
    expect(wrapper.container.textContent).not.toContain('预览');

    wrapper.unmount();
  });

  it('warns when printing without print context', async () => {
    const wrapper = renderComponent([createSpecimenItem('FIXED')]);

    const printButton = [...wrapper.container.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('打印'),
    );
    printButton?.click();

    expect(warningMock).toHaveBeenCalledWith('当前缺少标签打印所需的患者上下文信息');

    wrapper.unmount();
  });
});
