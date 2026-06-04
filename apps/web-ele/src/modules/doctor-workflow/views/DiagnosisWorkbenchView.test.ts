import type {
  DiagnosticWorkbenchView,
  PendingDiagnosticTaskPage,
} from '../types/doctor-workflow';

import { createApp, defineComponent, h, nextTick } from 'vue';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  acceptDiagnosticTaskMock,
  cancelMedicalOrderMock,
  createMedicalOrderMock,
  getDiagnosticWorkbenchMock,
  listPendingDiagnosticTasksMock,
  mockAccessStore,
  mockRoute,
  mockRouter,
  mockUserStore,
  startDiagnosticTaskMock,
} = vi.hoisted(() => ({
  acceptDiagnosticTaskMock:
    vi.fn<(taskId: string, data: unknown) => Promise<unknown>>(),
  cancelMedicalOrderMock:
    vi.fn<(orderId: string, data: unknown) => Promise<unknown>>(),
  createMedicalOrderMock: vi.fn<(data: unknown) => Promise<unknown>>(),
  getDiagnosticWorkbenchMock:
    vi.fn<(caseId: string) => Promise<DiagnosticWorkbenchView>>(),
  listPendingDiagnosticTasksMock:
    vi.fn<(query: unknown) => Promise<PendingDiagnosticTaskPage>>(),
  mockAccessStore: {
    accessCodes: ['PERM_M4_WORKBENCH_QUERY'],
  },
  mockRoute: {
    query: {} as Record<string, string | undefined>,
  },
  mockRouter: {
    push: vi.fn(),
    replace: vi.fn(),
  },
  mockUserStore: {
    userInfo: {
      realName: '当前医生',
      userId: 'USER-CURRENT',
    },
  },
  startDiagnosticTaskMock:
    vi.fn<(taskId: string, data: unknown) => Promise<unknown>>(),
}));

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => mockRouter,
}));

