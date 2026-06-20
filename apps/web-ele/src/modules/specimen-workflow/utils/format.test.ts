import { describe, expect, it } from 'vitest';

import {
  formatCurrentNode,
  formatTrackingEventContent,
  formatTrackingEventType,
} from './format';

describe('format', () => {
  it('formats known current node values to Chinese labels', () => {
    expect(formatCurrentNode('REMOVAL')).toBe('离体确认');
    expect(formatCurrentNode('SPECIMEN_REGISTER')).toBe('标本登记');
    expect(formatCurrentNode('SPECIMEN_REGISTRATION')).toBe('标本登记');
    expect(formatCurrentNode('SUBMITTED')).toBe('已提交');
    expect(formatCurrentNode('TRANSPORT_HANDOVER')).toBe('转运交接');
    expect(formatCurrentNode('GROSSING')).toBe('取材');
    expect(formatCurrentNode('SLICING')).toBe('切片');
    expect(formatCurrentNode('DIAGNOSIS_ASSIGN')).toBe('诊断分配');
    expect(formatCurrentNode('MEDICAL_ORDER_CREATE')).toBe('医嘱开立');
    expect(formatCurrentNode('REPORT_PUBLISHED')).toBe('报告发布');
  });

  it('returns a dash for empty current node values', () => {
    expect(formatCurrentNode(null)).toBe('-');
    expect(formatCurrentNode('')).toBe('-');
    expect(formatCurrentNode('   ')).toBe('-');
  });

  it('falls back to the original current node value when no mapping exists', () => {
    expect(formatCurrentNode('UNKNOWN_NODE')).toBe('UNKNOWN_NODE');
  });

  it('formats known tracking event types to Chinese labels', () => {
    expect(formatTrackingEventType('BOUND')).toBe('绑定条码');
    expect(formatTrackingEventType('REGISTERED')).toBe('登记标本');
    expect(formatTrackingEventType('VERIFY_MATERIAL')).toBe('核对材块');
  });

  it('localizes tracking event content and falls back to event type', () => {
    expect(
      formatTrackingEventContent({
        eventContent: 'Specimen barcode bound to BD1011',
        eventType: 'BOUND',
      }),
    ).toBe('绑定条码 BD1011');
    expect(
      formatTrackingEventContent({
        eventContent: '创建转运单',
        eventType: 'ORDER_CREATED',
      }),
    ).toBe('创建转运单');
    expect(
      formatTrackingEventContent({
        eventContent: null,
        eventType: 'ORDER_CREATED',
      }),
    ).toBe('创建转运单');
  });
});
