import type { Locator, Page } from 'playwright/test';

import { expect } from 'playwright/test';

import { e2eEnv } from '../helpers/env';
import { waitForTableRow, waitForToast } from './helpers/ui';

type TransportOrderResult = {
  id: string;
  status: string;
  transportOrderNo: string;
};

async function selectSystemUser(
  page: Page,
  placeholder: string,
  keyword: string,
  optionText?: string,
) {
  const field = await resolveSystemUserSelectField(
    page,
    placeholder,
    optionText,
  );
  const combobox = field.getByRole('combobox').first();
  const wrapper = field.locator('.el-select__wrapper').first();
  const currentLabel = await readSystemUserSelectLabel(field);
  if (optionText && currentLabel === optionText) {
    return;
  }

  await expect(wrapper).toBeVisible();
  await wrapper.click();

  let listbox = page.getByRole('listbox').last();
  await expect(listbox).toBeVisible({ timeout: 10_000 });

  if (optionText) {
    let exactOption = listbox.getByRole('option', { name: optionText }).first();
    if (!(await exactOption.isVisible().catch(() => false))) {
      await combobox.fill('');
      await combobox.fill(keyword);
      listbox = page.getByRole('listbox').last();
      await expect(listbox).toBeVisible({ timeout: 10_000 });
      exactOption = listbox.getByRole('option', { name: optionText }).first();
    }
    await expect(exactOption).toBeVisible({ timeout: 10_000 });
    await exactOption.click();
  } else {
    const options = listbox.getByRole('option');
    const count = await options.count();
    for (let index = 0; index < count; index += 1) {
      const option = options.nth(index);
      const text = ((await option.textContent().catch(() => '')) || '').trim();
      const isSelected = await option.getAttribute('aria-selected');
      if (text && isSelected !== 'true') {
        await option.click();
        break;
      }
    }
  }

  if (optionText) {
    await expect
      .poll(async () => readSystemUserSelectLabel(field), { timeout: 5000 })
      .toContain(optionText);
    return;
  }

  await expect
    .poll(async () => readSystemUserSelectLabel(field), { timeout: 5000 })
    .not.toBe(currentLabel);
}

async function resolveSystemUserSelectField(
  page: Page,
  placeholder: string,
  selectedText?: string,
) {
  const fields = page.locator('.el-select');
  const count = await fields.count();
  let firstVisibleField: Locator | null = null;

  for (let index = 0; index < count; index += 1) {
    const field = fields.nth(index);
    if (!(await field.isVisible().catch(() => false))) {
      continue;
    }

    firstVisibleField ??= field;
    const placeholderInput = field.getByPlaceholder(placeholder).first();
    if (await placeholderInput.isVisible().catch(() => false)) {
      return field;
    }

    if (!selectedText) {
      continue;
    }

    const currentLabel = await readSystemUserSelectLabel(field);
    if (currentLabel === selectedText) {
      return field;
    }
  }

  if (firstVisibleField) {
    return firstVisibleField;
  }

  return page.locator('.el-select').first();
}

async function readSystemUserSelectLabel(field: Locator) {
  const combobox = field.getByRole('combobox').first();
  const inputValue = (
    (await combobox.inputValue().catch(() => '')) || ''
  ).trim();
  if (inputValue) {
    return inputValue;
  }

  const selectedItemText = (
    (await field.textContent().catch(() => '')) || ''
  ).trim();
  return selectedItemText;
}

export class FixationTransportPage {
  constructor(private readonly page: Page) {}

