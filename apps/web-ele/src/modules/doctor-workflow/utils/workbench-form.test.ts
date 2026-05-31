import { describe, expect, it } from 'vitest';

import {
  buildCancelMedicalOrderRequest,
  buildCreateMedicalOrderRequest,
  createDiagnosticTaskActionDefaults,
  createMedicalOrderDefaults,
  validateMedicalOrderForm,
} from './workbench-form';

describe('doctor workflow workbench form helpers', () => {
  it('creates task action and medical order defaults', () => {
    expect(createDiagnosticTaskActionDefaults('Alice')).toEqual({
      operatorName: 'Alice',
      remarks: '',
      terminalCode: '',
    });
    expect(
      createMedicalOrderDefaults('CASE-1', 'Alice', 'USER-1', 'TERM-1'),
    ).toEqual({
      caseId: 'CASE-1',
      operatorName: 'Alice',
      operatorUserId: 'USER-1',
      orderContent: '',
      orderType: '',
      remarks: '',
      terminalCode: 'TERM-1',
    });
  });

  it('validates required medical order fields in submit order', () => {
    const form = createMedicalOrderDefaults('', 'Alice');

    expect(validateMedicalOrderForm(form)).toBe('缺少病例 ID');

    form.caseId = 'CASE-1';
    expect(validateMedicalOrderForm(form)).toBe('请选择医嘱类型');

    form.orderType = 'SPECIAL_STAIN';
    expect(validateMedicalOrderForm(form)).toBe('请填写医嘱内容');

    form.orderContent = 'Special stain';
    expect(validateMedicalOrderForm(form)).toBe('');
  });

  it('builds trimmed create and cancel request payloads', () => {
    const form = createMedicalOrderDefaults(
      ' CASE-1 ',
      ' Alice ',
      ' USER-1 ',
      ' ',
    );
    Object.assign(form, {
      orderContent: ' Special stain ',
      orderType: 'SPECIAL_STAIN',
      remarks: ' Please process ',
    });

    expect(buildCreateMedicalOrderRequest(form)).toEqual({
      caseId: 'CASE-1',
      operatorName: 'Alice',
      operatorUserId: 'USER-1',
      orderContent: 'Special stain',
      orderType: 'SPECIAL_STAIN',
      remarks: 'Please process',
      terminalCode: undefined,
    });
    expect(
      buildCancelMedicalOrderRequest({
        operatorName: ' Alice ',
        operatorUserId: '',
        remarks: ' From workbench ',
        terminalCode: ' TERM-1 ',
      }),
    ).toEqual({
      operatorName: 'Alice',
      operatorUserId: undefined,
      remarks: 'From workbench',
      terminalCode: 'TERM-1',
    });
  });
});
