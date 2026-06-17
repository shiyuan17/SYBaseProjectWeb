import { createApp } from 'vue';

import { describe, expect, it, vi } from 'vitest';

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

vi.mock('#/preferences-branding', () => ({
  BRAND_LOGO_SOURCE: '/jwbl-logo.svg',
  BRAND_NAME: '嘉维病理全流程管理系统',
}));

vi.mock('@vben/preferences', () => ({
  getPreferences: () => preferenceMocks.currentPreferences,
  updatePreferences: preferenceMocks.updatePreferences,
}));

const mockRouterPush = vi.hoisted(() => vi.fn());

vi.mock('vue-router', () => ({
  onBeforeRouteLeave: vi.fn(),
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

function resetPreferenceMocks(
  preferences = structuredClone(preferenceMocks.defaultPreferences),
) {
  preferenceMocks.currentPreferences = preferences;
  preferenceMocks.updatePreferences.mockClear();
}

describe('PathologyDashboardView', () => {
  it('renders the core pathology screen regions and static metrics', () => {
    resetPreferenceMocks();

    const root = document.createElement('div');
    document.body.append(root);
    const app = createApp(PathologyDashboardView);
    app.mount(root);

    try {
      expect(
        root.querySelector('[data-testid="pathology-screen-header"]')
          ?.textContent,
      ).toContain('嘉维病理');
      expect(root.textContent).not.toContain('PATHOLOGY INTELLIGENCE');
      expect(root.textContent).not.toContain('Pathology Intelligence');
      expect(root.textContent).not.toContain('基础数据接口由系统统计中心提供');
      expect(
        root.querySelector('[data-testid="pathology-metric-cards"]')
          ?.textContent,
      ).toContain('全年病例总数(例)');
      expect(
        root.querySelector('[data-testid="pathology-center-stage"]')
          ?.textContent,
      ).toContain('上月工作量');
      expect(
        root.querySelector('[data-testid="pathology-right-table"]')
          ?.textContent,
      ).toContain('统计科目');
      expect(
        root.querySelector('[data-testid="pathology-right-table"]')
          ?.textContent,
      ).toContain('PC');
      expect(
        root.querySelector('[data-testid="pathology-right-table"]')
          ?.textContent,
      ).toContain('特殊染色(项)');
      expect(
        root.querySelector('[data-testid="pathology-top-left-chart"]')
          ?.textContent,
      ).toContain('12月');
      expect(
        root.querySelector('[data-testid="pathology-report-panel"]')
          ?.textContent,
      ).toContain('NGS基因检测');
      expect(
        root.querySelector('[data-testid="pathology-right-rate-panel"]')
          ?.textContent,
      ).toContain('HE细胞学阳性结果与活检病理诊断符合率');
      expect(
        root.querySelector('[data-testid="pathology-ai-ecosystem"]'),
      ).toBeNull();
      expect(root.textContent).not.toContain('镓元方青多模态病理');
    } finally {
      app.unmount();
      root.remove();
    }
  });

  it('returns to the main workspace when clicking exit', async () => {
    resetPreferenceMocks({
      ...structuredClone(preferenceMocks.defaultPreferences),
      app: {
        ...preferenceMocks.defaultPreferences.app,
        layout: 'full-content',
      },
      header: { hidden: true },
      sidebar: { hidden: true },
      tabbar: { enable: false },
    });
    mockRouterPush.mockClear();

    const root = document.createElement('div');
    document.body.append(root);
    const app = createApp(PathologyDashboardView);
    app.mount(root);

    try {
      const exitButton = [...root.querySelectorAll('button')].find(
        (button) => button.textContent?.trim() === '退出',
      );
      expect(exitButton).toBeTruthy();

      exitButton?.click();

      expect(preferenceMocks.updatePreferences).toHaveBeenLastCalledWith(
        expect.objectContaining({
          app: expect.objectContaining({ layout: 'sidebar-nav' }),
          header: { hidden: false },
          sidebar: { hidden: false },
          tabbar: { enable: true },
        }),
      );
      expect(mockRouterPush).toHaveBeenCalledWith({ name: 'Workspace' });
    } finally {
      app.unmount();
      root.remove();
    }
  });

  it('restores the normal shell when leaving from a persisted full-screen state', () => {
    resetPreferenceMocks({
      ...structuredClone(preferenceMocks.defaultPreferences),
      app: {
        ...preferenceMocks.defaultPreferences.app,
        layout: 'full-content',
      },
      header: { hidden: true },
      sidebar: { hidden: true },
      tabbar: { enable: false },
    });

    const root = document.createElement('div');
    document.body.append(root);
    const app = createApp(PathologyDashboardView);
    app.mount(root);

    try {
      app.unmount();

      expect(preferenceMocks.updatePreferences).toHaveBeenLastCalledWith(
        expect.objectContaining({
          app: expect.objectContaining({ layout: 'sidebar-nav' }),
          header: { hidden: false },
          sidebar: { hidden: false },
          tabbar: { enable: true },
        }),
      );
    } finally {
      root.remove();
    }
  });
});
