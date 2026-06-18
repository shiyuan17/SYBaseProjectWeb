import { createApp, h, nextTick, reactive } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createButtonStub,
  createInputStub,
  createTableColumnStub,
  createTableStub,
  createTagStub,
} from '../test-utils/component-stubs';

const { rowContextKey } = vi.hoisted(() => ({
  rowContextKey: Symbol('row-context'),
}));

const {
  checkInSpecimenMock,
  handlePrimaryCheckInMock,
  clearQueueMock,
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
  clearQueueMock: vi.fn(),
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
    ElButton: createButtonStub(),
    ElInput: createInputStub(),
    ElMessage: { success: vi.fn(), warning: vi.fn() },
    ElPagination: {
      props: ['currentPage', 'pageSize', 'total'],
      template:
        '<div data-testid="pagination">page:{{ currentPage }} size:{{ pageSize }} total:{{ total }}</div>',
    },
    ElTable: createTableStub(rowContextKey),
    ElTableColumn: createTableColumnStub(rowContextKey),
    ElTag: createTagStub(),
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
      checkInDraft: false,
      checkInDisabledReason: '标本已完成入库，无需重复操作',
      checkInStatusTagType: 'success',
      displayCheckInStatus: '已入库',
      canCheckIn: false,
      inpatientNoLabel: 'ZY-001',
      patientGenderLabel: '女',
      patientIdLabel: 'PAT-001',
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
      wardName: '普外科病区 8B',
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
      checkInDraft: false,
      checkInDisabledReason: null,
      checkInStatusTagType: 'info',
      displayCheckInStatus: '待入库',
      canCheckIn: true,
      inpatientNoLabel: 'ZY-001',
      patientGenderLabel: '女',
      patientIdLabel: 'PAT-001',
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
      wardName: '普外科病区 8B',
    },
    {
      applicationId: 'APP-CHECKIN',
      applicationNo: 'M2-001',
      barcode: 'BC-CHECKIN-UNSAVED',
      checkInStatus: 'NOT_CHECKED_IN',
      checkedInAt: null,
      checkedInByName: null,
      fixationStatus: 'COMPLETED',
      labelPrintBatchNo: 'BATCH-1',
      labelPrintStatus: 'SUCCESS',
      latestTrackingAt: '2026-05-26 09:06:00',
      patientName: 'Alice',
      queueAddedAt: '2026-06-01T14:33:58.880Z',
      queueAddedByName: 'Test User',
      queueStatus: 'PENDING',
      checkInDraft: true,
      checkInDisabledReason: null,
      checkInStatusTagType: 'warning',
      displayCheckInStatus: '入库未保存',
      canCheckIn: true,
      inpatientNoLabel: 'ZY-001',
      patientGenderLabel: '女',
      patientIdLabel: 'PAT-001',
      recentNode: 'CONFIRMATION',
      registeredAt: '2026-05-26 08:03:00',
      specimenConfirmedAt: '2026-05-26 08:56:00',
      specimenId: 'SPEC-CHECKIN-UNSAVED',
      specimenName: '直肠息肉',
      specimenNo: 'SP-001-3',
      specimenSite: '直肠',
      specimenStatus: 'FIXED',
      specimenType: '组织',
      submittingDepartmentId: 'DEPT-001',
      submittingDepartmentName: 'Surgery',
      surgeryName: '惠侨楼 - 手术室 2',
      verificationCompletedAt: '2026-05-26 08:26:00',
      verificationStartedAt: '2026-05-26 08:19:00',
      verificationStatus: 'VERIFIED',
      wardName: '普外科病区 8B',
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
      checkInDraft: false,
      checkInDisabledReason: '标本已接收、拒收或退回，不能再入库',
      checkInStatusTagType: 'danger',
      displayCheckInStatus: '已接收',
      canCheckIn: false,
      inpatientNoLabel: 'ZY-003',
      patientGenderLabel: '男',
      patientIdLabel: 'PAT-003',
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
      wardName: '胸外科病区 3A',
    },
  ]);

  return {
    useSpecimenCheckInPanel: () => ({
      actionLoading: ref(false),
      clearQueue: clearQueueMock,
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
      handleOperatorChange: vi.fn(),
      handlePageChange: vi.fn(),
      handlePageSizeChange: vi.fn(),
      handlePrimaryCheckIn: handlePrimaryCheckInMock,
      handleQuickCheckIn: vi.fn(),
      handleReset: vi.fn(),
      handleRetryLabelPrint: vi.fn(),
      handleSelectionChange: vi.fn(),
      isCheckInReady: vi.fn(() => true),
      loading: ref(false),
      operatorForm: {
        operatorName: 'Test User',
        operatorUserId: 'USER-001',
      },
      pagedItems: queueItems,
      pagination: reactive({
        page: 1,
        size: 20,
      }),
      pageError: ref(pageErrorTextMock.value),
      pendingCount: computed(() => 1),
      queueItems,
      retryLoading: ref(false),
      scanInput: ref(''),
      selectedCount: computed(() => 0),
      selectedRows: computed(() => []),
      total: computed(() => queueItems.value.length),
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

import SpecimenCheckInPanel from './SpecimenCheckInPanel.vue';

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
    expect(container.textContent).toContain('ZY-001');
    expect(container.textContent).toContain('普外科病区 8B');
    expect(container.textContent).toContain('PAT-001');
    expect(container.textContent).not.toContain('Surgery');
    expect(
      container.querySelector('.specimen-workflow-row--completed'),
    ).not.toBeNull();
    expect(
      container.querySelector('.specimen-workflow-row--draft'),
    ).not.toBeNull();
    const checkInStatusTagTypes = [
      ...container.querySelectorAll(
        '[data-column-label="入库状态"] [data-tag-type]',
      ),
    ].map((node) => (node as HTMLElement).dataset.tagType);
    expect(checkInStatusTagTypes).toEqual([
      'success',
      'info',
      'warning',
      'danger',
    ]);

    app.unmount();
  });

  it('shows real specimen status and derived check-in status separately without per-row actions', async () => {
    const { app, container } = mountView();
    await flush();

    expect(container.textContent).toContain('已入库');
    expect(container.textContent).toContain('待入库');
    expect(container.textContent).toContain('固定完成');
    expect(container.textContent).toContain('已接收');

    const rowButtonTexts = [...container.querySelectorAll('button')].map(
      (button) => button.textContent?.trim(),
    );
    expect(rowButtonTexts).not.toContain('入库');
    expect(rowButtonTexts).not.toContain('移除');

    app.unmount();
  });

  it('hides removed top action elements and renders clear list', async () => {
    const { app, container } = mountView();
    await flush();

    expect(
      container.querySelector('input[placeholder="打印机编号"]'),
    ).toBeNull();
    expect(container.querySelector('input[placeholder="终端编号"]')).toBeNull();
    expect(container.textContent).not.toContain('批量入库');
    expect(container.textContent).not.toContain('清除选择行');
    expect(container.textContent).toContain('清除列表');
    expect(container.textContent).toContain('补打标本标签');

    const clearListButton = [...container.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('清除列表'),
    );
    clearListButton?.click();
    await flush();

    expect(clearQueueMock).toHaveBeenCalledTimes(1);

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
