import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createButtonStub,
  createDescriptionsItemStub,
  createDialogStub,
  createInputStub,
  createOptionStub,
  createPassthroughStub,
  createSelectStub,
  createTableColumnStub,
  createTableStub,
  createTabPaneStub,
  createTabsStub,
  createTagStub,
} from '../test-utils/component-stubs';

const tableRowKey = vi.hoisted(() => Symbol('table-row'));
const tabsContextKey = vi.hoisted(() => Symbol('tabs'));

const {
  mockAccessStore,
  mockGetApplicationDetail,
  mockGetLatestRegistrationResult,
  mockListSpecimens,
  mockPush,
} = vi.hoisted(() => ({
  mockAccessStore: {
    accessCodes: [
      'PERM_APPLICATION_DETAIL_QUERY',
      'PERM_SPECIMEN_REGISTER',
    ] as string[],
  },
  mockGetApplicationDetail: vi.fn(),
  mockGetLatestRegistrationResult: vi.fn(),
  mockListSpecimens: vi.fn(),
  mockPush: vi.fn(),
}));

vi.mock('@vben/stores', () => ({
  useAccessStore: () => mockAccessStore,
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('../components/WorkflowSectionCard.vue', () => ({
  default: {
    props: ['description', 'title'],
    template:
      '<section><h2>{{ title }}</h2><p v-if="description">{{ description }}</p><slot name="extra" /><slot /></section>',
  },
}));

vi.mock('../api/specimen-workflow-service', () => ({
  getApplicationDetail: mockGetApplicationDetail,
  getLatestRegistrationResult: mockGetLatestRegistrationResult,
  listSpecimens: mockListSpecimens,
}));

vi.mock('element-plus', () => {
  return {
    ElAlert: createPassthroughStub(),
    ElButton: createButtonStub(),
    ElDatePicker: createPassthroughStub(),
    ElDescriptions: createPassthroughStub('div'),
    ElDescriptionsItem: createDescriptionsItemStub(),
    ElDialog: createDialogStub(),
    ElEmpty: createPassthroughStub(),
    ElForm: createPassthroughStub('form'),
    ElFormItem: createPassthroughStub(),
    ElInput: createInputStub(),
    ElOption: createOptionStub(),
    ElPagination: createPassthroughStub(),
    ElSelect: createSelectStub(),
    ElTabPane: createTabPaneStub(tabsContextKey),
    ElTabs: createTabsStub(tabsContextKey),
    ElTable: createTableStub(tableRowKey),
    ElTableColumn: createTableColumnStub(tableRowKey),
    ElTag: createTagStub(),
  };
});

import TrackingSpecimenListView from './TrackingSpecimenListView.vue';

function buildSpecimenRow() {
  return {
    abnormalFlag: true,
    abnormalReason: '容器破损',
    applicationId: 'APP-TRACK-001',
    applicationNo: 'AP202605220001',
    barcode: 'BC-TRACK-001',
    containerCount: 1,
    containerName: '瓶1',
    fixationStatus: 'FIXING',
    labelPrintBatchNo: 'BATCH-001',
    labelPrintStatus: 'FAILED',
    latestTrackingAt: '2026-05-24T08:00:00',
    qualityCheckResult: 'FAILED',
    qualityIssueCodes: ['CONTAINER_DAMAGE'],
    patientName: '张三',
    registeredAt: '2026-05-24T08:00:00',
    receiptStatus: 'REJECTED',
    specimenCount: 1,
    specimenId: 'SPEC-001',
    specimenName: '胃组织',
    specimenNo: 'SP-001',
    specimenSite: '胃',
    specimenStatus: 'REGISTERED',
    specimenType: '常规',
    submittingDepartmentId: 'DEP-001',
    submittingDepartmentName: '普外科',
  };
}

function buildApplicationDetail() {
  return {
    abnormalFlag: true,
    applicationDate: '2026-05-22',
    applicationFormStatus: 'PENDING',
    applicationNo: 'AP202605220001',
    applicationType: 'ROUTINE',
    clinicalDiagnosis: '胃息肉',
    clinicalSymptom: '腹痛',
    createdAt: '2026-05-22T08:00:00',
    currentNode: 'SPECIMEN_COLLECTION',
    externalOrderNo: 'EXT-001',
    id: 'APP-TRACK-001',
    patientAge: '42',
    patientGender: 'F',
    patientId: 'PAT-001',
    patientName: '张三',
    recentEvents: [
      {
        eventContent: '已登记',
        eventStatus: 'DONE',
        eventTime: '2026-05-24T08:00:00',
        eventType: 'REGISTER',
        nodeCode: 'SPECIMEN_COLLECTION',
        operatorDevice: 'Chrome 125 / Windows',
        operatorIp: '10.0.0.1',
        operatorName: '李医生',
        specimenId: 'SPEC-001',
        specimenNo: 'SP-001',
        sourceTerminal: 'TERMINAL-1',
      },
      {
        eventContent: '出库完成',
        eventStatus: 'SUCCESS',
        eventTime: '2026-05-24T09:00:00',
        eventType: 'HANDED_OVER',
        nodeCode: 'TRANSPORT',
        operatorDevice: 'Edge 126 / Windows',
        operatorIp: '10.0.0.2',
        operatorName: '出库员',
        specimenId: 'SPEC-001',
        specimenNo: 'SP-001',
        sourceTerminal: 'TERMINAL-2',
      },
    ],
    remarks: '备注信息',
    sourceHospitalId: 'H-001',
    sourceHospitalName: '总院',
    specimenRemovalTime: '2026-05-22T07:30:00',
    specimens: [
      {
        abnormalReason: '容器破损',
        barcode: 'BC-TRACK-001',
        containerCount: 1,
        containerName: '瓶1',
        fixationStatus: 'FIXING',
        id: 'SPEC-001',
        labelPrintStatus: 'FAILED',
        outboundAt: '2026-05-24T09:00:00',
        outboundUserName: '出库员',
        qualityCheckResult: 'FAILED',
        qualityIssueCodes: ['CONTAINER_DAMAGE'],
        receiptStatus: 'REJECTED',
        specimenCount: 1,
        specimenName: '胃组织',
        specimenNo: 'SP-001',
        specimenSite: '胃',
        specimenStatus: 'REGISTERED',
        specimenType: '常规',
      },
    ],
    status: 'SUBMITTED',
    submissionDate: '2026-05-22',
    submittingDepartmentId: 'DEP-001',
    submittingDepartmentName: '普外科',
    submittingDoctorName: '李医生',
    submittingDoctorUserId: 'USER-001',
    thirdPartySource: null,
    updatedAt: '2026-05-24T08:00:00',
  };
}

function buildLatestResult() {
  return {
    applicationId: 'APP-TRACK-001',
    labelPrintBatchNo: 'BATCH-001',
    labelPrintMessage: '存在失败',
    labelPrintSuccess: false,
    registrationSnapshot: null,
    specimens: [
      {
        abnormalReason: '容器破损',
        barcode: 'BC-TRACK-001',
        containerCount: 1,
        containerName: '瓶1',
        fixationStatus: 'FIXING',
        id: 'SPEC-001',
        labelPrintStatus: 'FAILED',
        outboundAt: '2026-05-24T09:00:00',
        outboundUserName: '出库员',
        qualityCheckResult: 'FAILED',
        qualityIssueCodes: ['CONTAINER_DAMAGE'],
        receiptStatus: 'REJECTED',
        specimenCount: 1,
        specimenName: '胃组织',
        specimenNo: 'SP-001',
        specimenSite: '胃',
        specimenStatus: 'REGISTERED',
        specimenType: '常规',
      },
    ],
  };
}

async function flushAll() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

async function mountView(props?: Record<string, unknown>) {
  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp({
    render: () => h(TrackingSpecimenListView, props ?? {}),
  });
  app.directive('loading', {
    mounted() {},
    updated() {},
  });
  app.mount(root);
  await flushAll();
  return { app, root };
}

describe('TrackingSpecimenListView', () => {
  afterEach(() => {
    mockAccessStore.accessCodes = [
      'PERM_APPLICATION_DETAIL_QUERY',
      'PERM_SPECIMEN_REGISTER',
    ];
    mockListSpecimens.mockReset();
    mockGetApplicationDetail.mockReset();
    mockGetLatestRegistrationResult.mockReset();
    mockPush.mockReset();
    document.body.innerHTML = '';
  });

  it('keeps only detail as the specimen row action', async () => {
    mockListSpecimens.mockResolvedValue({
      items: [buildSpecimenRow()],
      page: 1,
      size: 20,
      summary: {
        abnormalCount: 1,
        labelPrintedCount: 0,
        pendingLabelCount: 1,
        totalCount: 1,
      },
      total: 1,
    });
    mockGetApplicationDetail.mockResolvedValue(buildApplicationDetail());
    mockGetLatestRegistrationResult.mockResolvedValue(buildLatestResult());

    const { app, root } = await mountView({
      initialBarcode: 'BC-TRACK-001',
      triggerKey: 1,
    });

    const buttonTexts = [...root.querySelectorAll('button')].map((button) =>
      button.textContent?.trim(),
    );
    expect(buttonTexts).toContain('详情');
    expect(buttonTexts).not.toContain('异常处理');
    expect(buttonTexts).not.toContain('补打标签');
    expect(buttonTexts).not.toContain('开始核验');
    expect(buttonTexts).not.toContain('完成核验');

    expect(root.textContent).toContain('异常明细');
    expect(root.textContent).toContain('回到标本接收处理');
    expect(root.textContent).toContain('异常类型：已拒收');
    expect(root.textContent).toContain('质控结果：不合格');
    expect(root.textContent).toContain('问题代码：CONTAINER_DAMAGE');
    expect(root.textContent).toContain('原因：容器破损');

    app.unmount();
  });

  it('routes abnormal specimen details back to pathology receipt with barcode context', async () => {
    mockListSpecimens.mockResolvedValue({
      items: [buildSpecimenRow()],
      page: 1,
      size: 20,
      summary: {
        abnormalCount: 1,
        labelPrintedCount: 0,
        pendingLabelCount: 1,
        totalCount: 1,
      },
      total: 1,
    });
    mockGetApplicationDetail.mockResolvedValue(buildApplicationDetail());
    mockGetLatestRegistrationResult.mockResolvedValue(buildLatestResult());

    const { app, root } = await mountView({
      initialBarcode: 'BC-TRACK-001',
      triggerKey: 1,
    });

    const receiptButton = [
      ...root.querySelectorAll<HTMLButtonElement>('button'),
    ].find((button) => button.textContent?.includes('回到标本接收处理'));
    receiptButton?.click();
    await flushAll();

    expect(mockPush).toHaveBeenCalledWith({
      path: '/workflow/pathology-receipt',
      query: {
        barcode: 'BC-TRACK-001',
      },
    });

    app.unmount();
  });

  it('hides the removed overview and marked filter fields', async () => {
    mockListSpecimens.mockResolvedValue({
      items: [buildSpecimenRow()],
      page: 1,
      size: 20,
      summary: {
        abnormalCount: 1,
        labelPrintedCount: 0,
        pendingLabelCount: 1,
        totalCount: 1,
      },
      total: 1,
    });

    const { app, root } = await mountView();

    expect(root.textContent).not.toContain('工作台概览');
    expect(root.textContent).not.toContain('送检科室');
    expect(root.textContent).not.toContain('登记日期');
    expect(root.textContent).not.toContain('待贴签');
    expect(root.textContent).not.toContain(
      '支持按关键字、科室、状态、标签状态、异常标记和日期范围筛选。',
    );
    expect(root.textContent).toContain(
      '支持按关键字、标本状态和异常标记筛选。',
    );

    app.unmount();
  });

  it('applies the initial barcode filter and opens the matched detail dialog', async () => {
    mockListSpecimens.mockResolvedValue({
      items: [buildSpecimenRow()],
      page: 1,
      size: 20,
      summary: {
        abnormalCount: 1,
        labelPrintedCount: 0,
        pendingLabelCount: 1,
        totalCount: 1,
      },
      total: 1,
    });
    mockGetApplicationDetail.mockResolvedValue(buildApplicationDetail());
    mockGetLatestRegistrationResult.mockResolvedValue(buildLatestResult());

    const { app, root } = await mountView({
      initialBarcode: 'BC-TRACK-001',
      triggerKey: 1,
    });

    expect(mockListSpecimens).toHaveBeenCalledWith(
      expect.objectContaining({
        keyword: 'BC-TRACK-001',
      }),
    );
    expect(mockGetApplicationDetail).toHaveBeenCalledWith('APP-TRACK-001');
    expect(mockGetLatestRegistrationResult).toHaveBeenCalledWith(
      'APP-TRACK-001',
    );
    expect(root.textContent).toContain('标本基础信息');
    expect(root.textContent).toContain('所属申请单信息');
    expect(root.textContent).toContain('最近流程节点');
    expect(root.textContent).toContain('临床送检');
    for (const stage of [
      '标本采集',
      '离体确认',
      '标本固定',
      '标本确认',
      '标本入库',
      '标本出库',
    ]) {
      expect(root.textContent).toContain(stage);
    }
    expect(root.textContent).toContain('申请单号：AP202605220001');
    expect(root.textContent).toContain('姓名：张三');
    expect(root.textContent).toContain('患者ID：PAT-001');
    expect(root.querySelector('button[data-tab-name]')?.textContent).toContain(
      'SP-001',
    );
    expect(root.textContent).toContain('条码绑定：SP-001-BC-TRACK-001');
    expect(root.textContent).toContain('IP：10.0.0.2');
    expect(root.textContent).toContain('浏览器信息：Edge 126 / Windows');
    expect(root.textContent).toContain('出库时间：2026-05-24 09:00:00');
    expect(root.textContent).toContain('出库人：出库员');
    expect(root.textContent).toContain('最近标签批次结果');
    expect(root.textContent).not.toContain('去追踪与异常');

    app.unmount();
  });

  it('shows the page error when loading the tracking specimen list fails', async () => {
    mockListSpecimens.mockRejectedValue(new Error('标本追踪列表加载失败'));

    const { app, root } = await mountView();

    expect(root.textContent).toContain('标本追踪列表加载失败');

    app.unmount();
  });
});
