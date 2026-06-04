import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

const {
  downloadFileFromBlobMock,
  getApplicationDetailMock,
  listOperatingBuildingOptionsMock,
  listPendingReceiptsMock,
  listSpecimensMock,
  directReceiveSpecimensMock,
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
  listPendingReceiptsMock: vi.fn(
    async (params?: { applicationId?: string; specimenNo?: string }) => {
      const pendingItemsByApplication = {
        'APP-001': [
          {
            abnormalFlag: false,
            applicationId: 'APP-001',
            applicationNo: 'M2-001',
            barcode: 'BC-001',
            batchAbnormalFlag: false,
            checkInStatus: 'CHECKED_IN',
            containerCount: 1,
            containerName: '福尔马林瓶',
            fixationStatus: 'COMPLETED',
            latestTrackingAt: '2026-06-01T09:00:00',
            patientName: 'Alice',
            registeredAt: '2026-06-01T08:00:00',
            reminderCount: 0,
            specimenConfirmedAt: '2026-06-01T08:30:00',
            specimenId: 'SPEC-001',
            specimenNo: 'SP-001',
            specimenStatus: 'IN_TRANSIT',
            submittingDepartmentId: 'DEPT-001',
            submittingDepartmentName: '手术室2',
            transportOrderId: 'TO-001',
            unreceivedCount: 1,
            verificationStatus: 'VERIFIED',
          },
        ],
        'APP-002': [
          {
            abnormalFlag: false,
            applicationId: 'APP-002',
            applicationNo: 'M2-002',
            barcode: 'BC-003',
            batchAbnormalFlag: false,
            checkInStatus: 'CHECKED_IN',
            containerCount: 1,
            containerName: '福尔马林瓶',
            fixationStatus: 'COMPLETED',
            latestTrackingAt: '2026-06-01T09:20:00',
            patientName: 'Bob',
            registeredAt: '2026-06-01T08:10:00',
            reminderCount: 0,
            specimenConfirmedAt: '2026-06-01T08:40:00',
            specimenId: 'SPEC-003',
            specimenNo: 'SP-003',
            specimenStatus: 'IN_TRANSIT',
            submittingDepartmentId: 'DEPT-002',
            submittingDepartmentName: '手术室3',
            transportOrderId: 'TO-002',
            unreceivedCount: 1,
            verificationStatus: 'VERIFIED',
          },
        ],
      } as const;

      if (!params?.applicationId && !params?.specimenNo) {
        const items = Object.values(pendingItemsByApplication).flat();
        return {
          items: [...items],
          page: 1,
          size: 500,
          total: items.length,
        };
      }

      if (params?.applicationId) {
        return {
          items: [
            ...(pendingItemsByApplication[
              params.applicationId as 'APP-001' | 'APP-002'
            ] ?? []),
          ],
          page: 1,
          size: 500,
          total: (
            pendingItemsByApplication[
              params.applicationId as 'APP-001' | 'APP-002'
            ] ?? []
          ).length,
        };
      }

      const applicationId =
        params?.specimenNo === 'SP-003' ? 'APP-002' : 'APP-001';
      const items = pendingItemsByApplication[applicationId];

      return {
        items: [...items],
        page: 1,
        size: 500,
        total: items.length,
      };
    },
  ),
  directReceiveSpecimensMock: vi.fn(async () => ({
    receiptStatus: 'PARTIALLY_RECEIVED',
    unreceivedCount: 1,
  })),
  listSpecimensMock: vi.fn(
    async (params?: { applicationNo?: string; keyword?: string }) => {
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
          applicationId: 'APP-001',
          applicationNo: 'M2-001',
          barcode: 'BC-002',
          checkInStatus: 'CHECKED_IN',
          checkedInAt: '2026-06-01T08:42:00',
          checkedInByName: '入库员乙',
          fixationStatus: 'COMPLETED',
          labelPrintBatchNo: 'BATCH-001',
          labelPrintStatus: 'SUCCESS',
          latestTrackingAt: '2026-06-01T09:02:00',
          patientName: 'Alice',
          receiptStatus: 'RECEIVED',
          registeredAt: '2026-06-01T08:05:00',
          specimenConfirmedAt: '2026-06-01T08:31:00',
          specimenId: 'SPEC-002',
          specimenName: '乳腺补充组织',
          specimenNo: 'SP-002',
          specimenSite: '乳腺',
          specimenStatus: 'RECEIVED',
          specimenType: '常规',
          submittingDepartmentId: 'DEPT-001',
          submittingDepartmentName: '手术室2',
          verificationStatus: 'VERIFIED',
        },
        {
          abnormalFlag: false,
          applicationId: 'APP-002',
          applicationNo: 'M2-002',
          barcode: 'BC-003',
          checkInStatus: 'CHECKED_IN',
          checkedInAt: '2026-06-01T08:45:00',
          checkedInByName: '入库员丙',
          fixationStatus: 'COMPLETED',
          labelPrintBatchNo: 'BATCH-002',
          labelPrintStatus: 'PENDING',
          latestTrackingAt: '2026-06-01T09:12:00',
          patientName: 'Bob',
          registeredAt: '2026-06-01T08:15:00',
          specimenConfirmedAt: '2026-06-01T08:38:00',
          specimenId: 'SPEC-003',
          specimenName: '肺组织',
          specimenNo: 'SP-003',
          specimenSite: '肺叶',
          specimenStatus: 'IN_TRANSIT',
          specimenType: '冰冻',
          submittingDepartmentId: 'DEPT-002',
          submittingDepartmentName: '手术室3',
          verificationStatus: 'VERIFIED',
        },
        {
          abnormalFlag: false,
          applicationId: 'APP-001-SIMILAR',
          applicationNo: 'M2-001-EXTRA',
          barcode: 'BC-SIMILAR',
          checkInStatus: 'CHECKED_IN',
          checkedInAt: '2026-06-01T08:50:00',
          checkedInByName: '入库员丁',
          fixationStatus: 'COMPLETED',
          labelPrintBatchNo: 'BATCH-SIMILAR',
          labelPrintStatus: 'PENDING',
          latestTrackingAt: '2026-06-01T09:18:00',
          patientName: 'Charlie',
          registeredAt: '2026-06-01T08:20:00',
          specimenConfirmedAt: '2026-06-01T08:45:00',
          specimenId: 'SPEC-SIMILAR',
          specimenName: '相似申请单组织',
          specimenNo: 'SP-SIMILAR',
          specimenSite: '胃',
          specimenStatus: 'IN_TRANSIT',
          specimenType: '常规',
          submittingDepartmentId: 'DEPT-003',
          submittingDepartmentName: '手术室4',
          verificationStatus: 'VERIFIED',
        },
      ];

      return {
        items: source.filter(
          (item) =>
            (!keyword ||
              [item.specimenId, item.specimenNo, item.barcode].some((value) =>
                value.includes(keyword),
              )) &&
            (!params?.applicationNo ||
              item.applicationNo.includes(params.applicationNo)),
        ),
        page: 1,
        size: 500,
        summary: {
          abnormalCount: 0,
          labelPrintedCount: 0,
          pendingLabelCount: 0,
          totalCount: source.length,
        },
        total: source.length,
      };
    },
  ),
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
  downloadFileFromBlob: downloadFileFromBlobMock,
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
  getApplicationDetail: getApplicationDetailMock,
  directReceiveSpecimens: directReceiveSpecimensMock,
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

  it('loads every pending receipt specimen by default', async () => {
    const wrapper = mountComposable();
    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    await state.loadPendingReceiptRows();
    await flushComposable();

    expect(listPendingReceiptsMock).toHaveBeenCalledWith({
      page: 1,
      size: 500,
    });
    expect(state.queueItems.value.map((item) => item.specimenId)).toEqual([
      'SPEC-001',
      'SPEC-003',
    ]);
    expect(
      state.queueItems.value.every((item) => item.queueStatus === 'PENDING'),
    ).toBe(true);
    expect(state.queueItems.value[0]?.specimenName).toBe('乳腺组织');
    expect(state.queueItems.value[1]?.specimenName).toBe('肺组织');
    expect(state.queueItems.value[0]?.patientIdLabel).toBe('PAT-001');
    expect(state.queueItems.value[1]?.patientIdLabel).toBe('PAT-002');

    wrapper.destroy();
  });

  it('expands a scanned specimen into all specimens under the same application', async () => {
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

    expect(state.queueItems.value).toHaveLength(2);
    expect(state.queueItems.value.map((item) => item.specimenId)).toEqual([
      'SPEC-001',
      'SPEC-002',
    ]);
    expect(state.queueItems.value[0]?.queueStatus).toBe('PENDING');
    expect(state.queueItems.value[1]?.queueStatus).toBe('RECEIVED');
    expect(state.queueItems.value[1]?.receivedAt).toBeNull();
    expect(state.queueItems.value[0]?.patientIdLabel).toBe('PAT-001');
    expect(state.queueItems.value[0]?.inpatientNo).toBe('ZY-001');
    expect(state.queueItems.value[0]?.surgeryName).toBe('惠侨楼 - 手术室 1');

    state.scanInput.value = 'SP-002';
    await state.handleQueueSpecimen();
    await flushComposable();

    expect(warningMock).not.toHaveBeenCalled();
    expect(state.queueItems.value).toHaveLength(2);
    expect(state.queueItems.value.map((item) => item.specimenId)).toEqual([
      'SPEC-001',
      'SPEC-002',
    ]);

    wrapper.destroy();
  });

  it('replaces the current list with the matched application specimens', async () => {
    const wrapper = mountComposable();
    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    await state.loadPendingReceiptRows();
    await flushComposable();
    expect(state.queueItems.value.map((item) => item.specimenId)).toEqual([
      'SPEC-001',
      'SPEC-003',
    ]);

    state.handleSelectionChange(state.queueItems.value);
    expect(state.selectedRowCount.value).toBe(2);

    state.scanInput.value = 'SP-001';
    await state.handleQueueSpecimen();
    await flushComposable();

    expect(state.queueItems.value.map((item) => item.specimenId)).toEqual([
      'SPEC-001',
      'SPEC-002',
    ]);
    expect(
      state.queueItems.value.some((item) => item.specimenId === 'SPEC-003'),
    ).toBe(false);
    expect(state.selectedRowCount.value).toBe(0);

    wrapper.destroy();
  });

  it('submits only receivable rows after expanding the application specimens', async () => {
    const wrapper = mountComposable();
    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    state.scanInput.value = 'SP-001';
    await state.handleQueueSpecimen();
    await flushComposable();

    state.handleOperatorChange({
      id: 'USER-ALT',
      name: 'Alt User',
    });
    state.handleSelectionChange(state.queueItems.value);
    state.openReceiveDialog();
    expect(state.receiveDialogVisible.value).toBe(true);
    expect(
      state.receiveTargetRows.value.map((item) => item.specimenId),
    ).toEqual(['SPEC-001']);
    state.receiveForm.logisticsStaffName = '物流员甲';
    state.handleReceiveUserChange({
      id: 'USER-ALT',
      name: 'Alt User',
    });
    await state.handleReceiveSelected();
    await flushComposable();

    expect(receiveSpecimensMock).toHaveBeenCalledTimes(1);
    expect(receiveSpecimensMock).toHaveBeenCalledWith({
      items: [
        {
          containerCount: 1,
          qualityCheckResult: 'PASSED',
          qualityIssueCodes: null,
          reason: null,
          receiptStatus: 'RECEIVED',
          remarks: null,
          specimenBarcode: 'BC-001',
        },
      ],
      logisticsStaffName: '物流员甲',
      receivedByName: 'Alt User',
      receivedByUserId: 'USER-ALT',
      terminalCode: null,
      transportOrderId: 'TO-001',
    });
    expect(state.receiveDialogVisible.value).toBe(false);
    expect(state.queueItems.value[0]?.queueStatus).toBe('SUCCESS');
    expect(state.queueItems.value[0]?.receivedByName).toBe('Alt User');
    expect(state.queueItems.value[1]?.queueStatus).toBe('RECEIVED');
    expect(state.queueItems.value[1]?.receivedByName).toBe('');

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

  it('submits abnormal direct receipt and updates queued row status', async () => {
    const wrapper = mountComposable();
    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    state.scanInput.value = 'SP-001';
    await state.handleQueueSpecimen();
    await flushComposable();

    state.handleSelectionChange(state.queueItems.value);
    state.openDirectReceiveDrawer();
    expect(state.directReceiveDialogVisible.value).toBe(true);
    expect(state.directReceiveItems.value[0]?.specimenBarcode).toBe('BC-001');

    state.directReceiveItems.value[0] = {
      ...state.directReceiveItems.value[0]!,
      qualityCheckResult: 'FAILED',
      qualityIssueCodes: ['CONTAINER_DAMAGE'],
      reason: '容器破损',
      receiptStatus: 'RETURNED',
    };
    await state.submitDirectReceive();
    await flushComposable();

    expect(directReceiveSpecimensMock).toHaveBeenCalledWith({
      items: [
        expect.objectContaining({
          qualityCheckResult: 'FAILED',
          qualityIssueCodes: ['CONTAINER_DAMAGE'],
          reason: '容器破损',
          receiptStatus: 'RETURNED',
          specimenBarcode: 'BC-001',
        }),
      ],
      receivedByName: 'Test User',
      receivedByUserId: 'USER-001',
      terminalCode: null,
    });
    expect(state.directReceiveDialogVisible.value).toBe(false);
    expect(state.queueItems.value[0]?.queueStatus).toBe('SUCCESS');
    expect(state.queueItems.value[0]?.specimenStatus).toBe('RETURNED');
    expect(state.queueItems.value[0]?.abnormalFlag).toBe(true);

    wrapper.destroy();
  });
});
