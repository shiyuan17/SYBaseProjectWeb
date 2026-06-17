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
  LOAN_ABNORMAL_REGISTER: 'PERM_M5_LOAN_ABNORMAL_REGISTER',
  REAGENT_CREATE: 'PERM_M5_REAGENT_CREATE',
  REAGENT_QUERY: 'PERM_M5_REAGENT_QUERY',
  REAGENT_STOCK_QUERY: 'PERM_M5_REAGENT_STOCK_QUERY',
  REAGENT_STOCK_UPDATE: 'PERM_M5_REAGENT_STOCK_UPDATE',
  REAGENT_UPDATE: 'PERM_M5_REAGENT_UPDATE',
  REAGENT_WARNING_QUERY: 'PERM_M5_REAGENT_WARNING_QUERY',
  SLIDE_ARCHIVE: 'PERM_M5_SLIDE_ARCHIVE',
  SPECIMEN_ARCHIVE: 'PERM_M5_SPECIMEN_ARCHIVE',
  WHITE_SLIDE_CREATE: 'PERM_M5_WHITE_SLIDE_CREATE',
  WHITE_SLIDE_QUERY: 'PERM_M5_WHITE_SLIDE_QUERY',
  WHITE_SLIDE_RETURN: 'PERM_M5_WHITE_SLIDE_RETURN',
} as const;

export const M5_ARCHIVE_PAGE_AUTHORITIES = [
  M5_PERMISSION_CODES.ARCHIVE_CABINET_QUERY,
  M5_PERMISSION_CODES.ARCHIVE_CABINET_CREATE,
  M5_PERMISSION_CODES.ARCHIVE_CABINET_UPDATE,
  M5_PERMISSION_CODES.ARCHIVE_CABINET_DELETE,
  M5_PERMISSION_CODES.APPLICATION_FORM_ARCHIVE,
  M5_PERMISSION_CODES.EMBEDDING_BOX_ARCHIVE,
  M5_PERMISSION_CODES.SLIDE_ARCHIVE,
  M5_PERMISSION_CODES.SPECIMEN_ARCHIVE,
  M5_PERMISSION_CODES.ARCHIVE_QUERY,
] as const;

export const M5_BORROW_PAGE_AUTHORITIES = [
  M5_PERMISSION_CODES.ARCHIVE_QUERY,
  M5_PERMISSION_CODES.LOAN_CREATE,
  M5_PERMISSION_CODES.LOAN_RETURN,
  M5_PERMISSION_CODES.LOAN_QUERY,
  M5_PERMISSION_CODES.LOAN_ABNORMAL_REGISTER,
  M5_PERMISSION_CODES.WHITE_SLIDE_QUERY,
  M5_PERMISSION_CODES.WHITE_SLIDE_CREATE,
  M5_PERMISSION_CODES.WHITE_SLIDE_RETURN,
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
  { label: '申请单', value: 'APPLICATION_FORM' },
  { label: '蜡块', value: 'EMBEDDING_BOX' },
  { label: '玻片', value: 'SLIDE' },
  { label: '标本', value: 'SPECIMEN' },
  { label: '试管', value: 'TEST_TUBE' },
] as const;

export const ARCHIVE_CABINET_CREATE_TYPE_OPTIONS = [
  { label: '申请单', value: 'APPLICATION_FORM' },
  { label: '蜡块', value: 'EMBEDDING_BOX' },
  { label: '玻片', value: 'SLIDE' },
  { label: '标本', value: 'SPECIMEN' },
  { label: '试管', value: 'TEST_TUBE' },
] as const;

export const ARCHIVE_CABINET_NODE_TYPE_OPTIONS = [
  { label: '区域', value: 'AREA' },
  { label: '柜子', value: 'CABINET' },
  { label: '抽屉', value: 'DRAWER' },
] as const;

