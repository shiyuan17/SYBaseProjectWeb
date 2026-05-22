import type {
  DiagnosticWorkbenchView,
  PendingDiagnosticTaskPage,
  ReportTrackingView as ReportTrackingData,
} from '../types/doctor-workflow';

import { createApp, defineComponent, h, nextTick } from 'vue';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { M4_PERMISSION_CODES } from '../constants';

const {
  getDiagnosticWorkbenchMock,
  getReportTrackingMock,
  listPendingDiagnosticTasksMock,
  mockAccessStore,
  mockRoute,
  mockRouter,
} = vi.hoisted(() => ({
  getDiagnosticWorkbenchMock: vi.fn<
    (caseId: string) => Promise<DiagnosticWorkbenchView>
  >(),
  getReportTrackingMock: vi.fn<
    (caseId: string) => Promise<ReportTrackingData>
  >(),
  listPendingDiagnosticTasksMock: vi.fn<
    (query: unknown) => Promise<PendingDiagnosticTaskPage>
  >(),
  mockAccessStore: {
    accessCodes: [] as string[],
  },
  mockRoute: {
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
}));

vi.mock('../api/doctor-workflow-service', () => ({
  acceptDiagnosticTask: vi.fn(),
  approveReportRevisionRequest: vi.fn(),
  assignDiagnosticTask: vi.fn(),
  commentConsultationParticipant: vi.fn(),
  completeConsultation: vi.fn(),
  createConsultation: vi.fn(),
  createPathologyReport: vi.fn(),
  createReportRevisionRequest: vi.fn(),
  getDiagnosticWorkbench: getDiagnosticWorkbenchMock,
  getReportTracking: getReportTrackingMock,
  listPendingDiagnosticTasks: listPendingDiagnosticTasksMock,
  publishPathologyReport: vi.fn(),
  rejectPathologyReport: vi.fn(),
  rejectReportRevisionRequest: vi.fn(),
  reviewPathologyReport: vi.fn(),
  savePathologyReportDraft: vi.fn(),
  signPathologyReport: vi.fn(),
  startDiagnosticTask: vi.fn(),
  submitPathologyReport: vi.fn(),
}));

import ConsultationWorkstationView from './ConsultationWorkstationView.vue';
import DiagnosisAssignmentView from './DiagnosisAssignmentView.vue';
import DiagnosisWorkbenchView from './DiagnosisWorkbenchView.vue';
import PathologyReportView from './PathologyReportView.vue';
import ReportRevisionView from './ReportRevisionView.vue';
import ReportTrackingView from './ReportTrackingView.vue';

const workbenchFixture: DiagnosticWorkbenchView = {
  applicationNo: 'APP-001',
  blocks: [],
  caseId: 'CASE-001',
  caseStatus: 'IN_DIAGNOSIS',
  clinicalDiagnosis: '临床诊断',
  consultations: [],
  currentReport: {
    finalDiagnosis: '最终诊断',
    reportId: 'REPORT-001',
    reportNo: 'RPT-001',
    reportStatus: 'DRAFT',
    richTextContent: '<p>正文</p>',
    versionNo: 1,
  },
  diagnosticTasks: [
    {
      caseId: 'CASE-001',
      id: 'TASK-001',
      taskStatus: 'ASSIGNED',
      taskType: 'PRIMARY',
    },
  ],
  hasPendingRevision: false,
  medicalOrders: [],
  pathologyNo: 'PATH-001',
  patientName: '张三',
  recentEvents: [],
  revisions: [],
  slides: [],
  specimens: [],
};

const trackingFixture: ReportTrackingData = {
  caseId: 'CASE-001',
  consultations: [],
  currentDraftVersionNo: 1,
  currentReport: {
    finalDiagnosis: '最终诊断',
    reportId: 'REPORT-001',
    reportNo: 'RPT-001',
    reportStatus: 'SIGNED',
    versionNo: 1,
  },
  diagnosticTasks: [],
  events: [],
  hasPendingRevision: false,
  medicalOrders: [],
  pathologyNo: 'PATH-001',
  revisions: [],
  versions: [],
};

function resetTestState() {
  mockAccessStore.accessCodes = [];
  mockRoute.query = {};
  mockRouter.push.mockReset();
  mockRouter.replace.mockReset();
  listPendingDiagnosticTasksMock.mockReset();
  getDiagnosticWorkbenchMock.mockReset();
  getReportTrackingMock.mockReset();
  listPendingDiagnosticTasksMock.mockResolvedValue({
    items: [],
    page: 1,
    size: 20,
    total: 0,
  });
  getDiagnosticWorkbenchMock.mockResolvedValue(workbenchFixture);
  getReportTrackingMock.mockResolvedValue(trackingFixture);
}

async function flushAsyncWork() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

async function mountView(component: object) {
  const root = document.createElement('div');
  document.body.appendChild(root);

  const app = createApp({
    render() {
      return h(component);
    },
  });

  app.directive('loading', {
    mounted() {},
    updated() {},
  });

  app.mount(root);
  await flushAsyncWork();

  return {
    buttonTexts: () =>
      Array.from(root.querySelectorAll('button')).map(
        (button) => button.textContent?.trim() ?? '',
      ),
    text: () => root.textContent ?? '',
    unmount: () => {
      app.unmount();
      root.remove();
    },
  };
}

describe('doctor workflow view visibility', () => {
  beforeEach(() => {
    resetTestState();
  });

  it('shows assign action only for users with assign permission', async () => {
    listPendingDiagnosticTasksMock.mockResolvedValue({
      items: [
        {
          caseId: 'CASE-001',
          id: 'TASK-001',
          taskStatus: 'PENDING',
          taskType: 'PRIMARY',
        },
      ],
      page: 1,
      size: 20,
      total: 1,
    });

    mockAccessStore.accessCodes = [M4_PERMISSION_CODES.DIAG_TASK_QUERY];
    const readOnlyWrapper = await mountView(DiagnosisAssignmentView);
    expect(readOnlyWrapper.buttonTexts()).toContain('工作台');
    expect(readOnlyWrapper.buttonTexts()).not.toContain('分派');
    readOnlyWrapper.unmount();

    mockAccessStore.accessCodes = [
      M4_PERMISSION_CODES.DIAG_TASK_QUERY,
      M4_PERMISSION_CODES.ASSIGN,
    ];
    const assignableWrapper = await mountView(DiagnosisAssignmentView);
    expect(assignableWrapper.buttonTexts()).toContain('分派');
  });

  it('shows guidance instead of missing-case error on empty workbench route', async () => {
    mockAccessStore.accessCodes = [M4_PERMISSION_CODES.WORKBENCH_QUERY];

    const wrapper = await mountView(DiagnosisWorkbenchView);

    expect(getDiagnosticWorkbenchMock).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('病例查询');
    expect(wrapper.text()).toContain('请输入病例 ID');
    expect(wrapper.text()).not.toContain('缺少病例 ID');
  });

  it('gates workbench actions by permission', async () => {
    mockRoute.query = {
      caseId: 'CASE-001',
      taskId: 'TASK-001',
    };
    mockAccessStore.accessCodes = [
      M4_PERMISSION_CODES.WORKBENCH_QUERY,
      M4_PERMISSION_CODES.ACCEPT,
      M4_PERMISSION_CODES.REPORT_CREATE,
    ];

    const wrapper = await mountView(DiagnosisWorkbenchView);

    expect(getDiagnosticWorkbenchMock).toHaveBeenCalledWith('CASE-001');
    expect(wrapper.buttonTexts()).toContain('接单');
    expect(wrapper.buttonTexts()).toContain('报告编辑');
    expect(wrapper.buttonTexts()).not.toContain('开始诊断');
  });

  it('shows only review actions for report review role', async () => {
    mockRoute.query = {
      caseId: 'CASE-001',
    };
    mockAccessStore.accessCodes = [M4_PERMISSION_CODES.REPORT_REVIEW];

    const wrapper = await mountView(PathologyReportView);

    expect(wrapper.buttonTexts()).toContain('审核通过');
    expect(wrapper.buttonTexts()).toContain('驳回');
    expect(wrapper.buttonTexts()).not.toContain('创建草稿');
    expect(wrapper.buttonTexts()).not.toContain('保存草稿');
    expect(wrapper.buttonTexts()).not.toContain('提交');
    expect(wrapper.buttonTexts()).not.toContain('签发');
    expect(wrapper.buttonTexts()).not.toContain('发布');
  });

  it('splits revision create and approve sections by permission', async () => {
    mockAccessStore.accessCodes = [M4_PERMISSION_CODES.REVISION_REQUEST_CREATE];
    const createWrapper = await mountView(ReportRevisionView);
    expect(createWrapper.buttonTexts()).toContain('发起修订');
    expect(createWrapper.buttonTexts()).not.toContain('审批通过');
    createWrapper.unmount();

    mockAccessStore.accessCodes = [M4_PERMISSION_CODES.REVISION_APPROVE];
    const reviewWrapper = await mountView(ReportRevisionView);
    expect(reviewWrapper.buttonTexts()).toContain('审批通过');
    expect(reviewWrapper.buttonTexts()).toContain('审批驳回');
    expect(reviewWrapper.buttonTexts()).not.toContain('发起修订');
  });

  it('splits consultation sections by permission', async () => {
    mockAccessStore.accessCodes = [M4_PERMISSION_CODES.CONSULTATION_COMMENT];

    const wrapper = await mountView(ConsultationWorkstationView);

    expect(wrapper.buttonTexts()).toContain('保存意见');
    expect(wrapper.buttonTexts()).not.toContain('发起会诊');
    expect(wrapper.buttonTexts()).not.toContain('完成会诊');
  });

  it('hides the report entry action for tracking-only users', async () => {
    mockRoute.query = {
      caseId: 'CASE-001',
    };
    mockAccessStore.accessCodes = [M4_PERMISSION_CODES.REPORT_TRACKING_QUERY];

    const wrapper = await mountView(ReportTrackingView);

    expect(getReportTrackingMock).toHaveBeenCalledWith('CASE-001');
    expect(wrapper.text()).toContain('病例查询');
    expect(wrapper.buttonTexts()).not.toContain('进入报告');
  });
});
