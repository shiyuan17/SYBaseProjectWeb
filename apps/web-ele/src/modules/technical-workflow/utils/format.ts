import type { TechnicalTrackingEventSummary } from '../types/technical-workflow';

import dayjs from 'dayjs';

import { APPLICATION_TYPE_OPTIONS } from '#/modules/specimen-workflow/constants';

import {
  QC_TYPE_OPTIONS,
  REWORK_TYPE_OPTIONS,
  TECHNICAL_OBJECT_TYPE_OPTIONS,
  TECHNICAL_TASK_PRIORITY_OPTIONS,
  TECHNICAL_TASK_STATUS_OPTIONS,
  TECHNICAL_TASK_TYPE_OPTIONS,
} from '../constants';

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
const applicationTypeLabels = createLabelMap(APPLICATION_TYPE_OPTIONS);
const qcTypeLabels = createLabelMap(QC_TYPE_OPTIONS);
const caseStatusLabels = {
  DIAGNOSIS_PENDING: '待诊断',
  IN_DIAGNOSIS: '诊断中',
  EMBEDDING: '待切片',
  RECEIVED: '已接收',
  REPORT_DRAFT: '报告草稿',
  REPORT_PENDING_REVIEW: '待审核',
  REPORT_REJECTED: '报告驳回',
  REPORT_REVIEWED: '已审核',
  REPORT_SIGNED: '已签发',
  REPORT_PUBLISHED: '已发布报告',
  REPORTING: '报告中',
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
const specimenRegistrationStatusLabels = {
  COMPLETED: '已登记',
  PENDING: '待登记',
  REGISTERED: '已登记',
  SAVED: '已保存',
} satisfies Record<string, string>;
const slideStatusLabels = {
  CREATED: '待染色',
  PENDING: '待染色',
  PRINTED: '已打印',
  STAINED: '已染色',
} satisfies Record<string, string>;
const qualityStatusLabels = {
  CREATED: '待质控',
  PENDING: '待质控',
  QUALIFIED: '合格',
  UNQUALIFIED: '不合格',
} satisfies Record<string, string>;
const evaluationResultLabels = {
  QUALIFIED: '合格',
  REWORK_REQUIRED: '需返工',
  UNQUALIFIED: '不合格',
} satisfies Record<string, string>;
const embeddingEvaluationLevelLabels = {
  EXCELLENT: '优秀',
  QUALIFIED: '合格',
  UNQUALIFIED: '不合格',
} satisfies Record<string, string>;
const eventTypeLabels = {
  COMPLETE: '完成',
  CREATE: '创建',
  CREATE_BATCH: '创建批次',
  EVALUATE: '质控评估',
  EXECUTE: '执行返工',
  MARK: '打号',
  SAVE_MATERIALS: '保存材料',
  START: '开始',
  UPLOAD: '上传',
  UPLOAD_MEDIA: '上传影像',
} satisfies Record<string, string>;
const eventStatusLabels = {
  FAILED: '失败',
  REWORK_REQUIRED: '需返工',
  SUCCESS: '成功',
} satisfies Record<string, string>;
const technicalTrackingEventContentLabels: Record<string, string> = {
  'RECEIVED|CREATE|SUCCESS': '标本已接收',
  'TECHNICAL_SPECIMEN_REGISTRATION|COMPLETE|SUCCESS': '技术标本登记已完成',
  'TECHNICAL_SPECIMEN_REGISTRATION|SAVE_MATERIALS|SUCCESS':
    '技术标本登记材料已保存',
  'GROSSING|CREATE|SUCCESS': '取材任务已创建',
  'GROSSING|START|SUCCESS': '取材开始',
  'GROSSING|COMPLETE|SUCCESS': '取材完成',
  'DEHYDRATION|CREATE_BATCH|SUCCESS': '脱水批次已创建',
  'DEHYDRATION|START|SUCCESS': '脱水开始',
  'DEHYDRATION|COMPLETE|SUCCESS': '脱水完成',
  'EMBEDDING|START|SUCCESS': '包埋开始',
  'EMBEDDING|COMPLETE|SUCCESS': '包埋完成',
  'SLICING|START|SUCCESS': '切片开始',
  'SLICING|SLIDE_PRINT|SUCCESS': '玻片已打印',
  'SLICING|MARK|SUCCESS': '玻片已打号',
  'SLICING|COMPLETE|SUCCESS': '切片完成',
  'STAINING|START|SUCCESS': '染色开始',
  'STAINING|COMPLETE|SUCCESS': '染色出片完成',
  'QUALITY_CONTROL|EVALUATE|SUCCESS': '质控评估已完成',
};

function normalizeCodeValue(value?: null | string) {
  return value?.trim().toUpperCase() ?? '';
}

function containsCjkCharacter(value: string) {
  return /[\u3400-\u9FFF]/u.test(value);
}

export function formatDateTime(value?: null | string) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-';
}

