import type { SpecimenManagementListItem } from '../types/specimen-workflow';

const RECEIPT_LOCKED_STATUSES = new Set(['RECEIVED', 'REJECTED', 'RETURNED']);

export function normalizeText(value?: null | string) {
  return value?.trim() ?? '';
}

export function isReceiptLocked(row: SpecimenManagementListItem) {
  return RECEIPT_LOCKED_STATUSES.has(row.specimenStatus ?? '');
}

export function isCheckInReady(row: SpecimenManagementListItem) {
  return (
    row.checkInStatus !== 'CHECKED_IN' &&
    row.verificationStatus === 'VERIFIED' &&
    row.fixationStatus === 'COMPLETED' &&
    Boolean(row.specimenConfirmedAt) &&
    !isReceiptLocked(row)
  );
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

  if (targetItems.some((item) => isReceiptLocked(item))) {
    return '标本已接收、拒收或退回，不能再入库';
  }
  if (
    targetItems.some(
      (item) => normalizeText(item.checkInStatus) === 'CHECKED_IN',
    )
  ) {
    return '标本已完成入库，无需重复操作';
  }
  if (targetItems.some((item) => !item.specimenConfirmedAt)) {
    return '标本尚未完成标本确认，不能入库';
  }
  if (
    targetItems.some(
      (item) => normalizeText(item.fixationStatus) !== 'COMPLETED',
    )
  ) {
    return '标本尚未完成固定，不能入库';
  }
  if (
    targetItems.some(
      (item) => normalizeText(item.verificationStatus) !== 'VERIFIED',
    )
  ) {
    return '标本尚未完成核对，不能入库';
  }

  return '未找到可入库标本';
}
