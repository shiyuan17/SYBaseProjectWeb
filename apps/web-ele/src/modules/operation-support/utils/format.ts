import {
  ARCHIVE_CABINET_STATUS_OPTIONS,
  ARCHIVE_CABINET_TYPE_OPTIONS,
  ARCHIVE_OBJECT_TYPE_OPTIONS,
  ARCHIVE_POSITION_STATUS_OPTIONS,
  ARCHIVE_STORAGE_STATUS_OPTIONS,
  EQUIPMENT_CATEGORY_OPTIONS,
  EQUIPMENT_STATUS_OPTIONS,
  MAINTENANCE_STATUS_OPTIONS,
  MAINTENANCE_TYPE_OPTIONS,
  MATERIAL_LOAN_STATUS_OPTIONS,
  MATERIAL_TYPE_OPTIONS,
  REAGENT_STOCK_STATUS_OPTIONS,
} from '../constants';

function findOptionLabel(
  options: readonly { label: string; value: boolean | string }[],
  value?: boolean | null | string,
) {
  return (
    options.find((option) => option.value === value)?.label ?? value ?? '-'
  );
}

export function formatNullable(value?: null | number | string) {
  return value === null || value === undefined || value === ''
    ? '-'
    : String(value);
}

export function formatArchiveCabinetStatus(value?: null | string) {
  return findOptionLabel(ARCHIVE_CABINET_STATUS_OPTIONS, value);
}

export function formatArchiveCabinetType(value?: null | string) {
  return findOptionLabel(ARCHIVE_CABINET_TYPE_OPTIONS, value);
}

export function formatArchiveObjectType(value?: null | string) {
  return findOptionLabel(ARCHIVE_OBJECT_TYPE_OPTIONS, value);
}

export function formatArchivePositionStatus(value?: null | string) {
  return findOptionLabel(ARCHIVE_POSITION_STATUS_OPTIONS, value);
}

export function formatMaterialType(value?: null | string) {
  return findOptionLabel(MATERIAL_TYPE_OPTIONS, value);
}

export function formatArchiveStorageStatus(value?: null | string) {
  return findOptionLabel(ARCHIVE_STORAGE_STATUS_OPTIONS, value);
}

export function formatMaterialLoanStatus(value?: null | string) {
  return findOptionLabel(MATERIAL_LOAN_STATUS_OPTIONS, value);
}

export function formatReagentStockStatus(value?: null | string) {
  return findOptionLabel(REAGENT_STOCK_STATUS_OPTIONS, value);
}

export function formatEquipmentStatus(value?: null | string) {
  return findOptionLabel(EQUIPMENT_STATUS_OPTIONS, value);
}

export function formatEquipmentCategory(value?: null | string) {
  return findOptionLabel(EQUIPMENT_CATEGORY_OPTIONS, value);
}

export function formatMaintenanceType(value?: null | string) {
  return findOptionLabel(MAINTENANCE_TYPE_OPTIONS, value);
}

export function formatMaintenanceStatus(value?: null | string) {
  return findOptionLabel(MAINTENANCE_STATUS_OPTIONS, value);
}

export function formatWarningType(value?: null | string) {
  if (value === 'LOW_STOCK') {
    return '低库存';
  }
  if (value === 'NEAR_EXPIRY') {
    return '近效期';
  }
  if (value === 'DUE_SOON') {
    return '即将到期';
  }
  if (value === 'OVERDUE') {
    return '已逾期';
  }
  return formatNullable(value);
}
