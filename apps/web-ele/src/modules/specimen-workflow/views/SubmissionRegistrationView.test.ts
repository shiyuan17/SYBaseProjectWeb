import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockAccessStore, mockRoute } = vi.hoisted(() => ({
  mockAccessStore: {
    accessCodes: [
      'PERM_APPLICATION_DETAIL_QUERY',
      'PERM_SPECIMEN_REGISTER',
    ] as string[],
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
        '????',
      ),
      h(
        'button',
        {
          'data-testid': 'registration-tab',
          type: 'button',
          onClick: () => emit('update:modelValue', 'registration'),
        },
        '????',
      ),
      h('div', { 'data-active-tab': props.modelValue }, slots.default?.()),
    ])) as unknown;
  const ElTabPane = ((_: Record<string, unknown>, { slots }: any) =>
    h('section', slots.default?.())) as unknown;
  return { ElTabPane, ElTabs };
});

vi.mock('./ApplicationListView.vue', () => ({
  default: {
    props: ['embedded'],
    setup(props: { embedded?: boolean }) {
      return () =>
        h('div', {
          'data-embedded': props.embedded,
          'data-testid': 'application-list',
        });
    },
  },
}));

vi.mock('./SpecimenManagementView.vue', () => ({
  default: {
    props: ['embedded', 'registrationApplicationId', 'registrationTriggerKey'],
    setup(props: {
      embedded?: boolean;
      registrationApplicationId?: string;
      registrationTriggerKey?: number;
    }) {
      return () =>
        h('div', {
          'data-application-id': props.registrationApplicationId,
          'data-embedded': props.embedded,
          'data-testid': 'specimen-management',
          'data-trigger-key': props.registrationTriggerKey,
        });
    },
  },
}));

import SubmissionRegistrationView from './SubmissionRegistrationView.vue';

describe('SubmissionRegistrationView', () => {
  async function flushAsyncRender() {
    await Promise.resolve();
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await Promise.resolve();
    await nextTick();
  }

  afterEach(() => {
    mockRoute.query = {};
    mockAccessStore.accessCodes = [
      'PERM_APPLICATION_DETAIL_QUERY',
      'PERM_SPECIMEN_REGISTER',
    ];
    document.body.innerHTML = '';
  });

  it('lazy-loads tab content and keeps visited tabs mounted', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const app = createApp(SubmissionRegistrationView);

    app.mount(root);
    await flushAsyncRender();

    expect(
      root.querySelector('[data-testid="applications-tab"]'),
    ).not.toBeNull();
    expect(
      root.querySelector('[data-testid="registration-tab"]'),
    ).not.toBeNull();
    expect(
      root
        .querySelector('[data-testid="application-list"]')
        ?.hasAttribute('data-embedded'),
    ).toBe(true);
    expect(
      root.querySelector('[data-testid="specimen-management"]'),
    ).toBeNull();
    expect(root.querySelector('h1')).toBeNull();

    root
      .querySelector<HTMLButtonElement>('[data-testid="registration-tab"]')
      ?.click();
    await flushAsyncRender();

    expect(
      root.querySelector('[data-testid="application-list"]'),
    ).not.toBeNull();
    expect(
      root.querySelector('[data-testid="specimen-management"]'),
    ).not.toBeNull();

    app.unmount();
  });

  it('activates the registration tab and forwards route context in register mode', async () => {
    mockRoute.query = {
      action: 'register',
      applicationId: 'APP-EMBEDDED',
    };

    const root = document.createElement('div');
    document.body.append(root);
    const app = createApp(SubmissionRegistrationView);

    app.mount(root);
    await flushAsyncRender();

    expect(
      root.querySelector('[data-active-tab="registration"]'),
    ).not.toBeNull();
    const specimenManagement = root.querySelector<HTMLElement>(
      '[data-testid="specimen-management"]',
    );
    expect(specimenManagement?.dataset.applicationId).toBe('APP-EMBEDDED');
    expect(specimenManagement?.dataset.triggerKey).toBe('1');
    expect(root.querySelector('[data-testid="application-list"]')).toBeNull();

    app.unmount();
  });
});
