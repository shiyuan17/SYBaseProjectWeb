import fs from 'node:fs';

import { expect, type Browser, type Page } from 'playwright/test';

import { e2eEnv, getRoleConfig, getStorageStatePath, type E2ERole } from './env';

async function solveSliderCaptcha(page: Page) {
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

export async function loginAndSaveStorageState(browser: Browser, role: E2ERole) {
  const roleConfig = getRoleConfig(role);
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${e2eEnv.baseURL}/auth/login`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByLabel('login')).toBeVisible();

    await page.getByPlaceholder('请输入用户名').fill(roleConfig.username);
    await page.locator('input[type="password"]').fill(e2eEnv.password);
    await solveSliderCaptcha(page);

    const [loginResponse] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.request().method() === 'POST'
          && response.url().includes('/api/v1/auth/login'),
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
    await context.storageState({ path: getStorageStatePath(role) });
  } finally {
    await context.close();
  }
}

export function describeRole(role: E2ERole) {
  return `${role}:${getRoleConfig(role).username}`;
}
