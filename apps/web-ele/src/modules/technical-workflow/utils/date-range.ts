import dayjs from 'dayjs';

export interface DateRangeQueryParams {
  dateFrom?: string;
  dateTo?: string;
}

export interface LegacyWorkDateQueryParams {
  workDate?: string;
}

export interface DateRangeShortcut {
  text: string;
  value: () => [Date, Date];
}

function createDayRange(date: dayjs.Dayjs): [Date, Date] {
  return [date.startOf('day').toDate(), date.startOf('day').toDate()];
}

function resolveWeekStart(date: dayjs.Dayjs) {
  const mondayOffset = (date.day() + 6) % 7;
  return date.subtract(mondayOffset, 'day').startOf('day');
}

export function createDatePickerPanelDefaultValue() {
  const today = new Date();
  return [today, new Date(today)] as [Date, Date];
}

export function createDateRangePickerShortcuts(): DateRangeShortcut[] {
  return [
    {
      text: '今天',
      value: () => {
        const today = dayjs();
        return createDayRange(today);
      },
    },
    {
      text: '昨天',
      value: () => {
        const yesterday = dayjs().subtract(1, 'day');
        return createDayRange(yesterday);
      },
    },
    {
      text: '本周',
      value: () => {
        const today = dayjs();
        return [
          resolveWeekStart(today).toDate(),
          today.startOf('day').toDate(),
        ];
      },
    },
    {
      text: '本月',
      value: () => {
        const today = dayjs();
        return [today.startOf('month').toDate(), today.startOf('day').toDate()];
      },
    },
  ];
}

export function disableFutureDate(date: Date) {
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  return date.getTime() > endOfToday.getTime();
}

export function normalizeDateValue(value?: null | string) {
  if (!value?.trim()) {
    return '';
  }
  return dayjs(value).format('YYYY-MM-DD');
}

export function normalizeDateRange(
  value?: null | readonly string[] | string[],
): string[] {
  if (!value || value.length !== 2) {
    return [];
  }
  const start = normalizeDateValue(value[0]);
  const end = normalizeDateValue(value[1]);
  if (!start || !end) {
    return [];
  }
  return [start, end];
}

export function buildDateRangeQueryParams(
  value?: null | readonly string[] | string[],
): DateRangeQueryParams {
  const normalizedRange = normalizeDateRange(value);
  if (normalizedRange.length !== 2) {
    return {};
  }
  const [dateFrom, dateTo] = normalizedRange;
  return {
    dateFrom,
    dateTo,
  };
}

export function buildCreatedDateRangeParams(
  value?: null | readonly string[] | string[],
): {
  createdFrom?: string;
  createdTo?: string;
} {
  const normalizedRange = normalizeDateRange(value);
  if (normalizedRange.length !== 2) {
    return {};
  }
  const [dateFrom, dateTo] = normalizedRange;
  return {
    createdFrom: `${dateFrom}T00:00:00`,
    createdTo: dayjs(dateTo).add(1, 'day').format('YYYY-MM-DD[T]00:00:00'),
  };
}

export function buildSingleDayDateRange(value?: null | string) {
  const normalizedDate = normalizeDateValue(value);
  return normalizedDate ? [normalizedDate, normalizedDate] : [];
}

export function resolveRouteDateRange(query: {
  dateFrom?: unknown;
  dateTo?: unknown;
  workDate?: unknown;
}) {
  const dateFrom =
    typeof query.dateFrom === 'string'
      ? normalizeDateValue(query.dateFrom)
      : '';
  const dateTo =
    typeof query.dateTo === 'string' ? normalizeDateValue(query.dateTo) : '';
  if (dateFrom && dateTo) {
    return [dateFrom, dateTo];
  }

  const workDate =
    typeof query.workDate === 'string'
      ? normalizeDateValue(query.workDate)
      : '';
  return workDate ? [workDate, workDate] : [];
}

export function buildDateRangeRouteQuery(
  value?: null | readonly string[] | string[],
): DateRangeQueryParams {
  return buildDateRangeQueryParams(value);
}
