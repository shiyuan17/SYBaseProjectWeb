import type {
  Component,
  ComputedRef,
  FunctionalComponent,
  SetupContext,
} from 'vue';

import { computed, h, inject, provide, ref, watch } from 'vue';

type StubProps = Record<string, unknown>;

type TabsContext = {
  activeName: ComputedRef<string>;
  selectTab: (name: string) => void;
};

type TableRowContext = {
  $index: number;
  isSelected?: boolean;
  row: Record<string, unknown>;
  toggleSelected?: (checked: boolean) => void;
};

type EmitContext = {
  emit: (event: string, ...args: unknown[]) => void;
};

type SlotContext = Pick<SetupContext, 'slots'>;

type EmitSlotContext = EmitContext & SlotContext;

function toText(value: unknown) {
  return value === null || value === undefined ? '' : String(value);
}

function toBooleanAttribute(value: unknown) {
  return value === '' || Boolean(value);
}

function renderOptionalText(tag: string, value: unknown) {
  const text = toText(value);
  return text ? h(tag, text) : null;
}

export function createPassthroughStub(
  tag = 'div',
): FunctionalComponent<StubProps> {
  return (props, { slots }) =>
    h(tag, [
      renderOptionalText('div', props.title),
      renderOptionalText('span', props.label),
      renderOptionalText('div', props.description),
      slots.extra?.(),
      slots.default?.(),
      slots.footer?.(),
    ]);
}

export function createButtonStub(): Component {
  return {
    emits: ['click'],
    inheritAttrs: false,
    props: ['disabled', 'type'],
    setup(
      props: { disabled?: unknown; type?: unknown },
      { attrs, emit, slots },
    ) {
      return () =>
        h(
          'button',
          {
            ...attrs,
            'data-button-variant': toText(props.type ?? attrs.type),
            disabled: toBooleanAttribute(props.disabled ?? attrs.disabled),
            type: 'button',
            onClick: (event: MouseEvent) => emit('click', event),
          },
          slots.default?.(),
        );
    },
  };
}

export function createInputStub(): Component {
  return {
    emits: ['update:modelValue', 'blur'],
    inheritAttrs: false,
    props: ['disabled', 'modelValue', 'placeholder', 'type'],
    setup(
      props: {
        disabled?: unknown;
        modelValue?: unknown;
        placeholder?: unknown;
        type?: unknown;
      },
      { attrs, emit },
    ) {
      return () => {
        const isTextarea = props.type === 'textarea';
        const tag = isTextarea ? 'textarea' : 'input';

        return h(tag, {
          ...attrs,
          disabled: toBooleanAttribute(props.disabled ?? attrs.disabled),
          placeholder: toText(props.placeholder),
          type: isTextarea ? undefined : props.type,
          value: props.modelValue,
          onBlur: () => emit('blur'),
          onInput: (event: Event) =>
            emit(
              'update:modelValue',
              (event.target as HTMLInputElement | HTMLTextAreaElement).value,
            ),
        });
      };
    },
  };
}

export function createInputNumberStub(): FunctionalComponent<StubProps> {
  return (props, { emit }) =>
    h('input', {
      ...props,
      min: typeof props.min === 'number' ? props.min : undefined,
      type: 'number',
      value:
        props.modelValue === null || props.modelValue === undefined
          ? ''
          : String(props.modelValue),
      onInput: (event: Event) =>
        emit(
          'update:modelValue',
          Number((event.target as HTMLInputElement).value),
        ),
    });
}

export function createSelectStub(): FunctionalComponent<StubProps> {
  return (props, { emit, slots }) =>
    h(
      'select',
      {
        ...props,
        value: props.modelValue,
        onChange: (event: Event) =>
          emit('update:modelValue', (event.target as HTMLSelectElement).value),
      },
      slots.default?.(),
    );
}

export function createOptionStub(): FunctionalComponent<StubProps> {
  return (props) =>
    h(
      'option',
      { ...props, value: props.value },
      toText(props.label || props.value),
    );
}

