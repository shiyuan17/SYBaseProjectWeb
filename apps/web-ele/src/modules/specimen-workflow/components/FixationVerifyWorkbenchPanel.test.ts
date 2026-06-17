import type { SpecimenRemovalSummary } from '../types/specimen-workflow';

import { createApp, h, nextTick, ref } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { createInputStub } from '../test-utils/component-stubs';

vi.mock('element-plus', () => ({
  ElInput: createInputStub(),
}));

import FixationVerifyWorkbenchPanel from './FixationVerifyWorkbenchPanel.vue';

const summary: SpecimenRemovalSummary = {
  abnormalCount: 0,
  confirmedCount: 1,
  pendingCount: 2,
  totalCount: 3,
};

async function mountPanel() {
  const container = document.createElement('div');
  document.body.append(container);
  const quickConfirmMock = vi.fn();

  const specimenIdQuickInput = ref('');

  const app = createApp({
    render() {
      return h(FixationVerifyWorkbenchPanel, {
        quickActionLoading: {
          specimenId: false,
        },
        summary,
        'onUpdate:specimenIdQuickInput': (value: string) => {
          specimenIdQuickInput.value = value;
        },
        onQuickConfirm: quickConfirmMock,
        specimenIdQuickInput: specimenIdQuickInput.value,
      });
    },
  });

  app.directive('loading', {});
  app.mount(container);
  await nextTick();

  return {
    container,
    quickConfirmMock,
    specimenIdQuickInput,
    unmount() {
      app.unmount();
      container.remove();
    },
  };
}

describe('FixationVerifyWorkbenchPanel', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('renders summary and the streamlined barcode or specimen number input', async () => {
    const wrapper = await mountPanel();

    expect(wrapper.container.textContent).toContain('全部');
    expect(wrapper.container.textContent).toContain('已离体');
    expect(wrapper.container.textContent).toContain('未设置');
    expect(
      wrapper.container.querySelector(
        'input[placeholder="请输入标本条码/编号后按回车确认"]',
      ),
    ).not.toBeNull();
    expect(wrapper.container.textContent).not.toContain('标本流水号');
    expect(wrapper.container.textContent).not.toContain('查询');
    expect(wrapper.container.textContent).not.toContain('重置');

    wrapper.unmount();
  });

  it('emits quick confirm for the barcode or specimen number input', async () => {
    const wrapper = await mountPanel();

    const specimenIdInput = wrapper.container.querySelector(
      'input[placeholder="请输入标本条码/编号后按回车确认"]',
    ) as HTMLInputElement | null;
    specimenIdInput?.dispatchEvent(
      new KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }),
    );
    await nextTick();

    expect(wrapper.quickConfirmMock).toHaveBeenCalledWith();

    wrapper.unmount();
  });
});
