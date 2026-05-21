import dayjs from 'dayjs';

export function formatDateTime(value?: null | string) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-';
}

export function formatNullable(value?: null | string) {
  return value && value.trim() ? value : '-';
}
