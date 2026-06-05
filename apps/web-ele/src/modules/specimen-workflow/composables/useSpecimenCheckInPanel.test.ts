import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

const {
  checkInSpecimenMock,
  downloadFileFromBlobMock,
  listSpecimensMock,
  loadOperatingRoomNameMapSafelyMock,
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
  listSpecimensMock: vi.fn(
    async (params?: { applicationNo?: string; keyword?: string }) => {
      const applicationNo = params?.applicationNo ?? '';
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
          roomId: 'OR-102',
          surgeryName: 'OR-102',
          submittingDepartmentId: 'DEPT-001',
          submittingDepartmentName: 'Surgery',
          verificationCompletedAt: '2026-05-26 08:20:00',
          verificationStartedAt: '2026-05-26 08:15:00',
          verificationStatus: 'VERIFIED',
        },
        {
          abnormalFlag: false,
          applicationId: 'APP-CHECKIN',
          applicationNo: 'M2-001',
          barcode: 'BC-CHECKIN-SIBLING',
          checkInStatus: 'NOT_CHECKED_IN',
          checkedInAt: null,
          checkedInByName: null,
          fixationStatus: 'COMPLETED',
          labelPrintBatchNo: 'BATCH-1',
          labelPrintStatus: 'SUCCESS',
          latestTrackingAt: '2026-05-26 09:05:00',
          patientName: 'Alice',
          recentNode: 'CONFIRMATION',
          registeredAt: '2026-05-26 08:02:00',
          specimenConfirmedAt: '2026-05-26 08:55:00',
          specimenId: 'SPEC-CHECKIN-SIBLING',
          specimenName: '乙状结肠息肉',
          specimenNo: 'SP-001-2',
          specimenSite: '结肠',
          specimenStatus: 'FIXED',
          specimenType: '组织',
          roomId: 'OR-102',
          surgeryName: 'OR-102',
          submittingDepartmentId: 'DEPT-001',
          submittingDepartmentName: 'Surgery',
          verificationCompletedAt: '2026-05-26 08:25:00',
          verificationStartedAt: '2026-05-26 08:18:00',
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
          roomId: 'OR-103',
          surgeryName: 'OR-103',
          submittingDepartmentId: 'DEPT-001',
          submittingDepartmentName: 'Surgery',
          verificationCompletedAt: '2026-05-26 08:20:00',
          verificationStartedAt: '2026-05-26 08:15:00',
          verificationStatus: 'VERIFIED',
        },
        {
          abnormalFlag: false,
          applicationId: 'APP-UNCONFIRMED',
          applicationNo: 'M2-003',
          barcode: 'BC-UNCONFIRMED',
          checkInStatus: 'NOT_CHECKED_IN',
          checkedInAt: null,
          checkedInByName: null,
          fixationStatus: 'COMPLETED',
          labelPrintBatchNo: 'BATCH-2',
          labelPrintStatus: 'SUCCESS',
          latestTrackingAt: '2026-05-26 09:10:00',
          patientName: 'Carol',
          recentNode: 'VERIFICATION',
          registeredAt: '2026-05-26 08:05:00',
          specimenConfirmedAt: null,
          specimenId: 'SPEC-UNCONFIRMED',
          specimenName: '胃组织',
          specimenNo: 'SP-003',
          specimenSite: '胃',
          specimenStatus: 'FIXED',
          specimenType: '组织',
          roomId: 'OR-104',
          surgeryName: 'OR-104',
          submittingDepartmentId: 'DEPT-001',
          submittingDepartmentName: 'Surgery',
          verificationCompletedAt: '2026-05-26 08:25:00',
          verificationStartedAt: '2026-05-26 08:20:00',
          verificationStatus: 'VERIFIED',
        },
        {
          abnormalFlag: false,
          applicationId: 'APP-RECEIVED',
          applicationNo: 'M2-004',
          barcode: 'BC-RECEIVED',
          checkInStatus: 'CHECKED_IN',
          checkedInAt: '2026-05-26 08:50:00',
          checkedInByName: 'Receiver',
          fixationStatus: 'COMPLETED',
          labelPrintBatchNo: 'BATCH-3',
          labelPrintStatus: 'SUCCESS',
          latestTrackingAt: '2026-05-26 09:15:00',
          patientName: 'David',
          recentNode: 'RECEIPT',
          registeredAt: '2026-05-26 08:10:00',
          specimenConfirmedAt: '2026-05-26 08:40:00',
          specimenId: 'SPEC-RECEIVED',
          specimenName: '肺组织',
          specimenNo: 'SP-004',
          specimenSite: '肺',
          specimenStatus: 'RECEIVED',
          specimenType: '组织',
          roomId: 'OR-105',
          surgeryName: 'OR-105',
          submittingDepartmentId: 'DEPT-001',
          submittingDepartmentName: 'Surgery',
          verificationCompletedAt: '2026-05-26 08:30:00',
          verificationStartedAt: '2026-05-26 08:20:00',
          verificationStatus: 'VERIFIED',
        },
        {
          abnormalFlag: false,
          applicationId: 'APP-PARTIAL-CHECKIN',
          applicationNo: 'M2-005',
          barcode: 'BC-PARTIAL-READY',
          checkInStatus: 'NOT_CHECKED_IN',
          checkedInAt: null,
          checkedInByName: null,
          fixationStatus: 'COMPLETED',
          labelPrintBatchNo: 'BATCH-4',
          labelPrintStatus: 'SUCCESS',
          latestTrackingAt: '2026-05-26 09:20:00',
          patientName: 'Eve',
          recentNode: 'CONFIRMATION',
          registeredAt: '2026-05-26 08:12:00',
          specimenConfirmedAt: '2026-05-26 08:42:00',
          specimenId: 'SPEC-PARTIAL-READY',
          specimenName: '阑尾组织',
          specimenNo: 'SP-005',
          specimenSite: '阑尾',
          specimenStatus: 'FIXED',
          specimenType: '组织',
          roomId: 'OR-106',
          surgeryName: 'OR-106',
          submittingDepartmentId: 'DEPT-001',
          submittingDepartmentName: 'Surgery',
          verificationCompletedAt: '2026-05-26 08:32:00',
          verificationStartedAt: '2026-05-26 08:22:00',
          verificationStatus: 'VERIFIED',
        },
        {
          abnormalFlag: false,
          applicationId: 'APP-PARTIAL-CHECKIN',
          applicationNo: 'M2-005',
          barcode: 'BC-PARTIAL-BLOCKED',
          checkInStatus: 'NOT_CHECKED_IN',
          checkedInAt: null,
          checkedInByName: null,
          fixationStatus: 'COMPLETED',
          labelPrintBatchNo: 'BATCH-4',
          labelPrintStatus: 'SUCCESS',
          latestTrackingAt: '2026-05-26 09:21:00',
          patientName: 'Eve',
          recentNode: 'VERIFICATION',
          registeredAt: '2026-05-26 08:13:00',
          specimenConfirmedAt: null,
          specimenId: 'SPEC-PARTIAL-BLOCKED',
          specimenName: '盲肠组织',
          specimenNo: 'SP-005-2',
          specimenSite: '盲肠',
          specimenStatus: 'FIXED',
          specimenType: '组织',
          roomId: 'OR-106',
          surgeryName: 'OR-106',
          submittingDepartmentId: 'DEPT-001',
          submittingDepartmentName: 'Surgery',
          verificationCompletedAt: '2026-05-26 08:33:00',
          verificationStartedAt: '2026-05-26 08:23:00',
          verificationStatus: 'VERIFIED',
        },
        {
          abnormalFlag: false,
          applicationId: 'APP-SIBLING-RECEIVED',
          applicationNo: 'M2-006',
          barcode: 'BC-SIBLING-READY',
          checkInStatus: 'NOT_CHECKED_IN',
          checkedInAt: null,
          checkedInByName: null,
          fixationStatus: 'COMPLETED',
          labelPrintBatchNo: 'BATCH-5',
          labelPrintStatus: 'SUCCESS',
          latestTrackingAt: '2026-05-26 09:24:00',
          patientName: 'Frank',
          recentNode: 'CONFIRMATION',
          registeredAt: '2026-05-26 08:14:00',
          specimenConfirmedAt: '2026-05-26 08:44:00',
          specimenId: 'SPEC-SIBLING-READY',
          specimenName: '甲状腺组织',
          specimenNo: 'SP-006',
          specimenSite: '甲状腺',
          specimenStatus: 'FIXED',
          specimenType: '组织',
          roomId: 'OR-107',
          surgeryName: 'OR-107',
          submittingDepartmentId: 'DEPT-001',
          submittingDepartmentName: 'Surgery',
          verificationCompletedAt: '2026-05-26 08:34:00',
          verificationStartedAt: '2026-05-26 08:24:00',
          verificationStatus: 'VERIFIED',
        },
        {
          abnormalFlag: false,
          applicationId: 'APP-SIBLING-RECEIVED',
          applicationNo: 'M2-006',
          barcode: 'BC-SIBLING-RECEIVED',
          checkInStatus: 'CHECKED_IN',
          checkedInAt: '2026-05-26 08:56:00',
          checkedInByName: 'Receiver',
          fixationStatus: 'COMPLETED',
          labelPrintBatchNo: 'BATCH-5',
          labelPrintStatus: 'SUCCESS',
          latestTrackingAt: '2026-05-26 09:25:00',
          patientName: 'Frank',
          recentNode: 'RECEIPT',
          registeredAt: '2026-05-26 08:15:00',
          specimenConfirmedAt: '2026-05-26 08:45:00',
          specimenId: 'SPEC-SIBLING-RECEIVED',
          specimenName: '淋巴结',
          specimenNo: 'SP-006-2',
          specimenSite: '颈部',
          specimenStatus: 'RECEIVED',
          specimenType: '组织',
          roomId: 'OR-107',
          surgeryName: 'OR-107',
          submittingDepartmentId: 'DEPT-001',
          submittingDepartmentName: 'Surgery',
          verificationCompletedAt: '2026-05-26 08:35:00',
          verificationStartedAt: '2026-05-26 08:25:00',
          verificationStatus: 'VERIFIED',
        },
      ];

      return {
        items: source.filter((item) => {
          const matchesKeyword =
            !keyword ||
            item.specimenNo.includes(keyword) ||
            item.specimenId.includes(keyword) ||
            item.barcode.includes(keyword);
          const matchesApplicationNo =
            !applicationNo || item.applicationNo === applicationNo;
          return matchesKeyword && matchesApplicationNo;
        }),
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
    },
  ),
  loadOperatingRoomNameMapSafelyMock: vi.fn(
    async () => new Map([['OR-102', '惠侨楼 - 手术室 2']]),
  ),
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
      loginName: 'test-user',
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

