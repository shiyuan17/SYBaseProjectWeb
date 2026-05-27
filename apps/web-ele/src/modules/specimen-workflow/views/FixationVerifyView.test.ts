import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ALL_FIXATION_STATUS_VALUE,
  FIXATION_STATUS_OPTIONS,
} from '../constants';
import FixationVerifyView from './FixationVerifyView.vue';

const {
  completeFixationMock,
  confirmMock,
  listPendingFixationsMock,
} = vi.hoisted(() => ({
  completeFixationMock: vi.fn(async () => ({
    barcode: 'SP-PENDING',
    fixationStatus: 'COMPLETED',
    specimenId: 'SPEC-PENDING',
  })),
  confirmMock: vi.fn(async () => 'confirm'),
  listPendingFixationsMock: vi.fn(async () => ({
    items: [
      {
        abnormalFlag: false,
        applicationId: 'APP-PENDING',
        applicationNo: 'AP202605230001',
        barcode: 'SP-PENDING',
        containerCount: 1,
        containerName: 'Bottle',
        fixationStatus: 'PENDING',
        latestTrackingAt: '2026-05-23 12:44:44',
        patientName: 'Alice',
        registeredAt: '2026-05-23 12:44:44',
        specimenId: 'SPEC-PENDING',
        specimenNo: 'SP202605230001',
        specimenStatus: 'REGISTERED',
        submittingDepartmentId: 'DEPT-001',
        submittingDepartmentName: 'Pathology',
        transportOrderId: null,
      },
      {
        abnormalFlag: false,
        applicationId: 'APP-FIXING',
        applicationNo: 'AP202605230002',
        barcode: 'SP-FIXING',
        containerCount: 1,
        containerName: 'Bottle',
        fixationStatus: 'FIXING',
        latestTrackingAt: '2026-05-23 12:45:44',
        patientName: 'Bob',
        registeredAt: '2026-05-23 12:45:44',
        specimenId: 'SPEC-FIXING',
        specimenNo: 'SP202605230002',
        specimenStatus: 'FIXING',
        submittingDepartmentId: 'DEPT-001',
        submittingDepartmentName: 'Pathology',
        transportOrderId: null,
      },
      {
        abnormalFlag: false,
        applicationId: 'APP-COMPLETED',
        applicationNo: 'AP202605230003',
        barcode: 'SP-COMPLETED',
        containerCount: 1,
        containerName: 'Bottle',
        fixationStatus: 'COMPLETED',
        latestTrackingAt: '2026-05-23 12:46:44',
        patientName: 'Carol',
        registeredAt: '2026-05-23 12:46:44',
        specimenId: 'SPEC-COMPLETED',
        specimenNo: 'SP202605230003',
        specimenStatus: 'FIXED',
        submittingDepartmentId: 'DEPT-001',
        submittingDepartmentName: 'Pathology',
        transportOrderId: null,
      },
    ],
    page: 1,
    size: 20,
    total: 3,
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

vi.mock('../components/TransportOrderCreateDialog.vue', () => ({
  default: {
    props: ['modelValue', 'initialApplicationId', 'initialApplicationNo'],
    template:
      '<div data-testid="transport-order-create-dialog" :data-open="String(modelValue)" :data-application-id="initialApplicationId" :data-application-no="initialApplicationNo" />',
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

  it('uses all as the default fixation filter and queries without fixationStatus', async () => {
    const { app, container } = mountView();
    await nextTick();
    await Promise.resolve();
    await nextTick();

    expect(FIXATION_STATUS_OPTIONS.some((option) => option.value === ALL_FIXATION_STATUS_VALUE)).toBe(
      true,
    );
    expect(listPendingFixationsMock).toHaveBeenCalledWith(
      expect.objectContaining({ fixationStatus: undefined }),
    );
    expect(container.textContent).toContain('所有');

    app.unmount();
  });

  it('shows only complete fixation for pending and fixing rows, and disables transport before completion', async () => {
    const { app, container } = mountView();
    await nextTick();
    await Promise.resolve();
    await nextTick();

    const buttons = [...container.querySelectorAll('button')];
    const createButtons = buttons.filter((button) => button.textContent?.includes('创建转运单'));
    const completeButtons = buttons.filter((button) => button.textContent?.includes('完成固定'));
    const startButtons = buttons.filter((button) => button.textContent?.includes('开始固定'));

    expect(startButtons).toHaveLength(0);
    expect(completeButtons).toHaveLength(2);
    expect(createButtons).toHaveLength(3);
    expect(createButtons[0]?.hasAttribute('disabled')).toBe(true);
    expect(createButtons[1]?.hasAttribute('disabled')).toBe(true);
    expect(createButtons[2]?.hasAttribute('disabled')).toBe(false);
    expect(createButtons[0]?.getAttribute('title')).toContain('请先完成固定后再创建转运单');

    createButtons[0]?.click();
    await nextTick();
    expect(
      container
        .querySelector('[data-testid="transport-order-create-dialog"]')
        ?.getAttribute('data-open'),
    ).toBe('false');

    createButtons[2]?.click();
    await nextTick();
    expect(
      container
        .querySelector('[data-testid="transport-order-create-dialog"]')
        ?.getAttribute('data-open'),
    ).toBe('true');
    expect(
      container
        .querySelector('[data-testid="transport-order-create-dialog"]')
        ?.getAttribute('data-application-id'),
    ).toBe('APP-COMPLETED');
    expect(
      container
        .querySelector('[data-testid="transport-order-create-dialog"]')
        ?.getAttribute('data-application-no'),
    ).toBe('AP202605230003');

    app.unmount();
  });

  it('confirms before completing fixation and calls the complete api', async () => {
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

    expect(confirmMock).toHaveBeenCalledWith('确认该标本已固定完成吗？', '完成固定', {
      cancelButtonText: '取消',
      confirmButtonText: '确认',
      type: 'warning',
    });
    expect(completeFixationMock).toHaveBeenCalledWith({
      operatorName: 'Test User',
      operatorUserId: 'USER-001',
      specimenBarcode: 'SP-PENDING',
    });

    app.unmount();
  });
});
