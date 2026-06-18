import { expect, test } from 'playwright/test';

import { loginAndSaveStorageStateViaUi } from '../helpers/auth';
import { e2eEnv, getStorageStatePath } from '../helpers/env';

test.describe('login page slider smoke', () => {
  test.skip(
    e2eEnv.authStrategy !== 'ui',
    'Only run the real login-page slider smoke when E2E_AUTH_STRATEGY=ui.',
  );

  test('logs in through the real slider captcha flow', async ({ browser }) => {
    await loginAndSaveStorageStateViaUi(browser, 'register');

    const context = await browser.newContext({
      baseURL: e2eEnv.baseURL,
      storageState: getStorageStatePath('register'),
    });
    const page = await context.newPage();

    try {
      await page.goto('/workflow/submission-registration', {
        waitUntil: 'domcontentloaded',
      });
      await expect(page).not.toHaveURL(/\/auth\/login/u);
    } finally {
      await context.close();
    }
  });
});
