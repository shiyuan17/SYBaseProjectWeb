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
  mockClipboardWriteText,
  mockElMessageSuccess,
  mockGetApplicationTracking,
  mockListApplications,
  mockPush,
} = vi.hoisted(() => ({
  mockAccessStore: {
    accessCodes: ['PERM_APPLICATION_DETAIL_QUERY'] as string[],
  },
  mockClipboardWriteText: vi.fn(),
  mockElMessageSuccess: vi.fn(),
  mockGetApplicationTracking: vi.fn(),
  mockListApplications: vi.fn(),
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
  getApplicationTracking: mockGetApplicationTracking,
  listApplications: mockListApplications,
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
    ElMessage: {
      success: mockElMessageSuccess,
    },
    ElTag: createTagStub(),
  };
});

import TrackingApplicationListView from './TrackingApplicationListView.vue';

function buildApplicationRow() {
  return {
    abnormalFlag: true,
    applicationDate: '2026-05-22',
    applicationFormStatus: 'PENDING',
    applicationNo: 'AP202605220001',
    applicationType: 'ROUTINE',
    createdAt: '2026-05-22T08:00:00',
    currentNode: 'SPECIMEN_COLLECTION',
    id: 'APP-TRACK-001',
    latestLabelPrintStatus: 'SUCCESS',
    patientAge: '42',
    patientGender: 'F',
    patientName: '张三',
    pathologyNo: 'BL202605220001',
    registeredSpecimenCount: 3,
    specimenNos: ['SP-001', 'SP-002', 'SP-003'],
    status: 'SUBMITTED',
    submissionDate: '2026-05-22',
    submittingDepartmentName: '普外科',
    submittingDoctorName: '李医生',
    updatedAt: '2026-05-24T08:00:00',
  };
}

function buildTrackingDetail() {
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
        eventContent: '创建转运单',
        eventStatus: 'SUCCESS',
        eventTime: '2026-05-24T08:00:00',
        eventType: 'ORDER_CREATED',
        nodeCode: 'TRANSPORT',
        operatorDevice: 'Chrome 125 / Windows',
        operatorIp: '10.0.0.1',
        operatorName: '李医生',
        specimenBarcode: 'BC-001',
        specimenId: 'SPEC-001',
        specimenNo: 'SP-001',
        sourceTerminal: 'TERMINAL-1',
      },
      {
        eventContent: '创建转运单',
        eventStatus: 'SUCCESS',
        eventTime: '2026-05-24T08:00:00',
        eventType: 'ORDER_CREATED',
        nodeCode: 'TRANSPORT',
        operatorDevice: 'Chrome 125 / Windows',
        operatorIp: '10.0.0.2',
        operatorName: '王护士',
        specimenBarcode: 'BC-002',
        specimenId: 'SPEC-002',
        specimenNo: 'SP-002',
        sourceTerminal: 'TERMINAL-2',
      },
      {
        eventContent: '打印转运单',
        eventStatus: 'SUCCESS',
        eventTime: '2026-05-24T08:01:00',
        eventType: 'ORDER_PRINTED',
        nodeCode: 'TRANSPORT',
        operatorDevice: 'Edge 126 / Windows',
        operatorIp: '10.0.0.3',
        operatorName: '前台',
        specimenBarcode: null,
        specimenId: null,
        specimenNo: null,
        sourceTerminal: 'TERMINAL-3',
      },
      {
        eventContent: '完成交接',
        eventStatus: 'SUCCESS',
        eventTime: '2026-05-24T08:02:00',
        eventType: 'HANDED_OVER',
        nodeCode: 'TRANSPORT',
        operatorDevice: 'Edge 126 / Windows',
        operatorIp: '10.0.0.4',
        operatorName: '李医生',
        specimenBarcode: 'BC-001',
        specimenId: 'SPEC-001',
        specimenNo: 'SP-001',
        sourceTerminal: 'TERMINAL-1',
      },
    ],
    remarks: '备注信息',
    sourceHospitalId: 'H-001',
    sourceHospitalName: '总院',
    specimenRemovalTime: '2026-05-22T07:30:00',
    specimens: [
      {
        abnormalReason: '容器破损',
        barcode: 'BC-001',
        containerCount: 1,
        containerName: '瓶',
        fixationStatus: 'FIXING',
        id: 'SPEC-001',
        labelPrintStatus: 'SUCCESS',
        outboundAt: '2026-05-24T08:02:00',
        outboundUserName: '李医生',
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
      {
        abnormalReason: null,
        barcode: 'BC-002',
        containerCount: 1,
        containerName: '瓶',
        fixationStatus: 'FIXING',
        id: 'SPEC-002',
        labelPrintStatus: 'SUCCESS',
        outboundAt: '2026-05-24T08:02:00',
        outboundUserName: '王护士',
        specimenCount: 1,
        specimenName: '十二指肠组织',
        specimenNo: 'SP-002',
        specimenSite: '十二指肠',
        specimenStatus: 'REGISTERED',
        specimenType: '常规',
      },
      {
        abnormalReason: null,
        barcode: 'BC-003',
        containerCount: 1,
        containerName: '瓶',
        fixationStatus: 'FIXING',
        id: 'SPEC-003',
        labelPrintStatus: 'PENDING',
        specimenCount: 1,
        specimenName: '空白标本',
        specimenNo: 'SP-003',
        specimenSite: '未知',
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
    render: () => h(TrackingApplicationListView, props ?? {}),
  });
  app.directive('loading', {
    mounted() {},
    updated() {},
  });
  app.mount(root);
  await flushAll();
  return { app, root };
}

