import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import TransportHandoverView from './TransportHandoverView.vue';

const {
  handoverTransportOrderMock,
  listPendingTransportOrdersMock,
  printTransportOrderMock,
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
  printTransportOrderMock: vi.fn(),
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
    template: '<div />',
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
  const actual = await vi.importActual<typeof import('element-plus')>('element-plus');
  return {
    ...actual,
    ElMessage: { success: vi.fn(), warning: vi.fn() },
  };
});

vi.mock('../api/specimen-workflow-service', () => ({
  handoverTransportOrder: handoverTransportOrderMock,
  listPendingTransportOrders: listPendingTransportOrdersMock,
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

describe('TransportHandoverView', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('owns the create transport order entry and forwards route application context', async () => {
    const { app, container } = mountView();
    await nextTick();
    await Promise.resolve();
    await nextTick();

    expect(container.textContent).toContain('创建转运单');
    expect(listPendingTransportOrdersMock).toHaveBeenCalledWith(
      expect.objectContaining({ applicationId: 'APP-002' }),
    );

    const createButton = [...container.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('创建转运单'),
    );
    createButton?.click();
    await nextTick();

    const dialog = container.querySelector('[data-testid="transport-order-create-dialog"]');
    expect(dialog?.getAttribute('data-open')).toBe('true');
    expect(dialog?.getAttribute('data-application-id')).toBe('APP-002');
    expect(dialog?.getAttribute('data-application-no')).toBe('M2-20260526-002');

    app.unmount();
  });

  it('forwards specimenNo when searching transport orders by specimen serial number', async () => {
    const { app, container } = mountView();
    await nextTick();
    await Promise.resolve();
    await nextTick();

    vi.clearAllMocks();

    const specimenNoInput = container.querySelector(
      'input[placeholder="请输入标本流水号"]',
    ) as HTMLInputElement | null;
    specimenNoInput!.value = 'SP-TR-001';
    specimenNoInput!.dispatchEvent(new Event('input', { bubbles: true }));
    specimenNoInput!.dispatchEvent(
      new KeyboardEvent('keyup', { bubbles: true, code: 'Enter', key: 'Enter' }),
    );
    await nextTick();
    await Promise.resolve();
    await nextTick();

    expect(listPendingTransportOrdersMock).toHaveBeenCalledWith(
      expect.objectContaining({ specimenNo: 'SP-TR-001' }),
    );

    app.unmount();
  });

  it('does not render a page-level error alert when the initial load fails', async () => {
    listPendingTransportOrdersMock.mockRejectedValueOnce(new Error('资源不存在'));

    const { app, container } = mountView();
    await nextTick();
    await Promise.resolve();
    await nextTick();

    expect(container.textContent).not.toContain('资源不存在');

    app.unmount();
  });
});