vi.mock('./useOperatorVerificationPrompt', () => ({
  useOperatorVerificationPrompt: () => ({
    verifyOperator: vi.fn(async () => 'TOKEN-VERIFY'),
  }),
}));

vi.mock('../utils/operating-room-display', () => ({
  loadOperatingRoomNameMapSafely: loadOperatingRoomNameMapSafelyMock,
  resolveOperatingRoomDisplayName: vi.fn(
    (
      roomMap: ReadonlyMap<string, string>,
      roomId?: null | string,
      fallbackValue?: null | string,
    ) => {
      if (roomId) {
        return roomMap.get(roomId) ?? roomId;
      }
      return fallbackValue?.trim() ?? '';
    },
  ),
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

    expect(state.operatorForm.operatorName).toBe('Test User');
    expect(state.operatorForm.operatorUserId).toBe('USER-001');
    state.handleOperatorChange({
      id: 'USER-ALT',
      loginName: 'alt-user',
      name: 'Alt User',
    });
    checkInSpecimenMock.mockResolvedValueOnce({
      barcode: 'BC-CHECKIN',
      checkInStatus: 'CHECKED_IN',
      checkedInAt: '2026-05-26T09:10:00',
      checkedInByName: '接口返回入库人',
      id: 'SPEC-CHECKIN',
      specimenNo: 'SP-001',
    });
    state.scanInput.value = 'SP-001';
    await state.handleQuickCheckIn();
    await flushComposable();

    expect(checkInSpecimenMock).not.toHaveBeenCalled();
    expect(state.queueItems.value).toHaveLength(2);
    expect(
      state.queueItems.value.some(
        (item) =>
          item.specimenId === 'SPEC-CHECKIN' &&
          item.displayCheckInStatus === '入库未保存',
      ),
    ).toBe(true);
    expect(
      state.queueItems.value.some(
        (item) => item.specimenId === 'SPEC-CHECKIN-SIBLING',
      ),
    ).toBe(true);

    await state.handlePrimaryCheckIn();
    await flushComposable();

    expect(checkInSpecimenMock).toHaveBeenCalledWith(
      'BC-CHECKIN',
      expect.objectContaining({
        operatorName: 'Alt User',
        operatorUserId: 'USER-ALT',
        operatorVerificationToken: 'TOKEN-VERIFY',
        remarks: null,
        specimenBarcode: 'BC-CHECKIN',
        terminalCode: null,
      }),
    );
    expect(checkInSpecimenMock).toHaveBeenCalledWith(
      'BC-CHECKIN-SIBLING',
      expect.objectContaining({
        operatorName: 'Alt User',
        operatorUserId: 'USER-ALT',
        operatorVerificationToken: 'TOKEN-VERIFY',
        specimenBarcode: 'BC-CHECKIN-SIBLING',
      }),
    );
    expect(state.queueItems.value).toHaveLength(2);
    expect(
      state.queueItems.value.some(
        (item) =>
          item.specimenId === 'SPEC-CHECKIN' &&
          item.checkInStatus === 'CHECKED_IN' &&
          item.checkedInByName === '接口返回入库人' &&
          item.surgeryName === '惠侨楼 - 手术室 2',
      ),
    ).toBe(true);
    expect(state.pendingCount.value).toBe(0);

    wrapper.destroy();
  });

  it('uses selected queue rows when the primary check-in action has no scan input', async () => {
    const wrapper = mountComposable();
    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    state.scanInput.value = 'SP-001';
    await state.handleQuickCheckIn();
    await flushComposable();
    expect(checkInSpecimenMock).not.toHaveBeenCalled();

    const queuedRow = state.queueItems.value.find(
      (item) => item.specimenId === 'SPEC-CHECKIN',
    );
    if (!queuedRow) {
      throw new Error('queue row not initialized');
    }

    state.scanInput.value = '';
    state.handleSelectionChange([queuedRow]);
    await state.handlePrimaryCheckIn();
    await flushComposable();

    expect(checkInSpecimenMock).toHaveBeenCalledWith(
      'BC-CHECKIN',
      expect.objectContaining({
        operatorVerificationToken: 'TOKEN-VERIFY',
        specimenBarcode: 'BC-CHECKIN',
      }),
    );

    wrapper.destroy();
  });

  it('warns differently for no selection and already checked-in selections', async () => {
    const wrapper = mountComposable();
    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    await state.handlePrimaryCheckIn();
    expect(warningMock).toHaveBeenCalledWith('请先选择需要入库的标本');

    state.scanInput.value = 'SP-002';
    await state.handleQuickCheckIn();
    await flushComposable();

    expect(checkInSpecimenMock).not.toHaveBeenCalled();
    expect(state.queueItems.value).toHaveLength(1);
    expect(state.queueItems.value[0]?.specimenId).toBe('SPEC-DONE');
    expect(warningMock).toHaveBeenCalledWith('标本已完成入库，无需重复操作');

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
    const exportBlob = downloadFileFromBlobMock.mock.calls[0]?.[0]?.source;
    expect(exportBlob).toBeInstanceOf(Blob);
    await expect(exportBlob?.text()).resolves.toContain('惠侨楼 - 手术室 2');

    wrapper.destroy();
  });

  it('warns when the specimen is already checked in', async () => {
    const wrapper = mountComposable();
    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    state.scanInput.value = 'SP-002';
    await state.handleQuickCheckIn();
    await flushComposable();

    expect(checkInSpecimenMock).not.toHaveBeenCalled();
    expect(state.queueItems.value).toHaveLength(1);
    expect(state.queueItems.value[0]?.specimenId).toBe('SPEC-DONE');
    expect(warningMock).toHaveBeenCalledWith('标本已完成入库，无需重复操作');

    wrapper.destroy();
  });

  it('warns when the specimen is not confirmed yet', async () => {
    const wrapper = mountComposable();
    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    state.scanInput.value = 'SP-003';
    await state.handleQuickCheckIn();
    await flushComposable();

    expect(checkInSpecimenMock).not.toHaveBeenCalled();
    expect(state.queueItems.value).toHaveLength(1);
    expect(state.queueItems.value[0]?.specimenId).toBe('SPEC-UNCONFIRMED');
    expect(warningMock).toHaveBeenCalledWith(
      '标本 SP-003 尚未完成标本确认，不能入库',
    );

    wrapper.destroy();
  });

  it('allows check-in even when another specimen in the same application is not ready', async () => {
    const wrapper = mountComposable();
    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    state.scanInput.value = 'SP-005';
    await state.handleQuickCheckIn();
    await flushComposable();

    expect(state.queueItems.value).toHaveLength(2);
    expect(
      state.queueItems.value.find(
        (item) => item.specimenId === 'SPEC-PARTIAL-BLOCKED',
      )?.canCheckIn,
    ).toBe(false);
    expect(checkInSpecimenMock).not.toHaveBeenCalled();
    await state.handlePrimaryCheckIn();
    await flushComposable();

    expect(checkInSpecimenMock).toHaveBeenCalledWith(
      'BC-PARTIAL-READY',
      expect.objectContaining({
        operatorVerificationToken: 'TOKEN-VERIFY',
        specimenBarcode: 'BC-PARTIAL-READY',
      }),
    );
    expect(warningMock).not.toHaveBeenCalledWith(
      '申请单下标本 SP-005-2 尚未完成标本确认，当前不能入库',
    );

    wrapper.destroy();
  });

  it('allows check-in when a sibling specimen is already received', async () => {
    const wrapper = mountComposable();
    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    state.scanInput.value = 'SP-006';
    await state.handleQuickCheckIn();
    await flushComposable();

    expect(state.queueItems.value).toHaveLength(2);
    expect(
      state.queueItems.value.find(
        (item) => item.specimenId === 'SPEC-SIBLING-RECEIVED',
      )?.displayCheckInStatus,
    ).toBe('已接收');
    expect(checkInSpecimenMock).not.toHaveBeenCalled();
    await state.handlePrimaryCheckIn();
    await flushComposable();

    expect(checkInSpecimenMock).toHaveBeenCalledWith(
      'BC-SIBLING-READY',
      expect.objectContaining({
        operatorVerificationToken: 'TOKEN-VERIFY',
        specimenBarcode: 'BC-SIBLING-READY',
      }),
    );

    wrapper.destroy();
  });

  it('warns when the specimen has reached receipt terminal status', async () => {
    const wrapper = mountComposable();
    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    state.scanInput.value = 'SP-004';
    await state.handleQuickCheckIn();
    await flushComposable();

    expect(checkInSpecimenMock).not.toHaveBeenCalled();
    expect(state.queueItems.value).toHaveLength(1);
    expect(state.queueItems.value[0]?.specimenId).toBe('SPEC-RECEIVED');
    expect(warningMock).toHaveBeenCalledWith(
      '标本已接收、拒收或退回，不能再入库',
    );

    wrapper.destroy();
  });

  it('warns when the specimen cannot be found', async () => {
    const wrapper = mountComposable();
    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    state.scanInput.value = 'SP-404';
    await state.handleQuickCheckIn();
    await flushComposable();

    expect(checkInSpecimenMock).not.toHaveBeenCalled();
    expect(warningMock).toHaveBeenCalledWith('未找到可入库标本');

    wrapper.destroy();
  });

  it('does not keep inline page errors for request failures and marks the row failed', async () => {
    const wrapper = mountComposable();
    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    checkInSpecimenMock.mockRejectedValueOnce({
      response: {
        data: {
          code: 'OPERATION_NOT_ALLOWED',
          message: 'Specimen must complete verification before check-in',
        },
        status: 409,
      },
    });

    state.scanInput.value = 'SP-001';
    await expect(state.handleQuickCheckIn()).resolves.toBeUndefined();
    await flushComposable();
    expect(checkInSpecimenMock).not.toHaveBeenCalled();
    successMock.mockClear();

    await state.handlePrimaryCheckIn();
    await flushComposable();

    expect(state.pageError.value).toBe('');
    expect(state.queueItems.value).toHaveLength(2);
    expect(
      state.queueItems.value.find((item) => item.specimenId === 'SPEC-CHECKIN')
        ?.queueStatus,
    ).toBe('FAILED');
    expect(
      state.queueItems.value.find(
        (item) => item.specimenId === 'SPEC-CHECKIN-SIBLING',
      )?.queueStatus,
    ).toBe('SUCCESS');
    expect(successMock).toHaveBeenCalledWith('标本入库成功');

    wrapper.destroy();
  });
});
