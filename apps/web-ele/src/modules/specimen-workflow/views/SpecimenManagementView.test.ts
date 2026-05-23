import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockAccessStore, mockRoute, mockRouter, mockUserStore } = vi.hoisted(() => ({
  mockAccessStore: {
    accessCodes: [] as string[],
  },
  mockRoute: {
    query: {
      applicationId: 'APP-001',
    } as Record<string, string>,
  },
  mockRouter: {
    push: vi.fn(),
    replace: vi.fn(),
  },
  mockUserStore: {
    userInfo: {
      realName: '测试用户',
      userId: 'USER-001',
    },
  },
}));

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => mockRouter,
}));

vi.mock('@vben/common-ui', () => ({
  Page: {
    props: ['title'],
    template: '<div><slot /></div>',
  },
}));

vi.mock('@vben/stores', () => ({
  useAccessStore: () => mockAccessStore,
  useUserStore: () => mockUserStore,
}));

vi.mock('#/modules/system-management/components/DepartmentSelect.vue', () => ({
  default: {
    props: ['modelValue', 'placeholder'],
    template: '<div />',
  },
}));

vi.mock('#/modules/system-management/components/BodyPartSelect.vue', () => ({
  default: {
    props: ['modelValue', 'placeholder'],
    template: '<div />',
  },
}));

vi.mock('#/modules/system-management/components/SystemUserSelect.vue', () => ({
  default: {
    props: ['modelValue', 'placeholder', 'selectedLabel'],
    template: '<div />',
  },
}));

vi.mock('../api/specimen-workflow-service', () => ({
  listApplications: vi.fn(),
}));

vi.mock('../components/SpecimenRegisterDialog.vue', () => ({
  default: {
    props: ['applicationId', 'modelValue'],
    template:
      '<div data-testid="specimen-register-dialog">{{ JSON.stringify({ kind: "register", applicationId, modelValue }) }}</div>',
  },
}));

vi.mock('../components/SpecimenRegisterResultDialog.vue', () => ({
  default: {
    props: ['applicationId', 'registerResult', 'modelValue'],
    template:
      '<div data-testid="specimen-register-result-dialog">{{ JSON.stringify({ kind: "result", applicationId, modelValue }) }}</div>',
  },
}));

vi.mock('../components/SpecimenLabelRetryDialog.vue', () => ({
  default: {
    props: ['applicationId', 'registerResult', 'retryResult', 'modelValue'],
    template:
      '<div data-testid="specimen-label-retry-dialog">{{ JSON.stringify({ kind: "retry", applicationId, modelValue }) }}</div>',
  },
}));

import SpecimenManagementView from './SpecimenManagementView.vue';

describe('SpecimenManagementView', () => {
  afterEach(() => {
    mockAccessStore.accessCodes = [];
    mockRouter.push.mockReset();
    mockRouter.replace.mockReset();
  });

  it('uses route query application id as the current registration context', async () => {
    mockAccessStore.accessCodes = ['PERM_SPECIMEN_REGISTER'];

    const root = document.createElement('div');
    document.body.append(root);

    const app = createApp({
      render: () => h(SpecimenManagementView),
    });

    app.mount(root);
    await nextTick();

    expect(root.textContent).toContain('APP-001');
    expect(root.textContent).toContain('当前登记上下文：APP-001');

    app.unmount();
    root.remove();
  });
});
