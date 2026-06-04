import { createApp, h } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import SpecimenReceiptView from './SpecimenReceiptView.vue';

vi.mock('@vben/common-ui', () => ({
  Page: {
    template: '<section><slot /></section>',
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

vi.mock('#/modules/system-management/components/SystemUserSelect.vue', () => ({
  default: {
    props: ['modelValue', 'placeholder', 'selectedLabel'],
    template: '<div>{{ placeholder }}</div>',
  },
}));

vi.mock('element-plus', async () => {
  const actual =
    await vi.importActual<typeof import('element-plus')>('element-plus');
  return {
    ...actual,
    ElMessage: {
      success: vi.fn(),
      warning: vi.fn(),
    },
  };
});

vi.mock('../api/application-registration-workbench-service', () => ({
  listOperatingBuildingOptions: vi.fn(async () => []),
  lookupApplicationRegistrationWorkbenchRecord: vi.fn(),
}));

vi.mock('../api/specimen-workflow-service', () => ({
  directReceiveSpecimens: vi.fn(),
  getApplicationDetail: vi.fn(async (applicationId: string) => ({
    id: applicationId,
    patientGender: null,
    patientId: null,
    recentEvents: [],
    specimens: [],
  })),
  listPendingReceipts: vi.fn(async () => ({
    items: [],
    page: 1,
    size: 500,
    total: 0,
  })),
  listSpecimens: vi.fn(async () => ({
    items: [],
    page: 1,
    size: 500,
    summary: {
      abnormalCount: 0,
      labelPrintedCount: 0,
      pendingLabelCount: 0,
      totalCount: 0,
      unboundCount: 0,
    },
    total: 0,
  })),
  receiveSpecimens: vi.fn(),
  retryLabelPrint: vi.fn(),
}));

const mockRoute = {
  query: {},
};

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
}));

vi.mock('@vben/utils', () => ({
  downloadFileFromBlob: vi.fn(),
}));

function mountView() {
  const container = document.createElement('div');
  document.body.append(container);
  const app = createApp({
    render: () => h(SpecimenReceiptView),
  });

  app.directive('loading', {});
  app.mount(container);

  return {
    app,
    container,
  };
}

describe('SpecimenReceiptView', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('renders the pathology receipt workbench instead of the old transport list', () => {
    const { app, container } = mountView();

    expect(container.textContent).not.toContain('病理接收');
    expect(container.textContent).toContain('标本签收');
    expect(container.textContent).toContain('异常接收');
    expect(container.textContent).toContain('选择操作人');
    expect(container.textContent).toContain('补打标本标签');
    expect(container.textContent).toContain('导出Excel');
    expect(container.textContent).not.toContain('待接收转运单');
    expect(container.textContent).not.toContain('条码直收');

    app.unmount();
  });
});
