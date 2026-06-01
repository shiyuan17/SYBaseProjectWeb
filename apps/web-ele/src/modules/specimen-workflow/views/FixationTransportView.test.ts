import { createApp, h, nextTick } from 'vue';

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
  const ElTabs = ((props: Record<string, unknown>, { emit, slots }: any) =>
    h('div', [
      h(
        'button',
        {
          'data-testid': 'verification-tab',
          type: 'button',
          onClick: () => emit('update:modelValue', 'verification'),
        },
        '离体确认',
      ),
      h(
        'button',
        {
          'data-testid': 'fixation-tab',
          type: 'button',
          onClick: () => emit('update:modelValue', 'fixation'),
        },
        '标本固定',
      ),
      h(
        'button',
        {
          'data-testid': 'binding-tab',
          type: 'button',
          onClick: () => emit('update:modelValue', 'binding'),
        },
        '条码绑定',
      ),
      h(
        'button',
        {
          'data-testid': 'confirmation-tab',
          type: 'button',
          onClick: () => emit('update:modelValue', 'confirmation'),
        },
        '标本确认',
      ),
      h(
        'button',
        {
          'data-testid': 'check-in-tab',
          type: 'button',
          onClick: () => emit('update:modelValue', 'check-in'),
        },
        '标本入库',
      ),
      h(
        'button',
        {
          'data-testid': 'transport-tab',
          type: 'button',
          onClick: () => emit('update:modelValue', 'transport'),
        },
        '标本出库',
      ),
      h('div', { 'data-active-tab': props.modelValue }, slots.default?.()),
    ])) as unknown;
  const ElTabPane = ((_: Record<string, unknown>, { slots }: any) =>
    h('section', slots.default?.())) as unknown;
  return { ElTabPane, ElTabs };
});

vi.mock('../components/WorkflowSectionCard.vue', () => ({
  default: ((props: Record<string, unknown>, { slots }: any) =>
    h('section', [
      props.title ? h('h2', String(props.title)) : null,
      props.description ? h('p', String(props.description)) : null,
      slots.default?.(),
    ])) as unknown,
}));

vi.mock('../components/SpecimenFixationTimePanel.vue', () => ({
  default: (() =>
    h('div', { 'data-testid': 'fixation-time-panel' }, '??????')) as unknown,
}));

vi.mock('../components/SpecimenBarcodeBindingPanel.vue', () => ({
  default: (() =>
    h('div', { 'data-testid': 'barcode-binding-panel' }, '??????')) as unknown,
}));

vi.mock('../components/SpecimenConfirmationPanel.vue', () => ({
  default: (() =>
    h(
      'div',
      { 'data-testid': 'specimen-confirmation-panel' },
      '??????',
    )) as unknown,
}));

vi.mock('../components/SpecimenCheckInPanel.vue', () => ({
  default: (() =>
    h(
      'div',
      { 'data-testid': 'specimen-check-in-panel' },
      '??????',
    )) as unknown,
}));

vi.mock('./FixationVerifyView.vue', () => ({
  default: ((_: Record<string, unknown>) =>
    h('div', { 'data-testid': 'fixation-verify' })) as unknown,
}));

vi.mock('./TransportHandoverView.vue', () => ({
  default: ((_: Record<string, unknown>) =>
    h('div', { 'data-testid': 'transport-handover' })) as unknown,
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
    const app = createApp(FixationTransportView);

    app.mount(root);
    await nextTick();

    root
      .querySelector<HTMLButtonElement>('[data-testid="transport-tab"]')
      ?.click();
    await nextTick();
    root
      .querySelector<HTMLButtonElement>('[data-testid="verification-tab"]')
      ?.click();
    await nextTick();

    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(root.textContent).toContain('离体确认');
    expect(root.textContent).toContain('标本固定');
    expect(root.textContent).toContain('条码绑定');
    expect(root.textContent).toContain('标本确认');
    expect(root.textContent).toContain('标本入库');
    expect(root.textContent).toContain('标本出库');
    expect(
      root.querySelector('[data-testid="fixation-time-panel"]'),
    ).not.toBeNull();
    expect(
      root.querySelector('[data-testid="barcode-binding-panel"]'),
    ).not.toBeNull();
    expect(
      root.querySelector('[data-testid="specimen-confirmation-panel"]'),
    ).not.toBeNull();
    expect(
      root.querySelector('[data-testid="specimen-check-in-panel"]'),
    ).not.toBeNull();

    app.unmount();
  });

  it('uses the legacy tab query only as the initial tab', async () => {
    mockRoute.query = { tab: 'transport' };
    const root = document.createElement('div');
    document.body.append(root);
    const app = createApp(FixationTransportView);

    app.mount(root);
    await nextTick();

    expect(
      root.querySelector<HTMLElement>('[data-active-tab]')?.dataset.activeTab,
    ).toBe('transport');
    expect(mockRouter.replace).not.toHaveBeenCalled();

    app.unmount();
  });
});
