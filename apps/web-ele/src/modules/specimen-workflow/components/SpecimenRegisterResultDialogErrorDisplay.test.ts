import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createAlertStub,
  createButtonStub,
  createDescriptionsItemStub,
  createDialogStub,
  createPassthroughStub,
  createTagStub,
} from '../test-utils/component-stubs';

const {
  mockAccessStore,
  mockGetApplicationDetail,
  mockGetLatestRegistrationResult,
} = vi.hoisted(() => ({
  mockAccessStore: {
    accessCodes: ['PERM_APPLICATION_DETAIL_QUERY'] as string[],
  },
  mockGetApplicationDetail: vi.fn(),
  mockGetLatestRegistrationResult: vi.fn(),
}));

vi.mock('@vben/stores', () => ({
  useAccessStore: () => mockAccessStore,
}));

vi.mock('../api/specimen-workflow-service', () => ({
  getApplicationDetail: mockGetApplicationDetail,
  getLatestRegistrationResult: mockGetLatestRegistrationResult,
}));

vi.mock('element-plus', () => ({
  ElAlert: createAlertStub(),
  ElButton: createButtonStub(),
  ElDescriptions: createPassthroughStub(),
  ElDescriptionsItem: createDescriptionsItemStub(),
  ElDialog: createDialogStub(),
  ElEmpty: createPassthroughStub(),
  ElTable: createPassthroughStub(),
  ElTableColumn: createPassthroughStub(),
  ElTag: createTagStub(),
}));

import SpecimenRegisterResultDialog from './SpecimenRegisterResultDialog.vue';

function createLatestResult() {
  return {
    applicationId: 'APP-001',
    labelPrintBatchNo: null,
    labelPrintMessage: null,
    labelPrintSuccess: false,
    registrationSnapshot: null,
    specimens: [],
  };
}

function mountDialog() {
  const container = document.createElement('div');
  document.body.append(container);
  const app = createApp({
    render: () =>
      h(SpecimenRegisterResultDialog, {
        applicationId: 'APP-001',
        modelValue: true,
        'onUpdate:modelValue': vi.fn(),
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

describe('SpecimenRegisterResultDialog error display', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    mockAccessStore.accessCodes = ['PERM_APPLICATION_DETAIL_QUERY'];
    mockGetApplicationDetail.mockReset();
    mockGetLatestRegistrationResult.mockReset();
  });

  it('shows the page error when loading application detail fails', async () => {
    mockGetApplicationDetail.mockRejectedValue(new Error('申请单详情加载失败'));
    mockGetLatestRegistrationResult.mockResolvedValue(createLatestResult());

    const { app, container } = mountDialog();
    await flush();

    expect(container.textContent).toContain('申请单详情加载失败');

    app.unmount();
  });
});
