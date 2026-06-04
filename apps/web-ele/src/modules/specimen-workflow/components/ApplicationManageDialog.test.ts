import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createButtonStub,
  createDialogStub,
  createInputStub,
  createModelTextStub,
  createOptionStub,
  createPassthroughStub,
  createSelectStub,
  createWorkflowSectionCardStub,
} from '../test-utils/component-stubs';

const {
  mockAccessStore,
  mockCreateApplication,
  mockDuplicateCheckApplications,
  mockGetApplicationDetail,
  mockLookupApplicationPatientByIdentifier,
  mockUpdateApplication,
  mockUserStore,
} = vi.hoisted(() => ({
  mockAccessStore: {
    accessCodes: [
      'PERM_APPLICATION_UPDATE',
      'PERM_WORKFLOW_REFERENCE_QUERY',
    ] as string[],
  },
  mockCreateApplication: vi.fn(),
  mockDuplicateCheckApplications: vi.fn(),
  mockGetApplicationDetail: vi.fn(),
  mockLookupApplicationPatientByIdentifier: vi.fn(),
  mockUpdateApplication: vi.fn(),
  mockUserStore: {
    userInfo: {
      realName: '当前用户',
      userId: 'USER-CURRENT',
    },
  },
}));

vi.mock('@vben/stores', () => ({
  useAccessStore: () => mockAccessStore,
  useUserStore: () => mockUserStore,
}));

vi.mock('#/modules/system-management/api/workflow-reference-service', () => ({
  createEmptyWorkflowReferenceOptions: () => ({
    clinicalSymptoms: [],
  }),
  loadWorkflowReferenceOptionsSafely: vi.fn(async () => ({
    clinicalSymptoms: [],
  })),
}));

vi.mock(
  '#/modules/system-management/components/ReferenceOptionSelect.vue',
  () => ({
    default: createModelTextStub('data-placeholder'),
  }),
);

vi.mock('#/modules/system-management/constants', () => ({
  GENDER_OPTIONS: [
    { label: '男', value: 'M' },
    { label: '女', value: 'F' },
  ],
}));

vi.mock('../api/specimen-workflow-service', () => ({
  createApplication: mockCreateApplication,
  duplicateCheckApplications: mockDuplicateCheckApplications,
  getApplicationDetail: mockGetApplicationDetail,
  importClinicalApplication: vi.fn(),
  lookupApplicationPatientByIdentifier:
    mockLookupApplicationPatientByIdentifier,
  updateApplication: mockUpdateApplication,
}));

vi.mock('./WorkflowSectionCard.vue', () => ({
  default: createWorkflowSectionCardStub(),
}));

vi.mock('element-plus', () => {
  return {
    ElAlert: createPassthroughStub(),
    ElButton: createButtonStub(),
    ElDatePicker: createInputStub(),
    ElDialog: createDialogStub(),
    ElEmpty: createPassthroughStub(),
    ElForm: createPassthroughStub('form'),
    ElFormItem: createPassthroughStub(),
    ElInput: createInputStub(),
    ElMessage: {
      info: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),
    },
    ElOption: createOptionStub(),
    ElSelect: createSelectStub(),
    ElTabPane: createPassthroughStub('section'),
    ElTabs: createPassthroughStub(),
  };
});

import ApplicationManageDialog from './ApplicationManageDialog.vue';

function buildApplicationDetail() {
  return {
    abnormalFlag: false,
    applicationDate: '2026-05-28',
    applicationFormStatus: 'PENDING',
    applicationNo: 'M2-EDIT-001',
    applicationType: 'ROUTINE',
    clinicalDiagnosis: '胃镜活检',
    clinicalSymptom: null,
    createdAt: '2026-05-28T08:00:00',
    currentNode: 'SUBMITTED',
    deletable: true,
    editable: true,
    externalOrderNo: null,
    id: 'APP-EDIT-001',
    operationDisabledReason: null,
    patientAge: '45',
    patientGender: 'M',
    patientId: 'PAT-001',
    patientIdentifier: 'PATIENT-NO-001',
    patientName: '张三',
    recentEvents: [],
    remarks: null,
    sourceHospitalId: null,
    sourceHospitalName: '协作医院',
    specimens: [],
    status: 'SUBMITTED',
    submissionDate: '2026-05-28',
    submittingDepartmentId: null,
    submittingDepartmentName: null,
    submittingDoctorName: null,
    submittingDoctorUserId: null,
    thirdPartySource: null,
    updatedAt: '2026-05-28T09:00:00',
    voided: false,
  };
}

