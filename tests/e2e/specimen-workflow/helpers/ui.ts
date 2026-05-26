import {
  expect,
  type Locator,
  type Page,
} from 'playwright/test';

type Scope = Locator | Page;

function rootLocator(scope: Scope) {
  return 'locator' in scope ? scope : scope.locator('body');
}

export async function waitForToast(page: Page, text: string) {
  await expect(page.locator('.el-message').filter({ hasText: text }).last()).toBeVisible();
}

export function getDialog(page: Page, title?: string) {
  const dialogs = page.locator('.el-dialog:visible');
  if (!title) {
    return dialogs.last();
  }
  return dialogs.filter({
    has: page.locator('.el-dialog__title').filter({ hasText: title }),
  }).last();
}

export function getDrawer(page: Page, title: string) {
  return page.locator('.el-drawer:visible').filter({
    has: page.locator('.el-drawer__title').filter({ hasText: title }),
  }).last();
}

export function getFormItem(scope: Scope, label: string) {
  const root = rootLocator(scope);
  return root
    .locator(
      `xpath=.//*[contains(@class,"el-form-item")][.//*[contains(@class,"el-form-item__label") and normalize-space()="${label}"]]`,
    )
    .first();
}

export async function fillInputByLabel(scope: Scope, label: string, value: string) {
  const item = getFormItem(scope, label);
  await expect(item).toBeVisible();
  const input = item.locator('input').first();
  await input.click();
  await input.fill(value);
}

export async function fillTextareaByLabel(scope: Scope, label: string, value: string) {
  const item = getFormItem(scope, label);
  await expect(item).toBeVisible();
  const textarea = item.locator('textarea').first();
  await textarea.click();
  await textarea.fill(value);
}

export async function fillAutocompleteByLabel(scope: Scope, label: string, value: string) {
  const item = getFormItem(scope, label);
  const input = item.locator('input').first();
  await input.click();
  await input.fill(value);
  await input.press('Tab');
}

async function clickSelectTrigger(item: Locator) {
  const trigger = item.locator('.el-select__wrapper, [role="combobox"], .el-tree-select').first();
  if ((await trigger.count()) > 0) {
    await trigger.click();
    return;
  }

  await item.locator('input').first().click();
}

export async function selectTreeOptionByLabel(
  page: Page,
  scope: Scope,
  label: string,
  candidates: string[],
) {
  const item = getFormItem(scope, label);
  await clickSelectTrigger(item);
  const dropdown = page.locator('.el-select-dropdown:visible, .el-popper:visible').last();
  await expect(dropdown).toBeVisible();
  const tree = dropdown.locator('.el-tree');
  await expect(tree.locator('.el-tree-node__content').first()).toBeVisible({ timeout: 5_000 });

  const input = item.locator('input:not([readonly])').first();

  for (const candidate of candidates) {
    if ((await input.count()) > 0) {
      await input.fill('');
      await input.fill(candidate);
    }

    const option = tree.locator('.el-tree-node__content').filter({ hasText: candidate }).first();
    if (await option.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await option.click();
      return candidate;
    }
  }

  throw new Error(`未能在树选择器 ${label} 中找到候选项: ${candidates.join(', ')}`);
}

export async function selectOptionByLabel(
  page: Page,
  scope: Scope,
  label: string,
  optionLabel: string,
) {
  const item = getFormItem(scope, label);
  await clickSelectTrigger(item);
  const option = page.locator('.el-select-dropdown:visible .el-select-dropdown__item').filter({
    hasText: optionLabel,
  }).first();
  await option.click();
}

export async function selectOptionByIndex(
  page: Page,
  trigger: Locator,
  optionIndex: number,
) {
  await trigger.click();
  const option = page
    .locator('.el-select-dropdown:visible .el-select-dropdown__item:not(.is-disabled)')
    .nth(optionIndex);
  await option.click();
}

export async function clickTableAction(page: Page, rowText: string, actionText: string) {
  const row = page.locator('.el-table__row:visible').filter({ hasText: rowText }).first();
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: actionText }).click();
}

export async function waitForTableRow(page: Page, text: string) {
  await expect(
    page.locator('.el-table__row:visible').filter({ hasText: text }).first(),
  ).toBeVisible();
}

export async function setInputValue(locator: Locator, value: string) {
  await locator.click();
  await locator.fill(value);
  await locator.press('Tab');
}
