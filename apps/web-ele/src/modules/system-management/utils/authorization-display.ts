const ROLE_TYPE_LABELS: Record<string, string> = {
  BIZ: '业务角色',
  BUSINESS: '业务角色',
  SYSTEM: '系统角色',
};

const SCOPE_LABELS: Record<string, string> = {
  ALL: '全部数据',
  CUSTOM: '自定义',
  DEPARTMENT: '本科室',
  SELF: '本人',
};

function formatMappedValue(
  value: null | string | undefined,
  mapping: Record<string, string>,
) {
  if (!value || !value.trim()) {
    return '-';
  }
  return mapping[value] ?? value;
}

export function formatRoleTypeLabel(value: null | string | undefined) {
  return formatMappedValue(value, ROLE_TYPE_LABELS);
}

export function formatDataScopeLabel(value: null | string | undefined) {
  return formatMappedValue(value, SCOPE_LABELS);
}

export function formatStatScopeLabel(value: null | string | undefined) {
  return formatMappedValue(value, SCOPE_LABELS);
}
