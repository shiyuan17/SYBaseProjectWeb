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

const CASE_STATUS_LABELS: Record<string, string> = {
  ARCHIVED: '已归档',
  CANCELLED: '已取消',
  CLOSED: '已闭环',
  COLLECTION: '标本采集',
  DEHYDRATION: '脱水中',
  DEHYDRATION_PENDING: '待脱水',
  DIAGNOSING: '诊断中',
  DIAGNOSIS_PENDING: '待诊断',
  EMBEDDING: '包埋中',
  FIXATION: '固定中',
  GROSSING_PENDING: '待取材',
  IN_DIAGNOSIS: '诊断中',
  IN_TRANSIT: '转运中',
  PUBLISHED: '已发布',
  RECEIVED: '已接收',
  REGISTERED: '已登记',
  REPORT_PENDING_REVIEW: '待审核',
  REPORT_REVIEWED: '已审核',
  REPORT_REVIEWING: '审核中',
  REPORT_SIGNED: '已签发',
  REPORT_PUBLISHED: '已发布报告',
  REPORTING: '报告中',
  REVIEWED: '已审核',
  REVIEWING: '审核中',
  SAMPLING: '取材中',
  SIGNED: '已签发',
  SLICING: '切片中',
  STAINING: '染色中',
  SUBMITTED: '已提交',
};

const REPORT_STATUS_LABELS: Record<string, string> = {
  AMENDED: '已修订',
  DRAFT: '草稿',
  PUBLISHED: '已发布',
  REVIEWED: '已审核',
  SIGNED: '已签发',
  SUBMITTED: '已提交',
  WITHDRAWN: '已撤回',
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

const LIFECYCLE_STAGE_LABELS: Record<string, string> = {
  APPLICATION: '申请创建',
  ARCHIVE: '归档借阅',
  REPORT: '诊断报告',
  SPECIMEN: '标本',
  TECHNICAL: '技术处理',
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

const SPECIMEN_STATUS_LABELS: Record<string, string> = {
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
};

const RECEIPT_STATUS_LABELS: Record<string, string> = {
  PARTIALLY_RECEIVED: '部分接收',
  RECEIVED: '已接收',
  REJECTED: '已拒收',
  RETURNED: '已退回',
};

const SLIDE_STATUS_LABELS: Record<string, string> = {
  ARCHIVED: '已归档',
  COMPLETED: '已完成',
  CREATED: '待处理',
  PENDING: '待处理',
  PRINTED: '已打印',
  QC_PENDING: '待质控',
  READY: '待处理',
  REWORKED: '已返工',
  SLICED: '已切片',
  STAINED: '已染色',
};

const QUALITY_STATUS_LABELS: Record<string, string> = {
  CREATED: '待质控',
  FAIL: '不合格',
  FAILED: '不合格',
  PASS: '合格',
  PASSED: '合格',
  PENDING: '待质控',
  QUALIFIED: '合格',
  REWORK_REQUIRED: '需返工',
  UNQUALIFIED: '不合格',
};

const REWORK_STATUS_LABELS: Record<string, string> = {
  COMPLETED: '已返工',
  CREATED: '已发起',
  IN_PROGRESS: '返工中',
  PENDING: '待返工',
  REWORK_REQUIRED: '需返工',
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
  SPECIAL: '特殊染色',
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

export function formatCaseStatus(value?: null | string) {
  if (!value) {
    return EMPTY_TEXT;
  }
  return CASE_STATUS_LABELS[value] ?? value;
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

export function formatLifecycleStage(
  title?: null | string,
  stageCode?: null | string,
) {
  const normalizedTitle = title?.trim();
  if (normalizedTitle) {
    return normalizedTitle;
  }
  if (!stageCode) {
    return EMPTY_TEXT;
  }
  return LIFECYCLE_STAGE_LABELS[stageCode] ?? stageCode;
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

export function formatSpecimenStatus(value?: null | string) {
  if (!value) {
    return EMPTY_TEXT;
  }
  return SPECIMEN_STATUS_LABELS[value] ?? value;
}

export function formatReceiptStatus(value?: null | string) {
  if (!value) {
    return EMPTY_TEXT;
  }
  return RECEIPT_STATUS_LABELS[value] ?? value;
}

export function formatSlideStatus(value?: null | string) {
  if (!value) {
    return EMPTY_TEXT;
  }
  return SLIDE_STATUS_LABELS[value] ?? value;
}

export function formatQualityStatus(value?: null | string) {
  if (!value) {
    return EMPTY_TEXT;
  }
  return QUALITY_STATUS_LABELS[value] ?? value;
}

export function formatReworkStatus(value?: null | string) {
  if (!value) {
    return EMPTY_TEXT;
  }
  return REWORK_STATUS_LABELS[value] ?? value;
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
