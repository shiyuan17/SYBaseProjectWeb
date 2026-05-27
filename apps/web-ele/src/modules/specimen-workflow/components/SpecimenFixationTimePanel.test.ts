import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import SpecimenFixationTimePanel from './SpecimenFixationTimePanel.vue';

const {
  completeFixationMock,
  confirmMock,
  listPendingFixationsMock,
  startFixationMock,
} = vi.hoisted(() => ({
  completeFixationMock: vi.fn(async () => ({
    barcode: 'BC-FIXING',
    fixationStatus: 'COMPLETED',
    specimenId: 'SPEC-FIXING',
  })),
  confirmMock: vi.fn(async () => 'confirm'),
  listPendingFixationsMock: vi.fn(async () => ({
    items: [
      {
        abnormalFlag: false,
        applicationId: 'APP-PENDING',
        applicationNo: 'M2-001',
        barcode: 'BC-PENDING',
        containerCount: 1,
        containerName: 'Bottle',
        fixationCompletedAt: null,
        fixationLiquidType: null,
        fixationStartedAt: null,
        fixationStatus: 'PENDING',
        latestTrackingAt: '2026-05-26 08:00:00',
        patientName: 'Alice',
        registeredAt: '2026-05-26 08:00:00',
        specimenId: 'SPEC-PENDING',
        specimenNo: 'SP-001',
        specimenStatus: 'REGISTERED',
        submittingDepartmentId: 'DEPT-001',
        submittingDepartmentName: 'Surgery',
        transportOrderId: null,
        verificationCompletedAt: '2026-05-26 07:55:00',
        verificationStartedAt: '2026-05-26 07:50:00',
        verificationStatus: 'VERIFIED',
      },
      {
        abnormalFlag: false,
        applicationId: 'APP-FIXING',
        applicationNo: 'M2-002',
        barcode: 'BC-FIXING',
        containerCount: 1,
        containerName: 'Bottle',
        fixationCompletedAt: null,
        fixationLiquidType: '10%中性福尔马林',
        fixationStartedAt: '2026-05-26 08:30:00',
        fixationStatus: 'FIXING',
        latestTrackingAt: '2026-05-26 08:30:00',
        patientName: 'Bob',
        registeredAt: '2026-05-26 08:20:00',
        specimenId: 'SPEC-FIXING',
        specimenNo: 'SP-002',
        specimenStatus: 'FIXING',
        submittingDepartmentId: 'DEPT-001',
        submittingDepartmentName: 'Surgery',
        transportOrderId: null,
        verificationCompletedAt: '2026-05-26 08:18:00',
        verificationStartedAt: '2026-05-26 08:15:00',
        verificationStatus: 'VERIFIED',
      },
      {
        abnormalFlag: false,
        applicationId: 'APP-VERIFYING',
        applicationNo: 'M2-003',
        barcode: 'BC-VERIFYING',
        containerCount: 1,
        containerName: 'Bottle',
        fixationCompletedAt: null,
        fixationLiquidType: null,
        fixationStartedAt: null,
        fixationStatus: 'PENDING',
        latestTrackingAt: '2026-05-26 08:40:00',
        patientName: 'Carol',
        registeredAt: '2026-05-26 08:40:00',
        specimenId: 'SPEC-VERIFYING',
        specimenNo: 'SP-003',
        specimenStatus: 'VERIFYING',
        submittingDepartmentId: 'DEPT-001',
        submittingDepartmentName: 'Surgery',
        transportOrderId: null,
        verificationCompletedAt: null,
        verificationStartedAt: '2026-05-26 08:35:00',
        verificationStatus: 'VERIFYING',
      },
    ],
    page: 1,
    size: 20,
    total: 3,
  })),
  startFixationMock: vi.fn(async () => ({
    barcode: 'BC-PENDING',
    fixationStatus: 'FIXING',
    specimenId: 'SPEC-PENDING',
  })),
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({
    query: {},
  }),
}));

vi.mock('@vben/stores', () => ({
  useUserStore: () => ({
    userInfo: {
      realName: 'Test User',
      userId: 'USER-001',
    },
  }),
}));

vi.mock('#/modules/system-management/components/DepartmentSelect.vue', () => ({
  default: {
    props: ['modelValue', 'placeholder'],
    template: '<div />',
  },
}));

vi.mock('element-plus', async () => {
  const actual = await vi.importActual<typeof import('element-plus')>('element-plus');
  return {
    ...actual,
    ElMessage: { success: vi.fn(), warning: vi.fn() },
    ElMessageBox: { confirm: confirmMock },
  };
});

vi.mock('../api/specimen-workflow-service', () => ({
  completeFixation: completeFixationMock,
  listPendingFixations: listPendingFixationsMock,
  startFixation: startFixationMock,
}));

function mountView() {
  const container = document.createElement('div');
  document.body.append(container);
  const app = createApp({
    render: () => h(SpecimenFixationTimePanel),
  });

  app.directive('loading', {});
  app.mount(container);

  return { app, container };
}

describe('SpecimenFixationTimePanel', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('renders fixation columns, shows verification status, and filters out unverified rows', async () => {
    const { app, container } = mountView();
    await nextTick();
    await Promise.resolve();
    await nextTick();

    expect(container.textContent).toContain('固定液类型');
    expect(container.textContent).toContain('开始固定时间');
    expect(container.textContent).toContain('完成固定时间');
    expect(container.textContent).toContain('核对状态');
    expect(container.textContent).toContain('10%中性福尔马林');
    expect(container.textContent).not.toContain('BC-VERIFYING');

    const startButtons = [...container.querySelectorAll('button')].filter((button) =>
      button.textContent?.includes('开始固定'),
    );
    const completeButtons = [...container.querySelectorAll('button')].filter((button) =>
      button.textContent?.includes('完成固定'),
    );

    expect(startButtons).toHaveLength(1);
    expect(completeButtons).toHaveLength(1);

    startButtons[0]?.click();
    await Promise.resolve();
    await nextTick();
    expect(startFixationMock).toHaveBeenCalledWith({
      fixationLiquidType: null,
      operatorName: 'Test User',
      operatorUserId: 'USER-001',
      specimenBarcode: 'BC-PENDING',
    });

    app.unmount();
  });

  it('confirms before completing fixation and forwards fixation timing context', async () => {
    const { app, container } = mountView();
    await nextTick();
    await Promise.resolve();
    await nextTick();

    const completeButtons = [...container.querySelectorAll('button')].filter((button) =>
      button.textContent?.includes('完成固定'),
    );

    completeButtons[0]?.click();
    await Promise.resolve();
    await nextTick();
    expect(confirmMock).toHaveBeenCalledWith('确认该标本已完成固定吗？', '完成固定', {
      cancelButtonText: '取消',
      confirmButtonText: '确认',
      type: 'warning',
    });
    expect(completeFixationMock).toHaveBeenCalledWith({
      fixationLiquidType: '10%中性福尔马林',
      operatorName: 'Test User',
      operatorUserId: 'USER-001',
      specimenBarcode: 'BC-FIXING',
    });

    app.unmount();
  });
});
