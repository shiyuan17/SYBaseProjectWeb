import { defineConfig, devices } from 'playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:5778';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 180_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  workers: 1,
  outputDir: 'test-results',
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  use: {
    baseURL,
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'preflight',
      testMatch: /setup[\\/]preflight\.setup\.ts/,
    },
    {
      name: 'auth-setup',
      dependencies: ['preflight'],
      testMatch: /setup[\\/]auth\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'chromium',
      dependencies: ['auth-setup'],
      testIgnore: /setup[\\/].*\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
