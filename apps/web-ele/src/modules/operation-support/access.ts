import {
  M5_ARCHIVE_PAGE_AUTHORITIES,
  M5_EQUIPMENT_PAGE_AUTHORITIES,
  M5_OPERATION_ROUTE_ITEMS,
  M5_PERMISSION_CODES,
  M5_REAGENT_PAGE_AUTHORITIES,
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

export function getOperationSupportEntryPath(accessCodes: string[]) {
  const accessCodeSet = createAccessCodeSet(accessCodes);

  return (
    M5_OPERATION_ROUTE_ITEMS.find((item) =>
      item.codes.some((code) => accessCodeSet.has(code)),
    )?.path ?? null
  );
}

export function getReagentLedgerCapabilities(accessCodes: string[]) {
  const accessCodeSet = createAccessCodeSet(accessCodes);

  return {
    canCreateReagent: hasPermission(
      accessCodeSet,
      M5_PERMISSION_CODES.REAGENT_CREATE,
    ),
    canManageStocks: hasPermission(
      accessCodeSet,
      M5_PERMISSION_CODES.REAGENT_STOCK_UPDATE,
    ),
    canQueryReagents: hasPermission(
      accessCodeSet,
      M5_PERMISSION_CODES.REAGENT_QUERY,
    ),
    canQueryStocks: hasPermission(
      accessCodeSet,
      M5_PERMISSION_CODES.REAGENT_STOCK_QUERY,
    ),
    canQueryWarnings: hasPermission(
      accessCodeSet,
      M5_PERMISSION_CODES.REAGENT_WARNING_QUERY,
    ),
    canUpdateReagent: hasPermission(
      accessCodeSet,
      M5_PERMISSION_CODES.REAGENT_UPDATE,
    ),
    canViewPage: hasAnyPermission(accessCodeSet, M5_REAGENT_PAGE_AUTHORITIES),
  };
}

export function getEquipmentLedgerCapabilities(accessCodes: string[]) {
  const accessCodeSet = createAccessCodeSet(accessCodes);

  return {
    canCreateEquipment: hasPermission(
      accessCodeSet,
      M5_PERMISSION_CODES.EQUIPMENT_CREATE,
    ),
    canCreateMaintenanceLog: hasPermission(
      accessCodeSet,
      M5_PERMISSION_CODES.EQUIPMENT_MAINTENANCE_CREATE,
    ),
    canQueryEquipment: hasPermission(
      accessCodeSet,
      M5_PERMISSION_CODES.EQUIPMENT_QUERY,
    ),
    canQueryWarnings: hasPermission(
      accessCodeSet,
      M5_PERMISSION_CODES.EQUIPMENT_WARNING_QUERY,
    ),
    canUpdateEquipment: hasPermission(
      accessCodeSet,
      M5_PERMISSION_CODES.EQUIPMENT_UPDATE,
    ),
    canViewPage: hasAnyPermission(accessCodeSet, M5_EQUIPMENT_PAGE_AUTHORITIES),
  };
}

export function canViewArchivePage(accessCodes: string[]) {
  return hasAnyPermission(createAccessCodeSet(accessCodes), M5_ARCHIVE_PAGE_AUTHORITIES);
}
