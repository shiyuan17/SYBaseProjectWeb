import dayjs from 'dayjs';

import {
  APPLICATION_TYPE_OPTIONS,
  FIXATION_STATUS_OPTIONS,
  TRANSPORT_STATUS_OPTIONS,
} from '../constants';

function createLabelMap(options: ReadonlyArray<{ label: string; value: string }>) {
  return Object.fromEntries(options.map((option) => [option.value, option.label]));
}

function formatMappedValue(
  value: null | string | undefined,
  labels: Record<string, string>,
) {
  if (!value || !value.trim()) {
    return '-';
  }
  return labels[value.trim()] ?? value;
}

const applicationTypeLabels = createLabelMap(APPLICATION_TYPE_OPTIONS);
const fixationStatusLabels = {
  ...createLabelMap(FIXATION_STATUS_OPTIONS),
  ABNORMAL: '异常',
} satisfies Record<string, string>;
const applicationStatusLabels = {
  CANCELLED: '已取消',
  CLOSED: '已闭环',
  DRAFT: '草稿',
  IN_TRANSIT: '转运中',
  PARTIALLY_RECEIVED: '部分接收',
  RECEIVED: '已接收',
  REJECTED: '已拒收',
  SUBMITTED: '已提交',
} satisfies Record<string, string>;
const applicationFormStatusLabels = {
  ARCHIVED: '已归档',
  NOT_UPLOADED: '未上传',
  PENDING: '待补单',
  UPLOADED: '已上传',
} satisfies Record<string, string>;
const currentNodeLabels = {
  DRAFT: '草稿',
  FIXATION: '固定',
  IN_TRANSIT: '转运中',
  LABEL_PRINT: '标签打印',
  PARTIALLY_RECEIVED: '部分接收',
  RECEIVED: '已接收',
  RECEPTION: '标本接收',
  REGISTERED: '已登记',
  REJECTED: '已拒收',
  SPECIMEN_COLLECTION: '标本登记',
  SUBMITTED: '已提交',
  TRANSPORT: '转运交接',
} satisfies Record<string, string>;
const specimenStatusLabels = {
  FIXED: '固定完成',
  FIXING: '固定中',
  IN_TRANSIT: '转运中',
  RECEIVED: '已接收',
  REGISTERED: '已登记',
  REJECTED: '已拒收',
  RETURNED: '已退回',
} satisfies Record<string, string>;
const labelPrintStatusLabels = {
  FAILED: '打印失败',
  PENDING: '待打印',
  SUCCESS: '打印成功',
} satisfies Record<string, string>;
const transportStatusLabels = {
  ...createLabelMap(TRANSPORT_STATUS_OPTIONS),
  CANCELLED: '已取消',
  COMPLETED: '已完成',
} satisfies Record<string, string>;
const trackingEventTypeLabels = {
  COMPLETED: '完成固定',
  DIRECT_RECEIVE: '直接接收',
  HANDED_OVER: '完成交接',
  ORDER_CREATED: '创建转运单',
  ORDER_PRINTED: '打印转运单',
  PRINTED: '打印标签',
  RECEIVED: '接收标本',
  REGISTERED: '登记标本',
  REJECTED: '拒收标本',
  RETRY: '标签补打',
  RETURNED: '退回标本',
  STARTED: '开始固定',
} satisfies Record<string, string>;
const trackingEventStatusLabels = {
  FAILED: '失败',
  MATCHED: '匹配成功',
  RECEIVED: '已接收',
  REJECTED: '已拒收',
  RETURNED: '已退回',
  SUCCESS: '成功',
} satisfies Record<string, string>;

export function formatDateTime(value?: null | string) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-';
}

export function formatDate(value?: null | string) {
  return value ? dayjs(value).format('YYYY-MM-DD') : '-';
}

export function formatNullable(value?: null | string) {
  return value && value.trim() ? value : '-';
}

export function formatApplicationType(value?: null | string) {
  return formatMappedValue(value, applicationTypeLabels);
}

export function formatApplicationStatus(value?: null | string) {
  return formatMappedValue(value, applicationStatusLabels);
}

export function formatApplicationFormStatus(value?: null | string) {
  return formatMappedValue(value, applicationFormStatusLabels);
}

export function formatCurrentNode(value?: null | string) {
  return formatMappedValue(value, currentNodeLabels);
}

export function formatSpecimenStatus(value?: null | string) {
  return formatMappedValue(value, specimenStatusLabels);
}

export function formatFixationStatus(value?: null | string) {
  return formatMappedValue(value, fixationStatusLabels);
}

export function formatLabelPrintStatus(value?: null | string) {
  return formatMappedValue(value, labelPrintStatusLabels);
}

export function formatTransportStatus(value?: null | string) {
  return formatMappedValue(value, transportStatusLabels);
}

export function formatTrackingEventType(value?: null | string) {
  return formatMappedValue(value, trackingEventTypeLabels);
}

export function formatTrackingEventStatus(value?: null | string) {
  return formatMappedValue(value, trackingEventStatusLabels);
}
