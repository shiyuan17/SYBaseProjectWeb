import type {
  DiagnosticWorkbenchView,
  PendingMedicalOrderPage,
  PendingDiagnosticTaskPage,
  ReportTrackingView as ReportTrackingData,
} from '../types/doctor-workflow';

import { createApp, defineComponent, h, nextTick } from 'vue';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { M4_PERMISSION_CODES } from '../constants';

const {
  acceptMedicalOrderMock,
  acceptDiagnosticTaskMock,
  assignDiagnosticTaskMock,
  cancelMedicalOrderMock,
  completeMedicalOrderMock,
  createMedicalOrderMock,
  getDiagnosticWorkbenchMock,
  getReportTrackingMock,
  listPendingMedicalOrdersMock,
  listPendingDiagnosticTasksMock,
  mockAccessStore,
  mockRoute,
  mockRouter,
  mockUserStore,
  startDiagnosticTaskMock,
} = vi.hoisted(() => ({
  acceptMedicalOrderMock: vi.fn<
    (orderId: string, data: unknown) => Promise<unknown>
  >(),
  acceptDiagnosticTaskMock: vi.fn<
    (taskId: string, data: unknown) => Promise<unknown>
  >(),
  assignDiagnosticTaskMock: vi.fn<
    (taskId: string, data: unknown) => Promise<unknown>
  >(),
  cancelMedicalOrderMock: vi.fn<
    (orderId: string, data: unknown) => Promise<unknown>
  >(),
  completeMedicalOrderMock: vi.fn<
    (orderId: string, data: unknown) => Promise<unknown>
  >(),
  createMedicalOrderMock: vi.fn<(data: unknown) => Promise<unknown>>(),
  getDiagnosticWorkbenchMock: vi.fn<
    (caseId: string) => Promise<DiagnosticWorkbenchView>
  >(),
  getReportTrackingMock: vi.fn<
    (caseId: string) => Promise<ReportTrackingData>
  >(),
  listPendingMedicalOrdersMock: vi.fn<
    (query: unknown) => Promise<PendingMedicalOrderPage>
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
  mockUserStore: {
    userInfo: {
      realName: '当前分派员',
      userId: 'USER-CURRENT',
    },
  },
  startDiagnosticTaskMock: vi.fn<
    (taskId: string, data: unknown) => Promise<unknown>
  >(),
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
  acceptMedicalOrder: acceptMedicalOrderMock,
  acceptDiagnosticTask: acceptDiagnosticTaskMock,
  approveReportRevisionRequest: vi.fn(),
  assignDiagnosticTask: assignDiagnosticTaskMock,
  cancelMedicalOrder: cancelMedicalOrderMock,
  commentConsultationParticipant: vi.fn(),
  completeMedicalOrder: completeMedicalOrderMock,
  completeConsultation: vi.fn(),
  createConsultation: vi.fn(),
  createMedicalOrder: createMedicalOrderMock,
  createPathologyReport: vi.fn(),
  createReportRevisionRequest: vi.fn(),
  getDiagnosticWorkbench: getDiagnosticWorkbenchMock,
  getReportTracking: getReportTrackingMock,
  listPendingMedicalOrders: listPendingMedicalOrdersMock,
  listPendingDiagnosticTasks: listPendingDiagnosticTasksMock,
  publishPathologyReport: vi.fn(),
  rejectPathologyReport: vi.fn(),
  rejectReportRevisionRequest: vi.fn(),
  reviewPathologyReport: vi.fn(),
  savePathologyReportDraft: vi.fn(),
  signPathologyReport: vi.fn(),
  startDiagnosticTask: startDiagnosticTaskMock,
  submitPathologyReport: vi.fn(),
}));

