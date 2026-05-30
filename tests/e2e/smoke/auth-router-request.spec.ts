import { expect, test } from 'playwright/test';

import { getStorageStatePath } from '../helpers/env';

test.describe('authenticated route smoke', () => {
  test.use({ storageState: getStorageStatePath('register') });

  test('keeps authenticated users on workflow routes and preserves redirect query', async ({
    page,
  }) => {
    await page.goto('/workflow/specimen-management?action=register', {
      waitUntil: 'domcontentloaded',
    });

    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page).toHaveURL(/\/workflow\/submission-registration/);
    await expect(page).toHaveURL(/action=register/);
    await expect(page.getByText('申请与登记').first()).toBeVisible();
  });

  test('surfaces request failures without falling back to a blank page', async ({
    page,
  }) => {
    await page.route('**/api/v1/specimens**', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        status: 500,
        body: JSON.stringify({
          code: 'SYSTEM_ERROR',
          message: 'smoke forced specimen list failure',
        }),
      });
    });

    await page.goto('/workflow/submission-registration', {
      waitUntil: 'domcontentloaded',
    });

    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page.getByText('申请与登记').first()).toBeVisible();
    await expect(
      page.getByText(/smoke forced specimen list failure|失败|异常/).first(),
    ).toBeVisible();
  });
});
