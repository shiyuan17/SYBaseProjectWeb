import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  bindSpecimenBarcodeMock,
  buildSpecimenBatchPrintDocumentMock,
  confirmMock,
  downloadFileFromBlobMock,
  listOperatingBuildingOptionsMock,
  listSpecimensMock,
  retryLabelPrintMock,
  successMock,
  unbindSpecimenBarcodeMock,
  warningMock,
  windowOpenMock,
  workbenchLookupMock,
} = vi.hoisted(() => ({
  bindSpecimenBarcodeMock: vi.fn(async () => ({
    barcode: 'BC-NEW-001',
  })),
  buildSpecimenBatchPrintDocumentMock: vi.fn(() => '<html>print</html>'),
  confirmMock: vi.fn(async () => undefined),
  downloadFileFromBlobMock: vi.fn(),
  listOperatingBuildingOptionsMock: vi.fn(async () => [
    {
      buildingId: 'B001',
      buildingName: '惠侨楼',
      floors: 1,
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
      ],
    },
  ]),
  listSpecimensMock: vi.fn(
    async (params: {
      barcodeBindingStatus?: string;
      buildingId?: string;
      dateFrom?: string;
      dateTo?: string;
      roomId?: string;
    }) => {
      const unboundRow = {
        abnormalFlag: false,
        applicationId: 'APP-001',
        applicationNo: 'M2-001',
        barcode: null,
        barcodeBindingStatus: 'UNBOUND',
        buildingId: 'B001',
        checkInStatus: 'NOT_CHECKED_IN',
        containerCount: 1,
        containerName: '瓶',
        fixationStatus: 'PENDING',
        labelPrintBatchNo: 'LB-001',
        labelPrintStatus: 'SUCCESS',
        latestTrackingAt: '2026-05-20 09:00:00',
        patientGender: '女',
        patientId: 'P-001',
        patientName: 'Alice',
        registeredAt: '2026-05-20 08:00:00',
        registrationOperatorName: '李护士',
        roomId: 'OR-101',
        specimenCount: 1,
        specimenId: 'SPEC-001',
        specimenName: '乳腺组织',
        specimenNo: 'SP-001',
        specimenSite: '乳腺',
        specimenStatus: 'REGISTERED',
        specimenType: '常规',
        submittingDepartmentId: 'DEPT-001',
        submittingDepartmentName: '外科',
        surgeryName: '手术室 1',
        verificationStatus: 'UNVERIFIED',
      };
      const boundRow = {
        ...unboundRow,
        applicationId: 'APP-002',
        applicationNo: 'M2-002',
        barcode: 'BC-002',
        barcodeBindingStatus: 'BOUND',
        patientGender: '男',
        patientId: 'P-002',
        patientName: 'Bob',
        registeredAt: '2026-05-20 08:10:00',
        specimenId: 'SPEC-002',
        specimenName: '肺组织',
        specimenNo: 'SP-002',
      };
      const items =
        params.barcodeBindingStatus === 'UNBOUND'
          ? [unboundRow]
          : [unboundRow, boundRow];
      return {
        items,
        page: 1,
        size: 500,
        summary: {
          abnormalCount: 0,
          labelPrintedCount: 0,
          pendingLabelCount: 0,
          totalCount: items.length,
          unboundCount: 1,
        },
        total: items.length,
      };
    },
  ),
  retryLabelPrintMock: vi.fn(async () => ({
    allSuccessful: true,
    failedCount: 0,
    labelPrintBatchNo: 'LB-001',
    message: 'ok',
    retriedCount: 2,
    successCount: 2,
  })),
  successMock: vi.fn(),
  unbindSpecimenBarcodeMock: vi.fn(async () => ({
    barcode: null,
  })),
  warningMock: vi.fn(),
  windowOpenMock: vi.fn(() => ({
    document: {
      close: vi.fn(),
      open: vi.fn(),
      write: vi.fn(),
    },
  })),
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
      age: '35',
      applicationDate: '2026-05-20',
      applicationNo: keyword,
      applyDept: '外科',
      applyDoctor: '李医生',
      bedNo: null,
      checkItem: null,
      clinicalDiagnosis: null,
      clinicalHistory: null,
      deliveryRequirement: null,
      endoscopyDiagnosis: null,
      frozenReminder: false,
      gender: keyword === 'M2-001' ? '女' : '男',
      idNo: keyword === 'M2-001' ? 'ID-001' : 'ID-002',
      imagingResult: null,
      inpatientNo: null,
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
      buildingId: 'B001',
      clinicalFindings: null,
      fixativeType: null,
      fixationPerson: null,
      fixationTime: '2026-05-20T08:00:00',
      roomId: 'OR-101',
      specimenRemovalTime: '2026-05-20T07:30:00',
      surgeryName: '乳腺切除术',
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
  ElMessageBox: {
    confirm: confirmMock,
  },
}));