vi.mock('#/modules/system-management/components/SystemUserSelect.vue', () => ({
  default: defineComponent({
    props: ['modelValue', 'placeholder', 'selectedLabel'],
    emits: ['change', 'update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h('div', { 'data-testid': props.placeholder ?? 'system-user-select' }, [
          h('span', props.selectedLabel ?? ''),
          h(
            'button',
            {
              type: 'button',
              onClick: () => {
                const nextUser = resolveMockUserByPlaceholder(
                  String(props.placeholder ?? ''),
                );
                emit('update:modelValue', nextUser.id);
                emit('change', nextUser);
              },
            },
            `选择${props.placeholder ?? '人员'}`,
          ),
          h(
            'button',
            {
              type: 'button',
              onClick: () => {
                emit('update:modelValue', '');
                emit('change', null);
              },
            },
            `清空${props.placeholder ?? '人员'}`,
          ),
        ]);
    },
  }),
}));

import ConsultationWorkstationView from './ConsultationWorkstationView.vue';
import DiagnosisAssignmentView from './DiagnosisAssignmentView.vue';
import DiagnosisWorkbenchView from './DiagnosisWorkbenchView.vue';
import MedicalOrderWorkbenchView from './MedicalOrderWorkbenchView.vue';
import PathologyReportView from './PathologyReportView.vue';
import ReportRevisionView from './ReportRevisionView.vue';
import ReportTrackingView from './ReportTrackingView.vue';

function resolveMockUserByPlaceholder(placeholder: string) {
  if (placeholder.includes('责任医生')) {
    return {
      id: 'DOC-DIAG',
      name: '责任医生甲',
    };
  }
  if (placeholder.includes('初诊医生')) {
    return {
      id: 'DOC-PRIMARY',
      name: '初诊医生乙',
    };
  }
  if (placeholder.includes('审核医生')) {
    return {
      id: 'DOC-REVIEW',
      name: '审核医生丙',
    };
  }
  return {
    id: 'USER-OPERATOR',
    name: '分派操作员',
  };
}

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
      diagnosisDoctorName: '当前分派员',
      diagnosisDoctorUserId: 'USER-CURRENT',
      id: 'TASK-001',
      primaryDoctorName: '当前分派员',
      primaryDoctorUserId: 'USER-CURRENT',
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

const pendingMedicalOrderPageFixture: PendingMedicalOrderPage = {
  items: [
    {
      acceptedAt: null,
      billingStatus: 'UNBILLED',
      caseId: 'CASE-001',
      completedAt: null,
      doctorName: '当前分派员',
      executorName: null,
      orderContent: '补做特殊染色',
      orderDate: '2026-05-26T09:00:00',
      orderId: 'ORDER-001',
      orderNumber: 'MO-001',
      orderType: 'SPECIAL_STAIN',
      pathologyNo: 'PATH-001',
      patientName: '张三',
      status: 'PENDING',
    },
    {
      acceptedAt: '2026-05-26T09:10:00',
      billingStatus: 'BILLED',
      caseId: 'CASE-002',
      completedAt: null,
      doctorName: '当前分派员',
      executorName: '执行岗甲',
      orderContent: '补做免疫组化',
      orderDate: '2026-05-26T09:05:00',
      orderId: 'ORDER-002',
      orderNumber: 'MO-002',
      orderType: 'IMMUNOHISTOCHEMISTRY',
      pathologyNo: 'PATH-002',
      patientName: '李四',
      status: 'ACCEPTED',
    },
  ],
  page: 1,
  size: 50,
  total: 2,
};

