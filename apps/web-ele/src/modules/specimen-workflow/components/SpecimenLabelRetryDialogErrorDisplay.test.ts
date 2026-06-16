import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createAlertStub,
  createButtonStub,
  createDescriptionsItemStub,
  createDialogStub,
  createInputStub,
  createPassthroughStub,
  createTagStub,
} from '../test-utils/component-stubs';

const pageErrorTextMock = { value: '' };

vi.mock('../composables/useSpecimenLabelRetryDialog', async () => {
  const { reactive, ref } = await import('vue');

  return {
    useSpecimenLabelRetryDialog: () => ({
      applicationDetail: ref(null),
      canQueryApplicationDetail: ref(true),
      closeDialog: vi.fn(),
      currentApplicationId: ref('APP-001'),
      currentRetryResult: ref(null),
      detailStatusType: ref('success'),
      dialogVisible: ref(true),
      hasFailedLabels: ref(false),
      latestRegisterResult: ref(null),
      loadingDetail: ref(false),
      loadingResult: ref(false),
      pageError: ref(pageErrorTextMock.value),
      refreshDialog: vi.fn(),
      retryForm: reactive({
        operatorName: '当前用户',
        operatorUserId: 'USER-001',
        printerCode: '',
        remarks: '',
        terminalCode: '',
      }),
      retryingLabelPrint: ref(false),
      submitRetryLabelPrint: vi.fn(),
    }),
  };
});

vi.mock('element-plus', () => ({
  ElAlert: createAlertStub(),
  ElButton: createButtonStub(),
  ElDescriptions: createPassthroughStub(),
  ElDescriptionsItem: createDescriptionsItemStub(),
  ElDialog: createDialogStub(),
  ElEmpty: createPassthroughStub(),
  ElForm: createPassthroughStub('form'),
  ElFormItem: createPassthroughStub(),
  ElInput: createInputStub(),
  ElTag: createTagStub(),
}));

import SpecimenLabelRetryDialog from './SpecimenLabelRetryDialog.vue';

function mountDialog() {
  const container = document.createElement('div');
  document.body.append(container);
  const app = createApp({
    render: () =>
      h(SpecimenLabelRetryDialog, {
        applicationId: 'APP-001',
        modelValue: true,
        'onUpdate:modelValue': vi.fn(),
        onRetried: vi.fn(),
      }),
  });
  app.mount(container);
  return { app, container };
}

async function flush() {
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

describe('SpecimenLabelRetryDialog error display', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    pageErrorTextMock.value = '';
    vi.clearAllMocks();
  });

  it('shows the translated business error when pageError exists', async () => {
    pageErrorTextMock.value = '当前申请单暂无可补打标签的失败标本。';

    const { app, container } = mountDialog();
    await flush();

    expect(container.textContent).toContain(
      '当前申请单暂无可补打标签的失败标本。',
    );

    app.unmount();
  });
});
