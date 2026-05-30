import type { Browser, BrowserContext, Page } from 'playwright/test';

import type { E2ERole } from './env';

import { e2eEnv, getStorageStatePath } from './env';

export async function openRolePage(
  browser: Browser,
  role: E2ERole,
  path: string,
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({
    baseURL: e2eEnv.baseURL,
    storageState: getStorageStatePath(role),
  });
  const page = await context.newPage();
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  return { context, page };
}
