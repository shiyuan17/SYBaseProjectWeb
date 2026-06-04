import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import SpecimenCheckInPanel from './SpecimenCheckInPanel.vue';

const {
  checkInSpecimenMock,
  handlePrimaryCheckInMock,
  listSpecimensMock,
  loadOperatingRoomNameMapSafelyMock,
  pageErrorTextMock,
  retryLabelPrintMock,
} = vi.hoisted(() => ({
  checkInSpecimenMock: vi.fn(async (barcode: string) => ({
    barcode,
    checkInStatus: 'CHECKED_IN',
    checkedInAt: '2026-05-26T09:10:00',
    checkedInByName: 'Test User',
    id: 'SPEC-CHECKIN',
    specimenNo: 'SP-001',
  })),
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
  loadOperatingRoomNameMapSafelyMock: vi.fn(
    async () => new Map([['OR-102', '惠侨楼 - 手术室 2']]),
  ),
  handlePrimaryCheckInMock: vi.fn(),
  pageErrorTextMock: { value: '' },
  retryLabelPrintMock: vi.fn(async () => ({
    allSuccessful: true,
    failedCount: 0,
    labelPrintBatchNo: 'BATCH-1',
    message: null,
    retriedCount: 1,
    successCount: 1,
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

vi.mock('#/modules/system-management/components/SystemUserSelect.vue', () => ({
  default: {
    props: ['modelValue', 'placeholder', 'selectedLabel'],
    template:
      '<div data-testid="system-user-select">{{ placeholder }}{{ selectedLabel }}</div>',
  },
}));

vi.mock('element-plus', async () => {
  const actual =
    await vi.importActual<typeof import('element-plus')>('element-plus');
  return {
    ...actual,
    ElMessage: { success: vi.fn(), warning: vi.fn() },
  };
});

vi.mock('../api/specimen-workflow-service', () => ({
  checkInSpecimen: checkInSpecimenMock,
  listSpecimens: listSpecimensMock,
  retryLabelPrint: retryLabelPrintMock,
}));

vi.mock('../composables/useSpecimenCheckInPanel', async () => {
  const { computed, ref } = await import('vue');

  const queueItems = ref([
    {
      applicationId: 'APP-CHECKIN',
      applicationNo: 'M2-001',
      barcode: 'BC-CHECKIN',
      checkInStatus: 'CHECKED_IN',
      checkedInAt: '2026-05-26T09:10:00',
      checkedInByName: 'Test User',
      fixationStatus: 'COMPLETED',
      labelPrintBatchNo: 'BATCH-1',
      labelPrintStatus: 'FAILED',
      latestTrackingAt: '2026-05-26 09:00:00',
      patientName: 'Alice',
      queueAddedAt: '2026-06-01T14:32:28.880Z',
      queueAddedByName: 'Test User',
      queueStatus: 'SUCCESS',
      checkInDisabledReason: '标本已完成入库，无需重复操作',
      checkInStatusTagType: 'success',
      displayCheckInStatus: '已入库',
      canCheckIn: false,
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
      surgeryName: '惠侨楼 - 手术室 2',
      verificationCompletedAt: '2026-05-26 08:20:00',
      verificationStartedAt: '2026-05-26 08:15:00',
      verificationStatus: 'VERIFIED',
    },
    {
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
      queueAddedAt: '2026-06-01T14:33:28.880Z',
      queueAddedByName: 'Test User',
      queueStatus: 'PENDING',
      checkInDisabledReason: null,
      checkInStatusTagType: 'info',
      displayCheckInStatus: '待入库',
      canCheckIn: true,
      recentNode: 'CONFIRMATION',
      registeredAt: '2026-05-26 08:02:00',
      specimenConfirmedAt: '2026-05-26 08:55:00',
      specimenId: 'SPEC-CHECKIN-SIBLING',
      specimenName: '乙状结肠息肉',
      specimenNo: 'SP-001-2',
      specimenSite: '结肠',
      specimenStatus: 'FIXED',
      specimenType: '组织',
      submittingDepartmentId: 'DEPT-001',
      submittingDepartmentName: 'Surgery',
      surgeryName: '惠侨楼 - 手术室 2',
      verificationCompletedAt: '2026-05-26 08:25:00',
      verificationStartedAt: '2026-05-26 08:18:00',
      verificationStatus: 'VERIFIED',
    },
    {
      applicationId: 'APP-RECEIVED',
      applicationNo: 'M2-003',
      barcode: 'BC-RECEIVED',
      checkInStatus: 'CHECKED_IN',
      checkedInAt: '2026-05-26T09:20:00',
      checkedInByName: 'Receiver',
      fixationStatus: 'COMPLETED',
      labelPrintBatchNo: 'BATCH-2',
      labelPrintStatus: 'SUCCESS',
      latestTrackingAt: '2026-05-26 09:20:00',
      patientName: 'Carol',
      queueAddedAt: '2026-06-01T14:34:28.880Z',
      queueAddedByName: 'Test User',
      queueStatus: 'SUCCESS',
      checkInDisabledReason: '标本已接收、拒收或退回，不能再入库',
      checkInStatusTagType: 'warning',
      displayCheckInStatus: '已接收',
      canCheckIn: false,
      recentNode: 'RECEIPT',
      registeredAt: '2026-05-26 08:10:00',
      specimenConfirmedAt: '2026-05-26 08:45:00',
      specimenId: 'SPEC-RECEIVED',
      specimenName: '肺组织',
      specimenNo: 'SP-003',
      specimenSite: '肺',
      specimenStatus: 'RECEIVED',
      specimenType: '组织',
      submittingDepartmentId: 'DEPT-001',
      submittingDepartmentName: 'Surgery',
      surgeryName: 'OR-105',
      verificationCompletedAt: '2026-05-26 08:30:00',
      verificationStartedAt: '2026-05-26 08:20:00',
      verificationStatus: 'VERIFIED',
    },
  ]);

  return {
    useSpecimenCheckInPanel: () => ({
      actionLoading: ref(false),
      clearQueue: vi.fn(),
      clearSelection: vi.fn(),
      exportLoading: ref(false),
      formatSpecimenStatus: vi.fn((status?: null | string) => {
        if (status === 'CHECKED_IN') {
          return '已入库';
        }
        if (status === 'FIXED') {
          return '固定完成';
        }
        if (status === 'RECEIVED') {
          return '已接收';
        }
        return status ?? '-';
      }),
      handleBatchCheckIn: vi.fn(),
      handleExport: vi.fn(),
      handleManualCheckIn: vi.fn(),
      handleOperatorChange: vi.fn(),
      handlePrimaryCheckIn: handlePrimaryCheckInMock,
      handleQuickCheckIn: vi.fn(),
      handleRemoveRow: vi.fn(),
      handleReset: vi.fn(),
      handleRetryLabelPrint: vi.fn(),
      handleSelectionChange: vi.fn(),
      isCheckInReady: vi.fn(() => true),
      loading: ref(false),
      operatorForm: {
        operatorName: 'Test User',
        operatorUserId: 'USER-001',
      },
      pageError: ref(pageErrorTextMock.value),
      pendingCount: computed(() => 1),
      queueItems,
      retryLoading: ref(false),
      scanInput: ref(''),
      selectedCount: computed(() => 0),
      selectedRows: computed(() => []),
    }),
  };
});

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

function mountView() {
  const container = document.createElement('div');
  document.body.append(container);
  const app = createApp({
    render: () => h(SpecimenCheckInPanel),
  });

  app.directive('loading', {});
  app.mount(container);

  return { app, container };
}

async function flush() {
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

describe('SpecimenCheckInPanel', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    pageErrorTextMock.value = '';
    vi.clearAllMocks();
  });

  it('supports quick enter check-in and queue actions', async () => {
    const { app, container } = mountView();
    await flush();

    expect(container.textContent).toContain('已入库 2 条');
    expect(container.textContent).toContain('待处理 1 条');
    expect(container.textContent).toContain('固定完成');
    expect(container.textContent).toContain('待入库');
    expect(container.textContent).toContain('惠侨楼 - 手术室 2');
    expect(container.textContent).toContain('M2-001');
    expect(container.textContent).toContain('SP-001-2');
    expect(container.textContent).toContain('已接收');
    expect(container.textContent).not.toContain('Surgery');

    app.unmount();
  });

  it('shows real specimen status and derived check-in status separately', async () => {
    const { app, container } = mountView();
    await flush();

    expect(container.textContent).toContain('已入库');
    expect(container.textContent).toContain('待入库');
    expect(container.textContent).toContain('固定完成');
    expect(container.textContent).toContain('已接收');

    const buttons = [...container.querySelectorAll('button')].map((button) => ({
      disabled: button.disabled,
      text: button.textContent?.trim(),
      title: button.getAttribute('title'),
    }));
    expect(
      buttons.some(
        (button) =>
          button.text === '入库' &&
          button.disabled &&
          button.title === '标本已完成入库，无需重复操作',
      ),
    ).toBe(true);
    expect(
      buttons.some(
        (button) =>
          button.text === '入库' &&
          button.disabled &&
          button.title === '标本已接收、拒收或退回，不能再入库',
      ),
    ).toBe(true);

    app.unmount();
  });

  it('hides the removed top action elements', async () => {
    const { app, container } = mountView();
    await flush();

    expect(
      container.querySelector('input[placeholder="打印机编号"]'),
    ).toBeNull();
    expect(container.querySelector('input[placeholder="终端编号"]')).toBeNull();
    expect(container.textContent).not.toContain('批量入库');
    expect(container.textContent).not.toContain('清除选择行');
    expect(container.textContent).not.toContain('清除列表');
    expect(container.textContent).toContain('补打标本标签');

    app.unmount();
  });

  it('binds the top check-in button to the primary check-in action', async () => {
    const { app, container } = mountView();
    await flush();

    const checkInButton = [...container.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === '标本入库',
    );
    if (!checkInButton) {
      throw new Error('top check-in button not found');
    }

    checkInButton.click();
    await flush();

    expect(handlePrimaryCheckInMock).toHaveBeenCalledTimes(1);

    app.unmount();
  });

  it('does not render inline error alerts in the tab even when pageError exists', async () => {
    pageErrorTextMock.value = '标本尚未完成核对，不能入库。';
    const { app, container } = mountView();
    await flush();

    expect(container.textContent).not.toContain('标本尚未完成核对，不能入库。');

    app.unmount();
  });
});
