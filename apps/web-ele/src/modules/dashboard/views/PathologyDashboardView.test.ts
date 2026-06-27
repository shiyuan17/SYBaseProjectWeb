import type { PathologyScreenDashboardResponse } from '../types/pathology-screen';

import { createApp, defineComponent, h, nextTick } from 'vue';

import { describe, expect, it, vi } from 'vitest';

import { writePathologyDashboardSnapshot } from '../utils/pathology-dashboard-cache';
import PathologyDashboardView from './PathologyDashboardView.vue';

const preferenceMocks = vi.hoisted(() => {
  const defaultPreferences = {
    app: {
      contentCompact: 'wide',
      contentPadding: 0,
      contentPaddingBottom: 0,
      contentPaddingLeft: 0,
      contentPaddingRight: 0,
      contentPaddingTop: 0,
      layout: 'sidebar-nav',
    },
    footer: { enable: false },
    header: { hidden: false },
    sidebar: { hidden: false },
    tabbar: { enable: true },
  };

  return {
    currentPreferences: structuredClone(defaultPreferences),
    defaultPreferences,
    updatePreferences: vi.fn(),
  };
});

const mockRouterPush = vi.hoisted(() => vi.fn());
const mockQueryPathologyScreenDashboard = vi.hoisted(() => vi.fn());
const mockUserStore = vi.hoisted(() => ({
  userInfo: {
    realName: '张医生',
    userId: 'USER-001',
    username: 'zhangsan',
  },
}));

vi.mock('#/preferences-branding', () => ({
  BRAND_LOGO_SOURCE: '/jwbl-logo.svg',
  BRAND_NAME: '嘉维病理全流程管理系统',
}));

vi.mock('@vben/preferences', () => ({
  getPreferences: () => preferenceMocks.currentPreferences,
  updatePreferences: preferenceMocks.updatePreferences,
}));

vi.mock('@vben/common-ui', () => ({
  Fallback: defineComponent({
    props: ['status'],
    setup(props) {
      return () => h('div', `fallback-${props.status}`);
    },
  }),
}));

vi.mock('@vben/stores', () => ({
  useUserStore: () => mockUserStore,
}));

