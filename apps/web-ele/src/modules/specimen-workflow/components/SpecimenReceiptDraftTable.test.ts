import type { ReceiptDraftItem } from '../utils/specimen-receipt';

import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createButtonStub,
  createInputNumberStub,
  createInputStub,
  createOptionStub,
  createSelectStub,
  createTableColumnStub,
  createTableStub,
} from '../test-utils/component-stubs';

const tableRowContextKey = vi.hoisted(() =>
  Symbol('specimen-receipt-draft-table-row'),
);

vi.mock('element-plus', () => {
  return {
    ElButton: createButtonStub(),
    ElInput: createInputStub(),
    ElInputNumber: createInputNumberStub(),
    ElOption: createOptionStub(),
    ElSelect: createSelectStub(),
    ElTable: createTableStub(tableRowContextKey),
    ElTableColumn: createTableColumnStub(tableRowContextKey),
  };
});

import SpecimenReceiptDraftTable from './SpecimenReceiptDraftTable.vue';

function createDraftItem(
  overrides: Partial<ReceiptDraftItem> = {},
): ReceiptDraftItem {
  return {
    containerCount: 1,
    containerName: '离心管',
    key: 1,
    qualityCheckResult: 'PASSED',
    qualityIssueCodes: [],
    reason: '',
    receiptStatus: 'RECEIVED',
    remarks: '',
    specimenBarcode: 'BC-1',
    ...overrides,
  };
}

async function mountTable(props: Record<string, unknown> = {}) {
  const container = document.createElement('div');
  document.body.append(container);
  const removeMock = vi.fn();

  const app = createApp({
    render() {
      return h(SpecimenReceiptDraftTable, {
        items: [createDraftItem()],
        onRemove: removeMock,
        ...props,
      });
    },
  });

  app.mount(container);
  await nextTick();

  return {
    container,
    removeMock,
    unmount() {
      app.unmount();
      container.remove();
    },
  };
}

describe('SpecimenReceiptDraftTable', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('renders container name when requested', async () => {
    const wrapper = await mountTable({ showContainerName: true });

    expect(wrapper.container.textContent).toContain('离心管');
    expect(wrapper.container.textContent).not.toContain('删除');

    wrapper.unmount();
  });

  it('emits remove when delete action is enabled', async () => {
    const wrapper = await mountTable({ showRemoveAction: true });

    const deleteButton = [
      ...wrapper.container.querySelectorAll<HTMLButtonElement>('button'),
    ].find((button) => button.textContent?.includes('删除'));

    expect(deleteButton).not.toBeUndefined();
    deleteButton?.click();
    await nextTick();

    expect(wrapper.removeMock).toHaveBeenCalledWith(1);

    wrapper.unmount();
  });
});