function resetTestState() {
  mockAccessStore.accessCodes = [];
  mockRoute.query = {};
  mockRouter.push.mockReset();
  mockRouter.replace.mockReset();
  acceptMedicalOrderMock.mockReset();
  acceptDiagnosticTaskMock.mockReset();
  assignDiagnosticTaskMock.mockReset();
  cancelMedicalOrderMock.mockReset();
  completeMedicalOrderMock.mockReset();
  createMedicalOrderMock.mockReset();
  listPendingDiagnosticTasksMock.mockReset();
  listPendingMedicalOrdersMock.mockReset();
  getDiagnosticWorkbenchMock.mockReset();
  getReportTrackingMock.mockReset();
  startDiagnosticTaskMock.mockReset();
  mockUserStore.userInfo = {
    realName: '当前分派员',
    userId: 'USER-CURRENT',
  };
  acceptMedicalOrderMock.mockResolvedValue({});
  acceptDiagnosticTaskMock.mockResolvedValue({});
  assignDiagnosticTaskMock.mockResolvedValue({});
  cancelMedicalOrderMock.mockResolvedValue({});
  completeMedicalOrderMock.mockResolvedValue({});
  createMedicalOrderMock.mockResolvedValue({});
  listPendingDiagnosticTasksMock.mockResolvedValue({
    items: [],
    page: 1,
    size: 20,
    total: 0,
  });
  listPendingMedicalOrdersMock.mockResolvedValue(pendingMedicalOrderPageFixture);
  getDiagnosticWorkbenchMock.mockResolvedValue(workbenchFixture);
  getReportTrackingMock.mockResolvedValue(trackingFixture);
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
    clickButton: (text: string, index = 0) => {
      const buttons = Array.from(root.querySelectorAll('button')).filter(
        (item) => item.textContent?.trim() === text,
      );
      const button = buttons[index];
      expect(button).toBeTruthy();
      button?.click();
    },
    buttonTexts: () =>
      Array.from(root.querySelectorAll('button')).map(
        (button) => button.textContent?.trim() ?? '',
      ),
    isButtonDisabled: (text: string, index = 0) => {
      const buttons = Array.from(root.querySelectorAll('button')).filter(
        (item) => item.textContent?.trim() === text,
      );
      const button = buttons[index];
      expect(button).toBeTruthy();
      return button?.hasAttribute('disabled') ?? false;
    },
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
    assignableWrapper.unmount();
  });

  it('defaults operator to current user when opening assign dialog', async () => {
    listPendingDiagnosticTasksMock.mockResolvedValue({
      items: [
        {
          caseId: 'CASE-001',
          diagnosisDoctorName: '既有责任医生',
          diagnosisDoctorUserId: 'DOC-OLD-1',
          id: 'TASK-001',
          primaryDoctorName: '既有初诊医生',
          primaryDoctorUserId: 'DOC-OLD-2',
          reviewerName: '既有审核医生',
          reviewerUserId: 'DOC-OLD-3',
          taskStatus: 'PENDING',
          taskType: 'PRIMARY',
        },
      ],
      page: 1,
      size: 20,
      total: 1,
    });
    mockAccessStore.accessCodes = [M4_PERMISSION_CODES.ASSIGN];

    const wrapper = await mountView(DiagnosisAssignmentView);
    wrapper.clickButton('分派');
    await flushAsyncWork();

    expect(wrapper.text()).toContain('当前分派员');
    expect(wrapper.text()).toContain('既有责任医生');
    expect(wrapper.text()).toContain('既有初诊医生');
    expect(wrapper.text()).toContain('既有审核医生');
    wrapper.unmount();
  });

  it('submits selected doctor and operator ids and names from searchable selects', async () => {
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
    mockAccessStore.accessCodes = [M4_PERMISSION_CODES.ASSIGN];

    const wrapper = await mountView(DiagnosisAssignmentView);
    wrapper.clickButton('分派');
    await flushAsyncWork();

    wrapper.clickButton('选择请选择责任医生');
    wrapper.clickButton('选择请选择初诊医生');
    wrapper.clickButton('选择请选择审核医生');
    wrapper.clickButton('选择请选择操作人');
    await flushAsyncWork();
    wrapper.clickButton('确认分派');
    await flushAsyncWork();

    expect(assignDiagnosticTaskMock).toHaveBeenCalledWith(
      'TASK-001',
      expect.objectContaining({
        diagnosisDoctorName: '责任医生甲',
        diagnosisDoctorUserId: 'DOC-DIAG',
        operatorName: '分派操作员',
        operatorUserId: 'USER-OPERATOR',
        primaryDoctorName: '初诊医生乙',
        primaryDoctorUserId: 'DOC-PRIMARY',
        reviewerName: '审核医生丙',
        reviewerUserId: 'DOC-REVIEW',
      }),
    );
    wrapper.unmount();
  });

  it('blocks submit when a required selected user is cleared', async () => {
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
    mockAccessStore.accessCodes = [M4_PERMISSION_CODES.ASSIGN];

    const wrapper = await mountView(DiagnosisAssignmentView);
    wrapper.clickButton('分派');
    await flushAsyncWork();

    wrapper.clickButton('选择请选择责任医生');
    wrapper.clickButton('选择请选择初诊医生');
    wrapper.clickButton('选择请选择审核医生');
    await flushAsyncWork();
    wrapper.clickButton('清空请选择操作人');
    await flushAsyncWork();
    wrapper.clickButton('确认分派');
    await flushAsyncWork();

    expect(assignDiagnosticTaskMock).not.toHaveBeenCalled();
    wrapper.unmount();
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

  it('defaults workbench operator to current user and allows assigned doctor to accept', async () => {
    mockRoute.query = {
      caseId: 'CASE-001',
      taskId: 'TASK-001',
    };
    mockAccessStore.accessCodes = [
      M4_PERMISSION_CODES.WORKBENCH_QUERY,
      M4_PERMISSION_CODES.ACCEPT,
    ];

    const wrapper = await mountView(DiagnosisWorkbenchView);

    expect(wrapper.isButtonDisabled('接单')).toBe(false);
    wrapper.clickButton('接单');
    await flushAsyncWork();

    expect(acceptDiagnosticTaskMock).toHaveBeenCalledWith(
      'TASK-001',
      expect.objectContaining({
        operatorName: mockUserStore.userInfo.realName,
      }),
    );
    wrapper.unmount();
  });

  it('allows assigned doctor to start diagnosis only in assigned or accepted status', async () => {
    mockRoute.query = {
      caseId: 'CASE-001',
      taskId: 'TASK-001',
    };
    mockAccessStore.accessCodes = [
      M4_PERMISSION_CODES.WORKBENCH_QUERY,
      M4_PERMISSION_CODES.START,
    ];
    getDiagnosticWorkbenchMock.mockResolvedValue({
      ...workbenchFixture,
      diagnosticTasks: [
        {
          ...workbenchFixture.diagnosticTasks[0]!,
          taskStatus: 'ACCEPTED',
        },
      ],
    });

    const wrapper = await mountView(DiagnosisWorkbenchView);

    expect(wrapper.isButtonDisabled('开始诊断')).toBe(false);
    wrapper.clickButton('开始诊断');
    await flushAsyncWork();

    expect(startDiagnosticTaskMock).toHaveBeenCalledWith(
      'TASK-001',
      expect.objectContaining({
        operatorName: mockUserStore.userInfo.realName,
      }),
    );
    wrapper.unmount();
  });

  it('disables accept and start for users who are not assigned to the task', async () => {
    mockRoute.query = {
      caseId: 'CASE-001',
      taskId: 'TASK-001',
    };
    mockAccessStore.accessCodes = [
      M4_PERMISSION_CODES.WORKBENCH_QUERY,
      M4_PERMISSION_CODES.ACCEPT,
      M4_PERMISSION_CODES.START,
    ];
    getDiagnosticWorkbenchMock.mockResolvedValue({
      ...workbenchFixture,
      diagnosticTasks: [
        {
          ...workbenchFixture.diagnosticTasks[0]!,
          diagnosisDoctorName: 'Other Diagnosis Doctor',
          diagnosisDoctorUserId: 'USER-OTHER-DIAG',
          primaryDoctorName: 'Other Primary Doctor',
          primaryDoctorUserId: 'USER-OTHER-PRIMARY',
          taskStatus: 'ASSIGNED',
        },
      ],
    });

    const wrapper = await mountView(DiagnosisWorkbenchView);

    expect(wrapper.isButtonDisabled('接单')).toBe(true);
    expect(wrapper.isButtonDisabled('开始诊断')).toBe(true);
    expect(wrapper.text()).toContain('Other Diagnosis Doctor / Other Primary Doctor');

    wrapper.clickButton('接单');
    wrapper.clickButton('开始诊断');
    await flushAsyncWork();

    expect(acceptDiagnosticTaskMock).not.toHaveBeenCalled();
    expect(startDiagnosticTaskMock).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('opens medical order workstation from diagnosis workbench when execution page is available', async () => {
    mockRoute.query = {
      caseId: 'CASE-001',
      taskId: 'TASK-001',
    };
    mockAccessStore.accessCodes = [
      M4_PERMISSION_CODES.WORKBENCH_QUERY,
      M4_PERMISSION_CODES.MEDICAL_ORDER_CREATE,
      M4_PERMISSION_CODES.MEDICAL_ORDER_QUERY,
    ];

    const wrapper = await mountView(DiagnosisWorkbenchView);

    expect(wrapper.buttonTexts()).toContain('新增医嘱');
    expect(wrapper.buttonTexts()).toContain('进入医嘱工作台');

    wrapper.clickButton('进入医嘱工作台');
    await flushAsyncWork();

    expect(mockRouter.push).toHaveBeenCalledWith({
      path: '/doctor-workflow/medical-orders',
      query: {
        pathologyNo: 'PATH-001',
      },
    });
    wrapper.unmount();
  });

  it('cancels pending medical order from diagnosis workbench', async () => {
    mockRoute.query = {
      caseId: 'CASE-001',
      taskId: 'TASK-001',
    };
    mockAccessStore.accessCodes = [
      M4_PERMISSION_CODES.WORKBENCH_QUERY,
      M4_PERMISSION_CODES.MEDICAL_ORDER_CANCEL,
    ];
    getDiagnosticWorkbenchMock.mockResolvedValue({
      ...workbenchFixture,
      medicalOrders: [
        {
          orderId: 'ORDER-001',
          orderNumber: 'MO-001',
          orderType: 'SPECIAL_STAIN',
          status: 'PENDING',
        },
      ],
    });

    const wrapper = await mountView(DiagnosisWorkbenchView);

    expect(wrapper.buttonTexts()).toContain('取消');
    wrapper.clickButton('取消');
    await flushAsyncWork();

    expect(cancelMedicalOrderMock).toHaveBeenCalledWith(
      'ORDER-001',
      expect.objectContaining({
        operatorName: mockUserStore.userInfo.realName,
        operatorUserId: mockUserStore.userInfo.userId,
      }),
    );
    wrapper.unmount();
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
    wrapper.unmount();
  });

  it('opens medical order workstation and cancels pending order from tracking view', async () => {
    mockRoute.query = {
      caseId: 'CASE-001',
    };
    mockAccessStore.accessCodes = [
      M4_PERMISSION_CODES.REPORT_TRACKING_QUERY,
      M4_PERMISSION_CODES.MEDICAL_ORDER_QUERY,
      M4_PERMISSION_CODES.MEDICAL_ORDER_CANCEL,
    ];
    getReportTrackingMock.mockResolvedValue({
      ...trackingFixture,
      medicalOrders: [
        {
          orderId: 'ORDER-003',
          orderNumber: 'MO-003',
          orderType: 'SPECIAL_STAIN',
          pathologyNo: 'PATH-001',
          status: 'PENDING',
        },
      ],
    });

    const wrapper = await mountView(ReportTrackingView);

    expect(wrapper.buttonTexts()).toContain('进入医嘱工作台');
    wrapper.clickButton('进入医嘱工作台');
    await flushAsyncWork();

    expect(mockRouter.push).toHaveBeenCalledWith({
      path: '/doctor-workflow/medical-orders',
      query: {
        pathologyNo: 'PATH-001',
      },
    });

    wrapper.clickButton('取消');
    await flushAsyncWork();

    expect(cancelMedicalOrderMock).toHaveBeenCalledWith(
      'ORDER-003',
      expect.objectContaining({
        operatorName: mockUserStore.userInfo.realName,
        operatorUserId: mockUserStore.userInfo.userId,
      }),
    );
    wrapper.unmount();
  });

  it('accepts pending medical order in medical order workstation', async () => {
    mockAccessStore.accessCodes = [
      M4_PERMISSION_CODES.MEDICAL_ORDER_QUERY,
      M4_PERMISSION_CODES.MEDICAL_ORDER_ACCEPT,
    ];

    const wrapper = await mountView(MedicalOrderWorkbenchView);

    expect(listPendingMedicalOrdersMock).toHaveBeenCalledWith({
      page: 1,
      pathologyNo: undefined,
      size: 50,
      status: undefined,
    });
    expect(wrapper.buttonTexts()).toContain('接收');
    expect(wrapper.isButtonDisabled('接收')).toBe(false);

    wrapper.clickButton('接收');
    await flushAsyncWork();

    expect(acceptMedicalOrderMock).toHaveBeenCalledWith(
      'ORDER-001',
      expect.objectContaining({
        operatorName: mockUserStore.userInfo.realName,
        operatorUserId: mockUserStore.userInfo.userId,
      }),
    );
    wrapper.unmount();
  });

  it('completes accepted medical order in medical order workstation', async () => {
    mockAccessStore.accessCodes = [
      M4_PERMISSION_CODES.MEDICAL_ORDER_QUERY,
      M4_PERMISSION_CODES.MEDICAL_ORDER_COMPLETE,
    ];
    listPendingMedicalOrdersMock.mockResolvedValue({
      ...pendingMedicalOrderPageFixture,
      items: [pendingMedicalOrderPageFixture.items[1]!],
      total: 1,
    });

    const wrapper = await mountView(MedicalOrderWorkbenchView);

    expect(wrapper.buttonTexts()).toContain('完成');
    expect(wrapper.isButtonDisabled('完成')).toBe(false);

    wrapper.clickButton('完成');
    await flushAsyncWork();

    expect(completeMedicalOrderMock).toHaveBeenCalledWith(
      'ORDER-002',
      expect.objectContaining({
        operatorName: mockUserStore.userInfo.realName,
        operatorUserId: mockUserStore.userInfo.userId,
      }),
    );
    wrapper.unmount();
  });

  it('cancels pending medical order in medical order workstation', async () => {
    mockAccessStore.accessCodes = [
      M4_PERMISSION_CODES.MEDICAL_ORDER_QUERY,
      M4_PERMISSION_CODES.MEDICAL_ORDER_CANCEL,
    ];
    listPendingMedicalOrdersMock.mockResolvedValue({
      ...pendingMedicalOrderPageFixture,
      items: [pendingMedicalOrderPageFixture.items[0]!],
      total: 1,
    });

    const wrapper = await mountView(MedicalOrderWorkbenchView);

    expect(wrapper.buttonTexts()).toContain('取消');
    expect(wrapper.isButtonDisabled('取消')).toBe(false);

    wrapper.clickButton('取消');
    await flushAsyncWork();

    expect(cancelMedicalOrderMock).toHaveBeenCalledWith(
      'ORDER-001',
      expect.objectContaining({
        operatorName: mockUserStore.userInfo.realName,
        operatorUserId: mockUserStore.userInfo.userId,
      }),
    );
    wrapper.unmount();
  });
});
