export const M5_PERMISSION_CODES = {
  APPLICATION_FORM_ARCHIVE: 'PERM_M5_APPLICATION_FORM_ARCHIVE',
  ARCHIVE_CABINET_CREATE: 'PERM_M5_ARCHIVE_CABINET_CREATE',
  ARCHIVE_CABINET_QUERY: 'PERM_M5_ARCHIVE_CABINET_QUERY',
  ARCHIVE_CABINET_UPDATE: 'PERM_M5_ARCHIVE_CABINET_UPDATE',
  ARCHIVE_QUERY: 'PERM_M5_ARCHIVE_QUERY',
  EMBEDDING_BOX_ARCHIVE: 'PERM_M5_EMBEDDING_BOX_ARCHIVE',
  EQUIPMENT_CREATE: 'PERM_M5_EQUIPMENT_CREATE',
  EQUIPMENT_MAINTENANCE_CREATE: 'PERM_M5_EQUIPMENT_MAINTENANCE_CREATE',
  EQUIPMENT_QUERY: 'PERM_M5_EQUIPMENT_QUERY',
  EQUIPMENT_UPDATE: 'PERM_M5_EQUIPMENT_UPDATE',
  EQUIPMENT_WARNING_QUERY: 'PERM_M5_EQUIPMENT_WARNING_QUERY',
  LOAN_CREATE: 'PERM_M5_LOAN_CREATE',
  LOAN_QUERY: 'PERM_M5_LOAN_QUERY',
  LOAN_RETURN: 'PERM_M5_LOAN_RETURN',
  REAGENT_CREATE: 'PERM_M5_REAGENT_CREATE',
  REAGENT_QUERY: 'PERM_M5_REAGENT_QUERY',
  REAGENT_STOCK_QUERY: 'PERM_M5_REAGENT_STOCK_QUERY',
  REAGENT_STOCK_UPDATE: 'PERM_M5_REAGENT_STOCK_UPDATE',
  REAGENT_UPDATE: 'PERM_M5_REAGENT_UPDATE',
  REAGENT_WARNING_QUERY: 'PERM_M5_REAGENT_WARNING_QUERY',
  SLIDE_ARCHIVE: 'PERM_M5_SLIDE_ARCHIVE',
} as const;

export const M5_OPERATION_ROUTE_ITEMS = [
  {
    code: M5_PERMISSION_CODES.ARCHIVE_QUERY,
    path: '/operation-support/archive',
  },
  {
    code: M5_PERMISSION_CODES.REAGENT_QUERY,
    path: '/operation-support/reagents',
  },
  {
    code: M5_PERMISSION_CODES.EQUIPMENT_QUERY,
    path: '/operation-support/equipment',
  },
] as const;

export const ARCHIVE_CABINET_STATUS_OPTIONS = [
  { label: '启用', value: 'ENABLED' },
  { label: '停用', value: 'DISABLED' },
] as const;

export const ARCHIVE_CABINET_TYPE_OPTIONS = [
  { label: '标准柜', value: 'STANDARD' },
  { label: '申请单柜', value: 'APPLICATION_FORM' },
  { label: '蜡块柜', value: 'EMBEDDING_BOX' },
  { label: '玻片柜', value: 'SLIDE' },
] as const;

export const ARCHIVE_OBJECT_TYPE_OPTIONS = [
  { label: '申请单', value: 'APPLICATION_FORM' },
  { label: '包埋盒', value: 'EMBEDDING_BOX' },
  { label: '玻片', value: 'SLIDE' },
] as const;

export const MATERIAL_TYPE_OPTIONS = [
  { label: '包埋盒', value: 'EMBEDDING_BOX' },
  { label: '玻片', value: 'SLIDE' },
] as const;

export const REAGENT_ENABLED_OPTIONS = [
  { label: '启用', value: true },
  { label: '停用', value: false },
] as const;

export const REAGENT_STOCK_STATUS_OPTIONS = [
  { label: '在用', value: 'ACTIVE' },
  { label: '耗尽', value: 'DEPLETED' },
  { label: '停用', value: 'DISABLED' },
  { label: '过期', value: 'EXPIRED' },
] as const;

export const EQUIPMENT_STATUS_OPTIONS = [
  { label: '启用', value: 'ACTIVE' },
  { label: '维护中', value: 'MAINTENANCE' },
  { label: '停用', value: 'DISABLED' },
] as const;

export const EQUIPMENT_CATEGORY_OPTIONS = [
  { label: '切片机', value: 'MICROTOME' },
  { label: '染色机', value: 'STAINER' },
  { label: '包埋机', value: 'EMBEDDER' },
  { label: '脱水机', value: 'DEHYDRATOR' },
] as const;

export const MAINTENANCE_TYPE_OPTIONS = [
  { label: '保养', value: 'MAINTENANCE' },
  { label: '维修', value: 'REPAIR' },
  { label: '校准', value: 'CALIBRATION' },
] as const;

export const MAINTENANCE_STATUS_OPTIONS = [
  { label: '已完成', value: 'COMPLETED' },
  { label: '处理中', value: 'IN_PROGRESS' },
  { label: '已取消', value: 'CANCELLED' },
] as const;
