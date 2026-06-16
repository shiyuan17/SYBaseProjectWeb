import type { ReagentFormState } from '../utils/reagent-ledger';

import { createApp, defineComponent, h, nextTick, ref } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import ReagentDialog from './ReagentDialog.vue';

vi.mock('element-plus', () => {
  const createModelComponent = (tag = 'div') =>
    defineComponent({
      props: ['modelValue'],
      emits: ['update:modelValue'],
      setup(props, { attrs, emit, slots }) {
        return () =>
          h(
            tag,
            {
              ...attrs,
              onChange: (event: Event) =>
                emit(
                  'update:modelValue',
                  (event.target as HTMLInputElement | HTMLSelectElement).value,
                ),
              onInput: (event: Event) =>
                emit(
                  'update:modelValue',
                  (event.target as HTMLInputElement | HTMLSelectElement).value,
                ),
              value: props.modelValue ?? '',
            },
            slots.default?.(),
          );
      },
    });

  return {
    ElButton: defineComponent({
      emits: ['click'],
      setup(_, { emit, slots }) {
        return () =>
          h(
            'button',
            {
              type: 'button',
              onClick: (event: MouseEvent) => emit('click', event),
            },
            slots.default?.(),
          );
      },
    }),
    ElDialog: defineComponent({
      props: ['modelValue', 'title'],
      emits: ['update:modelValue'],
      setup(props, { slots }) {
        return () =>
          props.modelValue
            ? h('section', [h('h2', props.title), slots.default?.()])
            : null;
      },
    }),
    ElForm: defineComponent({
      setup(_, { slots }) {
        return () => h('form', slots.default?.());
      },
    }),
    ElFormItem: defineComponent({
      props: ['label'],
      setup(props, { slots }) {
        return () => h('label', [h('span', props.label), slots.default?.()]);
      },
    }),
    ElInput: createModelComponent('input'),
    ElInputNumber: createModelComponent('input'),
    ElOption: defineComponent({
      props: ['label', 'value'],
      setup(props) {
        return () => h('option', { value: props.value }, props.label);
      },
    }),
    ElSelect: createModelComponent('select'),
    ElSwitch: createModelComponent('button'),
  };
});

function mountDialog() {
  const root = document.createElement('div');
  document.body.append(root);
  const form = ref<ReagentFormState>({
    cloneNo: '',
    defaultLowStockThreshold: undefined,
    defaultNearExpiryDays: undefined,
    defaultStockThreshold: undefined,
    dilutionRatio: '',
    manufacturer: '',
    orderDictItemId: '',
    reagentCode: 'RG-20260616153055001',
    reagentName: '',
    reagentType: '',
    reagentUsage: '',
    remarks: '',
    specification: '',
    stainCapacity: undefined,
    stainThreshold: undefined,
    status: 'ENABLED',
    unit: '',
    validityDays: undefined,
  });
  const app = createApp({
    render: () =>
      h(ReagentDialog, {
        isEditingReagent: false,
        medicalOrderOptions: [
          {
            categoryId: 'CAT-1',
            categoryName: '免疫组化',
            id: 'ODI-1',
            keywordText: 'ck',
            label: 'CK（ODI_IHC_CK）',
            orderItemCode: 'ODI_IHC_CK',
            orderItemName: 'CK',
          },
        ],
        medicalOrdersLoading: false,
        reagentAuditInfo: {
          createdAt: '2026-06-16 09:00:00',
          createdByName: '试剂员甲',
          enabled: true,
          id: 'REAGENT-1',
          reagentCode: 'RG-1',
          reagentName: 'CK Working Solution',
          updatedAt: '2026-06-16 10:00:00',
          updatedByName: '试剂员乙',
        },
        reagentForm: form.value,
        modelValue: true,
        'onUpdate:modelValue': () => undefined,
        'onUpdate:reagentForm': (value) => {
          form.value = value;
        },
        submitting: false,
      }),
  });
  app.mount(root);
  return { app, root };
}

describe('ReagentDialog', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders high-fidelity fields and audit info', async () => {
    const { app, root } = mountDialog();
    await nextTick();

    const auditInputs = [...document.querySelectorAll('input')];

    expect(document.body.textContent).toContain('保存');
    expect(document.body.textContent).toContain('退出');
    expect(document.body.textContent).toContain('对应医嘱');
    expect(document.body.textContent).toContain('稀释比例');
    expect(document.body.textContent).toContain('试剂用途');
    expect(document.body.textContent).toContain('试剂单位');
    expect(document.body.textContent).toContain('试剂状态');
    expect(document.body.textContent).toContain('新增人');
    expect(document.body.textContent).toContain('最后修改时间');
    expect(auditInputs.at(-4)?.getAttribute('value')).toBe('试剂员甲');
    expect(auditInputs.at(-3)?.getAttribute('value')).toBe(
      '2026-06-16 09:00:00',
    );
    expect(auditInputs.at(-2)?.getAttribute('value')).toBe('试剂员乙');
    expect(auditInputs.at(-1)?.getAttribute('value')).toBe(
      '2026-06-16 10:00:00',
    );

    app.unmount();
    root.remove();
  });
});
