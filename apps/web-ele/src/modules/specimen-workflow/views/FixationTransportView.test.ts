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
          h('button', {
            'data-testid': 'verification-tab',
            type: 'button',
            onClick: () => emit('update:modelValue', 'verification'),
          }, '标本核对'),
          h('button', {
            'data-testid': 'fixation-tab',
            type: 'button',
            onClick: () => emit('update:modelValue', 'fixation'),
          }, '标本固定'),
          h('button', {
            'data-testid': 'binding-tab',
            type: 'button',
            onClick: () => emit('update:modelValue', 'binding'),
          }, '条码绑定'),
          h('button', {
            'data-testid': 'confirmation-tab',
            type: 'button',
            onClick: () => emit('update:modelValue', 'confirmation'),
          }, '标本确认'),
          h('button', {
            'data-testid': 'check-in-tab',
            type: 'button',
            onClick: () => emit('update:modelValue', 'check-in'),
          }, '标本入库'),
          h('button', {
            'data-testid': 'transport-tab',
            type: 'button',
            onClick: () => emit('update:modelValue', 'transport'),
          }, '转运/出库'),
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

vi.mock('../components/WorkflowSectionCard.vue', () => ({
  default: {
    props: ['title', 'description'],
    template:
      '<section><h2>{{ title }}</h2><p v-if="description">{{ description }}</p><slot /></section>',
  },
}));

vi.mock('../components/SpecimenFixationTimePanel.vue', () => ({
  default: {
    template: '<div data-testid="fixation-time-panel">标本固定面板</div>',
  },
}));

vi.mock('../components/SpecimenBarcodeBindingPanel.vue', () => ({
  default: {
    template: '<div data-testid="barcode-binding-panel">条码绑定面板</div>',
  },
}));

vi.mock('../components/SpecimenConfirmationPanel.vue', () => ({
  default: {
    template: '<div data-testid="specimen-confirmation-panel">标本确认面板</div>',
  },
}));

vi.mock('../components/SpecimenCheckInPanel.vue', () => ({
  default: {
    template: '<div data-testid="specimen-check-in-panel">标本入库面板</div>',
  },
}));

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

  it('switches tabs locally and keeps six in-page scenes', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const app = createApp({
      render: () => h(FixationTransportView),
    });

    app.mount(root);
    await nextTick();

    root.querySelector<HTMLButtonElement>('[data-testid="transport-tab"]')?.click();
    await nextTick();
    root.querySelector<HTMLButtonElement>('[data-testid="verification-tab"]')?.click();
    await nextTick();

    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(root.textContent).toContain('标本核对');
    expect(root.textContent).toContain('标本固定');
    expect(root.textContent).toContain('条码绑定');
    expect(root.textContent).toContain('标本确认');
    expect(root.textContent).toContain('标本入库');
    expect(root.textContent).toContain('转运/出库');
    expect(root.querySelector('[data-testid="fixation-time-panel"]')).not.toBeNull();
    expect(root.querySelector('[data-testid="barcode-binding-panel"]')).not.toBeNull();
    expect(root.querySelector('[data-testid="specimen-confirmation-panel"]')).not.toBeNull();
    expect(root.querySelector('[data-testid="specimen-check-in-panel"]')).not.toBeNull();

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

    expect(root.querySelector('[data-active-tab]')?.getAttribute('data-active-tab')).toBe('transport');
    expect(mockRouter.replace).not.toHaveBeenCalled();

    app.unmount();
  });
});
