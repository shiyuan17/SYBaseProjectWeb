import { expect, request, test } from 'playwright/test';

import { e2eEnv, getRoleConfig } from '../helpers/env';

async function safeGet(
  label: string,
  action: () => Promise<{ ok(): boolean }>,
  failureMessage: string,
) {
  try {
    const response = await action();
    expect(response.ok(), failureMessage).toBeTruthy();
    return response;
  } catch (error) {
    throw new Error(`${label} 失败: ${failureMessage}\n原始错误: ${String(error)}`);
  }
}

test('preflight: local m2 linked services are reachable', async () => {
  const webClient = await request.newContext({
    baseURL: e2eEnv.baseURL,
  });
  const authClient = await request.newContext({
    baseURL: e2eEnv.authBaseURL,
  });

  try {
    await safeGet(
      '前端登录页探活',
      () => webClient.get('/auth/login'),
      `前端登录页不可达，请先启动 web-ele。当前地址: ${e2eEnv.baseURL}/auth/login`,
    );

    let authResponse;
    try {
      authResponse = await authClient.post('/api/v1/auth/login', {
        data: {
          loginName: getRoleConfig('register').username,
          password: e2eEnv.password,
        },
      });
    } catch (error) {
      throw new Error(
        `auth-center 登录接口不可用，请确认服务已启动。当前地址: ${e2eEnv.authBaseURL}/api/v1/auth/login\n原始错误: ${String(error)}`,
      );
    }
    expect(
      authResponse.ok(),
      `auth-center 登录接口不可用，请确认服务已启动。当前地址: ${e2eEnv.authBaseURL}/api/v1/auth/login`,
    ).toBeTruthy();

    const authPayload = await authResponse.json();
    expect(
      authPayload?.code,
      'auth-center 登录接口返回格式异常，未拿到 SUCCESS 响应码。',
    ).toBe('SUCCESS');

    const accessToken = authPayload?.data?.accessToken;
    expect(
      typeof accessToken === 'string' && accessToken.length > 0,
      'auth-center 登录成功但未返回 accessToken，无法继续本地联调 E2E。',
    ).toBeTruthy();

    let receiptToken = accessToken;
    try {
      const receiveAuthResponse = await authClient.post('/api/v1/auth/login', {
        data: {
          loginName: getRoleConfig('receive').username,
          password: e2eEnv.password,
        },
      });
      expect(receiveAuthResponse.ok(), '接收岗账号登录失败，无法校验病理接收待办接口。').toBeTruthy();
      const receiveAuthPayload = await receiveAuthResponse.json();
      expect(receiveAuthPayload?.code, '接收岗登录返回格式异常。').toBe('SUCCESS');
      receiptToken = receiveAuthPayload?.data?.accessToken;
    } catch (error) {
      throw new Error(`接收岗账号登录失败，无法校验 bl-center。原始错误: ${String(error)}`);
    }

    const blClient = await request.newContext({
      baseURL: e2eEnv.blBaseURL,
      extraHTTPHeaders: {
        Authorization: `Bearer ${receiptToken}`,
      },
    });

    try {
      const blResponse = await safeGet(
        'bl-center 业务接口探活',
        () => blClient.get('/api/v1/specimen-receipts/pending?page=1&size=1'),
        `bl-center 业务接口不可达，请确认服务已启动。当前地址: ${e2eEnv.blBaseURL}/api/v1/specimen-receipts/pending`,
      );

      const blPayload = await blResponse.json();
      expect(
        blPayload?.code,
        'bl-center 已响应，但返回结构不是预期的 SUCCESS 包装。',
      ).toBe('SUCCESS');
    } finally {
      await blClient.dispose();
    }
  } finally {
    await webClient.dispose();
    await authClient.dispose();
  }
});
