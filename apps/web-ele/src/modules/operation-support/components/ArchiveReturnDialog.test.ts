import { createApp, defineComponent, h, reactive } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('element-plus', () => {
  const ElAlert = defineComponent({
    props: ['title'],
    setup(props, { slots }) {
      return () => h('div', [props.title, slots.default?.()]);
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

  const ElDialog = defineComponent({
    props: ['modelValue', 'title'],
    setup(props, { slots }) {
      return () => h('div', [props.title, slots.default?.(), slots.footer?.()]);
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
      return () => h('label', [props.label, slots.default?.()]);
    },
  });

  const ElInput = defineComponent({
    props: ['modelValue'],
    emits: ['update:modelValue'],
    setup(props, { attrs, emit }) {
      return () =>
        h('input', {
          ...attrs,
          value: props.modelValue,
          onInput: (event: Event) =>
            emit('update:modelValue', (event.target as HTMLInputElement).value),
        });
    },
  });

  return {
    ElAlert,
    ElButton,
    ElDialog,
    ElForm,
    ElFormItem,
    ElInput,
  };
});

import ArchiveReturnDialog from './ArchiveReturnDialog.vue';

function mountDialog() {
  const root = document.createElement('div');
  document.body.append(root);

  const visible = true;
  const returnForm = reactive({
    operatorName: '归档员甲',
    remarks: '',
    terminalCode: '',
  });

  const app = createApp({
    render: () =>
      h(ArchiveReturnDialog, {
        materialSummary: '1 条：BK-001',
        modelValue: visible,
        'onUpdate:modelValue': () => {},
        returningLoan: {
          caseId: 'CASE-1',
          loanId: 'LOAN-1',
          loanStatus: 'BORROWED',
          materialId: 'BOX-1',
          materialType: 'EMBEDDING_BOX',
        },
        returnForm,
        'onUpdate:returnForm': () => {},
        selectedCount: 1,
        selectedPositionLabel: '未选择替代柜位',
        selectedReturnPositionDescription: '默认归还到原始归档柜位',
        submitting: false,
      }),
  });

  app.mount(root);

  return {
    destroy() {
      app.unmount();
      root.remove();
    },
  };
}

describe('ArchiveReturnDialog', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('shows readonly operator and automatic return-time guidance', () => {
    const wrapper = mountDialog();

    expect(document.body.textContent).toContain('归还操作人');
    expect(document.body.textContent).toContain('归档员甲');
    expect(document.body.textContent).toContain('归还时间');
    expect(document.body.textContent).toContain('确认归还后自动记录当前时间');
    expect(document.body.textContent).toContain('确认归还');

    wrapper.destroy();
  });
});
