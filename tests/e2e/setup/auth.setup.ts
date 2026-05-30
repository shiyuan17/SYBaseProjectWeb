import type { E2ERole } from '../helpers/env';

import { test } from 'playwright/test';

import { loginAndSaveStorageState } from '../helpers/auth';

const roles: E2ERole[] = [
  'creator',
  'register',
  'fixation',
  'transport',
  'receive',
  'tracking',
];

test('auth setup: generate storage states for all m2 roles', async ({
  browser,
}) => {
  for (const role of roles) {
    await loginAndSaveStorageState(browser, role);
  }
});
