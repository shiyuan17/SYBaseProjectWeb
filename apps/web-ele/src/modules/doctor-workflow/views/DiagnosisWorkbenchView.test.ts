import type {
  DiagnosticWorkbenchView,
  PendingDiagnosticTaskPage,
} from '../types/doctor-workflow';

import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  acceptDiagnosticTaskMock,
  cancelMedicalOrderMock,
  confirmMedicalOrderBillingMock,
  createConsultationMock,
  createMedicalOrderMock,
  createPathologyReportMock,
  commentConsultationParticipantMock,
  completeConsultationMock,
  executeMedicalOrderBillingMock,
  getDiagnosticWorkbenchMock,
  issueFormalReportVersionsMock,
  listCaseReportVersionsMock,
  listMedicalOrderDictsMock,
  listMedicalOrderPackagesPageMock,
  listPendingDiagnosticTasksMock,
  mockAccessStore,
  mockRoute,
  mockRouter,
  mockUserStore,
  reviewPathologyReportMock,
  savePathologyReportDraftMock,
  signPathologyReportMock,
  startDiagnosticTaskMock,
  submitPathologyReportMock,
  createObjectUrlMock,
  messageErrorMock,
  messageInfoMock,
  messageSuccessMock,
  messageWarningMock,
  revokeObjectUrlMock,
  windowOpenMock,
} = vi.hoisted(() => ({
  acceptDiagnosticTaskMock:
    vi.fn<(taskId: string, data: unknown) => Promise<unknown>>(),
  cancelMedicalOrderMock:
    vi.fn<(orderId: string, data: unknown) => Promise<unknown>>(),
  confirmMedicalOrderBillingMock: vi.fn<(data: unknown) => Promise<unknown>>(),
  createConsultationMock: vi.fn<(data: unknown) => Promise<unknown>>(),
  createMedicalOrderMock: vi.fn<(data: unknown) => Promise<unknown>>(),
  createPathologyReportMock:
    vi.fn<(data: unknown) => Promise<{ reportId: string }>>(),
  commentConsultationParticipantMock:
    vi.fn<
      (
        consultationId: string,
        participantId: string,
        data: unknown,
      ) => Promise<unknown>
    >(),
  completeConsultationMock:
    vi.fn<(consultationId: string, data: unknown) => Promise<unknown>>(),
  executeMedicalOrderBillingMock: vi.fn<(data: unknown) => Promise<unknown>>(),
  getDiagnosticWorkbenchMock:
    vi.fn<(caseId: string) => Promise<DiagnosticWorkbenchView>>(),
  issueFormalReportVersionsMock: vi.fn<(data: unknown) => Promise<unknown>>(),
  listCaseReportVersionsMock: vi.fn<(caseId: string) => Promise<unknown[]>>(),
  listMedicalOrderDictsMock: vi.fn<() => Promise<unknown[]>>(),
  listMedicalOrderPackagesPageMock:
    vi.fn<(query: unknown) => Promise<unknown>>(),
  listPendingDiagnosticTasksMock:
    vi.fn<(query: unknown) => Promise<PendingDiagnosticTaskPage>>(),
  mockAccessStore: {
    accessCodes: ['PERM_M4_WORKBENCH_QUERY'],
  },
  mockRoute: {
    name: 'DiagnosisWorkbench',
    path: '/doctor-workflow/workbench',
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
  reviewPathologyReportMock:
    vi.fn<(reportId: string, data: unknown) => Promise<unknown>>(),
  savePathologyReportDraftMock:
    vi.fn<(reportId: string, data: unknown) => Promise<unknown>>(),
  signPathologyReportMock:
    vi.fn<(reportId: string, data: unknown) => Promise<unknown>>(),
  startDiagnosticTaskMock:
    vi.fn<(taskId: string, data: unknown) => Promise<unknown>>(),
  submitPathologyReportMock:
    vi.fn<(reportId: string, data: unknown) => Promise<unknown>>(),
  createObjectUrlMock: vi.fn(),
  messageErrorMock: vi.fn(),
  messageInfoMock: vi.fn(),
  messageSuccessMock: vi.fn(),
  messageWarningMock: vi.fn(),
  revokeObjectUrlMock: vi.fn(),
  windowOpenMock: vi.fn(),
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

vi.mock('element-plus', async (importOriginal) => {
  const actual = await importOriginal<typeof import('element-plus')>();
  return {
    ...actual,
    ElMessage: {
      error: messageErrorMock,
      info: messageInfoMock,
      success: messageSuccessMock,
      warning: messageWarningMock,
    },
  };
});

vi.mock('../api/doctor-workflow-service', () => ({
  acceptDiagnosticTask: acceptDiagnosticTaskMock,
  cancelMedicalOrder: cancelMedicalOrderMock,
  commentConsultationParticipant: commentConsultationParticipantMock,
  completeConsultation: completeConsultationMock,
  confirmMedicalOrderBilling: confirmMedicalOrderBillingMock,
  createConsultation: createConsultationMock,
  createMedicalOrder: createMedicalOrderMock,
  createPathologyReport: createPathologyReportMock,
  executeMedicalOrderBilling: executeMedicalOrderBillingMock,
  getDiagnosticWorkbench: getDiagnosticWorkbenchMock,
  issueFormalReportVersions: issueFormalReportVersionsMock,
  listCaseReportVersions: listCaseReportVersionsMock,
  listMedicalOrderDicts: listMedicalOrderDictsMock,
  listMedicalOrderPackagesPage: listMedicalOrderPackagesPageMock,
  listPendingDiagnosticTasks: listPendingDiagnosticTasksMock,
  reviewPathologyReport: reviewPathologyReportMock,
  savePathologyReportDraft: savePathologyReportDraftMock,
  signPathologyReport: signPathologyReportMock,
  startDiagnosticTask: startDiagnosticTaskMock,
  submitPathologyReport: submitPathologyReportMock,
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

const medicalOrderDictFixture = [
  {
    categoryCode: 'TSRS',
    categoryName: '特殊染色',
    children: [],
    enabled: true,
    id: 'CAT-001',
    items: [
      {
        categoryId: 'CAT-001',
        defaultContent: '补做特殊染色',
        enabled: true,
        executionScope: 'BLOCK',
        id: 'ITEM-001',
        orderItemCode: 'SS-001',
        orderItemName: '特殊染色',
        orderType: 'SPECIAL_STAIN',
        sortOrder: 1,
      },
    ],
    parentId: null,
    sortOrder: 1,
  },
  {
    categoryCode: 'IHC',
    categoryName: '免疫组化',
    children: [],
    enabled: true,
    id: 'CAT-002',
    items: [
      {
        categoryId: 'CAT-002',
        defaultContent: '补做免疫组化 CK',
        enabled: true,
        executionScope: 'BLOCK',
        id: 'ITEM-002',
        orderItemCode: 'IHC-CK',
        orderItemName: '免疫组化 CK',
        orderType: 'IMMUNOHISTOCHEMISTRY',
        sortOrder: 2,
      },
      {
        categoryId: 'CAT-002',
        defaultContent: 'Ki-67',
        enabled: true,
        executionScope: 'BLOCK',
        id: 'ITEM-005',
        orderItemCode: 'IHC-KI67',
        orderItemName: 'Ki-67',
        orderType: 'IMMUNOHISTOCHEMISTRY',
        sortOrder: 3,
      },
    ],
    parentId: null,
    sortOrder: 2,
  },
  {
    categoryCode: 'FISH',
    categoryName: 'Fish',
    children: [],
    enabled: true,
    id: 'CAT-003',
    items: [
      {
        categoryId: 'CAT-003',
        defaultContent: '1p19q(Fish)',
        enabled: true,
        executionScope: 'BLOCK',
        id: 'ITEM-003',
        orderItemCode: 'FISH-1P19Q',
        orderItemName: '1p19q(Fish)',
        orderType: 'FISH',
        sortOrder: 3,
      },
    ],
    parentId: null,
    sortOrder: 3,
  },
  {
    categoryCode: 'MYYG',
    categoryName: '免疫荧光',
    children: [],
    enabled: true,
    id: 'CAT-004',
    items: [
      {
        categoryId: 'CAT-004',
        defaultContent: 'C1q免疫荧光',
        enabled: true,
        executionScope: 'BLOCK',
        id: 'ITEM-004',
        orderItemCode: 'IF-C1Q',
        orderItemName: 'C1q免疫荧光',
        orderType: 'IMMUNE_FLUORESCENCE',
        sortOrder: 4,
      },
    ],
    parentId: null,
    sortOrder: 4,
  },
  {
    categoryCode: 'DNA',
    categoryName: '基因检测',
    children: [],
    enabled: true,
    id: 'CAT-005',
    items: [
      {
        categoryId: 'CAT-005',
        defaultContent: 'EGFR基因突变',
        enabled: true,
        executionScope: 'BLOCK',
        id: 'ITEM-006',
        orderItemCode: 'DNA-EGFR',
        orderItemName: 'EGFR基因突变',
        orderType: 'GENE',
        sortOrder: 1,
      },
    ],
    parentId: null,
    sortOrder: 5,
  },
];

const medicalOrderPackagePageFixture = {
  items: [
    {
      enabled: true,
      id: 'PKG-001',
      items: [
        {
          id: 'PKG-ITEM-001',
          orderItemCode: 'SS-001',
          orderItemId: 'ITEM-001',
          orderItemName: '特殊染色',
          packageId: 'PKG-001',
          remarks: null,
          sortOrder: 1,
        },
        {
          id: 'PKG-ITEM-002',
          orderItemCode: 'IHC-CK',
          orderItemId: 'ITEM-002',
          orderItemName: '免疫组化 CK',
          packageId: 'PKG-001',
          remarks: null,
          sortOrder: 2,
        },
      ],
      ownerUserId: null,
      packageCode: 'PKG-IHC',
      packageName: '免疫组化套餐',
      packageType: 'IHC',
      remarks: null,
    },
    {
      enabled: true,
      id: 'PKG-002',
      items: [
        {
          id: 'PKG-ITEM-003',
          orderItemCode: 'FISH-1P19Q',
          orderItemId: 'ITEM-003',
          orderItemName: '1p19q(Fish)',
          packageId: 'PKG-002',
          remarks: null,
          sortOrder: 1,
        },
      ],
      ownerUserId: null,
      packageCode: 'PKG-FISH',
      packageName: 'Fish套餐',
      packageType: 'FISH',
      remarks: null,
    },
    {
      enabled: true,
      id: 'PKG-003',
      items: [
        {
          id: 'PKG-ITEM-004',
          orderItemCode: 'UNKNOWN-001',
          orderItemId: 'ITEM-UNKNOWN',
          orderItemName: '未入字典项目',
          packageId: 'PKG-003',
          remarks: null,
          sortOrder: 1,
        },
      ],
      ownerUserId: null,
      packageCode: 'PKG-UNKNOWN',
      packageName: '未入字典套餐',
      packageType: 'UNKNOWN',
      remarks: null,
    },
  ],
  page: 1,
  size: 100,
  total: 1,
};

const workbenchFixtureByCaseId: Record<string, DiagnosticWorkbenchView> = {
  'CASE-001': {
    applicationFormArchiveLocation: 'A柜-01-02',
    applicationFormArchiveStatus: 'ARCHIVED',
    applicationFormImageUrl: '/archives/APP-001.jpg',
    applicationNo: 'APP-001',
    applicationType: 'ROUTINE',
    bedNo: '',
    blocks: [
      {
        archiveLocation: '蜡块柜-B1',
        archiveStatus: 'ARCHIVED',
        blockCode: 'A1',
        blockId: 'BLOCK-001',
        description: '胃窦组织',
        embeddingDoctorName: '包埋医生甲',
        embeddingBoxNo: 'BOX-001',
        grossingDoctorName: '取材医生甲',
        loanStatus: 'IN_LIBRARY',
        remarks: '蜡块备注',
        specimenId: 'SPEC-001',
        specimenName: '胃窦活检组织',
        tissueName: '胃窦组织',
        usageStatus: '未使用',
      },
    ],
    caseId: 'CASE-001',
    caseStatus: 'IN_DIAGNOSIS',
    chargeItems: [
      {
        chargedAt: '2026-06-01 11:00:00',
        chargedByName: '收费员甲',
        itemName: '免疫组化 CK',
      },
    ],
    checkItem: '切片检查与诊断',
    clinicalDiagnosis: '1:糖尿病伴肾并发症',
    clinicalExaminationAndSurgeryFindings: '',
    clinicalHistory: '',
    clinicalSubmissionRequirements: '',
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
    deliveredAt: '2026-05-26 10:20:00',
    detachedAt: '',
    diagnosticTasks: [queueFixture.items[0]!],
    fixedAt: '',
    hasPendingRevision: true,
    historicalPathologies: [
      {
        age: '30岁',
        diagnosis: '历史诊断',
        examinationNo: 'F2600039',
        inpatientNo: 'IP-001',
        reportTime: '2026-05-14 11:40:00',
        submissionType: '冰冻病理',
      },
    ],
    infectiousAndPastHistorySummary: '',
    infectiousSource: '',
    inpatientNo: '02237380',
    medicalOrders: [
      {
        acceptedAt: '2026-06-01 10:30:00',
        applicationNo: 'APP-001',
        billingStatus: 'PENDING',
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
        status: 'IN_PROGRESS',
      },
    ],
    outpatientNo: '',
    patientAge: '30岁1月',
    patientGender: '女',
    patientId: '34734663',
    pathologyNo: 'F2600036',
    patientName: '范渊旭',
    pacsExaminations: [
      {
        examinationNo: 'NPA250003',
        imagingDescription: '胸部影像描述',
        imagingDiagnosis: '影像诊断',
        reportStatus: '未写',
        reportTime: '2026-05-14 12:00:00',
        submissionType: '化验',
      },
    ],
    phone: '18170000000',
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
    remarkSections: [
      {
        content: '申请备注内容',
        sectionKey: 'APPLICATION',
        title: '申请备注',
      },
      {
        content: '医嘱备注内容',
        relatedNo: 'F2600036-1',
        sectionKey: 'MEDICAL_ORDER',
        title: '医嘱备注',
      },
    ],
    reportTraces: [
      {
        diagnosisInfo: '诊断信息',
        reportDoctorName: '报告医师甲',
        reportStatus: 'DRAFT',
        reportTime: '2026-06-01 10:20:00',
        sequenceNo: 1,
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
        blockCode: 'A1',
        diagnosisRemark: '诊断备注',
        evaluation: '优秀',
        examinationItem: 'HE',
        loanStatus: 'IN_LIBRARY',
        pathologyNo: 'F2600036',
        qualityStatus: 'QUALIFIED',
        slicedAt: '2026-06-01 08:30:00',
        slicedByName: '切片人甲',
        slideId: 'SLIDE-001',
        slideNo: 'SLIDE-001',
        slideStatus: 'READY',
        slideType: 'HE',
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
    chargeItems: [],
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
    historicalPathologies: [],
    medicalOrders: [],
    pacsExaminations: [],
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
    remarkSections: [],
    reportTraces: [],
    revisions: [],
    slides: [],
    specimens: [],
    submittingDepartmentName: '呼吸内科',
    submittingDoctorName: '送检医生乙',
  },
};

function resetTestState() {
  mockRoute.name = 'DiagnosisWorkbench';
  mockRoute.path = '/doctor-workflow/workbench';
  mockRoute.query = {};
  mockRouter.push.mockReset();
  mockRouter.replace.mockReset();
  acceptDiagnosticTaskMock.mockReset();
  cancelMedicalOrderMock.mockReset();
  confirmMedicalOrderBillingMock.mockReset();
  createConsultationMock.mockReset();
  createMedicalOrderMock.mockReset();
  createPathologyReportMock.mockReset();
  commentConsultationParticipantMock.mockReset();
  completeConsultationMock.mockReset();
  executeMedicalOrderBillingMock.mockReset();
  getDiagnosticWorkbenchMock.mockReset();
  issueFormalReportVersionsMock.mockReset();
  listCaseReportVersionsMock.mockReset();
  listMedicalOrderDictsMock.mockReset();
  listMedicalOrderPackagesPageMock.mockReset();
  listPendingDiagnosticTasksMock.mockReset();
  reviewPathologyReportMock.mockReset();
  savePathologyReportDraftMock.mockReset();
  signPathologyReportMock.mockReset();
  startDiagnosticTaskMock.mockReset();
  submitPathologyReportMock.mockReset();
  createObjectUrlMock.mockReset();
  createObjectUrlMock.mockReturnValue('blob:diagnosis-capture');
  messageErrorMock.mockReset();
  messageInfoMock.mockReset();
  messageSuccessMock.mockReset();
  messageWarningMock.mockReset();
  revokeObjectUrlMock.mockReset();
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: createObjectUrlMock,
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: revokeObjectUrlMock,
  });
  windowOpenMock.mockReset();
  vi.stubGlobal('open', windowOpenMock);

  listPendingDiagnosticTasksMock.mockResolvedValue(queueFixture);
  listMedicalOrderDictsMock.mockResolvedValue(medicalOrderDictFixture);
  listMedicalOrderPackagesPageMock.mockResolvedValue(
    medicalOrderPackagePageFixture,
  );
  getDiagnosticWorkbenchMock.mockImplementation(async (caseId) => {
    return (
      workbenchFixtureByCaseId[caseId] ?? workbenchFixtureByCaseId['CASE-001']!
    );
  });
  acceptDiagnosticTaskMock.mockResolvedValue({});
  cancelMedicalOrderMock.mockResolvedValue({});
  confirmMedicalOrderBillingMock.mockResolvedValue({
    failureCount: 0,
    items: [{ billingStatus: 'SUCCESS', orderId: 'ORDER-001' }],
    successCount: 1,
    totalCount: 1,
  });
  createConsultationMock.mockResolvedValue({
    consultationId: 'CONS-NEW',
  });
  createMedicalOrderMock.mockResolvedValue({});
  createPathologyReportMock.mockResolvedValue({
    reportId: 'REPORT-CREATED',
  });
  commentConsultationParticipantMock.mockResolvedValue({});
  completeConsultationMock.mockResolvedValue({});
  executeMedicalOrderBillingMock.mockResolvedValue({
    failureCount: 0,
    items: [{ billingStatus: 'SUCCESS', orderId: 'ORDER-001' }],
    successCount: 1,
    totalCount: 1,
  });
  issueFormalReportVersionsMock.mockResolvedValue({
    successCount: 1,
    totalCount: 1,
    items: [],
  });
  listCaseReportVersionsMock.mockImplementation(async (caseId) => {
    if (caseId === 'CASE-002') {
      return [
        {
          reportId: 'REPORT-002',
          versionId: 'VERSION-002',
          versionStatus: 'SIGNED',
        },
      ];
    }

    return [
      {
        reportId: 'REPORT-001',
        versionId: 'VERSION-001',
        versionStatus: 'SIGNED',
      },
    ];
  });
  startDiagnosticTaskMock.mockResolvedValue({});
  reviewPathologyReportMock.mockResolvedValue({});
  savePathologyReportDraftMock.mockResolvedValue({});
  signPathologyReportMock.mockResolvedValue({});
  submitPathologyReportMock.mockResolvedValue({});
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

function findButton(text: string) {
  const button = [
    ...document.querySelectorAll<HTMLButtonElement>('button'),
  ].find((item) => item.textContent?.includes(text));
  if (!button) {
    throw new Error(`Missing button: ${text}`);
  }
  return button;
}

function getButtonTexts() {
  return [...document.querySelectorAll<HTMLButtonElement>('button')].map(
    (button) => button.textContent?.trim() ?? '',
  );
}

function findByTestId<T extends HTMLElement = HTMLElement>(testId: string) {
  const element = document.querySelector<T>(`[data-testid="${testId}"]`);
  if (!element) {
    throw new Error(`Missing test id: ${testId}`);
  }
  return element;
}

async function selectReportStyleOption(label: string) {
  findByTestId('report-style-select').click();
  await flushAsyncWork();

  const option = [
    ...document.body.querySelectorAll<HTMLElement>('.el-select-dropdown__item'),
  ].find((item) => item.textContent?.includes(label));
  expect(option).toBeTruthy();

  option!.click();
  await flushAsyncWork();
}

async function clickMaterialTab(label: string) {
  const tab = [
    ...document.querySelectorAll<HTMLElement>('.el-tabs__item, [role="tab"]'),
  ].find((item) => item.textContent?.includes(label));
  if (!tab) {
    throw new Error(`Missing material tab: ${label}`);
  }
  tab.click();
  await flushAsyncWork();
}

function getOrderPaneText() {
  return (
    document.querySelector(
      '[data-testid="diagnosis-workbench-medical-order-pane"]',
    )?.textContent ?? ''
  );
}

describe('DiagnosisWorkbenchView', () => {
  beforeEach(() => {
    resetTestState();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('does not load or redirect when kept alive under another route', async () => {
    mockRoute.name = 'PathologyReport';
    mockRoute.path = '/doctor-workflow/report';

    const wrapper = await mountView();

    expect(listPendingDiagnosticTasksMock).not.toHaveBeenCalled();
    expect(getDiagnosticWorkbenchMock).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it('selects the first queue item and loads its workbench when route query is empty', async () => {
    const wrapper = await mountView();

    expect(listPendingDiagnosticTasksMock).toHaveBeenCalledWith({
      assignedFrom: expect.any(String),
      assignedTo: expect.any(String),
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
  }, 15_000);

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
  }, 15_000);

  it('renders the fixed diagnostic material tabs and removes old tab labels', async () => {
    mockRoute.query = {
      caseId: 'CASE-001',
      taskId: 'TASK-001',
    };

    const wrapper = await mountView();

    expect(wrapper.text()).toContain('采图区');
    expect(wrapper.text()).toContain('患者信息');
    expect(wrapper.text()).toContain('医嘱信息');
    expect(wrapper.text()).toContain('科内会诊');
    expect(wrapper.text()).toContain('实时预览打印');
    expect(wrapper.text()).toContain('历史病理');
    expect(wrapper.text()).toContain('PACS检查');
    expect(wrapper.text()).toContain('报告痕迹');
    expect(wrapper.text()).toContain('蜡块');
    expect(wrapper.text()).toContain('切片');
    expect(wrapper.text()).toContain('备注');
    expect(wrapper.text()).toContain('收费项目');
    expect(wrapper.text()).not.toContain('临床资料');
    expect(wrapper.text()).not.toContain('报告概览');
    expect(wrapper.text()).not.toContain('流程痕迹');
    expect(wrapper.text()).not.toContain('材料与切片');
    expect(wrapper.text()).not.toContain('会诊与修订');
    expect(wrapper.text()).not.toContain('特检医嘱/收费');
    expect(getButtonTexts()).not.toContain('采图');
    expect(getButtonTexts()).not.toContain('医嘱');
    expect(getButtonTexts()).toContain('暂存');
    expect(getButtonTexts()).toContain('初步');
    expect(getButtonTexts()).toContain('复核');
    expect(getButtonTexts()).toContain('签发');
    expect(findByTestId('diagnosis-workbench-resizer-left')).toBeTruthy();
    expect(findByTestId('diagnosis-workbench-resizer-right')).toBeTruthy();

    wrapper.unmount();
  }, 15_000);

  it('disables report actions that do not match the current report status', async () => {
    const wrapper = await mountView();

    expect(findByTestId('workbench-report-save').hasAttribute('disabled')).toBe(
      true,
    );
    expect(
      findByTestId('workbench-report-submit').hasAttribute('disabled'),
    ).toBe(true);
    expect(
      findByTestId('workbench-report-review').hasAttribute('disabled'),
    ).toBe(true);
    expect(findByTestId('workbench-report-sign').hasAttribute('disabled')).toBe(
      true,
    );

    wrapper.unmount();
  }, 15_000);

  it('resizes workstation panes by dragging the split handles', async () => {
    const wrapper = await mountView();
    const layout = findByTestId('diagnosis-workbench-layout');
    const getRectMock = vi.spyOn(layout, 'getBoundingClientRect');
    getRectMock.mockReturnValue({
      bottom: 600,
      height: 600,
      left: 0,
      right: 1600,
      toJSON: () => ({}),
      top: 0,
      width: 1600,
      x: 0,
      y: 0,
    } as DOMRect);

    findByTestId('diagnosis-workbench-resizer-left').dispatchEvent(
      new MouseEvent('pointerdown', {
        bubbles: true,
        button: 0,
        clientX: 500,
      }),
    );
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 660 }));
    window.dispatchEvent(new MouseEvent('pointerup'));
    await flushAsyncWork();

    expect(layout.style.gridTemplateColumns).toContain(
      'minmax(260px, 34fr) 10px minmax(420px, 34fr)',
    );

    findByTestId('diagnosis-workbench-resizer-right').dispatchEvent(
      new MouseEvent('pointerdown', {
        bubbles: true,
        button: 0,
        clientX: 900,
      }),
    );
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 1060 }));
    window.dispatchEvent(new MouseEvent('pointerup'));
    await flushAsyncWork();

    expect(layout.style.gridTemplateColumns).toContain(
      'minmax(420px, 44fr) 10px minmax(320px, 22fr)',
    );

    wrapper.unmount();
  }, 15_000);

  it('renders live print preview tab from the editable report draft', async () => {
    const wrapper = await mountView();
    await selectReportStyleOption('所见即所得模板');
    const patientNameEditor = document.querySelector<HTMLInputElement>(
      '#report-meta-patientName',
    );
    const diagnosisEditor = document.querySelector<HTMLTextAreaElement>(
      '[data-testid="diagnosis-report-diagnosis-editor"]',
    );

    patientNameEditor!.value = '实时预览姓名';
    patientNameEditor!.dispatchEvent(new Event('input'));
    diagnosisEditor!.value = '实时预览诊断';
    diagnosisEditor!.dispatchEvent(new Event('input'));
    await flushAsyncWork();

    await clickMaterialTab('实时预览打印');

    const preview = document.querySelector(
      '[data-testid="diagnosis-workbench-live-print-preview"]',
    );
    expect(preview).toBeTruthy();
    expect(preview?.textContent).toContain('南方医科大学南方医院病理科');
    expect(preview?.textContent).toContain('实时预览姓名');
    expect(preview?.textContent).toContain('实时预览诊断');

    wrapper.unmount();
  });

  it('renders diagnostic material tables from workbench fields', async () => {
    const wrapper = await mountView();

    expect(wrapper.text()).toContain('患者信息');
    expect(wrapper.text()).toContain('报告预览编辑');
    expect(wrapper.text()).not.toContain('病例上下文');
    expect(wrapper.text()).not.toContain('病例进入工作台');
    expect(wrapper.text()).not.toContain('诊断任务流转');
    expect(wrapper.text()).not.toContain('报告编写与流转');
    expect(wrapper.text()).not.toContain('协同与闭环');
    expect(wrapper.text()).toContain('门诊号');
    expect(wrapper.text()).toContain('F2600036');
    expect(wrapper.text()).toContain('范渊旭,女,30岁1月');
    expect(wrapper.text()).toContain('切片检查与诊断');
    expect(wrapper.text()).toContain('1:糖尿病伴肾并发症');
    expect(wrapper.text()).not.toContain(
      '当前病例、报告状态与诊断操作集中在同一区域',
    );
    expect(wrapper.text()).not.toContain('HIS病历浏览');
    expect(wrapper.text()).not.toContain('PACS影像检查');
    expect(wrapper.text()).not.toContain('东软电子病历');
    expect(wrapper.text()).not.toContain('检验报告');
    expect(wrapper.text()).toContain('年龄');
    expect(wrapper.text()).toContain('住院号');
    expect(wrapper.text()).toContain('检查号');
    expect(wrapper.text()).toContain('送检类型');
    expect(wrapper.text()).toContain('影像诊断');
    expect(wrapper.text()).toContain('报告医师');
    expect(wrapper.text()).toContain('诊断信息');
    expect(wrapper.text()).toContain('胃窦活检组织');
    expect(wrapper.text()).toContain('蜡块使用情况');
    expect(wrapper.text()).toContain('2026-06-01 08:30:00');
    expect(wrapper.text()).toContain('切片人');
    expect(wrapper.text()).toContain('申请备注');
    expect(wrapper.text()).toContain('医嘱备注【F2600036-1】');
    expect(wrapper.text()).toContain('免疫组化 CK');
    expect(wrapper.text()).toContain('收费员甲');

    wrapper.unmount();
  });

  it('renders editable report preview content in the middle pane', async () => {
    const wrapper = await mountView();
    await selectReportStyleOption('所见即所得模板');
    const phoneEditor =
      document.querySelector<HTMLInputElement>('#report-meta-phone');
    const patientNameEditor = document.querySelector<HTMLInputElement>(
      '#report-meta-patientName',
    );
    const grossEditor = document.querySelector<HTMLTextAreaElement>(
      '[data-testid="diagnosis-report-gross-editor"]',
    );
    const microscopicEditor = document.querySelector<HTMLTextAreaElement>(
      '[data-testid="diagnosis-report-microscopic-editor"]',
    );
    const diagnosisEditor = document.querySelector<HTMLTextAreaElement>(
      '[data-testid="diagnosis-report-diagnosis-editor"]',
    );

    expect(
      document.querySelector('[data-testid="diagnosis-report-paper"]'),
    ).toBeTruthy();
    expect(phoneEditor?.value).toBe('18170000000');
    expect(patientNameEditor?.value).toBe('范渊旭');
    expect(grossEditor?.value).toBe('大体所见一');
    expect(microscopicEditor?.value).toBe('镜检所见一');
    expect(diagnosisEditor?.value).toBe('最终诊断一');

    patientNameEditor!.value = '编辑后的姓名';
    patientNameEditor!.dispatchEvent(new Event('input'));
    diagnosisEditor!.value = '编辑后的诊断';
    diagnosisEditor!.dispatchEvent(new Event('input'));
    await flushAsyncWork();

    expect(patientNameEditor?.value).toBe('编辑后的姓名');
    expect(diagnosisEditor?.value).toBe('编辑后的诊断');

    wrapper.unmount();
  });

  it('switches the report preview template from the style dropdown', async () => {
    const wrapper = await mountView();
    const reportStyleSelect = findByTestId('report-style-select');

    expect(reportStyleSelect).toBeTruthy();
    expect(document.body.textContent).toContain('默认模板');
    expect(document.body.textContent).toContain('大体所见');
    expect(document.body.textContent).toContain('镜下所见');
    expect(document.body.textContent).toContain('病理诊断');
    expect(document.body.textContent).toContain('临床符合');
    expect(document.body.textContent).toContain('未标记诊断符合');
    for (const flagLabel of ['阳性', '阴性', '签发', '复核']) {
      expect(document.body.textContent).toContain(flagLabel);
    }

    reportStyleSelect!.click();
    await flushAsyncWork();
    const styleDropdownText = document.body.textContent ?? '';
    expect(styleDropdownText).toContain('默认模板');
    expect(styleDropdownText).toContain('所见即所得模板');

    await selectReportStyleOption('所见即所得模板');
    expect(document.body.textContent).toContain('所见即所得模板');
    expect(document.body.textContent).toContain('病理检查报告单');

    const openSelectOptions = async (testId: string) => {
      const selectRoot = document.querySelector<HTMLElement>(
        `[data-testid="${testId}"]`,
      );
      expect(selectRoot).toBeTruthy();
      selectRoot!.click();
      await flushAsyncWork();
      const text = document.body.textContent ?? '';
      document.body.click();
      await flushAsyncWork();
      return text;
    };

    await selectReportStyleOption('默认模板');
    const clinicalDropdownText = await openSelectOptions(
      'classic-clinical-match-select',
    );
    for (const option of [
      '未标记临床符合',
      '临床符合',
      '临床不符合',
      '不宜对比',
    ]) {
      expect(clinicalDropdownText).toContain(option);
    }

    const diagnosisDropdownText = await openSelectOptions(
      'classic-diagnosis-match-select',
    );
    for (const option of [
      '未标记诊断符合',
      '诊断符合',
      '诊断基本符合',
      '诊断不符合',
    ]) {
      expect(diagnosisDropdownText).toContain(option);
    }

    const reportStyleAssertions = [
      ['南海人民医院STR报告', 'STR位点'],
      ['妇科液基细胞学【佛中】', 'TBS分类:'],
      ['细胞DNA定量分析', 'DNA意见:'],
      ['市八鼻咽癌检测报告', 'EBV-DNA:'],
      ['胃癌根治标本病理报告', '病理要点:'],
      ['肿瘤组织起源基因检测报告单', '组织起源预测:'],
      ['肠癌KRAS、NRAS、BRAF、PIK3CA、POLE基因检测（PCR法）', '基因检测结果'],
      ['膀胱癌V1', '分期要点:'],
    ] as const;

    for (const [styleLabel, templateMarker] of reportStyleAssertions) {
      await selectReportStyleOption(styleLabel);
      expect(document.body.textContent).toContain(styleLabel);
      expect(document.body.textContent).toContain(templateMarker);
    }

    wrapper.unmount();
  }, 20_000);

  it('opens report template drawer and appends a selected diagnosis template', async () => {
    const wrapper = await mountView();
    const diagnosisEditor = document.querySelector<HTMLTextAreaElement>(
      '[data-testid="diagnosis-report-diagnosis-editor"]',
    );
    const openTemplateButton = document.querySelector<HTMLElement>(
      '[data-testid="open-final-diagnosis-template"]',
    );

    expect(openTemplateButton).toBeTruthy();
    openTemplateButton!.click();
    await flushAsyncWork();

    expect(document.body.textContent).toContain('病理诊断模板');
    const gastritisTemplate = [
      ...document.body.querySelectorAll<HTMLElement>(
        '.report-template-tree-node',
      ),
    ].find((item) => item.textContent?.includes('慢性浅表性胃炎'));
    expect(gastritisTemplate).toBeTruthy();

    gastritisTemplate!.click();
    await flushAsyncWork();

    const appendButton = document.querySelector<HTMLElement>(
      '[data-testid="append-report-template"]',
    );
    expect(appendButton).toBeTruthy();
    appendButton!.click();
    await flushAsyncWork();

    expect(diagnosisEditor?.value).toContain('最终诊断一');
    expect(diagnosisEditor?.value).toContain('慢性浅表性胃炎');

    wrapper.unmount();
  });

  it('appends a report template by double-clicking the template item', async () => {
    const wrapper = await mountView();
    const diagnosisEditor = document.querySelector<HTMLTextAreaElement>(
      '[data-testid="diagnosis-report-diagnosis-editor"]',
    );
    const openTemplateButton = document.querySelector<HTMLElement>(
      '[data-testid="open-final-diagnosis-template"]',
    );

    expect(openTemplateButton).toBeTruthy();
    openTemplateButton!.click();
    await flushAsyncWork();

    const gastritisTemplate = [
      ...document.body.querySelectorAll<HTMLElement>(
        '.report-template-tree-node',
      ),
    ].find((item) => item.textContent?.includes('慢性浅表性胃炎'));
    expect(gastritisTemplate).toBeTruthy();

    gastritisTemplate!.dispatchEvent(
      new MouseEvent('dblclick', { bubbles: true }),
    );
    await flushAsyncWork();

    expect(diagnosisEditor?.value).toContain('最终诊断一');
    expect(diagnosisEditor?.value).toContain('慢性浅表性胃炎');

    wrapper.unmount();
  });

  it('renders diagnosis capture in the first tab and imports diagnosis images', async () => {
    createObjectUrlMock.mockImplementation(
      (file) => `blob:${(file as File).name}`,
    );
    const wrapper = await mountView();
    await selectReportStyleOption('所见即所得模板');

    expect(getButtonTexts()).not.toContain('采图');
    expect(wrapper.text()).toContain('采图区');
    expect(wrapper.text()).toContain('已采图像');
    expect(wrapper.text()).toContain('摄像头预览');

    const fileInput =
      document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(fileInput).toBeTruthy();

    const file = new File(['image-bytes'], 'diagnosis-upload.jpg', {
      type: 'image/jpeg',
    });
    const secondFile = new File(['image-bytes-2'], 'diagnosis-second.jpg', {
      type: 'image/jpeg',
    });
    Object.defineProperty(fileInput!, 'files', {
      configurable: true,
      value: [file, secondFile],
    });
    fileInput!.dispatchEvent(new Event('change'));
    await flushAsyncWork();

    expect(createObjectUrlMock).toHaveBeenCalledWith(file);
    expect(createObjectUrlMock).toHaveBeenCalledWith(secondFile);
    expect(wrapper.text()).toContain('diagnosis-upload.jpg');
    expect(wrapper.text()).toContain('diagnosis-second.jpg');
    expect(wrapper.text()).toContain('当前诊断');

    const reportImageCanvas = document.querySelector<HTMLElement>(
      '[data-testid="diagnosis-report-microscopic-image-canvas"]',
    );
    expect(reportImageCanvas).toBeTruthy();
    const reportImage = reportImageCanvas!.querySelector<HTMLImageElement>(
      'img[alt="diagnosis-upload.jpg"]',
    );
    expect(reportImage).toBeTruthy();
    const secondReportImage =
      reportImageCanvas!.querySelector<HTMLImageElement>(
        'img[alt="diagnosis-second.jpg"]',
      );
    expect(secondReportImage).toBeTruthy();
    expect(reportImage?.src).toContain('blob:diagnosis-upload.jpg');
    expect(secondReportImage?.src).toContain('blob:diagnosis-second.jpg');
    expect(secondReportImage?.style.left).toBe('12px');
    expect(secondReportImage?.style.top).toBe('12px');
    expect(reportImage?.style.left).toBe('124px');
    expect(reportImage?.style.top).toBe('12px');

    reportImage!.dispatchEvent(
      new MouseEvent('pointerdown', {
        bubbles: true,
        button: 0,
        clientX: 20,
        clientY: 20,
      }),
    );
    window.dispatchEvent(
      new MouseEvent('pointermove', {
        clientX: 62,
        clientY: 48,
      }),
    );
    window.dispatchEvent(new MouseEvent('pointerup'));
    await flushAsyncWork();

    expect(reportImage?.style.left).toBe('166px');
    expect(reportImage?.style.top).toBe('40px');

    const deleteButton = document.querySelector<HTMLButtonElement>(
      '[aria-label="删除图片 diagnosis-upload.jpg"]',
    );
    expect(deleteButton).toBeTruthy();
    deleteButton!.click();
    await flushAsyncWork();

    expect(revokeObjectUrlMock).toHaveBeenCalledWith(
      'blob:diagnosis-upload.jpg',
    );
    expect(wrapper.text()).not.toContain('diagnosis-upload.jpg');
    expect(
      reportImageCanvas!.querySelector('img[alt="diagnosis-upload.jpg"]'),
    ).toBeNull();
    expect(wrapper.text()).toContain('diagnosis-second.jpg');

    wrapper.unmount();
  });

  it('shows capture tab before patient info and keeps patient info separate from capture panel', async () => {
    const wrapper = await mountView();

    const tabLabels = [
      ...document.querySelectorAll<HTMLElement>('.el-tabs__item, [role="tab"]'),
    ]
      .map((item) => item.textContent?.trim() ?? '')
      .filter(Boolean);

    expect(tabLabels.indexOf('采图区')).toBeGreaterThanOrEqual(0);
    expect(tabLabels.indexOf('患者信息')).toBeGreaterThanOrEqual(0);
    expect(tabLabels.indexOf('采图区')).toBeLessThan(tabLabels.indexOf('患者信息'));
    expect(
      document
        .querySelector<HTMLElement>('.el-tabs__item.is-active, [role="tab"][aria-selected="true"]')
        ?.textContent,
    ).toContain('采图区');

    await clickMaterialTab('患者信息');

    expect(
      document
        .querySelector<HTMLElement>('.el-tabs__item.is-active, [role="tab"][aria-selected="true"]')
        ?.textContent,
    ).toContain('患者信息');
    expect(wrapper.text()).toContain('病人ID');
    expect(wrapper.text()).toContain('申请单号');

    wrapper.unmount();
  });

  it('renders medical order as the first diagnostic material tab', async () => {
    const wrapper = await mountView();

    expect(getButtonTexts()).not.toContain('医嘱');
    expect(mockRouter.push).not.toHaveBeenCalled();
    const orderPane = document.querySelector(
      '[data-testid="diagnosis-workbench-medical-order-pane"]',
    );
    expect(orderPane).toBeTruthy();
    const orderPaneText = orderPane?.textContent ?? '';
    expect(orderPaneText).toContain('医嘱区');
    expect(orderPaneText).not.toContain('病理号: F2600036');
    expect(orderPaneText).toContain('A1 胃窦组织');
    expect(orderPaneText).toContain('医嘱项目: 未收费');
    expect(orderPaneText).toContain('医嘱项目待选列表');
    expect(orderPaneText).toContain('执行收费');
    expect(orderPaneText).toContain('收费管理');
    expect(orderPaneText).not.toContain('删除');
    expect(orderPaneText).toContain('执行中');
    expect(orderPaneText).toContain('待收费');
    expect(orderPaneText).not.toContain('IN_PROGRESS');
    expect(orderPaneText).not.toContain('PENDING');
    expect(orderPaneText).toContain('特殊染色');
    expect(orderPaneText).toContain('免疫组化套餐');

    wrapper.unmount();
  });

  it('filters medical order candidates by dictionary category', async () => {
    const wrapper = await mountView();

    expect(getOrderPaneText()).toContain('免疫组化');
    expect(getOrderPaneText()).toContain('Fish');
    expect(getOrderPaneText()).toContain('基因检测');
    expect(getOrderPaneText()).toContain('特殊染色');
    expect(getOrderPaneText()).toContain('免疫组化套餐');
    expect(getOrderPaneText()).toContain('Ki-67');
    expect(getOrderPaneText()).toContain('EGFR基因突变');
    expect(() =>
      findByTestId('medical-order-template-group-ALPHA_BETA'),
    ).toThrow();

    findByTestId('medical-order-template-group-FISH').click();
    await flushAsyncWork();

    expect(getOrderPaneText()).toContain('1p19q(Fish)');
    expect(getOrderPaneText()).toContain('Fish套餐');
    expect(() =>
      findByTestId('medical-order-candidate-item-ITEM-001'),
    ).toThrow();
    expect(() =>
      findByTestId('medical-order-candidate-item-ITEM-005'),
    ).toThrow();

    findByTestId('medical-order-template-group-MYYG').click();
    await flushAsyncWork();

    expect(getOrderPaneText()).toContain('C1q免疫荧光');
    expect(getOrderPaneText()).not.toContain('1p19q(Fish)');

    wrapper.unmount();
  });

  it('keeps medical order group and letter filters mutually exclusive', async () => {
    const wrapper = await mountView();

    findByTestId('medical-order-template-group-FISH').click();
    await flushAsyncWork();
    findByTestId('medical-order-letter-F').click();
    await flushAsyncWork();

    const keywordRoot = findByTestId('medical-order-candidate-keyword');
    const keywordInput =
      keywordRoot instanceof HTMLInputElement
        ? keywordRoot
        : keywordRoot.querySelector<HTMLInputElement>('input');
    expect(keywordInput).toBeTruthy();
    keywordInput!.value = '套餐';
    keywordInput!.dispatchEvent(new Event('input'));
    await flushAsyncWork();

    expect(getOrderPaneText()).toContain('Fish套餐');
    expect(getOrderPaneText()).not.toContain('1p19q(Fish)');
    expect(getOrderPaneText()).not.toContain('C1q免疫荧光');

    findByTestId('medical-order-clear-filters').click();
    await flushAsyncWork();

    expect(getOrderPaneText()).toContain('Fish套餐');
    expect(getOrderPaneText()).toContain('1p19q(Fish)');
    expect(getOrderPaneText()).toContain('特殊染色');
    expect(getOrderPaneText()).toContain('C1q免疫荧光');

    wrapper.unmount();
  });

  it('does not show fallback medical order candidates outside dictionaries', async () => {
    const wrapper = await mountView();

    findByTestId('medical-order-template-group-DNA').click();
    await flushAsyncWork();

    expect(getOrderPaneText()).toContain('EGFR基因突变');
    expect(getOrderPaneText()).not.toContain('TCR α/β检测');
    expect(getOrderPaneText()).not.toContain('快速切片');
    expect(getOrderPaneText()).not.toContain('借阅切片');
    expect(getOrderPaneText()).not.toContain('未入字典套餐');

    wrapper.unmount();
  });

  it('shows an empty state when medical order dictionaries are empty', async () => {
    listMedicalOrderDictsMock.mockResolvedValueOnce([]);
    const wrapper = await mountView();

    expect(getOrderPaneText()).toContain('暂无符合条件的医嘱项目');
    expect(getOrderPaneText()).not.toContain('EGFR基因突变');
    expect(getOrderPaneText()).not.toContain('快速切片');
    expect(getOrderPaneText()).not.toContain('未入字典套餐');

    wrapper.unmount();
  });

  it('adds selected medical order candidates in batch', async () => {
    mockAccessStore.accessCodes = [
      'PERM_M4_WORKBENCH_QUERY',
      'PERM_M4_MEDICAL_ORDER_CREATE',
    ];
    const wrapper = await mountView();

    findByTestId('medical-order-candidate-item-ITEM-001')
      .querySelector<HTMLButtonElement>('button')
      ?.click();
    findByTestId('medical-order-candidate-package-PKG-001')
      .querySelector<HTMLButtonElement>('button')
      ?.click();
    await flushAsyncWork();

    findButton('添加选中').click();
    await flushAsyncWork();
    findButton('提交医嘱').click();
    await flushAsyncWork();

    expect(createMedicalOrderMock).toHaveBeenCalledTimes(3);
    expect(createMedicalOrderMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        orderContent: '补做特殊染色（蜡块: A1 胃窦组织）',
        orderType: 'SPECIAL_STAIN',
      }),
    );
    expect(createMedicalOrderMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        orderContent: '补做免疫组化 CK（蜡块: A1 胃窦组织）',
        orderType: 'IMMUNOHISTOCHEMISTRY',
      }),
    );
    expect(createMedicalOrderMock).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        orderContent: '补做特殊染色（蜡块: A1 胃窦组织）',
        orderType: 'SPECIAL_STAIN',
      }),
    );

    wrapper.unmount();
  });

  it('hides pathology number in medical order block dropdown and item list', async () => {
    mockAccessStore.accessCodes = [
      'PERM_M4_WORKBENCH_QUERY',
      'PERM_M4_MEDICAL_ORDER_CREATE',
    ];
    const initialWorkbench = workbenchFixtureByCaseId['CASE-001']!;
    getDiagnosticWorkbenchMock.mockResolvedValueOnce({
      ...initialWorkbench,
      blocks: [
        {
          ...initialWorkbench.blocks[0]!,
          blockCode: 'F2600036-A1',
          description: 'F2600036 胃窦组织',
        },
      ],
      medicalOrders: [
        {
          ...initialWorkbench.medicalOrders[0]!,
          orderContent: 'HE 染色（蜡块: F2600036-A1 胃窦组织）',
        },
      ],
    });
    const wrapper = await mountView();

    const orderPaneText = getOrderPaneText();
    expect(orderPaneText).toContain('A1 胃窦组织');
    expect(orderPaneText).toContain('HE 染色（蜡块: A1 胃窦组织）');
    expect(orderPaneText).not.toContain('F2600036');

    wrapper.unmount();
  });

  it('creates a medical order from a selected order item and refreshes the workbench', async () => {
    mockAccessStore.accessCodes = [
      'PERM_M4_WORKBENCH_QUERY',
      'PERM_M4_MEDICAL_ORDER_CREATE',
    ];
    const wrapper = await mountView();

    const orderItemButton = [...document.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('【特殊染色】'),
    ) as HTMLElement;
    expect(orderItemButton).toBeTruthy();
    orderItemButton.dispatchEvent(
      new MouseEvent('dblclick', { bubbles: true }),
    );
    await flushAsyncWork();

    findButton('提交医嘱').click();
    await flushAsyncWork();

    expect(createMedicalOrderMock).toHaveBeenCalledWith({
      caseId: 'CASE-001',
      orderContent: '补做特殊染色（蜡块: A1 胃窦组织）',
      orderItemId: 'ITEM-001',
      orderType: 'SPECIAL_STAIN',
      remarks: undefined,
    });
    expect(createMedicalOrderMock.mock.calls[0]?.[0]).not.toHaveProperty(
      'operatorName',
    );
    expect(createMedicalOrderMock.mock.calls[0]?.[0]).not.toHaveProperty(
      'operatorUserId',
    );
    expect(getDiagnosticWorkbenchMock).toHaveBeenLastCalledWith('CASE-001');

    wrapper.unmount();
  });

  it('creates one medical order per package item', async () => {
    mockAccessStore.accessCodes = [
      'PERM_M4_WORKBENCH_QUERY',
      'PERM_M4_MEDICAL_ORDER_CREATE',
    ];
    const wrapper = await mountView();

    const packageButton = [...document.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('【免疫组化套餐2项】'),
    ) as HTMLElement;
    expect(packageButton).toBeTruthy();
    packageButton.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    await flushAsyncWork();

    findButton('提交医嘱').click();
    await flushAsyncWork();

    expect(createMedicalOrderMock).toHaveBeenCalledTimes(2);
    expect(createMedicalOrderMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        orderContent: '补做特殊染色（蜡块: A1 胃窦组织）',
        orderType: 'SPECIAL_STAIN',
      }),
    );
    expect(createMedicalOrderMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        orderContent: '补做免疫组化 CK（蜡块: A1 胃窦组织）',
        orderType: 'IMMUNOHISTOCHEMISTRY',
      }),
    );

    wrapper.unmount();
  });

  it('opens charge management dialog from the medical order pane', async () => {
    const wrapper = await mountView();

    findButton('收费管理').click();
    await flushAsyncWork();

    expect(document.body.textContent).toContain('收费管理');
    expect(document.body.textContent).toContain('病理号:');
    expect(document.body.textContent).toContain('F2600036-A1');
    expect(document.body.textContent).toContain('确认完成收费');
    expect(document.body.textContent).toContain('确认病人出院');
    expect(document.body.textContent).toContain('重新执行收费');

    wrapper.unmount();
  });

  it('keeps submit button disabled before adding medical order drafts', async () => {
    mockAccessStore.accessCodes = [
      'PERM_M4_WORKBENCH_QUERY',
      'PERM_M4_MEDICAL_ORDER_CREATE',
    ];
    const wrapper = await mountView();

    const submitButton = findButton('提交医嘱');
    expect(submitButton).toBeTruthy();
    expect(submitButton.hasAttribute('disabled')).toBe(true);
    expect(getOrderPaneText()).not.toContain('请先从下方待选列表添加医嘱草稿');

    wrapper.unmount();
  });

  it('executes billing for all uncharged medical orders and refreshes status', async () => {
    mockAccessStore.accessCodes = [
      'PERM_M4_WORKBENCH_QUERY',
      'PERM_M4_MEDICAL_ORDER_CREATE',
    ];
    const initialWorkbench = workbenchFixtureByCaseId['CASE-001']!;
    const chargedWorkbench: DiagnosticWorkbenchView = {
      ...initialWorkbench,
      medicalOrders: initialWorkbench.medicalOrders.map((item) => ({
        ...item,
        billingStatus: 'SUCCESS',
      })),
    };
    getDiagnosticWorkbenchMock
      .mockResolvedValueOnce(initialWorkbench)
      .mockResolvedValueOnce(chargedWorkbench);
    const wrapper = await mountView();

    findButton('执行收费').click();
    await flushAsyncWork();

    expect(executeMedicalOrderBillingMock).toHaveBeenCalledWith({
      caseId: 'CASE-001',
      orderIds: undefined,
      remarks: '执行收费',
    });
    expect(getDiagnosticWorkbenchMock).toHaveBeenLastCalledWith('CASE-001');
    expect(getOrderPaneText()).toContain('未收费 (0) 已收费 (1)');
    expect(getOrderPaneText()).toContain('已收费');

    wrapper.unmount();
  });

  it('executes billing only for selected persisted medical orders', async () => {
    mockAccessStore.accessCodes = [
      'PERM_M4_WORKBENCH_QUERY',
      'PERM_M4_MEDICAL_ORDER_CREATE',
    ];
    const initialWorkbench = workbenchFixtureByCaseId['CASE-001']!;
    getDiagnosticWorkbenchMock.mockResolvedValueOnce({
      ...initialWorkbench,
      medicalOrders: [
        initialWorkbench.medicalOrders[0]!,
        {
          ...initialWorkbench.medicalOrders[0]!,
          orderContent: '特殊染色 PAS',
          orderId: 'ORDER-002',
          orderNumber: 'MO-002',
        },
      ],
    });
    const wrapper = await mountView();

    document
      .querySelector<HTMLElement>(
        '.medical-order-table .el-table__body .el-checkbox',
      )
      ?.click();
    await flushAsyncWork();
    findButton('执行收费').click();
    await flushAsyncWork();

    expect(executeMedicalOrderBillingMock).toHaveBeenCalledWith({
      caseId: 'CASE-001',
      orderIds: ['ORDER-001'],
      remarks: '执行收费',
    });

    wrapper.unmount();
  });

  it('confirms billing completion from charge manager and refreshes status', async () => {
    mockAccessStore.accessCodes = [
      'PERM_M4_WORKBENCH_QUERY',
      'PERM_M4_MEDICAL_ORDER_CREATE',
    ];
    const initialWorkbench = workbenchFixtureByCaseId['CASE-001']!;
    const chargedWorkbench: DiagnosticWorkbenchView = {
      ...initialWorkbench,
      medicalOrders: initialWorkbench.medicalOrders.map((item) => ({
        ...item,
        billingStatus: 'SUCCESS',
      })),
    };
    getDiagnosticWorkbenchMock
      .mockResolvedValueOnce(initialWorkbench)
      .mockResolvedValueOnce(chargedWorkbench);
    const wrapper = await mountView();

    findButton('收费管理').click();
    await flushAsyncWork();
    findButton('确认完成收费').click();
    await flushAsyncWork();

    expect(confirmMedicalOrderBillingMock).toHaveBeenCalledWith({
      caseId: 'CASE-001',
      orderIds: undefined,
      remarks: '确认完成收费',
    });
    expect(getOrderPaneText()).toContain('未收费 (0) 已收费 (1)');

    wrapper.unmount();
  });

  it('writes the edited report document when printing', async () => {
    const printMock = vi.fn();
    const focusMock = vi.fn();
    const documentOpenMock = vi.fn();
    const documentWriteMock = vi.fn();
    const documentCloseMock = vi.fn();
    windowOpenMock.mockReturnValue({
      document: {
        close: documentCloseMock,
        open: documentOpenMock,
        write: documentWriteMock,
      },
      focus: focusMock,
      print: printMock,
    } as unknown as Window);
    const wrapper = await mountView();
    await selectReportStyleOption('所见即所得模板');
    const patientNameEditor = document.querySelector<HTMLInputElement>(
      '#report-meta-patientName',
    );
    const diagnosisEditor = document.querySelector<HTMLTextAreaElement>(
      '[data-testid="diagnosis-report-diagnosis-editor"]',
    );

    patientNameEditor!.value = '打印中的姓名';
    patientNameEditor!.dispatchEvent(new Event('input'));
    diagnosisEditor!.value = '打印中的诊断';
    diagnosisEditor!.dispatchEvent(new Event('input'));
    const fileInput =
      document.querySelector<HTMLInputElement>('input[type="file"]');
    const file = new File(['image-bytes'], 'print-upload.jpg', {
      type: 'image/jpeg',
    });
    Object.defineProperty(fileInput!, 'files', {
      configurable: true,
      value: [file],
    });
    fileInput!.dispatchEvent(new Event('change'));
    await flushAsyncWork();

    (
      [...document.querySelectorAll('button')].find(
        (button) => button.textContent?.trim() === '打印',
      ) as HTMLElement
    ).click();
    await flushAsyncWork();

    expect(windowOpenMock).toHaveBeenCalledWith('', '_blank');
    expect(documentOpenMock).toHaveBeenCalled();
    expect(documentWriteMock).toHaveBeenCalledWith(
      expect.stringContaining('打印中的诊断'),
    );
    expect(documentWriteMock).toHaveBeenCalledWith(
      expect.stringContaining('打印中的姓名'),
    );
    expect(documentWriteMock).toHaveBeenCalledWith(
      expect.stringContaining('print-upload.jpg'),
    );
    expect(documentWriteMock).toHaveBeenCalledWith(
      expect.not.stringContaining('#dddddd'),
    );
    expect(documentCloseMock).toHaveBeenCalled();
    expect(focusMock).toHaveBeenCalled();
    expect(printMock).toHaveBeenCalled();

    wrapper.unmount();
  });

  it('blocks submitting when the current report is not a draft', async () => {
    const wrapper = await mountView();

    expect(
      findByTestId('workbench-report-submit').hasAttribute('disabled'),
    ).toBe(true);
    findByTestId('workbench-report-submit').click();
    await flushAsyncWork();

    expect(savePathologyReportDraftMock).not.toHaveBeenCalled();
    expect(submitPathologyReportMock).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it('keeps remarks editable and shows placeholder save feedback', async () => {
    const wrapper = await mountView();
    const saveButton = [...document.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('保存'),
    ) as HTMLElement;

    saveButton.click();
    await flushAsyncWork();

    expect(messageInfoMock).toHaveBeenCalledWith(
      '当前仅支持前端编辑，暂未接入保存接口',
    );

    wrapper.unmount();
  });
});
