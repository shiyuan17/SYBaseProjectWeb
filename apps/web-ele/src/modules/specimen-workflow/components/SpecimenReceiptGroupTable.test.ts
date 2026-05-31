import type { TransportReceiptGroup } from '../utils/specimen-receipt';

import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createButtonStub,
  createTableColumnStub,
  createTableStub,
  createTagStub,
} from '../test-utils/component-stubs';

const tableRowContextKey = vi.hoisted(() =>
  Symbol('specimen-receipt-group-table-row'),
);

vi.mock('element-plus', () => ({
  ElButton: createButtonStub(),
  ElTable: createTableStub(tableRowContextKey),
  ElTableColumn: createTableColumnStub(tableRowContextKey),
  ElTag: createTagStub(),
}));

import SpecimenReceiptGroupTable from './SpecimenReceiptGroupTable.vue';

function createGroupFixture(
  overrides: Partial<TransportReceiptGroup> = {},
): TransportReceiptGroup {
  return {
    applicationId: 'APP-1',
    applicationNo: 'NO-1',
    barcodes: ['BC-1', 'BC-2'],
    batchAbnormalFlag: true,
    items: [
      {
        barcode: 'BC-1',
        containerName: '离心管',
      },
      {
        barcode: 'BC-2',
        containerName: '蜡块盒',
      },
    ] as TransportReceiptGroup['items'],
    latestTrackingAt: '2026-05-31T09:00:00',
    patientName: '张三',
    reminderCount: 2,
    transportOrderId: 'TO-1',
    unreceivedCount: 1,
    ...overrides,
  };
}

async function mountTable(props: Record<string, unknown> = {}) {
  const container = document.createElement('div');
  document.body.append(container);
  const prepareMock = vi.fn();
  const reprintMock = vi.fn();

  const app = createApp({
    render() {
      return h(SpecimenReceiptGroupTable, {
        groups: [createGroupFixture()],
        loading: false,
        onPrepare: prepareMock,
        onReprint: reprintMock,
        ...props,
      });
    },
  });

  app.directive('loading', {});
  app.mount(container);
  await nextTick();

  return {
    container,
    prepareMock,
    reprintMock,
    unmount() {
      app.unmount();
      container.remove();
    },
  };
}

describe('SpecimenReceiptGroupTable', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('renders grouped receipt information', async () => {
    const wrapper = await mountTable();

    expect(wrapper.container.textContent).toContain('张三');
    expect(wrapper.container.textContent).toContain('异常批次');
    expect(wrapper.container.textContent).toContain('BC-1');
    expect(wrapper.container.textContent).toContain('提醒: 2');
    expect(wrapper.container.textContent).toContain('未接收: 1');

    wrapper.unmount();
  });

  it('emits prepare and reprint actions', async () => {
    const wrapper = await mountTable();

    const buttons = [
      ...wrapper.container.querySelectorAll<HTMLButtonElement>('button'),
    ];
    const prepareButton = buttons.find((button) =>
      button.textContent?.includes('接收'),
    );
    const reprintButton = buttons.find((button) =>
      button.textContent?.includes('补打申请单'),
    );

    prepareButton?.click();
    reprintButton?.click();
    await nextTick();

    expect(wrapper.prepareMock).toHaveBeenCalledTimes(1);
    expect(wrapper.reprintMock).toHaveBeenCalledTimes(1);
    expect(wrapper.prepareMock).toHaveBeenCalledWith(
      expect.objectContaining({ transportOrderId: 'TO-1' }),
    );

    wrapper.unmount();
  });
});
