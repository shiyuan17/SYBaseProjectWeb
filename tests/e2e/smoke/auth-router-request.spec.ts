import type { Page, Route } from 'playwright/test';

import { expect, test } from 'playwright/test';

import { getStorageStatePath } from '../helpers/env';

const registerAccessCodes = ['PERM_SPECIMEN_REGISTER'];

const applicationListAccessCodes = [
  'PERM_APPLICATION_CREATE',
  'PERM_APPLICATION_DETAIL_QUERY',
  'PERM_CLINICAL_IMPORT',
  'PERM_SPECIMEN_REGISTER',
];

async function fulfillJson(route: Route, data: unknown) {
  await route.fulfill({
    contentType: 'application/json',
    status: 200,
    body: JSON.stringify({
      code: 'SUCCESS',
      data,
    }),
  });
}

async function stubAuthenticatedWorkflowShell(
  page: Page,
  accessCodes: string[],
) {
  await page.route('**/api/v1/auth/me', async (route) => {
    await fulfillJson(route, {
      avatar: null,
      homePath: '/workflow/submission-registration',
      loginName: 'm2.register',
      realName: 'M2 Register',
      roles: [],
      userId: 'USER_M2_REGISTER',
    });
  });

  await page.route('**/api/v1/auth/access-codes', async (route) => {
    await fulfillJson(route, accessCodes);
  });

  await page.route('**/api/v1/my/notifications**', async (route) => {
    const pathname = new URL(route.request().url()).pathname;

    if (pathname === '/api/v1/my/notifications/unread-count') {
      await fulfillJson(route, { unreadCount: 0 });
      return;
    }

    if (pathname === '/api/v1/my/notification-preferences') {
      await fulfillJson(route, {});
      return;
    }

    if (pathname === '/api/v1/my/notifications') {
      await fulfillJson(route, {
        items: [],
        page: 1,
        size: 6,
        total: 0,
      });
      return;
    }

    await fulfillJson(route, {});
  });

  await page.route('**/api/v1/departments**', async (route) => {
    await fulfillJson(route, []);
  });
}

async function stubRegisterWorkflowShell(page: Page) {
  await stubAuthenticatedWorkflowShell(page, registerAccessCodes);

  await page.route('**/api/v1/specimens**', async (route) => {
    await fulfillJson(route, {
      items: [],
      page: 1,
      size: 20,
      summary: {
        abnormalCount: 0,
        labelPrintedCount: 0,
        pendingLabelCount: 0,
        totalCount: 0,
      },
      total: 0,
    });
  });
}

async function stubApplicationListWorkflowShell(page: Page) {
  await stubAuthenticatedWorkflowShell(page, applicationListAccessCodes);

  await page.route('**/api/v1/applications**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      status: 500,
      body: JSON.stringify({
        code: 'SYSTEM_ERROR',
        message: 'smoke forced application list failure',
      }),
    });
  });
}

test.describe('authenticated route smoke', () => {
  test.use({ storageState: getStorageStatePath('register') });

  test('keeps authenticated users on workflow routes and preserves redirect query', async ({
    page,
  }) => {
    await stubRegisterWorkflowShell(page);

    await page.goto('/workflow/specimen-management?action=register', {
      waitUntil: 'domcontentloaded',
    });

    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page).toHaveURL(/\/workflow\/specimen-management/);
    await expect(page).toHaveURL(/action=register/);
    await expect(page.locator('.el-tabs').first()).toBeVisible();
  });

  test('surfaces request failures without falling back to a blank page', async ({
    page,
  }) => {
    await stubApplicationListWorkflowShell(page);

    await page.goto('/workflow/submission-registration', {
      waitUntil: 'domcontentloaded',
    });

    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(
      page
        .getByRole('alert')
        .filter({
          hasText: /smoke forced application list failure/,
        })
        .first(),
    ).toBeVisible();
  });
});
