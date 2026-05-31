import type {
  ReceiptDraftItem,
  ReceiptOperatorForm,
  TransportReceiptGroup,
} from '../utils/specimen-receipt';

import { createApp, h, nextTick, reactive, ref } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createAlertStub,
  createButtonStub,
  createDescriptionsItemStub,
  createDialogStub,
  createInputStub,
  createPassthroughStub,
} from '../test-utils/component-stubs';

vi.mock('element-plus', () => ({
  ElAlert: createAlertStub(),
  ElButton: createButtonStub(),
  ElDescriptions: createPassthroughStub(),
  ElDescriptionsItem: createDescriptionsItemStub(),
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
      "<button type=\"button\" @click=\"$emit('change', { id: 'USER-2', name: '李医生' })\">选择接收人</button>",
  },
}));

vi.mock('./SpecimenReceiptDraftTable.vue', () => ({
  default: {
    props: ['items'],
    template: '<div>{{ items[0]?.specimenBarcode }}</div>',
  },
}));

import SpecimenReceiptReceiveDialog from './SpecimenReceiptReceiveDialog.vue';

function createGroup(
  overrides: Partial<TransportReceiptGroup> = {},
): TransportReceiptGroup {
  return {
    applicationId: 'APP-1',
    applicationNo: 'AP-001',
    barcodes: ['BC-1'],
    batchAbnormalFlag: true,
    items: [{ barcode: 'BC-1' }] as TransportReceiptGroup['items'],
    latestTrackingAt: '2026-05-31T09:00:00',
    patientName: '张三',
    reminderCount: 2,
    transportOrderId: 'TO-1',
    unreceivedCount: 1,
    ...overrides,
  };
}

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

async function mountDialog() {
  const container = document.createElement('div');
  document.body.append(container);
  const closeMock = vi.fn();
  const receiveUserChangeMock = vi.fn();
  const submitMock = vi.fn();
  const visible = ref(true);
  const form = reactive<ReceiptOperatorForm>({
    receivedByName: 'Test User',
    receivedByUserId: 'USER-1',
    terminalCode: '',
  });

  const app = createApp({
    render() {
      return h(SpecimenReceiptReceiveDialog, {
        form,
        items: [createDraftItem()],
        modelValue: visible.value,
        selectedGroup: createGroup(),
        submitting: false,
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

  it('renders selected group details and warning content', async () => {
    const wrapper = await mountDialog();

    expect(wrapper.container.textContent).toContain('接收标本');
    expect(wrapper.container.textContent).toContain('TO-1');
    expect(wrapper.container.textContent).toContain('AP-001');
    expect(wrapper.container.textContent).toContain('张三');
    expect(wrapper.container.textContent).toContain('当前批次含异常标记');
    expect(wrapper.container.textContent).toContain('BC-1');

    wrapper.unmount();
  });

  it('emits user change, close and submit actions', async () => {
    const wrapper = await mountDialog();

    const buttons = [
      ...wrapper.container.querySelectorAll<HTMLButtonElement>('button'),
    ];

    buttons
      .find((button) => button.textContent?.includes('选择接收人'))
      ?.click();
    buttons.find((button) => button.textContent?.includes('取消'))?.click();
    buttons.find((button) => button.textContent?.includes('提交接收'))?.click();
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
