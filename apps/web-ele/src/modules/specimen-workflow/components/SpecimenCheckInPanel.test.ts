import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import SpecimenCheckInPanel from './SpecimenCheckInPanel.vue';

const {
  checkInSpecimenMock,
  listSpecimensMock,
} = vi.hoisted(() => ({
  checkInSpecimenMock: vi.fn(async () => ({
    barcode: 'BC-CHECKIN',
    checkInStatus: 'CHECKED_IN',
    checkedInAt: '2026-05-26T09:10:00',
    checkedInByName: 'Test User',
    id: 'SPEC-CHECKIN',
    specimenNo: 'SP-001',
  })),
  listSpecimensMock: vi.fn(async () => ({
    items: [
      {
        abnormalFlag: false,
        applicationId: 'APP-CHECKIN',
        applicationNo: 'M2-001',
        barcode: 'BC-CHECKIN',
        checkInStatus: 'NOT_CHECKED_IN',
        checkedInAt: null,
        checkedInByName: null,
        fixationStatus: 'COMPLETED',
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
    ],
    page: 1,
    size: 500,
    summary: {
      abnormalCount: 0,
      labelPrintedCount: 2,
      pendingLabelCount: 0,
      totalCount: 2,
    },
    total: 2,
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

vi.mock('element-plus', async () => {
  const actual = await vi.importActual<typeof import('element-plus')>('element-plus');
  return {
    ...actual,
    ElMessage: { success: vi.fn(), warning: vi.fn() },
  };
});

vi.mock('../api/specimen-workflow-service', () => ({
  checkInSpecimen: checkInSpecimenMock,
  listSpecimens: listSpecimensMock,
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

describe('SpecimenCheckInPanel', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('shows only confirmation-ready rows and exposes check-in actions', async () => {
    const { app, container } = mountView();
    await nextTick();
    await Promise.resolve();
    await nextTick();

    expect(container.textContent).toContain('待入库 1 条');
    expect(container.textContent).toContain('执行入库');

    const actionButtons = [...container.querySelectorAll('button')].filter((button) =>
      button.textContent?.includes('执行入库'),
    );
    expect(actionButtons).toHaveLength(2);
    expect(actionButtons[1]?.getAttribute('disabled')).not.toBeNull();

    actionButtons[0]?.click();
    await nextTick();

    const submitButton = [...container.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('确认入库'),
    );
    submitButton?.click();
    await Promise.resolve();
    await nextTick();

    expect(checkInSpecimenMock).toHaveBeenCalledWith('BC-CHECKIN', {
      operatorName: 'Test User',
      operatorUserId: 'USER-001',
      remarks: null,
      specimenBarcode: 'BC-CHECKIN',
      terminalCode: null,
    });

    app.unmount();
  });
});
