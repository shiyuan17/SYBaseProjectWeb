export function formatDateTime(value: null | string | undefined) {
  if (!value) {
    return '-';
  }
  return value.replace('T', ' ').replace(/\.\d+$/, '');
}

export function formatNullable(value: null | string | undefined) {
  return value && value.trim() ? value : '-';
}
