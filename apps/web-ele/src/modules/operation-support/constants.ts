export const M5_PERMISSION_CODES = {
  APPLICATION_FORM_ARCHIVE: 'PERM_M5_APPLICATION_FORM_ARCHIVE',
  ARCHIVE_CABINET_CREATE: 'PERM_M5_ARCHIVE_CABINET_CREATE',
  ARCHIVE_CABINET_DELETE: 'PERM_M5_ARCHIVE_CABINET_DELETE',
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

export const M5_ARCHIVE_PAGE_AUTHORITIES = [
  M5_PERMISSION_CODES.ARCHIVE_CABINET_QUERY,
  M5_PERMISSION_CODES.ARCHIVE_CABINET_CREATE,
  M5_PERMISSION_CODES.ARCHIVE_CABINET_UPDATE,
  M5_PERMISSION_CODES.ARCHIVE_CABINET_DELETE,
  M5_PERMISSION_CODES.APPLICATION_FORM_ARCHIVE,
  M5_PERMISSION_CODES.EMBEDDING_BOX_ARCHIVE,
  M5_PERMISSION_CODES.SLIDE_ARCHIVE,
  M5_PERMISSION_CODES.ARCHIVE_QUERY,
] as const;

export const M5_BORROW_PAGE_AUTHORITIES = [
  M5_PERMISSION_CODES.LOAN_CREATE,
  M5_PERMISSION_CODES.LOAN_RETURN,
  M5_PERMISSION_CODES.LOAN_QUERY,
] as const;

export const M5_OPERATION_SUPPORT_AUTHORITIES = [
  ...M5_ARCHIVE_PAGE_AUTHORITIES,
  ...M5_BORROW_PAGE_AUTHORITIES,
] as const;

export const M5_REAGENT_PAGE_AUTHORITIES = [
  M5_PERMISSION_CODES.REAGENT_QUERY,
  M5_PERMISSION_CODES.REAGENT_CREATE,
  M5_PERMISSION_CODES.REAGENT_UPDATE,
  M5_PERMISSION_CODES.REAGENT_STOCK_QUERY,
  M5_PERMISSION_CODES.REAGENT_STOCK_UPDATE,
  M5_PERMISSION_CODES.REAGENT_WARNING_QUERY,
] as const;

export const M5_EQUIPMENT_PAGE_AUTHORITIES = [
  M5_PERMISSION_CODES.EQUIPMENT_QUERY,
  M5_PERMISSION_CODES.EQUIPMENT_CREATE,
  M5_PERMISSION_CODES.EQUIPMENT_UPDATE,
  M5_PERMISSION_CODES.EQUIPMENT_MAINTENANCE_CREATE,
  M5_PERMISSION_CODES.EQUIPMENT_WARNING_QUERY,
] as const;

export const M5_RESOURCE_PAGE_AUTHORITIES = [
  ...M5_EQUIPMENT_PAGE_AUTHORITIES,
  ...M5_REAGENT_PAGE_AUTHORITIES,
] as const;

export const M5_ARCHIVE_ROUTE_ITEMS = [
  {
    codes: M5_ARCHIVE_PAGE_AUTHORITIES,
    path: '/operation-support/archive',
  },
  {
    codes: M5_BORROW_PAGE_AUTHORITIES,
    path: '/operation-support/borrow',
  },
];

export const M5_RESOURCE_ROUTE_ITEMS = [
  {
    codes: M5_EQUIPMENT_PAGE_AUTHORITIES,
    path: '/operation-resources/equipment',
  },
  {
    codes: M5_REAGENT_PAGE_AUTHORITIES,
    path: '/operation-resources/reagents',
  },
] as const;

export const ARCHIVE_CABINET_STATUS_OPTIONS = [
  { label: '启用', value: 'ACTIVE' },
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
  { label: '蜡块', value: 'EMBEDDING_BOX' },
  { label: '玻片', value: 'SLIDE' },
] as const;

export const MATERIAL_TYPE_OPTIONS = [
  { label: '蜡块', value: 'EMBEDDING_BOX' },
  { label: '玻片', value: 'SLIDE' },
] as const;

export const ARCHIVE_POSITION_STATUS_OPTIONS = [
  { label: '可用', value: 'AVAILABLE' },
  { label: '已占用', value: 'OCCUPIED' },
  { label: '已停用', value: 'DISABLED' },
] as const;

export const ARCHIVE_STORAGE_STATUS_OPTIONS = [
  { label: '在库', value: 'IN_STORAGE' },
  { label: '已借出', value: 'BORROWED' },
] as const;

export const MATERIAL_LOAN_STATUS_OPTIONS = [
  { label: '借出中', value: 'BORROWED' },
  { label: '已归还', value: 'RETURNED' },
] as const;

export const REAGENT_ENABLED_OPTIONS = [
  { label: '启用', value: true },
  { label: '停用', value: false },
] as const;

export const REAGENT_TYPE_OPTIONS = [
  { label: '免疫组化工作液', value: 'IMMUNO_WORKING_SOLUTION' },
  { label: '免疫组化浓缩液', value: 'IMMUNO_CONCENTRATE' },
  { label: '基因突变检测试剂', value: 'GENE_MUTATION_TEST' },
  { label: '免疫组化稀释液', value: 'IMMUNO_DILUENT' },
  { label: '特殊染色试剂', value: 'SPECIAL_STAIN' },
] as const;

export const REAGENT_TEMPLATE_STATUS_OPTIONS = [
  { label: '启用', value: 'ENABLED' },
  { label: '停用', value: 'DISABLED' },
  { label: '删除', value: 'DELETED' },
] as const;

export const REAGENT_STOCK_STATUS_OPTIONS = [
  { label: '入库', value: 'IN_STOCK' },
  { label: '已测试', value: 'TESTED' },
  { label: '使用中', value: 'IN_USE' },
  { label: '已用完', value: 'FINISHED' },
  { label: '停用', value: 'DISABLED' },
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
