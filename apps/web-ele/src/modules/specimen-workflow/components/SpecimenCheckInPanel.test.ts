import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import SpecimenCheckInPanel from './SpecimenCheckInPanel.vue';

const {
  checkInSpecimenMock,
  listSpecimensMock,
  loadOperatingRoomNameMapSafelyMock,
  retryLabelPrintMock,
} =
  vi.hoisted(() => ({
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
    loadOperatingRoomNameMapSafelyMock: vi.fn(async () =>
      new Map([['OR-102', '惠侨楼 - 手术室 2']]),
    ),
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
  ]);

  return {
    useSpecimenCheckInPanel: () => ({
      actionLoading: ref(false),
      clearQueue: vi.fn(),
      clearSelection: vi.fn(),
      exportLoading: ref(false),
      formatSpecimenStatus: vi.fn(),
      handleBatchCheckIn: vi.fn(),
      handleExport: vi.fn(),
      handleManualCheckIn: vi.fn(),
      handleOperatorChange: vi.fn(),
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
      pageError: ref(''),
      pendingCount: computed(() => 0),
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
    vi.clearAllMocks();
  });

  it('supports quick enter check-in and queue actions', async () => {
    const { app, container } = mountView();
    await flush();

    expect(container.textContent).toContain('已入库 1 条');
    expect(container.textContent).toContain('惠侨楼 - 手术室 2');
    expect(container.textContent).not.toContain('Surgery');

    app.unmount();
  });

  it('hides the removed top action elements', async () => {
    const { app, container } = mountView();
    await flush();

    expect(
      container.querySelector('input[placeholder="打印机编号"]'),
    ).toBeNull();
    expect(
      container.querySelector('input[placeholder="终端编号"]'),
    ).toBeNull();
    expect(container.textContent).not.toContain('批量入库');
    expect(container.textContent).not.toContain('清除选择行');
    expect(container.textContent).not.toContain('清除列表');
    expect(container.textContent).toContain('补打标本标签');

    app.unmount();
  });
});
