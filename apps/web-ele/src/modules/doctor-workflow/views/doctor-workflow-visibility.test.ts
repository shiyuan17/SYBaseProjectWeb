import type {
  CaseLifecycleTrackingView,
  DiagnosticWorkbenchView,
  PendingDiagnosticTaskPage,
  PendingMedicalOrderPage,
} from '../types/doctor-workflow';

import { createApp, defineComponent, h, nextTick } from 'vue';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { M4_PERMISSION_CODES } from '../constants';

const {
  acceptMedicalOrderMock,
  acceptDiagnosticTaskMock,
  approveReportRevisionRequestMock,
  assignDiagnosticTaskMock,
  cancelMedicalOrderMock,
  commentConsultationParticipantMock,
  completeMedicalOrderMock,
  completeConsultationMock,
  createConsultationMock,
  createMedicalOrderMock,
  createReportRevisionRequestMock,
  getCaseLifecycleTrackingMock,
  getDiagnosticWorkbenchMock,
  issueFormalReportVersionsMock,
  listCaseReportVersionsMock,
  listMedicalOrderDictsMock,
  listMedicalOrderPackagesPageMock,
  listSystemUsersMock,
  listPendingMedicalOrdersMock,
  listPendingDiagnosticTasksMock,
  mockAccessStore,
  mockRoute,
  mockRouter,
  mockUserStore,
  printFormalReportVersionsMock,
  rejectReportRevisionRequestMock,
  recallFormalReportVersionsMock,
  startDiagnosticTaskMock,
} = vi.hoisted(() => ({
  acceptMedicalOrderMock:
    vi.fn<(orderId: string, data: unknown) => Promise<unknown>>(),
  acceptDiagnosticTaskMock:
    vi.fn<(taskId: string, data: unknown) => Promise<unknown>>(),
  approveReportRevisionRequestMock:
    vi.fn<(requestId: string, data: unknown) => Promise<unknown>>(),
  assignDiagnosticTaskMock:
    vi.fn<(taskId: string, data: unknown) => Promise<unknown>>(),
  cancelMedicalOrderMock:
    vi.fn<(orderId: string, data: unknown) => Promise<unknown>>(),
  commentConsultationParticipantMock:
    vi.fn<
      (
        consultationId: string,
        participantId: string,
        data: unknown,
      ) => Promise<unknown>
    >(),
  completeMedicalOrderMock:
    vi.fn<(orderId: string, data: unknown) => Promise<unknown>>(),
  completeConsultationMock:
    vi.fn<(consultationId: string, data: unknown) => Promise<unknown>>(),
  createConsultationMock: vi.fn<(data: unknown) => Promise<unknown>>(),
  createMedicalOrderMock: vi.fn<(data: unknown) => Promise<unknown>>(),
  createReportRevisionRequestMock: vi.fn<(data: unknown) => Promise<unknown>>(),
  getCaseLifecycleTrackingMock:
    vi.fn<(caseId: string) => Promise<CaseLifecycleTrackingView>>(),
  getDiagnosticWorkbenchMock:
    vi.fn<(caseId: string) => Promise<DiagnosticWorkbenchView>>(),
  issueFormalReportVersionsMock:
    vi.fn<(payload: unknown) => Promise<unknown>>(),
  listCaseReportVersionsMock: vi.fn<(caseId: string) => Promise<unknown[]>>(),
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
  printFormalReportVersionsMock:
    vi.fn<(payload: unknown) => Promise<unknown>>(),
  rejectReportRevisionRequestMock:
    vi.fn<(requestId: string, data: unknown) => Promise<unknown>>(),
  recallFormalReportVersionsMock:
    vi.fn<(payload: unknown) => Promise<unknown>>(),
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
  approveReportRevisionRequest: approveReportRevisionRequestMock,
  assignDiagnosticTask: assignDiagnosticTaskMock,
  cancelMedicalOrder: cancelMedicalOrderMock,
  commentConsultationParticipant: commentConsultationParticipantMock,
  completeMedicalOrder: completeMedicalOrderMock,
  completeConsultation: completeConsultationMock,
  createConsultation: createConsultationMock,
  createMedicalOrder: createMedicalOrderMock,
  createPathologyReport: vi.fn(),
  createReportRevisionRequest: createReportRevisionRequestMock,
  getCaseLifecycleTracking: getCaseLifecycleTrackingMock,
  getDiagnosticWorkbench: getDiagnosticWorkbenchMock,
  issueFormalReportVersions: issueFormalReportVersionsMock,
  listCaseReportVersions: listCaseReportVersionsMock,
  listMedicalOrderDicts: listMedicalOrderDictsMock,
  listMedicalOrderPackagesPage: listMedicalOrderPackagesPageMock,
  listPendingMedicalOrders: listPendingMedicalOrdersMock,
  listPendingDiagnosticTasks: listPendingDiagnosticTasksMock,
  publishPathologyReport: vi.fn(),
  printFormalReportVersions: printFormalReportVersionsMock,
  recallFormalReportVersions: recallFormalReportVersionsMock,
  rejectPathologyReport: vi.fn(),
  rejectReportRevisionRequest: rejectReportRevisionRequestMock,
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
  consultations: [
    {
      completedAt: null,
      consultationId: 'CONSULT-001',
      consultationType: 'MDT',
      hostName: '主持人甲',
      opinion: null,
      participantCount: 2,
      participants: [
        {
          commentedAt: null,
          draftedByName: null,
          opinion: null,
          participantId: 'CP-001',
          participantName: '当前分派员',
          participantRole: 'MEMBER',
          participantUserId: 'USER-CURRENT',
        },
        {
          commentedAt: '2026-06-15T10:30:00',
          draftedByName: '主持人甲',
          opinion: '已补充意见',
          participantId: 'CP-002',
          participantName: '会诊医生乙',
          participantRole: 'MEMBER',
          participantUserId: 'USER-OTHER',
        },
      ],
      requestedAt: '2026-06-15T09:30:00',
      requestedByName: '申请医生甲',
      status: 'IN_PROGRESS',
    },
  ],
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
  revisions: [
    {
      approvedVersionNo: null,
      currentVersionNo: 1,
      rejectReason: null,
      reportId: 'REPORT-001',
      requestId: 'REVISION-001',
      requestedAt: '2026-06-15T09:00:00',
      requestedByName: '申请医生甲',
      requestReason: '补充镜下诊断描述',
      requestStatus: 'PENDING',
      reviewedAt: null,
      reviewedByName: null,
    },
  ],
  slides: [],
  specimens: [],
};

const consultationWorkbenchBatchFixture: DiagnosticWorkbenchView = {
  ...workbenchFixture,
  consultations: [
    workbenchFixture.consultations[0]!,
    {
      completedAt: '2026-06-15T11:00:00',
      consultationId: 'CONSULT-002',
      consultationType: 'MDT',
      hostName: '主持人乙',
      opinion: '已完成主持意见',
      participantCount: 1,
      participants: [
        {
          commentedAt: '2026-06-15T10:45:00',
          draftedByName: '会诊医生丙',
          opinion: '已给出意见',
          participantId: 'CP-003',
          participantName: '会诊医生丙',
          participantRole: 'MEMBER',
          participantUserId: 'USER-OTHER-2',
        },
      ],
      requestedAt: '2026-06-15T10:00:00',
      requestedByName: '申请医生乙',
      status: 'COMPLETED',
    },
    {
      completedAt: null,
      consultationId: 'CONSULT-003',
      consultationType: 'MDT',
      hostName: '主持人丙',
      opinion: null,
      participantCount: 1,
      participants: [
        {
          commentedAt: null,
          draftedByName: null,
          opinion: null,
          participantId: 'CP-004',
          participantName: '其他医生',
          participantRole: 'MEMBER',
          participantUserId: 'USER-NOT-CURRENT',
        },
      ],
      requestedAt: '2026-06-15T10:20:00',
      requestedByName: '申请医生丙',
      status: 'IN_PROGRESS',
    },
  ],
};

const trackingFixture: CaseLifecycleTrackingView = {
  applicationForm: {
    applicantDoctorName: '送检医生甲',
    applicationDate: '2026-06-15T08:00:00',
    archiveLocation: null,
    archiveStatus: null,
    imageUrl: null,
    remarks: null,
  },
  caseSummary: {
    applicationDate: '2026-06-15T08:00:00',
    applicationNo: 'APP-001',
    applicationType: 'ROUTINE',
    caseId: 'CASE-001',
    caseStatus: 'IN_DIAGNOSIS',
    currentStage: 'SIGNED',
    hasPendingRevision: false,
    pathologyNo: 'PATH-001',
    patientAge: '35岁',
    patientGender: '男',
    patientName: '张三',
    submittingDepartmentName: '外科',
    submittingDoctorName: '送检医生甲',
  },
  overallTimeline: [],
  reportLifecycle: {
    consultations: [],
    currentReport: {
      finalDiagnosis: '最终诊断',
      reportId: 'REPORT-001',
      reportNo: 'RPT-001',
      reportStatus: 'SIGNED',
      versionNo: 1,
    },
    diagnosticTasks: [],
    medicalOrders: [],
    revisions: [],
    versions: [],
  },
  specimens: [],
};

const formalReportVersionsFixture = [
  {
    deliveryStatus: 'PENDING',
    printStatus: 'UNPRINTED',
    reportId: 'REPORT-001',
    reportNo: 'RPT-001',
    reviewedAt: null,
    signedAt: '2026-06-15T10:00:00',
    submittedAt: '2026-06-15T09:30:00',
    versionId: 'RV-1',
    versionNo: 1,
    versionStatus: 'SUBMITTED',
  },
  {
    deliveryStatus: 'PENDING',
    printStatus: 'UNPRINTED',
    reportId: 'REPORT-001',
    reportNo: 'RPT-001',
    reviewedAt: '2026-06-15T09:50:00',
    signedAt: null,
    submittedAt: '2026-06-15T09:30:00',
    versionId: 'RV-2',
    versionNo: 2,
    versionStatus: 'REVIEWED',
  },
  {
    deliveryStatus: 'ISSUED',
    issuedAt: '2026-06-15T11:00:00',
    printStatus: 'PRINTED',
    printedAt: '2026-06-15T10:30:00',
    publishedAt: '2026-06-15T10:40:00',
    recalledAt: null,
    reportId: 'REPORT-001',
    reportNo: 'RPT-001',
    reviewedAt: '2026-06-15T09:50:00',
    signedAt: '2026-06-15T10:00:00',
    submittedAt: '2026-06-15T09:30:00',
    versionId: 'RV-3',
    versionNo: 3,
    versionStatus: 'PUBLISHED',
  },
];

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
  approveReportRevisionRequestMock.mockReset();
  assignDiagnosticTaskMock.mockReset();
  cancelMedicalOrderMock.mockReset();
  commentConsultationParticipantMock.mockReset();
  completeMedicalOrderMock.mockReset();
  completeConsultationMock.mockReset();
  createConsultationMock.mockReset();
  createMedicalOrderMock.mockReset();
  createReportRevisionRequestMock.mockReset();
  issueFormalReportVersionsMock.mockReset();
  listCaseReportVersionsMock.mockReset();
  listMedicalOrderDictsMock.mockReset();
  listMedicalOrderPackagesPageMock.mockReset();
  listSystemUsersMock.mockReset();
  listPendingDiagnosticTasksMock.mockReset();
  listPendingMedicalOrdersMock.mockReset();
  getDiagnosticWorkbenchMock.mockReset();
  getCaseLifecycleTrackingMock.mockReset();
  startDiagnosticTaskMock.mockReset();
  mockUserStore.userInfo = {
    realName: '当前分派员',
    userId: 'USER-CURRENT',
  };
  printFormalReportVersionsMock.mockReset();
  rejectReportRevisionRequestMock.mockReset();
  recallFormalReportVersionsMock.mockReset();
  acceptMedicalOrderMock.mockResolvedValue({});
  acceptDiagnosticTaskMock.mockResolvedValue({});
  approveReportRevisionRequestMock.mockResolvedValue({
    approvedVersionNo: 2,
    caseId: 'CASE-001',
    reportId: 'REPORT-001',
    requestId: 'REVISION-001',
    requestStatus: 'APPROVED',
  });
  assignDiagnosticTaskMock.mockResolvedValue({});
  cancelMedicalOrderMock.mockResolvedValue({});
  commentConsultationParticipantMock.mockResolvedValue({
    caseId: 'CASE-001',
    consultationId: 'CONSULT-001',
    status: 'IN_PROGRESS',
  });
  completeMedicalOrderMock.mockResolvedValue({});
  completeConsultationMock.mockResolvedValue({
    caseId: 'CASE-001',
    consultationId: 'CONSULT-001',
    status: 'COMPLETED',
  });
  createConsultationMock.mockResolvedValue({
    caseId: 'CASE-001',
    consultationId: 'CONSULT-002',
    status: 'IN_PROGRESS',
  });
  createMedicalOrderMock.mockResolvedValue({});
  createReportRevisionRequestMock.mockResolvedValue({
    approvedVersionNo: null,
    caseId: 'CASE-001',
    reportId: 'REPORT-001',
    requestId: 'REVISION-002',
    requestStatus: 'PENDING',
  });
  issueFormalReportVersionsMock.mockResolvedValue({
    failureCount: 0,
    items: [{ success: true, versionId: 'RV-1' }],
    successCount: 1,
    totalCount: 1,
  });
  listCaseReportVersionsMock.mockResolvedValue([]);
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
  getCaseLifecycleTrackingMock.mockResolvedValue(trackingFixture);
  printFormalReportVersionsMock.mockResolvedValue({
    failureCount: 0,
    items: [{ success: true, versionId: 'RV-1' }],
    successCount: 1,
    totalCount: 1,
  });
  rejectReportRevisionRequestMock.mockResolvedValue({
    approvedVersionNo: null,
    caseId: 'CASE-001',
    reportId: 'REPORT-001',
    requestId: 'REVISION-001',
    requestStatus: 'REJECTED',
  });
  recallFormalReportVersionsMock.mockResolvedValue({
    failureCount: 0,
    items: [{ success: true, versionId: 'RV-1' }],
    successCount: 1,
    totalCount: 1,
  });
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
    documentText: () => document.body.textContent ?? '',
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
    clickTableRow: (text: string, index = 0) => {
      const rows = [
        ...root.querySelectorAll<HTMLTableRowElement>('tr'),
      ].filter((item) => item.textContent?.includes(text));
      const row = rows[index];
      expect(row).toBeTruthy();
      row?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    },
    isButtonDisabled: (text: string, index = 0) => {
      const buttons = [...root.querySelectorAll('button')].filter(
        (item) => item.textContent?.trim() === text,
      );
      const button = buttons[index];
      expect(button).toBeTruthy();
      return button?.hasAttribute('disabled') ?? false;
    },
    setInputValue: (placeholder: string, value: string, index = 0) => {
      const inputs = [
        ...root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
          'input, textarea',
        ),
      ].filter((item) => item.getAttribute('placeholder') === placeholder);
      const input = inputs[index];
      expect(input).toBeTruthy();
      if (!input) {
        return;
      }
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    },
    root,
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

  it('keeps assignment filter selects wide enough to show selected text', async () => {
    const wrapper = await mountView(DiagnosisAssignmentView);

    const filterSelects = [
      ...wrapper.root.querySelectorAll<HTMLElement>('.el-select'),
    ].filter((item) => item.classList.contains('min-w-[176px]'));

    expect(filterSelects).toHaveLength(2);
    for (const item of filterSelects) {
      expect(item.classList.contains('flex-none')).toBe(true);
    }

    wrapper.unmount();
  });

  it('keeps the diagnosis workbench issue-mode select wide enough beside the sign button', async () => {
    mockAccessStore.accessCodes = [
      M4_PERMISSION_CODES.WORKBENCH_QUERY,
      M4_PERMISSION_CODES.REPORT_SIGN,
    ];

    const wrapper = await mountView(DiagnosisWorkbenchView);
    const issueModeSelect = wrapper.root.querySelector<HTMLElement>(
      '[data-testid="workbench-report-issue-mode"]',
    );

    expect(issueModeSelect).toBeTruthy();
    expect(issueModeSelect?.classList.contains('w-[150px]')).toBe(true);
    expect(issueModeSelect?.classList.contains('shrink-0')).toBe(true);

    wrapper.unmount();
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
  }, 15_000);

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
  }, 15_000);

  it('shows review-only actions on the report list page', async () => {
    mockRoute.query = {
      caseId: 'CASE-001',
    };
    mockAccessStore.accessCodes = [M4_PERMISSION_CODES.REPORT_REVIEW];
    listCaseReportVersionsMock.mockResolvedValue(formalReportVersionsFixture);

    const wrapper = await mountView(PathologyReportView);

    expect(listCaseReportVersionsMock).toHaveBeenCalledWith('CASE-001');
    expect(wrapper.text()).toContain('报告列表');
    expect(wrapper.text()).toContain('已提交');
    expect(wrapper.text()).toContain('已审核');
    expect(wrapper.text()).toContain('已发布');
    expect(wrapper.text()).toContain('未打印');
    expect(wrapper.text()).toContain('已发放');
    expect(wrapper.text()).toContain('2026-06-15 10:30:00');
    expect(wrapper.text()).toContain('病理号');
    expect(wrapper.buttonTexts()).toContain('审核通过');
    expect(wrapper.buttonTexts()).toContain('驳回');
    expect(wrapper.buttonTexts()).not.toContain('签发');
    expect(wrapper.buttonTexts()).not.toContain('发布');
    expect(wrapper.buttonTexts()).not.toContain('打印');
    expect(wrapper.buttonTexts()).not.toContain('发放');
    expect(wrapper.buttonTexts()).not.toContain('回收');
    expect(wrapper.text()).not.toContain('任务 ID');
    expect(wrapper.text()).not.toContain('报告正文');
    expect(wrapper.text()).not.toContain('流转操作');
  });

  it('shows lifecycle and distribution actions for publish users without draft editor controls', async () => {
    mockRoute.query = {
      caseId: 'CASE-001',
      pathologyNo: 'PATH-001',
      reportId: 'REPORT-001',
    };
    mockAccessStore.accessCodes = [
      M4_PERMISSION_CODES.REPORT_REVIEW,
      M4_PERMISSION_CODES.REPORT_SIGN,
      M4_PERMISSION_CODES.REPORT_PUBLISH,
    ];
    listCaseReportVersionsMock.mockResolvedValue(formalReportVersionsFixture);

    const wrapper = await mountView(PathologyReportView);

    expect(wrapper.buttonTexts()).toContain('打印');
    expect(wrapper.buttonTexts()).toContain('发放');
    expect(wrapper.buttonTexts()).toContain('回收');
    expect(wrapper.buttonTexts()).toContain('审核通过');
    expect(wrapper.buttonTexts()).toContain('驳回');
    expect(wrapper.buttonTexts()).toContain('签发');
    expect(wrapper.buttonTexts()).toContain('发布');
    expect(wrapper.buttonTexts()).not.toContain('创建草稿');
    expect(wrapper.buttonTexts()).not.toContain('保存草稿');
    expect(wrapper.buttonTexts()).not.toContain('提交');
    wrapper.unmount();
  });

  it('shows revision workbench top actions and row dropdown based on permission', async () => {
    mockAccessStore.accessCodes = [M4_PERMISSION_CODES.REVISION_REQUEST_CREATE];
    const createWrapper = await mountView(ReportRevisionView);
    createWrapper.setInputValue('请输入病例 ID 或病理号', 'CASE-001');
    createWrapper.clickButton('查询');
    await flushAsyncWork();
    expect(getDiagnosticWorkbenchMock).toHaveBeenCalledWith('CASE-001');
    expect(createWrapper.text()).toContain('当前报告');
    expect(createWrapper.text()).toContain('修订申请');
    expect(createWrapper.text()).not.toContain('最近操作结果');
    expect(createWrapper.buttonTexts()).toContain('发起修订申请');
    expect(createWrapper.buttonTexts()).not.toContain('审批修订申请');
    expect(createWrapper.isButtonDisabled('发起修订申请')).toBe(true);
    createWrapper.clickTableRow('当前报告');
    await flushAsyncWork();
    expect(createWrapper.isButtonDisabled('发起修订申请')).toBe(false);
    expect(
      createWrapper.buttonTexts().filter((text) => text === '操作'),
    ).toHaveLength(1);
    createWrapper.clickButton('操作');
    await flushAsyncWork();
    expect(createWrapper.documentText()).toContain('发起修订申请');
    expect(createWrapper.documentText()).not.toContain('审批通过');
    expect(createWrapper.documentText()).not.toContain('审批驳回');
    createWrapper.unmount();

    mockAccessStore.accessCodes = [M4_PERMISSION_CODES.REVISION_APPROVE];
    const reviewWrapper = await mountView(ReportRevisionView);
    reviewWrapper.setInputValue('请输入病例 ID 或病理号', 'CASE-001');
    reviewWrapper.clickButton('查询');
    await flushAsyncWork();
    expect(reviewWrapper.buttonTexts()).not.toContain('发起修订申请');
    expect(reviewWrapper.buttonTexts()).toContain('审批修订申请');
    expect(reviewWrapper.isButtonDisabled('审批修订申请')).toBe(true);
    reviewWrapper.clickTableRow('修订申请');
    await flushAsyncWork();
    expect(reviewWrapper.isButtonDisabled('审批修订申请')).toBe(false);
    expect(
      reviewWrapper.buttonTexts().filter((text) => text === '操作'),
    ).toHaveLength(1);
    reviewWrapper.clickButton('审批修订申请');
    await flushAsyncWork();
    expect(reviewWrapper.documentText()).toContain('审批通过');
    expect(reviewWrapper.documentText()).toContain('审批驳回');
    expect(reviewWrapper.documentText()).not.toContain('发起修订申请');
    reviewWrapper.unmount();
  });

  it('hides revision top actions when the user has no revision permissions', async () => {
    const wrapper = await mountView(ReportRevisionView);
    wrapper.setInputValue('请输入病例 ID 或病理号', 'CASE-001');
    wrapper.clickButton('查询');
    await flushAsyncWork();

    expect(wrapper.buttonTexts()).not.toContain('发起修订申请');
    expect(wrapper.buttonTexts()).not.toContain('审批修订申请');

    wrapper.unmount();
  });

  it('keeps the approval top action disabled for non-pending revision rows', async () => {
    mockAccessStore.accessCodes = [M4_PERMISSION_CODES.REVISION_APPROVE];
    getDiagnosticWorkbenchMock.mockResolvedValue({
      ...workbenchFixture,
      revisions: [
        {
          ...workbenchFixture.revisions[0]!,
          requestStatus: 'APPROVED',
          reviewedAt: '2026-06-15T10:00:00',
          reviewedByName: '审批医生甲',
        },
      ],
    });

    const wrapper = await mountView(ReportRevisionView);
    wrapper.setInputValue('请输入病例 ID 或病理号', 'CASE-001');
    wrapper.clickButton('查询');
    await flushAsyncWork();

    wrapper.clickTableRow('修订申请');
    await flushAsyncWork();
    expect(wrapper.isButtonDisabled('审批修订申请')).toBe(true);

    wrapper.unmount();
  });

  it('shows consultation workbench actions from the row dropdown based on permission', async () => {
    mockAccessStore.accessCodes = [M4_PERMISSION_CODES.CONSULTATION_COMMENT];

    const wrapper = await mountView(ConsultationWorkstationView);
    wrapper.setInputValue('请输入病例 ID 或病理号', 'CASE-001');
    wrapper.clickButton('查询');
    await flushAsyncWork();

    expect(getDiagnosticWorkbenchMock).toHaveBeenCalledWith('CASE-001');
    expect(wrapper.text()).toContain('当前病例');
    expect(wrapper.text()).toContain('会诊记录');
    expect(wrapper.text()).toContain('最近操作结果');
    expect(wrapper.text()).toContain('进行中');
    expect(wrapper.buttonTexts()).toContain('参与人意见');
    expect(wrapper.isButtonDisabled('参与人意见')).toBe(true);
    expect(
      wrapper.buttonTexts().filter((text) => text === '操作'),
    ).toHaveLength(1);
    wrapper.clickButton('操作');
    await flushAsyncWork();
    expect(wrapper.documentText()).toContain('录入参与人意见');
    expect(wrapper.documentText()).toContain('完成会诊');
    expect(wrapper.documentText()).not.toContain('发起会诊');
    wrapper.unmount();
  });

  it('submits batch consultation comments only for valid selected rows', async () => {
    mockAccessStore.accessCodes = [M4_PERMISSION_CODES.CONSULTATION_COMMENT];
    getDiagnosticWorkbenchMock.mockResolvedValue(consultationWorkbenchBatchFixture);

    const wrapper = await mountView(ConsultationWorkstationView);
    wrapper.setInputValue('请输入病例 ID 或病理号', 'CASE-001');
    wrapper.clickButton('查询');
    await flushAsyncWork();

    wrapper.clickCheckbox(1);
    wrapper.clickCheckbox(2);
    wrapper.clickCheckbox(3);
    wrapper.clickCheckbox(4);
    await flushAsyncWork();

    expect(wrapper.isButtonDisabled('参与人意见')).toBe(false);
    wrapper.clickButton('参与人意见');
    await flushAsyncWork();
    wrapper.setInputValue('请输入参与人意见', '统一批量意见');
    wrapper.clickButton('保存意见');
    await flushAsyncWork();

    expect(commentConsultationParticipantMock).toHaveBeenCalledTimes(1);
    expect(commentConsultationParticipantMock).toHaveBeenCalledWith(
      'CONSULT-001',
      'CP-001',
      expect.objectContaining({
        operatorName: '当前分派员',
        opinion: '统一批量意见',
      }),
    );
    expect(wrapper.documentText()).toContain('批量参与人意见提交完成 1 条');
    expect(wrapper.documentText()).toContain('跳过 3 条');
    expect(wrapper.documentText()).toContain('当前登录人不在会诊参与人列表中');
    expect(wrapper.documentText()).toContain('CONSULT-001');
    wrapper.unmount();
  });

  it('submits batch consultation completion only for actionable rows', async () => {
    mockAccessStore.accessCodes = [M4_PERMISSION_CODES.CONSULTATION_COMPLETE];
    getDiagnosticWorkbenchMock.mockResolvedValue(consultationWorkbenchBatchFixture);
    completeConsultationMock
      .mockResolvedValueOnce({
        caseId: 'CASE-001',
        consultationId: 'CONSULT-001',
        status: 'COMPLETED',
      })
      .mockResolvedValueOnce({
        caseId: 'CASE-001',
        consultationId: 'CONSULT-003',
        status: 'COMPLETED',
      });

    const wrapper = await mountView(ConsultationWorkstationView);
    wrapper.setInputValue('请输入病例 ID 或病理号', 'CASE-001');
    wrapper.clickButton('查询');
    await flushAsyncWork();

    wrapper.clickCheckbox(1);
    wrapper.clickCheckbox(2);
    wrapper.clickCheckbox(3);
    wrapper.clickCheckbox(4);
    await flushAsyncWork();

    expect(wrapper.isButtonDisabled('完成会诊')).toBe(false);
    wrapper.clickButton('完成会诊');
    await flushAsyncWork();
    wrapper.setInputValue('请输入主持意见', '统一主持意见');
    wrapper.clickButton('完成会诊', 1);
    await flushAsyncWork();

    expect(completeConsultationMock).toHaveBeenCalledTimes(2);
    expect(completeConsultationMock).toHaveBeenNthCalledWith(
      1,
      'CONSULT-001',
      expect.objectContaining({
        operatorName: '当前分派员',
        opinion: '统一主持意见',
      }),
    );
    expect(completeConsultationMock).toHaveBeenNthCalledWith(
      2,
      'CONSULT-003',
      expect.objectContaining({
        operatorName: '当前分派员',
        opinion: '统一主持意见',
      }),
    );
    expect(wrapper.documentText()).toContain('批量完成会诊完成 2 条');
    expect(wrapper.documentText()).toContain('跳过 2 条');
    expect(wrapper.documentText()).toContain('已完成会诊不可重复完成');
    expect(wrapper.documentText()).toContain('CONSULT-003');
    wrapper.unmount();
  });

  it('hides the report entry action for tracking-only users', async () => {
    mockRoute.query = {
      caseId: 'CASE-001',
    };
    mockAccessStore.accessCodes = [M4_PERMISSION_CODES.REPORT_TRACKING_QUERY];

    const wrapper = await mountView(ReportTrackingView);

    expect(getCaseLifecycleTrackingMock).toHaveBeenCalledWith('CASE-001');
    expect(wrapper.text()).toContain('病例查询');
    expect(wrapper.buttonTexts()).not.toContain('进入报告');
    wrapper.unmount();
  });

  it('opens medical order workstation from lifecycle tracking view without direct cancel action', async () => {
    mockRoute.query = {
      caseId: 'CASE-001',
    };
    mockAccessStore.accessCodes = [
      M4_PERMISSION_CODES.REPORT_TRACKING_QUERY,
      M4_PERMISSION_CODES.MEDICAL_ORDER_QUERY,
    ];
    getCaseLifecycleTrackingMock.mockResolvedValue({
      ...trackingFixture,
      reportLifecycle: {
        ...trackingFixture.reportLifecycle,
        medicalOrders: [
          {
            orderDate: '2026-05-26T10:15:30',
            orderId: 'ORDER-003',
            orderType: 'SPECIAL_STAIN',
            pathologyNo: 'PATH-001',
            status: 'PENDING',
          },
        ],
      },
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

    expect(wrapper.buttonTexts()).not.toContain('取消');
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

  it('renders medical order workstation list with localized display columns', async () => {
    mockAccessStore.accessCodes = [M4_PERMISSION_CODES.MEDICAL_ORDER_QUERY];
    listPendingMedicalOrdersMock.mockResolvedValue({
      ...pendingMedicalOrderPageFixture,
      items: [
        {
          ...pendingMedicalOrderPageFixture.items[0]!,
          billingStatus: 'SUCCESS',
          orderType: 'SPECIAL',
          status: 'IN_PROGRESS',
        },
      ],
      total: 1,
    });

    const wrapper = await mountView(MedicalOrderWorkbenchView);

    expect(listPendingMedicalOrdersMock).toHaveBeenCalledWith({
      page: 1,
      pathologyNo: undefined,
      size: 50,
      status: undefined,
    });
    expect(wrapper.text()).not.toContain('执行操作');
    expect(wrapper.text()).not.toContain('医嘱号');
    expect(wrapper.text()).not.toContain('MO-001');
    expect(wrapper.text()).toContain('类型');
    expect(wrapper.text()).toContain('状态');
    expect(wrapper.text()).toContain('收费状态');
    expect(wrapper.text()).toContain('特殊染色');
    expect(wrapper.text()).toContain('执行中');
    expect(wrapper.text()).toContain('已收费');
    expect(wrapper.text()).not.toContain('SPECIAL');
    expect(wrapper.text()).not.toContain('IN_PROGRESS');
    expect(wrapper.text()).not.toContain('SUCCESS');
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
