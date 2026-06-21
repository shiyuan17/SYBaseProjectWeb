import type { TrackingEventView } from '../types/specimen-workflow';

import dayjs from 'dayjs';

import {
  APPLICATION_TYPE_OPTIONS,
  CHECK_IN_STATUS_OPTIONS,
  FIXATION_STATUS_OPTIONS,
  TRANSPORT_STATUS_OPTIONS,
  VERIFICATION_STATUS_OPTIONS,
} from '../constants';

type LabelMap = Record<string, string>;

function createLabelMap(
  options: ReadonlyArray<{ label: string; value: string }>,
) {
  return Object.fromEntries(
    options.map((option) => [option.value, option.label]),
  );
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
} satisfies LabelMap;
const verificationStatusLabels = createLabelMap(
  VERIFICATION_STATUS_OPTIONS.filter((option) => option.value !== 'ALL'),
);
const checkInStatusLabels = createLabelMap(CHECK_IN_STATUS_OPTIONS);
const applicationStatusLabels = {
  CANCELLED: '已取消',
  CLOSED: '已闭环',
  DRAFT: '草稿',
  IN_TRANSIT: '转运中',
  PENDING: '待登记',
  PARTIALLY_RECEIVED: '部分接收',
  RECEIVED: '已接收',
  REJECTED: '已拒收',
  SUBMITTED: '已提交',
  VOIDED: '已作废',
} satisfies LabelMap;
const applicationFormStatusLabels = {
  ARCHIVED: '已归档',
  NOT_UPLOADED: '未上传',
  PENDING: '待补单',
  UPLOADED: '已上传',
  VOIDED: '已作废',
} satisfies LabelMap;
const currentNodeLabels: LabelMap = {
  CHECK_IN: '标本入库',
  CONFIRMATION: '标本确认',
  DEHYDRATION: '脱水',
  DIAGNOSIS_ASSIGN: '诊断分配',
  DRAFT: '草稿',
  EMBEDDING: '包埋',
  FIXATION: '固定',
  GROSSING: '取材',
  GROSSING_MEDIA: '取材影像',
  IN_TRANSIT: '转运中',
  LABEL_PRINT: '标签打印',
  MEDIA_UPLOAD: '上传影像',
  MEDICAL_ORDER_CREATE: '医嘱开立',
  PARTIALLY_RECEIVED: '部分接收',
  REPORT: '报告',
  REPORT_PUBLISHED: '报告发布',
  REPORT_REVIEW: '报告审核',
  REPORT_SIGN: '报告签发',
  RECEIVED: '已接收',
  RECEPTION: '标本接收',
  REMOVAL: '离体确认',
  REGISTERED: '已登记',
  REJECTED: '已拒收',
  SLICING: '切片',
  SPECIMEN_COLLECTION: '标本登记',
  SPECIMEN_REGISTER: '标本登记',
  SPECIMEN_REGISTRATION: '标本登记',
  STAINING: '染色出片',
  SUBMITTED: '已提交',
  TRANSPORT_HANDOVER: '转运交接',
  TRANSPORT: '转运交接',
  UPLOAD_MEDIA: '上传影像',
  VERIFICATION: '标本核对',
  VOIDED: '已作废',
};
const specimenStatusLabels = {
  CHECKED_IN: '已入库',
  FIXED: '固定完成',
  FIXING: '固定中',
  IN_TRANSIT: '转运中',
  RECEIVED: '已接收',
  REGISTERED: '已登记',
  REJECTED: '已拒收',
  RETURNED: '已退回',
  VERIFIED: '已核对',
  VERIFYING: '核对中',
} satisfies LabelMap;
const labelPrintStatusLabels = {
  FAILED: '打印失败',
  PENDING: '待打印',
  SUCCESS: '打印成功',
} satisfies LabelMap;
const receiptStatusLabels = {
  RECEIVED: '已接收',
  REJECTED: '已拒收',
  RETURNED: '已退回',
} satisfies LabelMap;
const qualityCheckResultLabels = {
  FAILED: '不合格',
  PASSED: '合格',
} satisfies LabelMap;
const transportStatusLabels = {
  ...createLabelMap(TRANSPORT_STATUS_OPTIONS),
  CANCELLED: '已取消',
  COMPLETED: '已完成',
} satisfies LabelMap;
const trackingEventTypeLabels: LabelMap = {
  BOUND: '绑定条码',
  CANCEL_MATERIAL_VERIFICATION: '取消材块核对',
  CHECKED_IN: '执行入库',
  COMPLETE: '完成',
  COMPLETED: '完成固定',
  CREATE: '创建',
  CREATED: '创建',
  CREATE_MATERIAL: '创建材块',
  DIRECT_RECEIVE: '直接接收',
  HANDED_OVER: '完成交接',
  ORDER_CREATED: '创建转运单',
  ORDER_PRINTED: '打印转运单',
  PRINTED: '打印标签',
  RECEIVED: '接收标本',
  REGISTERED: '登记标本',
  REJECTED: '拒收标本',
  REMOVE_MATERIAL: '删除材块',
  REBOUND: '重绑条码',
  RETRY: '标签补打',
  RETURNED: '退回标本',
  START: '开始',
  STARTED: '开始固定',
  UNBOUND: '取消绑定条码',
  UPLOAD_MEDIA: '上传影像',
  VERIFIED: '完成核对',
  VERIFYING: '开始核对',
  VERIFY_MATERIAL: '核对材块',
};

