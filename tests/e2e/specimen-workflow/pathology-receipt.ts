import type { Page } from 'playwright/test';

import { expect } from 'playwright/test';

import {
  getDialog,
  selectOptionByIndex,
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
    await expect(this.page.getByText('待接收转运单')).toBeVisible();
  }

  async receiveAll(transportOrderId: string) {
    await this.openReceiptDialog(transportOrderId);

    const dialog = getDialog(this.page, '接收标本');
    const [receiptResponse] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          response.url().endsWith('/api/v1/specimen-receipts'),
      ),
      dialog.getByRole('button', { name: '提交接收' }).click(),
    ]);

    expect(receiptResponse.ok(), '标本接收接口返回失败。').toBeTruthy();
    await waitForToast(this.page, '标本接收成功');
    await expect(this.page.getByText('接收结果')).toBeVisible();
    const receiptPayload = await receiptResponse.json();
    return receiptPayload.data as ReceiptResult;
  }

  async rejectOneSpecimen(transportOrderId: string, reason: string) {
    await this.openReceiptDialog(transportOrderId);

    const dialog = getDialog(this.page, '接收标本');
    const secondRow = dialog.locator('.el-table__body-wrapper tbody tr').nth(1);
    await expect(secondRow).toBeVisible();

    const receiptStatusSelect = secondRow.locator('.el-select').nth(0);
    const qualityResultSelect = secondRow.locator('.el-select').nth(1);
    const qualityIssueSelect = secondRow.locator('.el-select').nth(2);

    await selectOptionByIndex(this.page, receiptStatusSelect, 1);
    await selectOptionByIndex(this.page, qualityResultSelect, 1);

    await qualityIssueSelect.click();
    await this.page
      .locator(
        '.el-select-dropdown:visible .el-select-dropdown__item:not(.is-disabled)',
      )
      .nth(2)
      .click();

    await secondRow.locator('td').nth(6).locator('input').fill(reason);

    const [receiptResponse] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          response.url().endsWith('/api/v1/specimen-receipts'),
      ),
      dialog.getByRole('button', { name: '提交接收' }).click(),
    ]);

    expect(receiptResponse.ok(), '异常接收接口返回失败。').toBeTruthy();
    await waitForToast(this.page, '标本接收成功');
    await expect(this.page.getByText('接收结果')).toBeVisible();
    const receiptPayload = await receiptResponse.json();
    return receiptPayload.data as ReceiptResult;
  }

  private async openReceiptDialog(transportOrderId: string) {
    await waitForTableRow(this.page, transportOrderId);
    const row = this.page
      .locator('.el-table__row')
      .filter({ hasText: transportOrderId })
      .first();
    await row.getByRole('button', { name: '接收' }).click();
    await expect(getDialog(this.page, '接收标本')).toBeVisible();
  }
}
