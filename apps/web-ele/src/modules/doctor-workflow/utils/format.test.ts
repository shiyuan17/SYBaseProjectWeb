import { describe, expect, it } from 'vitest';

import {
  formatArchiveStatus,
  formatCaseStatus,
  formatDateTime,
  formatLifecycleNodeStatus,
  formatLoanStatus,
  formatQualityStatus,
  formatReceiptStatus,
  formatReworkStatus,
  formatReportDeliveryStatus,
  formatReportPrintStatus,
  formatReportStatus,
  formatSlideStatus,
  formatSpecimenStatus,
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

  it('formats report tracking case and specimen related status labels', () => {
    expect(formatCaseStatus('SIGNED')).toBe('已签发');
    expect(formatCaseStatus('IN_DIAGNOSIS')).toBe('诊断中');
    expect(formatSpecimenStatus('RECEIVED')).toBe('已接收');
    expect(formatReceiptStatus('PARTIALLY_RECEIVED')).toBe('部分接收');
    expect(formatSlideStatus('COMPLETED')).toBe('已完成');
    expect(formatQualityStatus('PASS')).toBe('合格');
    expect(formatQualityStatus('REWORK_REQUIRED')).toBe('需返工');
    expect(formatReworkStatus('IN_PROGRESS')).toBe('返工中');
  });

  it('falls back to the original value for unknown tracking statuses', () => {
    expect(formatCaseStatus('UNKNOWN_CASE_STATUS')).toBe('UNKNOWN_CASE_STATUS');
    expect(formatSpecimenStatus('UNKNOWN_SPECIMEN_STATUS')).toBe(
      'UNKNOWN_SPECIMEN_STATUS',
    );
    expect(formatQualityStatus('UNKNOWN_QUALITY_STATUS')).toBe(
      'UNKNOWN_QUALITY_STATUS',
    );
  });
});
