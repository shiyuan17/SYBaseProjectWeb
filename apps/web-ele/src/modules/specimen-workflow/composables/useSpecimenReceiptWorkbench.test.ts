import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

const {
  downloadFileFromBlobMock,
  getApplicationDetailMock,
  listPendingReceiptsMock,
  listSpecimensMock,
  receiveSpecimensMock,
  retryLabelPrintMock,
  successMock,
  warningMock,
  workbenchLookupMock,
} = vi.hoisted(() => ({
  downloadFileFromBlobMock: vi.fn(),
  getApplicationDetailMock: vi.fn(async (applicationId: string) => ({
    id: applicationId,
    patientGender: applicationId === 'APP-001' ? '女' : '男',
    patientId: applicationId === 'APP-001' ? 'PAT-001' : 'PAT-002',
    recentEvents: [],
    specimens: [],
  })),
  listPendingReceiptsMock: vi.fn(
    async (params?: { specimenNo?: string }) => ({
      items: [
        {
          abnormalFlag: false,
          applicationId: params?.specimenNo === 'SP-001' ? 'APP-001' : 'APP-002',
          applicationNo: params?.specimenNo === 'SP-001' ? 'M2-001' : 'M2-002',
          barcode: params?.specimenNo === 'SP-001' ? 'BC-001' : 'BC-002',
          batchAbnormalFlag: false,
          checkInStatus: 'CHECKED_IN',
          containerCount: 1,
          containerName: '福尔马林瓶',
          fixationStatus: 'COMPLETED',
          latestTrackingAt: '2026-06-01T09:00:00',
          patientName: params?.specimenNo === 'SP-001' ? 'Alice' : 'Bob',
          registeredAt: '2026-06-01T08:00:00',
          reminderCount: 0,
          specimenConfirmedAt: '2026-06-01T08:30:00',
          specimenId: params?.specimenNo === 'SP-001' ? 'SPEC-001' : 'SPEC-002',
          specimenNo: params?.specimenNo === 'SP-001' ? 'SP-001' : 'SP-002',
          specimenStatus: 'IN_TRANSIT',
          submittingDepartmentId: 'DEPT-001',
          submittingDepartmentName: '手术室2',
          transportOrderId: 'TO-001',
          unreceivedCount: 1,
          verificationStatus: 'VERIFIED',
        },
      ],
      page: 1,
      size: 500,
      total: 1,
    }),
  ),
  listSpecimensMock: vi.fn(async (params?: { keyword?: string }) => {
    const keyword = params?.keyword ?? '';
    const source = [
      {
        abnormalFlag: false,
        applicationId: 'APP-001',
        applicationNo: 'M2-001',
        barcode: 'BC-001',
        checkInStatus: 'CHECKED_IN',
        checkedInAt: '2026-06-01T08:40:00',
        checkedInByName: '入库员甲',
        fixationStatus: 'COMPLETED',
        labelPrintBatchNo: 'BATCH-001',
        labelPrintStatus: 'FAILED',
        latestTrackingAt: '2026-06-01T09:00:00',
        patientName: 'Alice',
        registeredAt: '2026-06-01T08:00:00',
        specimenConfirmedAt: '2026-06-01T08:30:00',
        specimenId: 'SPEC-001',
        specimenName: '乳腺组织',
        specimenNo: 'SP-001',
        specimenSite: '乳腺',
        specimenStatus: 'IN_TRANSIT',
        specimenType: '常规',
        submittingDepartmentId: 'DEPT-001',
        submittingDepartmentName: '手术室2',
        verificationStatus: 'VERIFIED',
      },
      {
        abnormalFlag: false,
        applicationId: 'APP-002',
        applicationNo: 'M2-002',
        barcode: 'BC-002',
        checkInStatus: 'CHECKED_IN',
        checkedInAt: '2026-06-01T08:42:00',
        checkedInByName: '入库员乙',
        fixationStatus: 'COMPLETED',
        labelPrintBatchNo: 'BATCH-001',
        labelPrintStatus: 'PENDING',
        latestTrackingAt: '2026-06-01T09:02:00',
        patientName: 'Bob',
        registeredAt: '2026-06-01T08:05:00',
        specimenConfirmedAt: '2026-06-01T08:31:00',
        specimenId: 'SPEC-002',
        specimenName: '肺组织',
        specimenNo: 'SP-002',
        specimenSite: '肺叶',
        specimenStatus: 'IN_TRANSIT',
        specimenType: '冰冻',
        submittingDepartmentId: 'DEPT-002',
        submittingDepartmentName: '手术室3',
        verificationStatus: 'VERIFIED',
      },
    ];

    return {
      items: source.filter(
        (item) =>
          !keyword ||
          [item.specimenId, item.specimenNo, item.barcode].some((value) =>
            value.includes(keyword),
          ),
      ),
      page: 1,
      size: 500,
      summary: {
        abnormalCount: 0,
        labelPrintedCount: 0,
        pendingLabelCount: 0,
        totalCount: 2,
      },
      total: 2,
    };
  }),
  receiveSpecimensMock: vi.fn(async () => ({
    receiptStatus: 'RECEIVED',
    unreceivedCount: 0,
  })),
  retryLabelPrintMock: vi.fn(async () => ({
    allSuccessful: true,
    failedCount: 0,
    labelPrintBatchNo: 'BATCH-001',
    message: null,
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
      applicationDate: '2026-06-01',
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
      fixationPerson: '',
      fixationTime: null,
      roomId: keyword === 'M2-001' ? '手术室1' : '手术室2',
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
  downloadFileFromBlob: downloadFileFromBlobMock,
}));

vi.mock('element-plus', () => ({
  ElMessage: {
    success: successMock,
    warning: warningMock,
  },
}));

vi.mock('../api/application-registration-workbench-service', () => ({
  lookupApplicationRegistrationWorkbenchRecord: workbenchLookupMock,
}));

vi.mock('../api/specimen-workflow-service', () => ({
  getApplicationDetail: getApplicationDetailMock,
  listPendingReceipts: listPendingReceiptsMock,
  listSpecimens: listSpecimensMock,
  receiveSpecimens: receiveSpecimensMock,
  retryLabelPrint: retryLabelPrintMock,
}));

import { useSpecimenReceiptWorkbench } from './useSpecimenReceiptWorkbench';

function createHarness() {
  let state: null | ReturnType<typeof useSpecimenReceiptWorkbench> = null;

  const Harness = defineComponent({
    setup() {
      state = useSpecimenReceiptWorkbench();
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
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

describe('useSpecimenReceiptWorkbench', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('queues exact-matched specimens and submits grouped receipt requests', async () => {
    const wrapper = mountComposable();
    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    expect(state.operatorForm.operatorName).toBe('Test User');
    expect(state.operatorForm.operatorUserId).toBe('USER-001');

    state.scanInput.value = 'SP-001';
    await state.handleQueueSpecimen();
    await flushComposable();

    state.scanInput.value = 'SP-002';
    await state.handleQueueSpecimen();
    await flushComposable();

    expect(state.queueItems.value).toHaveLength(2);
    expect(state.queueItems.value[0]?.patientIdLabel).toBe('PAT-002');
    expect(state.queueItems.value[1]?.inpatientNo).toBe('ZY-001');

    state.handleOperatorChange({
      id: 'USER-ALT',
      name: 'Alt User',
    });
    state.handleSelectionChange(state.queueItems.value);
    await state.handleReceiveSelected();
    await flushComposable();

    expect(receiveSpecimensMock).toHaveBeenCalledTimes(1);
    expect(receiveSpecimensMock).toHaveBeenCalledWith({
      items: [
        {
          containerCount: 1,
          qualityCheckResult: 'PASSED',
          receiptStatus: 'RECEIVED',
          specimenBarcode: 'BC-002',
        },
        {
          containerCount: 1,
          qualityCheckResult: 'PASSED',
          receiptStatus: 'RECEIVED',
          specimenBarcode: 'BC-001',
        },
      ],
      receivedByName: 'Alt User',
      receivedByUserId: 'USER-ALT',
      terminalCode: null,
      transportOrderId: 'TO-001',
    });
    expect(state.queueItems.value.every((item) => item.queueStatus === 'SUCCESS')).toBe(
      true,
    );
    expect(state.queueItems.value.every((item) => item.receivedByName === 'Alt User')).toBe(
      true,
    );

    wrapper.destroy();
  });

  it('supports retry label printing and excel export for queued rows', async () => {
    const wrapper = mountComposable();
    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    state.scanInput.value = 'SP-001';
    await state.handleQueueSpecimen();
    await flushComposable();

    state.handleSelectionChange(state.queueItems.value);
    state.handleRetryLabel();
    expect(state.retryDialogVisible.value).toBe(true);

    state.retryForm.printerCode = 'PRN-001';
    await state.submitRetryLabel();
    state.handleExportExcel();
    await flushComposable();

    expect(retryLabelPrintMock).toHaveBeenCalledWith('BATCH-001', {
      printerCode: 'PRN-001',
      remarks: null,
      terminalCode: null,
    });
    expect(downloadFileFromBlobMock).toHaveBeenCalled();

    wrapper.destroy();
  });
});
