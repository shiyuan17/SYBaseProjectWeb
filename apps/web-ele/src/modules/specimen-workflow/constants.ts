export const M2_PERMISSION_CODES = {
  APPLICATION_CREATE: 'PERM_APPLICATION_CREATE',
  APPLICATION_DETAIL_QUERY: 'PERM_APPLICATION_DETAIL_QUERY',
  SPECIMEN_REGISTER: 'PERM_SPECIMEN_REGISTER',
  FIXATION_VERIFY: 'PERM_FIXATION_VERIFY',
  TRANSPORT_HANDOVER: 'PERM_TRANSPORT_HANDOVER',
  SPECIMEN_RECEIVE: 'PERM_SPECIMEN_RECEIVE',
  SPECIMEN_TRACKING_QUERY: 'PERM_SPECIMEN_TRACKING_QUERY',
  CLINICAL_IMPORT: 'PERM_CLINICAL_IMPORT',
} as const;

export const M2_WORKFLOW_ROUTE_ITEMS = [
  {
    code: M2_PERMISSION_CODES.SPECIMEN_REGISTER,
    path: '/workflow/clinical-register',
  },
  {
    code: M2_PERMISSION_CODES.FIXATION_VERIFY,
    path: '/workflow/fixation-verify',
  },
  {
    code: M2_PERMISSION_CODES.TRANSPORT_HANDOVER,
    path: '/workflow/transport-handover',
  },
  {
    code: M2_PERMISSION_CODES.SPECIMEN_RECEIVE,
    path: '/workflow/specimen-receipt',
  },
  {
    code: M2_PERMISSION_CODES.SPECIMEN_TRACKING_QUERY,
    path: '/workflow/tracking-query',
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

export const FIXATION_STATUS_OPTIONS = [
  { label: '待固定', value: 'PENDING' },
  { label: '固定中', value: 'FIXING' },
  { label: '已固定', value: 'COMPLETED' },
] as const;

export const APPLICATION_TYPE_OPTIONS = [
  { label: '常规', value: 'ROUTINE' },
  { label: '冰冻', value: 'FROZEN' },
] as const;

export const DEFAULT_PAGE_SIZE = 20;
