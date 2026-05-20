import { anonymousRequestClient, requestClient } from '#/api/request';

export namespace AuthApi {
  export interface LoginParams {
    loginName: string;
    password: string;
  }

  export interface LoginResult {
    accessToken: string;
    expiresAt: string;
  }

  export interface CurrentUserResult {
    avatar?: null | string;
    homePath?: null | string;
    loginName: string;
    realName: string;
    roles: string[];
    userId: string;
  }
}

export async function loginApi(data: AuthApi.LoginParams) {
  return anonymousRequestClient.post<AuthApi.LoginResult>('/v1/auth/login', data);
}

export async function logoutApi() {
  return requestClient.post('/v1/auth/logout');
}

export async function getCurrentUserApi() {
  return requestClient.get<AuthApi.CurrentUserResult>('/v1/auth/me');
}

export async function getAccessCodesApi() {
  return requestClient.get<string[]>('/v1/auth/access-codes');
}
