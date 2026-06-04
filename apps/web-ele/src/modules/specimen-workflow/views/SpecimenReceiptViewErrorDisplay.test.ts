import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createAlertStub,
  createButtonStub,
  createDialogStub,
  createInputStub,
  createPassthroughStub,
  createTableColumnStub,
  createTableStub,
  createTagStub,
} from '../test-utils/component-stubs';

const { pageErrorTextMock, rowContextKey } = vi.hoisted(() => ({
  pageErrorTextMock: { value: '' },
  rowContextKey: Symbol('row-context'),
}));

vi.mock('@vben/common-ui', () => ({
  Page: {
    template: '<section><slot /></section>',
  },
}));

vi.mock('#/modules/system-management/components/SystemUserSelect.vue', () => ({
  default: {
    template: '<div />',
  },
}));

vi.mock('../components/SpecimenReceiptDirectDrawer.vue', () => ({
  default: {
    template: '<div />',
  },
}));

vi.mock('../components/SpecimenReceiptReceiveDialog.vue', () => ({
  default: {
    template: '<div />',
  },
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({
    query: {},
  }),
}));

vi.mock('../composables/useSpecimenReceiptWorkbench', async () => {
  const { reactive, ref } = await import('vue');

  return {
    useSpecimenReceiptWorkbench: () => ({
      batchRetryResult: ref(null),
      closeReceiveDialog: vi.fn(),
      directReceiveDialogVisible: ref(false),
      directReceiveForm: reactive({
        abnormalReason: '',
        operatorName: '当前用户',
        operatorUserId: 'USER-001',
      }),
      directReceiveItems: ref([]),
      directReceiveSubmitting: ref(false),
      exportLoading: ref(false),
      handleClearList: vi.fn(),
      handleClearSelectionRows: vi.fn(),
      handleDirectReceiveUserChange: vi.fn(),
      handleExportExcel: vi.fn(),
      handleOperatorChange: vi.fn(),
      handleQueueSpecimen: vi.fn(),
      handleReceiveUserChange: vi.fn(),
      handleReceiveSelected: vi.fn(),
      handleRemoveDirectReceiveRow: vi.fn(),
      handleRetryLabel: vi.fn(),
      handleSelectionChange: vi.fn(),
      loadPendingReceiptRows: vi.fn(),
      loading: ref(false),
      lookupLoading: ref(false),
      openDirectReceiveDrawer: vi.fn(),
      openReceiveDialog: vi.fn(),
      operatorForm: reactive({
        operatorName: '当前用户',
        operatorUserId: 'USER-001',
      }),
      pageError: ref(pageErrorTextMock.value),
      queueItems: ref([]),
      receiveDialogVisible: ref(false),
      receiveForm: reactive({
        receiverName: '签收人',
        receiverUserId: 'USER-002',
      }),
      receiveLoading: ref(false),
      receiveSummary: ref({
        failedCount: 0,
        successCount: 0,
        totalCount: 0,
      }),
      receivedCount: ref(0),
      retryDialogVisible: ref(false),
      retryForm: reactive({
        operatorName: '当前用户',
        operatorUserId: 'USER-001',
        printerCode: '',
        remarks: '',
        terminalCode: '',
      }),
      retrySubmitting: ref(false),
      retryTargetRows: ref([]),
      scanInput: ref(''),
      selectedCount: ref(0),
      submitDirectReceive: vi.fn(),
      submitRetryLabel: vi.fn(),
    }),
  };
});

vi.mock('element-plus', () => ({
  ElAlert: createAlertStub(),
  ElButton: createButtonStub(),
  ElDialog: createDialogStub(),
  ElForm: createPassthroughStub('form'),
  ElFormItem: createPassthroughStub(),
  ElInput: createInputStub(),
  ElTable: createTableStub(rowContextKey),
  ElTableColumn: createTableColumnStub(rowContextKey),
  ElTag: createTagStub(),
}));

import SpecimenReceiptView from './SpecimenReceiptView.vue';

function mountView() {
  const container = document.createElement('div');
  document.body.append(container);
  const app = createApp({
    render: () => h(SpecimenReceiptView),
  });
  app.directive('loading', {});
  app.mount(container);
  return { app, container };
}

async function flush() {
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

describe('SpecimenReceiptView error display', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    pageErrorTextMock.value = '';
    vi.clearAllMocks();
  });

  it('shows the translated business error when pageError exists', async () => {
    pageErrorTextMock.value = '当前申请单下仍有待签收标本，请先完成签收处理。';

    const { app, container } = mountView();
    await flush();

    expect(container.textContent).toContain(
      '当前申请单下仍有待签收标本，请先完成签收处理。',
    );

    app.unmount();
  });
});
