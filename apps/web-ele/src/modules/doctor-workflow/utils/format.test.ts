import { describe, expect, it } from 'vitest';

import {
  formatArchiveStatus,
  formatDateTime,
  formatLifecycleNodeStatus,
  formatLoanStatus,
  formatReportDeliveryStatus,
  formatReportPrintStatus,
  formatReportStatus,
} from './format';

describe('doctor-workflow format utils', () => {
  it('formats report lifecycle status labels', () => {
    expect(formatReportStatus('SIGNED')).toBe('已签发');
    expect(formatReportStatus('PUBLISHED')).toBe('已发布');
  });

  it('formats report distribution status labels', () => {
    expect(formatReportPrintStatus('UNPRINTED')).toBe('未打印');
    expect(formatReportPrintStatus('PRINTED')).toBe('已打印');
    expect(formatReportDeliveryStatus('PENDING')).toBe('待发放');
    expect(formatReportDeliveryStatus('ISSUED')).toBe('已发放');
    expect(formatReportDeliveryStatus('RECALLED')).toBe('已回收');
  });

  it('formats iso datetime strings for report list columns', () => {
    expect(formatDateTime('2026-06-15T10:30:00')).toBe('2026-06-15 10:30:00');
  });

  it('formats lifecycle and archive related status labels', () => {
    expect(formatLifecycleNodeStatus('PENDING')).toBe('未发生');
    expect(formatLifecycleNodeStatus('IN_STORAGE')).toBe('已归档');
    expect(formatArchiveStatus('IN_STORAGE')).toBe('已归档');
    expect(formatArchiveStatus('PENDING')).toBe('未归档');
    expect(formatLoanStatus('NONE')).toBe('未借阅');
    expect(formatLoanStatus('BORROWED')).toBe('借出中');
  });
});
