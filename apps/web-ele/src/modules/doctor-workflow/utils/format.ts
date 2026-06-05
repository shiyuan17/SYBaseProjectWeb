const EMPTY_TEXT = '-';

const DIAGNOSTIC_TASK_STATUS_LABELS: Record<string, string> = {
  ACCEPTED: '已接单',
  ASSIGNED: '已分派',
  CANCELLED: '已取消',
  COMPLETED: '已完成',
  IN_PROGRESS: '诊断中',
  PENDING: '待分派',
};

const DIAGNOSTIC_TASK_TYPE_LABELS: Record<string, string> = {
  CONSULTATION: '会诊',
  FROZEN: '冰冻',
  PRIMARY: '初诊',
  REVIEW: '复诊',
};

const APPLICATION_TYPE_LABELS: Record<string, string> = {
  CONSULTATION: '会诊',
  CYTOLOGY: '细胞学',
  CYTOLOGY_CONSULTATION: '细胞学会诊',
  CYTOLOGY_SMEAR: '细胞学刮片',
  DIFFICULT_CONSULTATION: '疑难会诊',
  ELECTRON_MICROSCOPY: '电镜',
  FISH: 'FISH',
  FROZEN: '冰冻',
  GENE_TEST: '基因检测',
  GYNECOLOGY_LBC_CYTOLOGY: '妇科液基细胞学',
  GYNECOLOGY_LBC_DNA: '妇科液基DNA',
  GYNECOLOGY_LBC_HPV: '妇科液基HPV',
  HPV: 'HPV',
  IHC: '免疫组化',
  IMMUNE_FLUORESCENCE: '免疫荧光',
  MOLECULAR_PATHOLOGY: '分子病理',
  NGS: '二代测序',
  NON_GYNECOLOGY_LBC_CYTOLOGY: '非妇科液基细胞学',
  PUNCTURE_BIOPSY: '穿刺活检',
  RAPID: '快速',
  RESEARCH: '科研',
  ROUTINE: '常规',
  SUPPLEMENTAL_REPORT: '补充报告',
  TECHNICAL_ORDER: '技术医嘱',
};

const REPORT_STATUS_LABELS: Record<string, string> = {
  DRAFT: '草稿',
  PUBLISHED: '已发布',
  REVIEWED: '已审核',
  SIGNED: '已签发',
  SUBMITTED: '已提交',
};

const MEDICAL_ORDER_STATUS_LABELS: Record<string, string> = {
  ACCEPTED: '已接收',
  CANCELLED: '已取消',
  COMPLETED: '已完成',
  PENDING: '待处理',
};

const MEDICAL_ORDER_TYPE_LABELS: Record<string, string> = {
  IMMUNOHISTOCHEMISTRY: '免疫组化',
  OTHER: '其他',
  RE_STAIN: '重染',
  SPECIAL_STAIN: '特殊染色',
};

export function formatNullable(value?: null | number | string) {
  if (value === null || value === undefined || value === '') {
    return EMPTY_TEXT;
  }
  return String(value);
}

export function formatDateTime(value?: null | string) {
  return formatNullable(value);
}

export function formatDiagnosticTaskStatus(value?: null | string) {
  if (!value) {
    return EMPTY_TEXT;
  }
  return DIAGNOSTIC_TASK_STATUS_LABELS[value] ?? value;
}

export function formatDiagnosticTaskType(value?: null | string) {
  if (!value) {
    return EMPTY_TEXT;
  }
  return DIAGNOSTIC_TASK_TYPE_LABELS[value] ?? value;
}

export function formatApplicationType(value?: null | string) {
  const normalizedValue = value?.trim().toUpperCase();
  if (!normalizedValue) {
    return EMPTY_TEXT;
  }
  return APPLICATION_TYPE_LABELS[normalizedValue] ?? value;
}

export function formatReportStatus(value?: null | string) {
  if (!value) {
    return EMPTY_TEXT;
  }
  return REPORT_STATUS_LABELS[value] ?? value;
}

export function formatMedicalOrderStatus(value?: null | string) {
  if (!value) {
    return EMPTY_TEXT;
  }
  return MEDICAL_ORDER_STATUS_LABELS[value] ?? value;
}

export function formatMedicalOrderType(value?: null | string) {
  if (!value) {
    return EMPTY_TEXT;
  }
  return MEDICAL_ORDER_TYPE_LABELS[value] ?? value;
}
