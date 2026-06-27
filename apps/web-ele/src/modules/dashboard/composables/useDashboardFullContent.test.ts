import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  applyDashboardFullContent,
  restoreDashboardLayout,
} from './useDashboardFullContent';

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
    updatePreferences: vi.fn((updates) => {
      preferenceMocks.currentPreferences = {
        ...preferenceMocks.currentPreferences,
        app: {
          ...preferenceMocks.currentPreferences.app,
          ...updates.app,
        },
        footer: {
          ...preferenceMocks.currentPreferences.footer,
          ...updates.footer,
        },
        header: {
          ...preferenceMocks.currentPreferences.header,
          ...updates.header,
        },
        sidebar: {
          ...preferenceMocks.currentPreferences.sidebar,
          ...updates.sidebar,
        },
        tabbar: {
          ...preferenceMocks.currentPreferences.tabbar,
          ...updates.tabbar,
        },
      };
    }),
  };
});

vi.mock('@vben/preferences', () => ({
  getPreferences: () => preferenceMocks.currentPreferences,
  updatePreferences: preferenceMocks.updatePreferences,
}));

function resetMocks() {
  preferenceMocks.currentPreferences = structuredClone(
    preferenceMocks.defaultPreferences,
  );
  preferenceMocks.updatePreferences.mockClear();
  restoreDashboardLayout();
}

describe('useDashboardFullContent', () => {
  afterEach(() => {
    resetMocks();
  });

  it('captures the pre-entry layout and applies full-content once', () => {
    applyDashboardFullContent();
    applyDashboardFullContent();

    expect(preferenceMocks.updatePreferences).toHaveBeenCalledTimes(1);
    expect(preferenceMocks.currentPreferences.app.layout).toBe('full-content');
    expect(preferenceMocks.currentPreferences.header.hidden).toBe(true);
    expect(preferenceMocks.currentPreferences.sidebar.hidden).toBe(true);
    expect(preferenceMocks.currentPreferences.tabbar.enable).toBe(false);
  });

  it('restores the captured layout when leaving the dashboard', () => {
    applyDashboardFullContent();
    restoreDashboardLayout();

    expect(preferenceMocks.currentPreferences.app.layout).toBe('sidebar-nav');
    expect(preferenceMocks.currentPreferences.header.hidden).toBe(false);
    expect(preferenceMocks.currentPreferences.sidebar.hidden).toBe(false);
    expect(preferenceMocks.currentPreferences.tabbar.enable).toBe(true);
  });
});
