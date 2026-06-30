import type { APIRequestContext } from 'playwright/test';

import { describe, expect, it } from 'vitest';

import {
  buildApiStorageState,
  requestAccessToken,
  solveSliderCaptcha,
} from '../tests/e2e/helpers/auth';
import {
  e2eEnv,
  getAccessStoreStorageKey,
  getRoleConfig,
  getWebAppStorageNamespace,
  normalizeStorageStateOrigins,
} from '../tests/e2e/helpers/env';

describe('e2e auth storage helpers', () => {
  it('builds storage state with the persisted access store key', () => {
    const accessToken = 'token-123';
    const storageState = buildApiStorageState(
      'http://localhost:5777',
      accessToken,
    );

    expect(storageState.cookies).toEqual([]);
    expect(storageState.origins).toHaveLength(1);
    expect(storageState.origins[0]?.origin).toBe('http://localhost:5777');
    expect(storageState.origins[0]?.localStorage).toEqual([
      {
        name: getAccessStoreStorageKey(),
        value: JSON.stringify({
          accessToken,
          refreshToken: null,
          accessCodes: [],
          isLockScreen: false,
        }),
      },
    ]);
  });

  it('defaults the local web app target to the web-ele dev port', () => {
    expect(e2eEnv.baseURL).toBe('http://localhost:5778');
  });

  it('includes admin and m6 roles for authenticated page smoke checks', () => {
    expect(getRoleConfig('admin')).toMatchObject({
      storageFile: 'admin.json',
      username: 'm1.admin',
    });
    expect(getRoleConfig('m6')).toMatchObject({
      storageFile: 'm6.json',
      username: 'm6.admin',
    });
  });

  it('builds the web app namespace used by persisted stores', () => {
    expect(getWebAppStorageNamespace()).toMatch(
      /嘉维病理全流程管理系统-web-ele-\d+\.\d+\.\d+-dev/u,
    );
    expect(getAccessStoreStorageKey()).toBe(
      `${getWebAppStorageNamespace()}-core-access`,
    );
  });

  it('normalizes storage-state origins to the current target origin', () => {
    const storageState = {
      cookies: [],
      origins: [
        {
          origin: 'http://localhost:5777',
          localStorage: [{ name: 'foo', value: 'bar' }],
        },
      ],
    };

    const normalized = normalizeStorageStateOrigins(
      storageState,
      'http://localhost:5778',
    );

    expect(normalized).not.toBe(storageState);
    expect(normalized.origins?.[0]?.origin).toBe('http://localhost:5778');
    expect(normalized.origins?.[0]?.localStorage).toEqual([
      { name: 'foo', value: 'bar' },
    ]);
  });

  it('returns an access token from a success payload', async () => {
    const authClient = {
      post: async () => ({
        json: async () => ({
          code: 'SUCCESS',
          data: {
            accessToken: 'token-abc',
          },
        }),
        ok: () => true,
        status: () => 200,
      }),
    } as unknown as APIRequestContext;

    await expect(requestAccessToken(authClient, 'register')).resolves.toBe(
      'token-abc',
    );
  });

  it('throws when the login payload does not include an access token', async () => {
    const authClient = {
      post: async () => ({
        json: async () => ({
          code: 'SUCCESS',
          data: {},
        }),
        ok: () => true,
        status: () => 200,
      }),
    } as unknown as APIRequestContext;

    await expect(requestAccessToken(authClient, 'register')).rejects.toThrow(
      /未返回 accessToken/u,
    );
  });

  it('throws when auth-center returns a failure response', async () => {
    const authClient = {
      post: async () => ({
        json: async () => ({
          code: 'UNAUTHORIZED',
          message: 'bad credentials',
        }),
        ok: () => true,
        status: () => 200,
      }),
    } as unknown as APIRequestContext;

    await expect(requestAccessToken(authClient, 'register')).rejects.toThrow(
      /UNAUTHORIZED/u,
    );
  });

  it('throws a wrapped error when the auth request is unreachable', async () => {
    const authClient = {
      post: async () => {
        throw new Error('connect ECONNREFUSED');
      },
    } as unknown as APIRequestContext;

    await expect(requestAccessToken(authClient, 'register')).rejects.toThrow(
      /auth-center 可用/u,
    );
  });

  it('keeps the UI captcha solver exported for login-page smoke coverage', () => {
    expect(typeof solveSliderCaptcha).toBe('function');
  });
});
