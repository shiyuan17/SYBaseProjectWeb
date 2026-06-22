import { describe, expect, it } from 'vitest';

import { buildRoutineOrderPrintDocument } from './routine-order-print';

describe('routine-order-print', () => {
  it('falls back to placeholder text when label fields are missing', () => {
    const document = buildRoutineOrderPrintDocument([
      {
        blockNo: null,
        checkItem: null,
        orderId: 'ORDER-1',
        pathologyNo: null,
        patientId: null,
        patientIdDisplay: null,
        patientName: null,
        slideNo: null,
        specimenNo: null,
      },
    ]);

    expect(document).toContain('<div class="primary">-</div>');
    expect(document).toContain('病理号：-');
    expect(document).toContain('蜡块号：-');
    expect(document).toContain('患者：- / -');
    expect(document).toContain('<div class="name">-</div>');
  });

  it('prefers block number before specimen number in print content', () => {
    const document = buildRoutineOrderPrintDocument([
      {
        blockNo: 'A1',
        checkItem: 'HE染色',
        orderId: 'ORDER-1',
        pathologyNo: 'BL-001',
        patientId: 'P-1',
        patientIdDisplay: '08305',
        patientName: '患者甲',
        slideNo: 'SLIDE-001',
        specimenNo: 'SPEC-001',
      },
    ]);

    expect(document).toContain('蜡块号：A1');
    expect(document).not.toContain('蜡块号：SPEC-001');
  });
});
