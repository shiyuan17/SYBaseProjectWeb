import type {
  DiagnosticWorkbenchView,
  PendingDiagnosticTaskPage,
  PendingMedicalOrderPage,
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
  listMedicalOrderDictsMock,
  listMedicalOrderPackagesPageMock,
  listSystemUsersMock,
  listPendingMedicalOrdersMock,
  listPendingDiagnosticTasksMock,
  mockAccessStore,
  mockRoute,
  mockRouter,
  mockUserStore,
  startDiagnosticTaskMock,
} = vi.hoisted(() => ({
  acceptMedicalOrderMock:
    vi.fn<(orderId: string, data: unknown) => Promise<unknown>>(),
  acceptDiagnosticTaskMock:
    vi.fn<(taskId: string, data: unknown) => Promise<unknown>>(),
  assignDiagnosticTaskMock:
    vi.fn<(taskId: string, data: unknown) => Promise<unknown>>(),
  cancelMedicalOrderMock:
    vi.fn<(orderId: string, data: unknown) => Promise<unknown>>(),
  completeMedicalOrderMock:
    vi.fn<(orderId: string, data: unknown) => Promise<unknown>>(),
  createMedicalOrderMock: vi.fn<(data: unknown) => Promise<unknown>>(),
  getDiagnosticWorkbenchMock:
    vi.fn<(caseId: string) => Promise<DiagnosticWorkbenchView>>(),
  getReportTrackingMock:
    vi.fn<(caseId: string) => Promise<ReportTrackingData>>(),
  listMedicalOrderDictsMock: vi.fn<() => Promise<unknown[]>>(),
  listMedicalOrderPackagesPageMock:
    vi.fn<(query: unknown) => Promise<unknown>>(),
  listSystemUsersMock: vi.fn<(query: unknown) => Promise<unknown>>(),
  listPendingMedicalOrdersMock:
    vi.fn<(query: unknown) => Promise<PendingMedicalOrderPage>>(),
  listPendingDiagnosticTasksMock:
    vi.fn<(query: unknown) => Promise<PendingDiagnosticTaskPage>>(),
  mockAccessStore: {
    accessCodes: [] as string[],
  },
  mockRoute: {
    name: '',
    path: '',
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
  listMedicalOrderDicts: listMedicalOrderDictsMock,
  listMedicalOrderPackagesPage: listMedicalOrderPackagesPageMock,
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

vi.mock('#/modules/system-management/api/system-management-service', () => ({
  listSystemUsers: listSystemUsersMock,
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
  chargeItems: [],
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
  historicalPathologies: [],
  medicalOrders: [],
  pacsExaminations: [],
  pathologyNo: 'PATH-001',
  patientName: '张三',
  recentEvents: [],
  remarkSections: [],
  reportTraces: [],
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

const systemUsersFixture = {
  items: [
    {
      avatar: null,
      createdAt: '2026-05-26T09:00:00',
      departmentId: null,
      departmentName: null,
      email: null,
      enabled: true,
      id: 'DOC-PRIMARY',
      jobNo: null,
      lastLoginAt: null,
      lastLoginDevice: null,
      lastLoginIp: null,
      loginName: 'primary-doctor',
      loginTagCode: null,
      name: '初诊医生乙',
      phone: null,
      roles: [],
      titleName: null,
      updatedAt: '2026-05-26T09:00:00',
      userCode: null,
    },
    {
      avatar: null,
      createdAt: '2026-05-26T09:00:00',
      departmentId: null,
      departmentName: null,
      email: null,
      enabled: true,
      id: 'DOC-REVIEW',
      jobNo: null,
      lastLoginAt: null,
      lastLoginDevice: null,
      lastLoginIp: null,
      loginName: 'review-doctor',
      loginTagCode: null,
      name: '审核医生丙',
      phone: null,
      roles: [],
      titleName: null,
      updatedAt: '2026-05-26T09:00:00',
      userCode: null,
    },
  ],
  page: 1,
  size: 200,
  total: 2,
};

function resetTestState() {
  mockAccessStore.accessCodes = [];
  mockRoute.name = '';
  mockRoute.path = '';
  mockRoute.query = {};
  mockRouter.push.mockReset();
  mockRouter.replace.mockReset();
  acceptMedicalOrderMock.mockReset();
  acceptDiagnosticTaskMock.mockReset();
  assignDiagnosticTaskMock.mockReset();
  cancelMedicalOrderMock.mockReset();
  completeMedicalOrderMock.mockReset();
  createMedicalOrderMock.mockReset();
  listMedicalOrderDictsMock.mockReset();
  listMedicalOrderPackagesPageMock.mockReset();
  listSystemUsersMock.mockReset();
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
  listMedicalOrderDictsMock.mockResolvedValue([]);
  listMedicalOrderPackagesPageMock.mockResolvedValue({
    items: [],
    page: 1,
    size: 100,
    total: 0,
  });
  listSystemUsersMock.mockResolvedValue(systemUsersFixture);
  listPendingDiagnosticTasksMock.mockResolvedValue({
    items: [],
    page: 1,
    size: 20,
    total: 0,
  });
  listPendingMedicalOrdersMock.mockResolvedValue(
    pendingMedicalOrderPageFixture,
  );
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
  switch (component) {
    case DiagnosisWorkbenchView: {
      mockRoute.name = 'DiagnosisWorkbench';
      mockRoute.path = '/doctor-workflow/workbench';
      break;
    }
    case PathologyReportView: {
      mockRoute.name = 'PathologyReport';
      mockRoute.path = '/doctor-workflow/report';
      break;
    }
    case ReportTrackingView: {
      mockRoute.name = 'ReportTracking';
      mockRoute.path = '/doctor-workflow/tracking';
      break;
    }
  }

  const root = document.createElement('div');
  document.body.append(root);

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
      const buttons = [...root.querySelectorAll('button')].filter(
        (item) => item.textContent?.trim() === text,
      );
      const button = buttons[index];
      expect(button).toBeTruthy();
      button?.click();
    },
    buttonTexts: () =>
      [...root.querySelectorAll('button')].map(
        (button) => button.textContent?.trim() ?? '',
      ),
    clickCheckbox: (index: number) => {
      const checkboxes = [
        ...root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
      ];
      const checkbox = checkboxes[index];
      expect(checkbox).toBeTruthy();
      checkbox?.click();
    },
    isButtonDisabled: (text: string, index = 0) => {
      const buttons = [...root.querySelectorAll('button')].filter(
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

  it('shows batch slice actions only for users with assign permission', async () => {
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
    expect(readOnlyWrapper.text()).toContain('初诊阅片');
    expect(readOnlyWrapper.text()).toContain('签发阅片');
    expect(readOnlyWrapper.text()).toContain('报告状态');
    expect(readOnlyWrapper.text()).toContain('送检标本');
    expect(readOnlyWrapper.buttonTexts()).not.toContain('初步分片');
    expect(readOnlyWrapper.buttonTexts()).not.toContain('签发分片');
    readOnlyWrapper.unmount();

    mockAccessStore.accessCodes = [
      M4_PERMISSION_CODES.DIAG_TASK_QUERY,
      M4_PERMISSION_CODES.ASSIGN,
    ];
    const assignableWrapper = await mountView(DiagnosisAssignmentView);
    expect(assignableWrapper.text()).toContain('初诊医生乙');
    expect(assignableWrapper.buttonTexts()).toContain('初步分片');
    expect(assignableWrapper.buttonTexts()).toContain('签发分片');
    expect(assignableWrapper.isButtonDisabled('初步分片')).toBe(true);
    assignableWrapper.unmount();
  });

  it('renders assignment application type and specimen without English fallbacks', async () => {
    listPendingDiagnosticTasksMock.mockResolvedValue({
      items: [
        {
          applicationType: 'routine',
          caseId: 'CASE-001',
          id: 'TASK-001',
          remarks: 'Auto created staining comment',
          specimenName: null,
          taskStatus: 'PENDING',
          taskType: 'PRIMARY',
        },
      ],
      page: 1,
      size: 20,
      total: 1,
    });

    const wrapper = await mountView(DiagnosisAssignmentView);

    expect(wrapper.text()).toContain('常规');
    expect(wrapper.text()).not.toContain('routine');
    expect(wrapper.text()).not.toContain('PRIMARY');
    expect(wrapper.text()).not.toContain('Auto created staining comment');
    wrapper.unmount();
  });

  it('assigns selected tasks to selected primary slice doctor', async () => {
    listPendingDiagnosticTasksMock.mockResolvedValue({
      items: [
        {
          caseId: 'CASE-001',
          diagnosisDoctorName: '责任医生甲',
          diagnosisDoctorUserId: 'DOC-DIAG',
          id: 'TASK-001',
          primaryDoctorName: '既有初诊医生',
          primaryDoctorUserId: 'DOC-OLD-2',
          reviewerName: '审核医生丙',
          reviewerUserId: 'DOC-REVIEW',
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
    wrapper.clickButton('选择');
    wrapper.clickCheckbox(1);
    await flushAsyncWork();
    wrapper.clickButton('初步分片');
    await flushAsyncWork();

    expect(assignDiagnosticTaskMock).toHaveBeenCalledWith(
      'TASK-001',
      expect.objectContaining({
        diagnosisDoctorName: '责任医生甲',
        diagnosisDoctorUserId: 'DOC-DIAG',
        primaryDoctorName: '初诊医生乙',
        primaryDoctorUserId: 'DOC-PRIMARY',
        reviewerName: '审核医生丙',
        reviewerUserId: 'DOC-REVIEW',
      }),
    );
    expect(assignDiagnosticTaskMock.mock.calls[0]?.[1]).not.toHaveProperty(
      'operatorName',
    );
    expect(assignDiagnosticTaskMock.mock.calls[0]?.[1]).not.toHaveProperty(
      'operatorUserId',
    );
    expect(listPendingDiagnosticTasksMock).toHaveBeenCalledTimes(2);
    expect(wrapper.isButtonDisabled('初步分片')).toBe(true);
    wrapper.unmount();
  });

  it('assigns selected tasks to selected reviewer slice doctor', async () => {
    listPendingDiagnosticTasksMock.mockResolvedValue({
      items: [
        {
          caseId: 'CASE-001',
          diagnosisDoctorName: '责任医生甲',
          diagnosisDoctorUserId: 'DOC-DIAG',
          id: 'TASK-001',
          primaryDoctorName: '初诊医生乙',
          primaryDoctorUserId: 'DOC-PRIMARY',
          reviewerName: '既有审核医生',
          reviewerUserId: 'DOC-OLD-REVIEW',
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
    wrapper.clickButton('选择', 1);
    wrapper.clickCheckbox(1);
    await flushAsyncWork();
    wrapper.clickButton('签发分片');
    await flushAsyncWork();

    expect(assignDiagnosticTaskMock).toHaveBeenCalledWith(
      'TASK-001',
      expect.objectContaining({
        diagnosisDoctorName: '责任医生甲',
        diagnosisDoctorUserId: 'DOC-DIAG',
        primaryDoctorName: '初诊医生乙',
        primaryDoctorUserId: 'DOC-PRIMARY',
        reviewerName: '审核医生丙',
        reviewerUserId: 'DOC-REVIEW',
      }),
    );
    expect(assignDiagnosticTaskMock.mock.calls[0]?.[1]).not.toHaveProperty(
      'operatorName',
    );
    expect(assignDiagnosticTaskMock.mock.calls[0]?.[1]).not.toHaveProperty(
      'operatorUserId',
    );
    wrapper.unmount();
  });

  it('fills required assign fields from selected doctor when task has no doctors', async () => {
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
    wrapper.clickButton('选择');
    wrapper.clickCheckbox(1);
    await flushAsyncWork();
    wrapper.clickButton('初步分片');
    await flushAsyncWork();

    expect(assignDiagnosticTaskMock).toHaveBeenCalledWith(
      'TASK-001',
      expect.objectContaining({
        diagnosisDoctorName: '初诊医生乙',
        diagnosisDoctorUserId: 'DOC-PRIMARY',
        primaryDoctorName: '初诊医生乙',
        primaryDoctorUserId: 'DOC-PRIMARY',
        reviewerName: '初诊医生乙',
        reviewerUserId: 'DOC-PRIMARY',
      }),
    );
    expect(listPendingDiagnosticTasksMock).toHaveBeenCalledTimes(2);
    wrapper.unmount();
  });

  it('shows queue-first guidance instead of missing-case error on empty workbench route', async () => {
    mockAccessStore.accessCodes = [M4_PERMISSION_CODES.WORKBENCH_QUERY];

    const wrapper = await mountView(DiagnosisWorkbenchView);

    expect(getDiagnosticWorkbenchMock).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('诊断病例队列');
    expect(wrapper.text()).toContain('请先从左侧选择一个病例');
    expect(wrapper.text()).not.toContain('缺少病例 ID');
    wrapper.unmount();
  });

  it('hides quick operation actions from diagnosis workbench case context', async () => {
    mockRoute.query = {
      caseId: 'CASE-001',
      taskId: 'TASK-001',
    };
    mockAccessStore.accessCodes = [
      M4_PERMISSION_CODES.WORKBENCH_QUERY,
      M4_PERMISSION_CODES.ACCEPT,
      M4_PERMISSION_CODES.START,
      M4_PERMISSION_CODES.REPORT_CREATE,
      M4_PERMISSION_CODES.MEDICAL_ORDER_CREATE,
      M4_PERMISSION_CODES.MEDICAL_ORDER_QUERY,
    ];

    const wrapper = await mountView(DiagnosisWorkbenchView);

    expect(getDiagnosticWorkbenchMock).toHaveBeenCalledWith('CASE-001');
    expect(wrapper.text()).not.toContain('快捷操作');
    expect(wrapper.buttonTexts()).not.toContain('接单');
    expect(wrapper.buttonTexts()).not.toContain('开始诊断');
    expect(wrapper.buttonTexts()).not.toContain('报告编辑');
    expect(wrapper.buttonTexts()).not.toContain('新增医嘱');
    expect(wrapper.buttonTexts()).not.toContain('医嘱工作台');
    expect(acceptDiagnosticTaskMock).not.toHaveBeenCalled();
    expect(startDiagnosticTaskMock).not.toHaveBeenCalled();
    expect(createMedicalOrderMock).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('hides pending medical order summary from diagnosis workbench', async () => {
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

    expect(wrapper.text()).not.toContain('待处理医嘱摘要');
    expect(wrapper.text()).not.toContain(
      '仍保留当前工作站内直接取消待处理医嘱的快捷入口',
    );
    expect(wrapper.buttonTexts()).not.toContain('取消');
    expect(cancelMedicalOrderMock).not.toHaveBeenCalled();
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
          orderDate: '2026-05-26T10:15:30',
          orderNumber: 'MO-003',
          orderType: 'SPECIAL_STAIN',
          pathologyNo: 'PATH-001',
          status: 'PENDING',
        },
      ],
    });

    const wrapper = await mountView(ReportTrackingView);

    expect(wrapper.buttonTexts()).toContain('进入医嘱工作台');
    expect(wrapper.text()).toContain('医嘱时间');
    expect(wrapper.text()).toContain('2026-05-26 10:15:30');
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
        remarks: '从报告追踪页取消医嘱',
      }),
    );
    expect(cancelMedicalOrderMock.mock.calls[0]?.[1]).not.toHaveProperty(
      'operatorName',
    );
    expect(cancelMedicalOrderMock.mock.calls[0]?.[1]).not.toHaveProperty(
      'operatorUserId',
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
    expect(wrapper.text()).toContain('2026-05-26 09:00:00');
    expect(wrapper.buttonTexts()).toContain('接收');
    expect(wrapper.isButtonDisabled('接收')).toBe(false);

    wrapper.clickButton('接收');
    await flushAsyncWork();

    expect(acceptMedicalOrderMock).toHaveBeenCalledWith(
      'ORDER-001',
      expect.objectContaining({
        remarks: undefined,
        terminalCode: undefined,
      }),
    );
    expect(acceptMedicalOrderMock.mock.calls[0]?.[1]).not.toHaveProperty(
      'operatorName',
    );
    expect(acceptMedicalOrderMock.mock.calls[0]?.[1]).not.toHaveProperty(
      'operatorUserId',
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
        remarks: undefined,
        terminalCode: undefined,
      }),
    );
    expect(completeMedicalOrderMock.mock.calls[0]?.[1]).not.toHaveProperty(
      'operatorName',
    );
    expect(completeMedicalOrderMock.mock.calls[0]?.[1]).not.toHaveProperty(
      'operatorUserId',
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
        remarks: undefined,
        terminalCode: undefined,
      }),
    );
    expect(cancelMedicalOrderMock.mock.calls[0]?.[1]).not.toHaveProperty(
      'operatorName',
    );
    expect(cancelMedicalOrderMock.mock.calls[0]?.[1]).not.toHaveProperty(
      'operatorUserId',
    );
    wrapper.unmount();
  });
});
