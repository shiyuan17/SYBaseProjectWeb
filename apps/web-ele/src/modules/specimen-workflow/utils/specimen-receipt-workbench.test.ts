import { describe, expect, it } from 'vitest';

import {
  isReceiptWorkbenchRowReceivable,
  resolveReceiptWorkbenchStatusTagType,
} from './specimen-receipt-workbench';

describe('specimen receipt workbench helpers', () => {
  it('prefers specimen status for exceptional receipt tag tones', () => {
    expect(resolveReceiptWorkbenchStatusTagType('SUCCESS', 'REJECTED')).toBe(
      'danger',
    );
    expect(resolveReceiptWorkbenchStatusTagType('SUCCESS', 'RETURNED')).toBe(
      'warning',
    );
    expect(resolveReceiptWorkbenchStatusTagType('SUCCESS', 'RECEIVED')).toBe(
      'success',
    );
  });

  it('allows rejected rows with canReceive to be selected for re-receipt', () => {
    expect(
      isReceiptWorkbenchRowReceivable({
        canReceive: true,
        queueStatus: 'SUCCESS',
        specimenStatus: 'REJECTED',
      } as any),
    ).toBe(true);
    expect(
      isReceiptWorkbenchRowReceivable({
        canReceive: true,
        queueStatus: 'SUCCESS',
        specimenStatus: 'RECEIVED',
      } as any),
    ).toBe(false);
  });
});
