import type { SpecimenRemovalItem } from '../types/specimen-workflow';

import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import FixationVerifyView from './FixationVerifyView.vue';

const {
  confirmMock,
  confirmSpecimenRemovalByIdentifierMock,
  confirmSpecimenRemovalMock,
  getApplicationDetailMock,
  listSpecimensMock,
  listPendingSpecimenRemovalsMock,
  messageSuccessMock,
  messageWarningMock,
  mockRoute,
  resetMockRemovalRows,
} = vi.hoisted(() => {
  const createMockRemovalRows = (): SpecimenRemovalItem[] => [
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
      applicationId: 'APP-PENDING',
      applicationNo: 'AP202605230001',
      barcode: 'SP-SIBLING',
      confirmedAt: null,
      containerCount: 1,
      containerName: '福尔马林瓶',
      inpatientNo: 'ZYH-001',
      latestTrackingAt: '2026-05-23 12:45:44',
      patientGender: '女',
      patientName: 'Alice',
      registeredAt: '2026-05-23 12:45:44',
      registeredByName: '周永坚',
      specimenId: 'SPEC-SIBLING',
      specimenName: '子宫肌瘤组织',
      specimenNo: 'SP202605230002',
      specimenRemovalAt: null,
      specimenRemovalOperatorName: null,
      specimenStatus: 'REGISTERED',
      specimenType: '常规',
      surgeryName: '手术室2',
    },
  ];

  const mockRemovalRows = createMockRemovalRows();

  const resetMockRemovalRows = () => {
    mockRemovalRows.splice(0, mockRemovalRows.length, ...createMockRemovalRows());
  };

  const confirmRemoval = (identifier: string, lookup: 'barcode' | 'identifier') => {
    const targetRow = mockRemovalRows.find((row) =>
      lookup === 'barcode'
        ? row.barcode === identifier
        : row.barcode === identifier || row.specimenNo === identifier,
    );

    if (!targetRow) {
      throw new Error('未找到对应标本');
    }

    targetRow.confirmedAt = '2026-05-23T13:20:00';
    targetRow.latestTrackingAt = '2026-05-23T13:20:00';
    targetRow.specimenRemovalAt = '2026-05-23T13:20:00';
    targetRow.specimenRemovalOperatorName = 'Test User';

    return {
      barcode: targetRow.barcode,
      operatorName: 'Test User',
      specimenId: targetRow.specimenId,
      specimenRemovalAt: '2026-05-23T13:20:00',
    };
  };

  return {
    confirmMock: vi.fn(async () => 'confirm'),
    confirmSpecimenRemovalByIdentifierMock: vi.fn(async ({ identifier }) =>
      confirmRemoval(identifier, 'identifier'),
    ),
    confirmSpecimenRemovalMock: vi.fn(async ({ specimenBarcode }) =>
      confirmRemoval(specimenBarcode, 'barcode'),
    ),
    getApplicationDetailMock: vi.fn(async () => ({
      applicationNo: 'AP-LOOKUP-001',
    })),
    listSpecimensMock: vi.fn(async (params: Record<string, unknown> = {}) => {
      const keyword =
        typeof params.keyword === 'string' ? params.keyword.trim() : '';
      const items = mockRemovalRows
        .filter((row) => {
          if (!keyword) {
            return true;
          }
          return [
            row.applicationNo,
            row.barcode,
            row.patientName,
            row.specimenName,
            row.specimenNo,
          ].some((value) => String(value ?? '').includes(keyword));
        })
        .map((row) => ({
          abnormalFlag: row.abnormalFlag,
          applicationId: row.applicationId,
          applicationNo: row.applicationNo,
          barcode: row.barcode,
          checkInStatus: null,
          checkedInAt: null,
          checkedInByName: null,
          containerCount: row.containerCount,
          containerName: row.containerName,
          fixationStatus: 'PENDING',
          labelPrintBatchNo: row.labelPrintBatchNo ?? null,
          labelPrintStatus: 'SUCCESS',
          latestTrackingAt: row.latestTrackingAt,
          patientName: row.patientName,
          recentNode: null,
          registeredAt: row.registeredAt,
          specimenConfirmedAt: null,
          specimenCount: 1,
          specimenId: row.specimenId,
          specimenName: row.specimenName,
          specimenNo: row.specimenNo,
          specimenRemovalAt: row.specimenRemovalAt,
          specimenSite: null,
          specimenStatus: row.specimenStatus,
          specimenType: row.specimenType,
          submittingDepartmentId: null,
          submittingDepartmentName: null,
          verificationCompletedAt: null,
          verificationStartedAt: null,
          verificationStatus: null,
        }));

      return {
        items,
        page: 1,
        size: 100,
        summary: {
          abnormalCount: 0,
          labelPrintedCount: items.length,
          pendingLabelCount: 0,
          totalCount: items.length,
        },
        total: items.length,
      };
    }),
    listPendingSpecimenRemovalsMock: vi.fn(async (params: Record<string, unknown> = {}) => {
      const applicationNo =
        typeof params.applicationNo === 'string' ? params.applicationNo : '';
      const keyword =
        typeof params.keyword === 'string' ? params.keyword.trim() : '';
      const items = mockRemovalRows
        .filter((row) => !row.specimenRemovalAt)
        .filter((row) => {
          if (applicationNo && row.applicationNo !== applicationNo) {
            return false;
          }
          if (!keyword) {
            return true;
          }
          return [
            row.applicationNo,
            row.barcode,
            row.patientName,
            row.specimenName,
            row.specimenNo,
          ].some((value) => String(value ?? '').includes(keyword));
        });

      return {
        items,
        page: 1,
        size: 20,
        summary: {
          abnormalCount: 0,
          confirmedCount: 0,
          pendingCount: items.length,
          totalCount: items.length,
        },
        total: items.length,
      };
    }),
    messageSuccessMock: vi.fn(),
    messageWarningMock: vi.fn(),
    mockRoute: {
      query: {} as Record<string, string>,
    },
    resetMockRemovalRows,
  };
});

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
  const actual =
    await vi.importActual<typeof import('element-plus')>('element-plus');
  return {
    ...actual,
    ElMessage: { success: messageSuccessMock, warning: messageWarningMock },
    ElMessageBox: { confirm: confirmMock },
  };
});

