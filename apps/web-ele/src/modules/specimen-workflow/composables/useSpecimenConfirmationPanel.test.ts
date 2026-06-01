import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  confirmSpecimenMock,
  getApplicationDetailMock,
  listOperatingBuildingOptionsMock,
  listSpecimensMock,
  retryLabelPrintMock,
  successMock,
  warningMock,
  workbenchLookupMock,
} = vi.hoisted(() => ({
  confirmSpecimenMock: vi.fn(async () => ({
    specimenConfirmedAt: '2026-05-26 10:00:00',
  })),
  getApplicationDetailMock: vi.fn(async (applicationId: string) => ({
    id: applicationId,
    patientGender: applicationId === 'APP-001' ? '女' : '男',
    recentEvents: [],
    specimens: [],
    submittingDoctorName: applicationId === 'APP-001' ? '李医生' : '王医生',
  })),
  listOperatingBuildingOptionsMock: vi.fn(async () => [
    {
      buildingId: 'B001',
      buildingName: '惠侨楼',
      floors: 12,
      location: '北区',
      operatingRooms: [
        {
          buildingId: 'B001',
          cleanLevel: '百级',
          floor: 3,
          roomId: 'OR-101',
          roomName: '手术室 1',
          roomType: '洁净手术室',
        },
        {
          buildingId: 'B001',
          cleanLevel: '百级',
          floor: 3,
          roomId: 'OR-102',
          roomName: '手术室 2',
          roomType: '洁净手术室',
        },
      ],
    },
  ]),
  listSpecimensMock: vi.fn(async () => ({
    items: [
      {
        abnormalFlag: false,
        applicationId: 'APP-001',
        applicationNo: 'M2-001',
        barcode: 'BC-001',
        checkInStatus: 'NOT_CHECKED_IN',
        fixationStatus: 'COMPLETED',
        labelPrintBatchNo: 'LB-001',
        labelPrintStatus: 'FAILED',
        latestTrackingAt: '2026-05-26 09:00:00',
        patientName: 'Alice',
        registeredAt: '2026-05-26 08:00:00',
        specimenConfirmedAt: null,
        specimenId: 'SPEC-001',
        specimenName: '乳腺组织',
        specimenNo: 'SP-001',
        specimenStatus: 'FIXED',
        specimenType: '常规',
        verificationStatus: 'VERIFIED',
      },
      {
        abnormalFlag: false,
        applicationId: 'APP-002',
        applicationNo: 'M2-002',
        barcode: 'BC-002',
        checkInStatus: 'NOT_CHECKED_IN',
        fixationStatus: 'COMPLETED',
        labelPrintBatchNo: 'LB-001',
        labelPrintStatus: 'PENDING',
        latestTrackingAt: '2026-05-26 09:30:00',
        patientName: 'Bob',
        registeredAt: '2026-05-26 08:10:00',
        specimenConfirmedAt: '2026-05-26 09:20:00',
        specimenConfirmedByName: '实际确认人',
        specimenConfirmedByUserId: 'USER-REAL',
        specimenId: 'SPEC-002',
        specimenName: '肺组织',
        specimenNo: 'SP-002',
        specimenStatus: 'FIXED',
        specimenType: '冰冻',
        verificationStatus: 'VERIFIED',
      },
    ],
    page: 1,
    size: 500,
    summary: {
      abnormalCount: 0,
      labelPrintedCount: 0,
      pendingLabelCount: 0,
      totalCount: 2,
    },
    total: 2,
  })),
  retryLabelPrintMock: vi.fn(async () => ({
    allSuccessful: true,
    failedCount: 0,
    labelPrintBatchNo: 'LB-001',
    message: 'ok',
    retriedCount: 2,
    successCount: 2,
  })),
  successMock: vi.fn(),
  warningMock: vi.fn(),
  workbenchLookupMock: vi.fn(async ({ keyword }: { keyword: string }) => ({
    applicationId: keyword === 'M2-001' ? 'APP-001' : 'APP-002',
    contagiousSpecimen: {
      hepatitis: false,
      hiv: false,
      isolation: false,
      syphilis: false,
      tuberculosis: false,
    },
    gynecologyInfo: {
      additionalNotes: '',
      hpvResult: null,
      lastMenstrualPeriod: null,
      menopause: false,
      previousCytology: '',
      previousTreatment: '',
      specialConditions: {
        abnormalBleeding: false,
        birthControl: false,
        hormoneReplacement: false,
        hysterectomy: false,
        iud: false,
        lactation: false,
        menopause: false,
        other: '',
        pregnancy: false,
        radiotherapy: false,
      },
    },
    patientInfo: {
      age: '42',
      applicationDate: '2026-05-26',
      applicationNo: keyword,
      applyDept: '外科',
      applyDoctor: keyword === 'M2-001' ? '张医生' : '王医生',
      bedNo: null,
      checkItem: null,
      clinicalDiagnosis: null,
      clinicalHistory: null,
      deliveryRequirement: null,
      endoscopyDiagnosis: null,
      frozenReminder: false,
      gender: keyword === 'M2-001' ? '女' : '男',
      idNo: null,
      imagingResult: null,
      inpatientNo: keyword === 'M2-001' ? 'ZY-001' : 'ZY-002',
      patientName: keyword === 'M2-001' ? 'Alice' : 'Bob',
      patientVerified: true,
      phone: null,
      registrationStatus: null,
      remark: null,
      specimenType: null,
      wardName: null,
    },
    specimenItems: [],
    surgeryInfo: {
      buildingId: null,
      clinicalFindings: null,
      fixativeType: null,
      fixationPerson: '',
      fixationTime: null,
      roomId: keyword === 'M2-001' ? 'OR-101' : 'OR-102',
      surgeryName: keyword === 'M2-001' ? '乳腺切除术' : '肺叶切除术',
    },
  })),
}));

