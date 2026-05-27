import type { NotificationCategory } from '#/modules/notification-center/types/notification-center';

export interface DashboardWorkspaceCard {
  description: string;
  id: string;
  query?: Record<string, string>;
  route?: string;
  tag?: string;
  title: string;
  tone: 'danger' | 'info' | 'success' | 'warning';
  value: string;
}

export interface DashboardWorkspaceSection {
  description: string;
  emptyText: string;
  error?: string;
  items: DashboardWorkspaceCard[];
  loading: boolean;
  title: string;
}

export interface DashboardAlertItem {
  actionLabel?: string;
  description: string;
  id: string;
  query?: Record<string, string>;
  route?: string;
  severity: 'danger' | 'info' | 'warning';
  source: string;
  title: string;
}

export interface DashboardQuickEntry {
  description: string;
  highlight?: boolean;
  id: string;
  query?: Record<string, string>;
  route: string;
  title: string;
}

export interface DashboardDomainData {
  alerts: DashboardAlertItem[];
  cards: DashboardWorkspaceCard[];
  id: string;
  quickEntries: DashboardQuickEntry[];
  title: string;
}

export interface DashboardNotificationItem {
  actionRoute: null | string;
  category: NotificationCategory;
  createdAt: string;
  id: string;
  query: Record<string, string>;
  status: string;
  summary: string;
  title: string;
  topicCode: string;
}

export interface DashboardNotificationSummary {
  items: DashboardNotificationItem[];
  unreadCount: number;
}

export interface DashboardMetricRow {
  code: string;
  label: string;
  unit: string;
  value: string;
}

export interface AnalyticsKpiCard {
  description: string;
  id: string;
  query?: Record<string, string>;
  route?: string;
  title: string;
  unit: string;
  value: string;
}

export interface AnalyticsRiskCard {
  count: number;
  description: string;
  id: string;
  query?: Record<string, string>;
  route?: string;
  severity: 'danger' | 'info' | 'warning';
  title: string;
}

export interface AnalyticsOverviewResult {
  kpiCards: AnalyticsKpiCard[];
  operationRows: DashboardMetricRow[];
  qualityRows: DashboardMetricRow[];
  riskCards: AnalyticsRiskCard[];
  workloadRows: DashboardMetricRow[];
}

export type DashboardVisualTone =
  | 'danger'
  | 'info'
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning';

export interface DashboardChartDatum {
  id: string;
  label: string;
  tone: DashboardVisualTone;
  unit?: string;
  value: number;
  valueText: string;
}

export interface DashboardHeroMetric {
  accent: 'amber' | 'cyan' | 'emerald' | 'rose';
  description: string;
  id: string;
  query?: Record<string, string>;
  route?: string;
  title: string;
  unit: string;
  value: string;
}

export interface DashboardOperationSignal {
  code: string;
  description: string;
  emphasis: string;
  label: string;
  progress: number;
  tone: DashboardVisualTone;
  unit: string;
  value: string;
}

export interface DashboardRiskDistribution extends DashboardChartDatum {
  query?: Record<string, string>;
  route?: string;
  severity: AnalyticsRiskCard['severity'];
}

export interface DashboardWorkspaceTodoCard extends DashboardWorkspaceCard {
  domainId: string;
  domainTitle: string;
  priority: number;
}

export interface DashboardWorkspaceAlert extends DashboardAlertItem {
  domainId: string;
  domainTitle: string;
  priority: number;
}

export interface DashboardWorkspaceQuickEntry extends DashboardQuickEntry {
  domainId: string;
  domainTitle: string;
}

export interface DashboardDomainSummary {
  alertCount: number;
  cardCount: number;
  id: string;
  quickEntryCount: number;
  title: string;
  tone: DashboardVisualTone;
}