const trackingEventContentPatterns: Array<{
  pattern: RegExp;
  replace: (match: RegExpMatchArray) => string;
}> = [
  {
    pattern: /^Specimen barcode bound to (.+)$/i,
    replace: (match) => `绑定条码 ${match[1]}`,
  },
  {
    pattern: /^Specimen barcode rebound from (.+) to (.+)$/i,
    replace: (match) => `重绑条码 ${match[1]} → ${match[2]}`,
  },
  {
    pattern: /^Specimen barcode unbound from (.+)$/i,
    replace: (match) => `取消条码绑定 ${match[1]}`,
  },
  {
    pattern: /^Registered specimen(?: (?!null$)(.+))?$/i,
    replace: (match) => (match[1] ? `登记标本 ${match[1]}` : '登记标本'),
  },
];
const trackingEventStatusLabels = {
  FAILED: '失败',
  MATCHED: '匹配成功',
  RECEIVED: '已接收',
  REJECTED: '已拒收',
  RETURNED: '已退回',
  SUCCESS: '成功',
} satisfies LabelMap;

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

export function formatTrackingNodeTitle(value?: null | string) {
  const normalized = value?.trim();
  if (!normalized) {
    return '流程事件';
  }
  return currentNodeLabels[normalized] ?? '流程事件';
}

export function formatSpecimenStatus(value?: null | string) {
  return formatMappedValue(value, specimenStatusLabels);
}

export function formatFixationStatus(value?: null | string) {
  return formatMappedValue(value, fixationStatusLabels);
}

export function formatVerificationStatus(value?: null | string) {
  return formatMappedValue(value, verificationStatusLabels);
}

export function formatCheckInStatus(value?: null | string) {
  return formatMappedValue(value, checkInStatusLabels);
}

export function formatLabelPrintStatus(value?: null | string) {
  return formatMappedValue(value, labelPrintStatusLabels);
}

export function formatReceiptStatus(value?: null | string) {
  return formatMappedValue(value, receiptStatusLabels);
}

export function formatQualityCheckResult(value?: null | string) {
  return formatMappedValue(value, qualityCheckResultLabels);
}

export function formatTransportStatus(value?: null | string) {
  return formatMappedValue(value, transportStatusLabels);
}

export function formatTrackingEventType(
  value?: null | string,
  nodeCode?: null | string,
) {
  const normalized = value?.trim();
  if (!normalized) {
    return '流程事件';
  }
  const normalizedNodeCode = nodeCode?.trim();
  if (
    normalizedNodeCode === 'FIXATION' &&
    ['START', 'STARTED'].includes(normalized)
  ) {
    return '开始固定';
  }
  if (
    normalizedNodeCode === 'FIXATION' &&
    ['COMPLETE', 'COMPLETED'].includes(normalized)
  ) {
    return '完成固定';
  }
  return trackingEventTypeLabels[normalized] ?? '流程事件';
}

export function formatTrackingEventStatus(value?: null | string) {
  return formatMappedValue(value, trackingEventStatusLabels);
}

function localizeTrackingEventContent(value: string) {
  const trimmed = value.trim();
  for (const { pattern, replace } of trackingEventContentPatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      return replace(match);
    }
  }
  if (/[\u4E00-\u9FFF]/.test(trimmed)) {
    return trimmed;
  }
  return '';
}

export function formatTrackingEventContent(
  event: Partial<Pick<TrackingEventView, 'nodeCode'>> &
    Pick<TrackingEventView, 'eventContent' | 'eventType'>,
) {
  const content = event.eventContent?.trim();
  if (content) {
    const localized = localizeTrackingEventContent(content);
    if (localized) {
      return localized;
    }
  }
  return formatTrackingEventType(event.eventType, event.nodeCode);
}
