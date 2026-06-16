const MEDICAL_ORDER_CATEGORY_CODE_LABELS: Record<string, string> = {
  ROUTINE: '常规医嘱',
  SPECIAL: '特检医嘱',
};

const MEDICAL_ORDER_EXECUTION_SCOPE_LABELS: Record<string, string> = {
  GLOBAL: '全院可用',
  TECHNICIAN: '技师执行',
};

const MEDICAL_ORDER_TYPE_LABELS: Record<string, string> = {
  ROUTINE: '常规医嘱',
  SPECIAL: '特检医嘱',
};

const NUMBERING_RULE_BIZ_TYPE_LABELS: Record<string, string> = {
  APPLICATION_NO: '申请单号',
  BLOCK_NO: '蜡块号',
  BODY_PART_CODE: '部位编码',
  CHARGE_ITEM_CODE: '收费项目编码',
  CONFIG_CATEGORY_CODE: '配置分类编码',
  DEPARTMENT_CODE: '科室编码',
  GUIDELINE_CATEGORY_CODE: '规范分类编码',
  GUIDELINE_CODE: '规范编码',
  LOGIN_TAG_CODE: '登录标签编码',
  ORDER_CATEGORY_CODE: '医嘱分类编码',
  ORDER_ITEM_CODE: '医嘱条目编码',
  PACKAGE_CODE: '套餐编码',
  PATHOLOGY_NO: '病理号',
  REPORT_NO: '报告号',
  ROLE_CODE: '角色编码',
  SLIDE_NO: '玻片号',
  SPECIMEN_NO: '标本号',
  TEMPLATE_CATEGORY_CODE: '模板分类编码',
  TEMPLATE_CODE: '模板编码',
  TRANSPORT_ORDER_NO: '转运单号',
  USER_CODE: '用户编码',
};

const NUMBERING_RULE_RESET_POLICY_LABELS: Record<string, string> = {
  DAILY: '每日重置',
  MONTHLY: '每月重置',
  NONE: '不重置',
  YEARLY: '每年重置',
};

const NUMBERING_RULE_SCOPE_TYPE_LABELS: Record<string, string> = {
  CASE: '按病例',
  DEPARTMENT: '按科室',
  GLOBAL: '全局',
  LAB: '按实验室',
};

export const MEDICAL_ORDER_EXECUTION_SCOPE_OPTIONS = [
  { label: '技师执行', value: 'TECHNICIAN' },
  { label: '全院可用', value: 'GLOBAL' },
] as const;

export const MEDICAL_ORDER_TYPE_OPTIONS = [
  { label: '常规医嘱', value: 'ROUTINE' },
  { label: '特检医嘱', value: 'SPECIAL' },
] as const;

export function formatDateTime(value: null | string | undefined) {
  if (!value) {
    return '-';
  }
  return value.replace('T', ' ').replace(/\.\d+$/, '');
}

export function formatNullable(value: null | string | undefined) {
  return value && value.trim() ? value : '-';
}

function formatCodeLabel(
  labels: Record<string, string>,
  value: null | string | undefined,
) {
  const normalizedValue = value?.trim().toUpperCase();

  if (!normalizedValue) {
    return '-';
  }

  return labels[normalizedValue] ?? value;
}

export function formatMedicalOrderCategoryCode(
  value: null | string | undefined,
) {
  return formatCodeLabel(MEDICAL_ORDER_CATEGORY_CODE_LABELS, value);
}

export function formatMedicalOrderExecutionScope(
  value: null | string | undefined,
) {
  return formatCodeLabel(MEDICAL_ORDER_EXECUTION_SCOPE_LABELS, value);
}

export function formatMedicalOrderType(value: null | string | undefined) {
  return formatCodeLabel(MEDICAL_ORDER_TYPE_LABELS, value);
}

export function formatNumberingRuleBizType(value: null | string | undefined) {
  return formatCodeLabel(NUMBERING_RULE_BIZ_TYPE_LABELS, value);
}

export function formatNumberingRuleResetPolicy(
  value: null | string | undefined,
) {
  return formatCodeLabel(NUMBERING_RULE_RESET_POLICY_LABELS, value);
}

export function formatNumberingRuleScopeType(value: null | string | undefined) {
  return formatCodeLabel(NUMBERING_RULE_SCOPE_TYPE_LABELS, value);
}
