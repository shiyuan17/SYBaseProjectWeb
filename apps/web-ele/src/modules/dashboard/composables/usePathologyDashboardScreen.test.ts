import type { PathologyScreenDashboardResponse } from '../types/pathology-screen';

import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockQueryPathologyScreenDashboard, mockUserStore } = vi.hoisted(() => ({
  mockQueryPathologyScreenDashboard: vi.fn(),
  mockUserStore: {
    userInfo: {
      realName: '张医生',
      userId: 'USER-001',
      username: 'zhangsan',
    },
  },
}));

vi.mock('@vben/stores', () => ({
  useUserStore: () => mockUserStore,
}));

vi.mock('../api/pathology-screen-service', () => ({
  queryPathologyScreenDashboard: mockQueryPathologyScreenDashboard,
}));

import { writePathologyDashboardSnapshot } from '../utils/pathology-dashboard-cache';
import { usePathologyDashboardScreen } from './usePathologyDashboardScreen';

function createDashboardResponse(
  overrides: Partial<PathologyScreenDashboardResponse> = {},
): PathologyScreenDashboardResponse {
  return {
    diagnosisWorkloadRows: {
      items: [],
      sourceNote: null,
      status: 'AVAILABLE',
    },
    lastMonthWorkload: {
      items: [
        {
          label: '切片',
          sourceNote: null,
          status: 'AVAILABLE',
          value: '42',
        },
      ],
      sourceNote: null,
      status: 'AVAILABLE',
    },
    overallComplianceRates: {
      items: [],
      sourceNote: null,
      status: 'AVAILABLE',
    },
    reportRevisionRateTrend: {
      items: [],
      sourceNote: null,
      status: 'AVAILABLE',
    },
    structuredReportSummary: {
      reportCount: {
        label: '结构化报告工作量（例）',
        sourceNote: null,
        status: 'AVAILABLE',
        value: '32',
      },
      sourceNote: null,
      status: 'AVAILABLE',
      templateTypeCount: {
        label: '结构化报告类型（种）',
        sourceNote: null,
        status: 'AVAILABLE',
        value: '4',
      },
      topTemplates: [],
    },
    summaryCards: {
      annualCaseTotal: {
        label: '全年病例总数（例）',
        sourceNote: null,
        status: 'AVAILABLE',
        value: '128',
      },
      lastMonthCaseTotal: {
        label: '上月病例总数（例）',
        sourceNote: null,
        status: 'AVAILABLE',
        value: '16',
      },
      lastMonthReportTimelinessRate: {
        label: '上月报告及时率',
        sourceNote: null,
        status: 'AVAILABLE',
        value: '98.00%',
      },
    },
    technicalQualificationRates: {
      items: [],
      sourceNote: null,
      status: 'AVAILABLE',
    },
    threeYearReportQualityRates: {
      items: [],
      sourceNote: null,
      status: 'AVAILABLE',
    },
    threeYearTechnicalRates: {
      items: [],
      sourceNote: null,
      status: 'AVAILABLE',
    },
    ...overrides,
  };
}

function createHarness() {
  let state: null | ReturnType<typeof usePathologyDashboardScreen> = null;

  const Harness = defineComponent({
    setup() {
      state = usePathologyDashboardScreen();
      return () => h('div');
    },
  });

  return {
    Harness,
    getState: () => state,
  };
}

async function flush() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

describe('usePathologyDashboardScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    mockUserStore.userInfo = {
      realName: '张医生',
      userId: 'USER-001',
      username: 'zhangsan',
    };
  });

  afterEach(() => {
    mockQueryPathologyScreenDashboard.mockReset();
    sessionStorage.clear();
    document.body.innerHTML = '';
  });

  it('shows an initial blocking loading state without cache and persists fresh data after success', async () => {
    const response = createDashboardResponse();
    mockQueryPathologyScreenDashboard.mockResolvedValue(response);

    const { Harness, getState } = createHarness();
    const root = document.createElement('div');
    document.body.append(root);
    const app = createApp(Harness);

    app.mount(root);

    const state = getState();
    expect(state?.initialLoading.value).toBe(true);
    expect(state?.loadState.value).toBe('loading');
    expect(state?.hasCachedSnapshot.value).toBe(false);

    await flush();

    expect(state?.initialLoading.value).toBe(false);
    expect(state?.loadState.value).toBe('ready');
    expect(state?.dashboard.value?.summaryCards.annualCaseTotal.value).toBe(
      '128',
    );
    expect(state?.hasCachedSnapshot.value).toBe(true);
    expect(state?.refreshing.value).toBe(false);
    expect(state?.refreshError.value).toBe('');

    const cached = sessionStorage.getItem(
      'pathology-dashboard-screen-user:USER-001',
    );
    expect(cached).toContain('全年病例总数（例）');

    app.unmount();
    root.remove();
  });

  it('hydrates from cached data immediately and refreshes in the background', async () => {
    writePathologyDashboardSnapshot('USER-001', createDashboardResponse());
    mockQueryPathologyScreenDashboard.mockImplementation(
      () =>
        new Promise(() => {
          // keep pending
        }),
    );

    const { Harness, getState } = createHarness();
    const root = document.createElement('div');
    document.body.append(root);
    const app = createApp(Harness);

    app.mount(root);
    await nextTick();

    const state = getState();
    expect(state?.loadState.value).toBe('ready');
    expect(state?.initialLoading.value).toBe(false);
    expect(state?.refreshing.value).toBe(true);
    expect(state?.hasCachedSnapshot.value).toBe(true);
    expect(state?.dashboard.value?.summaryCards.annualCaseTotal.value).toBe(
      '128',
    );

    app.unmount();
    root.remove();
  });

  it('keeps cached data visible and exposes a non-blocking refresh error when the refresh fails', async () => {
    writePathologyDashboardSnapshot('USER-001', createDashboardResponse());
    mockQueryPathologyScreenDashboard.mockRejectedValue(new Error('刷新失败'));

    const { Harness, getState } = createHarness();
    const root = document.createElement('div');
    document.body.append(root);
    const app = createApp(Harness);

    app.mount(root);
    await flush();

    const state = getState();
    expect(state?.loadState.value).toBe('ready');
    expect(state?.dashboard.value?.summaryCards.annualCaseTotal.value).toBe(
      '128',
    );
    expect(state?.refreshError.value).toBe('刷新失败');
    expect(state?.refreshing.value).toBe(false);

    app.unmount();
    root.remove();
  });

  it('keeps the hard 403 fallback when there is no cache', async () => {
    mockQueryPathologyScreenDashboard.mockRejectedValue({
      response: { status: 403 },
    });

    const { Harness, getState } = createHarness();
    const root = document.createElement('div');
    document.body.append(root);
    const app = createApp(Harness);

    app.mount(root);
    await flush();

    const state = getState();
    expect(state?.forbidden.value).toBe(true);
    expect(state?.loadState.value).toBe('forbidden');
    expect(state?.dashboard.value).toBeNull();

    app.unmount();
    root.remove();
  });
});
