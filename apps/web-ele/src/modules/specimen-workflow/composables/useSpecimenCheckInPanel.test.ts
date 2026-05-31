import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

const {
  checkInSpecimenMock,
  downloadFileFromBlobMock,
  listSpecimensMock,
  retryLabelPrintMock,
  successMock,
  warningMock,
} = vi.hoisted(() => ({
  checkInSpecimenMock: vi.fn(async (barcode: string) => ({
    barcode,
    checkInStatus: 'CHECKED_IN',
    checkedInAt: '2026-05-26T09:10:00',
    checkedInByName: 'Test User',
    id: 'SPEC-CHECKIN',
    specimenNo: 'SP-001',
  })),
  downloadFileFromBlobMock: vi.fn(),
  listSpecimensMock: vi.fn(async (params?: { keyword?: string }) => {
    const keyword = params?.keyword ?? '';
    const source = [
      {
        abnormalFlag: false,
        applicationId: 'APP-CHECKIN',
        applicationNo: 'M2-001',
        barcode: 'BC-CHECKIN',
        checkInStatus: 'NOT_CHECKED_IN',
        checkedInAt: null,
        checkedInByName: null,
        fixationStatus: 'COMPLETED',
        labelPrintBatchNo: 'BATCH-1',
        labelPrintStatus: 'FAILED',
        latestTrackingAt: '2026-05-26 09:00:00',
        patientName: 'Alice',
        recentNode: 'CONFIRMATION',
        registeredAt: '2026-05-26 08:00:00',
        specimenConfirmedAt: '2026-05-26 08:50:00',
        specimenId: 'SPEC-CHECKIN',
        specimenName: '结肠息肉',
        specimenNo: 'SP-001',
        specimenSite: '结肠',
        specimenStatus: 'FIXED',
        specimenType: '组织',
        submittingDepartmentId: 'DEPT-001',
        submittingDepartmentName: 'Surgery',
        verificationCompletedAt: '2026-05-26 08:20:00',
        verificationStartedAt: '2026-05-26 08:15:00',
        verificationStatus: 'VERIFIED',
      },
      {
        abnormalFlag: false,
        applicationId: 'APP-DONE',
        applicationNo: 'M2-002',
        barcode: 'BC-DONE',
        checkInStatus: 'CHECKED_IN',
        checkedInAt: '2026-05-26 08:45:00',
        checkedInByName: 'Tester',
        fixationStatus: 'COMPLETED',
        labelPrintBatchNo: 'BATCH-1',
        labelPrintStatus: 'SUCCESS',
        latestTrackingAt: '2026-05-26 09:00:00',
        patientName: 'Bob',
        recentNode: 'CHECK_IN',
        registeredAt: '2026-05-26 08:00:00',
        specimenConfirmedAt: '2026-05-26 08:35:00',
        specimenId: 'SPEC-DONE',
        specimenName: '乳腺肿物',
        specimenNo: 'SP-002',
        specimenSite: '乳腺',
        specimenStatus: 'CHECKED_IN',
        specimenType: '组织',
        submittingDepartmentId: 'DEPT-001',
        submittingDepartmentName: 'Surgery',
        verificationCompletedAt: '2026-05-26 08:20:00',
        verificationStartedAt: '2026-05-26 08:15:00',
        verificationStatus: 'VERIFIED',
      },
    ];

    return {
      items: source.filter(
        (item) =>
          !keyword ||
          item.specimenNo.includes(keyword) ||
          item.specimenId.includes(keyword) ||
          item.barcode.includes(keyword),
      ),
      page: 1,
      size: 100,
      summary: {
        abnormalCount: 0,
        labelPrintedCount: 2,
        pendingLabelCount: 0,
        totalCount: 2,
      },
      total: source.length,
    };
  }),
  retryLabelPrintMock: vi.fn(async () => ({
    allSuccessful: true,
    failedCount: 0,
    labelPrintBatchNo: 'BATCH-1',
    message: null,
    retriedCount: 1,
    successCount: 1,
  })),
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
  downloadFileFromBlob: downloadFileFromBlobMock,
}));

vi.mock('element-plus', () => ({
  ElMessage: {
    success: successMock,
    warning: warningMock,
  },
}));

vi.mock('../api/specimen-workflow-service', () => ({
  checkInSpecimen: checkInSpecimenMock,
  listSpecimens: listSpecimensMock,
  retryLabelPrint: retryLabelPrintMock,
}));

import { useSpecimenCheckInPanel } from './useSpecimenCheckInPanel';

function createHarness() {
  let state: null | ReturnType<typeof useSpecimenCheckInPanel> = null;

  const Harness = defineComponent({
    setup() {
      state = useSpecimenCheckInPanel();
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

describe('useSpecimenCheckInPanel', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('supports quick check-in and queue state updates', async () => {
    const wrapper = mountComposable();
    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    state.scanInput.value = 'SP-001';
    await state.handleQuickCheckIn();
    await flushComposable();

    expect(checkInSpecimenMock).toHaveBeenCalledWith(
      'BC-CHECKIN',
      expect.objectContaining({
        operatorName: 'Test User',
      }),
    );
    expect(state.queueItems.value).toHaveLength(1);
    expect(state.queueItems.value[0]?.checkInStatus).toBe('CHECKED_IN');
    expect(state.pendingCount.value).toBe(0);

    wrapper.destroy();
  });

  it('supports retry label print and export', async () => {
    const wrapper = mountComposable();
    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    state.scanInput.value = 'SP-001';
    await state.handleQuickCheckIn();
    await flushComposable();

    state.operatorForm.printerCode = 'PRN-01';
    await state.handleRetryLabelPrint();
    await state.handleExport();
    await flushComposable();

    expect(retryLabelPrintMock).toHaveBeenCalledWith(
      'BATCH-1',
      expect.objectContaining({
        printerCode: 'PRN-01',
      }),
    );
    expect(downloadFileFromBlobMock).toHaveBeenCalled();

    wrapper.destroy();
  });
});
