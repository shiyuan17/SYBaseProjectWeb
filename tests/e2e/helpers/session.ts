import type { Browser, BrowserContext, Locator, Page } from 'playwright/test';

import type { E2EAuthMode, E2EAuthStrategy, E2ERole } from './env';

import fs from 'node:fs';

import { loginAndSaveStorageState } from './auth';
import { e2eEnv, getStorageStatePath } from './env';

export type PageAuthenticationSignals = {
  hasAccessTokenExpiredText: boolean;
  hasLoginForm: boolean;
  hasSliderCaptcha: boolean;
  url: string;
};

export type EnsureAuthenticatedPageResult = {
  authMode: E2EAuthMode;
  context: BrowserContext;
  page: Page;
  recovered: boolean;
};

type EnsureAuthenticatedPageOptions = {
  authStrategy?: E2EAuthStrategy;
};

async function isVisible(locator: Locator) {
  try {
    return await locator.isVisible({ timeout: 2_000 });
  } catch {
    return false;
  }
}

async function collectAuthenticationSignals(
  page: Page,
): Promise<PageAuthenticationSignals> {
  const bodyText = await page
    .locator('body')
    .innerText()
    .catch(() => '');

  return {
    hasAccessTokenExpiredText:
      /访问令牌已过期|登录已过期|access token expired|token expired/iu.test(
        bodyText,
      ),
    hasLoginForm:
      (await isVisible(page.getByLabel('login').first())) ||
      (await isVisible(page.getByPlaceholder('请输入用户名').first())),
    hasSliderCaptcha: await isVisible(
      page.locator('[name="captcha-action"]').first(),
    ),
    url: page.url(),
  };
}

async function openRoleContext(
  browser: Browser,
  role: E2ERole,
  targetPath: string,
) {
  const context = await browser.newContext({
    baseURL: e2eEnv.baseURL,
    storageState: getStorageStatePath(role),
  });
  const page = await context.newPage();
  await page.goto(targetPath, { waitUntil: 'domcontentloaded' });
  return { context, page };
}

async function recoverAuthenticationState(
  browser: Browser,
  role: E2ERole,
  authStrategy: E2EAuthStrategy,
) {
  return loginAndSaveStorageState(browser, role, authStrategy);
}

export function getPreferredAuthMode(
  authStrategy: E2EAuthStrategy = e2eEnv.authStrategy,
): E2EAuthMode {
  return authStrategy === 'ui' ? 'ui' : 'api';
}

export function detectAuthenticationSignals(
  signals: PageAuthenticationSignals,
) {
  return (
    signals.url.includes('/auth/login') ||
    signals.hasLoginForm ||
    signals.hasSliderCaptcha ||
    signals.hasAccessTokenExpiredText
  );
}

export async function ensureAuthenticatedPage(
  browser: Browser,
  role: E2ERole,
  targetPath: string,
  options: EnsureAuthenticatedPageOptions = {},
): Promise<EnsureAuthenticatedPageResult> {
  const authStrategy = options.authStrategy ?? e2eEnv.authStrategy;
  let authMode = getPreferredAuthMode(authStrategy);
  let recovered = false;

  if (!fs.existsSync(getStorageStatePath(role))) {
    authMode = await recoverAuthenticationState(browser, role, authStrategy);
    recovered = true;
  }

  let { context, page } = await openRoleContext(browser, role, targetPath);
  let signals = await collectAuthenticationSignals(page);

  if (!detectAuthenticationSignals(signals)) {
    return { authMode, context, page, recovered };
  }

  await context.close();
  authMode = await recoverAuthenticationState(browser, role, authStrategy);
  recovered = true;

  ({ context, page } = await openRoleContext(browser, role, targetPath));
  signals = await collectAuthenticationSignals(page);

  if (detectAuthenticationSignals(signals)) {
    await context.close();
    throw new Error(
      `角色 ${role} 认证恢复后仍未通过。当前信号: ${JSON.stringify(signals)}`,
    );
  }

  return { authMode, context, page, recovered };
}

export async function openRolePage(
  browser: Browser,
  role: E2ERole,
  path: string,
): Promise<EnsureAuthenticatedPageResult> {
  return ensureAuthenticatedPage(browser, role, path);
}
