import type { LocationQueryValue } from 'vue-router';

export function firstQueryParam(
  value: LocationQueryValue | LocationQueryValue[] | undefined,
) {
  const normalizedValue = Array.isArray(value) ? value[0] : value;
  return normalizedValue ?? '';
}