export function createDialogStub(): FunctionalComponent<StubProps> {
  return (props, { slots }) =>
    props.modelValue
      ? h('section', [
          renderOptionalText('h3', props.title),
          slots.default?.(),
          slots.footer?.(),
        ])
      : null;
}

export function createAlertStub(): FunctionalComponent<StubProps> {
  return (props, { slots }) =>
    h('div', { 'data-testid': 'alert' }, [
      renderOptionalText('strong', props.title),
      slots.default?.(),
    ]);
}

export function createEmptyStub(): FunctionalComponent<StubProps> {
  return (props) =>
    h('div', { 'data-testid': 'empty' }, toText(props.description));
}

export function createTagStub(): FunctionalComponent<StubProps> {
  return (props, { slots }) =>
    h(
      'span',
      {
        ...props,
        'data-tag-type': toText(props.type),
      },
      slots.default?.(),
    );
}

export function createAutocompleteStub(): FunctionalComponent<StubProps> {
  return (props, { emit }) =>
    h('input', {
      'data-testid': 'autocomplete',
      placeholder: toText(props.placeholder),
      value: props.modelValue,
      onBlur: () => emit('blur'),
      onInput: (event: Event) =>
        emit('update:modelValue', (event.target as HTMLInputElement).value),
    });
}

export function createWorkflowSectionCardStub(): FunctionalComponent<StubProps> {
  return (props, { slots }) =>
    h('section', [
      renderOptionalText('h2', props.title),
      renderOptionalText('p', props.description),
      slots.extra?.(),
      slots.default?.(),
    ]);
}

export function createModelTextStub(
  dataAttributeName: string,
): FunctionalComponent<StubProps> {
  return (props) =>
    h(
      'div',
      { [dataAttributeName]: toText(props.placeholder) },
      toText(props.modelValue || props.selectedLabel),
    );
}

export function createTabsStub(tabsContextKey: symbol): Component {
  return {
    emits: ['update:modelValue'],
    props: ['modelValue'],
    setup(props: { modelValue?: unknown }, { emit, slots }: EmitSlotContext) {
      const activeName = computed(() => String(props.modelValue ?? ''));
      provide<TabsContext>(tabsContextKey, {
        activeName,
        selectTab: (name: string) => emit('update:modelValue', name),
      });
      return () =>
        h('div', { 'data-active-tab': activeName.value }, slots.default?.());
    },
  };
}

export function createTabPaneStub(tabsContextKey: symbol): Component {
  return {
    props: ['label', 'name'],
    setup(props: { label?: unknown; name?: unknown }, { slots }: SlotContext) {
      const tabsContext = inject<null | TabsContext>(tabsContextKey, null);
      const name = String(props.name ?? '');
      const isActive = computed(() => tabsContext?.activeName.value === name);

      return () =>
        h('section', [
          h(
            'button',
            {
              'data-tab-name': name,
              type: 'button',
              onClick: () => tabsContext?.selectTab(name),
            },
            toText(props.label),
          ),
          isActive.value
            ? h('div', { 'data-tab-panel': name }, slots.default?.())
            : null,
        ]);
    },
  };
}

export function createDescriptionsItemStub(): FunctionalComponent<StubProps> {
  return (props, { slots }) =>
    h('div', [
      renderOptionalText(
        'strong',
        props.label ? `${toText(props.label)}:` : '',
      ),
      slots.default?.(),
    ]);
}

export function createTimelineItemStub(): FunctionalComponent<StubProps> {
  return (props, { slots }) =>
    h('li', [renderOptionalText('span', props.timestamp), slots.default?.()]);
}

