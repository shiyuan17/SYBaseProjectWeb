import type { SpecimenManagementListItem } from '../types/specimen-workflow';

const RECEIPT_LOCKED_STATUSES = new Set(['RECEIVED', 'REJECTED', 'RETURNED']);
const CHECKED_IN_STATUS = 'CHECKED_IN';
const COMPLETED_FIXATION_STATUS = 'COMPLETED';
const VERIFIED_STATUS = 'VERIFIED';

export type CheckInBlockingStep =
  | 'CHECKED_IN'
  | 'CONFIRMATION'
  | 'FIXATION'
  | 'RECEIPT_TERMINAL'
  | 'VERIFICATION';

export type CheckInReadiness = {
  blockingOwnSpecimen: boolean;
  blockingSpecimenNos: string[];
  blockingStep: CheckInBlockingStep | null;
  canCheckIn: boolean;
  reason: null | string;
};

export function normalizeText(value?: null | string) {
  return value?.trim() ?? '';
}

export function isReceiptLocked(row: SpecimenManagementListItem) {
  return RECEIPT_LOCKED_STATUSES.has(row.specimenStatus ?? '');
}

function isCheckedIn(row: SpecimenManagementListItem) {
  return normalizeText(row.checkInStatus) === CHECKED_IN_STATUS;
}

function isVerificationReady(row: SpecimenManagementListItem) {
  return normalizeText(row.verificationStatus) === VERIFIED_STATUS;
}

function isFixationReady(row: SpecimenManagementListItem) {
  return normalizeText(row.fixationStatus) === COMPLETED_FIXATION_STATUS;
}

function isConfirmationReady(row: SpecimenManagementListItem) {
  return Boolean(row.specimenConfirmedAt);
}

function resolveDisplaySpecimenNo(row: SpecimenManagementListItem) {
  return (
    normalizeText(row.specimenNo) ||
    normalizeText(row.barcode) ||
    normalizeText(row.specimenId) ||
    '当前标本'
  );
}

function resolveOwnBlocker(
  row: SpecimenManagementListItem,
): CheckInBlockingStep | null {
  if (isReceiptLocked(row)) {
    return 'RECEIPT_TERMINAL';
  }
  if (isCheckedIn(row)) {
    return 'CHECKED_IN';
  }
  if (!isVerificationReady(row)) {
    return 'VERIFICATION';
  }
  if (!isFixationReady(row)) {
    return 'FIXATION';
  }
  if (!isConfirmationReady(row)) {
    return 'CONFIRMATION';
  }
  return null;
}

function buildReason(specimenNos: string[], step: CheckInBlockingStep) {
  if (step === 'CHECKED_IN') {
    return '标本已完成入库，无需重复操作';
  }
  if (step === 'RECEIPT_TERMINAL') {
    return '标本已接收、拒收或退回，不能再入库';
  }

  const subject = `标本 ${specimenNos[0]}`;

  if (step === 'VERIFICATION') {
    return `${subject} 尚未完成核对，不能入库`;
  }
  if (step === 'FIXATION') {
    return `${subject} 尚未完成固定，不能入库`;
  }
  return `${subject} 尚未完成标本确认，不能入库`;
}

export function resolveCheckInReadiness(
  row: SpecimenManagementListItem,
  _applicationRows: SpecimenManagementListItem[] = [row],
): CheckInReadiness {
  const ownBlocker = resolveOwnBlocker(row);
  if (ownBlocker) {
    const specimenNos = [resolveDisplaySpecimenNo(row)];
    return {
      blockingOwnSpecimen: true,
      blockingSpecimenNos: specimenNos,
      blockingStep: ownBlocker,
      canCheckIn: false,
      reason: buildReason(specimenNos, ownBlocker),
    };
  }

  return {
    blockingOwnSpecimen: false,
    blockingSpecimenNos: [],
    blockingStep: null,
    canCheckIn: true,
    reason: null,
  };
}

export function isCheckInReady(
  row: SpecimenManagementListItem,
  applicationRows: SpecimenManagementListItem[] = [row],
) {
  return resolveCheckInReadiness(row, applicationRows).canCheckIn;
}

export function isVisibleInCheckInScene(row: SpecimenManagementListItem) {
  return isCheckInReady(row);
}

export function resolveExactMatches(
  items: SpecimenManagementListItem[],
  keyword: string,
) {
  const normalizedKeyword = normalizeText(keyword).toLowerCase();
  return items.filter((item) =>
    [item.specimenId, item.specimenNo, item.barcode].some(
      (value) => normalizeText(value).toLowerCase() === normalizedKeyword,
    ),
  );
}

export function resolveUnavailableMessage(
  items: SpecimenManagementListItem[],
  keyword: string,
) {
  const exactMatches = resolveExactMatches(items, keyword);
  if (exactMatches.length === 0) {
    return '未找到可入库标本';
  }

  const targetItems = exactMatches;
  const targetItem = targetItems[0];
  if (!targetItem) {
    return '未找到可入库标本';
  }

  const readiness = resolveCheckInReadiness(targetItem, items);
  if (!readiness.canCheckIn) {
    return readiness.reason ?? '当前标本暂不能入库';
  }

  return '未找到可入库标本';
}
