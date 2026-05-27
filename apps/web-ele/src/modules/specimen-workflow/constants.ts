export const M2_PERMISSION_CODES = {
  APPLICATION_CREATE: 'PERM_APPLICATION_CREATE',
  APPLICATION_DETAIL_QUERY: 'PERM_APPLICATION_DETAIL_QUERY',
  WORKFLOW_REFERENCE_QUERY: 'PERM_WORKFLOW_REFERENCE_QUERY',
  SPECIMEN_REGISTER: 'PERM_SPECIMEN_REGISTER',
  FIXATION_VERIFY: 'PERM_FIXATION_VERIFY',
  TRANSPORT_HANDOVER: 'PERM_TRANSPORT_HANDOVER',
  SPECIMEN_RECEIVE: 'PERM_SPECIMEN_RECEIVE',
  SPECIMEN_TRACKING_QUERY: 'PERM_SPECIMEN_TRACKING_QUERY',
  CLINICAL_IMPORT: 'PERM_CLINICAL_IMPORT',
} as const;

export const M2_WORKFLOW_ROUTE_ITEMS = [
  {
    code: M2_PERMISSION_CODES.APPLICATION_DETAIL_QUERY,
    path: '/workflow/submission-registration',
  },
  {
    code: M2_PERMISSION_CODES.APPLICATION_CREATE,
    path: '/workflow/submission-registration',
  },
  {
    code: M2_PERMISSION_CODES.CLINICAL_IMPORT,
    path: '/workflow/submission-registration',
  },
  {
    code: M2_PERMISSION_CODES.SPECIMEN_REGISTER,
    path: '/workflow/submission-registration',
  },
  {
    code: M2_PERMISSION_CODES.FIXATION_VERIFY,
    path: '/workflow/fixation-transport',
  },
  {
    code: M2_PERMISSION_CODES.TRANSPORT_HANDOVER,
    path: '/workflow/fixation-transport',
  },
  {
    code: M2_PERMISSION_CODES.SPECIMEN_RECEIVE,
    path: '/workflow/pathology-receipt',
  },
  {
    code: M2_PERMISSION_CODES.SPECIMEN_TRACKING_QUERY,
    path: '/workflow/tracking-exception',
  },
] as const;

export const RECEIPT_STATUS_OPTIONS = [
  { label: '接收', value: 'RECEIVED' },
  { label: '拒收', value: 'REJECTED' },
  { label: '退回', value: 'RETURNED' },
] as const;

export const TRANSPORT_STATUS_OPTIONS = [
  { label: '待转运', value: 'PENDING' },
  { label: '已打印', value: 'PRINTED' },
  { label: '已交接', value: 'HANDED_OVER' },
  { label: '部分签收', value: 'PARTIALLY_RECEIVED' },
] as const;

export const ALL_FIXATION_STATUS_VALUE = 'ALL';

export const FIXATION_STATUS_OPTIONS = [
  { label: '所有', value: ALL_FIXATION_STATUS_VALUE },
  { label: '待固定', value: 'PENDING' },
  { label: '固定中', value: 'FIXING' },
  { label: '已固定', value: 'COMPLETED' },
] as const;

export const ALL_VERIFICATION_STATUS_VALUE = 'ALL';

export const VERIFICATION_STATUS_OPTIONS = [
  { label: '所有', value: ALL_VERIFICATION_STATUS_VALUE },
  { label: '待核对', value: 'UNVERIFIED' },
  { label: '核对中', value: 'VERIFYING' },
  { label: '已核对', value: 'VERIFIED' },
] as const;

export const CHECK_IN_STATUS_OPTIONS = [
  { label: '待入库', value: 'NOT_CHECKED_IN' },
  { label: '已入库', value: 'CHECKED_IN' },
] as const;

export const APPLICATION_TYPE_OPTIONS = [
  { label: '常规', value: 'ROUTINE' },
  { label: '冰冻', value: 'FROZEN' },
] as const;

export const APPLICATION_FORM_STATUS_OPTIONS = [
  { label: '未上传', value: 'NOT_UPLOADED' },
  { label: '待补单', value: 'PENDING' },
  { label: '已上传', value: 'UPLOADED' },
  { label: '已归档', value: 'ARCHIVED' },
] as const;

export const QUALITY_CHECK_RESULT_OPTIONS = [
  { label: '合格', value: 'PASSED' },
  { label: '不合格', value: 'FAILED' },
] as const;

export const QUALITY_ISSUE_CODE_OPTIONS = [
  { label: '标签缺失', value: 'LABEL_MISSING' },
  { label: '标签不符', value: 'LABEL_MISMATCH' },
  { label: '容器破损', value: 'CONTAINER_DAMAGE' },
  { label: '固定不合格', value: 'FIXATION_INVALID' },
  { label: '数量不一致', value: 'COUNT_MISMATCH' },
  { label: '污染渗漏', value: 'CONTAMINATION' },
] as const;

export const DEFAULT_PAGE_SIZE = 20;
