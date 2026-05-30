export function normalizeText(value?: null | string) {
  return value?.trim() ?? '';
}

export function includesText(
  value: null | string | undefined,
  keyword?: null | string,
) {
  const normalizedKeyword = normalizeText(keyword).toLowerCase();
  if (!normalizedKeyword) {
    return true;
  }
  return normalizeText(value).toLowerCase().includes(normalizedKeyword);
}

export function compareNullableDateDesc(
  left?: null | string,
  right?: null | string,
) {
  return normalizeText(right).localeCompare(normalizeText(left));
}

export function withinDateRange(
  value: null | string | undefined,
  dateFrom?: null | string,
  dateTo?: null | string,
) {
  const normalizedValue = normalizeText(value).slice(0, 10);
  if (!normalizedValue) {
    return false;
  }
  const normalizedFrom = normalizeText(dateFrom).slice(0, 10);
  const normalizedTo = normalizeText(dateTo).slice(0, 10);
  if (normalizedFrom && normalizedValue < normalizedFrom) {
    return false;
  }
  if (normalizedTo && normalizedValue > normalizedTo) {
    return false;
  }
  return true;
}

export function paginateItems<T>(items: T[], page: number, size: number) {
  const safePage = Math.max(page, 1);
  const safeSize = Math.max(size, 1);
  const startIndex = (safePage - 1) * safeSize;
  return {
    items: items.slice(startIndex, startIndex + safeSize),
    page: safePage,
    size: safeSize,
    total: items.length,
  };
}

export function createNumericId(prefix: string, values: string[]) {
  let maxValue = 0;

  for (const currentValue of values) {
    const match = currentValue.match(/(\d+)(?!.*\d)/);
    const numericValue = match ? Number.parseInt(match[1] ?? '0', 10) : 0;
    maxValue = Math.max(maxValue, numericValue);
  }

  return `${prefix}-${String(maxValue + 1).padStart(3, '0')}`;
}

export function createTimestamp() {
  return new Date().toISOString().slice(0, 19);
}
