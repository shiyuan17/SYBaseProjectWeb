import { createApp, defineComponent, h, nextTick, reactive } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  messageInfoMock,
  messageSuccessMock,
  messageWarningMock,
  mockAccessStore,
  mockCreateApplication,
  mockDuplicateCheckApplications,
  mockGetApplicationDetail,
  mockImportClinicalApplication,
  mockLookupApplicationPatientByIdentifier,
  mockLoadWorkflowReferenceOptionsSafely,
  mockUpdateApplication,
} = vi.hoisted(() => ({
  messageInfoMock: vi.fn(),
  messageSuccessMock: vi.fn(),
  messageWarningMock: vi.fn(),
  mockAccessStore: {
    accessCodes: [] as string[],
  },
  mockCreateApplication: vi.fn(),
  mockDuplicateCheckApplications: vi.fn(),
  mockGetApplicationDetail: vi.fn(),
  mockImportClinicalApplication: vi.fn(),
  mockLookupApplicationPatientByIdentifier: vi.fn(),
  mockLoadWorkflowReferenceOptionsSafely: vi.fn(),
  mockUpdateApplication: vi.fn(),
}));

vi.mock('@vben/stores', () => ({
  useAccessStore: () => mockAccessStore,
}));

vi.mock('element-plus', () => ({
  ElMessage: {
    info: messageInfoMock,
    success: messageSuccessMock,
    warning: messageWarningMock,
  },
}));

vi.mock('#/modules/system-management/api/workflow-reference-service', () => ({
  createEmptyWorkflowReferenceOptions: () => ({
    clinicalSymptoms: [],
  }),
  loadWorkflowReferenceOptionsSafely: mockLoadWorkflowReferenceOptionsSafely,
}));

vi.mock('../api/specimen-workflow-service', () => ({
  createApplication: mockCreateApplication,
  duplicateCheckApplications: mockDuplicateCheckApplications,
  getApplicationDetail: mockGetApplicationDetail,
  importClinicalApplication: mockImportClinicalApplication,
  lookupApplicationPatientByIdentifier: mockLookupApplicationPatientByIdentifier,
  updateApplication: mockUpdateApplication,
}));

import { useApplicationManageDialog } from './useApplicationManageDialog';

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

function createHarness() {
  const props = reactive({
    applicationId: 'APP-EDIT-001',
    mode: 'edit' as const,
    modelValue: true,
  });
  const events: Array<{ args: unknown[]; event: string }> = [];
  let state: null | ReturnType<typeof useApplicationManageDialog> = null;

  const emit = (event: string, ...args: unknown[]) => {
    events.push({ args, event });
    if (event === 'update:modelValue') {
      props.modelValue = Boolean(args[0]);
    }
  };

  const Harness = defineComponent({
    setup() {
      state = useApplicationManageDialog(props, emit as never);
      return () => h('div');
    },
  });

  return {
    Harness,
    events,
    getState: () => state,
  };
}

function mountComposable() {
  const { Harness, events, getState } = createHarness();
  const root = document.createElement('div');
  document.body.append(root);

  const app = createApp(Harness);
  app.mount(root);

  return {
    destroy() {
      app.unmount();
      root.remove();
    },
    events,
    getState,
  };
}

async function flushComposable() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

describe('useApplicationManageDialog', () => {
  beforeEach(() => {
    mockAccessStore.accessCodes = [
      'PERM_APPLICATION_CREATE',
      'PERM_APPLICATION_UPDATE',
      'PERM_WORKFLOW_REFERENCE_QUERY',
    ];
    mockGetApplicationDetail.mockResolvedValue(buildApplicationDetail());
    mockDuplicateCheckApplications.mockResolvedValue({
      items: [],
      suggestedAction: 'ALLOW',
    });
    mockLoadWorkflowReferenceOptionsSafely.mockResolvedValue({
      clinicalSymptoms: [],
    });
    mockLookupApplicationPatientByIdentifier.mockResolvedValue(null);
    mockUpdateApplication.mockResolvedValue({ id: 'APP-EDIT-001' });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    mockAccessStore.accessCodes = [];
    messageInfoMock.mockReset();
    messageSuccessMock.mockReset();
    messageWarningMock.mockReset();
    mockCreateApplication.mockReset();
    mockDuplicateCheckApplications.mockReset();
    mockGetApplicationDetail.mockReset();
    mockImportClinicalApplication.mockReset();
    mockLookupApplicationPatientByIdentifier.mockReset();
    mockLoadWorkflowReferenceOptionsSafely.mockReset();
    mockUpdateApplication.mockReset();
  });

  it('loads edit detail and submits update through the composable', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    expect(mockGetApplicationDetail).toHaveBeenCalledWith('APP-EDIT-001');
    expect(mockLoadWorkflowReferenceOptionsSafely).toHaveBeenCalledWith({
      enabled: true,
    });
    expect(state.isEditMode.value).toBe(true);
    expect(state.activeTab.value).toBe('create');
    expect(state.createForm.patientName).toBe('张三');
    expect(state.createForm.patientId).toBe('PATIENT-NO-001');

    await state.submitCreateApplication('save');
    await flushComposable();

    expect(mockDuplicateCheckApplications).toHaveBeenCalledWith({
      applicationDate: '2026-05-28',
      applicationType: 'ROUTINE',
      externalOrderNo: null,
      patientId: 'PATIENT-NO-001',
      patientName: '张三',
    });
    expect(mockUpdateApplication).toHaveBeenCalledWith(
      'APP-EDIT-001',
      expect.objectContaining({
        applicationNo: 'M2-EDIT-001',
        clinicalDiagnosis: '胃镜活检',
        patientName: '张三',
      }),
    );
    expect(wrapper.events).toContainEqual({
      args: [false],
      event: 'update:modelValue',
    });
    expect(wrapper.events).toContainEqual({
      args: [{ applicationId: 'APP-EDIT-001', mode: 'save' }],
      event: 'submitted',
    });

    wrapper.destroy();
  });

  it('looks up patient by identifier and fills patient fields', async () => {
    mockLookupApplicationPatientByIdentifier.mockResolvedValue({
      patientAge: '30',
      patientGender: 'F',
      patientId: 'PAT-LOOKUP-001',
      patientIdentifier: 'PATIENT-NO-LOOKUP',
      patientName: '王小王',
    });

    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    state.createForm.patientId = 'INPATIENT-001';
    await state.handlePatientIdentifierLookup();
    await flushComposable();

    expect(mockLookupApplicationPatientByIdentifier).toHaveBeenCalledWith(
      'INPATIENT-001',
    );
    expect(state.createForm.patientId).toBe('PATIENT-NO-LOOKUP');
    expect(state.createForm.patientName).toBe('王小王');
    expect(state.createForm.patientGender).toBe('F');
    expect(state.createForm.patientAge).toBe('30');
    expect(state.patientLookupStatus.value).toBe('matched');

    wrapper.destroy();
  });

  it('does not query patient info without create permission', async () => {
    mockAccessStore.accessCodes = ['PERM_APPLICATION_UPDATE'];

    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    state.createForm.patientId = 'PATIENT-NO-LOCKED';
    await state.handlePatientIdentifierLookup();
    await flushComposable();

    expect(mockLookupApplicationPatientByIdentifier).not.toHaveBeenCalled();
    expect(state.patientLookupStatus.value).toBe('idle');

    wrapper.destroy();
  });
});
