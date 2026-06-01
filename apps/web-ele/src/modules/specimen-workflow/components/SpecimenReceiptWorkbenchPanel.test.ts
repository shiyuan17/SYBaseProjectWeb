import type {
  ReceiptFilters,
  TransportReceiptGroup,
} from '../utils/specimen-receipt';

import { createApp, h, nextTick, reactive } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createAlertStub,
  createButtonStub,
  createInputStub,
  createPassthroughStub,
} from '../test-utils/component-stubs';

vi.mock('element-plus', () => ({
  ElAlert: createAlertStub(),
  ElButton: createButtonStub(),
  ElForm: createPassthroughStub('form'),
  ElFormItem: createPassthroughStub(),
  ElInput: createInputStub(),
  ElPagination: createPassthroughStub(),
}));

vi.mock('./WorkflowSectionCard.vue', () => ({
  default: {
    props: ['title', 'description'],
    template:
      '<section><h2>{{ title }}</h2><slot name="extra" /><p>{{ description }}</p><slot /></section>',
  },
}));

vi.mock('./SpecimenReceiptGroupTable.vue', () => ({
  default: {
    props: ['groups'],
    emits: ['prepare', 'reprint'],
    template: `
      <div>
        <div>{{ groups[0]?.applicationNo }}</div>
        <button type="button" @click="$emit('prepare', groups[0])">接收</button>
        <button type="button" @click="$emit('reprint', groups[0])">补打申请单</button>
      </div>
    `,
  },
}));

import SpecimenReceiptWorkbenchPanel from './SpecimenReceiptWorkbenchPanel.vue';

function createGroup(
  overrides: Partial<TransportReceiptGroup> = {},
): TransportReceiptGroup {
  return {
    applicationId: 'APP-1',
    applicationNo: 'AP-001',
    barcodes: ['BC-1'],
    batchAbnormalFlag: true,
    items: [] as TransportReceiptGroup['items'],
    latestTrackingAt: '2026-05-31T09:00:00',
    patientName: '张三',
    reminderCount: 2,
    transportOrderId: 'TO-1',
    unreceivedCount: 1,
    ...overrides,
  };
}

async function mountPanel() {
  const container = document.createElement('div');
  document.body.append(container);
  const openDirectReceiveMock = vi.fn();
  const prepareMock = vi.fn();
  const reprintMock = vi.fn();
  const searchMock = vi.fn();

  const filters = reactive<ReceiptFilters>({
    page: 1,
    size: 20,
    specimenNo: '',
  });

  const app = createApp({
    render() {
      return h(SpecimenReceiptWorkbenchPanel, {
        abnormalBatchCount: 1,
        filters,
        groups: [createGroup()],
        loading: false,
        orphanPendingCount: 2,
        total: 12,
        totalReminderCount: 4,
        'onUpdate:filters': (value: ReceiptFilters) => {
          Object.assign(filters, value);
        },
        onOpenDirectReceive: openDirectReceiveMock,
        onPrepare: prepareMock,
        onReprint: reprintMock,
        onSearch: searchMock,
      });
    },
  });

  app.directive('loading', {});
  app.mount(container);
  await nextTick();

  return {
    container,
    openDirectReceiveMock,
    prepareMock,
    reprintMock,
    searchMock,
    unmount() {
      app.unmount();
      container.remove();
    },
  };
}

describe('SpecimenReceiptWorkbenchPanel', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('renders summary and warning content', async () => {
    const wrapper = await mountPanel();

    expect(wrapper.container.textContent).toContain('待接收转运单');
    expect(wrapper.container.textContent).toContain('待接收标本');
    expect(wrapper.container.textContent).toContain('异常标本');
    expect(wrapper.container.textContent).toContain('提醒标本');
    expect(wrapper.container.textContent).toContain('标本ID');
    expect(wrapper.container.textContent).not.toContain('送检科室');
    expect(wrapper.container.textContent).not.toContain('追踪日期');
    expect(wrapper.container.textContent).not.toContain('查询');
    expect(wrapper.container.textContent).not.toContain('重置');
    expect(wrapper.container.textContent).toContain('AP-001');
    expect(wrapper.container.textContent).toContain(
      '当前有 2 条待接收标本尚未关联转运单',
    );

    wrapper.unmount();
  });

  it('emits toolbar and table actions', async () => {
    const wrapper = await mountPanel();

    const specimenIdInput =
      wrapper.container.querySelector<HTMLInputElement>('input');
    specimenIdInput?.dispatchEvent(
      new KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }),
    );

    const buttons = [
      ...wrapper.container.querySelectorAll<HTMLButtonElement>('button'),
    ];

    buttons.find((button) => button.textContent?.includes('条码直收'))?.click();
    buttons.find((button) => button.textContent?.includes('接收'))?.click();
    buttons
      .find((button) => button.textContent?.includes('补打申请单'))
      ?.click();
    await nextTick();

    expect(wrapper.openDirectReceiveMock).toHaveBeenCalledTimes(1);
    expect(wrapper.searchMock).toHaveBeenCalledTimes(1);
    expect(wrapper.prepareMock).toHaveBeenCalledWith(
      expect.objectContaining({ transportOrderId: 'TO-1' }),
    );
    expect(wrapper.reprintMock).toHaveBeenCalledWith(
      expect.objectContaining({ transportOrderId: 'TO-1' }),
    );

    wrapper.unmount();
  });
});
