import {
  M6_BILLING_PAGE_AUTHORITIES,
  M6_HISTORY_PAGE_AUTHORITIES,
  M6_INTEGRATION_PAGE_AUTHORITIES,
  M6_PERMISSION_CODES,
  M6_ROUTE_ITEMS,
  M6_STATISTICS_PAGE_AUTHORITIES,
} from './constants';

function hasPermission(accessCodeSet: ReadonlySet<string>, code: string) {
  return accessCodeSet.has(code);
}

function hasAnyPermission(
  accessCodeSet: ReadonlySet<string>,
  codes: readonly string[],
) {
  return codes.some((code) => hasPermission(accessCodeSet, code));
}

export function createAccessCodeSet(accessCodes: string[]) {
  return new Set(accessCodes);
}

export function getM6EntryPath(accessCodes: string[]) {
  const accessCodeSet = createAccessCodeSet(accessCodes);

  return (
    M6_ROUTE_ITEMS.find((item) =>
      item.codes.some((code) => accessCodeSet.has(code)),
    )?.path ?? null
  );
}

export function canViewIntegrationPage(accessCodes: string[]) {
  return hasAnyPermission(
    createAccessCodeSet(accessCodes),
    M6_INTEGRATION_PAGE_AUTHORITIES,
  );
}

export function getBillingManagementCapabilities(accessCodes: string[]) {
  const accessCodeSet = createAccessCodeSet(accessCodes);

  return {
    canQueryBilling: hasPermission(
      accessCodeSet,
      M6_PERMISSION_CODES.BILLING_QUERY,
    ),
    canReceiveReceipt: hasPermission(
      accessCodeSet,
      M6_PERMISSION_CODES.BILLING_RECEIPT,
    ),
    canReconcile: hasPermission(
      accessCodeSet,
      M6_PERMISSION_CODES.BILLING_RECONCILE,
    ),
    canRetryBilling: hasPermission(
      accessCodeSet,
      M6_PERMISSION_CODES.BILLING_RETRY,
    ),
    canViewPage: hasAnyPermission(accessCodeSet, M6_BILLING_PAGE_AUTHORITIES),
  };
}

export function getHistoryManagementCapabilities(accessCodes: string[]) {
  const accessCodeSet = createAccessCodeSet(accessCodes);

  return {
    canImportHistory: hasPermission(
      accessCodeSet,
      M6_PERMISSION_CODES.HISTORY_IMPORT,
    ),
    canQueryHistory: hasPermission(
      accessCodeSet,
      M6_PERMISSION_CODES.HISTORY_QUERY,
    ),
    canViewPage: hasAnyPermission(accessCodeSet, M6_HISTORY_PAGE_AUTHORITIES),
  };
}

export function canViewStatisticsPage(accessCodes: string[]) {
  return hasAnyPermission(
    createAccessCodeSet(accessCodes),
    M6_STATISTICS_PAGE_AUTHORITIES,
  );
}