export function getTodayWorkDate() {
  return dayjs().format('YYYY-MM-DD');
}

export function normalizeWorkDate(value?: null | string) {
  if (!value?.trim()) {
    return '';
  }
  return dayjs(value).format('YYYY-MM-DD');
}

export function buildWorkDateRange(workDate?: null | string) {
  const normalizedWorkDate = normalizeWorkDate(workDate);
  if (!normalizedWorkDate) {
    return { createdFrom: undefined, createdTo: undefined };
  }
  return {
    createdFrom: `${normalizedWorkDate}T00:00:00`,
    createdTo: dayjs(normalizedWorkDate)
      .add(1, 'day')
      .format('YYYY-MM-DD[T]00:00:00'),
  };
}

export function formatNullable(value?: null | string) {
  return value && value.trim() ? value : '-';
}

export function formatPatientIdDisplay(
  patientIdDisplay?: null | string,
  patientId?: null | string,
) {
  return formatNullable(patientIdDisplay?.trim() || patientId?.trim() || null);
}

export function formatSlicingSlideDisplayNo(
  slideNo?: null | string,
  embeddingBoxNo?: null | string,
) {
  const normalizedSlideNo = slideNo?.trim();
  if (normalizedSlideNo) {
    return normalizedSlideNo.replaceAll('+', '-');
  }

  const normalizedEmbeddingBoxNo = embeddingBoxNo?.trim();
  if (normalizedEmbeddingBoxNo) {
    return normalizedEmbeddingBoxNo.replaceAll('+', '-');
  }

  return '-';
}

export function formatPendingPathologyNo(value?: null | string) {
  return value && value.trim() ? value : '待生成';
}

export function formatRegistrationWorkspacePathologyNo(value?: null | string) {
  return value && value.trim() ? value : '登记生成';
}

export function formatTechnicalTrackingApplicationType(value?: null | string) {
  return formatMappedValue(value, applicationTypeLabels);
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

export function formatSpecimenRegistrationStatus(value?: null | string) {
  const formattedValue = formatMappedValue(
    value,
    specimenRegistrationStatusLabels,
  );
  if (formattedValue !== value?.trim()) {
    return formattedValue;
  }
  return /^[A-Z_]+$/.test(formattedValue) ? '未知状态' : formattedValue;
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

export function formatEmbeddingEvaluationLevel(value?: null | string) {
  const formattedValue = formatMappedValue(
    value,
    embeddingEvaluationLevelLabels,
  );
  if (formattedValue !== value?.trim()) {
    return formattedValue;
  }
  return /^[A-Z_]+$/.test(formattedValue) ? '未知评价' : formattedValue;
}

export function formatReworkType(value?: null | string) {
  return formatMappedValue(value, reworkTypeLabels);
}

export function formatEventType(value?: null | string) {
  const formattedValue = formatMappedValue(value, eventTypeLabels);
  if (formattedValue !== value?.trim()) {
    return formattedValue;
  }
  return /^[A-Z_]+$/.test(formattedValue) ? '流程事件' : formattedValue;
}

export function formatEventStatus(value?: null | string) {
  return formatMappedValue(value, eventStatusLabels);
}

export function formatTechnicalTrackingEventContent(
  event: Pick<
    TechnicalTrackingEventSummary,
    'eventContent' | 'eventStatus' | 'eventType' | 'nodeCode'
  >,
) {
  const rawContent = event.eventContent?.trim();
  if (rawContent && containsCjkCharacter(rawContent)) {
    return rawContent;
  }

  const structuredKey = [
    normalizeCodeValue(event.nodeCode),
    normalizeCodeValue(event.eventType),
    normalizeCodeValue(event.eventStatus),
  ].join('|');
  const structuredContent = technicalTrackingEventContentLabels[structuredKey];
  if (structuredContent) {
    return structuredContent;
  }

  return '技术流程事件';
}

export function formatTrackingTreeNodeStatus(
  type: 'CASE' | 'EMBEDDING_BOX' | 'SAMPLING_BLOCK' | 'SLIDE' | 'SPECIMEN',
  status?: null | string,
) {
  if (type === 'SPECIMEN') {
    return formatSpecimenStatus(status);
  }
  if (type === 'SLIDE') {
    return formatSlideStatus(status);
  }
  return formatTaskStatus(status);
}
