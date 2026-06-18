import type { APIRequestContext, Browser, Page } from 'playwright/test';

import type { E2ERole } from './env';

import fs from 'node:fs';

import { expect, request } from 'playwright/test';

import {
  e2eEnv,
  getAccessStoreStorageKey,
  getAuthStorageStatePath,
  getRoleConfig,
} from './env';

type BrowserStorageState = {
  cookies: unknown[];
  origins: Array<{
    localStorage: Array<{ name: string; value: string }>;
    origin: string;
  }>;
};

type AuthLoginPayload = {
  code?: string;
  data?: {
    accessToken?: string;
  };
  message?: string;
};

export async function solveSliderCaptcha(page: Page) {
  const handle = page.locator('[name="captcha-action"]').first();
  await expect(handle).toBeVisible();

  const handleBox = await handle.boundingBox();
  const wrapperBox = await handle.locator('xpath=..').boundingBox();

  if (!handleBox || !wrapperBox) {
    throw new Error('未能定位登录页滑块验证码，请检查页面是否已完成渲染。');
  }

  const startX = handleBox.x + handleBox.width / 2;
  const startY = handleBox.y + handleBox.height / 2;
  const endX = wrapperBox.x + wrapperBox.width - handleBox.width / 2 - 4;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, startY, { steps: 18 });
  await page.mouse.up();

  await expect(page.getByText('验证通过')).toBeVisible({ timeout: 10_000 });
}

function createAccessStoreStorageValue(accessToken: string) {
  return JSON.stringify({
    accessToken,
    refreshToken: null,
    accessCodes: [],
    isLockScreen: false,
  });
}

export function buildApiStorageState(origin: string, accessToken: string) {
  return {
    cookies: [],
    origins: [
      {
        origin,
        localStorage: [
          {
            name: getAccessStoreStorageKey(),
            value: createAccessStoreStorageValue(accessToken),
          },
        ],
      },
    ],
  } satisfies BrowserStorageState;
}

async function createAuthClient() {
  return request.newContext({
    baseURL: e2eEnv.authBaseURL,
  });
}

export async function requestAccessToken(
  authClient: APIRequestContext,
  role: E2ERole,
) {
  const roleConfig = getRoleConfig(role);
  let response;

  try {
    response = await authClient.post('/api/v1/auth/login', {
      data: {
        loginName: roleConfig.username,
        password: e2eEnv.password,
      },
    });
  } catch (error) {
    throw new Error(
      `角色 ${roleConfig.username} 登录请求失败，请确认 auth-center 可用。原始错误: ${String(error)}`,
      { cause: error },
    );
  }

  if (!response.ok()) {
    throw new Error(
      `角色 ${roleConfig.username} 登录失败，HTTP 状态 ${response.status()}。`,
    );
  }

  const payload = (await response.json()) as AuthLoginPayload;

  if (payload.code !== 'SUCCESS') {
    throw new Error(
      `角色 ${roleConfig.username} 登录失败，返回码 ${payload.code ?? 'UNKNOWN'}。${payload.message ? ` 原因: ${payload.message}` : ''}`,
    );
  }

  const accessToken = payload.data?.accessToken?.trim();
  if (!accessToken) {
    throw new Error(
      `角色 ${roleConfig.username} 登录成功但未返回 accessToken。`,
    );
  }

  return accessToken;
}

export async function saveApiStorageState(role: E2ERole) {
  const authClient = await createAuthClient();

  try {
    const accessToken = await requestAccessToken(authClient, role);
    fs.mkdirSync(e2eEnv.authDir, { recursive: true });
    fs.writeFileSync(
      getAuthStorageStatePath(role),
      JSON.stringify(
        buildApiStorageState(new URL(e2eEnv.baseURL).origin, accessToken),
        null,
        2,
      ),
      'utf8',
    );
  } finally {
    await authClient.dispose();
  }
}

export async function loginAndSaveStorageStateViaUi(
  browser: Browser,
  role: E2ERole,
) {
  const roleConfig = getRoleConfig(role);
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${e2eEnv.baseURL}/auth/login`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByLabel('login')).toBeVisible();

    await page.getByPlaceholder('请输入用户名').fill(roleConfig.username);
    await page.locator('input[type="password"]').fill(e2eEnv.password);
    await solveSliderCaptcha(page);

    const [loginResponse] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          response.url().includes('/api/v1/auth/login'),
      ),
      page.getByLabel('login').click(),
    ]);

    expect(
      loginResponse.ok(),
      `角色 ${roleConfig.username} 登录失败，请确认账号、密码和本地联调环境是否可用。`,
    ).toBeTruthy();

    await page.waitForURL((url) => !url.pathname.includes('/auth/login'), {
      timeout: 20_000,
    });

    fs.mkdirSync(e2eEnv.authDir, { recursive: true });
    await context.storageState({ path: getAuthStorageStatePath(role) });
  } finally {
    await context.close();
  }
}

export async function loginAndSaveStorageState(
  browser: Browser,
  role: E2ERole,
) {
  if (e2eEnv.authStrategy === 'ui') {
    await loginAndSaveStorageStateViaUi(browser, role);
    return;
  }

  await saveApiStorageState(role);
}

export function describeRole(role: E2ERole) {
  return `${role}:${getRoleConfig(role).username}`;
}
