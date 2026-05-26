import { expect, type Page } from 'playwright/test';

import { workflowDefaults } from '../helpers/env';
import {
  clickTableAction,
  fillTextareaByLabel,
  getDialog,
  selectTreeOptionByLabel,
  waitForTableRow,
  waitForToast,
} from './helpers/ui';

type TransportOrderResult = {
  id: string;
  status: string;
  transportOrderNo: string;
};

export class FixationTransportPage {
  constructor(private readonly page: Page) {}

  async gotoFixation() {
    await this.page.goto('/workflow/fixation-verify', {
      waitUntil: 'domcontentloaded',
    });
    await expect(this.page.getByText('固定列表')).toBeVisible();
  }

  async gotoTransport() {
    await this.page.goto('/workflow/transport-handover', {
      waitUntil: 'domcontentloaded',
    });
    await expect(this.page.getByText('待处理转运单')).toBeVisible();
  }

  async completeFixation(barcode: string) {
    await waitForTableRow(this.page, barcode);
    await clickTableAction(this.page, barcode, '完成固定');

    const [completeResponse] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.request().method() === 'POST'
          && response.url().includes('/api/v1/specimen-fixations/complete'),
      ),
      this.page.getByRole('button', { name: '确认' }).click(),
    ]);

    expect(completeResponse.ok(), `条码 ${barcode} 的完成固定接口返回失败。`).toBeTruthy();
    await waitForToast(this.page, '已完成固定');
  }

  async createTransportOrder(barcodes: string[]) {
    await waitForTableRow(this.page, barcodes[0]);
    await clickTableAction(this.page, barcodes[0], '创建转运单');

    const dialog = getDialog(this.page, '创建转运单');
    await expect(dialog).toBeVisible();

    await selectTreeOptionByLabel(
      this.page,
      dialog,
      '交接科室',
      workflowDefaults.handoverDepartmentCandidates,
    );
    await selectTreeOptionByLabel(
      this.page,
      dialog,
      '接收科室',
      workflowDefaults.receiverDepartmentCandidates,
    );
    await fillTextareaByLabel(dialog, '批量扫码 / 粘贴', barcodes.join('\n'));

    const [createResponse] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.request().method() === 'POST'
          && /\/api\/v1\/transport-orders$/.test(response.url()),
      ),
      dialog.getByRole('button', { name: '创建转运单' }).click(),
    ]);

    expect(createResponse.ok(), '创建转运单接口返回失败。').toBeTruthy();
    await waitForToast(this.page, '转运单创建成功');
    return (await createResponse.json()).data as TransportOrderResult;
  }

  async printTransportOrder(transportOrderNo: string) {
    await waitForTableRow(this.page, transportOrderNo);
    await clickTableAction(this.page, transportOrderNo, '打印');

    const dialog = getDialog(this.page);
    const [printResponse] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.request().method() === 'POST'
          && /\/api\/v1\/transport-orders\/.+\/print$/.test(response.url()),
      ),
      dialog.getByRole('button', { name: '确认打印' }).click(),
    ]);

    expect(printResponse.ok(), '转运单打印接口返回失败。').toBeTruthy();
    await waitForToast(this.page, '转运单打印成功');
    return (await printResponse.json()).data as TransportOrderResult;
  }

  async handoverTransportOrder(transportOrderNo: string) {
    await waitForTableRow(this.page, transportOrderNo);
    await clickTableAction(this.page, transportOrderNo, '交接');

    const dialog = getDialog(this.page);
    const [handoverResponse] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.request().method() === 'POST'
          && /\/api\/v1\/transport-orders\/.+\/handover$/.test(response.url()),
      ),
      dialog.getByRole('button', { name: '确认交接' }).click(),
    ]);

    expect(handoverResponse.ok(), '转运交接接口返回失败。').toBeTruthy();
    await waitForToast(this.page, '转运交接成功');
    return (await handoverResponse.json()).data as TransportOrderResult;
  }
}
