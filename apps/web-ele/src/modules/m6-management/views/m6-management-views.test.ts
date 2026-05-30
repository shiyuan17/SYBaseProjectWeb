import type {
  BillingRecordView,
  HistoricalImportJobView,
  HistoricalReportView,
  IntegrationTaskView,
  ReconciliationResult,
} from '../types/m6-management';

import { createApp, defineComponent, h, inject, nextTick, provide } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { M6_PERMISSION_CODES } from '../constants';

const {
  messageError,
  messageSuccess,
  mockAccessStore,
  mockImportHistoricalReports,
  mockListBillingRecords,
  mockListHistoricalImportJobs,
  mockListHistoricalReports,
  mockListIntegrationTasks,
  mockReceiveBillingReceipt,
  mockReconcileBilling,
  mockRetryBilling,
  mockUserStore,
} = vi.hoisted(() => ({
  messageError: vi.fn(),
  messageSuccess: vi.fn(),
  mockAccessStore: {
    accessCodes: [] as string[],
  },
  mockImportHistoricalReports: vi.fn(),
  mockListBillingRecords: vi.fn(),
  mockListHistoricalImportJobs: vi.fn(),
  mockListHistoricalReports: vi.fn(),
  mockListIntegrationTasks: vi.fn(),
  mockReceiveBillingReceipt: vi.fn(),
  mockReconcileBilling: vi.fn(),
  mockRetryBilling: vi.fn(),
  mockUserStore: {
    userInfo: {
      realName: '\u7BA1\u7406\u5458',
      userId: 'USER-ADMIN',
    },
  },
}));

vi.mock('@vben/common-ui', () => ({
  Page: defineComponent({
    props: ['description', 'title'],
    setup(props, { slots }) {
      return () =>
        h('main', [
          h('h1', props.title),
          props.description ? h('p', props.description) : null,
          slots.default?.(),
        ]);
    },
  }),
}));

vi.mock('@vben/stores', () => ({
  useAccessStore: () => mockAccessStore,
  useUserStore: () => mockUserStore,
}));

vi.mock('#/modules/doctor-workflow/components/WorkflowSectionCard.vue', () => ({
  default: defineComponent({
    props: ['description', 'title'],
    setup(props, { slots }) {
      return () =>
        h('section', [
          h('h2', props.title),
          props.description ? h('p', props.description) : null,
          slots.default?.(),
        ]);
    },
  }),
}));

vi.mock('../api/m6-management-service', () => ({
  importHistoricalReports: mockImportHistoricalReports,
  listBillingRecords: mockListBillingRecords,
  listHistoricalImportJobs: mockListHistoricalImportJobs,
  listHistoricalReports: mockListHistoricalReports,
  listIntegrationTasks: mockListIntegrationTasks,
  receiveBillingReceipt: mockReceiveBillingReceipt,
  reconcileBilling: mockReconcileBilling,
  retryBilling: mockRetryBilling,
}));

