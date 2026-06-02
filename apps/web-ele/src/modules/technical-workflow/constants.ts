import type {
  TechnicalWorkflowChainType,
  TechnicalWorkflowRouteMeta,
} from './types/technical-workflow';

import { M2_PERMISSION_CODES } from '#/modules/specimen-workflow/constants';

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

const REGULAR_CHAIN: TechnicalWorkflowChainType = 'REGULAR';
const FROZEN_CHAIN: TechnicalWorkflowChainType = 'FROZEN';
const EXCEPTION_CHAIN: TechnicalWorkflowChainType = 'EXCEPTION';

export const TECHNICAL_WORKFLOW_ROUTE_META: Record<
  | 'DEHYDRATION'
  | 'EMBEDDING'
  | 'ENTRY'
  | 'FROZEN'
  | 'CYTOLOGY'
  | 'GROSSING'
  | 'IHC'
  | 'LIQUID_CYTOLOGY'
  | 'REWORK'
  | 'ROUTINE_ORDER'
  | 'SPECIMEN_REGISTRATION'
  | 'SLICING'
  | 'SPECIAL_ORDER'
  | 'STAINING'
  | 'TASKS'
  | 'TRACKING',
  TechnicalWorkflowRouteMeta
> = {
  DEHYDRATION: {
    authorityCode: M3_PERMISSION_CODES.DEHYDRATION,
    chain: REGULAR_CHAIN,
    icon: 'carbon:data-vis-4',
    isVisibleInMenu: true,
    key: 'DEHYDRATION',
    name: 'DehydrationWorkstation',
    path: '/technical-workflow/dehydration',
    title: '脱水工作站',
  },
  EMBEDDING: {
    authorityCode: M3_PERMISSION_CODES.EMBEDDING,
    chain: REGULAR_CHAIN,
    icon: 'carbon:cube',
    isVisibleInMenu: true,
    key: 'EMBEDDING',
    name: 'EmbeddingWorkstation',
    path: '/technical-workflow/embedding',
    title: '包埋工作站',
  },
  ENTRY: {
    authorityCode: M3_PERMISSION_CODES.TECHNICAL_TASK_QUERY,
    chain: REGULAR_CHAIN,
    isEntry: true,
    key: 'ENTRY',
    name: 'TechnicalWorkflowEntry',
    path: '/technical-workflow/entry',
    title: '技术流程入口',
  },
  FROZEN: {
    authorityCode: M3_PERMISSION_CODES.TECHNICAL_TASK_QUERY,
    chain: FROZEN_CHAIN,
    icon: 'carbon:snowflake',
    isVisibleInMenu: true,
    key: 'FROZEN',
    name: 'FrozenWorkstation',
    path: '/technical-workflow/frozen',
    title: '冰冻工作台',
  },
  GROSSING: {
    authorityCode: M3_PERMISSION_CODES.GROSSING,
    chain: REGULAR_CHAIN,
    icon: 'carbon:scan',
    isVisibleInMenu: true,
    key: 'GROSSING',
    name: 'GrossingWorkstation',
    path: '/technical-workflow/grossing',
    title: '取材描写工作站',
  },
  REWORK: {
    authorityCode: M3_PERMISSION_CODES.REWORK,
    chain: EXCEPTION_CHAIN,
    icon: 'carbon:renew',
    isVisibleInMenu: true,
    key: 'REWORK',
    name: 'ReworkWorkstation',
    path: '/technical-workflow/rework',
    title: '返工工作站',
  },
  SPECIMEN_REGISTRATION: {
    authorityCode: M2_PERMISSION_CODES.SPECIMEN_RECEIVE,
    chain: REGULAR_CHAIN,
    icon: 'carbon:data-table',
    isVisibleInMenu: true,
    key: 'SPECIMEN_REGISTRATION',
    name: 'TechnicalSpecimenRegistration',
    path: '/technical-workflow/specimen-registration',
    title: '登记接收工作站',
  },
  SLICING: {
    authorityCode: M3_PERMISSION_CODES.SLICING,
    chain: REGULAR_CHAIN,
    icon: 'carbon:cut',
    isVisibleInMenu: true,
    key: 'SLICING',
    name: 'SlicingWorkstation',
    path: '/technical-workflow/slicing',
    title: '切片工作站',
  },
  STAINING: {
    authorityCode: M3_PERMISSION_CODES.STAINING,
    chain: REGULAR_CHAIN,
    icon: 'carbon:color-palette',
    isVisibleInMenu: true,
    key: 'STAINING',
    name: 'StainingWorkstation',
    path: '/technical-workflow/staining',
    title: '染色出片工作站',
  },
  ROUTINE_ORDER: {
    authorityCode: M3_PERMISSION_CODES.TECHNICAL_TASK_QUERY,
    chain: REGULAR_CHAIN,
    icon: 'carbon:document-tasks',
    isVisibleInMenu: true,
    key: 'ROUTINE_ORDER',
    name: 'RoutineOrderWorkstation',
    path: '/technical-workflow/routine-orders',
    title: '常规医嘱工作站',
  },
  SPECIAL_ORDER: {
    authorityCode: M3_PERMISSION_CODES.TECHNICAL_TASK_QUERY,
    chain: REGULAR_CHAIN,
    icon: 'carbon:document-requirements',
    isVisibleInMenu: true,
    key: 'SPECIAL_ORDER',
    name: 'SpecialOrderWorkstation',
    path: '/technical-workflow/special-orders',
    title: '特检医嘱工作站',
  },
  IHC: {
    authorityCode: M3_PERMISSION_CODES.TECHNICAL_TASK_QUERY,
    chain: REGULAR_CHAIN,
    icon: 'carbon:chemistry',
    isVisibleInMenu: true,
    key: 'IHC',
    name: 'IhcWorkstation',
    path: '/technical-workflow/ihc',
    title: '免疫组化工作站',
  },
  CYTOLOGY: {
    authorityCode: M3_PERMISSION_CODES.TECHNICAL_TASK_QUERY,
    chain: REGULAR_CHAIN,
    icon: 'carbon:microscope',
    isVisibleInMenu: true,
    key: 'CYTOLOGY',
    name: 'CytologyWorkstation',
    path: '/technical-workflow/cytology',
    title: '细胞学工作站',
  },
  LIQUID_CYTOLOGY: {
    authorityCode: M3_PERMISSION_CODES.TECHNICAL_TASK_QUERY,
    chain: REGULAR_CHAIN,
    icon: 'lucide:droplets',
    isVisibleInMenu: true,
    key: 'LIQUID_CYTOLOGY',
    name: 'LiquidCytologyWorkstation',
    path: '/technical-workflow/liquid-cytology',
    title: '液基细胞学工作站',
  },
  TASKS: {
    authorityCode: M3_PERMISSION_CODES.TECHNICAL_TASK_QUERY,
    chain: REGULAR_CHAIN,
    icon: 'carbon:task',
    isVisibleInMenu: true,
    key: 'TASKS',
    name: 'TechnicalTasks',
    path: '/technical-workflow/tasks',
    title: '任务池',
  },
  TRACKING: {
    authorityCode: M3_PERMISSION_CODES.TECHNICAL_TRACKING_QUERY,
    chain: EXCEPTION_CHAIN,
    icon: 'carbon:search',
    isTracking: true,
    isVisibleInMenu: true,
    key: 'TRACKING',
    name: 'TechnicalTracking',
    path: '/technical-workflow/tracking',
    title: '技术追踪',
  },
};

