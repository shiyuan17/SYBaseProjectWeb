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
  createOptionStub,
  createPassthroughStub,
  createSelectStub,
} from '../test-utils/component-stubs';

vi.mock('element-plus', () => ({
  ElButton: createButtonStub(),
  ElDrawer: createDialogStub(),
  ElForm: createPassthroughStub('form'),
  ElFormItem: createPassthroughStub(),
  ElInput: createInputStub(),
  ElMessage: {
    success: vi.fn(),
    warning: vi.fn(),
  },
  ElOption: createOptionStub(),
  ElSelect: createSelectStub(),
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
    specimenId: 'SPEC-1',
    specimenNo: 'SP-1',
    ...overrides,
  };
}

async function mountDrawer() {
  const container = document.createElement('div');
  document.body.append(container);
  const closeMock = vi.fn();
  const reReceiveMock = vi.fn();
  const submitMock = vi.fn();
  const visible = ref(true);
  const form = reactive<ReceiptOperatorForm>({
    customRejectReasons: [],
    receivedByName: 'Test User',
    receivedByUserId: 'USER-1',
    rectificationEffect: '',
    rectificationSuggestion: '',
    rejectReason: '',
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
        onClose: closeMock,
        onReReceive: reReceiveMock,
        onSubmit: submitMock,
      });
    },
  });

  app.mount(container);
  await nextTick();

  return {
    closeMock,
    container,
    form,
    reReceiveMock,
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

    expect(wrapper.container.textContent).toContain('拒收');
    expect(wrapper.container.textContent).toContain('自定义拒收原因');
    expect(wrapper.container.textContent).toContain('拒收原因');
    expect(wrapper.container.textContent).toContain('整改建议');
    expect(wrapper.container.textContent).toContain('关闭');
    expect(wrapper.container.textContent).not.toContain('整改效果');
    expect(wrapper.container.textContent).not.toContain('重新接收');

    wrapper.unmount();
  });

  it('submits reject after filling the required fields and handles close', async () => {
    const wrapper = await mountDrawer();
    wrapper.form.rectificationSuggestion = '请重新采集并规范送检';
    await nextTick();

    const buttons = [
      ...wrapper.container.querySelectorAll<HTMLButtonElement>('button'),
    ];

    buttons.find((button) => button.textContent?.includes('拒收'))?.click();
    buttons.find((button) => button.textContent?.includes('关闭'))?.click();
    await nextTick();

    expect(wrapper.form.rejectReason).toBe('标本信息不符');
    expect(wrapper.closeMock).toHaveBeenCalledTimes(1);
    expect(wrapper.submitMock).toHaveBeenCalledTimes(1);
    expect(wrapper.reReceiveMock).not.toHaveBeenCalled();

    wrapper.unmount();
  });
});
