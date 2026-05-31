import type {
  ReceiptDraftItem,
  ReceiptOperatorForm,
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
  ElDrawer: createDialogStub(),
  ElForm: createPassthroughStub('form'),
  ElFormItem: createPassthroughStub(),
  ElInput: createInputStub(),
}));

vi.mock('#/modules/system-management/components/SystemUserSelect.vue', () => ({
  default: {
    emits: ['change', 'update:modelValue'],
    props: ['modelValue', 'placeholder', 'selectedLabel'],
    template:
      "<button type=\"button\" @click=\"$emit('change', { id: 'USER-3', name: '王护士' })\">选择接收人</button>",
  },
}));

vi.mock('./SpecimenReceiptDraftTable.vue', () => ({
  default: {
    emits: ['remove'],
    props: ['items'],
    template:
      '<div><span>{{ items.length }}</span><button type="button" @click="$emit(\'remove\', 1)">删除</button></div>',
  },
}));

import SpecimenReceiptDirectDrawer from './SpecimenReceiptDirectDrawer.vue';

function createDraftItem(
  overrides: Partial<ReceiptDraftItem> = {},
): ReceiptDraftItem {
  return {
    containerCount: 1,
    key: 1,
    qualityCheckResult: 'PASSED',
    qualityIssueCodes: [],
    reason: '',
    receiptStatus: 'RECEIVED',
    remarks: '',
    specimenBarcode: 'BC-1',
    ...overrides,
  };
}

async function mountDrawer() {
  const container = document.createElement('div');
  document.body.append(container);
  const addRowMock = vi.fn();
  const closeMock = vi.fn();
  const directReceiveUserChangeMock = vi.fn();
  const removeRowMock = vi.fn();
  const submitMock = vi.fn();
  const visible = ref(true);
  const form = reactive<ReceiptOperatorForm>({
    receivedByName: 'Test User',
    receivedByUserId: 'USER-1',
    terminalCode: '',
  });

  const app = createApp({
    render() {
      return h(SpecimenReceiptDirectDrawer, {
        form,
        items: [createDraftItem()],
        modelValue: visible.value,
        submitting: false,
        'onUpdate:modelValue': (value: boolean) => {
          visible.value = value;
        },
        onAddRow: addRowMock,
        onClose: closeMock,
        onDirectReceiveUserChange: directReceiveUserChangeMock,
        onRemoveRow: removeRowMock,
        onSubmit: submitMock,
      });
    },
  });

  app.mount(container);
  await nextTick();

  return {
    addRowMock,
    closeMock,
    container,
    directReceiveUserChangeMock,
    removeRowMock,
    submitMock,
    unmount() {
      app.unmount();
      container.remove();
    },
  };
}

describe('SpecimenReceiptDirectDrawer', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('renders drawer content and actions', async () => {
    const wrapper = await mountDrawer();

    expect(wrapper.container.textContent).toContain('条码直收');
    expect(wrapper.container.textContent).toContain('新增条码');
    expect(wrapper.container.textContent).toContain('删除');
    expect(wrapper.container.textContent).toContain('1');

    wrapper.unmount();
  });

  it('emits toolbar and row actions', async () => {
    const wrapper = await mountDrawer();

    const buttons = [
      ...wrapper.container.querySelectorAll<HTMLButtonElement>('button'),
    ];

    buttons
      .find((button) => button.textContent?.includes('选择接收人'))
      ?.click();
    buttons.find((button) => button.textContent?.includes('新增条码'))?.click();
    buttons.find((button) => button.textContent?.includes('删除'))?.click();
    buttons.find((button) => button.textContent?.includes('取消'))?.click();
    buttons.find((button) => button.textContent?.includes('提交直收'))?.click();
    await nextTick();

    expect(wrapper.directReceiveUserChangeMock).toHaveBeenCalledWith({
      id: 'USER-3',
      name: '王护士',
    });
    expect(wrapper.addRowMock).toHaveBeenCalledTimes(1);
    expect(wrapper.removeRowMock).toHaveBeenCalledWith(1);
    expect(wrapper.closeMock).toHaveBeenCalledTimes(1);
    expect(wrapper.submitMock).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });
});
