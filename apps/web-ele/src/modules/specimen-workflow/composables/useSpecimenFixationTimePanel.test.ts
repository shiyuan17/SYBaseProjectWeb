import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  completeFixationMock,
  getApplicationDetailMock,
  listSpecimensMock,
  loadWorkflowReferenceOptionsMock,
  lookupApplicationRegistrationWorkbenchRecordMock,
  successMock,
  warningMock,
} = vi.hoisted(() => ({
  completeFixationMock: vi.fn(
    async (payload: {
      fixationLiquidType: string;
      operatorName: string;
      specimenBarcode: string;
    }) => ({
      barcode: payload.specimenBarcode,
      fixationCompletedAt: '2026-05-26 10:00:00',
      fixationLiquidType: payload.fixationLiquidType,
      fixationStatus: 'COMPLETED',
      operatorName: payload.operatorName,
      operatorUserId: 'USER-001',
      specimenId: 'SPEC-002',
    }),
  ),
  getApplicationDetailMock: vi.fn(async (applicationId: string) => ({
    applicationNo: applicationId === 'APP-001' ? 'M2-001' : 'M2-002',
    id: applicationId,
    patientGender: applicationId === 'APP-001' ? '女' : '男',
    patientId: applicationId === 'APP-001' ? 'PAT-001' : 'PAT-002',
    recentEvents: [],
    specimenRemovalTime:
      applicationId === 'APP-001'
        ? '2026-05-26 07:40:00'
        : '2026-05-26 08:10:00',
    specimens: [],
  })),
  listSpecimensMock: vi.fn(async ({ keyword }: { keyword?: string }) => {
    const rows = [
      {
        abnormalFlag: false,
        applicationId: 'APP-001',
        applicationNo: 'M2-001',
        barcode: 'BC-001',
        fixationCompletedAt: '2026-05-26 09:00:00',
        fixationStartedAt: '2026-05-26 08:30:00',
        fixationStatus: 'COMPLETED',
        labelPrintBatchNo: 'LB-001',
        labelPrintStatus: 'FAILED',
        latestTrackingAt: '2026-05-26 09:00:00',
        patientName: 'Alice',
        registeredAt: '2026-05-26 08:00:00',
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
        fixationCompletedAt: null,
        fixationStartedAt: null,
        fixationStatus: 'PENDING',
        labelPrintBatchNo: 'LB-002',
        labelPrintStatus: 'SUCCESS',
        latestTrackingAt: '2026-05-26 09:20:00',
        patientName: 'Bob',
        registeredAt: '2026-05-26 08:20:00',
        specimenId: 'SPEC-002',
        specimenName: '肺组织',
        specimenNo: 'SP-002',
        specimenStatus: 'REGISTERED',
        specimenType: '冰冻',
        verificationStatus: 'VERIFIED',
      },
    ];
    return {
      items: rows.filter((item) =>
        [item.barcode, item.specimenId, item.specimenNo].includes(
          keyword ?? '',
        ),
      ),
      page: 1,
      size: 100,
      summary: {
        abnormalCount: 0,
        labelPrintedCount: 0,
        pendingLabelCount: 0,
        totalCount: 0,
      },
      total: 1,
    };
  }),
  loadWorkflowReferenceOptionsMock: vi.fn(async () => ({
    clinicalSymptoms: [],
    collectionModes: [],
    containerNames: [],
    cutSurfaceFeatures: [],
    fixationLiquidTypes: [
      { label: '10% 中性福尔马林', value: 'FORMALIN' },
      { label: '酒精', value: 'ETHANOL' },
    ],
    marginMarkings: [],
    specimenImageSizes: [],
    specimenTypes: [],
  })),
  lookupApplicationRegistrationWorkbenchRecordMock: vi.fn(
    async ({ keyword }: { keyword: string }) => ({
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
        applyDoctor: '张医生',
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
        fixationPerson: keyword === 'M2-001' ? '王护士' : '',
        fixationTime: null,
        roomId: keyword === 'M2-001' ? '手术室1' : '手术室2',
        surgeryName: keyword === 'M2-001' ? '乳腺切除术' : '肺叶切除术',
      },
    }),
  ),
  successMock: vi.fn(),
  warningMock: vi.fn(),
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

vi.mock('#/modules/system-management/api/workflow-reference-service', () => ({
  createEmptyWorkflowReferenceOptions: () => ({
    clinicalSymptoms: [],
    collectionModes: [],
    containerNames: [],
    cutSurfaceFeatures: [],
    fixationLiquidTypes: [],
    marginMarkings: [],
    specimenImageSizes: [],
    specimenTypes: [],
  }),
  loadWorkflowReferenceOptionsSafely: loadWorkflowReferenceOptionsMock,
}));

vi.mock('../api/application-registration-workbench-service', () => ({
  lookupApplicationRegistrationWorkbenchRecord:
    lookupApplicationRegistrationWorkbenchRecordMock,
}));

vi.mock('../api/specimen-workflow-service', () => ({
  completeFixation: completeFixationMock,
  getApplicationDetail: getApplicationDetailMock,
  listSpecimens: listSpecimensMock,
  retryLabelPrint: vi.fn(),
}));

import { useSpecimenFixationTimePanel } from './useSpecimenFixationTimePanel';

function createHarness() {
  let state: null | ReturnType<typeof useSpecimenFixationTimePanel> = null;

  const Harness = defineComponent({
    setup() {
      state = useSpecimenFixationTimePanel();
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

describe('useSpecimenFixationTimePanel', () => {
  beforeEach(() => {
    loadWorkflowReferenceOptionsMock.mockClear();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('loads default fixation liquid options and completes fixation by scan', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    expect(loadWorkflowReferenceOptionsMock).toHaveBeenCalledWith({
      enabled: true,
    });
    expect(state.fixationLiquidType.value).toBe('FORMALIN');

    state.scanInput.value = 'SP-002';
    await state.handleCompleteFixationByScan();
    await flushComposable();

    expect(state.queueItems.value).toHaveLength(1);
    expect(state.queueItems.value[0]?.specimenName).toBe('肺组织');
    expect(state.queueItems.value[0]?.patientIdLabel).toBe('PAT-002');
    expect(state.resolveFixationLiquidLabel('FORMALIN')).toBe(
      '10% 中性福尔马林',
    );
    expect(completeFixationMock).toHaveBeenCalledWith({
      fixationLiquidType: 'FORMALIN',
      operatorName: 'Test User',
      operatorUserId: 'USER-001',
      remarks: '扫码完成固定',
      specimenBarcode: 'BC-002',
    });

    wrapper.destroy();
  });

  it('prevents duplicate queue rows', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    state.scanInput.value = 'SP-001';
    await state.handleCompleteFixationByScan();
    await flushComposable();

    state.scanInput.value = 'SP-001';
    await state.handleCompleteFixationByScan();
    await flushComposable();

    expect(warningMock).toHaveBeenCalledWith('该标本已在当前列表中');
    expect(state.queueItems.value).toHaveLength(1);

    wrapper.destroy();
  });
});
