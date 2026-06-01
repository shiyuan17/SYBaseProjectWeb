import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createAlertStub,
  createEmptyStub,
} from '../test-utils/component-stubs';

const { mockAccessStore, mockRoute } = vi.hoisted(() => ({
  mockAccessStore: {
    accessCodes: [] as string[],
  },
  mockRoute: {
    query: {} as Record<string, string>,
  },
}));

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
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
          'data-testid': 'applications-tab',
          type: 'button',
          onClick: () => emit('update:modelValue', 'applications'),
        },
        '?????',
      ),
      h(
        'button',
        {
          'data-testid': 'specimens-tab',
          type: 'button',
          onClick: () => emit('update:modelValue', 'specimens'),
        },
        '????',
      ),
      h('div', { 'data-active-tab': props.modelValue }, slots.default?.()),
    ])) as unknown;
  const ElTabPane = ((props: Record<string, unknown>, { slots }: any) =>
    h(
      'section',
      {
        'data-label': props.label,
        'data-name': props.name,
      },
      slots.default?.(),
    )) as unknown;
  return {
    ElAlert: createAlertStub(),
    ElEmpty: createEmptyStub(),
    ElTabPane,
    ElTabs,
  };
});

vi.mock('./TrackingApplicationListView.vue', () => ({
  default: {
    props: ['initialApplicationId', 'triggerKey'],
    template:
      '<div data-testid="tracking-application-list" :data-application-id="initialApplicationId" :data-trigger-key="triggerKey" />',
  },
}));

vi.mock('./TrackingSpecimenListView.vue', () => ({
  default: {
    props: ['initialBarcode', 'triggerKey'],
    template:
      '<div data-testid="tracking-specimen-list" :data-barcode="initialBarcode" :data-trigger-key="triggerKey" />',
  },
}));

import TrackingQueryView from './TrackingQueryView.vue';

async function mountView() {
  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp({
    render: () => h(TrackingQueryView),
  });
  app.directive('loading', {
    mounted() {},
    updated() {},
  });
  app.mount(root);
  await nextTick();
  return { app, root };
}

describe('TrackingQueryView', () => {
  afterEach(() => {
    mockAccessStore.accessCodes = [];
    mockRoute.query = {};
    document.body.innerHTML = '';
  });

  it('renders tabs according to permissions', async () => {
    mockAccessStore.accessCodes = [
      'PERM_APPLICATION_DETAIL_QUERY',
      'PERM_SPECIMEN_REGISTER',
    ];

    const { app, root } = await mountView();

    expect(
      root.querySelector('[data-testid="tracking-application-list"]'),
    ).not.toBeNull();
    expect(
      root.querySelector('[data-testid="tracking-specimen-list"]'),
    ).not.toBeNull();
    expect(
      root.querySelector('[data-testid="applications-tab"]'),
    ).not.toBeNull();
    expect(root.querySelector('[data-testid="specimens-tab"]')).not.toBeNull();
    expect(root.querySelector('h1')).toBeNull();

    app.unmount();
  });

  it('shows empty permission state instead of a blank page', async () => {
    const { app, root } = await mountView();

    expect(root.textContent).toContain('当前账号只有追踪菜单权限');
    expect(root.textContent).toContain('当前账号暂无追踪列表查看权限');
    expect(
      root.querySelector('[data-testid="tracking-application-list"]'),
    ).toBeNull();
    expect(
      root.querySelector('[data-testid="tracking-specimen-list"]'),
    ).toBeNull();

    app.unmount();
  });

  it('activates application tab and forwards application route context', async () => {
    mockAccessStore.accessCodes = [
      'PERM_APPLICATION_DETAIL_QUERY',
      'PERM_SPECIMEN_REGISTER',
    ];
    mockRoute.query = {
      applicationId: 'APP-TRACK-001',
    };

    const { app, root } = await mountView();

    expect(
      root.querySelector('[data-active-tab="applications"]'),
    ).not.toBeNull();
    const applicationList = root.querySelector<HTMLElement>(
      '[data-testid="tracking-application-list"]',
    );
    expect(applicationList?.dataset.applicationId).toBe('APP-TRACK-001');
    expect(applicationList?.dataset.triggerKey).toBe('1');

    app.unmount();
  });

  it('activates specimen tab and forwards barcode route context', async () => {
    mockAccessStore.accessCodes = [
      'PERM_APPLICATION_DETAIL_QUERY',
      'PERM_SPECIMEN_REGISTER',
    ];
    mockRoute.query = {
      barcode: 'BC-TRACK-001',
    };

    const { app, root } = await mountView();

    expect(root.querySelector('[data-active-tab="specimens"]')).not.toBeNull();
    const specimenList = root.querySelector<HTMLElement>(
      '[data-testid="tracking-specimen-list"]',
    );
    expect(specimenList?.dataset.barcode).toBe('BC-TRACK-001');
    expect(specimenList?.dataset.triggerKey).toBe('1');

    app.unmount();
  });

  it('does not render the removed verification and correction panels', async () => {
    mockAccessStore.accessCodes = [
      'PERM_APPLICATION_DETAIL_QUERY',
      'PERM_SPECIMEN_REGISTER',
    ];
    mockRoute.query = {
      barcode: 'BC-TRACK-001',
    };

    const { app, root } = await mountView();

    expect(root.textContent).not.toContain('核对记录视图');
    expect(root.textContent).not.toContain('异常修正入口说明');
    expect(
      root.querySelector('[data-testid="tracking-specimen-list"]'),
    ).not.toBeNull();

    app.unmount();
  });
});
