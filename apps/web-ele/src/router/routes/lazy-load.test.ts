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

  it('reloads once when a route component dynamic import fetch fails', async () => {
    const reload = vi.fn();
    const loader = withRouteComponentReloadRetry(
      () =>
        Promise.reject(
          new TypeError(
            'Failed to fetch dynamically imported module: http://localhost:5777/src/modules/doctor-workflow/views/DiagnosisWorkbenchView.vue',
          ),
        ),
      'DiagnosisWorkbench',
      { reload },
    );

    await expect(loader()).rejects.toThrow(
      'Failed to fetch dynamically imported module',
    );
    expect(reload).toHaveBeenCalledTimes(1);
    expect(
      sessionStorage.getItem('route-component-reload-retry:DiagnosisWorkbench'),
    ).toBe('1');
  });

  it('does not reload repeatedly for the same route failure', async () => {
    const reload = vi.fn();
    sessionStorage.setItem(
      'route-component-reload-retry:DiagnosisWorkbench',
      '1',
    );
    const loader = withRouteComponentReloadRetry(
      () =>
        Promise.reject(
          new TypeError(
            'Failed to fetch dynamically imported module: http://localhost:5777/src/modules/doctor-workflow/views/DiagnosisWorkbenchView.vue',
          ),
        ),
      'DiagnosisWorkbench',
      { reload },
    );

    await expect(loader()).rejects.toThrow(
      'Failed to fetch dynamically imported module',
    );
    expect(reload).not.toHaveBeenCalled();
  });

  it('does not reload for non import-fetch errors', async () => {
    const reload = vi.fn();
    const loader = withRouteComponentReloadRetry(
      () => Promise.reject(new Error('workbench setup failed')),
      'DiagnosisWorkbench',
      { reload },
    );

    await expect(loader()).rejects.toThrow('workbench setup failed');
    expect(reload).not.toHaveBeenCalled();
  });

  it('wraps glob route component loaders with retry behavior keyed by path', async () => {
    const reload = vi.fn();
    const wrapped = wrapGlobRouteComponentLoaders({
      '../modules/technical-workflow/views/GrossingWorkstationView.vue':
        withRouteComponentReloadRetry(
          () =>
            Promise.reject(
              new TypeError(
                'Failed to fetch dynamically imported module: http://localhost:5777/src/modules/technical-workflow/views/GrossingWorkstationView.vue',
              ),
            ),
          '../modules/technical-workflow/views/GrossingWorkstationView.vue',
          { reload },
        ) as () => Promise<RouteComponent>,
    });

    const grossingLoader =
      wrapped[
        '../modules/technical-workflow/views/GrossingWorkstationView.vue'
      ];
    if (!grossingLoader) {
      throw new Error('Missing grossing route loader');
    }
    await expect(grossingLoader()).rejects.toThrow(
      'Failed to fetch dynamically imported module',
    );
    expect(reload).toHaveBeenCalledTimes(1);
    expect(
      sessionStorage.getItem(
        'route-component-reload-retry:../modules/technical-workflow/views/GrossingWorkstationView.vue',
      ),
    ).toBe('1');
  });
});