vi.mock('@vben/common-ui', () => ({
  Page: defineComponent({
    props: {
      description: {
        default: '',
        type: String,
      },
      title: {
        default: '',
        type: String,
      },
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
  useUserStore: () => mockUserStore,
}));

vi.mock('../api/doctor-workflow-service', () => ({
  acceptDiagnosticTask: acceptDiagnosticTaskMock,
  cancelMedicalOrder: cancelMedicalOrderMock,
  createMedicalOrder: createMedicalOrderMock,
  getDiagnosticWorkbench: getDiagnosticWorkbenchMock,
  listPendingDiagnosticTasks: listPendingDiagnosticTasksMock,
  startDiagnosticTask: startDiagnosticTaskMock,
}));

import DiagnosisWorkbenchView from './DiagnosisWorkbenchView.vue';

const queueFixture = {
  items: [
    {
      caseId: 'CASE-001',
      diagnosisDoctorName: '当前医生',
      diagnosisDoctorUserId: 'USER-CURRENT',
      id: 'TASK-001',
      pathologyNo: 'PATH-001',
      patientName: '张三',
      primaryDoctorName: '当前医生',
      primaryDoctorUserId: 'USER-CURRENT',
      reviewerName: '审核甲',
      reviewerUserId: 'DOC-REVIEW-1',
      taskStatus: 'ASSIGNED',
      taskType: 'PRIMARY',
    },
    {
      caseId: 'CASE-002',
      diagnosisDoctorName: '当前医生',
      diagnosisDoctorUserId: 'USER-CURRENT',
      id: 'TASK-002',
      pathologyNo: 'PATH-002',
      patientName: '李四',
      primaryDoctorName: '当前医生',
      primaryDoctorUserId: 'USER-CURRENT',
      reviewerName: '审核乙',
      reviewerUserId: 'DOC-REVIEW-2',
      taskStatus: 'ACCEPTED',
      taskType: 'REVIEW',
    },
  ],
  page: 1,
  size: 20,
  total: 2,
} satisfies PendingDiagnosticTaskPage;

const workbenchFixtureByCaseId: Record<string, DiagnosticWorkbenchView> = {
  'CASE-001': {
    applicationFormArchiveLocation: 'A柜-01-02',
    applicationFormArchiveStatus: 'ARCHIVED',
    applicationFormImageUrl: '/archives/APP-001.jpg',
    applicationNo: 'APP-001',
    blocks: [
      {
        archiveLocation: '蜡块柜-B1',
        archiveStatus: 'ARCHIVED',
        blockCode: 'A1',
        blockId: 'BLOCK-001',
        description: '胃窦组织',
        embeddingBoxNo: 'BOX-001',
        loanStatus: 'IN_LIBRARY',
        specimenId: 'SPEC-001',
      },
    ],
    caseId: 'CASE-001',
    caseStatus: 'IN_DIAGNOSIS',
    clinicalDiagnosis: '临床诊断一',
    consultations: [
      {
        completedAt: '2026-06-01 12:30:00',
        consultationId: 'CONS-001',
        consultationType: 'INTERNAL',
        hostName: '主持医生',
        opinion: '建议补充免疫组化后签发',
        participantCount: 2,
        requestedAt: '2026-06-01 10:20:00',
        requestedByName: '当前医生',
        status: 'COMPLETED',
      },
    ],
    currentReport: {
      finalDiagnosis: '最终诊断一',
      grossExam: '大体所见一',
      microscopicExam: '镜检所见一',
      reportId: 'REPORT-001',
      reportNo: 'RPT-001',
      reportStatus: 'DRAFT',
      versionNo: 1,
    },
    diagnosticTasks: [queueFixture.items[0]!],
    hasPendingRevision: true,
    medicalOrders: [
      {
        acceptedAt: '2026-06-01 10:30:00',
        applicationNo: 'APP-001',
        billingStatus: 'CHARGED',
        caseId: 'CASE-001',
        completedAt: null,
        doctorName: '当前医生',
        executionScope: 'A1',
        executorName: '技师甲',
        orderContent: '免疫组化 CK',
        orderDate: '2026-06-01 10:10:00',
        orderId: 'ORDER-001',
        orderNumber: 'MO-001',
        orderType: 'IMMUNOHISTOCHEMISTRY',
        pathologyNo: 'PATH-001',
        patientName: '张三',
        remarks: '优先处理',
        status: 'PENDING',
      },
    ],
    pathologyNo: 'PATH-001',
    patientName: '张三',
    recentEvents: [
      {
        eventContent: '已完成接单',
        eventStatus: 'DONE',
        eventTime: '2026-06-01 09:00:00',
        eventType: 'TASK_ACCEPTED',
        nodeCode: 'DIAGNOSIS',
        operatorName: '当前医生',
      },
    ],
    revisions: [
      {
        approvedVersionNo: null,
        currentVersionNo: 1,
        rejectReason: null,
        reportId: 'REPORT-001',
        requestId: 'REV-001',
        requestedAt: '2026-06-01 13:00:00',
        requestedByName: '当前医生',
        requestReason: '补充诊断描述',
        requestStatus: 'PENDING',
        reviewedAt: null,
        reviewedByName: null,
      },
    ],
    slides: [
      {
        archiveLocation: '玻片柜-S1',
        archiveStatus: 'ARCHIVED',
        embeddingBoxId: 'BOX-001',
        loanStatus: 'IN_LIBRARY',
        qualityStatus: 'QUALIFIED',
        slideId: 'SLIDE-001',
        slideNo: 'SLIDE-001',
        slideStatus: 'READY',
        specimenId: 'SPEC-001',
      },
    ],
    specimens: [
      {
        barcode: 'BC-001',
        specimenId: 'SPEC-001',
        specimenName: '胃窦活检组织',
        specimenNo: 'SP-001',
        specimenStatus: 'RECEIVED',
      },
    ],
    submittingDepartmentName: '消化内科',
    submittingDoctorName: '送检医生甲',
  },
  'CASE-002': {
    applicationNo: 'APP-002',
    blocks: [],
    caseId: 'CASE-002',
    caseStatus: 'REPORTING',
    clinicalDiagnosis: '临床诊断二',
    consultations: [],
    currentReport: {
      finalDiagnosis: '最终诊断二',
      grossExam: '大体所见二',
      microscopicExam: '镜检所见二',
      reportId: 'REPORT-002',
      reportNo: 'RPT-002',
      reportStatus: 'SIGNED',
      versionNo: 3,
    },
    diagnosticTasks: [queueFixture.items[1]!],
    hasPendingRevision: true,
    medicalOrders: [],
    pathologyNo: 'PATH-002',
    patientName: '李四',
    recentEvents: [
      {
        eventContent: '报告已签发',
        eventStatus: 'DONE',
        eventTime: '2026-06-01 11:00:00',
        eventType: 'REPORT_SIGNED',
        nodeCode: 'REPORT',
        operatorName: '当前医生',
      },
    ],
    revisions: [],
    slides: [],
    specimens: [],
    submittingDepartmentName: '呼吸内科',
    submittingDoctorName: '送检医生乙',
  },
};

function resetTestState() {
  mockRoute.query = {};
  mockRouter.push.mockReset();
  mockRouter.replace.mockReset();
  acceptDiagnosticTaskMock.mockReset();
  cancelMedicalOrderMock.mockReset();
  createMedicalOrderMock.mockReset();
  getDiagnosticWorkbenchMock.mockReset();
  listPendingDiagnosticTasksMock.mockReset();
  startDiagnosticTaskMock.mockReset();

  listPendingDiagnosticTasksMock.mockResolvedValue(queueFixture);
  getDiagnosticWorkbenchMock.mockImplementation(async (caseId) => {
    return (
      workbenchFixtureByCaseId[caseId] ?? workbenchFixtureByCaseId['CASE-001']!
    );
  });
  acceptDiagnosticTaskMock.mockResolvedValue({});
  cancelMedicalOrderMock.mockResolvedValue({});
  createMedicalOrderMock.mockResolvedValue({});
  startDiagnosticTaskMock.mockResolvedValue({});
}

async function flushAsyncWork() {
  await Promise.resolve();
  await nextTick();
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
      return h(DiagnosisWorkbenchView);
    },
  });

  app.directive('loading', {
    mounted() {},
    updated() {},
  });

  app.mount(root);
  await flushAsyncWork();

  return {
    clickByTestId: async (testId: string) => {
      const element = root.querySelector(`[data-testid="${testId}"]`);
      expect(element).toBeTruthy();
      (element as HTMLElement).click();
      await flushAsyncWork();
    },
    text: () => root.textContent ?? '',
    unmount: () => {
      app.unmount();
      root.remove();
    },
  };
}