async function flushAll() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

async function mountDialog() {
  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp({
    render: () =>
      h(ApplicationManageDialog, {
        applicationId: 'APP-EDIT-001',
        mode: 'edit',
        modelValue: true,
        'onUpdate:modelValue': vi.fn(),
        onSubmitted: vi.fn(),
      }),
  });
  app.directive('loading', {
    mounted() {},
    updated() {},
  });
  app.mount(root);
  await flushAll();
  return { app, root };
}

describe('ApplicationManageDialog', () => {
  afterEach(() => {
    mockCreateApplication.mockReset();
    mockDuplicateCheckApplications.mockReset();
    mockGetApplicationDetail.mockReset();
    mockLookupApplicationPatientByIdentifier.mockReset();
    mockUpdateApplication.mockReset();
    document.body.innerHTML = '';
  });

  it('loads detail and submits updates in edit mode', async () => {
    mockGetApplicationDetail.mockResolvedValue(buildApplicationDetail());
    mockDuplicateCheckApplications.mockResolvedValue({
      items: [],
      suggestedAction: 'ALLOW',
    });
    mockUpdateApplication.mockResolvedValue({ id: 'APP-EDIT-001' });

    const { app, root } = await mountDialog();

    expect(mockGetApplicationDetail).toHaveBeenCalledWith('APP-EDIT-001');
    expect(root.textContent).toContain('编辑申请单');
    expect(root.textContent).not.toContain('第三方导入');
    expect(root.textContent).not.toContain('送检科室');
    expect(root.textContent).not.toContain('送检医生');
    expect(root.textContent).not.toContain('送检部位');
    expect(root.textContent).not.toContain('离体时间');
    expect(
      root.querySelector('input[placeholder="请选择申请日期"]'),
    ).not.toBeNull();
    expect(
      root.querySelector('input[placeholder="请选择送检日期"]'),
    ).not.toBeNull();
    expect(
      (
        root.querySelector(
          'input[placeholder="患者编号 / 门诊号 / 住院号"]',
        ) as HTMLInputElement | null
      )?.value,
    ).toBe('PATIENT-NO-001');

    const saveButton = [...root.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === '保存',
    );
    saveButton?.click();
    await flushAll();

    expect(mockCreateApplication).not.toHaveBeenCalled();
    expect(mockUpdateApplication).toHaveBeenCalledWith(
      'APP-EDIT-001',
      expect.objectContaining({
        applicationNo: 'M2-EDIT-001',
        patientName: '张三',
      }),
    );
    expect(mockUpdateApplication.mock.calls[0]?.[1]).not.toHaveProperty(
      'specimenSite',
    );
    expect(mockUpdateApplication.mock.calls[0]?.[1]).not.toHaveProperty(
      'specimenRemovalTime',
    );
    expect(mockUpdateApplication.mock.calls[0]?.[1]).not.toHaveProperty(
      'submittingDepartmentId',
    );
    expect(mockUpdateApplication.mock.calls[0]?.[1]).not.toHaveProperty(
      'submittingDoctorName',
    );

    app.unmount();
  });

  it('shows the page error when loading application detail fails', async () => {
    mockGetApplicationDetail.mockRejectedValue(new Error('申请单详情加载失败'));

    const { app, root } = await mountDialog();

    expect(root.textContent).toContain('申请单详情加载失败');

    app.unmount();
  });
});
