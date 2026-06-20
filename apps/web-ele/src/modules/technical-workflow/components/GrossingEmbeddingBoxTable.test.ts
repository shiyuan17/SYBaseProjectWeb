import type { InjectionKey } from 'vue';

import { createApp, defineComponent, h, inject, provide, ref } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import GrossingEmbeddingBoxTable from './GrossingEmbeddingBoxTable.vue';

const tableRowContextKey = Symbol(
  'grossing-embedding-box-table-row',
) as InjectionKey<{
  $index: number;
  row: Record<string, unknown>;
}>;

vi.mock(
  '#/modules/system-management/components/ReferenceOptionSelect.vue',
  () => ({
    default: defineComponent({
      props: ['modelValue', 'placeholder'],
      emits: ['update:modelValue'],
      setup(props, { emit }) {
        return () =>
          h('input', {
            placeholder: props.placeholder,
            value: props.modelValue,
            onInput: (event: Event) =>
              emit(
                'update:modelValue',
                (event.target as HTMLInputElement).value,
              ),
          });
      },
    }),
  }),
);

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

  const ElEmpty = defineComponent({
    props: ['description'],
    setup(props) {
      return () => h('div', String(props.description ?? ''));
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
    props: ['ariaLabel', 'modelValue'],
    emits: ['update:modelValue'],
    setup(props, { attrs, emit, slots }) {
      return () =>
        h(
          'select',
          {
            ...attrs,
            'aria-label': attrs['aria-label'] ?? props.ariaLabel,
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
        h(
          'div',
          (Array.isArray(props.data) ? props.data : []).map((row, $index) =>
            h(
              defineComponent({
                setup(_, { slots: rowSlots }) {
                  provide(tableRowContextKey, { $index, row });
                  return () => h('div', rowSlots.default?.());
                },
              }),
              () => slots.default?.(),
            ),
          ),
        );
    },
  });

  const ElTableColumn = defineComponent({
    props: ['fixed', 'label'],
    setup(props, { slots }) {
      return () => {
        const context = inject(tableRowContextKey);
        return h(
          'div',
          {
            'data-column-fixed': props.fixed,
            'data-column-label': props.label,
          },
          [
            h('span', String(props.label ?? '')),
            context ? slots.default?.(context) : null,
          ],
        );
      };
    },
  });

  return {
    ElButton,
    ElEmpty,
    ElInput,
    ElOption,
    ElSelect,
    ElTable,
    ElTableColumn,
    ElTooltip: defineComponent({
      setup(_, { slots }) {
        return () => h('span', slots.default?.());
      },
    }),
  };
});

function mountTable(options?: {
  canAddEmbeddingBox?: boolean;
  readOnly?: boolean;
}) {
  const root = document.createElement('div');
  document.body.append(root);
  const selectedSpecimenKey = ref('specimen-1');
  const addEmbeddingBoxes = vi.fn();
  const removeEmbeddingBox = vi.fn();
  const app = createApp({
    setup() {
      return () =>
        h(GrossingEmbeddingBoxTable, {
          canAddEmbeddingBox: options?.canAddEmbeddingBox ?? true,
          embeddingBoxRows: [
            {
              box: {
                boxName: '包埋盒 1',
                embeddingBoxNo: 'BX-BD202606080002-A1',
                embeddingRemarks: '历史备注',
                sequenceNo: 1,
                status: 'CONFIRMED',
              },
              boxIndex: 0,
              specimenIndex: 0,
              specimenName: '骨髓',
            },
          ],
          embeddingRemarkOptions: [],
          marginMarkingOptions: [],
          readOnly: options?.readOnly ?? false,
          selectedSpecimenKey: selectedSpecimenKey.value,
          specimenOptions: [
            { label: '骨髓', value: 'specimen-1' },
            { label: '皮肤组织', value: 'specimen-2' },
          ],
          onAddEmbeddingBoxes: addEmbeddingBoxes,
          onRemoveEmbeddingBox: removeEmbeddingBox,
          'onUpdate:selectedSpecimenKey': (value: string) => {
            selectedSpecimenKey.value = value;
          },
        });
    },
  });
  app.mount(root);
  return {
    addEmbeddingBoxes,
    app,
    removeEmbeddingBox,
    root,
    selectedSpecimenKey,
  };
}

describe('GrossingEmbeddingBoxTable', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders specimen name options and updates the selected specimen', async () => {
    const { app, root, selectedSpecimenKey } = mountTable();

    const specimenSelect = root.querySelector<HTMLSelectElement>(
      'select[aria-label="标本名称"]',
    );
    expect(specimenSelect).toBeTruthy();
    expect(specimenSelect!.className).toContain('min-w-[288px]');
    expect(specimenSelect!.className).toContain('flex-none');
    expect(root.textContent).toContain('骨髓');
    expect(root.textContent).toContain('皮肤组织');
    expect(root.querySelector('select[aria-label="盒号"]')).toBeNull();
    expect(root.textContent).not.toContain('A1 / 待确认');
    expect(root.querySelector('input[placeholder="A1"]')).toBeNull();
    expect(root.textContent).toContain('A1');
    expect(root.textContent).not.toContain('BX-BD202606080002-A1');

    specimenSelect!.value = 'specimen-2';
    specimenSelect!.dispatchEvent(new Event('change'));
    await Promise.resolve();

    expect(selectedSpecimenKey.value).toBe('specimen-2');
    app.unmount();
  });

  it('adds the specimen name column after sequence', () => {
    const { app, root } = mountTable();

    const columnLabels = [
      ...root.querySelectorAll<HTMLElement>('[data-column-label]'),
    ].map((item) => item.dataset.columnLabel);
    expect(columnLabels.slice(0, 2)).toEqual(['序号', '标本名称']);
    expect(root.textContent).toContain('骨髓');

    app.unmount();
  });

  it('emits only the requested count when adding embedding boxes', async () => {
    const { addEmbeddingBoxes, app, root } = mountTable();

    root.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
      if (button.textContent?.includes('+2')) {
        button.click();
      }
    });

    expect(addEmbeddingBoxes).toHaveBeenCalledWith(2);
    app.unmount();
  });

  it('fixes the operation column and deletes without confirmation', async () => {
    const { app, removeEmbeddingBox, root } = mountTable();

    expect(
      root.querySelector(
        '[data-column-label="操作"][data-column-fixed="right"]',
      ),
    ).toBeTruthy();

    const deleteButton = [
      ...root.querySelectorAll<HTMLButtonElement>('button'),
    ].find((button) => button.textContent?.includes('删除'));
    expect(deleteButton).toBeTruthy();
    deleteButton!.click();
    await Promise.resolve();

    expect(removeEmbeddingBox).toHaveBeenCalledWith(0, 0);
    app.unmount();
  });

  it('renders read-only embedding box rows without add or delete controls', () => {
    const { app, root } = mountTable({
      canAddEmbeddingBox: false,
      readOnly: true,
    });

    expect(root.textContent).toContain('A1');
    expect(root.textContent).toContain('已确认');
    expect(root.textContent).toContain('历史备注');
    expect(root.textContent).not.toContain('删除');
    expect(root.textContent).not.toContain('+1');
    expect(root.querySelector('[data-column-label="操作"]')).toBeNull();

    app.unmount();
  });
});
