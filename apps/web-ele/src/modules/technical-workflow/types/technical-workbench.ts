export type TechnicalWorkbenchDayValue = 'next' | 'previous' | 'today';

export interface TechnicalWorkbenchRow {
  id: string;
  searchableText: string;
  workday?: TechnicalWorkbenchDayValue;
  [key: string]: boolean | null | number | string | undefined;
}

export interface TechnicalWorkbenchAction {
  id: string;
  hotkey?: string;
  label: string;
  requiresSelection?: boolean;
  tone?: 'danger' | 'default' | 'primary' | 'warning';
}

export interface TechnicalWorkbenchFilterConfig {
  group?: string;
  id: string;
  label: string;
  predicate: (row: TechnicalWorkbenchRow) => boolean;
}

export interface TechnicalWorkbenchColumn {
  align?: 'center' | 'left' | 'right';
  formatter?: (row: TechnicalWorkbenchRow, rowIndex: number) => string;
  key: string;
  label: string;
  minWidth?: number;
  width?: number;
}

export interface TechnicalWorkbenchMetric {
  id: string;
  label: string;
  tone?: 'danger' | 'info' | 'success' | 'warning';
  value: (rows: TechnicalWorkbenchRow[]) => number | string;
}

export interface TechnicalWorkbenchDataSourceQuery {
  dateFrom?: string;
  dateTo?: string;
  page: number;
  pathologyNo?: string;
  size: number;
  status?: string;
}

export interface TechnicalWorkbenchDataSourceResult {
  page: number;
  rows: TechnicalWorkbenchRow[];
  size: number;
  total: number;
}

export interface TechnicalWorkbenchDataSource {
  load: (
    query: TechnicalWorkbenchDataSourceQuery,
  ) => Promise<TechnicalWorkbenchDataSourceResult>;
}

export interface TechnicalWorkbenchDayTab {
  label: string;
  value: TechnicalWorkbenchDayValue;
}

export interface TechnicalWorkbenchStatusOption {
  label: string;
  value: string;
}

export interface TechnicalWorkbenchPageConfig {
  columns: TechnicalWorkbenchColumn[];
  dataSource?: TechnicalWorkbenchDataSource;
  defaultPageSize: number;
  defaultStatus?: string;
  defaultWorkday: TechnicalWorkbenchDayValue;
  description: string;
  dayTabs?: TechnicalWorkbenchDayTab[];
  emptyText: string;
  filters?: TechnicalWorkbenchFilterConfig[];
  metrics?: TechnicalWorkbenchMetric[];
  queryActions?: TechnicalWorkbenchAction[];
  rows?: TechnicalWorkbenchRow[];
  searchPlaceholder: string;
  showWorkDatePicker?: boolean;
  showPageHeader?: boolean;
  statusOptions?: TechnicalWorkbenchStatusOption[];
  title: string;
  toolbarGroups: TechnicalWorkbenchAction[][];
}
