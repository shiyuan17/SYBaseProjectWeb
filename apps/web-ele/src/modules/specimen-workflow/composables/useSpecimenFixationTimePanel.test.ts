import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  completeFixationMock,
  getApplicationDetailMock,
  listSpecimensMock,
  listOperatingBuildingOptionsMock,
  loadWorkflowReferenceOptionsMock,
  lookupApplicationRegistrationWorkbenchRecordMock,
  startFixationMock,
  successMock,
  warningMock,
} = vi.hoisted(() => ({
  completeFixationMock: vi.fn(
    async (payload: {
      fixationLiquidType: string;
      specimenBarcode: string;
    }) => ({
      barcode: payload.specimenBarcode,
      fixationCompletedAt: '2026-05-26 10:00:00',
      fixationLiquidType: payload.fixationLiquidType,
      fixationStatus: 'COMPLETED',
      operatorName: 'Test User',
      operatorUserId: 'USER-001',
      specimenId: 'SPEC-002',
    }),
  ),
  startFixationMock: vi.fn(
    async (payload: {
      fixationLiquidType?: null | string;
      specimenBarcode: string;
    }) => ({
      barcode: payload.specimenBarcode,
      fixationCompletedAt: null,
      fixationLiquidType: payload.fixationLiquidType,
      fixationStatus: 'FIXING',
      operatorName: 'Test User',
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
  listSpecimensMock: vi.fn(
    async ({
      applicationNo,
      keyword,
    }: {
      applicationNo?: string;
      keyword?: string;
    }) => {
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
        {
          abnormalFlag: false,
          applicationId: 'APP-002',
          applicationNo: 'M2-002',
          barcode: 'BC-003',
          fixationCompletedAt: null,
          fixationStartedAt: null,
          fixationStatus: 'PENDING',
          labelPrintBatchNo: 'LB-002',
          labelPrintStatus: 'SUCCESS',
          latestTrackingAt: '2026-05-26 09:25:00',
          patientName: 'Bob',
          registeredAt: '2026-05-26 08:25:00',
          specimenId: 'SPEC-003',
          specimenName: '纵隔淋巴结',
          specimenNo: 'SP-003',
          specimenStatus: 'REGISTERED',
          specimenType: '常规',
          verificationStatus: 'VERIFIED',
        },
      ];
      if (applicationNo) {
        const applicationRows = rows.filter(
          (item) => item.applicationNo === applicationNo,
        );
        return {
          items: applicationRows,
          page: 1,
          size: 100,
          summary: {
            abnormalCount: 0,
            labelPrintedCount: 0,
            pendingLabelCount: 0,
            totalCount: applicationRows.length,
          },
          total: applicationRows.length,
        };
      }

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
    },
  ),
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
        roomId: keyword === 'M2-001' ? 'OR-101' : 'OR-102',
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
  listOperatingBuildingOptions: listOperatingBuildingOptionsMock,
  lookupApplicationRegistrationWorkbenchRecord:
    lookupApplicationRegistrationWorkbenchRecordMock,
}));

vi.mock('../api/specimen-workflow-service', () => ({
  completeFixation: completeFixationMock,
  getApplicationDetail: getApplicationDetailMock,
  listSpecimens: listSpecimensMock,
  retryLabelPrint: vi.fn(),
  startFixation: startFixationMock,
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

  it('loads default fixation liquid options and starts fixation by specimenNo', async () => {
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

    expect(state.queueItems.value).toHaveLength(2);
    expect(state.queueItems.value[0]?.specimenName).toBe('肺组织');
    expect(state.queueItems.value[0]?.patientIdLabel).toBe('PAT-002');
    expect(state.queueItems.value[0]?.surgeryName).toBe('惠侨楼 - 手术室 2');
    expect(state.queueItems.value[0]?.fixationStatus).toBe('FIXING');
    expect(state.queueItems.value[0]?.specimenStatus).toBe('FIXING');
    expect(state.queueItems.value[1]?.specimenName).toBe('纵隔淋巴结');
    expect(state.queueItems.value[1]?.fixationStatus).toBe('PENDING');
    expect(state.resolveFixationLiquidLabel('FORMALIN')).toBe(
      '10% 中性福尔马林',
    );
    expect(startFixationMock).toHaveBeenCalledWith({
      fixationLiquidType: 'FORMALIN',
      remarks: '扫码开始固定',
      specimenBarcode: 'BC-002',
    });
    expect(completeFixationMock).not.toHaveBeenCalled();

    wrapper.destroy();
  });

  it('appends queue rows and avoids duplicate rows by specimen id', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    state.scanInput.value = 'SP-002';
    await state.handleCompleteFixationByScan();
    await flushComposable();

    expect(state.queueItems.value).toHaveLength(2);

    state.scanInput.value = 'SP-001';
    await state.handleCompleteFixationByScan();
    await flushComposable();

    expect(state.queueItems.value).toHaveLength(3);
    expect(state.queueItems.value.map((item) => item.specimenNo)).toEqual([
      'SP-002',
      'SP-003',
      'SP-001',
    ]);

    state.scanInput.value = 'SP-002';
    await state.handleCompleteFixationByScan();
    await flushComposable();

    expect(state.queueItems.value).toHaveLength(3);

    wrapper.destroy();
  });

  it('shows completed specimen rows and blocks repeated fixation', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    state.scanInput.value = 'SP-001';
    await state.handleCompleteFixationByScan();
    await flushComposable();

    expect(warningMock).toHaveBeenCalledWith('标本已完成固定，无需重复操作');
    expect(startFixationMock).not.toHaveBeenCalled();
    expect(completeFixationMock).not.toHaveBeenCalled();
    expect(state.queueItems.value).toHaveLength(1);
    expect(state.queueItems.value[0]?.specimenNo).toBe('SP-001');

    wrapper.destroy();
  });

  it('confirms fixation only for selected rows', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    state.scanInput.value = 'SP-002';
    await state.handleCompleteFixationByScan();
    await flushComposable();

    expect(state.queueItems.value[0]?.fixationStatus).toBe('FIXING');

    state.handleSelectionChange([state.queueItems.value[0]!]);
    await state.handleConfirmFixation();
    await flushComposable();

    expect(completeFixationMock).toHaveBeenCalledTimes(1);
    expect(completeFixationMock).toHaveBeenCalledWith({
      fixationLiquidType: 'FORMALIN',
      remarks: '手动确认固定',
      specimenBarcode: 'BC-002',
    });
    expect(state.queueItems.value[0]?.fixationStatus).toBe('COMPLETED');
    expect(state.queueItems.value[1]?.fixationStatus).toBe('PENDING');
    expect(successMock).toHaveBeenCalledWith('已完成 1 条标本固定');

    wrapper.destroy();
  });

  it('warns when confirming fixation without selected rows', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    state.scanInput.value = 'SP-002';
    await state.handleCompleteFixationByScan();
    await flushComposable();

    await state.handleConfirmFixation();
    await flushComposable();

    expect(completeFixationMock).not.toHaveBeenCalled();
    expect(warningMock).toHaveBeenCalledWith('请先勾选需要固定的标本');

    wrapper.destroy();
  });
});
