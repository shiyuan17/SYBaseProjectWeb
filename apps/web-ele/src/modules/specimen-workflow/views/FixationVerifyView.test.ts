import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ALL_VERIFICATION_STATUS_VALUE,
  VERIFICATION_STATUS_OPTIONS,
} from '../constants';
import FixationVerifyView from './FixationVerifyView.vue';

const {
  completeSpecimenVerificationMock,
  confirmMock,
  listPendingFixationsMock,
  startSpecimenVerificationMock,
} = vi.hoisted(() => ({
  completeSpecimenVerificationMock: vi.fn(async () => ({
    barcode: 'SP-VERIFYING',
    id: 'SPEC-VERIFYING',
    specimenNo: 'SP202605230002',
    specimenStatus: 'VERIFIED',
    verificationCompletedAt: '2026-05-23T12:48:44',
    verificationStartedAt: '2026-05-23T12:45:44',
    verificationStatus: 'VERIFIED',
  })),
  confirmMock: vi.fn(async () => 'confirm'),
  listPendingFixationsMock: vi.fn(async () => ({
    items: [
      {
        abnormalFlag: false,
        applicationId: 'APP-UNVERIFIED',
        applicationNo: 'AP202605230001',
        barcode: 'SP-UNVERIFIED',
        fixationStatus: 'PENDING',
        latestTrackingAt: '2026-05-23 12:44:44',
        patientName: 'Alice',
        registeredAt: '2026-05-23 12:44:44',
        specimenId: 'SPEC-UNVERIFIED',
        specimenNo: 'SP202605230001',
        specimenStatus: 'REGISTERED',
        submittingDepartmentId: 'DEPT-001',
        submittingDepartmentName: 'Pathology',
        transportOrderId: null,
        verificationCompletedAt: null,
        verificationStartedAt: null,
        verificationStatus: 'UNVERIFIED',
      },
      {
        abnormalFlag: false,
        applicationId: 'APP-VERIFYING',
        applicationNo: 'AP202605230002',
        barcode: 'SP-VERIFYING',
        fixationStatus: 'PENDING',
        latestTrackingAt: '2026-05-23 12:45:44',
        patientName: 'Bob',
        registeredAt: '2026-05-23 12:45:44',
        specimenId: 'SPEC-VERIFYING',
        specimenNo: 'SP202605230002',
        specimenStatus: 'VERIFYING',
        submittingDepartmentId: 'DEPT-001',
        submittingDepartmentName: 'Pathology',
        transportOrderId: null,
        verificationCompletedAt: null,
        verificationStartedAt: '2026-05-23 12:45:44',
        verificationStatus: 'VERIFYING',
      },
      {
        abnormalFlag: false,
        applicationId: 'APP-VERIFIED',
        applicationNo: 'AP202605230003',
        barcode: 'SP-VERIFIED',
        fixationStatus: 'PENDING',
        latestTrackingAt: '2026-05-23 12:46:44',
        patientName: 'Carol',
        registeredAt: '2026-05-23 12:46:44',
        specimenId: 'SPEC-VERIFIED',
        specimenNo: 'SP202605230003',
        specimenStatus: 'VERIFIED',
        submittingDepartmentId: 'DEPT-001',
        submittingDepartmentName: 'Pathology',
        transportOrderId: null,
        verificationCompletedAt: '2026-05-23 12:46:44',
        verificationStartedAt: '2026-05-23 12:45:44',
        verificationStatus: 'VERIFIED',
      },
    ],
    page: 1,
    size: 20,
    total: 3,
  })),
  startSpecimenVerificationMock: vi.fn(async () => ({
    barcode: 'SP-UNVERIFIED',
    id: 'SPEC-UNVERIFIED',
    specimenNo: 'SP202605230001',
    specimenStatus: 'VERIFYING',
    verificationCompletedAt: null,
    verificationStartedAt: '2026-05-23T12:44:44',
    verificationStatus: 'VERIFYING',
  })),
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({
    query: {},
  }),
}));

vi.mock('@vben/common-ui', () => ({
  Page: {
    props: ['title'],
    template: '<div><slot /></div>',
  },
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

vi.mock('../components/WorkflowSectionCard.vue', () => ({
  default: {
    props: ['title', 'description'],
    template:
      '<section><h2>{{ title }}</h2><p>{{ description }}</p><slot /></section>',
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
  completeSpecimenVerification: completeSpecimenVerificationMock,
  listPendingFixations: listPendingFixationsMock,
  startSpecimenVerification: startSpecimenVerificationMock,
}));

function mountView() {
  const container = document.createElement('div');
  document.body.append(container);
  const app = createApp({
    render: () => h(FixationVerifyView),
  });

  app.directive('loading', {});
  app.mount(container);

  return { app, container };
}

describe('FixationVerifyView', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('uses all as the default verification filter and queries without verificationStatus', async () => {
    const { app } = mountView();
    await nextTick();
    await Promise.resolve();
    await nextTick();

    expect(
      VERIFICATION_STATUS_OPTIONS.some((option) => option.value === ALL_VERIFICATION_STATUS_VALUE),
    ).toBe(true);
    expect(listPendingFixationsMock).toHaveBeenCalledWith(
      expect.objectContaining({ verificationStatus: undefined }),
    );

    app.unmount();
  });

  it('shows verification actions only and removes fixation/transport actions', async () => {
    const { app, container } = mountView();
    await nextTick();
    await Promise.resolve();
    await nextTick();

    const buttons = [...container.querySelectorAll('button')];
    const startButtons = buttons.filter((button) => button.textContent?.includes('开始核对'));
    const completeButtons = buttons.filter((button) => button.textContent?.includes('完成核对'));

    expect(startButtons).toHaveLength(1);
    expect(completeButtons).toHaveLength(1);
    expect(container.textContent).not.toContain('开始固定');
    expect(container.textContent).not.toContain('完成固定');
    expect(container.textContent).not.toContain('创建转运单');

    startButtons[0]?.click();
    await Promise.resolve();
    await nextTick();
    expect(startSpecimenVerificationMock).toHaveBeenCalledWith({
      operatorName: 'Test User',
      operatorUserId: 'USER-001',
      specimenBarcode: 'SP-UNVERIFIED',
    });

    app.unmount();
  });

  it('confirms before completing verification and only completes verifying rows', async () => {
    const { app, container } = mountView();
    await nextTick();
    await Promise.resolve();
    await nextTick();

    const completeButtons = [...container.querySelectorAll('button')].filter((button) =>
      button.textContent?.includes('完成核对'),
    );

    completeButtons[0]?.click();
    await Promise.resolve();
    await nextTick();

    expect(confirmMock).toHaveBeenCalledWith('确认该标本已完成核对吗？', '完成核对', {
      cancelButtonText: '取消',
      confirmButtonText: '确认',
      type: 'warning',
    });
    expect(completeSpecimenVerificationMock).toHaveBeenCalledWith({
      operatorName: 'Test User',
      operatorUserId: 'USER-001',
      specimenBarcode: 'SP-VERIFYING',
    });

    app.unmount();
  });
});
