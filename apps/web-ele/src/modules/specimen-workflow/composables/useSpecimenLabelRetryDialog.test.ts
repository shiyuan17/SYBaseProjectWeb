import type {
  ApplicationDetailView,
  LabelPrintRetryResult,
  LatestSpecimenRegistrationResult,
  SpecimenRegisterResult,
} from '../types/specimen-workflow';

import { createApp, defineComponent, h, nextTick, ref } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

const {
  getApplicationDetailMock,
  getLatestRegistrationResultMock,
  retryLabelPrintMock,
  successMock,
  warningMock,
  storeState,
} = vi.hoisted(() => ({
  getApplicationDetailMock: vi.fn(),
  getLatestRegistrationResultMock: vi.fn(),
  retryLabelPrintMock: vi.fn(),
  successMock: vi.fn(),
  warningMock: vi.fn(),
  storeState: {
    accessCodes: [] as string[],
    userInfo: {
      realName: '测试用户',
      userId: 'USER-001',
    },
  },
}));

vi.mock('@vben/stores', () => ({
  useAccessStore: () => ({
    accessCodes: storeState.accessCodes,
  }),
  useUserStore: () => ({
    userInfo: storeState.userInfo,
  }),
}));

vi.mock('element-plus', () => ({
  ElMessage: {
    success: successMock,
    warning: warningMock,
  },
}));

vi.mock('../api/specimen-workflow-service', () => ({
  getApplicationDetail: getApplicationDetailMock,
  getLatestRegistrationResult: getLatestRegistrationResultMock,
  retryLabelPrint: retryLabelPrintMock,
}));

import { M2_PERMISSION_CODES } from '../constants';
import { useSpecimenLabelRetryDialog } from './useSpecimenLabelRetryDialog';

function createSpecimen(
  overrides: Partial<ApplicationDetailView['specimens'][number]> = {},
): ApplicationDetailView['specimens'][number] {
  return {
    abnormalReason: null,
    barcode: 'BC-001',
    containerCount: 1,
    containerName: '标本瓶',
    fixationStatus: 'REGISTERED',
    id: 'SPEC-1',
    labelPrintStatus: 'FAILED',
    specimenCount: 1,
    specimenName: '胃组织',
    specimenNo: 'SP-001',
    specimenSite: '胃',
    specimenStatus: 'REGISTERED',
    specimenType: '常规',
    ...overrides,
  };
}

function createApplicationDetail(
  overrides: Partial<ApplicationDetailView> = {},
): ApplicationDetailView {
  return {
    abnormalFlag: true,
    applicationDate: '2026-05-31',
    applicationFormStatus: 'SUBMITTED',
    applicationNo: 'APP-NO-001',
    applicationType: 'ROUTINE',
    clinicalDiagnosis: '临床诊断',
    clinicalSymptom: '临床症状',
    createdAt: '2026-05-31T09:00:00',
    currentNode: 'SPECIMEN_REGISTER',
    deletable: false,
    editable: true,
    externalOrderNo: null,
    id: 'APP-1',
    operationDisabledReason: null,
    patientAge: '40',
    patientGender: 'F',
    patientId: 'PAT-001',
    patientName: '张三',
    recentEvents: [],
    remarks: null,
    sourceHospitalId: null,
    sourceHospitalName: '本院',
    specimenRemovalTime: '2026-05-31T08:00:00',
    specimenSite: '胃',
    specimens: [createSpecimen()],
    status: 'SUBMITTED',
    submissionDate: '2026-05-31',
    submittingDepartmentId: 'DEP-001',
    submittingDepartmentName: '普外科',
    submittingDoctorName: '医生A',
    submittingDoctorUserId: 'DOC-001',
    thirdPartySource: null,
    updatedAt: '2026-05-31T09:30:00',
    voided: false,
    ...overrides,
  };
}

function createRegisterResult(
  overrides: Partial<SpecimenRegisterResult> = {},
): SpecimenRegisterResult {
  return {
    labelPrintBatchNo: 'BATCH-FALLBACK',
    labelPrintMessage: '存在失败标签',
    labelPrintSuccess: false,
    specimens: [createSpecimen()],
    ...overrides,
  };
}

function createLatestRegisterResult(
  overrides: Partial<LatestSpecimenRegistrationResult> = {},
): LatestSpecimenRegistrationResult {
  return {
    applicationId: 'APP-1',
    labelPrintBatchNo: 'BATCH-001',
    labelPrintMessage: '存在失败标签',
    labelPrintSuccess: false,
    registrationSnapshot: null,
    specimens: [createSpecimen()],
    ...overrides,
  };
}

function createRetryResult(
  overrides: Partial<LabelPrintRetryResult> = {},
): LabelPrintRetryResult {
  return {
    allSuccessful: false,
    failedCount: 1,
    labelPrintBatchNo: 'BATCH-001',
    message: '补打已提交',
    retriedCount: 1,
    successCount: 0,
    ...overrides,
  };
}

