import { createApp, defineComponent, h, nextTick } from 'vue';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { M4_PERMISSION_CODES } from '../constants';

const { mockAccessStore, mockRoute, mockRouter, getReportTrackingMock } =
  vi.hoisted(() => ({
    getReportTrackingMock: vi.fn(),
    mockAccessStore: {
      accessCodes: [] as string[],
    },
    mockRoute: {
      query: {} as Record<string, string | undefined>,
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
  Page: defineComponent({
    props: {
      description: { default: '', type: String },
      title: { default: '', type: String },
    },
    template: `
      <section>
        <h1>{{ title }}</h1>
        <p v-if="description">{{ description }}</p>
        <slot />
      </section>
    `,
  }),
}));

vi.mock('@vben/stores', () => ({
  useAccessStore: () => mockAccessStore,
  useUserStore: () => ({
    userInfo: {
      realName: '当前用户',
      userId: 'USER-1',
    },
  }),
}));

vi.mock('../api/doctor-workflow-service', () => ({
  cancelMedicalOrder: vi.fn(),
  getReportTracking: getReportTrackingMock,
}));

import ReportTrackingView from './ReportTrackingView.vue';

async function flush() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

async function mountView() {
  const root = document.createElement('div');
  document.body.append(root);

  const app = createApp({
    render() {
      return h(ReportTrackingView);
    },
  });

  app.directive('loading', {
    mounted() {},
    updated() {},
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

describe('ReportTrackingView', () => {
  beforeEach(() => {
    mockAccessStore.accessCodes = [M4_PERMISSION_CODES.REPORT_TRACKING_QUERY];
    mockRoute.query = {};
    mockRouter.push.mockReset();
    mockRouter.replace.mockReset();
    getReportTrackingMock.mockReset();
  });

  it('shows case-id-or-pathology-no guidance', async () => {
    const wrapper = await mountView();

    expect(wrapper.root.textContent).toContain('病例 ID / 病理号');
    expect(wrapper.root.textContent).toContain(
      '请输入病例 ID 或病理号查询报告追踪',
    );

    wrapper.unmount();
  });
});