vi.mock('element-plus', () => {
  const tableRowsKey = Symbol('table-rows');

  const passthrough = (tag = 'div') =>
    defineComponent({
      props: ['label', 'title'],
      setup(props, { slots }) {
        return () =>
          h(tag, [
            props.title ? h('div', props.title) : null,
            props.label ? h('label', props.label) : null,
            slots.default?.(),
          ]);
      },
    });

  const ElAlert = defineComponent({
    props: ['title'],
    setup(props) {
      return () => h('section', props.title);
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
            disabled: attrs.disabled,
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

  const ElEmpty = defineComponent({
    props: ['description'],
    setup(props) {
      return () => h('div', props.description);
    },
  });

  const ElForm = passthrough('form');
  const ElFormItem = passthrough();

  const ElInput = defineComponent({
    props: ['modelValue', 'placeholder', 'type'],
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () =>
        props.type === 'textarea'
          ? h('textarea', {
              placeholder: props.placeholder,
              value: props.modelValue,
              onInput: (event: Event) =>
                emit(
                  'update:modelValue',
                  (event.target as HTMLTextAreaElement).value,
                ),
            })
          : h('input', {
              placeholder: props.placeholder,
              value: props.modelValue,
              onInput: (event: Event) =>
                emit(
                  'update:modelValue',
                  (event.target as HTMLInputElement).value,
                ),
            });
    },
  });

  const ElTable = defineComponent({
    props: ['data'],
    setup(props, { slots }) {
      provide(tableRowsKey, () => props.data ?? []);
      return () => h('div', slots.default?.());
    },
  });

  const ElTableColumn = defineComponent({
    props: ['label', 'prop'],
    setup(props, { slots }) {
      const getRows = inject<() => Record<string, unknown>[]>(
        tableRowsKey,
        () => [],
      );
      return () =>
        h('section', [
          h('strong', props.label),
          ...getRows().map((row) =>
            h(
              'div',
              slots.default?.({ row }) ??
                (props.prop ? String(row[props.prop] ?? '') : ''),
            ),
          ),
        ]);
    },
  });

  const ElTag = defineComponent({
    setup(_, { slots }) {
      return () => h('span', slots.default?.());
    },
  });

  return {
    ElAlert,
    ElButton,
    ElDialog,
    ElEmpty,
    ElForm,
    ElFormItem,
    ElInput,
    ElMessage: {
      error: messageError,
      success: messageSuccess,
    },
    ElTable,
    ElTableColumn,
    ElTag,
  };
});

import BillingManagementView from './BillingManagementView.vue';
import HistoricalReportsView from './HistoricalReportsView.vue';
import IntegrationManagementView from './IntegrationManagementView.vue';

const integrationTaskFixture: IntegrationTaskView = {
  businessId: 'BILL-1',
  businessType: 'BILLING_RECORD',
  compensationStatus: 'NONE',
  createdAt: '2026-05-26T08:00:00',
  externalSystem: 'MOCK_BILLING',
  id: 'TASK-1',
  lastAttemptAt: '',
  lastErrorCode: '',
  lastErrorMessage: '',
  maxRetryCount: 3,
  nextRetryAt: '',
  reconciliationStatus: 'MATCHED',
  requestPayload: '{"id":"1"}',
  resolvedAt: '',
  responsePayload: '{"status":"ok"}',
  retryCount: 0,
  stageCode: 'REPORT_PUBLISH',
  taskStatus: 'SUCCESS',
  taskType: 'BILLING_SUBMIT',
  updatedAt: '2026-05-26T08:00:01',
};

const billingRecordFixture: BillingRecordView = {
  amount: '88.00',
  billedAt: '2026-05-26T08:10:00',
  billingNo: 'BL-001',
  billingStage: 'SPECIAL_ORDER',
  billingStatus: 'FAILED',
  caseId: 'CASE-1',
  compensationStatus: 'RETRY_PENDING',
  createdAt: '2026-05-26T08:00:00',
  externalBillNo: '',
  externalSystem: 'MOCK_BILLING',
  id: 'BILL-1',
  integrationTaskId: 'TASK-1',
  itemName: 'IHC',
  itemType: 'ORDER',
  lastAttemptAt: '2026-05-26T08:20:00',
  lastErrorCode: 'ERR-1',
  lastErrorMessage: 'failed',
  maxRetryCount: 3,
  operatorName: '',
  operatorUserId: '',
  orderId: 'ORDER-1',
  quantity: '1',
  reconciliationStatus: 'UNMATCHED',
  remarks: '',
  resolvedAt: '',
  retryCount: 1,
  updatedAt: '2026-05-26T08:20:00',
};

const importJobFixture: HistoricalImportJobView = {
  applicationNo: 'APP-1',
  completedAt: '',
  compensationStatus: 'NONE',
  failureCount: 0,
  id: 'JOB-1',
  importStatus: 'COMPLETED',
  integrationTaskId: 'TASK-HIS-1',
  lastErrorMessage: '',
  maxRetryCount: 0,
  pathologyNo: 'PATH-1',
  patientId: 'PAT-1',
  reconciliationStatus: 'MATCHED',
  remarks: '',
  requestedAt: '2026-05-26T07:00:00',
  requestedByName: '\u5F52\u6863\u5458',
  requestedByUserId: 'USER-ARCHIVE',
  retryCount: 0,
  sourceSystem: 'MOCK_HIS',
  successCount: 1,
  taskLastErrorCode: '',
  taskLastErrorMessage: '',
  totalCount: 1,
};

const historicalReportFixture: HistoricalReportView = {
  applicationNo: 'APP-1',
  attachmentUrl: '',
  externalReportNo: 'HIS-RPT-1',
  finalDiagnosis: 'diagnosis',
  id: 'REPORT-1',
  importJobId: 'JOB-1',
  pathologyNo: 'PATH-1',
  patientId: 'PAT-1',
  patientName: '\u5F20\u4E09',
  reportDate: '2026-05-20',
  reportSummary: 'summary',
  sourceDepartmentName: '\u75C5\u7406\u79D1',
  sourceDoctorName: '\u533B\u751FA',
  sourceSystem: 'MOCK_HIS',
  versions: [
    {
      createdAt: '2026-05-20T08:00:00',
      finalDiagnosis: 'diagnosis',
      id: 'VER-1',
      reportSummary: 'summary',
      versionNo: 1,
    },
  ],
};

const reconciliationFixture: ReconciliationResult = {
  discrepancyCount: 1,
  from: '2026-05-01T00:00:00',
  matchedCount: 3,
  to: '2026-05-26T23:59:59',
  totalCount: 4,
};

async function flushView() {
  await nextTick();
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

function findButton(text: string) {
  const button = [...document.querySelectorAll('button')].find(
    (item) => item.textContent?.trim() === text,
  );
  expect(button).toBeTruthy();
  return button as HTMLButtonElement;
}

function setInputValue(selector: string, value: string) {
  const input = document.querySelector<HTMLInputElement>(selector);
  expect(input).toBeTruthy();
  input!.value = value;
  input!.dispatchEvent(new Event('input'));
}

function mountView(component: object) {
  const root = document.createElement('div');
  document.body.append(root);

  const app = createApp({
    render: () => h(component),
  });
  app.directive('loading', {});
  app.mount(root);

  return { app, root };
}

describe('m6 management views', () => {
  beforeEach(() => {
    mockAccessStore.accessCodes = [
      M6_PERMISSION_CODES.INTEGRATION_TASK_QUERY,
      M6_PERMISSION_CODES.BILLING_QUERY,
      M6_PERMISSION_CODES.BILLING_RECEIPT,
      M6_PERMISSION_CODES.BILLING_RETRY,
      M6_PERMISSION_CODES.BILLING_RECONCILE,
      M6_PERMISSION_CODES.HISTORY_IMPORT,
      M6_PERMISSION_CODES.HISTORY_QUERY,
    ];
    mockUserStore.userInfo = {
      realName: '\u7BA1\u7406\u5458',
      userId: 'USER-ADMIN',
    };
    mockListIntegrationTasks.mockResolvedValue([integrationTaskFixture]);
    mockListBillingRecords.mockResolvedValue([billingRecordFixture]);
    mockListHistoricalImportJobs.mockResolvedValue([importJobFixture]);
    mockListHistoricalReports.mockResolvedValue([historicalReportFixture]);
    mockRetryBilling.mockResolvedValue(billingRecordFixture);
    mockReceiveBillingReceipt.mockResolvedValue({
      ...billingRecordFixture,
      billingStatus: 'SUCCESS',
      externalBillNo: 'EXT-1',
    });
    mockReconcileBilling.mockResolvedValue(reconciliationFixture);
    mockImportHistoricalReports.mockResolvedValue(importJobFixture);
  });

  afterEach(() => {
    messageError.mockReset();
    messageSuccess.mockReset();
    mockImportHistoricalReports.mockReset();
    mockListBillingRecords.mockReset();
    mockListHistoricalImportJobs.mockReset();
    mockListHistoricalReports.mockReset();
    mockListIntegrationTasks.mockReset();
    mockReceiveBillingReceipt.mockReset();
    mockReconcileBilling.mockReset();
    mockRetryBilling.mockReset();
    document.body.innerHTML = '';
  });

  it('loads integration tasks on mount and re-queries with form values', async () => {
    const { app, root } = mountView(IntegrationManagementView);
    await flushView();

    expect(mockListIntegrationTasks).toHaveBeenCalledTimes(1);

    setInputValue('input[placeholder*="BILLING_SUBMIT"]', 'BILLING_SUBMIT');
    findButton('\u67E5\u8BE2').click();
    await flushView();

    expect(mockListIntegrationTasks).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        taskType: 'BILLING_SUBMIT',
      }),
    );

    findButton('\u91CD\u7F6E').click();
    await flushView();

    expect(mockListIntegrationTasks).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        taskType: undefined,
      }),
    );

    app.unmount();
    root.remove();
  });

  it('retries billing, submits receipt, and reconciles with current operator', async () => {
    const { app, root } = mountView(BillingManagementView);
    await flushView();

    expect(mockListBillingRecords).toHaveBeenCalledTimes(1);

    findButton('\u91CD\u8BD5').click();
    await flushView();
    expect(mockRetryBilling).toHaveBeenCalledWith('BILL-1', {
      operatorName: '\u7BA1\u7406\u5458',
      operatorUserId: 'USER-ADMIN',
    });

    findButton('\u767B\u8BB0\u56DE\u6267').click();
    await flushView();
    findButton('\u63D0\u4EA4\u56DE\u6267').click();
    await flushView();
    expect(mockReceiveBillingReceipt).toHaveBeenCalledWith('BILL-1', {
      billingStatus: 'SUCCESS',
      externalBillNo: undefined,
      operatorName: '\u7BA1\u7406\u5458',
      operatorUserId: 'USER-ADMIN',
      remarks: undefined,
    });

    findButton('\u6267\u884C\u5BF9\u8D26').click();
    await flushView();
    expect(mockReconcileBilling).toHaveBeenCalledWith({
      from: undefined,
      operatorName: '\u7BA1\u7406\u5458',
      operatorUserId: 'USER-ADMIN',
      to: undefined,
    });

    expect(messageSuccess).toHaveBeenCalled();

    app.unmount();
    root.remove();
  });

  it('loads history data on mount and starts import with current operator', async () => {
    const { app, root } = mountView(HistoricalReportsView);
    await flushView();

    expect(mockListHistoricalImportJobs).toHaveBeenCalledTimes(1);
    expect(mockListHistoricalReports).toHaveBeenCalledTimes(1);

    findButton('\u53D1\u8D77\u5BFC\u5165').click();
    await flushView();

    expect(mockImportHistoricalReports).toHaveBeenCalledWith({
      applicationNo: undefined,
      from: undefined,
      operatorName: '\u7BA1\u7406\u5458',
      operatorUserId: 'USER-ADMIN',
      pathologyNo: undefined,
      patientId: undefined,
      remarks: undefined,
      sourceSystem: undefined,
      to: undefined,
    });

    expect(mockListHistoricalImportJobs).toHaveBeenCalledTimes(2);
    expect(mockListHistoricalReports).toHaveBeenCalledTimes(2);

    app.unmount();
    root.remove();
  });
});
