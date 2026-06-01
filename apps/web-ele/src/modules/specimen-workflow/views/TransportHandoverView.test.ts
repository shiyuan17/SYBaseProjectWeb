import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { createDialogStub } from '../test-utils/component-stubs';
import TransportHandoverView from './TransportHandoverView.vue';

const {
  handoverTransportOrderMock,
  listPendingTransportOrdersMock,
  outboundTransportOrderMock,
  printTransportOrderMock,
  warningMock,
} = vi.hoisted(() => ({
  handoverTransportOrderMock: vi.fn(),
  listPendingTransportOrdersMock: vi.fn(async () => ({
    items: [
      {
        applicationId: 'APP-002',
        applicationNo: 'M2-20260526-002',
        batchAbnormalFlag: false,
        handedOverAt: null,
        handoverDepartmentName: 'Surgery',
        id: 'TO-002',
        outboundUserId: null,
        outboundUserName: null,
        patientName: 'Alice',
        receiverDepartmentName: 'Pathology',
        reminderCount: 0,
        specimenBarcodes: ['BC-002-01'],
        status: 'PRINTED',
        toBeTransportedAt: '2026-05-26 10:00:00',
        transportOrderNo: 'TR-20260526-002',
        unreceivedCount: 1,
      },
    ],
    page: 1,
    size: 20,
    total: 1,
  })),
  outboundTransportOrderMock: vi.fn(async () => ({
    applicationId: 'APP-002',
    handedOverAt: '2026-05-26 10:10:00',
    handoverUserName: 'Surgery',
    id: 'TO-002',
    outboundUserId: 'USER-001',
    outboundUserName: 'Test User',
    receiverUserName: null,
    status: 'HANDED_OVER',
    toBeTransportedAt: '2026-05-26 10:00:00',
    transportOrderNo: 'TR-20260526-002',
  })),
  printTransportOrderMock: vi.fn(),
  warningMock: vi.fn(),
}));

const { mockRoute } = vi.hoisted(() => ({
  mockRoute: {
    query: {
      applicationId: 'APP-002',
      applicationNo: 'M2-20260526-002',
    } as Record<string, string>,
  },
}));

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
}));

vi.mock('@vben/common-ui', () => ({
  Page: {
    props: ['title'],
    template: '<section><h1 v-if="title">{{ title }}</h1><slot /></section>',
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
    props: ['modelValue', 'placeholder', 'selectedLabel'],
    template: '<div />',
  },
}));

vi.mock('#/modules/system-management/components/SystemUserSelect.vue', () => ({
  default: {
    props: ['modelValue', 'placeholder', 'selectedLabel'],
    template:
      '<div data-testid="system-user-select">{{ placeholder }}{{ selectedLabel }}</div>',
  },
}));

