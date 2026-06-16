import type {
  ReceiptConfirmForm,
  ReceiptConfirmSummary,
} from '../utils/specimen-receipt';

import { createApp, h, nextTick, reactive, ref } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createButtonStub,
  createDialogStub,
  createInputStub,
  createPassthroughStub,
} from '../test-utils/component-stubs';

vi.mock('element-plus', () => ({
  ElButton: createButtonStub(),
  ElDialog: createDialogStub(),
  ElForm: createPassthroughStub('form'),
  ElFormItem: createPassthroughStub(),
  ElInput: createInputStub(),
}));

vi.mock('#/modules/system-management/components/SystemUserSelect.vue', () => ({
  default: {
    emits: ['change', 'update:modelValue'],
    props: ['modelValue', 'placeholder', 'selectedLabel'],
    template:
      "<button type=\"button\" @click=\"$emit('change', { id: 'USER-2', name: '李医生' })\">选择签收人员</button>",
  },
}));

import SpecimenReceiptReceiveDialog from './SpecimenReceiptReceiveDialog.vue';

function createSummary(
  overrides: Partial<ReceiptConfirmSummary> = {},
): ReceiptConfirmSummary {
  return {
    applicationCount: 1,
    patientCount: 1,
    specimenCount: 2,
    ...overrides,
  };
}

async function mountDialog() {
  const container = document.createElement('div');
  document.body.append(container);
  const closeMock = vi.fn();
  const receiveUserChangeMock = vi.fn();
  const submitMock = vi.fn();
  const visible = ref(true);
  const form = reactive<ReceiptConfirmForm>({
    logisticsStaffName: '',
    receivedByName: 'Test User',
    receivedByUserId: 'USER-1',
  });

  const app = createApp({
    render() {
      return h(SpecimenReceiptReceiveDialog, {
        form,
        modelValue: visible.value,
        submitting: false,
        summary: createSummary(),
        'onUpdate:modelValue': (value: boolean) => {
          visible.value = value;
        },
        onClose: closeMock,
        onReceiveUserChange: receiveUserChangeMock,
        onSubmit: submitMock,
      });
    },
  });

  app.mount(container);
  await nextTick();

  return {
    closeMock,
    container,
    receiveUserChangeMock,
    submitMock,
    unmount() {
      app.unmount();
      container.remove();
    },
  };
}

describe('SpecimenReceiptReceiveDialog', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('renders summary and confirm fields', async () => {
    const wrapper = await mountDialog();

    expect(wrapper.container.textContent).toContain('标本签收');
    expect(wrapper.container.textContent).toContain('提示信息');
    expect(wrapper.container.textContent).toContain('1 个申请单');
    expect(wrapper.container.textContent).toContain('1 个病人');
    expect(wrapper.container.textContent).toContain('2 个标本');
    expect(wrapper.container.textContent).toContain('物流人员');
    expect(wrapper.container.textContent).toContain('签收人员');

    wrapper.unmount();
  });

  it('emits user change, close and submit actions', async () => {
    const wrapper = await mountDialog();

    const buttons = [
      ...wrapper.container.querySelectorAll<HTMLButtonElement>('button'),
    ];

    buttons
      .find((button) => button.textContent?.includes('选择签收人员'))
      ?.click();
    buttons.find((button) => button.textContent?.includes('取消'))?.click();
    buttons.find((button) => button.textContent?.includes('确认'))?.click();
    await nextTick();

    expect(wrapper.receiveUserChangeMock).toHaveBeenCalledWith({
      id: 'USER-2',
      name: '李医生',
    });
    expect(wrapper.closeMock).toHaveBeenCalledTimes(1);
    expect(wrapper.submitMock).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });
});