vi.mock('../api/application-registration-workbench-service', () => ({
  listOperatingBuildingOptions: listOperatingBuildingOptionsMock,
  lookupApplicationRegistrationWorkbenchRecord: workbenchLookupMock,
}));

vi.mock('../api/specimen-workflow-service', () => ({
  bindSpecimenBarcode: bindSpecimenBarcodeMock,
  listSpecimens: listSpecimensMock,
  retryLabelPrint: retryLabelPrintMock,
  unbindSpecimenBarcode: unbindSpecimenBarcodeMock,
}));

vi.mock('../utils/specimen-print', () => ({
  buildSpecimenBatchPrintDocument: buildSpecimenBatchPrintDocumentMock,
}));

import { useSpecimenBarcodeBindingPanel } from './useSpecimenBarcodeBindingPanel';

function createHarness() {
  let state: null | ReturnType<typeof useSpecimenBarcodeBindingPanel> = null;

  const Harness = defineComponent({
    setup() {
      state = useSpecimenBarcodeBindingPanel();
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

  const originalWindowOpen = window.open;
  window.open = windowOpenMock as unknown as typeof window.open;

  const app = createApp(Harness);
  app.mount(root);

  return {
    destroy() {
      app.unmount();
      root.remove();
      window.open = originalWindowOpen;
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

describe('useSpecimenBarcodeBindingPanel', () => {
  beforeEach(() => {
    listOperatingBuildingOptionsMock.mockClear();
    listSpecimensMock.mockClear();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('loads default unbound rows and supports bind/unbind workflow rules', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    await waitForComposableAssertion(() => {
      expect(listOperatingBuildingOptionsMock).toHaveBeenCalled();
      expect(listSpecimensMock).toHaveBeenCalledWith({
        barcodeBindingStatus: 'UNBOUND',
        buildingId: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        page: 1,
        roomId: undefined,
        size: 500,
      });
      expect(state.pagedItems.value).toHaveLength(1);
    });

    expect(state.summary.value.totalCount).toBe(1);
    expect(state.summary.value.unboundCount).toBe(1);
    expect(state.canBind.value).toBe(false);

    state.filters.onlyUnbound = false;
    state.filters.buildingId = 'B001';
    state.filters.roomId = 'OR-101';
    state.filters.dateRange = ['2026-05-20', '2026-05-21'];
    state.handleSearch();
    await flushComposable();

    expect(listSpecimensMock).toHaveBeenLastCalledWith({
      barcodeBindingStatus: undefined,
      buildingId: 'B001',
      dateFrom: '2026-05-20',
      dateTo: '2026-05-21',
      page: 1,
      roomId: 'OR-101',
      size: 500,
    });

    const [unboundRow, boundRow] = state.allRows.value;
    if (!unboundRow || !boundRow) {
      throw new Error('expected test rows to load');
    }

    state.handleSelectionChange([unboundRow]);
    state.targetBarcode.value = 'BC-NEW-001';
    expect(state.canBind.value).toBe(true);

    await state.handleBindBarcode();
    await flushComposable();

    expect(bindSpecimenBarcodeMock).toHaveBeenCalledWith('SPEC-001', {
      remarks: null,
      targetBarcode: 'BC-NEW-001',
      terminalCode: null,
    });
    expect(state.targetBarcode.value).toBe('');

    state.handleSelectionChange([boundRow]);
    expect(state.canUnbind.value).toBe(true);

    await state.handleUnbindBarcode();
    await flushComposable();

    expect(confirmMock).toHaveBeenCalledTimes(1);
    expect(unbindSpecimenBarcodeMock).toHaveBeenCalledWith('SPEC-002', {
      remarks: null,
      terminalCode: null,
    });

    wrapper.destroy();
  });

  it('supports retry, export, and grouped preprint actions', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    state.filters.onlyUnbound = false;
    state.handleSearch();
    await flushComposable();

    await waitForComposableAssertion(() => {
      expect(state.allRows.value).toHaveLength(2);
    });

    state.handleSelectionChange(state.allRows.value);
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

    state.handleExportExcel();
    expect(downloadFileFromBlobMock).toHaveBeenCalledTimes(1);

    state.handleSelectionChange(state.allRows.value);
    await state.handlePreprintBarcodes();
    await flushComposable();

    expect(buildSpecimenBatchPrintDocumentMock).toHaveBeenCalledTimes(2);
    expect(windowOpenMock).toHaveBeenCalledTimes(2);
    expect(workbenchLookupMock).toHaveBeenCalledTimes(2);

    wrapper.destroy();
  });
});