export function createTableStub(rowContextKey: symbol): Component {
  return {
    emits: ['selection-change'],
    props: ['data', 'height', 'maxHeight', 'rowClassName'],
    setup(
      props: {
        data?: unknown;
        height?: unknown;
        maxHeight?: unknown;
        rowClassName?: unknown;
      },
      { emit, slots }: EmitSlotContext,
    ) {
      const selectedRows = ref<Record<string, unknown>[]>([]);

      watch(
        () => props.data,
        (data) => {
          if (!Array.isArray(data)) {
            selectedRows.value = [];
            return;
          }
          selectedRows.value = selectedRows.value.filter((row) =>
            data.includes(row),
          );
        },
      );

      function resolveRowClassName(
        row: Record<string, unknown>,
        index: number,
      ) {
        if (typeof props.rowClassName !== 'function') {
          return '';
        }
        return String(
          props.rowClassName({
            row,
            rowIndex: index,
          }) ?? '',
        );
      }

      function toggleRowSelection(
        row: Record<string, unknown>,
        checked: boolean,
      ) {
        const nextSelection = selectedRows.value.filter((item) => item !== row);
        if (checked) {
          nextSelection.push(row);
        }
        emit('selection-change', nextSelection);
      }

      return () =>
        h(
          'div',
          {
            'data-height':
              (props.height === null || props.height === undefined) &&
              (props.maxHeight === null || props.maxHeight === undefined)
                ? ''
                : String(props.height ?? props.maxHeight),
            'data-testid': 'table',
          },
          (Array.isArray(props.data) ? props.data : []).map((row, index) =>
            h(
              createRowProviderStub(rowContextKey),
              {
                class: resolveRowClassName(
                  row as Record<string, unknown>,
                  index,
                ),
                index,
                isSelected: selectedRows.value.includes(
                  row as Record<string, unknown>,
                ),
                key: index,
                row: row as Record<string, unknown>,
                toggleSelected: (checked: boolean) =>
                  toggleRowSelection(row as Record<string, unknown>, checked),
              },
              () => slots.default?.(),
            ),
          ),
        );
    },
  };
}

function createRowProviderStub(rowContextKey: symbol): Component {
  return {
    props: ['row', 'index', 'isSelected', 'toggleSelected'],
    setup(
      props: {
        index?: unknown;
        isSelected?: unknown;
        row?: unknown;
        toggleSelected?: unknown;
      },
      { slots }: SlotContext,
    ) {
      provide<TableRowContext>(rowContextKey, {
        $index: typeof props.index === 'number' ? props.index : 0,
        isSelected: Boolean(props.isSelected),
        row: (props.row as Record<string, unknown>) ?? {},
        toggleSelected:
          typeof props.toggleSelected === 'function'
            ? (props.toggleSelected as (checked: boolean) => void)
            : undefined,
      });
      return () => h('div', slots.default?.());
    },
  };
}

export function createTableColumnStub(rowContextKey: symbol): Component {
  return {
    props: ['label', 'prop', 'selectable', 'type'],
    setup(
      props: {
        label?: unknown;
        prop?: unknown;
        selectable?: unknown;
        type?: unknown;
      },
      { slots }: SlotContext,
    ) {
      const rowContext = inject<null | TableRowContext>(rowContextKey, null);

      return () =>
        h(
          'div',
          { 'data-column-label': toText(props.label || props.type) },
          props.type === 'selection' && rowContext
            ? (() => {
                const selectable =
                  typeof props.selectable === 'function'
                    ? props.selectable(rowContext.row, rowContext.$index)
                    : true;
                return h('input', {
                  checked: Boolean(rowContext.isSelected),
                  disabled: !selectable,
                  type: 'checkbox',
                  onChange: (event: Event) =>
                    rowContext.toggleSelected?.(
                      (event.target as HTMLInputElement).checked,
                    ),
                });
              })()
            : (slots.default?.({
                $index: rowContext?.$index ?? 0,
                row: rowContext?.row ?? {},
              }) ??
                (() => {
                  const value =
                    props.prop && rowContext
                      ? rowContext.row[String(props.prop)]
                      : undefined;
                  return value === null || value === undefined
                    ? undefined
                    : h('span', String(value));
                })()),
        );
    },
  };
}
