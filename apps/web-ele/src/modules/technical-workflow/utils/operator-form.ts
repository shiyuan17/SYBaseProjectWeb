import type { TechnicalOperatorFormValue } from '../types/technical-workflow';

export function createTechnicalOperatorDefaults(userInfo?: {
  realName?: null | string;
  userId?: null | string;
}): TechnicalOperatorFormValue {
  return {
    operatorName: userInfo?.realName ?? '',
    operatorUserId: userInfo?.userId ?? '',
    remarks: '',
    terminalCode: '',
  };
}

export function assignTechnicalOperatorForm(
  target: TechnicalOperatorFormValue,
  userInfo?: {
    realName?: null | string;
    userId?: null | string;
  },
) {
  Object.assign(target, createTechnicalOperatorDefaults(userInfo));
}

export function normalizeTechnicalOperatorPayload(
  form: TechnicalOperatorFormValue,
) {
  return {
    remarks: form.remarks.trim() || null,
    terminalCode: form.terminalCode.trim() || null,
  };
}
