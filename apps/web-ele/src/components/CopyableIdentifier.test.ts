import { createApp, h, nextTick } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockClipboardWriteText, mockElMessageSuccess, mockElMessageWarning } =
  vi.hoisted(() => ({
    mockClipboardWriteText: vi.fn(),
    mockElMessageSuccess: vi.fn(),
    mockElMessageWarning: vi.fn(),
  }));

vi.mock('element-plus', async () => {
  const { defineComponent, h } = await import('vue');

  return {
    ElMessage: {
      success: mockElMessageSuccess,
      warning: mockElMessageWarning,
    },
    ElTag: defineComponent({
      inheritAttrs: false,
      props: ['type'],
      setup(props, { attrs, slots }) {
        return () =>
          h(
            'span',
            {
              ...attrs,
              'data-tag-type': props.type ?? '',
            },
            slots.default?.(),
          );
      },
    }),
  };
});

import CopyableIdentifier from './CopyableIdentifier.vue';

type CopyableIdentifierProps = {
  fallbackValue?: null | number | string;
  kind: 'applicationNo' | 'pathologyNo' | 'patientId' | 'specimenNo';
  placeholder?: string;
  tagSize?: 'default' | 'large' | 'small';
  tagType?: '' | 'danger' | 'info' | 'primary' | 'success' | 'warning';
  value?: null | number | string;
};

async function flush() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

async function mountComponent(props: CopyableIdentifierProps) {
  const root = document.createElement('div');
  document.body.append(root);

  const app = createApp({
    render: () => h(CopyableIdentifier, props),
  });

  app.mount(root);
  await flush();

  return {
    root,
    unmount: () => {
      app.unmount();
      root.remove();
    },
  };
}

describe('CopyableIdentifier', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: mockClipboardWriteText,
      },
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    mockClipboardWriteText.mockReset();
    mockElMessageSuccess.mockReset();
    mockElMessageWarning.mockReset();
    vi.restoreAllMocks();
  });

  it('copies the normalized identifier and shows a type-specific success message', async () => {
    mockClipboardWriteText.mockResolvedValue(undefined);

    const wrapper = await mountComponent({
      kind: 'pathologyNo',
      value: '  BL-001  ',
    });
    const trigger = wrapper.root.querySelector(
      '[data-copyable="true"]',
    ) as HTMLElement | null;

    expect(trigger).not.toBeNull();

    trigger?.click();
    await flush();

    expect(mockClipboardWriteText).toHaveBeenCalledWith('BL-001');
    expect(mockElMessageSuccess).toHaveBeenCalledWith('病理号已复制');

    wrapper.unmount();
  });

  it('renders non-copyable placeholder text when the identifier is empty', async () => {
    const wrapper = await mountComponent({
      kind: 'applicationNo',
      value: '   ',
    });
    const trigger = wrapper.root.querySelector(
      '[data-copyable="false"]',
    ) as HTMLElement | null;

    expect(trigger?.textContent).toBe('-');
    trigger?.click();
    await flush();

    expect(mockClipboardWriteText).not.toHaveBeenCalled();
    expect(mockElMessageSuccess).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it('falls back to the secondary value when copying patient identifiers', async () => {
    mockClipboardWriteText.mockResolvedValue(undefined);

    const wrapper = await mountComponent({
      fallbackValue: '08305',
      kind: 'patientId',
      value: '',
    });
    const trigger = wrapper.root.querySelector(
      '[data-copyable="true"]',
    ) as HTMLElement | null;

    expect(trigger?.textContent).toBe('08305');

    trigger?.click();
    await flush();

    expect(mockClipboardWriteText).toHaveBeenCalledWith('08305');
    expect(mockElMessageSuccess).toHaveBeenCalledWith('病人ID已复制');

    wrapper.unmount();
  });

  it('shows a warning when both clipboard and legacy copy fail', async () => {
    mockClipboardWriteText.mockRejectedValue(new Error('clipboard denied'));
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: vi.fn().mockReturnValue(false),
    });

    const wrapper = await mountComponent({
      kind: 'specimenNo',
      value: 'SP-001',
    });
    const trigger = wrapper.root.querySelector(
      '[data-copyable="true"]',
    ) as HTMLElement | null;

    trigger?.click();
    await flush();

    expect(mockElMessageWarning).toHaveBeenCalledWith('复制失败，请手动复制');
    expect(mockElMessageSuccess).not.toHaveBeenCalled();

    wrapper.unmount();
  });
});
