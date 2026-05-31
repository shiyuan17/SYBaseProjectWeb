import type { SpecimenRemovalSummary } from '../types/specimen-workflow';

import { createApp, h, nextTick, reactive, ref } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createButtonStub,
  createInputStub,
  createPassthroughStub,
} from '../test-utils/component-stubs';

vi.mock('element-plus', () => ({
  ElButton: createButtonStub(),
  ElDatePicker: createInputStub(),
  ElForm: createPassthroughStub('form'),
  ElFormItem: createPassthroughStub(),
  ElInput: createInputStub(),
}));

vi.mock('#/modules/system-management/components/DepartmentSelect.vue', () => ({
  default: {
    props: ['modelValue', 'placeholder'],
    template: '<div />',
  },
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
  const searchMock = vi.fn();
  const resetMock = vi.fn();
  const quickConfirmMock = vi.fn();

  const barcodeQuickInput = ref('');
  const specimenNoQuickInput = ref('');
  const filters = reactive({
    applicationNo: '',
    dateRange: [] as string[],
    departmentId: '',
    page: 1,
    size: 20,
  });

  const app = createApp({
    render() {
      return h(FixationVerifyWorkbenchPanel, {
        barcodeQuickInput: barcodeQuickInput.value,
        filters,
        quickActionLoading: {
          barcode: false,
          specimenNo: false,
        },
        specimenNoQuickInput: specimenNoQuickInput.value,
        summary,
        'onUpdate:barcodeQuickInput': (value: string) => {
          barcodeQuickInput.value = value;
        },
        'onUpdate:specimenNoQuickInput': (value: string) => {
          specimenNoQuickInput.value = value;
        },
        onQuickConfirm: quickConfirmMock,
        onReset: resetMock,
        onSearch: searchMock,
      });
    },
  });

  app.directive('loading', {});
  app.mount(container);
  await nextTick();

  return {
    barcodeQuickInput,
    container,
    filters,
    quickConfirmMock,
    resetMock,
    searchMock,
    specimenNoQuickInput,
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

  it('renders summary and emits search/reset actions', async () => {
    const wrapper = await mountPanel();

    expect(wrapper.container.textContent).toContain('设置离体时间');
    expect(wrapper.container.textContent).toContain('全部');
    expect(wrapper.container.textContent).toContain('已离体');
    expect(wrapper.container.textContent).toContain('未设置');

    const buttons = [
      ...wrapper.container.querySelectorAll<HTMLButtonElement>('button'),
    ];
    buttons.find((button) => button.textContent?.includes('查询'))?.click();
    buttons.find((button) => button.textContent?.includes('重置'))?.click();
    await nextTick();

    expect(wrapper.searchMock).toHaveBeenCalledTimes(1);
    expect(wrapper.resetMock).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });

  it('emits quick confirm for barcode and specimenNo inputs', async () => {
    const wrapper = await mountPanel();

    const barcodeInput = wrapper.container.querySelector(
      'input[placeholder="请输入标本ID后按回车确认"]',
    ) as HTMLInputElement | null;
    const specimenNoInput = wrapper.container.querySelector(
      'input[placeholder="请输入标本流水号后按回车确认"]',
    ) as HTMLInputElement | null;

    barcodeInput?.dispatchEvent(
      new KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }),
    );
    specimenNoInput?.dispatchEvent(
      new KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }),
    );
    await nextTick();

    expect(wrapper.quickConfirmMock).toHaveBeenNthCalledWith(1, 'BARCODE');
    expect(wrapper.quickConfirmMock).toHaveBeenNthCalledWith(2, 'SPECIMEN_NO');

    wrapper.unmount();
  });
});
