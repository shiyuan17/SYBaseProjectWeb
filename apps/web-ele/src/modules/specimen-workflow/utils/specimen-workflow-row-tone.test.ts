import { describe, expect, it } from 'vitest';

import {
  resolveCheckInWorkflowRowTone,
  resolveConfirmationWorkflowRowTone,
  resolveFixationWorkflowRowTone,
  resolveOutboundWorkflowRowTone,
  resolveReceiptWorkflowRowTone,
  resolveRemovalWorkflowRowTone,
  resolveSpecimenWorkflowRowClassName,
} from './specimen-workflow-row-tone';

describe('specimen workflow row tone helpers', () => {
  it('resolves shared row class names', () => {
    expect(resolveSpecimenWorkflowRowClassName('actionable')).toBe(
      'specimen-workflow-row--actionable',
    );
    expect(resolveSpecimenWorkflowRowClassName(null)).toBe('');
  });

  it('resolves removal row tones', () => {
    expect(
      resolveRemovalWorkflowRowTone({
        actionDisabledReason: null,
        sceneMatched: true,
        specimenRemovalAt: null,
      } as never),
    ).toBe('actionable');
    expect(
      resolveRemovalWorkflowRowTone({
        actionDisabledReason: '标本已完成离体确认',
        sceneMatched: false,
        specimenRemovalAt: '2026-06-08 09:00:00',
      } as never),
    ).toBe('completed');
  });

  it('resolves fixation row tones', () => {
    expect(
      resolveFixationWorkflowRowTone({
        fixationStatus: 'PENDING',
        specimenStatus: 'REGISTERED',
        verificationStatus: 'VERIFIED',
      } as never),
    ).toBe('actionable');
    expect(
      resolveFixationWorkflowRowTone({
        fixationStatus: 'COMPLETED',
        specimenStatus: 'FIXED',
        verificationStatus: 'VERIFIED',
      } as never),
    ).toBe('completed');
    expect(
      resolveFixationWorkflowRowTone({
        fixationStatus: 'FIXING',
        specimenStatus: 'FIXING',
        verificationStatus: 'VERIFIED',
      } as never),
    ).toBe('in-progress');
    expect(
      resolveFixationWorkflowRowTone({
        fixationStatus: 'PENDING',
        specimenStatus: 'REGISTERED',
        verificationStatus: 'PENDING',
      } as never),
    ).toBe('blocked');
    expect(
      resolveFixationWorkflowRowTone({
        fixationStatus: 'PENDING',
        specimenStatus: 'RECEIVED',
        verificationStatus: 'VERIFIED',
      } as never),
    ).toBe('blocked');
  });

  it('resolves confirmation row tones', () => {
    expect(
      resolveConfirmationWorkflowRowTone(
        { specimenConfirmedAt: null } as never,
        { canConfirm: true, isDraft: false },
      ),
    ).toBe('actionable');
    expect(
      resolveConfirmationWorkflowRowTone(
        { specimenConfirmedAt: null } as never,
        { canConfirm: true, isDraft: true },
      ),
    ).toBe('draft');
    expect(
      resolveConfirmationWorkflowRowTone(
        { specimenConfirmedAt: '2026-06-08 09:00:00' } as never,
        { canConfirm: false, isDraft: false },
      ),
    ).toBe('completed');
    expect(
      resolveConfirmationWorkflowRowTone(
        { specimenConfirmedAt: null } as never,
        { canConfirm: false, isDraft: false },
      ),
    ).toBe('blocked');
  });

  it('resolves check-in row tones', () => {
    expect(
      resolveCheckInWorkflowRowTone({
        canCheckIn: true,
        checkInDraft: false,
        checkInStatus: 'NOT_CHECKED_IN',
        queueStatus: 'PENDING',
      } as never),
    ).toBe('actionable');
    expect(
      resolveCheckInWorkflowRowTone({
        canCheckIn: true,
        checkInDraft: true,
        checkInStatus: 'NOT_CHECKED_IN',
        queueStatus: 'PENDING',
      } as never),
    ).toBe('draft');
    expect(
      resolveCheckInWorkflowRowTone({
        canCheckIn: false,
        checkInDraft: false,
        checkInStatus: 'CHECKED_IN',
        queueStatus: 'SUCCESS',
      } as never),
    ).toBe('completed');
    expect(
      resolveCheckInWorkflowRowTone({
        canCheckIn: false,
        checkInDraft: false,
        checkInStatus: 'NOT_CHECKED_IN',
        queueStatus: 'FAILED',
      } as never),
    ).toBe('failed');
    expect(
      resolveCheckInWorkflowRowTone({
        canCheckIn: false,
        checkInDraft: false,
        checkInStatus: 'NOT_CHECKED_IN',
        queueStatus: 'PENDING',
      } as never),
    ).toBe('blocked');
  });

  it('resolves receipt row tones', () => {
    expect(
      resolveReceiptWorkflowRowTone({
        canReceive: true,
        queueStatus: 'PENDING',
      } as never),
    ).toBe('actionable');
    expect(
      resolveReceiptWorkflowRowTone({
        canReceive: false,
        queueStatus: 'SUCCESS',
      } as never),
    ).toBe('completed');
    expect(
      resolveReceiptWorkflowRowTone({
        canReceive: false,
        queueStatus: 'RECEIVED',
      } as never),
    ).toBe('completed');
    expect(
      resolveReceiptWorkflowRowTone({
        canReceive: false,
        queueStatus: 'FAILED',
      } as never),
    ).toBe('failed');
    expect(
      resolveReceiptWorkflowRowTone({
        canReceive: false,
        queueStatus: 'OUT_OF_SCOPE',
      } as never),
    ).toBe('blocked');
  });

  it('resolves outbound row tones', () => {
    expect(
      resolveOutboundWorkflowRowTone({
        canOutbound: true,
        outboundAt: null,
        outboundDraft: false,
        specimenStatus: 'CHECKED_IN',
      } as never),
    ).toBe('actionable');
    expect(
      resolveOutboundWorkflowRowTone({
        canOutbound: true,
        outboundAt: null,
        outboundDraft: true,
        specimenStatus: 'CHECKED_IN',
      } as never),
    ).toBe('draft');
    expect(
      resolveOutboundWorkflowRowTone({
        canOutbound: false,
        outboundAt: '2026-06-08 09:00:00',
        outboundDraft: false,
        specimenStatus: 'IN_TRANSIT',
      } as never),
    ).toBe('completed');
    expect(
      resolveOutboundWorkflowRowTone({
        canOutbound: false,
        outboundAt: null,
        outboundDraft: false,
        specimenStatus: 'RECEIVED',
      } as never),
    ).toBe('blocked');
  });
});
