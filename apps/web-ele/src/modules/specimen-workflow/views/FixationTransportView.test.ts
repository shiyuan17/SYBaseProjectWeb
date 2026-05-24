import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockAccessStore, mockRoute, mockRouter } = vi.hoisted(() => ({
  mockAccessStore: {
    accessCodes: [
      'PERM_FIXATION_VERIFY',
      'PERM_TRANSPORT_HANDOVER',
    ] as string[],
  },
  mockRoute: {
    query: {} as Record<string, string>,
  },
  mockRouter: {
    push: vi.fn(),
    replace: vi.fn(),
  },
}));

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => mockRouter,
}));

vi.mock('@vben/common-ui', () => ({
  Page: {
    props: ['title'],
    template: '<section><h1 v-if="title">{{ title }}</h1><slot /></section>',
  },
}));

vi.mock('@vben/stores', () => ({
  useAccessStore: () => mockAccessStore,
}));

vi.mock('element-plus', () => {
  const ElTabs = defineComponent({
    emits: ['update:modelValue'],
    props: ['modelValue'],
    setup(props, { emit, slots }) {
      return () =>
        h('div', [
          h(
            'button',
            {
              'data-testid': 'fixation-tab',
              type: 'button',
              onClick: () => emit('update:modelValue', 'fixation'),
            },
            '固定核对',
          ),
          h(
            'button',
            {
              'data-testid': 'transport-tab',
              type: 'button',
              onClick: () => emit('update:modelValue', 'transport'),
            },
            '转运交接',
          ),
          h('div', { 'data-active-tab': props.modelValue }, slots.default?.()),
        ]);
    },
  });
  const ElTabPane = defineComponent({
    props: ['label', 'name'],
    setup(_, { slots }) {
      return () => h('section', slots.default?.());
    },
  });
  return { ElTabPane, ElTabs };
});

vi.mock('./FixationVerifyView.vue', () => ({
  default: {
    props: ['embedded'],
    template: '<div data-testid="fixation-verify" />',
  },
}));

vi.mock('./TransportHandoverView.vue', () => ({
  default: {
    props: ['embedded'],
    template: '<div data-testid="transport-handover" />',
  },
}));

import FixationTransportView from './FixationTransportView.vue';

describe('FixationTransportView', () => {
  afterEach(() => {
    mockRoute.query = {};
    mockAccessStore.accessCodes = [
      'PERM_FIXATION_VERIFY',
      'PERM_TRANSPORT_HANDOVER',
    ];
    mockRouter.push.mockReset();
    mockRouter.replace.mockReset();
    document.body.innerHTML = '';
  });

  it('switches tabs locally without routing and omits the outer header alert', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const app = createApp({
      render: () => h(FixationTransportView),
    });

    app.mount(root);
    await nextTick();

    root.querySelector<HTMLButtonElement>('[data-testid="transport-tab"]')?.click();
    await nextTick();
    root.querySelector<HTMLButtonElement>('[data-testid="fixation-tab"]')?.click();
    await nextTick();

    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(root.querySelector('h1')?.textContent).not.toBe('固定与转运');
    expect(root.textContent).not.toContain(
      '固定核对与转运交接已合并到同一入口',
    );

    app.unmount();
  });

  it('uses the legacy tab query only as the initial tab', async () => {
    mockRoute.query = { tab: 'transport' };
    const root = document.createElement('div');
    document.body.append(root);
    const app = createApp({
      render: () => h(FixationTransportView),
    });

    app.mount(root);
    await nextTick();

    expect(root.querySelector('[data-active-tab]')?.getAttribute('data-active-tab')).toBe(
      'transport',
    );
    expect(mockRouter.replace).not.toHaveBeenCalled();

    app.unmount();
  });
});