describe('TrackingApplicationListView', () => {
  afterEach(() => {
    mockAccessStore.accessCodes = ['PERM_APPLICATION_DETAIL_QUERY'];
    mockClipboardWriteText.mockReset();
    mockElMessageSuccess.mockReset();
    mockListApplications.mockReset();
    mockGetApplicationTracking.mockReset();
    mockPush.mockReset();
    document.body.innerHTML = '';
  });

  it('renders a read-only application list with detail as the only row action', async () => {
    mockListApplications.mockResolvedValue({
      items: [buildApplicationRow()],
      page: 1,
      size: 20,
      total: 1,
    });
    mockGetApplicationTracking.mockResolvedValue(buildTrackingDetail());

    const { app, root } = await mountView();

    expect(mockListApplications).toHaveBeenCalledTimes(1);
    const buttonTexts = [...root.querySelectorAll('button')].map((button) =>
      button.textContent?.trim(),
    );
    expect(buttonTexts).toContain('详情');
    expect(buttonTexts).not.toContain('创建');
    expect(buttonTexts).not.toContain('登记标本');
    expect(buttonTexts).not.toContain('追踪与异常');
    expect(root.textContent).not.toContain('申请单编号');
    expect(root.textContent).not.toContain('APP-TRACK-001');
    expect(root.textContent).not.toContain('送检科室');
    expect(root.textContent).not.toContain('申请类型');
    expect(root.textContent).not.toContain('表单状态');
    expect(root.textContent).toContain(
      '支持按申请单号、病理号、患者姓名和申请日期筛选。',
    );

    app.unmount();
  });

  it('submits pathologyNo in the tracking application list query and clears it on reset', async () => {
    mockListApplications
      .mockResolvedValueOnce({
        items: [buildApplicationRow()],
        page: 1,
        size: 20,
        total: 1,
      })
      .mockResolvedValueOnce({
        items: [buildApplicationRow()],
        page: 1,
        size: 20,
        total: 1,
      })
      .mockResolvedValue({
        items: [buildApplicationRow()],
        page: 1,
        size: 20,
        total: 1,
      });

    const { app, root } = await mountView();

    const pathologyNoInput = root.querySelectorAll(
      'input',
    )[1] as HTMLInputElement;
    pathologyNoInput.value = 'BL20260522';
    pathologyNoInput.dispatchEvent(new Event('input'));
    await flushAll();

    const queryButton = [
      ...root.querySelectorAll<HTMLButtonElement>('button'),
    ].find((button) => button.textContent?.includes('查询'));
    queryButton?.click();
    await flushAll();

    expect(mockListApplications).toHaveBeenLastCalledWith({
      page: 1,
      pathologyNo: 'BL20260522',
      size: 20,
    });

    const resetButton = [
      ...root.querySelectorAll<HTMLButtonElement>('button'),
    ].find((button) => button.textContent?.includes('重置'));
    resetButton?.click();
    await flushAll();

    expect(pathologyNoInput.value).toBe('');
    expect(mockListApplications).toHaveBeenLastCalledWith({
      page: 1,
      size: 20,
    });

    app.unmount();
  });

  it('renders specimen numbers as different color tags and copies the clicked specimen number', async () => {
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: mockClipboardWriteText,
      },
    });
    mockClipboardWriteText.mockResolvedValue(undefined);
    mockListApplications.mockResolvedValue({
      items: [buildApplicationRow()],
      page: 1,
      size: 20,
      total: 1,
    });

    const { app, root } = await mountView();

    const specimenTags = [
      ...root.querySelectorAll<HTMLElement>('span[data-tag-type]'),
    ].filter((tag) =>
      ['SP-001', 'SP-002', 'SP-003'].includes(tag.textContent ?? ''),
    );
    expect(specimenTags).toHaveLength(3);
    expect(specimenTags.map((tag) => tag.dataset.tagType)).toEqual([
      'success',
      'warning',
      'danger',
    ]);

    specimenTags[1]?.click();
    await flushAll();

    expect(mockClipboardWriteText).toHaveBeenCalledWith('SP-002');
    expect(mockElMessageSuccess).toHaveBeenCalledWith('标本编号已复制');

    app.unmount();
  });

  it('renders the clinical submission timeline with six vertical stages', async () => {
    mockListApplications.mockResolvedValue({
      items: [buildApplicationRow()],
      page: 1,
      size: 20,
      total: 1,
    });
    mockGetApplicationTracking.mockResolvedValue(buildTrackingDetail());

    const { app, root } = await mountView({
      initialApplicationId: 'APP-TRACK-001',
      triggerKey: 1,
    });

    expect(mockGetApplicationTracking).toHaveBeenCalledWith('APP-TRACK-001');
    expect(root.textContent).toContain('回到标本接收处理');
    expect(root.textContent).toContain('异常类型：已拒收');
    expect(root.textContent).toContain('质控结果：不合格');
    expect(root.textContent).toContain('问题代码：CONTAINER_DAMAGE');
    expect(root.textContent).toContain('原因：容器破损');
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
    expect(root.textContent).toContain('SP-001');
    expect(root.textContent).toContain('SP-002');
    expect(root.textContent).toContain('SP-003');
    expect(root.textContent).toContain('条码绑定：SP-001-BC-001');
    expect(root.textContent).not.toContain('条码绑定：SP-002-BC-002');
    expect(root.textContent).toContain('IP：10.0.0.4');
    expect(root.textContent).toContain('浏览器信息：Edge 126 / Windows');
    expect(root.textContent).toContain('出库时间：2026-05-24 08:02:00');
    expect(root.textContent).toContain('出库人：李医生');
    expect(root.textContent).not.toContain('总时间线');
    expect(root.textContent).not.toContain('申请单编号');
    expect(root.textContent).not.toContain('患者标识');

    app.unmount();
  });

  it('keeps the clinical submission timeline as the primary detail timeline even with report tracking permission', async () => {
    mockAccessStore.accessCodes = [
      'PERM_APPLICATION_DETAIL_QUERY',
      'PERM_M4_REPORT_TRACKING_QUERY',
    ];
    mockListApplications.mockResolvedValue({
      items: [buildApplicationRow()],
      page: 1,
      size: 20,
      total: 1,
    });
    mockGetApplicationTracking.mockResolvedValue(buildTrackingDetail());

    const { app, root } = await mountView({
      initialApplicationId: 'APP-TRACK-001',
      triggerKey: 1,
    });

    expect(root.textContent).toContain('临床送检');
    expect(root.textContent).toContain('标本出库');
    expect(root.textContent).not.toContain('制片管理');
    expect(root.textContent).not.toContain('总时间线');

    app.unmount();
  });

  it('routes abnormal application details back to pathology receipt with barcode context', async () => {
    mockListApplications.mockResolvedValue({
      items: [buildApplicationRow()],
      page: 1,
      size: 20,
      total: 1,
    });
    mockGetApplicationTracking.mockResolvedValue(buildTrackingDetail());

    const { app, root } = await mountView({
      initialApplicationId: 'APP-TRACK-001',
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
        barcode: 'BC-001',
      },
    });

    app.unmount();
  });

  it('shows the page error when loading the tracking application list fails', async () => {
    mockListApplications.mockRejectedValue(new Error('申请单追踪列表加载失败'));

    const { app, root } = await mountView();

    expect(root.textContent).toContain('申请单追踪列表加载失败');

    app.unmount();
  });
});
