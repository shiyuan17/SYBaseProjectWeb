import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import SpecimenReceiptView from './SpecimenReceiptView.vue';

const {
  directReceiveSpecimensMock,
  listPendingReceiptsMock,
  receiveSpecimensMock,
  reprintApplicationFormMock,
} = vi.hoisted(() => ({
  directReceiveSpecimensMock: vi.fn(),
  listPendingReceiptsMock: vi.fn(async () => ({
    items: [],
    page: 1,
    size: 20,
    total: 0,
  })),
  receiveSpecimensMock: vi.fn(),
  reprintApplicationFormMock: vi.fn(),
}));

vi.mock('@vben/common-ui', () => ({
  Page: {
    props: ['title'],
    template: '<section><h1 v-if="title">{{ title }}</h1><slot /></section>',
  },
}));

vi.mock('@vben/stores', () => ({
  useUserStore: () => ({
    userInfo: {
      realName: 'Test User',
      userId: 'USER-001',
    },
  }),
}));

vi.mock('#/modules/system-management/components/DepartmentSelect.vue', () => ({
  default: {
    props: ['modelValue', 'placeholder', 'selectedLabel'],
    template: '<div />',
  },
}));

vi.mock('#/modules/system-management/components/SystemUserSelect.vue', () => ({
  default: {
    props: ['modelValue', 'placeholder', 'selectedLabel'],
    template: '<div />',
  },
}));

vi.mock('../components/WorkflowSectionCard.vue', () => ({
  default: {
    props: ['title', 'description'],
    template:
      '<section><h2>{{ title }}</h2><slot name="extra" /><p v-if="description">{{ description }}</p><slot /></section>',
  },
}));

vi.mock('element-plus', async () => {
  const actual = await vi.importActual<typeof import('element-plus')>('element-plus');
  return {
    ...actual,
    ElMessage: { success: vi.fn(), warning: vi.fn() },
  };
});

vi.mock('../api/specimen-workflow-service', () => ({
  directReceiveSpecimens: directReceiveSpecimensMock,
  listPendingReceipts: listPendingReceiptsMock,
  receiveSpecimens: receiveSpecimensMock,
  reprintApplicationForm: reprintApplicationFormMock,
}));

function mountView() {
  const container = document.createElement('div');
  document.body.append(container);
  const app = createApp({
    render: () => h(SpecimenReceiptView),
  });

  app.directive('loading', {});
  app.mount(container);

  return { app, container };
}

describe('SpecimenReceiptView', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('does not render a page-level error alert when the initial load fails', async () => {
    listPendingReceiptsMock.mockRejectedValueOnce(new Error('资源不存在'));

    const { app, container } = mountView();
    await nextTick();
    await Promise.resolve();
    await nextTick();

    expect(container.textContent).not.toContain('资源不存在');

    app.unmount();
  });
});
