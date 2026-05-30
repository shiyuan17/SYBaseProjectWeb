import type { Page } from 'playwright/test';

import type { WorkflowRunData } from './helpers/test-data';

import { expect } from 'playwright/test';

import { workflowDefaults } from '../helpers/env';
import {
  fillAutocompleteByLabel,
  fillInputByLabel,
  fillTextareaByLabel,
  getDialog,
  selectTreeOptionByLabel,
  waitForToast,
} from './helpers/ui';

type ApplicationCreateResult = {
  id: string;
};

type RegistrationResult = {
  labelPrintBatchNo: string;
  specimens: Array<{
    barcode: string;
    specimenNo: string;
  }>;
};

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDateTime(date: Date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

export class SubmissionRegistrationPage {
  constructor(private readonly page: Page) {}

  async createApplicationAndOpenRegistration(data: WorkflowRunData) {
    await this.page.getByRole('button', { name: '创建' }).click();

    const dialog = getDialog(this.page, '申请单详情');
    await expect(dialog).toBeVisible();

    const now = new Date();
    const removalDate = new Date(now.getTime() - 15 * 60 * 1000);

    await fillInputByLabel(dialog, '申请单号', data.applicationNo);
    if (data.patientId.trim()) {
      await fillInputByLabel(dialog, '患者编号', data.patientId);
    }
    await fillInputByLabel(dialog, '患者姓名', data.patientName);
    await fillInputByLabel(dialog, '申请日期', formatDateOnly(now));
    await fillInputByLabel(dialog, '送检日期', formatDateOnly(now));
    await fillInputByLabel(dialog, '离体时间', formatDateTime(removalDate));
    await fillInputByLabel(dialog, '来源医院', 'E2E联调医院');
    await selectTreeOptionByLabel(
      this.page,
      dialog,
      '送检科室',
      workflowDefaults.submittingDepartmentCandidates,
    );
    await fillAutocompleteByLabel(dialog, '送检部位', data.specimenSite);
    await fillInputByLabel(dialog, '外部单号', data.externalOrderNo);
    await fillTextareaByLabel(dialog, '临床诊断', data.clinicalDiagnosis);
    await fillTextareaByLabel(dialog, '症状说明', data.clinicalSymptom);

    const [createResponse] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          response.url().includes('/api/v1/applications'),
      ),
      dialog.getByRole('button', { name: '保存并前往标本登记' }).click(),
    ]);

    expect(createResponse.ok(), '申请单创建接口返回失败。').toBeTruthy();

    const createPayload = await createResponse.json();
    await waitForToast(this.page, '申请单创建成功');
    await expect(getDialog(this.page, '标本登记')).toBeVisible();

    return createPayload.data as ApplicationCreateResult;
  }

  async goto() {
    await this.page.goto('/workflow/submission-registration', {
      waitUntil: 'domcontentloaded',
    });
    await expect(this.page.getByRole('button', { name: '创建' })).toBeVisible();
  }

  async registerSpecimens(data: WorkflowRunData) {
    const dialog = getDialog(this.page, '标本登记');
    await expect(dialog).toBeVisible();

    await fillInputByLabel(dialog, '打印机编号', 'P-01');
    await this.fillRegisterRow(
      0,
      data.specimenName,
      data.specimenSite,
      data.barcodes[0],
    );
    await dialog.getByRole('button', { name: '新增' }).first().click();
    await this.fillRegisterRow(
      1,
      data.specimenName,
      data.specimenSite,
      data.barcodes[1],
    );

    const [registerResponse] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          response.url().includes('/api/v1/specimens/register'),
      ),
      dialog.getByRole('button', { name: '提交登记' }).click(),
    ]);

    expect(registerResponse.ok(), '标本登记接口返回失败。').toBeTruthy();

    await waitForToast(this.page, '标本登记成功');
    const registerPayload = await registerResponse.json();
    return registerPayload.data as RegistrationResult;
  }

  private async fillRegisterRow(
    rowIndex: number,
    specimenName: string,
    specimenSite: string,
    barcode: string,
  ) {
    const row = getDialog(this.page, '标本登记')
      .locator('.el-table__body-wrapper tbody tr')
      .nth(rowIndex);

    await expect(row).toBeVisible();
    await row.locator('td').nth(0).locator('input').fill(specimenName);
    await row.locator('td').nth(1).locator('input').fill('ROUTINE');
    await row.locator('td').nth(1).locator('input').press('Tab');
    await row.locator('td').nth(2).locator('input').fill(specimenSite);
    await row.locator('td').nth(2).locator('input').press('Tab');
    await row.locator('td').nth(3).locator('input').fill('SURGERY');
    await row.locator('td').nth(3).locator('input').press('Tab');
    await row.locator('td').nth(5).locator('input').fill('Specimen Bottle');
    await row.locator('td').nth(5).locator('input').press('Tab');
    await row.locator('td').nth(7).locator('input').fill(barcode);
    await row.locator('td').nth(8).locator('input').fill('Neck mass');
    await row.locator('td').nth(8).locator('input').press('Tab');
  }
}
