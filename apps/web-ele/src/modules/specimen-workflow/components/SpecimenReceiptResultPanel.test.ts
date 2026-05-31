import type { SpecimenReceiptResult } from '../types/specimen-workflow';

import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createDescriptionsItemStub,
  createPassthroughStub,
  createTagStub,
} from '../test-utils/component-stubs';

vi.mock('element-plus', () => ({
  ElDescriptions: createPassthroughStub(),
  ElDescriptionsItem: createDescriptionsItemStub(),
  ElTag: createTagStub(),
}));

vi.mock('./WorkflowSectionCard.vue', () => ({
  default: {
    props: ['title', 'description'],
    template:
      '<section><h2>{{ title }}</h2><p>{{ description }}</p><slot /></section>',
  },
}));

import SpecimenReceiptResultPanel from './SpecimenReceiptResultPanel.vue';

const result: SpecimenReceiptResult = {
  batchAbnormalFlag: true,
  caseId: 'CASE-001',
  pathologyNo: 'PATH-001',
  receiptAbnormalSummary: '容器数量不一致',
  receiptStatus: 'PARTIAL',
  reminderCount: 3,
  unreceivedCount: 1,
};

async function mountPanel() {
  const container = document.createElement('div');
  document.body.append(container);

  const app = createApp({
    render() {
      return h(SpecimenReceiptResultPanel, {
        result,
      });
    },
  });

  app.mount(container);
  await nextTick();

  return {
    container,
    unmount() {
      app.unmount();
      container.remove();
    },
  };
}

describe('SpecimenReceiptResultPanel', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('renders receipt result details', async () => {
    const wrapper = await mountPanel();

    expect(wrapper.container.textContent).toContain('接收结果');
    expect(wrapper.container.textContent).toContain('CASE-001');
    expect(wrapper.container.textContent).toContain('PATH-001');
    expect(wrapper.container.textContent).toContain('PARTIAL');
    expect(wrapper.container.textContent).toContain('容器数量不一致');
    expect(wrapper.container.textContent).toContain('是');

    wrapper.unmount();
  });
});
