import type { CheckInQueueItem } from '../composables/useSpecimenCheckInPanel';
import type { SpecimenManagementListItem } from '../types/specimen-workflow';
import type { ConfirmationListRow } from './specimen-confirmation';
import type { FixationWorkbenchRow } from './specimen-fixation-time';
import type { ReceiptWorkbenchRow } from './specimen-receipt-workbench';
import type { RemovalDisplayRow } from './specimen-removal-display';
import type { SpecimenOutboundDisplayItem } from './transport-handover';

export type SpecimenWorkflowRowTone =
  | 'actionable'
  | 'blocked'
  | 'completed'
  | 'draft'
  | 'failed'
  | 'in-progress';

const RECEIPT_TERMINAL_STATUSES = new Set(['RECEIVED', 'REJECTED', 'RETURNED']);

function normalizeText(value?: null | string) {
  return value?.trim().toUpperCase() ?? '';
}

function isReceiptTerminalStatus(status?: null | string) {
  return RECEIPT_TERMINAL_STATUSES.has(normalizeText(status));
}

export function resolveSpecimenWorkflowRowClassName(
  tone: null | SpecimenWorkflowRowTone | undefined,
) {
  return tone ? `specimen-workflow-row--${tone}` : '';
}

export function resolveRemovalWorkflowRowTone(row: RemovalDisplayRow) {
  if (row.specimenRemovalAt) {
    return 'completed' satisfies SpecimenWorkflowRowTone;
  }
  return row.sceneMatched && !row.actionDisabledReason
    ? ('actionable' satisfies SpecimenWorkflowRowTone)
    : ('blocked' satisfies SpecimenWorkflowRowTone);
}

export function resolveFixationWorkflowRowTone(row: FixationWorkbenchRow) {
  if (
    normalizeText(row.fixationStatus) === 'COMPLETED' ||
    normalizeText(row.specimenStatus) === 'FIXED'
  ) {
    return 'completed' satisfies SpecimenWorkflowRowTone;
  }
  if (
    isReceiptTerminalStatus(row.specimenStatus) ||
    normalizeText(row.verificationStatus) !== 'VERIFIED'
  ) {
    return 'blocked' satisfies SpecimenWorkflowRowTone;
  }
  if (
    normalizeText(row.fixationStatus) === 'FIXING' ||
    normalizeText(row.specimenStatus) === 'FIXING'
  ) {
    return 'in-progress' satisfies SpecimenWorkflowRowTone;
  }
  return 'actionable' satisfies SpecimenWorkflowRowTone;
}

export function resolveConfirmationWorkflowRowTone(
  row: ConfirmationListRow,
  options: {
    canConfirm: boolean;
    isDraft: boolean;
  },
) {
  if (row.specimenConfirmedAt) {
    return 'completed' satisfies SpecimenWorkflowRowTone;
  }
  if (options.isDraft) {
    return 'draft' satisfies SpecimenWorkflowRowTone;
  }
  return options.canConfirm
    ? ('actionable' satisfies SpecimenWorkflowRowTone)
    : ('blocked' satisfies SpecimenWorkflowRowTone);
}

export function resolveCheckInWorkflowRowTone(row: CheckInQueueItem) {
  if (row.queueStatus === 'FAILED') {
    return 'failed' satisfies SpecimenWorkflowRowTone;
  }
  if (
    row.queueStatus === 'SUCCESS' ||
    normalizeText(row.checkInStatus) === 'CHECKED_IN'
  ) {
    return 'completed' satisfies SpecimenWorkflowRowTone;
  }
  if (row.checkInDraft) {
    return 'draft' satisfies SpecimenWorkflowRowTone;
  }
  return row.canCheckIn
    ? ('actionable' satisfies SpecimenWorkflowRowTone)
    : ('blocked' satisfies SpecimenWorkflowRowTone);
}

export function resolveReceiptWorkflowRowTone(row: ReceiptWorkbenchRow) {
  if (row.queueStatus === 'FAILED') {
    return 'failed' satisfies SpecimenWorkflowRowTone;
  }
  if (row.queueStatus === 'SUCCESS' || row.queueStatus === 'RECEIVED') {
    return 'completed' satisfies SpecimenWorkflowRowTone;
  }
  if (row.queueStatus === 'OUT_OF_SCOPE') {
    return 'blocked' satisfies SpecimenWorkflowRowTone;
  }
  return row.canReceive
    ? ('actionable' satisfies SpecimenWorkflowRowTone)
    : ('blocked' satisfies SpecimenWorkflowRowTone);
}

export function resolveOutboundWorkflowRowTone(
  row: SpecimenOutboundDisplayItem,
) {
  if (row.outboundDraft) {
    return 'draft' satisfies SpecimenWorkflowRowTone;
  }
  if (row.outboundAt || normalizeText(row.specimenStatus) === 'IN_TRANSIT') {
    return 'completed' satisfies SpecimenWorkflowRowTone;
  }
  if (!row.canOutbound || isReceiptTerminalStatus(row.specimenStatus)) {
    return 'blocked' satisfies SpecimenWorkflowRowTone;
  }
  return 'actionable' satisfies SpecimenWorkflowRowTone;
}

export function resolveSpecimenManagementRowTone(
  row: SpecimenManagementListItem,
) {
  if (isReceiptTerminalStatus(row.specimenStatus)) {
    return 'blocked' satisfies SpecimenWorkflowRowTone;
  }
  return null;
}
