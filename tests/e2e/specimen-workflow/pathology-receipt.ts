import type { Page } from 'playwright/test';

import { expect } from 'playwright/test';

import {
  getDialog,
  getDrawer,
  waitForTableRow,
  waitForToast,
} from './helpers/ui';

type ReceiptResult = {
  caseId: string;
  pathologyNo: null | string;
  receiptStatus: string;
  unreceivedCount: number;
};

export class PathologyReceiptPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/workflow/pathology-receipt', {
      waitUntil: 'domcontentloaded',
    });
    await expect(this.page.getByPlaceholder('请输入标本ID')).toBeVisible();
    await expect(this.page.getByRole('button', { name: '查询' })).toBeVisible();
    await expect(this.page.getByRole('button', { name: '拒收' })).toBeVisible();
  }

  async queueSpecimens(identifier: string) {
    const input = this.page.getByPlaceholder('请输入标本ID').first();
    await input.click();
    await input.fill(identifier);

    const [queryResponse] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.request().method() === 'GET' &&
          response.url().includes('/api/v1/specimens'),
      ),
      input.press('Enter'),
    ]);

    expect(queryResponse.ok(), '签收前标本查询接口返回失败。').toBeTruthy();
    await waitForTableRow(this.page, identifier);
  }

  async receiveAll(identifier: string) {
    await this.queueSpecimens(identifier);
    await this.selectAllQueuedRows();

    const [receiptResponse] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          response.url().endsWith('/api/v1/specimen-receipts'),
      ),
      this.submitReceiveDialog(),
    ]);

    expect(receiptResponse.ok(), '标本签收接口返回失败。').toBeTruthy();
    await waitForToast(this.page, '标本签收成功');
    const receiptPayload = await receiptResponse.json();
    return receiptPayload.data as ReceiptResult;
  }

  async receiveOneSpecimen(identifier: string) {
    await this.queueSpecimens(identifier);
    await this.selectQueuedRows([identifier]);

    const [receiptResponse] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          response.url().endsWith('/api/v1/specimen-receipts'),
      ),
      this.submitReceiveDialog(),
    ]);

    expect(receiptResponse.ok(), '标本签收接口返回失败。').toBeTruthy();
    await waitForToast(this.page, '标本签收成功');
    const receiptPayload = await receiptResponse.json();
    return receiptPayload.data as ReceiptResult;
  }

  async rejectOneSpecimen(identifier: string, reason: string) {
    await this.queueSpecimens(identifier);
    await this.selectQueuedRows([identifier]);

    const [receiptResponse] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          response.url().endsWith('/api/v1/specimen-receipts/by-barcodes'),
      ),
      this.submitRejectDrawer(reason),
    ]);

    expect(receiptResponse.ok(), '异常签收接口返回失败。').toBeTruthy();
    await waitForToast(this.page, '拒收已提交');
    const receiptPayload = await receiptResponse.json();
    return receiptPayload.data as ReceiptResult;
  }

  private async selectAllQueuedRows() {
    const rows = this.page.locator('.el-table__row:visible');
    const rowCount = await rows.count();
    for (let index = 0; index < rowCount; index += 1) {
      const row = rows.nth(index);
      const checkbox = row.locator('.el-checkbox').first();
      const checkboxInput = row.locator('.el-checkbox__input').first();
      await expect(checkbox).toBeVisible();
      const isDisabled = await checkboxInput.evaluate((node) =>
        node.classList.contains('is-disabled'),
      );
      if (isDisabled) {
        continue;
      }
      const isChecked = await checkboxInput.evaluate((node) =>
        node.classList.contains('is-checked'),
      );
      if (!isChecked) {
        await checkbox.click();
      }
    }

    await expect(
      this.page.getByRole('button', { name: '标本签收' }),
    ).toBeEnabled();
  }

  private async selectQueuedRows(identifiers: string[]) {
    for (const identifier of identifiers) {
      const row = this.page
        .locator('.el-table__row:visible')
        .filter({ hasText: identifier })
        .first();
      const checkbox = row.locator('.el-checkbox').first();
      const checkboxInput = row.locator('.el-checkbox__input').first();
      await expect(row).toBeVisible();
      await expect(checkbox).toBeVisible();
      const isDisabled = await checkboxInput.evaluate((node) =>
        node.classList.contains('is-disabled'),
      );
      if (isDisabled) {
        throw new Error(`标本 ${identifier} 当前不可勾选签收。`);
      }
      const isChecked = await checkboxInput.evaluate((node) =>
        node.classList.contains('is-checked'),
      );
      if (!isChecked) {
        await checkbox.click();
      }
    }

    await expect(
      this.page.getByRole('button', { name: '标本签收' }),
    ).toBeEnabled();
  }

  private async submitReceiveDialog() {
    await this.page.getByRole('button', { name: '标本签收' }).click();
    const dialog = getDialog(this.page, '标本签收');
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('物流人员').fill('E2E物流员');
    await dialog.getByRole('button', { name: '确认' }).click();
  }

  private async submitRejectDrawer(reason: string) {
    await this.page.getByRole('button', { name: '拒收' }).click();
    const drawer = getDrawer(this.page, '拒收');
    await expect(drawer).toBeVisible();
    await drawer.getByPlaceholder('请输入自定义拒收原因').fill(reason);
    await drawer.getByRole('button', { name: '添加' }).click();

    const reasonSelect = drawer.locator('.el-select').first();
    const selectedReason = (
      (await reasonSelect.textContent().catch(() => '')) || ''
    ).trim();
    if (!selectedReason.includes(reason)) {
      await reasonSelect.locator('.el-select__wrapper').first().click();
      await this.page
        .locator('.el-select-dropdown:visible .el-select-dropdown__item')
        .filter({ hasText: reason })
        .first()
        .click();
    }

    await drawer.getByPlaceholder('请填写整改建议').fill(reason);
    await drawer.getByRole('button', { name: '拒收' }).click();
  }
}
