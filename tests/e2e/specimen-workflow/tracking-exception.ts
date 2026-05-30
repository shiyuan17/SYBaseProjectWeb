import type { Page } from 'playwright/test';

import { expect } from 'playwright/test';

import {
  fillInputByLabel,
  getDialog,
  getDrawer,
  waitForTableRow,
} from './helpers/ui';

type TrackingPayload = {
  abnormalFlag: boolean;
  currentNode: string;
  recentEvents: Array<{
    specimenBarcode?: string;
  }>;
  specimens: Array<{
    abnormalReason?: null | string;
    barcode: string;
    qualityIssueCodes?: string[];
    receiptStatus?: null | string;
    specimenStatus: string;
  }>;
  status: string;
};

export class TrackingExceptionPage {
  constructor(private readonly page: Page) {}

  async assertAbnormalPath(
    payload: TrackingPayload,
    abnormalBarcode: string,
    reason: string,
  ) {
    expect(payload.status).toBe('PARTIALLY_RECEIVED');
    expect(payload.abnormalFlag).toBeTruthy();

    const abnormalSpecimen = payload.specimens.find(
      (item) => item.barcode === abnormalBarcode,
    );
    expect(abnormalSpecimen).toBeDefined();
    expect(abnormalSpecimen?.specimenStatus).toBe('REJECTED');
    expect(abnormalSpecimen?.receiptStatus).toBe('REJECTED');
    expect(
      abnormalSpecimen?.qualityIssueCodes?.includes('CONTAINER_DAMAGE'),
    ).toBeTruthy();
    expect(abnormalSpecimen?.abnormalReason).toBe(reason);

    const dialog = getDialog(this.page, '申请单追踪详情');
    await expect(dialog.getByText('异常明细')).toBeVisible();
    await expect(dialog.getByText('CONTAINER_DAMAGE')).toBeVisible();
    await expect(dialog.getByText(reason)).toBeVisible();
  }

  async assertHappyPath(payload: TrackingPayload, barcodes: string[]) {
    expect(payload.currentNode).toBe('RECEPTION');
    expect(payload.status).toBe('RECEIVED');
    expect(payload.abnormalFlag).toBeFalsy();
    expect(payload.recentEvents.length).toBeGreaterThan(0);

    const dialog = getDialog(this.page, '申请单追踪详情');
    await expect(dialog.getByText('时间线事件')).toBeVisible();

    for (const barcode of barcodes) {
      expect(
        payload.specimens.some((item) => item.barcode === barcode),
      ).toBeTruthy();
      await expect(dialog.getByText(barcode)).toBeVisible();
    }
  }

  async goto() {
    await this.page.goto('/workflow/tracking-exception', {
      waitUntil: 'domcontentloaded',
    });
    await expect(this.page.getByText('申请单列表')).toBeVisible();
  }

  async openApplicationTracking(applicationNo: string) {
    await fillInputByLabel(this.page, '申请单号', applicationNo);
    await this.page.getByRole('button', { name: '查询' }).click();

    await waitForTableRow(this.page, applicationNo);
    const row = this.page
      .locator('.el-table__row')
      .filter({ hasText: applicationNo })
      .first();

    const [detailResponse] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.request().method() === 'GET' &&
          /\/api\/v1\/applications\/.+\/tracking$/.test(response.url()),
      ),
      row.getByRole('button', { name: '详情' }).click(),
    ]);

    expect(detailResponse.ok(), '申请单追踪详情接口返回失败。').toBeTruthy();
    await expect(getDialog(this.page, '申请单追踪详情')).toBeVisible();
    const detailPayload = await detailResponse.json();
    return detailPayload.data as TrackingPayload;
  }

  async openSpecimenTracking(barcode: string) {
    await this.page.getByRole('tab', { name: '标本列表' }).click();
    await fillInputByLabel(this.page, '关键字', barcode);
    await this.page.getByRole('button', { name: '查询' }).click();
    await waitForTableRow(this.page, barcode);
    const row = this.page
      .locator('.el-table__row')
      .filter({ hasText: barcode })
      .first();
    await row.getByRole('button', { name: '详情' }).click();
    await expect(getDrawer(this.page, '标本追踪详情')).toBeVisible();
  }
}
