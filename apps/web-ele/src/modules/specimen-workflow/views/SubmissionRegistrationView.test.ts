import { createApp, defineComponent, h, nextTick } from 'vue';

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
  const ElTabs = defineComponent({
    emits: ['update:modelValue'],
    props: ['modelValue'],
    setup(props, { emit, slots }) {
      return () =>
        h('div', [
          h(
            'button',
            {
              'data-testid': 'applications-tab',
              type: 'button',
              onClick: () => emit('update:modelValue', 'applications'),
            },
            '申请管理',
          ),
          h(
            'button',
            {
              'data-testid': 'registration-tab',
              type: 'button',
              onClick: () => emit('update:modelValue', 'registration'),
            },
            '标本登记',
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

vi.mock('./ApplicationListView.vue', () => ({
  default: {
    props: ['embedded'],
    template: '<div data-testid="application-list" :data-embedded="embedded" />',
  },
}));

vi.mock('./SpecimenManagementView.vue', () => ({
  default: {
    props: ['embedded', 'registrationApplicationId', 'registrationTriggerKey'],
    template:
      '<div data-testid="specimen-management" :data-embedded="embedded" :data-application-id="registrationApplicationId" :data-trigger-key="registrationTriggerKey" />',
  },
}));

import SubmissionRegistrationView from './SubmissionRegistrationView.vue';

describe('SubmissionRegistrationView', () => {
  afterEach(() => {
    mockRoute.query = {};
    mockAccessStore.accessCodes = [
      'PERM_APPLICATION_DETAIL_QUERY',
      'PERM_SPECIMEN_REGISTER',
    ];
    document.body.innerHTML = '';
  });

  it('renders both tabs without an outer page title', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const app = createApp({
      render: () => h(SubmissionRegistrationView),
    });

    app.mount(root);
    await nextTick();

    expect(root.querySelector('[data-testid="applications-tab"]')).not.toBeNull();
    expect(root.querySelector('[data-testid="registration-tab"]')).not.toBeNull();
    expect(root.querySelector('[data-testid="application-list"]')?.hasAttribute('data-embedded')).toBe(
      true,
    );
    expect(root.querySelector('h1')).toBeNull();

    app.unmount();
  });

  it('activates the registration tab and forwards route context in register mode', async () => {
    mockRoute.query = {
      action: 'register',
      applicationId: 'APP-EMBEDDED',
    };

    const root = document.createElement('div');
    document.body.append(root);
    const app = createApp({
      render: () => h(SubmissionRegistrationView),
    });

    app.mount(root);
    await nextTick();

    expect(root.querySelector('[data-active-tab="registration"]')).not.toBeNull();
    const specimenManagement = root.querySelector('[data-testid="specimen-management"]');
    expect(specimenManagement?.getAttribute('data-application-id')).toBe('APP-EMBEDDED');
    expect(specimenManagement?.getAttribute('data-trigger-key')).toBe('1');

    app.unmount();
  });
});
