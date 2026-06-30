import type { Page } from 'playwright/test';

import type { WorkflowRunData } from './helpers/test-data';

import { expect } from 'playwright/test';

import {
  fillInputByLabel,
  fillTextareaByLabel,
  getDialog,
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

export class SubmissionRegistrationPage {
  constructor(private readonly page: Page) {}

  async createApplicationAndOpenRegistration(data: WorkflowRunData) {
    await this.page.getByRole('button', { name: '创建' }).click();

    const dialog = getDialog(this.page, '申请单详情');
    await expect(dialog).toBeVisible();

    const now = new Date();

    await fillInputByLabel(dialog, '申请单号', data.applicationNo);
    if (data.patientId.trim()) {
      await fillInputByLabel(dialog, '患者编号', data.patientId);
    }
    await fillInputByLabel(dialog, '患者姓名', data.patientName);
    await fillInputByLabel(dialog, '申请日期', formatDateOnly(now));
    await fillInputByLabel(dialog, '送检日期', formatDateOnly(now));
    await fillInputByLabel(dialog, '来源医院', 'E2E联调医院');
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
    await this.page.waitForURL(
      /\/workflow\/submission-registration(?:\?.*|$)/,
      {
        timeout: 15_000,
      },
    );
    await expect(
      this.page.getByRole('tab', { name: '标本登记' }),
    ).toBeVisible();

    return createPayload.data as ApplicationCreateResult;
  }

  async goto() {
    await this.page.goto('/workflow/submission-registration', {
      waitUntil: 'domcontentloaded',
    });
    await expect(this.page.getByRole('button', { name: '创建' })).toBeVisible();
  }

  async registerSpecimens(data: WorkflowRunData) {
    await this.page.getByRole('tab', { name: '标本登记' }).click();
    await this.ensureWorkbenchLoaded(data);

    const saveButton = this.page.getByRole('button', {
      name: '保存/确认登记',
    });
    await expect(saveButton).toBeVisible({ timeout: 15_000 });
    const addSpecimenButton = this.page.getByRole('button', {
      name: '添加标本',
    });
    await expect(addSpecimenButton).toBeVisible();
    await addSpecimenButton.click();
    await addSpecimenButton.click();

    await this.fillWorkbenchRow(0, data.specimenName, data.specimenSite);
    await this.fillWorkbenchRow(1, data.specimenName, data.specimenSite);

    const [registerResponse, latestRegistrationResponse] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          /\/api\/v1\/application-registration-workbench\/.+\/save$/.test(
            response.url(),
          ),
      ),
      this.page.waitForResponse(
        (response) =>
          response.request().method() === 'GET' &&
          /\/api\/v1\/specimens\/applications\/.+\/latest-registration$/.test(
            response.url(),
          ),
      ),
      this.page.getByRole('button', { name: '保存/确认登记' }).click(),
    ]);

    expect(registerResponse.ok(), '标本登记接口返回失败。').toBeTruthy();
    expect(
      latestRegistrationResponse.ok(),
      '最新标本登记结果接口返回失败。',
    ).toBeTruthy();

    await waitForToast(this.page, '保存并确认登记成功');
    const latestRegistrationPayload = await latestRegistrationResponse.json();
    return latestRegistrationPayload.data as RegistrationResult;
  }

  private async ensureWorkbenchLoaded(data: WorkflowRunData) {
    const applicationNoLocator = this.page
      .getByText(data.applicationNo)
      .first();
    const patientNameLocator = this.page.getByText(data.patientName).first();
    const alreadyLoaded =
      (await applicationNoLocator.isVisible().catch(() => false)) &&
      (await patientNameLocator.isVisible().catch(() => false));

    if (alreadyLoaded) {
      return;
    }

    const searchInput = this.page.getByPlaceholder('请输入申请单号').first();
    await expect(searchInput).toBeVisible({ timeout: 15_000 });
    await searchInput.click();
    await searchInput.fill(data.applicationNo);

    await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.request().method() === 'GET' &&
          response
            .url()
            .includes('/api/v1/application-registration-workbench/lookup'),
      ),
      this.page.getByRole('button', { name: '查询' }).click(),
    ]);

    await expect(applicationNoLocator).toBeVisible({ timeout: 15_000 });
    await expect(patientNameLocator).toBeVisible({ timeout: 15_000 });
  }

  private async fillWorkbenchRow(
    rowIndex: number,
    specimenName: string,
    specimenSite: string,
  ) {
    const row = this.page.locator('.el-table__row:visible').nth(rowIndex);
    await expect(row).toBeVisible();

    const specimenNameInput = row
      .getByPlaceholder('支持中文或拼音首字母')
      .first();
    await specimenNameInput.click();
    await specimenNameInput.fill(specimenName);
    await expect(specimenNameInput).toHaveValue(specimenName);
    await specimenNameInput.press('Tab');

    const specimenSiteInput = row
      .getByPlaceholder('支持中文或拼音首字母')
      .last();
    const currentSiteValue = await specimenSiteInput
      .inputValue()
      .catch(() => '');
    if (currentSiteValue.trim() === specimenSite) {
      return;
    }

    await specimenSiteInput.click();
    await specimenSiteInput.fill(specimenSite);
    await expect(specimenSiteInput).toHaveValue(specimenSite);
    await specimenSiteInput.press('Tab');
  }
}