export const ARCHIVE_OBJECT_TYPE_OPTIONS = [
  { label: '申请单', value: 'APPLICATION_FORM' },
  { label: '蜡块', value: 'EMBEDDING_BOX' },
  { label: '玻片', value: 'SLIDE' },
  { label: '标本', value: 'SPECIMEN' },
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
  { label: '未归档', value: 'NOT_ARCHIVED' },
  { label: '在库', value: 'IN_STORAGE' },
  { label: '已借出', value: 'BORROWED' },
] as const;

export const MATERIAL_LOAN_STATUS_OPTIONS = [
  { label: '未借阅', value: 'NONE' },
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

export const REAGENT_USAGE_OPTIONS = [
  { label: '免疫组化', value: '免疫组化' },
  { label: '基因检测', value: '基因检测' },
  { label: '特殊染色', value: '特殊染色' },
  { label: '常规染色', value: '常规染色' },
  { label: '其他', value: '其他' },
] as const;

export const REAGENT_UNIT_OPTIONS = [
  { label: '微升', value: '微升' },
  { label: '毫升', value: '毫升' },
  { label: '升', value: '升' },
] as const;

export const REAGENT_DILUTION_OPTIONS = [
  { label: '无', value: '无' },
  { label: '1:25~50', value: '1:25~50' },
  { label: '1:50~100', value: '1:50~100' },
  { label: '1:100~200', value: '1:100~200' },
  { label: '1:200~300', value: '1:200~300' },
  { label: '1:300~400', value: '1:300~400' },
] as const;

export const REAGENT_STOCK_STATUS_OPTIONS = [
  { label: '入库', value: 'IN_STOCK' },
  { label: '已测试', value: 'TESTED' },
  { label: '使用中', value: 'IN_USE' },
  { label: '已用完', value: 'FINISHED' },
  { label: '停用', value: 'DISABLED' },
] as const;

export const EQUIPMENT_STATUS_OPTIONS = [
  { label: '正常', value: 'ACTIVE' },
  { label: '禁用', value: 'DISABLED' },
  { label: '报废报损', value: 'SCRAPPED' },
] as const;

export const EQUIPMENT_CATEGORY_OPTIONS = [
  { label: '免疫组化仪', value: '免疫组化仪' },
  { label: '包埋机', value: '包埋机' },
  { label: '切片机', value: '切片机' },
  { label: '脱水机', value: '脱水机' },
  { label: '打号机', value: '打号机' },
  { label: '成像系统', value: '成像系统' },
  { label: '书写仪', value: '书写仪' },
  { label: '取材台', value: '取材台' },
  { label: '杂交仪', value: '杂交仪' },
  { label: '工作台', value: '工作台' },
  { label: '仪器柜', value: '仪器柜' },
  { label: '冰箱', value: '冰箱' },
  { label: '离心机', value: '离心机' },
  { label: '抽气罩', value: '抽气罩' },
  { label: '显微镜', value: '显微镜' },
  { label: '干燥箱', value: '干燥箱' },
  { label: '天平', value: '天平' },
  { label: '漂烤器', value: '漂烤器' },
  { label: '培养箱', value: '培养箱' },
  { label: '水槽', value: '水槽' },
  { label: '水浴箱', value: '水浴箱' },
  { label: '解剖台', value: '解剖台' },
  { label: '测试仪', value: '测试仪' },
  { label: '灭菌器', value: '灭菌器' },
  { label: '封片机', value: '封片机' },
  { label: '染色仪', value: '染色仪' },
  { label: '安全柜', value: '安全柜' },
  { label: '实验台', value: '实验台' },
  { label: '通风柜', value: '通风柜' },
  { label: '染色机', value: '染色机' },
  { label: '扫描系统', value: '扫描系统' },
  { label: '临床检验分析仪器', value: '临床检验分析仪器' },
  { label: '手术急救设备', value: '手术急救设备' },
  { label: '光学仪器及窥镜', value: '光学仪器及窥镜' },
  { label: '医用电子仪器', value: '医用电子仪器' },
  { label: '病房护理设备', value: '病房护理设备' },
  { label: '其他', value: '其他' },
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
