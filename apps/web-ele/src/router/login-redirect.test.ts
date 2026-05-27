import { describe, expect, it } from 'vitest';

import {
  buildLoginRedirectQuery,
  decodeRedirectPath,
  isLoginPath,
  LEGACY_LOGIN_PATH,
  resolvePostLoginRedirect,
} from './login-redirect';

describe('login redirect helpers', () => {
  it('recognizes canonical and legacy login paths', () => {
    expect(isLoginPath('/auth/login')).toBe(true);
    expect(isLoginPath('/auth/login?redirect=%2Fanalytics')).toBe(true);
    expect(isLoginPath(LEGACY_LOGIN_PATH)).toBe(true);
    expect(isLoginPath('/login?redirect=%2Fanalytics')).toBe(true);
    expect(isLoginPath('/analytics')).toBe(false);
  });

  it('decodes redirect values with one or two encoding layers', () => {
    expect(decodeRedirectPath('%2Fanalytics')).toBe('/analytics');
    expect(decodeRedirectPath('%252Flogin')).toBe('/login');
    expect(decodeRedirectPath(['/workspace'])).toBe('/workspace');
    expect(decodeRedirectPath(undefined)).toBe('');
  });

  it('does not build redirect queries for login paths or default home', () => {
    expect(buildLoginRedirectQuery('/login', '/analytics')).toEqual({});
    expect(buildLoginRedirectQuery('/auth/login', '/analytics')).toEqual({});
    expect(buildLoginRedirectQuery('/analytics', '/analytics')).toEqual({});
  });

  it('keeps business page redirect queries', () => {
    expect(buildLoginRedirectQuery('/workspace?tab=today', '/analytics')).toEqual({
      redirect: '%2Fworkspace%3Ftab%3Dtoday',
    });
  });

  it('falls back after login when redirect points to a login page', () => {
    expect(resolvePostLoginRedirect('%252Flogin', '/analytics')).toBe('/analytics');
    expect(resolvePostLoginRedirect('/auth/login', '/analytics')).toBe('/analytics');
    expect(resolvePostLoginRedirect('', '/analytics')).toBe('/analytics');
    expect(resolvePostLoginRedirect('%2Fworkspace', '/analytics')).toBe('/workspace');
  });
});
