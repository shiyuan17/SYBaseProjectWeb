import { createApp, defineComponent, h, nextTick } from 'vue';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { M4_PERMISSION_CODES } from '../constants';

const { getCaseLifecycleTrackingMock, mockAccessStore, mockRoute, mockRouter } =
  vi.hoisted(() => ({
    getCaseLifecycleTrackingMock: vi.fn(),
    mockAccessStore: {
      accessCodes: [] as string[],
    },
    mockRoute: {
      name: 'ReportTracking',
      path: '/doctor-workflow/tracking',
      query: {} as Record<string, string | undefined>,
    },
    mockRouter: {
      push: vi.fn(),
      replace: vi.fn(),
    },
  }));

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => mockRouter,
}));

vi.mock('@vben/common-ui', () => ({
  Page: defineComponent({
    props: {
      description: { default: '', type: String },
      title: { default: '', type: String },
    },
    template: `
      <section>
        <h1>{{ title }}</h1>
        <p v-if="description">{{ description }}</p>
        <slot />
      </section>
    `,
  }),
}));

vi.mock('@vben/stores', () => ({
  useAccessStore: () => mockAccessStore,
}));

vi.mock('../api/doctor-workflow-service', () => ({
  getCaseLifecycleTracking: getCaseLifecycleTrackingMock,
}));

import ReportTrackingView from './ReportTrackingView.vue';

