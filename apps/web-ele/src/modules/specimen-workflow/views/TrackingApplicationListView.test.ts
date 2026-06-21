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
  createTimelineItemStub,
} from '../test-utils/component-stubs';

const tableRowKey = vi.hoisted(() => Symbol('table-row'));
const tabsContextKey = vi.hoisted(() => Symbol('tabs-context'));

const {
  mockAccessStore,
  mockClipboardWriteText,
  mockElMessageSuccess,
  mockGetCaseLifecycleTracking,
  mockGetApplicationTracking,
  mockListApplications,
  mockPush,
} = vi.hoisted(() => ({
  mockAccessStore: {
    accessCodes: ['PERM_APPLICATION_DETAIL_QUERY'] as string[],
  },
  mockClipboardWriteText: vi.fn(),
  mockElMessageSuccess: vi.fn(),
  mockGetCaseLifecycleTracking: vi.fn(),
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

vi.mock('../../doctor-workflow/api/doctor-workflow-service', () => ({
  getCaseLifecycleTracking: mockGetCaseLifecycleTracking,
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
    ElTable: createTableStub(tableRowKey),
    ElTableColumn: createTableColumnStub(tableRowKey),
    ElMessage: {
      success: mockElMessageSuccess,
    },
    ElTabs: createTabsStub(tabsContextKey),
    ElTag: createTagStub(),
    ElTimeline: createPassthroughStub('ul'),
    ElTimelineItem: createTimelineItemStub(),
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

function buildLifecycleTrackingDetail() {
  return {
    applicationForm: null,
    caseSummary: {
      caseId: 'CASE-001',
      hasPendingRevision: false,
      pathologyNo: 'BL202605220001',
    },
    overallTimeline: [
      {
        nodes: [
          {
            keyFacts: [
              { label: '离体操作人', value: '离体员甲' },
              { label: '离体时间', value: '2026-05-22T07:30:00' },
            ],
            nodeCode: 'SPECIMEN_REMOVAL',
            occurredAt: '2026-05-22T07:30:00',
            operatorName: '离体员甲',
            stageCode: 'SPECIMEN',
            status: 'COMPLETED',
            title: '离体确认',
          },
        ],
        stageCode: 'SPECIMEN',
        stageTitle: '临床送检',
      },
      {
        nodes: [
          {
            keyFacts: [
              { label: '登记状态', value: 'COMPLETED' },
              { label: '登记时间', value: '2026-05-22T08:00:00' },
              { label: '登记人', value: '登记员甲' },
            ],
            nodeCode: 'SPECIMEN_REGISTRATION',
            occurredAt: '2026-05-22T08:00:00',
            operatorName: '登记员甲',
            stageCode: 'SPECIMEN',
            status: 'COMPLETED',
            title: '标本登记',
          },
          {
            keyFacts: [
              { label: '初步阅片人', value: '初诊医生甲' },
              { label: '初步阅片时间', value: '2026-05-22T10:00:00' },
            ],
            nodeCode: 'PRIMARY_READING',
            occurredAt: '2026-05-22T10:00:00',
            operatorName: '初诊医生甲',
            stageCode: 'REPORT',
            status: 'SUBMITTED',
            title: '初步阅片',
          },
          {
            keyFacts: [{ label: '详情报告', value: '诊断详情' }],
            nodeCode: 'REPORT_DETAIL',
            occurredAt: '2026-05-22T11:00:00',
            operatorName: '签发医生甲',
            stageCode: 'REPORT',
            status: 'SIGNED',
            title: '详情报告',
          },
        ],
        stageCode: 'REPORT',
        stageTitle: '报告',
      },
    ],
    reportLifecycle: {
      consultations: [],
      currentReport: null,
      diagnosticTasks: [],
      medicalOrders: [],
      revisions: [],
      versions: [],
    },
    specimens: [],
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
    mockGetCaseLifecycleTracking.mockReset();
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

  it('renders overall and specimen timeline tabs, with same-second multi-specimen events aggregated in the overall tab', async () => {
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
    expect(root.querySelector('[data-tab-name="overall"]')?.textContent).toBe(
      '总时间线',
    );
    expect(root.querySelector('[data-tab-name="SPEC-001"]')?.textContent).toBe(
      'SP-001',
    );
    expect(root.querySelector('[data-tab-name="SPEC-002"]')?.textContent).toBe(
      'SP-002',
    );
    expect(root.querySelector('[data-tab-name="SPEC-003"]')?.textContent).toBe(
      'SP-003',
    );
    expect(root.textContent).toContain('回到标本接收处理');
    expect(root.textContent).toContain('异常类型：已拒收');
    expect(root.textContent).toContain('质控结果：不合格');
    expect(root.textContent).toContain('问题代码：CONTAINER_DAMAGE');
    expect(root.textContent).toContain('原因：容器破损');

    const overallPanel = root.querySelector('[data-tab-panel="overall"]');
    expect(overallPanel).not.toBeNull();
    const overallText = overallPanel?.textContent ?? '';
    expect(overallText).toContain('转运交接 / 成功');
    expect(overallText).toContain('SP-001');
    expect(overallText).toContain('SP-002');
    expect(overallText).toContain('公共事件');
    expect(overallText).toContain('创建转运单');
    expect(overallText).toContain('完成交接');
    expect(overallText).toContain('打印转运单');
    expect(overallText).toContain('IP');
    expect(overallText).not.toContain('节点:');
    expect(overallText).not.toContain('终端');
    expect(root.textContent).not.toContain('申请单编号');
    expect(root.textContent).not.toContain('患者标识');
    expect(root.textContent).not.toContain('PAT-001');

    app.unmount();
  });

  it('loads and renders lifecycle timeline when report tracking permission and pathology number are available', async () => {
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
    mockGetCaseLifecycleTracking.mockResolvedValue(
      buildLifecycleTrackingDetail(),
    );

    const { app, root } = await mountView({
      initialApplicationId: 'APP-TRACK-001',
      triggerKey: 1,
    });

    expect(mockGetCaseLifecycleTracking).toHaveBeenCalledWith('BL202605220001');
    expect(root.textContent).toContain('临床送检');
    expect(root.textContent).toContain('制片管理');
    expect(root.textContent).toContain('离体确认');
    expect(root.textContent).toContain('标本登记');
    expect(root.textContent).toContain('报告');
    expect(root.textContent).toContain('初步阅片人');
    expect(root.textContent).toContain('详情报告');
    expect(root.textContent).not.toContain('总时间线');

    app.unmount();
  });

  it('keeps the recent-event timeline when lifecycle permission is missing', async () => {
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

    expect(mockGetCaseLifecycleTracking).not.toHaveBeenCalled();
    expect(root.textContent).toContain('暂无报告追踪权限');
    expect(root.querySelector('[data-tab-name="overall"]')?.textContent).toBe(
      '总时间线',
    );

    app.unmount();
  });

  it('keeps the recent-event timeline when the application has no pathology number', async () => {
    mockAccessStore.accessCodes = [
      'PERM_APPLICATION_DETAIL_QUERY',
      'PERM_M4_REPORT_TRACKING_QUERY',
    ];
    mockListApplications.mockResolvedValue({
      items: [{ ...buildApplicationRow(), pathologyNo: null }],
      page: 1,
      size: 20,
      total: 1,
    });
    mockGetApplicationTracking.mockResolvedValue(buildTrackingDetail());

    const { app, root } = await mountView({
      initialApplicationId: 'APP-TRACK-001',
      triggerKey: 1,
    });

    expect(mockGetCaseLifecycleTracking).not.toHaveBeenCalled();
    expect(root.textContent).toContain('当前申请单暂无病理号');
    expect(root.querySelector('[data-tab-name="overall"]')?.textContent).toBe(
      '总时间线',
    );

    app.unmount();
  });

  it('falls back to the recent-event timeline when lifecycle loading fails', async () => {
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
    mockGetCaseLifecycleTracking.mockRejectedValue(new Error('无生命周期数据'));

    const { app, root } = await mountView({
      initialApplicationId: 'APP-TRACK-001',
      triggerKey: 1,
    });

    expect(mockGetCaseLifecycleTracking).toHaveBeenCalledWith('BL202605220001');
    expect(root.textContent).toContain('生命周期时间线加载失败');
    expect(root.querySelector('[data-tab-name="overall"]')?.textContent).toBe(
      '总时间线',
    );

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

  it('shows only the selected specimen events in a specimen tab and excludes public events', async () => {
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

    const specimenTab = root.querySelector<HTMLButtonElement>(
      '[data-tab-name="SPEC-001"]',
    );
    specimenTab?.click();
    await flushAll();

    const specimenPanel = root.querySelector('[data-tab-panel="SPEC-001"]');
    expect(specimenPanel).not.toBeNull();
    const specimenText = specimenPanel?.textContent ?? '';
    expect(specimenText).toContain('转运交接 / 成功');
    expect(specimenText).toContain('创建转运单');
    expect(specimenText).toContain('完成交接');
    expect(specimenText).not.toContain('打印转运单');
    expect(specimenText).not.toContain('公共事件');
    expect(specimenText).not.toContain('SP-002');

    app.unmount();
  });

  it('shows an empty state for specimen tabs without their own events', async () => {
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

    const emptySpecimenTab = root.querySelector<HTMLButtonElement>(
      '[data-tab-name="SPEC-003"]',
    );
    emptySpecimenTab?.click();
    await flushAll();

    const emptySpecimenPanel = root.querySelector(
      '[data-tab-panel="SPEC-003"]',
    );
    expect(emptySpecimenPanel?.textContent ?? '').toContain(
      '该标本暂无追踪事件',
    );

    app.unmount();
  });

  it('shows the page error when loading the tracking application list fails', async () => {
    mockListApplications.mockRejectedValue(new Error('申请单追踪列表加载失败'));

    const { app, root } = await mountView();

    expect(root.textContent).toContain('申请单追踪列表加载失败');

    app.unmount();
  });
});
