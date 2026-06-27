import type { RouteComponent } from 'vue-router';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  withRouteComponentReloadRetry,
  wrapGlobRouteComponentLoaders,
} from './lazy-load';

describe('withRouteComponentReloadRetry', () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it('returns the component without reloading when the dynamic import retry succeeds', async () => {
    const reload = vi.fn();
    const component = {} as RouteComponent;
    const importError = new TypeError(
      'Failed to fetch dynamically imported module: http://localhost:5777/src/modules/doctor-workflow/views/DiagnosisWorkbenchView.vue',
    );
    const routeLoader = vi
      .fn<() => Promise<RouteComponent>>()
      .mockRejectedValueOnce(importError)
      .mockResolvedValueOnce(component);
    const loader = withRouteComponentReloadRetry(
      routeLoader,
      'DiagnosisWorkbench',
      { reload, shouldReload: () => true },
    );

    await expect(loader()).resolves.toBe(component);
    expect(routeLoader).toHaveBeenCalledTimes(2);
    expect(reload).not.toHaveBeenCalled();
    expect(
      sessionStorage.getItem('route-component-reload-retry:DiagnosisWorkbench'),
    ).toBeNull();
  });

  it('reloads once in production when the dynamic import retry still fails', async () => {
    const reload = vi.fn();
    const importError = new TypeError(
      'Failed to fetch dynamically imported module: http://localhost:5777/src/modules/doctor-workflow/views/DiagnosisWorkbenchView.vue',
    );
    const retryError = new TypeError(
      'Failed to fetch dynamically imported module: http://localhost:5777/src/modules/doctor-workflow/views/DiagnosisWorkbenchView.vue?t=2',
    );
    const routeLoader = vi
      .fn<() => Promise<RouteComponent>>()
      .mockRejectedValueOnce(importError)
      .mockRejectedValueOnce(retryError);
    const loader = withRouteComponentReloadRetry(
      routeLoader,
      'DiagnosisWorkbench',
      { reload, shouldReload: () => true },
    );

    await expect(loader()).rejects.toBe(importError);
    expect(routeLoader).toHaveBeenCalledTimes(2);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(
      sessionStorage.getItem('route-component-reload-retry:DiagnosisWorkbench'),
    ).toBe('1');
  });

  it('throws without reloading in development when the dynamic import retry still fails', async () => {
    const reload = vi.fn();
    const importError = new TypeError(
      'Failed to fetch dynamically imported module: http://localhost:5777/src/modules/doctor-workflow/views/DiagnosisWorkbenchView.vue',
    );
    const routeLoader = vi
      .fn<() => Promise<RouteComponent>>()
      .mockRejectedValue(importError);
    const loader = withRouteComponentReloadRetry(
      routeLoader,
      'DiagnosisWorkbench',
      { reload, shouldReload: () => false },
    );

    await expect(loader()).rejects.toBe(importError);
    expect(routeLoader).toHaveBeenCalledTimes(2);
    expect(reload).not.toHaveBeenCalled();
    expect(
      sessionStorage.getItem('route-component-reload-retry:DiagnosisWorkbench'),
    ).toBeNull();
  });

  it('does not reload repeatedly for the same route failure', async () => {
    const reload = vi.fn();
    sessionStorage.setItem(
      'route-component-reload-retry:DiagnosisWorkbench',
      '1',
    );
    const importError = new TypeError(
      'Failed to fetch dynamically imported module: http://localhost:5777/src/modules/doctor-workflow/views/DiagnosisWorkbenchView.vue',
    );
    const routeLoader = vi
      .fn<() => Promise<RouteComponent>>()
      .mockRejectedValue(importError);
    const loader = withRouteComponentReloadRetry(
      routeLoader,
      'DiagnosisWorkbench',
      { reload, shouldReload: () => true },
    );

    await expect(loader()).rejects.toBe(importError);
    expect(routeLoader).toHaveBeenCalledTimes(2);
    expect(reload).not.toHaveBeenCalled();
  });

  it('does not retry or reload for non import-fetch errors', async () => {
    const reload = vi.fn();
    const routeLoader = vi
      .fn<() => Promise<RouteComponent>>()
      .mockRejectedValue(new Error('workbench setup failed'));
    const loader = withRouteComponentReloadRetry(
      routeLoader,
      'DiagnosisWorkbench',
      { reload, shouldReload: () => true },
    );

    await expect(loader()).rejects.toThrow('workbench setup failed');
    expect(routeLoader).toHaveBeenCalledTimes(1);
    expect(reload).not.toHaveBeenCalled();
  });

  it('wraps glob route component loaders with retry behavior keyed by path', async () => {
    const component = {} as RouteComponent;
    const routeLoader = vi
      .fn<() => Promise<RouteComponent>>()
      .mockRejectedValueOnce(
        new TypeError(
          'Failed to fetch dynamically imported module: http://localhost:5777/src/modules/technical-workflow/views/GrossingWorkstationView.vue',
        ),
      )
      .mockResolvedValueOnce(component);
    const wrapped = wrapGlobRouteComponentLoaders({
      '../modules/technical-workflow/views/GrossingWorkstationView.vue':
        routeLoader,
    });

    const grossingLoader =
      wrapped[
        '../modules/technical-workflow/views/GrossingWorkstationView.vue'
      ];
    if (!grossingLoader) {
      throw new Error('Missing grossing route loader');
    }
    await expect(grossingLoader()).resolves.toBe(component);
    expect(routeLoader).toHaveBeenCalledTimes(2);
    expect(
      sessionStorage.getItem(
        'route-component-reload-retry:../modules/technical-workflow/views/GrossingWorkstationView.vue',
      ),
    ).toBeNull();
  });
});
