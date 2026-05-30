import { LOGIN_PATH } from '@vben/constants';

import { describe, expect, it } from 'vitest';

import { LEGACY_LOGIN_PATH } from '#/router/login-redirect';

import { coreRoutes } from './core';

describe('core routes', () => {
  it('registers a hidden legacy login redirect', () => {
    const legacyLoginRoute = coreRoutes.find(
      (route) => route.name === 'LegacyLogin',
    );

    expect(legacyLoginRoute?.path).toBe(LEGACY_LOGIN_PATH);
    expect(legacyLoginRoute?.redirect).toBe(LOGIN_PATH);
    expect(legacyLoginRoute?.meta?.hideInBreadcrumb).toBe(true);
    expect(legacyLoginRoute?.meta?.hideInMenu).toBe(true);
    expect(legacyLoginRoute?.meta?.hideInTab).toBe(true);
  });
});