vi.mock('@vben/stores', () => ({
  useUserStore: () => ({
    userInfo: {
      realName: 'Test User',
      userId: 'USER-001',
    },
  }),
}));

vi.mock('@vben/utils', () => ({
  downloadFileFromBlob: vi.fn(),
}));

vi.mock('element-plus', () => ({
  ElMessage: {
    success: successMock,
    warning: warningMock,
  },
}));

vi.mock('../api/application-registration-workbench-service', () => ({
  listOperatingBuildingOptions: listOperatingBuildingOptionsMock,
  lookupApplicationRegistrationWorkbenchRecord: workbenchLookupMock,
}));

vi.mock('../api/specimen-workflow-service', () => ({
  confirmSpecimen: confirmSpecimenMock,
  getApplicationDetail: getApplicationDetailMock,
  listSpecimens: listSpecimensMock,
  retryLabelPrint: retryLabelPrintMock,
}));

import { useSpecimenConfirmationPanel } from './useSpecimenConfirmationPanel';

function createHarness() {
  let state: null | ReturnType<typeof useSpecimenConfirmationPanel> = null;

  const Harness = defineComponent({
    setup() {
      state = useSpecimenConfirmationPanel();
      return () => h('div');
    },
  });

  return {
    getState: () => state,
    Harness,
  };
}

function mountComposable() {
  const { Harness, getState } = createHarness();
  const root = document.createElement('div');
  document.body.append(root);

  const app = createApp(Harness);
  app.mount(root);

  return {
    destroy() {
      app.unmount();
      root.remove();
    },
    getState,
  };
}

async function flushComposable() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

async function waitForComposableAssertion(assertion: () => void) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      assertion();
      return;
    } catch (error) {
      lastError = error;
      await flushComposable();
    }
  }

  throw lastError;
}

describe('useSpecimenConfirmationPanel', () => {
  beforeEach(() => {
    listSpecimensMock.mockClear();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('loads rows and supports quick confirm by exact keyword', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    await waitForComposableAssertion(() => {
      expect(listSpecimensMock).toHaveBeenCalled();
      expect(state.pagedItems.value).toHaveLength(2);
    });
    expect(state.operatorForm.operatorName).toBe('Test User');
    expect(state.operatorForm.operatorUserId).toBe('USER-001');
    expect(state.summary.value).toEqual({
      allCount: 2,
      confirmedCount: 1,
      pendingCount: 1,
    });
    expect(state.pagedItems.value[0]?.surgeryName).toBe('惠侨楼 - 手术室 1');
    expect(state.pagedItems.value[1]?.surgeryName).toBe('惠侨楼 - 手术室 2');

    state.handleOperatorChange({
      id: 'USER-ALT',
      name: 'Alt User',
    });
    state.filters.keyword = 'SP-001';
    await state.tryQuickConfirmByKeyword();
    await flushComposable();

    expect(confirmSpecimenMock).toHaveBeenCalledWith('BC-001', {
      operatorName: 'Alt User',
      operatorUserId: 'USER-ALT',
      remarks: null,
      terminalCode: null,
    });
    expect(state.filters.keyword).toBe('');

    wrapper.destroy();
  });

  it('opens retry flow for selected rows and submits label retry', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    await waitForComposableAssertion(() => {
      expect(state.pagedItems.value).toHaveLength(2);
    });

    state.handleSelectionChange(state.pagedItems.value);
    state.handleRetryLabel();
    expect(state.retryDialogVisible.value).toBe(true);

    state.retryForm.printerCode = 'PRN-01';
    await state.submitRetryLabel();
    await flushComposable();

    expect(retryLabelPrintMock).toHaveBeenCalledWith('LB-001', {
      printerCode: 'PRN-01',
      remarks: null,
      terminalCode: null,
    });

    wrapper.destroy();
  });
});
