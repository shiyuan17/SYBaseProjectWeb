import type { PendingTransportOrderItem } from '../types/specimen-workflow';

import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createButtonStub,
  createTableColumnStub,
  createTableStub,
  createTagStub,
} from '../test-utils/component-stubs';

const tableRowContextKey = vi.hoisted(() =>
  Symbol('transport-handover-order-table-row'),
);

vi.mock('element-plus', () => ({
  ElButton: createButtonStub(),
  ElTable: createTableStub(tableRowContextKey),
  ElTableColumn: createTableColumnStub(tableRowContextKey),
  ElTag: createTagStub(),
}));

import TransportHandoverOrderTable from './TransportHandoverOrderTable.vue';

function createOrder(
  overrides: Partial<PendingTransportOrderItem> = {},
): PendingTransportOrderItem {
  return {
    applicationId: 'APP-1',
    applicationNo: 'NO-1',
    handedOverAt: null,
    handoverDepartmentName: '外科',
    id: 'TO-1',
    patientName: '张三',
    receiverDepartmentName: '病理科',
    specimenBarcodes: ['BC-1'],
    status: 'PRINTED',
    toBeTransportedAt: '2026-05-31 10:00:00',
    transportOrderNo: 'TR-001',
    ...overrides,
  };
}

async function mountTable(props: Record<string, unknown> = {}) {
  const container = document.createElement('div');
  document.body.append(container);
  const printMock = vi.fn();
  const handoverMock = vi.fn();

  const app = createApp({
    render() {
      return h(TransportHandoverOrderTable, {
        loading: false,
        onHandover: handoverMock,
        onPrint: printMock,
        orders: [createOrder()],
        ...props,
      });
    },
  });

  app.directive('loading', {});
  app.mount(container);
  await nextTick();

  return {
    container,
    handoverMock,
    printMock,
    unmount() {
      app.unmount();
      container.remove();
    },
  };
}

describe('TransportHandoverOrderTable', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('renders transport order rows', async () => {
    const wrapper = await mountTable();

    expect(wrapper.container.textContent).toContain('TR-001');
    expect(wrapper.container.textContent).toContain('张三');
    expect(wrapper.container.textContent).toContain('BC-1');

    wrapper.unmount();
  });

  it('emits print and handover actions', async () => {
    const wrapper = await mountTable();

    const buttons = [
      ...wrapper.container.querySelectorAll<HTMLButtonElement>('button'),
    ];
    buttons.find((button) => button.textContent?.includes('打印'))?.click();
    buttons.find((button) => button.textContent?.includes('交接'))?.click();
    await nextTick();

    expect(wrapper.printMock).toHaveBeenCalledTimes(1);
    expect(wrapper.handoverMock).toHaveBeenCalledTimes(1);
    expect(wrapper.printMock).toHaveBeenCalledWith(
      expect.objectContaining({ transportOrderNo: 'TR-001' }),
    );

    wrapper.unmount();
  });
});
