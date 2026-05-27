import type { Recordable, UserInfo } from '@vben/types';
import type { AuthApi } from '#/api';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { ElNotification } from 'element-plus';
import { defineStore } from 'pinia';

import { getAccessCodesApi, getUserInfoApi, loginApi, logoutApi } from '#/api';
import { $t } from '#/locales';
import {
  buildLoginRedirectQuery,
  resolvePostLoginRedirect,
} from '#/router/login-redirect';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);

  async function redirectToLogin(redirect: boolean = true) {
    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? buildLoginRedirectQuery(
            router.currentRoute.value.fullPath,
            preferences.app.defaultHomePath,
          )
        : {},
    });
  }

  async function logoutLocal(redirect: boolean = true) {
    resetAllStores();
    accessStore.setLoginExpired(false);
    await redirectToLogin(redirect);
  }

  /**
   * 异步处理登录操作
   * Asynchronously handle the login process
   * @param params 登录表单数据
   */
  async function authLogin(
    params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ) {
    // 异步处理用户登录操作并获取 accessToken
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      const { accessToken } = await loginApi(params as AuthApi.LoginParams);

      // 如果成功获取到 accessToken
      if (accessToken) {
        // 将 accessToken 存储到 accessStore 中
        accessStore.setAccessToken(accessToken);

        // 获取用户信息并存储到 accessStore 中
        const [fetchUserInfoResult, accessCodes] = await Promise.all([
          fetchUserInfo(),
          getAccessCodesApi(),
        ]);

        userInfo = {
          ...fetchUserInfoResult,
          token: accessToken,
        };

        userStore.setUserInfo(userInfo);
        accessStore.setAccessCodes(accessCodes);

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        } else {
          if (onSuccess) {
            await onSuccess?.();
          } else {
            await router.push(
              resolvePostLoginRedirect(
                router.currentRoute.value.query.redirect,
                userInfo.homePath || preferences.app.defaultHomePath,
              ),
            );
          }
        }

        if (userInfo?.realName) {
          ElNotification({
            message: `${$t('authentication.loginSuccessDesc')}:${userInfo?.realName}`,
            title: $t('authentication.loginSuccess'),
            type: 'success',
          });
        }
      }
    } finally {
      loginLoading.value = false;
    }

    return {
      userInfo,
    };
  }

  async function logout(
    options: boolean | { invokeLogoutApi?: boolean; redirect?: boolean } = true,
  ) {
    const normalizedOptions =
      typeof options === 'boolean' ? { redirect: options } : options;
    const { invokeLogoutApi = true, redirect = true } = normalizedOptions;

    if (invokeLogoutApi) {
      try {
        await logoutApi();
      } catch {
        // 不做任何处理
      }
    }

    await logoutLocal(redirect);
  }

  async function fetchUserInfo() {
    const userInfo = await getUserInfoApi();
    userStore.setUserInfo(userInfo);
    return userInfo;
  }

  function $reset() {
    loginLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    fetchUserInfo,
    loginLoading,
    logout,
    logoutLocal,
  };
});
