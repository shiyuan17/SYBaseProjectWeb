export const M3_PERMISSION_CODES = {
  DEHYDRATION: 'PERM_M3_DEHYDRATION',
  EMBEDDING: 'PERM_M3_EMBEDDING',
  GROSSING: 'PERM_M3_GROSSING',
  REWORK: 'PERM_M3_REWORK',
  SLICING: 'PERM_M3_SLICING',
  STAINING: 'PERM_M3_STAINING',
  TECHNICAL_TASK_QUERY: 'PERM_M3_TECH_TASK_QUERY',
  TECHNICAL_TRACKING_QUERY: 'PERM_M3_TECH_TRACKING_QUERY',
} as const;

export const M3_WORKFLOW_ROUTE_ITEMS = [
  {
    code: M3_PERMISSION_CODES.TECHNICAL_TASK_QUERY,
    path: '/technical-workflow/tasks',
  },
  {
    code: M3_PERMISSION_CODES.GROSSING,
    path: '/technical-workflow/grossing',
  },
  {
    code: M3_PERMISSION_CODES.DEHYDRATION,
    path: '/technical-workflow/dehydration',
  },
  {
    code: M3_PERMISSION_CODES.EMBEDDING,
    path: '/technical-workflow/embedding',
  },
  {
    code: M3_PERMISSION_CODES.SLICING,
    path: '/technical-workflow/slicing',
  },
  {
    code: M3_PERMISSION_CODES.STAINING,
    path: '/technical-workflow/staining',
  },
  {
    code: M3_PERMISSION_CODES.REWORK,
    path: '/technical-workflow/rework',
  },
  {
    code: M3_PERMISSION_CODES.TECHNICAL_TRACKING_QUERY,
    path: '/technical-workflow/tracking',
  },
] as const;

export const TECHNICAL_TASK_TYPE_OPTIONS = [
  { label: '取材', value: 'GROSSING' },
  { label: '脱水', value: 'DEHYDRATION' },
  { label: '包埋', value: 'EMBEDDING' },
  { label: '切片', value: 'SLICING' },
  { label: '染色出片', value: 'STAINING' },
  { label: '返工', value: 'REWORK' },
] as const;

export const TECHNICAL_TASK_STATUS_OPTIONS = [
  { label: '待处理', value: 'PENDING' },
  { label: '处理中', value: 'IN_PROGRESS' },
  { label: '已完成', value: 'COMPLETED' },
] as const;

export const TECHNICAL_TASK_PRIORITY_OPTIONS = [
  { label: '普通', value: 'NORMAL' },
  { label: '优先', value: 'PRIORITY' },
  { label: '急诊', value: 'STAT' },
] as const;

export const TECHNICAL_OBJECT_TYPE_OPTIONS = [
  { label: '病例', value: 'CASE' },
  { label: '标本', value: 'SPECIMEN' },
  { label: '蜡块', value: 'SAMPLING_BLOCK' },
  { label: '包埋盒', value: 'EMBEDDING_BOX' },
  { label: '玻片', value: 'SLIDE' },
] as const;

export const REWORK_TYPE_OPTIONS = [
  { label: '重染', value: 'RESTAIN' },
  { label: '重切', value: 'RESLICE' },
  { label: '重包埋', value: 'REEMBED' },
  { label: '重取材', value: 'REGROSSING' },
] as const;

export const QC_TYPE_OPTIONS = [
  { label: 'HE', value: 'HE' },
  { label: '免疫组化', value: 'IHC' },
  { label: '特殊染色', value: 'SPECIAL_STAIN' },
] as const;

export const EVALUATION_LEVEL_OPTIONS = [
  { label: '优秀', value: 'EXCELLENT' },
  { label: '合格', value: 'QUALIFIED' },
  { label: '不合格', value: 'UNQUALIFIED' },
] as const;

export const DEFAULT_PAGE_SIZE = 20;

export const TASK_TYPE_ROUTE_MAP: Record<string, string> = {
  DEHYDRATION: '/technical-workflow/dehydration',
  EMBEDDING: '/technical-workflow/embedding',
  GROSSING: '/technical-workflow/grossing',
  REWORK: '/technical-workflow/rework',
  SLICING: '/technical-workflow/slicing',
  STAINING: '/technical-workflow/staining',
};

export const TASK_TYPE_TITLE_MAP: Record<string, string> = {
  DEHYDRATION: '脱水工作站',
  EMBEDDING: '包埋工作站',
  GROSSING: '取材描写',
  REWORK: '返工工作站',
  SLICING: '切片工作站',
  STAINING: '染色出片',
};

export const NEXT_TASK_TYPE_MAP: Record<string, string> = {
  DEHYDRATION: 'EMBEDDING',
  EMBEDDING: 'SLICING',
  GROSSING: 'DEHYDRATION',
  SLICING: 'STAINING',
};

export const REWORK_TYPE_ROUTE_MAP: Record<string, string> = {
  REGROSSING: '/technical-workflow/grossing',
  REEMBED: '/technical-workflow/embedding',
  RESLICE: '/technical-workflow/slicing',
  RESTAIN: '/technical-workflow/staining',
};