vi.mock('../api/specimen-workflow-service', () => ({
  confirmSpecimenRemovalByIdentifier: confirmSpecimenRemovalByIdentifierMock,
  confirmSpecimenRemoval: confirmSpecimenRemovalMock,
  getApplicationDetail: getApplicationDetailMock,
  listSpecimens: listSpecimensMock,
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
    resetMockRemovalRows();
    vi.clearAllMocks();
  });

  it('queries removal workbench data without verificationStatus by default', async () => {
    const { app } = mountView();
    await flushView();

    expect(listPendingSpecimenRemovalsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        applicationNo: undefined,
        page: 1,
        size: 20,
      }),
    );

    const firstCall = listPendingSpecimenRemovalsMock.mock.calls.at(0);
    expect(firstCall).toBeDefined();
    const query = firstCall?.at(0);

    expect(query).toBeDefined();
    expect(query).not.toHaveProperty('verificationStatus');

    app.unmount();
  });

  it('renders removal-centric content and actions', async () => {
    const { app, container } = mountView();
    await flushView();

    const confirmButtons = [...container.querySelectorAll('button')].filter(
      (button) => button.textContent?.includes('离体确认'),
    );

    expect(container.textContent).toContain('离体确认');
    expect(container.textContent).toContain('设置离体时间');
    expect(container.textContent).toContain('全部');
    expect(container.textContent).toContain('已离体');
    expect(container.textContent).toContain('未设置');
    expect(container.textContent).toContain('标本ID');
    expect(container.textContent).not.toContain('标本流水号');
    expect(container.textContent).not.toContain('申请单号');
    expect(container.textContent).not.toContain('送检科室');
    expect(container.textContent).not.toContain('登记日期');
    expect(container.textContent).not.toContain('查询');
    expect(container.textContent).not.toContain('重置');
    expect(container.textContent).toContain('标本编号');
    expect(container.textContent).toContain('离体时间');
    expect(container.textContent).toContain('离体操作人');
    expect(container.textContent).not.toContain('开始核对');
    expect(container.textContent).not.toContain('完成核对');
    expect(confirmButtons).toHaveLength(2);

    app.unmount();
  });

  it('confirms removal and refreshes the list after submission', async () => {
    const { app, container } = mountView();
    await flushView();

    const confirmButton = [...container.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('离体确认'),
    );

    confirmButton?.click();
    await flushView();

    expect(confirmMock).toHaveBeenCalledWith(
      '确认该标本已离体吗？',
      '离体确认',
      {
        cancelButtonText: '取消',
        confirmButtonText: '确认',
        type: 'warning',
      },
    );
    expect(confirmSpecimenRemovalMock).toHaveBeenCalledWith({
      remarks: '离体确认',
      specimenBarcode: 'SP-PENDING',
    });
    expect(listPendingSpecimenRemovalsMock).toHaveBeenCalledTimes(2);
    expect(container.textContent).toContain('SP202605230001');
    expect(container.textContent).toContain('SP202605230002');
    expect(container.textContent).toContain('Test User');

    app.unmount();
  });

  it('quick confirms by specimen id on enter and refocuses the input', async () => {
    const { app, container } = mountView();
    await flushView();

    const specimenIdInput = container.querySelector(
      'input[placeholder="请输入标本ID后按回车确认"]',
    ) as HTMLInputElement | null;
    expect(specimenIdInput).not.toBeNull();

    specimenIdInput!.value = 'SP202605230001';
    specimenIdInput!.dispatchEvent(new Event('input', { bubbles: true }));
    specimenIdInput!.dispatchEvent(
      new KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }),
    );
    await flushView();

    expect(confirmSpecimenRemovalByIdentifierMock).toHaveBeenCalledWith({
      identifier: 'SP202605230001',
      identifierType: 'SPECIMEN_NO',
      remarks: '离体确认',
    });
    expect(listPendingSpecimenRemovalsMock).toHaveBeenCalledTimes(2);
    expect(listPendingSpecimenRemovalsMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        applicationNo: 'AP202605230001',
      }),
    );
    expect(messageSuccessMock).toHaveBeenCalledWith(
      '标本ID SP202605230001 已完成离体确认',
    );
    expect(specimenIdInput!.value).toBe('');

    app.unmount();
  });

  it('keeps quick confirm input when quick confirm fails', async () => {
    listSpecimensMock.mockResolvedValueOnce({
      items: [
        {
          abnormalFlag: false,
          applicationId: 'APP-DUPLICATE',
          applicationNo: 'AP202605239999',
          barcode: 'BC-DUPLICATE',
          checkInStatus: null,
          checkedInAt: null,
          checkedInByName: null,
          containerCount: 1,
          containerName: '福尔马林瓶',
          fixationStatus: 'PENDING',
          labelPrintBatchNo: null,
          labelPrintStatus: 'SUCCESS',
          latestTrackingAt: '2026-05-23 12:50:00',
          patientName: 'Alice',
          recentNode: null,
          registeredAt: '2026-05-23 12:49:00',
          specimenConfirmedAt: null,
          specimenCount: 1,
          specimenId: 'SPEC-DUPLICATE',
          specimenName: '腹部组织',
          specimenNo: 'SP-DUPLICATE',
          specimenRemovalAt: null,
          specimenSite: null,
          specimenStatus: 'REGISTERED',
          specimenType: '常规',
          submittingDepartmentId: null,
          submittingDepartmentName: null,
          verificationCompletedAt: null,
          verificationStartedAt: null,
          verificationStatus: null,
        },
      ],
      page: 1,
      size: 100,
      summary: {
        abnormalCount: 0,
        labelPrintedCount: 1,
        pendingLabelCount: 0,
        totalCount: 1,
      },
      total: 1,
    } as any);
    confirmSpecimenRemovalByIdentifierMock.mockRejectedValueOnce(
      new Error('标本ID对应多条记录，无法自动确认'),
    );
    const { app, container } = mountView();
    await flushView();

    const specimenIdInput = container.querySelector(
      'input[placeholder="请输入标本ID后按回车确认"]',
    ) as HTMLInputElement | null;
    expect(specimenIdInput).not.toBeNull();

    specimenIdInput!.value = 'SP-DUPLICATE';
    specimenIdInput!.dispatchEvent(new Event('input', { bubbles: true }));
    specimenIdInput!.dispatchEvent(
      new KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }),
    );
    await flushView();

    expect(confirmSpecimenRemovalByIdentifierMock).toHaveBeenCalledWith({
      identifier: 'SP-DUPLICATE',
      identifierType: 'SPECIMEN_NO',
      remarks: '离体确认',
    });
    expect(specimenIdInput!.value).toBe('SP-DUPLICATE');
    expect(container.textContent).toContain(
      '标本ID对应多条记录，无法自动确认',
    );

    app.unmount();
  });

  it('does not submit quick confirm when specimen is already removed', async () => {
    confirmSpecimenRemovalByIdentifierMock.mockClear();
    listSpecimensMock.mockResolvedValueOnce({
      items: [
        {
          abnormalFlag: false,
          applicationId: 'APP-REMOVED',
          applicationNo: 'AP202606010006',
          barcode: 'BC-REMOVED',
          checkInStatus: null,
          checkedInAt: null,
          checkedInByName: null,
          containerCount: 1,
          containerName: '福尔马林瓶',
          fixationStatus: 'PENDING',
          labelPrintBatchNo: null,
          labelPrintStatus: 'SUCCESS',
          latestTrackingAt: '2026-06-01 13:52:01',
          patientName: 'Alice',
          recentNode: null,
          registeredAt: '2026-06-01 13:40:00',
          specimenConfirmedAt: '2026-06-01T13:45:00',
          specimenCount: 1,
          specimenId: 'SPEC-REMOVED',
          specimenName: '腹部皮肤活检',
          specimenNo: 'SP20260601006',
          specimenRemovalAt: '2026-06-01T13:50:00',
          specimenSite: null,
          specimenStatus: 'REGISTERED',
          specimenType: '常规',
          submittingDepartmentId: null,
          submittingDepartmentName: null,
          verificationCompletedAt: null,
          verificationStartedAt: null,
          verificationStatus: null,
        },
      ],
      page: 1,
      size: 100,
      summary: {
        abnormalCount: 0,
        labelPrintedCount: 1,
        pendingLabelCount: 0,
        totalCount: 1,
      },
      total: 1,
    } as any);

    const { app, container } = mountView();
    await flushView();

    const specimenIdInput = container.querySelector(
      'input[placeholder="请输入标本ID后按回车确认"]',
    ) as HTMLInputElement | null;
    expect(specimenIdInput).not.toBeNull();

    specimenIdInput!.value = 'SP20260601006';
    specimenIdInput!.dispatchEvent(new Event('input', { bubbles: true }));
    specimenIdInput!.dispatchEvent(
      new KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }),
    );
    await flushView();

    expect(listSpecimensMock).toHaveBeenCalledWith(
      expect.objectContaining({
        keyword: 'SP20260601006',
      }),
    );
    expect(confirmSpecimenRemovalByIdentifierMock).not.toHaveBeenCalled();
    expect(messageWarningMock).toHaveBeenCalledWith(
      '标本ID SP20260601006 已完成离体确认',
    );
    expect(specimenIdInput!.value).toBe('SP20260601006');

    app.unmount();
  });

  it('does not submit quick confirm when specimen cannot be found', async () => {
    confirmSpecimenRemovalByIdentifierMock.mockClear();
    listSpecimensMock.mockResolvedValueOnce({
      items: [],
      page: 1,
      size: 100,
      summary: {
        abnormalCount: 0,
        labelPrintedCount: 0,
        pendingLabelCount: 0,
        totalCount: 0,
      },
      total: 0,
    } as any);

    const { app, container } = mountView();
    await flushView();

    const specimenIdInput = container.querySelector(
      'input[placeholder="请输入标本ID后按回车确认"]',
    ) as HTMLInputElement | null;
    expect(specimenIdInput).not.toBeNull();

    specimenIdInput!.value = 'SP-NOT-FOUND';
    specimenIdInput!.dispatchEvent(new Event('input', { bubbles: true }));
    specimenIdInput!.dispatchEvent(
      new KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }),
    );
    await flushView();

    expect(listSpecimensMock).toHaveBeenCalledWith(
      expect.objectContaining({
        keyword: 'SP-NOT-FOUND',
      }),
    );
    expect(confirmSpecimenRemovalByIdentifierMock).not.toHaveBeenCalled();
    expect(messageWarningMock).toHaveBeenCalledWith(
      '未找到对应标本，请确认标本ID是否正确',
    );
    expect(specimenIdInput!.value).toBe('SP-NOT-FOUND');

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