function createHarness(options?: {
  applicationId?: string;
  modelValue?: boolean;
  registerResult?: null | SpecimenRegisterResult;
  retryResult?: LabelPrintRetryResult | null;
}) {
  let state: null | ReturnType<typeof useSpecimenLabelRetryDialog> = null;
  const applicationId = ref(options?.applicationId ?? 'APP-1');
  const modelValue = ref(options?.modelValue ?? true);
  const registerResult = ref<null | SpecimenRegisterResult>(
    options?.registerResult ?? null,
  );
  const retryResult = ref<LabelPrintRetryResult | null>(
    options?.retryResult ?? null,
  );
  const onRetried = vi.fn();
  const updateModelValue = vi.fn((value: boolean) => {
    modelValue.value = value;
  });

  const Harness = defineComponent({
    setup() {
      state = useSpecimenLabelRetryDialog({
        applicationId,
        modelValue,
        onRetried,
        registerResult,
        retryResult,
        updateModelValue,
      });

      return () => h('div');
    },
  });

  return {
    Harness,
    getState: () => state,
    onRetried,
    updateModelValue,
  };
}

function mountComposable(options?: Parameters<typeof createHarness>[0]) {
  const harness = createHarness(options);
  const root = document.createElement('div');
  document.body.append(root);

  const app = createApp(harness.Harness);
  app.mount(root);

  return {
    ...harness,
    destroy() {
      app.unmount();
      root.remove();
    },
  };
}

async function flushComposable() {
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

describe('useSpecimenLabelRetryDialog', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    getApplicationDetailMock.mockReset();
    getLatestRegistrationResultMock.mockReset();
    retryLabelPrintMock.mockReset();
    successMock.mockReset();
    warningMock.mockReset();
    storeState.accessCodes = [];
    storeState.userInfo = {
      realName: '测试用户',
      userId: 'USER-001',
    };
  });

  it('loads application detail and latest result when dialog opens', async () => {
    storeState.accessCodes = [M2_PERMISSION_CODES.APPLICATION_DETAIL_QUERY];
    getApplicationDetailMock.mockResolvedValue(createApplicationDetail());
    getLatestRegistrationResultMock.mockResolvedValue(
      createLatestRegisterResult(),
    );

    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    expect(getApplicationDetailMock).toHaveBeenCalledWith('APP-1');
    expect(getLatestRegistrationResultMock).toHaveBeenCalledWith('APP-1');
    expect(state.canQueryApplicationDetail.value).toBe(true);
    expect(state.currentApplicationId.value).toBe('APP-1');
    expect(state.applicationDetail.value?.applicationNo).toBe('APP-NO-001');
    expect(state.detailStatusType.value).toBe('danger');
    expect(state.latestRegisterResult.value?.labelPrintBatchNo).toBe(
      'BATCH-001',
    );
    expect(state.hasFailedLabels.value).toBe(true);

    wrapper.destroy();
  });

  it('skips detail loading without permission and falls back to register result', async () => {
    const registerResult = createRegisterResult({
      labelPrintBatchNo: 'BATCH-FALLBACK',
    });
    getLatestRegistrationResultMock.mockResolvedValue(
      createLatestRegisterResult({
        labelPrintBatchNo: null,
      }),
    );

    const wrapper = mountComposable({ registerResult });
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    expect(getApplicationDetailMock).not.toHaveBeenCalled();
    expect(getLatestRegistrationResultMock).toHaveBeenCalledWith('APP-1');
    expect(state.canQueryApplicationDetail.value).toBe(false);
    expect(state.latestRegisterResult.value?.labelPrintBatchNo).toBe(
      'BATCH-FALLBACK',
    );

    wrapper.destroy();
  });

  it('validates printer code and submits retry successfully', async () => {
    storeState.accessCodes = [M2_PERMISSION_CODES.APPLICATION_DETAIL_QUERY];
    getApplicationDetailMock.mockResolvedValue(createApplicationDetail());
    getLatestRegistrationResultMock.mockResolvedValue(
      createLatestRegisterResult(),
    );
    retryLabelPrintMock.mockResolvedValue(createRetryResult());

    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    await state.submitRetryLabelPrint();
    expect(warningMock).toHaveBeenCalledWith('请填写打印机编码');

    state.retryForm.printerCode = 'PRINTER-01';
    state.retryForm.remarks = '补打说明';
    state.retryForm.terminalCode = 'TERM-01';
    await state.submitRetryLabelPrint();

    expect(retryLabelPrintMock).toHaveBeenCalledWith('BATCH-001', {
      operatorName: '测试用户',
      operatorUserId: 'USER-001',
      printerCode: 'PRINTER-01',
      remarks: '补打说明',
      terminalCode: 'TERM-01',
    });
    expect(wrapper.onRetried).toHaveBeenCalledWith({
      applicationId: 'APP-1',
      retryResult: createRetryResult(),
    });
    expect(successMock).toHaveBeenCalledWith('标签补打请求已提交');
    expect(state.currentRetryResult.value?.labelPrintBatchNo).toBe('BATCH-001');

    wrapper.destroy();
  });
});
