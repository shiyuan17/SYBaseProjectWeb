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

const REVISION_STATUS_LABELS: Record<string, string> = {
  APPROVED: '已通过',
  PENDING: '待审批',
  REJECTED: '已驳回',
};

const CONSULTATION_STATUS_LABELS: Record<string, string> = {
  COMPLETED: '已完成',
  IN_PROGRESS: '进行中',
  PENDING: '待开始',
};

const REPORT_DELIVERY_STATUS_LABELS: Record<string, string> = {
  ISSUED: '已发放',
  PENDING: '待发放',
  RECALLED: '已回收',
};

const REPORT_PRINT_STATUS_LABELS: Record<string, string> = {
  PRINTED: '已打印',
  UNPRINTED: '未打印',
};

const LIFECYCLE_NODE_STATUS_LABELS: Record<string, string> = {
  ACCEPTED: '已接收',
  ASSIGNED: '已分派',
  BORROWED: '已借阅',
  CANCELLED: '已取消',
  COMPLETED: '已完成',
  CONFIRMED: '已确认',
  FIXED: '已固定',
  IN_PROGRESS: '进行中',
  IN_STORAGE: '已归档',
  PENDING: '未发生',
  PRINTED: '已打印',
  PUBLISHED: '已发布',
  RECEIVED: '已签收',
  RECALLED: '已回收',
  REGISTERED: '已创建',
  REVIEWED: '已复核',
  RETURNED: '已归还',
  SIGNED: '已签发',
  STARTED: '已开始',
  STORED: '已入库',
  SUBMITTED: '已提交',
  VERIFIED: '已确认',
};

const ARCHIVE_STATUS_LABELS: Record<string, string> = {
  BORROWED: '借出中',
  IN_STORAGE: '已归档',
  NOT_ARCHIVED: '未归档',
  PENDING: '未归档',
  RETURNED: '已归还',
};

const LOAN_STATUS_LABELS: Record<string, string> = {
  BORROWED: '借出中',
  NONE: '未借阅',
  RETURNED: '已归还',
};

const MEDICAL_ORDER_STATUS_LABELS: Record<string, string> = {
  ACCEPTED: '已接收',
  CANCELLED: '已取消',
  COMPLETED: '已完成',
  FAILED: '执行失败',
  IN_PROGRESS: '执行中',
  PENDING: '待处理',
  PROCESSING: '处理中',
};

const MEDICAL_ORDER_TYPE_LABELS: Record<string, string> = {
  IMMUNOHISTOCHEMISTRY: '免疫组化',
  OTHER: '其他',
  RE_STAIN: '重染',
  ROUTINE: '常规',
  SPECIAL_STAIN: '特殊染色',
};

export function formatNullable(value?: null | number | string) {
  if (value === null || value === undefined || value === '') {
    return EMPTY_TEXT;
  }
  return String(value);
}

export function formatDateTime(value?: null | string) {
  const normalizedValue = value?.trim();
  if (!normalizedValue) {
    return EMPTY_TEXT;
  }
  const [datePart = '', timePart = ''] = normalizedValue
    .replace('T', ' ')
    .split(' ');
  const normalizedTimePart =
    timePart.match(/^\d{2}:\d{2}(?::\d{2})?/)?.[0] ?? '';
  if (!datePart || !normalizedTimePart) {
    return normalizedValue;
  }
  return `${datePart} ${normalizedTimePart.slice(0, 8).padEnd(8, ':00')}`;
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

export function formatRevisionStatus(value?: null | string) {
  if (!value) {
    return EMPTY_TEXT;
  }
  return REVISION_STATUS_LABELS[value] ?? value;
}

export function formatConsultationStatus(value?: null | string) {
  if (!value) {
    return EMPTY_TEXT;
  }
  return CONSULTATION_STATUS_LABELS[value] ?? value;
}

export function formatReportDeliveryStatus(value?: null | string) {
  if (!value) {
    return EMPTY_TEXT;
  }
  return REPORT_DELIVERY_STATUS_LABELS[value] ?? value;
}

export function formatReportPrintStatus(value?: null | string) {
  if (!value) {
    return EMPTY_TEXT;
  }
  return REPORT_PRINT_STATUS_LABELS[value] ?? value;
}

export function formatLifecycleNodeStatus(value?: null | string) {
  if (!value) {
    return EMPTY_TEXT;
  }
  return LIFECYCLE_NODE_STATUS_LABELS[value] ?? value;
}

export function formatArchiveStatus(value?: null | string) {
  if (!value) {
    return EMPTY_TEXT;
  }
  return ARCHIVE_STATUS_LABELS[value] ?? value;
}

export function formatLoanStatus(value?: null | string) {
  if (!value) {
    return EMPTY_TEXT;
  }
  return LOAN_STATUS_LABELS[value] ?? value;
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
