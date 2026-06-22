import { createApp, defineComponent, h, nextTick, ref } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

const { messageWarning } = vi.hoisted(() => ({
  messageWarning: vi.fn(),
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
            disabled: Boolean(props.disabled),
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

  const ElForm = defineComponent({
    setup(_, { slots }) {
      return () => h('form', slots.default?.());
    },
  });

  const ElFormItem = defineComponent({
    props: ['label'],
    setup(props, { slots }) {
      return () =>
        h('label', [
          props.label ? h('span', props.label) : null,
          slots.default?.(),
        ]);
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
          slots.default?.(),
          ...(props.data ?? []).map((row: Record<string, string>) =>
            h(
              'div',
              { 'data-testid': `termination-row-${row.id}` },
              `${row.pathologyNo ?? ''} ${row.blockNo ?? ''} ${row.checkItem ?? ''} ${row.patientName ?? ''}`,
            ),
          ),
        ]);
    },
  });

  const ElTableColumn = defineComponent({
    props: ['label'],
    setup(props) {
      return () => h('span', props.label);
    },
  });

  return {
    ElButton,
    ElDialog,
    ElForm,
    ElFormItem,
    ElInput,
    ElMessage: {
      warning: messageWarning,
    },
    ElOption,
    ElSelect,
    ElTable,
    ElTableColumn,
  };
});

import RoutineOrderTerminationDialog from './RoutineOrderTerminationDialog.vue';

function createRow(overrides: Record<string, string | undefined> = {}) {
  return {
    blockNo: 'A1',
    checkItem: 'HE染色',
    id: 'ORDER-1',
    patientName: '患者甲',
    pathologyNo: 'BL-001',
    releaseStatus: '已确认',
    ...overrides,
  };
}

async function flushAll() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

function mountDialog(rows = [createRow()]) {
  const root = document.createElement('div');
  document.body.append(root);
  const submitted = vi.fn();

  const app = createApp({
    setup() {
      const visible = ref(true);
      return () =>
        h(RoutineOrderTerminationDialog, {
          modelValue: visible.value,
          rows,
          'onUpdate:modelValue': (value: boolean) => {
            visible.value = value;
          },
          onSubmit: submitted,
        });
    },
  });
  app.mount(root);

  return {
    app,
    root,
    submitted,
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

function setSelectValue(root: HTMLElement, value: string) {
  const select = root.querySelector('select');
  if (!select) {
    throw new Error('Missing select');
  }
  select.value = value;
  select.dispatchEvent(new Event('change'));
}

function setTextareaValue(root: HTMLElement, value: string) {
  const textarea = root.querySelector('textarea');
  if (!textarea) {
    throw new Error('Missing textarea');
  }
  textarea.value = value;
  textarea.dispatchEvent(new Event('input'));
}

describe('RoutineOrderTerminationDialog', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    messageWarning.mockReset();
  });

  it('shows selected orders and emits a termination payload', async () => {
    const { app, root, submitted } = mountDialog([
      createRow(),
      createRow({
        blockNo: 'A2',
        id: 'ORDER-2',
        pathologyNo: 'BL-002',
      }),
    ]);
    await flushAll();

    expect(root.textContent).toContain('BL-001');
    expect(root.textContent).toContain('BL-002');

    setSelectValue(root, 'BLOCK_DAMAGED');
    await flushAll();

    findButton(root, '保存').click();
    await flushAll();

    expect(submitted).toHaveBeenCalledWith({
      terminationReasonCode: 'BLOCK_DAMAGED',
      terminationReasonLabel: '蜡块已损坏无法使用',
      terminationRemarks: '',
    });

    app.unmount();
  });

  it('requires remarks when termination reason is OTHER', async () => {
    const { app, root, submitted } = mountDialog();
    await flushAll();

    setSelectValue(root, 'OTHER');
    await flushAll();

    findButton(root, '保存').click();
    await flushAll();

    expect(messageWarning).toHaveBeenCalledWith('选择“其他”时请填写备注');
    expect(submitted).not.toHaveBeenCalled();

    setTextareaValue(root, '蜡块条码缺失，待人工核对');
    await flushAll();

    findButton(root, '保存').click();
    await flushAll();

    expect(submitted).toHaveBeenCalledWith({
      terminationReasonCode: 'OTHER',
      terminationReasonLabel: '其他',
      terminationRemarks: '蜡块条码缺失，待人工核对',
    });

    app.unmount();
  });
});
