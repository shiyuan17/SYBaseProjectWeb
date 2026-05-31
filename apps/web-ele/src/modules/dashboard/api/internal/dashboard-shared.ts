export function hasAnyPermission(accessCodes: string[], codes: string[]) {
  return codes.some((code) => accessCodes.includes(code));
}

export const formatCount = String;

export function formatCurrency(value: string) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return value;
  }
  return numeric.toFixed(2);
}

export type DashboardMetricSourceRow = {
  indicatorCode: string;
  indicatorName: string;
  metricUnit: string;
  metricValue: string;
};

export function mapRowsToTable(
  rows: DashboardMetricSourceRow[],
  wantedCodes: string[],
) {
  return wantedCodes
    .map((code) => rows.find((row) => row.indicatorCode === code))
    .filter((row): row is NonNullable<typeof row> => row !== undefined)
    .map((row) => ({
      code: row.indicatorCode,
      label: row.indicatorName,
      unit: row.metricUnit,
      value: row.metricValue,
    }));
}
