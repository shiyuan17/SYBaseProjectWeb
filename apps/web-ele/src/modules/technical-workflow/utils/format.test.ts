import { describe, expect, it } from 'vitest';

import {
  formatCaseStatus,
  formatEventType,
  formatSlicingSlideDisplayNo,
  formatTechnicalTrackingApplicationType,
  formatTechnicalTrackingEventContent,
  formatTrackingTreeNodeStatus,
} from './format';

describe('formatSlicingSlideDisplayNo', () => {
  it('prefers slideNo when present', () => {
    expect(formatSlicingSlideDisplayNo('A1', 'A1')).toBe('A1');
    expect(formatSlicingSlideDisplayNo('A1-A2', 'A1+A2')).toBe('A1-A2');
  });

  it('falls back to embeddingBoxNo when slideNo is empty', () => {
    expect(formatSlicingSlideDisplayNo(null, 'A1')).toBe('A1');
    expect(formatSlicingSlideDisplayNo('  ', 'B2')).toBe('B2');
  });

  it('converts merged embedding box fallback from plus to hyphen', () => {
    expect(formatSlicingSlideDisplayNo(null, 'A1+A2')).toBe('A1-A2');
    expect(formatSlicingSlideDisplayNo('', 'B1+B2')).toBe('B1-B2');
  });

  it('returns dash when both slideNo and embeddingBoxNo are empty', () => {
    expect(formatSlicingSlideDisplayNo(null, null)).toBe('-');
    expect(formatSlicingSlideDisplayNo('', '  ')).toBe('-');
  });
});

describe('formatTechnicalTrackingEventContent', () => {
  it('keeps existing Chinese event content unchanged', () => {
    expect(
      formatTechnicalTrackingEventContent({
        eventContent: '完成取材',
        eventStatus: 'SUCCESS',
        eventType: 'START',
        nodeCode: 'GROSSING',
      }),
    ).toBe('完成取材');
  });

  it('falls back to structured Chinese content for known English events', () => {
    expect(
      formatTechnicalTrackingEventContent({
        eventContent: 'Specimen received',
        eventStatus: 'SUCCESS',
        eventType: 'CREATE',
        nodeCode: 'RECEIVED',
      }),
    ).toBe('标本已接收');

    expect(
      formatTechnicalTrackingEventContent({
        eventContent: 'Technical specimen registration materials saved',
        eventStatus: 'SUCCESS',
        eventType: 'SAVE_MATERIALS',
        nodeCode: 'TECHNICAL_SPECIMEN_REGISTRATION',
      }),
    ).toBe('技术标本登记材料已保存');

    expect(
      formatTechnicalTrackingEventContent({
        eventContent: 'Technical specimen registration completed',
        eventStatus: 'SUCCESS',
        eventType: 'COMPLETE',
        nodeCode: 'TECHNICAL_SPECIMEN_REGISTRATION',
      }),
    ).toBe('技术标本登记已完成');

    expect(
      formatTechnicalTrackingEventContent({
        eventContent: 'Grossing started',
        eventStatus: 'SUCCESS',
        eventType: 'START',
        nodeCode: 'GROSSING',
      }),
    ).toBe('取材开始');

    expect(
      formatTechnicalTrackingEventContent({
        eventContent: 'Grossing task created',
        eventStatus: 'SUCCESS',
        eventType: 'CREATE',
        nodeCode: 'GROSSING',
      }),
    ).toBe('取材任务已创建');

    expect(
      formatTechnicalTrackingEventContent({
        eventContent: 'Dehydration completed',
        eventStatus: 'SUCCESS',
        eventType: 'COMPLETE',
        nodeCode: 'DEHYDRATION',
      }),
    ).toBe('脱水完成');

    expect(
      formatTechnicalTrackingEventContent({
        eventContent: 'Slicing completed',
        eventStatus: 'SUCCESS',
        eventType: 'COMPLETE',
        nodeCode: 'SLICING',
      }),
    ).toBe('切片完成');

    expect(
      formatTechnicalTrackingEventContent({
        eventContent: 'Staining completed',
        eventStatus: 'SUCCESS',
        eventType: 'COMPLETE',
        nodeCode: 'STAINING',
      }),
    ).toBe('染色出片完成');
  });

  it('does not expose unknown English content directly', () => {
    expect(
      formatTechnicalTrackingEventContent({
        eventContent: 'Unexpected english content',
        eventStatus: 'SUCCESS',
        eventType: 'SYNC',
        nodeCode: 'UNKNOWN_NODE',
      }),
    ).toBe('技术流程事件');
  });

  it('uses structured Chinese fallback when content is empty', () => {
    expect(
      formatTechnicalTrackingEventContent({
        eventContent: '  ',
        eventStatus: 'SUCCESS',
        eventType: 'COMPLETE',
        nodeCode: 'TECHNICAL_SPECIMEN_REGISTRATION',
      }),
    ).toBe('技术标本登记已完成');
  });
});

describe('formatTechnicalTrackingApplicationType', () => {
  it('formats known application types into Chinese labels', () => {
    expect(formatTechnicalTrackingApplicationType('ROUTINE')).toBe('常规');
    expect(formatTechnicalTrackingApplicationType('FROZEN')).toBe('冰冻');
    expect(formatTechnicalTrackingApplicationType('CONSULTATION')).toBe('会诊');
    expect(
      formatTechnicalTrackingApplicationType('CYTOLOGY_CONSULTATION'),
    ).toBe('细胞学会诊');
  });
});

describe('formatCaseStatus', () => {
  it('formats report lifecycle statuses into Chinese labels', () => {
    expect(formatCaseStatus('REPORT_SIGNED')).toBe('已签发');
    expect(formatCaseStatus('REPORT_PUBLISHED')).toBe('已发布报告');
    expect(formatCaseStatus('DIAGNOSIS_PENDING')).toBe('待诊断');
  });
});

describe('formatEventType', () => {
  it('maps known technical tracking event codes to Chinese labels', () => {
    expect(formatEventType('CREATE')).toBe('创建');
    expect(formatEventType('SAVE_MATERIALS')).toBe('保存材料');
    expect(formatEventType('UPLOAD_MEDIA')).toBe('上传影像');
    expect(formatEventType('UPLOAD')).toBe('上传');
  });

  it('does not expose unknown uppercase event codes directly', () => {
    expect(formatEventType('UNEXPECTED_EVENT')).toBe('流程事件');
  });
});

describe('formatTrackingTreeNodeStatus', () => {
  it('formats status by tracking node type', () => {
    expect(formatTrackingTreeNodeStatus('SPECIMEN', 'RECEIVED')).toBe('已接收');
    expect(formatTrackingTreeNodeStatus('SLIDE', 'PRINTED')).toBe('已打印');
    expect(formatTrackingTreeNodeStatus('CASE', 'COMPLETED')).toBe('已完成');
  });
});