const trackingFixture = {
  applicationForm: {
    applicantDoctorName: '申请医生甲',
    applicationDate: '2026-06-15T08:00:00',
    archiveLocation: 'A-01-01',
    archiveStatus: 'IN_STORAGE',
    imageUrl: null,
    remarks: '申请备注',
  },
  caseSummary: {
    applicationDate: '2026-06-15T08:00:00',
    applicationNo: 'APP-001',
    applicationType: 'ROUTINE',
    caseId: 'CASE-001',
    caseStatus: 'IN_DIAGNOSIS',
    currentStage: 'SIGNED',
    hasPendingRevision: true,
    pathologyNo: 'PATH-001',
    patientAge: '35岁',
    patientGender: '男',
    patientName: '张三',
    submittingDepartmentName: '外科',
    submittingDoctorName: '送检医生甲',
  },
  overallTimeline: [
    {
      nodes: [
        {
          eventContent: '申请创建完成',
          keyFacts: [{ label: '申请单号', value: 'APP-001' }],
          nodeCode: 'APPLICATION_CREATED',
          occurredAt: '2026-06-15T08:00:00',
          operatorName: '申请医生甲',
          stageCode: 'APPLICATION',
          status: 'COMPLETED',
          title: '申请创建',
        },
      ],
      stageCode: 'APPLICATION',
      stageTitle: '申请创建',
    },
  ],
  reportLifecycle: {
    consultations: [
      {
        consultationId: 'CONSULT-001',
        opinion: '建议补充会诊意见',
        requestedByName: '发起医生甲',
        status: 'IN_PROGRESS',
      },
    ],
    currentReport: {
      finalDiagnosis: '最终诊断',
      publishedAt: '2026-06-15T12:00:00',
      reportId: 'REPORT-001',
      reportNo: 'RPT-001',
      reportStatus: 'SIGNED',
      signedAt: '2026-06-15T11:00:00',
      signedByName: '签发医生甲',
      versionNo: 3,
    },
    diagnosticTasks: [
      {
        caseId: 'CASE-001',
        diagnosisDoctorName: '责任医生甲',
        id: 'TASK-001',
        taskStatus: 'COMPLETED',
        taskType: 'PRIMARY',
      },
    ],
    medicalOrders: [
      {
        doctorName: '医生甲',
        orderContent: '补做特殊染色',
        orderDate: '2026-06-15T09:00:00',
        orderId: 'ORDER-001',
        orderType: 'SPECIAL_STAIN',
        status: 'PENDING',
      },
    ],
    revisions: [
      {
        requestId: 'REV-001',
        requestStatus: 'PENDING',
        requestedAt: '2026-06-15T11:30:00',
        requestedByName: '申请医生乙',
      },
    ],
    versions: [
      {
        createdAt: '2026-06-15T10:00:00',
        finalDiagnosisSnapshot: '最终诊断快照',
        signedAt: '2026-06-15T11:00:00',
        versionId: 'VER-001',
        versionNo: 3,
        versionStatus: 'SIGNED',
      },
    ],
  },
  specimens: [
    {
      archiveLocation: 'S-01',
      archiveStatus: 'IN_STORAGE',
      barcode: 'BC-001',
      blocks: [
        {
          archiveLocation: 'B-01',
          archiveStatus: 'IN_STORAGE',
          blockCode: 'BK-001',
          blockEvents: [
            {
              eventContent: '完成取材',
              keyFacts: [],
              occurredAt: '2026-06-15T09:30:00',
              operatorName: '取材医生甲',
              status: 'COMPLETED',
              title: '取材',
            },
          ],
          blockId: 'BLOCK-001',
          embeddedByName: '包埋医生甲',
          embeddingBoxNo: 'A1',
          grossDescription: '取材描述',
          loanStatus: 'NONE',
          sampledAt: '2026-06-15T09:20:00',
          sampledByName: '取材医生甲',
          slides: [
            {
              archiveLocation: 'SL-01',
              archiveStatus: 'IN_STORAGE',
              loanStatus: 'NONE',
              qcResult: 'PASS',
              slideEvents: [
                {
                  eventContent: '完成切片',
                  keyFacts: [],
                  occurredAt: '2026-06-15T10:30:00',
                  operatorName: '切片医生甲',
                  status: 'COMPLETED',
                  title: '切片',
                },
              ],
              slideId: 'SLIDE-001',
              slideNo: 'SL-001',
              slideStatus: 'COMPLETED',
              reworkStatus: 'IN_PROGRESS',
              slicedAt: '2026-06-15T10:30:00',
              slicedByName: '切片医生甲',
              specimenId: 'SPEC-001',
            },
          ],
          specimenId: 'SPEC-001',
          specimenName: '胃体组织',
        },
      ],
      checkedInAt: '2026-06-15T09:10:00',
      confirmedAt: '2026-06-15T09:05:00',
      createdAt: '2026-06-15T08:10:00',
      fixedAt: '2026-06-15T08:40:00',
      loanStatus: 'NONE',
      receiptStatus: 'RECEIVED',
      receivedAt: '2026-06-15T09:15:00',
      removalAt: '2026-06-15T08:20:00',
      specimenEvents: [
        {
          eventContent: '标本创建完成',
          keyFacts: [],
          occurredAt: '2026-06-15T08:10:00',
          operatorName: '登记员甲',
          status: 'COMPLETED',
          title: '标本创建',
        },
      ],
      specimenId: 'SPEC-001',
      specimenName: '胃体组织',
      specimenNo: 'SP-001',
      specimenStatus: 'RECEIVED',
    },
  ],
};

async function flush() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

async function mountView() {
  const root = document.createElement('div');
  document.body.append(root);

  const app = createApp({
    render() {
      return h(ReportTrackingView);
    },
  });

  app.directive('loading', {
    mounted() {},
    updated() {},
  });

  app.mount(root);
  await flush();

  return {
    root,
    unmount: () => {
      app.unmount();
      root.remove();
    },
  };
}

