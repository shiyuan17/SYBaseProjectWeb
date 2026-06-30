import { test } from 'playwright/test';

import { loginAndSaveStorageState } from '../helpers/auth';
import { handbookAuthRoles } from '../helpers/env';

test('auth setup: generate storage states for all m2 roles', async ({
  browser,
}) => {
  for (const role of handbookAuthRoles) {
    await loginAndSaveStorageState(browser, role);
  }
});
