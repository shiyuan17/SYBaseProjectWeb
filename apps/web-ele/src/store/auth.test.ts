import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from './auth';

const mocks = vi.hoisted(() => {
  const router = {
    currentRoute: {
      value: {
        fullPath: '/login',
        query: {},
      },
    },
    push: vi.fn(),
    replace: vi.fn(),
  };
  const accessStore = {
    loginExpired: false,
    setAccessCodes: vi.fn(),
    setAccessToken: vi.fn(),
    setLoginExpired: vi.fn(),
  };
  const userStore = {
    setUserInfo: vi.fn(),
  };

  return {
    accessStore,
    getAccessCodesApi: vi.fn(),
    getUserInfoApi: vi.fn(),
    loginApi: vi.fn(),
    logoutApi: vi.fn(),
    resetAllStores: vi.fn(),
    router,
    userStore,
  };
});

vi.mock('vue-router', () => ({
  useRouter: () => mocks.router,
}));

vi.mock('@vben/stores', () => ({
  resetAllStores: mocks.resetAllStores,
  useAccessStore: () => mocks.accessStore,
  useUserStore: () => mocks.userStore,
}));

vi.mock('#/api', () => ({
  getAccessCodesApi: mocks.getAccessCodesApi,
  getUserInfoApi: mocks.getUserInfoApi,
  loginApi: mocks.loginApi,
  logoutApi: mocks.logoutApi,
}));

vi.mock('element-plus', () => ({
  ElNotification: vi.fn(),
}));

describe('auth store navigation', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mocks.router.currentRoute.value = {
      fullPath: '/login',
      query: {},
    };
    mocks.router.push.mockReset();
    mocks.router.replace.mockReset();
    mocks.accessStore.loginExpired = false;
    mocks.accessStore.setAccessCodes.mockReset();
    mocks.accessStore.setAccessToken.mockReset();
    mocks.accessStore.setLoginExpired.mockReset();
    mocks.userStore.setUserInfo.mockReset();
    mocks.resetAllStores.mockReset();
    mocks.getAccessCodesApi.mockResolvedValue(['PERM_DASHBOARD_ANALYTICS']);
    mocks.getUserInfoApi.mockResolvedValue({
      avatar: null,
      homePath: '',
      realName: '标本登记员',
      roles: ['M2_CLINICAL_REGISTER'],
      userId: 'USER_M2_REGISTER',
      username: 'm2.register',
    });
    mocks.loginApi.mockResolvedValue({ accessToken: 'token' });
    mocks.logoutApi.mockResolvedValue(undefined);
  });

  it('uses the default home page after login when redirect points to the legacy login path', async () => {
    mocks.router.currentRoute.value.query = {
      redirect: '%252Flogin',
    };

    const authStore = useAuthStore();
    await authStore.authLogin({
      loginName: 'm2.register',
      password: '123456',
    });

    expect(mocks.accessStore.setAccessToken).toHaveBeenCalledWith('token');
    expect(mocks.router.push).toHaveBeenCalledWith('/analytics');
  });

  it('logs out to the canonical login page without a stale redirect', async () => {
    const authStore = useAuthStore();
    await authStore.logout(false);

    expect(mocks.resetAllStores).toHaveBeenCalled();
    expect(mocks.router.replace).toHaveBeenCalledWith({
      path: '/auth/login',
      query: {},
    });
  });
});