describe('ReportTrackingView', () => {
  beforeEach(() => {
    mockAccessStore.accessCodes = [M4_PERMISSION_CODES.REPORT_TRACKING_QUERY];
    mockRoute.name = 'ReportTracking';
    mockRoute.path = '/doctor-workflow/tracking';
    mockRoute.query = {};
    mockRouter.push.mockReset();
    mockRouter.replace.mockReset();
    getCaseLifecycleTrackingMock.mockReset();
  });

  it('shows case-id-or-pathology-no guidance', async () => {
    const wrapper = await mountView();

    expect(wrapper.root.textContent).toContain('病例 ID / 病理号');
    expect(wrapper.root.textContent).toContain(
      '请输入病例 ID 或病理号查询病例全生命周期追踪',
    );

    wrapper.unmount();
  });

  it('shows page error when lifecycle tracking query fails', async () => {
    mockRoute.query = { caseId: 'CASE-MISSING' };
    getCaseLifecycleTrackingMock.mockRejectedValue({
      response: {
        data: {
          code: 'RESOURCE_NOT_FOUND',
          message: '未找到生命周期追踪病例',
        },
        status: 404,
      },
    });

    const wrapper = await mountView();
    await flush();

    expect(getCaseLifecycleTrackingMock).toHaveBeenCalledWith('CASE-MISSING');
    expect(wrapper.root.textContent).toContain('未找到生命周期追踪病例');

    wrapper.unmount();
  });

  it('renders lifecycle summary, timeline, hierarchy and report chain', async () => {
    mockRoute.query = { caseId: 'CASE-001' };
    getCaseLifecycleTrackingMock.mockResolvedValue(trackingFixture);

    const wrapper = await mountView();
    await flush();

    expect(wrapper.root.textContent).toContain('病例追踪');
    expect(wrapper.root.textContent).toContain('病例摘要');
    expect(wrapper.root.textContent).toContain('全局生命周期时间线');
    expect(wrapper.root.textContent).toContain('对象追踪区');
    expect(wrapper.root.textContent).toContain('报告链区');
    expect(wrapper.root.textContent).toContain('申请创建');
    expect(wrapper.root.textContent).toContain('标本创建');
    expect(wrapper.root.textContent).toContain('蜡块 BK-001');
    expect(wrapper.root.textContent).toContain('玻片 SL-001');
    expect(wrapper.root.textContent).toContain('补做特殊染色');
    expect(wrapper.root.textContent).toContain('已签发');
    expect(wrapper.root.textContent).toContain('诊断中');
    expect(wrapper.root.textContent).toContain('已接收');
    expect(wrapper.root.textContent).toContain('合格');
    expect(wrapper.root.textContent).toContain('返工中');
    expect(wrapper.root.textContent).toContain('进行中');
    expect(wrapper.root.textContent).toContain('待审批');
    expect(wrapper.root.textContent).not.toContain(
      '当前病例、患者、申请单与归档总览',
    );
    expect(wrapper.root.textContent).not.toContain(
      '固定顺序展示申请创建、标本、技术处理、诊断报告与归档借阅关键节点',
    );
    expect(wrapper.root.textContent).not.toContain(
      '按标本 -> 蜡块 -> 玻片分层展示',
    );
    expect(wrapper.root.textContent).not.toContain(
      '保留当前报告、诊断任务、版本链、修订、会诊与医嘱链路',
    );
    expect(wrapper.root.textContent).not.toContain('SIGNED');
    expect(wrapper.root.textContent).not.toContain('IN_DIAGNOSIS');
    expect(wrapper.root.textContent).not.toContain('RECEIVED');
    expect(wrapper.root.textContent).not.toContain('PASS');
    expect(wrapper.root.textContent).not.toContain('取消');

    wrapper.unmount();
  });

  it('updates the tracking route query when searching by pathology number', async () => {
    const wrapper = await mountView();
    const input = wrapper.root.querySelector('input');
    const buttons = [...wrapper.root.querySelectorAll('button')];
    const searchButton = buttons.find(
      (button) => button.textContent?.trim() === '查询',
    );

    expect(input).toBeTruthy();
    expect(searchButton).toBeTruthy();

    input!.value = 'BL202605240003';
    input!.dispatchEvent(new Event('input', { bubbles: true }));
    await flush();

    searchButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flush();

    expect(mockRouter.replace).toHaveBeenCalledWith({
      path: '/doctor-workflow/tracking',
      query: {
        caseId: 'BL202605240003',
      },
    });
    expect(getCaseLifecycleTrackingMock).not.toHaveBeenCalled();

    wrapper.unmount();
  });
});
