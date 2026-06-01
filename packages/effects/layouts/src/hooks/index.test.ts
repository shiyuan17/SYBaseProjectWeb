import type { RouteLocationNormalizedLoaded } from 'vue-router';

import { beforeEach, describe, expect, it, vi } from 'vitest';

interface HookTestOptions {
  keepAlive?: boolean;
  tabbarEnabled?: boolean;
  transitionEnabled?: boolean;
  transitionName?: string;
}

function createRoute(loaded: boolean): RouteLocationNormalizedLoaded {
  return {
    fullPath: '/specimen-workflow/submission-registration',
    hash: '',
    href: '/specimen-workflow/submission-registration',
    matched: [],
    meta: {
      loaded,
    },
    name: 'SubmissionRegistration',
    params: {},
    path: '/specimen-workflow/submission-registration',
    query: {},
    redirectedFrom: undefined,
  } as RouteLocationNormalizedLoaded;
}

async function loadLayoutHook(options: HookTestOptions = {}) {
  vi.resetModules();

  const preferences = {
    tabbar: {
      enable: options.tabbarEnabled ?? true,
      keepAlive: options.keepAlive ?? true,
    },
    transition: {
      enable: options.transitionEnabled ?? true,
      name: options.transitionName ?? 'fade-slide',
    },
  };

  vi.doMock('@vben/preferences', async () => {
    const { computed } = await import('vue');

    return {
      preferences,
      usePreferences: () => ({
        keepAlive: computed(
          () => preferences.tabbar.enable && preferences.tabbar.keepAlive,
        ),
      }),
    };
  });

  const { useLayoutHook } = await import('./index');

  return { useLayoutHook };
}

describe('useLayoutHook', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('returns the global transition name for first-time routes', async () => {
    const { useLayoutHook } = await loadLayoutHook();
    const { getTransitionName } = useLayoutHook();

    expect(getTransitionName(createRoute(false))).toBe('fade-slide');
  });

  it('skips animation for already loaded routes when tabbar and keepAlive are enabled', async () => {
    const { useLayoutHook } = await loadLayoutHook();
    const { getTransitionName } = useLayoutHook();

    expect(getTransitionName(createRoute(true))).toBeUndefined();
  });

  it('keeps the global transition when keepAlive is disabled', async () => {
    const { useLayoutHook } = await loadLayoutHook({ keepAlive: false });
    const { getTransitionName } = useLayoutHook();

    expect(getTransitionName(createRoute(true))).toBe('fade-slide');
  });

  it('keeps the global transition when tabbar is disabled', async () => {
    const { useLayoutHook } = await loadLayoutHook({ tabbarEnabled: false });
    const { getTransitionName } = useLayoutHook();

    expect(getTransitionName(createRoute(true))).toBe('fade-slide');
  });
});
