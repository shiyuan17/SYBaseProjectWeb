import dayjs from 'dayjs';

import {
  QC_TYPE_OPTIONS,
  REWORK_TYPE_OPTIONS,
  TECHNICAL_OBJECT_TYPE_OPTIONS,
  TECHNICAL_TASK_PRIORITY_OPTIONS,
  TECHNICAL_TASK_STATUS_OPTIONS,
  TECHNICAL_TASK_TYPE_OPTIONS,
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

const taskTypeLabels = {
  ...createLabelMap(TECHNICAL_TASK_TYPE_OPTIONS),
  REWORK: '返工',
} satisfies Record<string, string>;
const taskStatusLabels = {
  ...createLabelMap(TECHNICAL_TASK_STATUS_OPTIONS),
  RETURNED: '已退回',
} satisfies Record<string, string>;
const objectTypeLabels = createLabelMap(TECHNICAL_OBJECT_TYPE_OPTIONS);
const taskPriorityLabels = createLabelMap(TECHNICAL_TASK_PRIORITY_OPTIONS);
const reworkTypeLabels = {
  ...createLabelMap(REWORK_TYPE_OPTIONS),
  ADD_SLIDE: '补片',
  DEEPER_CUT: '加深切片',
  RECUT: '重切',
} satisfies Record<string, string>;
const qcTypeLabels = createLabelMap(QC_TYPE_OPTIONS);
const caseStatusLabels = {
  DIAGNOSIS_PENDING: '待诊断',
  EMBEDDING: '待切片',
  RECEIVED: '已接收',
  REPORT_PENDING_REVIEW: '待审核',
  REPORT_PUBLISHED: '已发布报告',
  SAMPLING: '取材中',
  SLICING: '切片中',
  STAINING: '染色中',
} satisfies Record<string, string>;
const batchStatusLabels = {
  COMPLETED: '已完成',
  IN_PROGRESS: '处理中',
  PENDING: '待开始',
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
const slideStatusLabels = {
  PENDING: '待染色',
  STAINED: '已染色',
} satisfies Record<string, string>;
const qualityStatusLabels = {
  CREATED: '待质控',
  QUALIFIED: '合格',
  UNQUALIFIED: '不合格',
} satisfies Record<string, string>;
const evaluationResultLabels = {
  QUALIFIED: '合格',
  REWORK_REQUIRED: '需返工',
  UNQUALIFIED: '不合格',
} satisfies Record<string, string>;
const eventTypeLabels = {
  COMPLETE: '完成',
  CREATE: '创建',
  CREATE_BATCH: '创建批次',
  EVALUATE: '质控评估',
  EXECUTE: '执行返工',
  MARK: '打号',
  START: '开始',
} satisfies Record<string, string>;
const eventStatusLabels = {
  FAILED: '失败',
  REWORK_REQUIRED: '需返工',
  SUCCESS: '成功',
} satisfies Record<string, string>;

export function formatDateTime(value?: null | string) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-';
}

export function formatNullable(value?: null | string) {
  return value && value.trim() ? value : '-';
}

export function formatTaskType(value?: null | string) {
  return formatMappedValue(value, taskTypeLabels);
}

export function formatTaskStatus(value?: null | string) {
  return formatMappedValue(value, taskStatusLabels);
}

export function formatTaskPriority(value?: null | string) {
  return formatMappedValue(value, taskPriorityLabels);
}

export function formatObjectType(value?: null | string) {
  return formatMappedValue(value, objectTypeLabels);
}

export function formatCaseStatus(value?: null | string) {
  return formatMappedValue(value, caseStatusLabels);
}

export function formatBatchStatus(value?: null | string) {
  return formatMappedValue(value, batchStatusLabels);
}

export function formatSpecimenStatus(value?: null | string) {
  return formatMappedValue(value, specimenStatusLabels);
}

export function formatSlideStatus(value?: null | string) {
  return formatMappedValue(value, slideStatusLabels);
}

export function formatQualityStatus(value?: null | string) {
  return formatMappedValue(value, qualityStatusLabels);
}

export function formatQcType(value?: null | string) {
  return formatMappedValue(value, qcTypeLabels);
}

export function formatEvaluationResult(value?: null | string) {
  return formatMappedValue(value, evaluationResultLabels);
}

export function formatReworkType(value?: null | string) {
  return formatMappedValue(value, reworkTypeLabels);
}

export function formatEventType(value?: null | string) {
  return formatMappedValue(value, eventTypeLabels);
}

export function formatEventStatus(value?: null | string) {
  return formatMappedValue(value, eventStatusLabels);
}