vi.mock('vue-router', () => ({
  onBeforeRouteLeave: vi.fn(),
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

vi.mock('../api/pathology-screen-service', () => ({
  queryPathologyScreenDashboard: mockQueryPathologyScreenDashboard,
}));

function resetPreferenceMocks(
  preferences = structuredClone(preferenceMocks.defaultPreferences),
) {
  preferenceMocks.currentPreferences = preferences;
  preferenceMocks.updatePreferences.mockClear();
  sessionStorage.clear();
  mockUserStore.userInfo = {
    realName: '张医生',
    userId: 'USER-001',
    username: 'zhangsan',
  };
}

async function flushView() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

function buildDashboardResponse(
  overrides: Partial<PathologyScreenDashboardResponse> = {},
): PathologyScreenDashboardResponse {
  return {
    summaryCards: {
      annualCaseTotal: {
        label: '全年病例总数（例）',
        sourceNote: 'annual',
        status: 'AVAILABLE',
        value: '128',
      },
      lastMonthCaseTotal: {
        label: '上月病例总数（例）',
        sourceNote: 'last month',
        status: 'AVAILABLE',
        value: '16',
      },
      lastMonthReportTimelinessRate: {
        label: '上月报告及时率',
        sourceNote: 'timely',
        status: 'AVAILABLE',
        value: '98.00%',
      },
    },
    reportRevisionRateTrend: {
      items: [
        {
          label: '2026-01',
          sourceNote: 'revision',
          status: 'AVAILABLE',
          value: '0.00%',
        },
        {
          label: '2026-02',
          sourceNote: 'revision',
          status: 'AVAILABLE',
          value: '2.00%',
        },
      ],
      sourceNote: 'revision trend',
      status: 'AVAILABLE',
    },
    technicalQualificationRates: {
      items: [
        {
          label: '规范化固定率',
          sourceNote: 'fixation',
          status: 'AVAILABLE',
          value: '97.00%',
        },
        {
          label: 'HE染色切片优良率',
          sourceNote: 'he',
          status: 'PARTIAL',
          value: '100.00%',
        },
      ],
      sourceNote: 'technical',
      status: 'PARTIAL',
    },
    diagnosisWorkloadRows: {
      items: [
        {
          februaryCount: '8',
          januaryCount: '4',
          label: '特殊染色',
          momRate: '100.00%',
          sourceNote: 'workload',
          status: 'AVAILABLE',
        },
        {
          februaryCount: '0',
          januaryCount: '0',
          label: '细胞学',
          momRate: '-',
          sourceNote: 'workload',
          status: 'PARTIAL',
        },
      ],
      sourceNote: 'diagnosis workload',
      status: 'AVAILABLE',
    },
    structuredReportSummary: {
      reportCount: {
        label: '结构化报告工作量（例）',
        sourceNote: 'structured count',
        status: 'AVAILABLE',
        value: '32',
      },
      sourceNote: 'structured',
      status: 'AVAILABLE',
      templateTypeCount: {
        label: '结构化报告类型（种）',
        sourceNote: 'structured types',
        status: 'AVAILABLE',
        value: '4',
      },
      topTemplates: [
        {
          label: '肺癌病理结构化V2',
          sourceNote: 'template',
          status: 'AVAILABLE',
          value: '18',
        },
      ],
    },
    lastMonthWorkload: {
      items: [
        {
          label: '切片',
          sourceNote: 'slicing',
          status: 'AVAILABLE',
          value: '42',
        },
        {
          label: '脱水',
          sourceNote: 'dehydration',
          status: 'AVAILABLE',
          value: '35',
        },
        {
          label: '包埋',
          sourceNote: 'embedding',
          status: 'AVAILABLE',
          value: '33',
        },
        {
          label: '报告',
          sourceNote: 'report',
          status: 'AVAILABLE',
          value: '28',
        },
      ],
      sourceNote: 'last month workload',
      status: 'AVAILABLE',
    },
    threeYearTechnicalRates: {
      items: [
        {
          metrics: [
            {
              label: '规范化固定率',
              sourceNote: 'fixation',
              status: 'AVAILABLE',
              value: '96.00%',
            },
            {
              label: 'HE染色切片优良率',
              sourceNote: 'he',
              status: 'AVAILABLE',
              value: '97.00%',
            },
            {
              label: '免疫组化',
              sourceNote: 'ihc',
              status: 'AVAILABLE',
              value: '95.00%',
            },
          ],
          year: '2026年',
        },
      ],
      sourceNote: 'three year technical',
      status: 'AVAILABLE',
    },
    threeYearReportQualityRates: {
      items: [
        {
          metrics: [
            {
              label: '病理诊断及时率',
              sourceNote: 'pathology',
              status: 'AVAILABLE',
              value: '99.00%',
            },
            {
              label: '组织病理诊断及时率',
              sourceNote: 'routine',
              status: 'AVAILABLE',
              value: '97.00%',
            },
            {
              label: '冰冻快速病理诊断及时率',
              sourceNote: 'frozen',
              status: 'AVAILABLE',
              value: '96.00%',
            },
          ],
          year: '2026年',
        },
      ],
      sourceNote: 'three year quality',
      status: 'AVAILABLE',
    },
    overallComplianceRates: {
      items: [
        {
          label: '危急值上报及时率',
          sourceNote: 'critical',
          status: 'AVAILABLE',
          value: '91.00%',
        },
        {
          label: 'HE细胞学阳性结果与活检病理诊断符合率',
          sourceNote: 'cytology compare',
          status: 'AVAILABLE',
          value: '88.00%',
        },
      ],
      sourceNote: 'overall',
      status: 'PARTIAL',
    },
    ...overrides,
  } satisfies PathologyScreenDashboardResponse;
}

describe('PathologyDashboardView', () => {
  it('renders the dashboard from API data and removes the staff section', async () => {
    resetPreferenceMocks();
    mockQueryPathologyScreenDashboard.mockResolvedValue(
      buildDashboardResponse(),
    );

    const root = document.createElement('div');
    document.body.append(root);
    const app = createApp(PathologyDashboardView);
    app.mount(root);
    await flushView();

    try {
      expect(
        root.querySelector('[data-testid="pathology-screen-header"]')
          ?.textContent,
      ).toContain('嘉维病理');
      expect(
        root.querySelector('[data-testid="pathology-metric-cards"]')
          ?.textContent,
      ).toContain('全年病例总数（例）');
      expect(
        root.querySelector('[data-testid="pathology-top-left-chart"]')
          ?.textContent,
      ).toContain('2026-01');
      expect(
        root.querySelector('[data-testid="pathology-center-stage"]')
          ?.textContent,
      ).toContain('切片');
      expect(
        root.querySelector('[data-testid="pathology-center-stage"]')
          ?.textContent,
      ).toContain('脱水');
      expect(
        root.querySelector('[data-testid="pathology-right-table"]')
          ?.textContent,
      ).toContain('特殊染色');
      expect(
        root.querySelector('[data-testid="pathology-right-rate-panel"]')
          ?.textContent,
      ).toContain('危急值上报及时率');
      expect(
        root.querySelector('[data-testid="pathology-report-panel"]')
          ?.textContent,
      ).toContain('肺癌病理结构化V2');
      expect(root.textContent).not.toContain('病理工作人员统计情况');
      expect(
        root.querySelector('[data-testid="pathology-partial-banner"]'),
      ).toBeTruthy();
    } finally {
      app.unmount();
      root.remove();
    }
  });

  it('renders a loading state before the dashboard query resolves', async () => {
    resetPreferenceMocks();
    mockQueryPathologyScreenDashboard.mockImplementation(
      () =>
        new Promise(() => {
          // keep pending
        }),
    );

    const root = document.createElement('div');
    document.body.append(root);
    const app = createApp(PathologyDashboardView);
    app.mount(root);
    await nextTick();

    try {
      expect(
        root.querySelector('[data-testid="pathology-loading"]'),
      ).toBeTruthy();
      expect(root.textContent).toContain('病理大屏数据加载中');
    } finally {
      app.unmount();
      root.remove();
    }
  });

  it('renders cached dashboard content immediately while a background refresh is still pending', async () => {
    resetPreferenceMocks();
    writePathologyDashboardSnapshot('USER-001', buildDashboardResponse());
    mockQueryPathologyScreenDashboard.mockImplementation(
      () =>
        new Promise(() => {
          // keep pending
        }),
    );

    const root = document.createElement('div');
    document.body.append(root);
    const app = createApp(PathologyDashboardView);
    app.mount(root);

    try {
      expect(
        root.querySelector('[data-testid="pathology-loading"]'),
      ).toBeNull();
      expect(
        root.querySelector('[data-testid="pathology-screen-header"]')
          ?.textContent,
      ).toContain('嘉维病理');
      expect(
        root.querySelector('[data-testid="pathology-metric-cards"]')
          ?.textContent,
      ).toContain('全年病例总数（例）');
    } finally {
      app.unmount();
      root.remove();
    }
  });

  it('keeps cached dashboard content visible and shows a refresh warning when the background refresh fails', async () => {
    resetPreferenceMocks();
    writePathologyDashboardSnapshot('USER-001', buildDashboardResponse());
    mockQueryPathologyScreenDashboard.mockRejectedValue(new Error('刷新失败'));

    const root = document.createElement('div');
    document.body.append(root);
    const app = createApp(PathologyDashboardView);
    app.mount(root);
    await flushView();

    try {
      expect(
        root.querySelector('[data-testid="pathology-screen-header"]')
          ?.textContent,
      ).toContain('嘉维病理');
      expect(root.textContent).toContain('刷新失败');
      expect(root.textContent).toContain('最近一次结果');
      expect(
        root.querySelector('[data-testid="pathology-metric-cards"]')
          ?.textContent,
      ).toContain('全年病例总数（例）');
    } finally {
      app.unmount();
      root.remove();
    }
  });

  it('renders a 403 fallback when the dashboard query is forbidden', async () => {
    resetPreferenceMocks();
    mockQueryPathologyScreenDashboard.mockRejectedValue({
      response: {
        status: 403,
      },
    });

    const root = document.createElement('div');
    document.body.append(root);
    const app = createApp(PathologyDashboardView);
    app.mount(root);
    await flushView();

    try {
      expect(root.textContent).toContain('fallback-403');
    } finally {
      app.unmount();
      root.remove();
    }
  });

  it('enters the specimen collection home when clicking the home button', async () => {
    resetPreferenceMocks();
    mockRouterPush.mockClear();
    mockQueryPathologyScreenDashboard.mockResolvedValue(
      buildDashboardResponse(),
    );

    const root = document.createElement('div');
    document.body.append(root);
    const app = createApp(PathologyDashboardView);
    app.mount(root);
    await flushView();

    try {
      const exitButton = [...root.querySelectorAll('button')].find(
        (button) => button.textContent?.trim() === '首页',
      );
      expect(exitButton).toBeTruthy();
      expect(exitButton?.getAttribute('aria-label')).toBe('进入标本采集首页');

      exitButton?.click();

      expect(mockRouterPush).toHaveBeenCalledWith({
        name: 'ApplicationRegistrationWorkbench',
      });
      expect(preferenceMocks.updatePreferences).not.toHaveBeenCalled();
    } finally {
      app.unmount();
      root.remove();
    }
  });
});