vi.mock('../components/WorkflowSectionCard.vue', () => ({
  default: {
    props: ['title', 'description'],
    template:
      '<section><h2>{{ title }}</h2><slot name="extra" /><p v-if="description">{{ description }}</p><slot /></section>',
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
  const actual =
    await vi.importActual<typeof import('element-plus')>('element-plus');
  return {
    ...actual,
    ElDialog: createDialogStub(),
    ElMessage: { success: vi.fn(), warning: warningMock },
  };
});

vi.mock('../api/specimen-workflow-service', () => ({
  handoverTransportOrder: handoverTransportOrderMock,
  listPendingTransportOrders: listPendingTransportOrdersMock,
  outboundTransportOrder: outboundTransportOrderMock,
  printTransportOrder: printTransportOrderMock,
}));

function mountView() {
  const container = document.createElement('div');
  document.body.append(container);
  const app = createApp({
    render: () => h(TransportHandoverView),
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

describe('TransportHandoverView', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('renders the check-in style transport workspace and forwards route context', async () => {
    const { app, container } = mountView();
    await flush();

    expect(container.textContent).toContain('转运/出库');
    expect(container.textContent).toContain('批量打印');
    expect(container.textContent).toContain('批量交接');
    expect(container.textContent).toContain('创建转运单');
    expect(container.textContent).toContain('选择出库人Test User');
    expect(listPendingTransportOrdersMock).toHaveBeenCalledWith(
      expect.objectContaining({ applicationId: 'APP-002' }),
    );

    const createButton = [...container.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('创建转运单'),
    );
    createButton?.click();
    await flush();

    const dialog = container.querySelector<HTMLElement>(
      '[data-testid="transport-order-create-dialog"]',
    );
    expect(dialog?.dataset.open).toBe('true');
    expect(dialog?.dataset.applicationId).toBe('APP-002');
    expect(dialog?.dataset.applicationNo).toBe('M2-20260526-002');

    app.unmount();
  });

  it('submits outbound directly when specimen serial search matches one pending order', async () => {
    const { app, container } = mountView();
    await flush();

    vi.clearAllMocks();

    const specimenNoInput = container.querySelector(
      'input[placeholder="请输入标本流水号"]',
    ) as HTMLInputElement | null;
    specimenNoInput!.value = 'SP-TR-001';
    specimenNoInput!.dispatchEvent(new Event('input', { bubbles: true }));
    specimenNoInput!.dispatchEvent(
      new KeyboardEvent('keyup', {
        bubbles: true,
        code: 'Enter',
        key: 'Enter',
      }),
    );
    await flush();

    expect(listPendingTransportOrdersMock).toHaveBeenCalledWith(
      expect.objectContaining({ specimenNo: 'SP-TR-001' }),
    );
    expect(outboundTransportOrderMock).toHaveBeenCalledWith('TO-002', {
      outboundUserId: 'USER-001',
      outboundUserName: 'Test User',
      remarks: null,
      terminalCode: null,
    });
    expect(handoverTransportOrderMock).not.toHaveBeenCalled();
    expect(warningMock).not.toHaveBeenCalled();

    app.unmount();
  });

  it('warns when no pending transport order matches the specimen serial number', async () => {
    const { app, container } = mountView();
    await flush();

    vi.clearAllMocks();
    listPendingTransportOrdersMock.mockResolvedValueOnce({
      items: [],
      page: 1,
      size: 20,
      total: 0,
    });

    const specimenNoInput = container.querySelector(
      'input[placeholder="请输入标本流水号"]',
    ) as HTMLInputElement | null;
    specimenNoInput!.value = 'SP-NOT-FOUND';
    specimenNoInput!.dispatchEvent(new Event('input', { bubbles: true }));
    specimenNoInput!.dispatchEvent(
      new KeyboardEvent('keyup', {
        bubbles: true,
        code: 'Enter',
        key: 'Enter',
      }),
    );
    await flush();

    expect(listPendingTransportOrdersMock).toHaveBeenCalledWith(
      expect.objectContaining({ specimenNo: 'SP-NOT-FOUND' }),
    );
    expect(warningMock).toHaveBeenCalledWith(
      '未找到待处理转运单，请检查标本流水号后重试。',
    );
    expect(outboundTransportOrderMock).not.toHaveBeenCalled();

    app.unmount();
  });

  it('does not auto-open handover when specimen serial search matches multiple orders', async () => {
    const { app, container } = mountView();
    await flush();

    vi.clearAllMocks();
    listPendingTransportOrdersMock.mockResolvedValueOnce({
      items: [
        {
          applicationId: 'APP-003',
          applicationNo: 'M2-20260526-003',
          batchAbnormalFlag: false,
          handedOverAt: null,
          handoverDepartmentName: 'Surgery',
          id: 'TO-003',
          outboundUserId: null,
          outboundUserName: null,
          patientName: 'Bob',
          receiverDepartmentName: 'Pathology',
          reminderCount: 0,
          specimenBarcodes: ['BC-003-01'],
          status: 'PRINTED',
          toBeTransportedAt: '2026-05-26 11:00:00',
          transportOrderNo: 'TR-20260526-003',
          unreceivedCount: 1,
        },
        {
          applicationId: 'APP-004',
          applicationNo: 'M2-20260526-004',
          batchAbnormalFlag: false,
          handedOverAt: null,
          handoverDepartmentName: 'Surgery',
          id: 'TO-004',
          outboundUserId: null,
          outboundUserName: null,
          patientName: 'Carol',
          receiverDepartmentName: 'Pathology',
          reminderCount: 0,
          specimenBarcodes: ['BC-004-01'],
          status: 'PRINTED',
          toBeTransportedAt: '2026-05-26 12:00:00',
          transportOrderNo: 'TR-20260526-004',
          unreceivedCount: 1,
        },
      ],
      page: 1,
      size: 20,
      total: 2,
    });

    const specimenNoInput = container.querySelector(
      'input[placeholder="请输入标本流水号"]',
    ) as HTMLInputElement | null;
    specimenNoInput!.value = 'SP-MULTI';
    specimenNoInput!.dispatchEvent(new Event('input', { bubbles: true }));
    specimenNoInput!.dispatchEvent(
      new KeyboardEvent('keyup', {
        bubbles: true,
        code: 'Enter',
        key: 'Enter',
      }),
    );
    await flush();

    expect(listPendingTransportOrdersMock).toHaveBeenCalledWith(
      expect.objectContaining({ specimenNo: 'SP-MULTI' }),
    );
    expect(outboundTransportOrderMock).not.toHaveBeenCalled();
    expect(warningMock).not.toHaveBeenCalled();

    app.unmount();
  });

  it('does not render a page-level error alert when the initial load fails', async () => {
    listPendingTransportOrdersMock.mockRejectedValueOnce(
      new Error('资源不存在'),
    );

    const { app, container } = mountView();
    await flush();

    expect(container.textContent).not.toContain('资源不存在');

    app.unmount();
  });
});