export const M3_WORKFLOW_ROUTE_ITEMS = Object.values(
  TECHNICAL_WORKFLOW_ROUTE_META,
).map((item) => ({
  chain: item.chain,
  code: item.authorityCode,
  key: item.key,
  path: item.path,
  title: item.title,
}));

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
  { label: '重新取材', value: 'REGROSSING' },
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
  DEHYDRATION: TECHNICAL_WORKFLOW_ROUTE_META.DEHYDRATION.path,
  EMBEDDING: TECHNICAL_WORKFLOW_ROUTE_META.EMBEDDING.path,
  FROZEN: TECHNICAL_WORKFLOW_ROUTE_META.FROZEN.path,
  GROSSING: TECHNICAL_WORKFLOW_ROUTE_META.GROSSING.path,
  REWORK: TECHNICAL_WORKFLOW_ROUTE_META.REWORK.path,
  SLICING: TECHNICAL_WORKFLOW_ROUTE_META.SLICING.path,
  STAINING: TECHNICAL_WORKFLOW_ROUTE_META.STAINING.path,
};

export const TASK_TYPE_TITLE_MAP: Record<string, string> = {
  DEHYDRATION: TECHNICAL_WORKFLOW_ROUTE_META.DEHYDRATION.title,
  EMBEDDING: TECHNICAL_WORKFLOW_ROUTE_META.EMBEDDING.title,
  FROZEN: TECHNICAL_WORKFLOW_ROUTE_META.FROZEN.title,
  GROSSING: TECHNICAL_WORKFLOW_ROUTE_META.GROSSING.title,
  REWORK: TECHNICAL_WORKFLOW_ROUTE_META.REWORK.title,
  SLICING: TECHNICAL_WORKFLOW_ROUTE_META.SLICING.title,
  STAINING: TECHNICAL_WORKFLOW_ROUTE_META.STAINING.title,
};

export const NEXT_TASK_TYPE_MAP: Record<string, string> = {
  DEHYDRATION: 'EMBEDDING',
  EMBEDDING: 'SLICING',
  GROSSING: 'DEHYDRATION',
  SLICING: 'STAINING',
};

export const REWORK_TYPE_ROUTE_MAP: Record<string, string> = {
  REGROSSING: TECHNICAL_WORKFLOW_ROUTE_META.GROSSING.path,
  REEMBED: TECHNICAL_WORKFLOW_ROUTE_META.EMBEDDING.path,
  RESLICE: TECHNICAL_WORKFLOW_ROUTE_META.SLICING.path,
  RESTAIN: TECHNICAL_WORKFLOW_ROUTE_META.STAINING.path,
};
