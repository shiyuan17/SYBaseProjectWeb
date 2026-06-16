import { describe, expect, it } from 'vitest';

import {
  buildCreateWhiteSlideLoanRequest,
  buildDraftWhiteSlideLoanView,
  buildWhiteSlideBorrowPrintHtml,
  calculateWhiteSlideAmount,
  createWhiteSlideBorrowFormDefaults,
  validateWhiteSlideBorrowForm,
} from './white-slide-borrow';

describe('white-slide-borrow utils', () => {
  it('calculates amount from quantity and unit price', () => {
    expect(calculateWhiteSlideAmount({ quantity: 3, unitPrice: 2.5 })).toBe(
      7.5,
    );
    expect(
      calculateWhiteSlideAmount({ quantity: 3, unitPrice: null }),
    ).toBeNull();
  });

  it('validates required white slide fields', () => {
    const form = createWhiteSlideBorrowFormDefaults();
    expect(validateWhiteSlideBorrowForm(form)).toBe('请选择白片库存');

    form.stockId = 'WS-1';
    form.patientName = '患者甲';
    form.slicePurpose = '复检';
    form.sliceThickness = '4um';
    form.borrowerName = '张三';
    expect(validateWhiteSlideBorrowForm(form)).toBe('');
  });

  it('builds create request with trimmed optional fields', () => {
    const form = createWhiteSlideBorrowFormDefaults();
    Object.assign(form, {
      amount: 12,
      borrowerIdentityNo: ' 3201 ',
      borrowerName: ' 张三 ',
      borrowerPhone: ' 13800000000 ',
      borrowerUnit: ' 外院 ',
      embeddingBoxNo: ' BOX-01 ',
      pathologyNo: ' BL-01 ',
      patientName: ' 患者甲 ',
      quantity: 2,
      remarks: ' 备注 ',
      saveDirectPrint: true,
      slicePurpose: ' 会诊 ',
      sliceThickness: ' 4um ',
      stockId: 'WS-1',
      unitPrice: 6,
      waxBlockUsage: ' 剩余可用 ',
    });

    expect(buildCreateWhiteSlideLoanRequest(form)).toEqual({
      amount: 12,
      borrowerIdentityNo: '3201',
      borrowerName: '张三',
      borrowerPhone: '13800000000',
      borrowerUnit: '外院',
      embeddingBoxNo: 'BOX-01',
      pathologyNo: 'BL-01',
      patientName: '患者甲',
      quantity: 2,
      remarks: '备注',
      saveDirectPrint: true,
      slicePurpose: '会诊',
      sliceThickness: '4um',
      stockId: 'WS-1',
      terminalCode: undefined,
      unitPrice: 6,
      waxBlockUsage: '剩余可用',
    });
  });

  it('builds printable html from draft form', () => {
    const form = createWhiteSlideBorrowFormDefaults();
    Object.assign(form, {
      borrowerName: '张三',
      patientName: '患者甲',
      pathologyNo: 'BL-01',
      quantity: 2,
      slicePurpose: '会诊',
      sliceThickness: '4um',
      stockId: 'WS-1',
      stockNo: 'WS-DEFAULT',
      unitPrice: 5,
      amount: 10,
    });

    const draftLoan = buildDraftWhiteSlideLoanView(form);
    const html = buildWhiteSlideBorrowPrintHtml(draftLoan);

    expect(html).toContain('白片借阅单');
    expect(html).toContain('患者甲');
    expect(html).toContain('BL-01');
    expect(html).toContain('window.print()');
  });
});