describe('DiagnosisWorkbenchView', () => {
  beforeEach(() => {
    resetTestState();
  });

  it('selects the first queue item and loads its workbench when route query is empty', async () => {
    const wrapper = await mountView();

    expect(listPendingDiagnosticTasksMock).toHaveBeenCalledWith({
      page: 1,
      pathologyNo: undefined,
      size: 20,
      taskStatus: undefined,
      taskType: undefined,
    });
    expect(getDiagnosticWorkbenchMock).toHaveBeenCalledWith('CASE-001');
    expect(mockRouter.replace).toHaveBeenCalledWith({
      path: '/doctor-workflow/workbench',
      query: {
        caseId: 'CASE-001',
        pathologyNo: 'PATH-001',
        taskId: 'TASK-001',
      },
    });
    expect(wrapper.text()).toContain('张三');
    expect(wrapper.text()).toContain('最终诊断一');

    wrapper.unmount();
  });

  it('switches the right pane when selecting another queue item', async () => {
    mockRoute.query = {
      caseId: 'CASE-001',
      taskId: 'TASK-001',
    };

    const wrapper = await mountView();

    await wrapper.clickByTestId('diagnosis-workbench-queue-row-TASK-002');

    expect(getDiagnosticWorkbenchMock).toHaveBeenLastCalledWith('CASE-002');
    expect(mockRouter.replace).toHaveBeenLastCalledWith({
      path: '/doctor-workflow/workbench',
      query: {
        caseId: 'CASE-002',
        pathologyNo: 'PATH-002',
        taskId: 'TASK-002',
      },
    });
    expect(wrapper.text()).toContain('李四');
    expect(wrapper.text()).toContain('最终诊断二');

    wrapper.unmount();
  });

  it('renders gross and microscopic report summaries inside detail tabs', async () => {
    mockRoute.query = {
      caseId: 'CASE-001',
      taskId: 'TASK-001',
    };

    const wrapper = await mountView();

    expect(wrapper.text()).toContain('报告概览');
    expect(wrapper.text()).toContain('大体所见一');
    expect(wrapper.text()).toContain('镜检所见一');
    expect(wrapper.text()).toContain('流程痕迹');

    wrapper.unmount();
  });

  it('renders supplemented modules from existing workbench fields', async () => {
    const wrapper = await mountView();

    expect(wrapper.text()).toContain('申请单归档');
    expect(wrapper.text()).toContain('A柜-01-02');
    expect(wrapper.text()).toContain('胃窦活检组织');
    expect(wrapper.text()).toContain('SLIDE-001');
    expect(wrapper.text()).toContain('科内会诊');
    expect(wrapper.text()).toContain('CONS-001');
    expect(wrapper.text()).toContain('报告修订');
    expect(wrapper.text()).toContain('补充诊断描述');
    expect(wrapper.text()).toContain('CHARGED');
    expect(wrapper.text()).toContain('免疫组化 CK');

    wrapper.unmount();
  });
});
