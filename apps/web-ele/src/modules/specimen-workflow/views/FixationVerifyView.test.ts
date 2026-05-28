import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import FixationVerifyView from './FixationVerifyView.vue';

const {
  confirmMock,
  confirmSpecimenRemovalMock,
  getApplicationDetailMock,
  listPendingSpecimenRemovalsMock,
  mockRoute,
} = vi.hoisted(() => ({
  confirmMock: vi.fn(async () => 'confirm'),
  confirmSpecimenRemovalMock: vi.fn(async () => ({
    barcode: 'SP-PENDING',
    operatorName: 'Test User',
    specimenId: 'SPEC-PENDING',
    specimenRemovalAt: '2026-05-23T13:20:00',
  })),
  getApplicationDetailMock: vi.fn(async () => ({
    applicationNo: 'AP-LOOKUP-001',
  })),
  listPendingSpecimenRemovalsMock: vi.fn(async () => ({
    items: [
      {
        abnormalFlag: false,
        applicationId: 'APP-PENDING',
        applicationNo: 'AP202605230001',
        barcode: 'SP-PENDING',
        confirmedAt: null,
        containerCount: 1,
        containerName: '福尔马林瓶',
        inpatientNo: 'ZYH-001',
        latestTrackingAt: '2026-05-23 12:44:44',
        patientGender: '女',
        patientName: 'Alice',
        registeredAt: '2026-05-23 12:44:44',
        registeredByName: '周永坚',
        specimenId: 'SPEC-PENDING',
        specimenName: '右股骨骨髓',
        specimenNo: 'SP202605230001',
        specimenRemovalAt: null,
        specimenRemovalOperatorName: null,
        specimenStatus: 'REGISTERED',
        specimenType: '常规',
        surgeryName: '手术室2',
      },
      {
        abnormalFlag: false,
        applicationId: 'APP-CONFIRMED',
        applicationNo: 'AP202605230002',
        barcode: 'SP-CONFIRMED',
        confirmedAt: '2026-05-23T12:45:44',
        containerCount: 1,
        containerName: '福尔马林瓶',
        inpatientNo: 'ZYH-002',
        latestTrackingAt: '2026-05-23 12:45:44',
        patientGender: '男',
        patientName: 'Bob',
        registeredAt: '2026-05-23 12:45:44',
        registeredByName: '周永坚',
        specimenId: 'SPEC-CONFIRMED',
        specimenName: '膀胱后壁肿物',
        specimenNo: 'SP202605230002',
        specimenRemovalAt: '2026-05-23T12:45:44',
        specimenRemovalOperatorName: 'AD1',
        specimenStatus: 'REMOVED',
        specimenType: '常规',
        surgeryName: '手术室2',
      },
    ],
    page: 1,
    size: 20,
    summary: {
      abnormalCount: 0,
      confirmedCount: 1,
      pendingCount: 1,
      totalCount: 2,
    },
    total: 2,
  })),
  mockRoute: {
    query: {} as Record<string, string>,
  },
}));

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
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
  confirmSpecimenRemoval: confirmSpecimenRemovalMock,
  getApplicationDetail: getApplicationDetailMock,
  listPendingSpecimenRemovals: listPendingSpecimenRemovalsMock,
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

async function flushView() {
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

describe('FixationVerifyView', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    mockRoute.query = {};
    vi.clearAllMocks();
  });

  it('queries removal workbench data without verificationStatus by default', async () => {
    const { app } = mountView();
    await flushView();

    expect(listPendingSpecimenRemovalsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        applicationNo: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        departmentId: undefined,
        page: 1,
        size: 20,
      }),
    );

    const firstCall = listPendingSpecimenRemovalsMock.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(firstCall).not.toHaveProperty('verificationStatus');

    app.unmount();
  });

  it('renders removal-centric content and actions', async () => {
    const { app, container } = mountView();
    await flushView();

    const confirmButtons = [...container.querySelectorAll('button')].filter((button) =>
      button.textContent?.includes('离体确认'),
    );

    expect(container.textContent).toContain('离体确认');
    expect(container.textContent).toContain('设置离体时间');
    expect(container.textContent).toContain('全部');
    expect(container.textContent).toContain('已离体');
    expect(container.textContent).toContain('未设置');
    expect(container.textContent).toContain('申请单');
    expect(container.textContent).toContain('标本编号');
    expect(container.textContent).toContain('离体时间');
    expect(container.textContent).toContain('离体操作人');
    expect(container.textContent).not.toContain('开始核对');
    expect(container.textContent).not.toContain('完成核对');
    expect(confirmButtons).toHaveLength(1);

    app.unmount();
  });

  it('confirms removal and refreshes the list after submission', async () => {
    const { app, container } = mountView();
    await flushView();

    const confirmButtons = [...container.querySelectorAll('button')].filter((button) =>
      button.textContent?.includes('离体确认'),
    );

    confirmButtons[0]?.click();
    await flushView();

    expect(confirmMock).toHaveBeenCalledWith('确认该标本已离体吗？', '离体确认', {
      cancelButtonText: '取消',
      confirmButtonText: '确认',
      type: 'warning',
    });
    expect(confirmSpecimenRemovalMock).toHaveBeenCalledWith({
      operatorName: 'Test User',
      operatorUserId: 'USER-001',
      remarks: '离体确认',
      specimenBarcode: 'SP-PENDING',
    });
    expect(listPendingSpecimenRemovalsMock).toHaveBeenCalledTimes(2);

    app.unmount();
  });

  it('resolves legacy applicationId query into applicationNo before loading', async () => {
    mockRoute.query = { applicationId: 'APP-LOOKUP' };
    const { app } = mountView();
    await flushView();

    expect(getApplicationDetailMock).toHaveBeenCalledWith('APP-LOOKUP');
    expect(listPendingSpecimenRemovalsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        applicationNo: 'AP-LOOKUP-001',
      }),
    );

    app.unmount();
  });
});