  async checkInSpecimens(identifier: string) {
    await this.stageCheckIn(identifier);
    const [checkInResponse] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          /\/api\/v1\/specimens\/barcodes\/.+\/check-in$/.test(response.url()),
      ),
      this.page.getByRole('button', { name: '标本入库' }).click(),
    ]);

    expect(checkInResponse.ok(), '标本入库接口返回失败。').toBeTruthy();
    await waitForToast(this.page, '标本入库成功');
  }

  async completeFixation(identifier: string) {
    await waitForTableRow(this.page, identifier);
    const row = this.page
      .locator('.el-table__row:visible')
      .filter({ hasText: identifier })
      .first();
    const checkbox = row.locator('.el-checkbox').first();
    await expect(checkbox).toBeVisible();
    await checkbox.click();
    await expect(row.locator('.el-checkbox__input').first()).toHaveClass(
      /is-checked/,
    );

    const [completeResponse] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          response.url().includes('/api/v1/specimen-fixations/complete'),
      ),
      this.page.getByRole('button', { name: '确认固定' }).click(),
    ]);

    expect(
      completeResponse.ok(),
      `标本 ${identifier} 的完成固定接口返回失败。`,
    ).toBeTruthy();
    await waitForToast(this.page, '已完成 1 条标本固定');
  }

  async confirmRemoval(identifier: string) {
    const quickInput = this.page
      .getByPlaceholder('请输入标本条码/编号后按回车确认')
      .first();
    await quickInput.click();
    await quickInput.fill(identifier);

    const [confirmResponse] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          response
            .url()
            .includes('/api/v1/specimen-removals/confirm-by-identifier'),
      ),
      quickInput.press('Enter'),
    ]);

    expect(
      confirmResponse.ok(),
      `标本 ${identifier} 的离体确认接口返回失败。`,
    ).toBeTruthy();
    await waitForToast(this.page, `标本 ${identifier} 已完成离体确认`);
  }

  async confirmSpecimens(identifier: string) {
    await this.stageConfirmation(identifier);
    await selectSystemUser(
      this.page,
      '选择确认人',
      e2eEnv.roles.transport.username,
      '转运交接员',
    );

    const tokenResponsePromise = this.page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes('/api/v1/operator-verifications'),
    );
    const confirmResponsePromise = this.page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        /\/api\/v1\/specimens\/barcodes\/.+\/confirm$/.test(response.url()),
    );
    await this.page.getByRole('button', { name: '标本确认' }).click();
    await this.submitOperatorVerificationPrompt();
    const [tokenResponse, confirmResponse] = await Promise.all([
      tokenResponsePromise,
      confirmResponsePromise,
    ]);

    expect(tokenResponse.ok(), '操作人校验接口返回失败。').toBeTruthy();
    expect(confirmResponse.ok(), '标本确认接口返回失败。').toBeTruthy();
    await waitForToast(this.page, '已完成 1 条标本确认');
  }

  async createTransportOrder(identifier: string | string[]) {
    const identifiers = Array.isArray(identifier) ? identifier : [identifier];
    for (const item of identifiers) {
      await this.stageTransport(item);
    }
    await selectSystemUser(
      this.page,
      '选择出库人',
      e2eEnv.roles.transport.username,
      '转运交接员',
    );

    const tokenResponsePromise = this.page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes('/api/v1/operator-verifications'),
    );
    const [tokenResponse, createResponse, outboundResponse] = await Promise.all(
      [
        tokenResponsePromise,
        this.page.waitForResponse(
          (response) =>
            response.request().method() === 'POST' &&
            response.url().endsWith('/api/v1/transport-orders'),
        ),
        this.page.waitForResponse(
          (response) =>
            response.request().method() === 'POST' &&
            /\/api\/v1\/transport-orders\/.+\/outbound$/.test(response.url()),
        ),
        (async () => {
          await this.page.getByRole('button', { name: '转运' }).click();
          await this.submitOperatorVerificationPrompt();
        })(),
      ],
    );

    expect(tokenResponse.ok(), '操作人校验接口返回失败。').toBeTruthy();
    expect(createResponse.ok(), '创建转运单接口返回失败。').toBeTruthy();
    expect(outboundResponse.ok(), '标本出库接口返回失败。').toBeTruthy();
    await waitForToast(this.page, '标本转运成功');
    const payload = await outboundResponse.json();
    return payload.data as TransportOrderResult;
  }

  async gotoCheckIn() {
    await this.page.goto('/workflow/fixation-transport?tab=check-in', {
      waitUntil: 'domcontentloaded',
    });
    await expect(
      this.page.getByRole('tab', { name: '标本入库', selected: true }),
    ).toBeVisible();
    await expect(
      this.page.getByPlaceholder('标本id / 流水号 / 条码'),
    ).toBeVisible();
  }

  async gotoConfirmation() {
    await this.page.goto('/workflow/fixation-transport?tab=confirmation', {
      waitUntil: 'domcontentloaded',
    });
    await expect(
      this.page.getByRole('tab', { name: '标本确认', selected: true }),
    ).toBeVisible();
    await expect(
      this.page.getByPlaceholder('申请单号 / 标本编号 / 条码'),
    ).toBeVisible();
  }

  async gotoFixation() {
    await this.page.goto('/workflow/fixation-transport?tab=fixation', {
      waitUntil: 'domcontentloaded',
    });
    await expect(this.page.getByText('标本固定')).toBeVisible();
    await expect(
      this.page.getByPlaceholder('请输入标本号或条码'),
    ).toBeVisible();
  }

  async gotoTransport() {
    await this.page.goto('/workflow/fixation-transport?tab=transport', {
      waitUntil: 'domcontentloaded',
    });
    await expect(
      this.page.getByRole('tab', { name: '标本出库', selected: true }),
    ).toBeVisible();
    await expect(
      this.page.getByPlaceholder('请输入标本条码/编号'),
    ).toBeVisible();
  }

  async gotoVerification() {
    await this.page.goto('/workflow/fixation-verify', {
      waitUntil: 'domcontentloaded',
    });
    await this.page.getByRole('tab', { name: '离体确认' }).click();
    await expect(
      this.page.getByPlaceholder('请输入标本条码/编号后按回车确认'),
    ).toBeVisible();
  }

  async stageCheckIn(identifier: string) {
    const scanInput = this.page
      .getByPlaceholder('标本id / 流水号 / 条码')
      .first();
    await scanInput.click();
    await scanInput.fill(identifier);
    await scanInput.press('Enter');
    await waitForTableRow(this.page, identifier);
  }

  async stageConfirmation(identifier: string) {
    const keywordInput = this.page
      .getByPlaceholder('申请单号 / 标本编号 / 条码')
      .first();
    await keywordInput.click();
    await keywordInput.fill(identifier);
    await keywordInput.press('Enter');
    await waitForTableRow(this.page, identifier);
    await keywordInput.fill('');
  }

  async stageTransport(identifier: string) {
    const identifierInput = this.page
      .getByPlaceholder('请输入标本条码/编号')
      .first();
    await identifierInput.click();
    await identifierInput.fill(identifier);
    await identifierInput.press('Enter');
    await waitForTableRow(this.page, identifier);
    await identifierInput.fill('');
  }

  async startFixation(identifier: string) {
    const scanInput = this.page.getByPlaceholder('请输入标本号或条码').first();
    await scanInput.click();
    await scanInput.fill(identifier);

    const [startResponse] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          response.url().includes('/api/v1/specimen-fixations/start'),
      ),
      this.page.getByRole('button', { name: '查询' }).click(),
    ]);

    expect(
      startResponse.ok(),
      `标本 ${identifier} 的开始固定接口返回失败。`,
    ).toBeTruthy();
    await waitForToast(this.page, '已开始固定');
    await waitForTableRow(this.page, identifier);
  }

  private async submitOperatorVerificationPrompt() {
    const prompt = this.page
      .locator('.el-message-box:visible')
      .filter({ hasText: '用户验证' })
      .last();
    await expect(prompt).toBeVisible();
    await prompt.locator('input[type="password"]').fill(e2eEnv.password);
    await prompt.getByRole('button', { name: '确认' }).click();
  }
}
