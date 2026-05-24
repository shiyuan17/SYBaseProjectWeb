import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockAccessStore, mockRoute, mockRouter, mockUserStore } = vi.hoisted(() => ({
  mockAccessStore: {
    accessCodes: [] as string[],
  },
  mockRoute: {
    query: {
      action: 'register',
      applicationId: 'APP-ID',
    } as Record<string, string>,
  },
  mockRouter: {
    push: vi.fn(),
    replace: vi.fn(),
  },
  mockUserStore: {
    userInfo: {
      realName: '测试用户',
      userId: 'USER-001',
    },
  },
}));

const registerDialogProps = vi.hoisted(() => ({
  applicationId: '',
  modelValue: false,
}));

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => mockRouter,
}));

vi.mock('@vben/common-ui', () => ({
  Page: {
    props: ['title'],
    template: '<div><slot /></div>',
  },
}));

vi.mock('@vben/stores', () => ({
  useAccessStore: () => mockAccessStore,
  useUserStore: () => mockUserStore,
}));

vi.mock('#/modules/system-management/api/workflow-reference-service', () => ({
  createEmptyWorkflowReferenceOptions: () => ({
    clinicalSymptoms: [],
    collectionModes: [],
    containerNames: [],
    fixationLiquidTypes: [],
    specimenTypes: [],
  }),
  loadWorkflowReferenceOptionsSafely: vi.fn(async () => ({
    clinicalSymptoms: [{ label: '肿物', value: '肿物' }],
    collectionModes: [{ label: '手术', value: 'SURGERY' }],
    containerNames: [{ label: '标本瓶', value: '标本瓶' }],
    fixationLiquidTypes: [{ label: '10% 中性福尔马林', value: 'FORMALIN' }],
    specimenTypes: [{ label: '常规', value: 'ROUTINE' }],
  })),
}));

vi.mock('#/modules/system-management/components/DepartmentSelect.vue', () => ({
  default: {
    props: ['modelValue', 'placeholder'],
    template: '<div />',
  },
}));

vi.mock('#/modules/system-management/components/ReferenceOptionSelect.vue', () => ({
  default: {
    props: ['modelValue', 'options', 'placeholder'],
    template: '<div />',
  },
}));

vi.mock('#/modules/system-management/components/SystemUserSelect.vue', () => ({
  default: {
    props: ['modelValue', 'selectedLabel', 'placeholder'],
    template: '<div />',
  },
}));

vi.mock('../components/SpecimenRegisterDialog.vue', () => ({
  default: {
    props: ['applicationId', 'modelValue'],
    setup(props: { applicationId: string; modelValue: boolean }) {
      registerDialogProps.applicationId = props.applicationId;
      registerDialogProps.modelValue = props.modelValue;
      return {};
    },
    template: '<div data-testid="register-dialog-proxy" />',
  },
}));

vi.mock('../api/specimen-workflow-service', () => ({
  completeFixation: vi.fn(),
  getApplicationDetail: vi.fn(async () => ({
    abnormalFlag: false,
    applicationDate: '2026-05-21',
    applicationFormStatus: 'PENDING',
    applicationNo: 'APP-001',
    applicationType: 'ROUTINE',
    clinicalDiagnosis: '诊断',
    clinicalSymptom: null,
    createdAt: '2026-05-21T10:00:00',
    currentNode: 'SPECIMEN_COLLECTION',
    externalOrderNo: null,
    id: 'APP-ID',
    patientAge: '40',
    patientGender: 'F',
    patientId: 'P-001',
    patientName: '张三',
    recentEvents: [],
    remarks: null,
    sourceHospitalId: null,
    sourceHospitalName: '本院',
    specimenRemovalTime: '2026-05-21T09:30:00',
    specimenSite: '胃',
    specimens: [],
    status: 'SUBMITTED',
    submissionDate: '2026-05-21',
    submittingDepartmentId: 'DEP-1',
    submittingDepartmentName: '外科',
    submittingDoctorName: '医生A',
    submittingDoctorUserId: 'DOC-1',
    thirdPartySource: null,
    updatedAt: '2026-05-21T10:00:00',
  })),
  getLatestRegistrationResult: vi.fn(async () => ({
    applicationId: 'APP-ID',
    labelPrintBatchNo: null,
    labelPrintMessage: null,
    labelPrintSuccess: false,
    registrationSnapshot: null,
    specimens: [],
  })),
  listSpecimens: vi.fn(async () => ({
    items: [],
    page: 1,
    size: 20,
    summary: {
      abnormalCount: 0,
      labelPrintedCount: 0,
      pendingLabelCount: 0,
      totalCount: 0,
    },
    total: 0,
  })),
  retryLabelPrint: vi.fn(),
  startFixation: vi.fn(),
}));

import SpecimenManagementView from './SpecimenManagementView.vue';

describe('SpecimenManagementView', () => {
  afterEach(() => {
    mockAccessStore.accessCodes = [];
    mockRouter.push.mockReset();
    mockRouter.replace.mockReset();
    registerDialogProps.applicationId = '';
    registerDialogProps.modelValue = false;
    document.body.innerHTML = '';
  });

  it('opens registration dialog directly from route query application id', async () => {
    mockAccessStore.accessCodes = [
      'PERM_APPLICATION_DETAIL_QUERY',
      'PERM_SPECIMEN_REGISTER',
    ];

    const root = document.createElement('div');
    document.body.append(root);

    const app = createApp({
      render: () => h(SpecimenManagementView),
    });

    app.mount(root);
    await nextTick();
    await Promise.resolve();
    await nextTick();

    expect(registerDialogProps.applicationId).toBe('APP-ID');
    expect(registerDialogProps.modelValue).toBe(true);
    expect(document.body.textContent).toContain('工作台概览');
    expect(document.body.textContent).toContain('标本列表');

    app.unmount();
    root.remove();
  });
});
