import type { SpecimenManagementListItem } from '../types/specimen-workflow';

const RECEIPT_LOCKED_STATUSES = new Set(['RECEIVED', 'REJECTED', 'RETURNED']);

export function normalizeText(value?: null | string) {
  return value?.trim() ?? '';
}

export function isReceiptLocked(row: SpecimenManagementListItem) {
  return RECEIPT_LOCKED_STATUSES.has(row.specimenStatus ?? '');
}

function isApplicationCheckInReady(rows: SpecimenManagementListItem[]) {
  return rows.every(
    (item) =>
      normalizeText(item.checkInStatus) === 'CHECKED_IN' ||
      (!isReceiptLocked(item) &&
        Boolean(item.specimenConfirmedAt) &&
        normalizeText(item.fixationStatus) === 'COMPLETED' &&
        normalizeText(item.verificationStatus) === 'VERIFIED'),
  );
}

function resolveApplicationScopeRows(
  items: SpecimenManagementListItem[],
  row: SpecimenManagementListItem,
) {
  const sameApplicationRows = items.filter(
    (item) => item.applicationId === row.applicationId,
  );
  return sameApplicationRows.length > 0 ? sameApplicationRows : [row];
}

export function isCheckInReady(
  row: SpecimenManagementListItem,
  applicationRows: SpecimenManagementListItem[] = [row],
) {
  return (
    row.checkInStatus !== 'CHECKED_IN' &&
    !isReceiptLocked(row) &&
    isApplicationCheckInReady(resolveApplicationScopeRows(applicationRows, row))
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
  const targetItem = targetItems[0];
  if (!targetItem) {
    return '未找到可入库标本';
  }

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
  const applicationRows = resolveApplicationScopeRows(items, targetItem);
  if (!isApplicationCheckInReady(applicationRows)) {
    return '当前申请单下仍有标本未完成核对、固定或标本确认，不能入库';
  }

  return '未找到可入库标本';
}
