import type {
  AnalyticsKpiCard,
  AnalyticsOverviewResult,
  AnalyticsRiskCard,
  DashboardChartDatum,
  DashboardDomainData,
  DashboardDomainSummary,
  DashboardHeroMetric,
  DashboardMetricRow,
  DashboardOperationSignal,
  DashboardRiskDistribution,
  DashboardVisualTone,
  DashboardWorkspaceAlert,
  DashboardWorkspaceQuickEntry,
  DashboardWorkspaceTodoCard,
} from '../types/dashboard';

const HERO_ACCENTS = ['cyan', 'emerald', 'amber', 'rose'] as const;

const DOMAIN_TONE_MAP: Record<string, DashboardVisualTone> = {
  doctor: 'primary',
  operation: 'warning',
  quality: 'success',
  specimen: 'info',
  technical: 'danger',
};

function toDisplayUnit(unit: string) {
  if (!unit) {
    return '项';
  }
  if (unit === 'COUNT') {
    return '项';
  }
  if (unit === 'PERCENT') {
    return '%';
  }
  return unit;
}

function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clampProgress(value: number, min: number = 0, max: number = 100) {
  return Math.min(Math.max(value, min), max);
}

function toneByRiskSeverity(
  severity: AnalyticsRiskCard['severity'],
): DashboardVisualTone {
  if (severity === 'danger') {
    return 'danger';
  }
  if (severity === 'warning') {
    return 'warning';
  }
  return 'info';
}

function toneByDomain(id: string): DashboardVisualTone {
  return DOMAIN_TONE_MAP[id] ?? 'neutral';
}

function buildSignalDescription(row: DashboardMetricRow) {
  if (row.unit === 'CNY') {
    return '本月累计金额';
  }
  if (row.unit === 'PERCENT') {
    return '当前达成水平';
  }
  return '当前统计结果';
}

function buildSignalProgress(row: DashboardMetricRow) {
  const value = parseNumber(row.value);
  if (row.unit === 'PERCENT') {
    return clampProgress(value);
  }
  if (row.unit === 'CNY') {
    return clampProgress(value / 1000);
  }
  return clampProgress(value * 10);
}

function buildSignalTone(row: DashboardMetricRow): DashboardVisualTone {
  if (row.code.includes('ALERT') || row.code.includes('WARNING')) {
    return parseNumber(row.value) > 0 ? 'danger' : 'success';
  }
  if (row.unit === 'CNY') {
    return 'primary';
  }
  if (row.unit === 'PERCENT') {
    return 'success';
  }
  return 'info';
}

function buildTodoPriority(card: DashboardWorkspaceTodoCard) {
  if (card.tone === 'danger') {
    return 400 + parseNumber(card.value);
  }
  if (card.tone === 'warning') {
    return 300 + parseNumber(card.value);
  }
  if (card.tone === 'info') {
    return 200 + parseNumber(card.value);
  }
  return 100 + parseNumber(card.value);
}

function buildAlertPriority(alert: DashboardWorkspaceAlert) {
  if (alert.severity === 'danger') {
    return 300;
  }
  if (alert.severity === 'warning') {
    return 200;
  }
  return 100;
}

export function buildDashboardHeroMetrics(
  cards: AnalyticsKpiCard[],
): DashboardHeroMetric[] {
  return cards.slice(0, 4).map((card, index) => ({
    accent: HERO_ACCENTS[index] ?? 'cyan',
    description: card.description,
    id: card.id,
    query: card.query,
    route: card.route,
    title: card.title,
    unit: toDisplayUnit(card.unit),
    value: card.value,
  }));
}

export function buildQualityChartData(
  rows: DashboardMetricRow[],
): DashboardChartDatum[] {
  return rows
    .filter((row) => row.unit === 'PERCENT')
    .map((row) => ({
      id: row.code,
      label: row.label,
      tone: 'success',
      unit: '%',
      value: parseNumber(row.value),
      valueText: row.value,
    }));
}

export function buildWorkloadChartData(
  rows: DashboardMetricRow[],
): DashboardChartDatum[] {
  return rows.map((row, index) => ({
    id: row.code,
    label: row.label,
    tone: index === 0 ? 'primary' : 'info',
    unit: toDisplayUnit(row.unit),
    value: parseNumber(row.value),
    valueText: row.value,
  }));
}

export function buildRiskDistribution(
  cards: AnalyticsRiskCard[],
): DashboardRiskDistribution[] {
  return cards.map((card) => ({
    id: card.id,
    label: card.title,
    query: card.query,
    route: card.route,
    severity: card.severity,
    tone: toneByRiskSeverity(card.severity),
    unit: '项',
    value: card.count,
    valueText: String(card.count),
  }));
}

export function buildOperationSignals(
  rows: DashboardMetricRow[],
): DashboardOperationSignal[] {
  return rows.map((row) => ({
    code: row.code,
    description: buildSignalDescription(row),
    emphasis: row.unit === 'PERCENT' ? '达成值' : '当期值',
    label: row.label,
    progress: buildSignalProgress(row),
    tone: buildSignalTone(row),
    unit: toDisplayUnit(row.unit),
    value: row.value,
  }));
}

export function buildWorkspaceTodoCards(
  domains: DashboardDomainData[],
): DashboardWorkspaceTodoCard[] {
  return domains
    .flatMap((domain) =>
      domain.cards.map((card) => {
        const mapped: DashboardWorkspaceTodoCard = {
          ...card,
          domainId: domain.id,
          domainTitle: domain.title,
          priority: 0,
        };
        mapped.priority = buildTodoPriority(mapped);
        return mapped;
      }),
    )
    .toSorted((left, right) => right.priority - left.priority);
}

export function buildWorkspaceAlerts(
  domains: DashboardDomainData[],
): DashboardWorkspaceAlert[] {
  return domains
    .flatMap((domain) =>
      domain.alerts.map((alert) => {
        const mapped: DashboardWorkspaceAlert = {
          ...alert,
          domainId: domain.id,
          domainTitle: domain.title,
          priority: 0,
        };
        mapped.priority = buildAlertPriority(mapped);
        return mapped;
      }),
    )
    .toSorted((left, right) => right.priority - left.priority);
}

export function buildWorkspaceQuickEntries(
  domains: DashboardDomainData[],
): DashboardWorkspaceQuickEntry[] {
  return domains.flatMap((domain) =>
    domain.quickEntries.map((entry) => ({
      ...entry,
      domainId: domain.id,
      domainTitle: domain.title,
    })),
  );
}

export function buildDomainSummaries(
  domains: DashboardDomainData[],
): DashboardDomainSummary[] {
  return domains.map((domain) => ({
    alertCount: domain.alerts.length,
    cardCount: domain.cards.length,
    id: domain.id,
    quickEntryCount: domain.quickEntries.length,
    title: domain.title,
    tone: toneByDomain(domain.id),
  }));
}

export function buildWorkspaceDistribution(
  domains: DashboardDomainData[],
): DashboardChartDatum[] {
  return domains.map((domain) => ({
    id: domain.id,
    label: domain.title,
    tone: toneByDomain(domain.id),
    unit: '项',
    value: domain.cards.length,
    valueText: String(domain.cards.length),
  }));
}

export function buildWorkspaceHeroMetric(
  cards: DashboardWorkspaceTodoCard[],
): DashboardWorkspaceTodoCard | null {
  return cards[0] ?? null;
}

export function buildWorkspaceSecondaryCards(
  cards: DashboardWorkspaceTodoCard[],
): DashboardWorkspaceTodoCard[] {
  return cards.slice(1, 7);
}

export function buildWorkspaceSpotlight(
  cards: DashboardWorkspaceTodoCard[],
  alerts: DashboardWorkspaceAlert[],
) {
  return {
    dangerCount: cards.filter((card) => card.tone === 'danger').length,
    infoCount: cards.filter((card) => card.tone === 'info').length,
    warningCount: cards.filter((card) => card.tone === 'warning').length,
    warningRiskCount: alerts.filter((alert) => alert.severity !== 'info')
      .length,
  };
}

export function buildAnalyticsVisualSummary(overview: AnalyticsOverviewResult) {
  return {
    heroMetrics: buildDashboardHeroMetrics(overview.kpiCards),
    operationSignals: buildOperationSignals(overview.operationRows),
    qualityChartData: buildQualityChartData(overview.qualityRows),
    riskDistribution: buildRiskDistribution(overview.riskCards),
    workloadChartData: buildWorkloadChartData(overview.workloadRows),
  };
}

export function buildWorkspaceVisualSummary(domains: DashboardDomainData[]) {
  const todoCards = buildWorkspaceTodoCards(domains);
  const alerts = buildWorkspaceAlerts(domains);
  return {
    alerts,
    distribution: buildWorkspaceDistribution(domains),
    domainSummaries: buildDomainSummaries(domains),
    heroCard: buildWorkspaceHeroMetric(todoCards),
    quickEntries: buildWorkspaceQuickEntries(domains),
    secondaryCards: buildWorkspaceSecondaryCards(todoCards),
    spotlight: buildWorkspaceSpotlight(todoCards, alerts),
    todoCards,
  };
}

export function getVisualToneClasses(tone: DashboardVisualTone) {
  switch (tone) {
    case 'danger': {
      return {
        badge:
          'bg-[color-mix(in_srgb,var(--el-color-danger)_12%,transparent)] text-[var(--el-color-danger)] ring-1 ring-inset ring-[color-mix(in_srgb,var(--el-color-danger)_26%,transparent)]',
        glow: 'from-[color-mix(in_srgb,var(--el-color-danger)_18%,transparent)] via-[color-mix(in_srgb,var(--el-color-danger)_8%,transparent)] to-transparent',
        line: 'bg-[var(--el-color-danger)]',
        text: 'text-[var(--el-color-danger)]',
      };
    }
    case 'info': {
      return {
        badge:
          'bg-[color-mix(in_srgb,var(--el-color-info)_12%,transparent)] text-[var(--el-color-info)] ring-1 ring-inset ring-[color-mix(in_srgb,var(--el-color-info)_26%,transparent)]',
        glow: 'from-[color-mix(in_srgb,var(--el-color-info)_18%,transparent)] via-[color-mix(in_srgb,var(--el-color-info)_8%,transparent)] to-transparent',
        line: 'bg-[var(--el-color-info)]',
        text: 'text-[var(--el-color-info)]',
      };
    }
    case 'primary': {
      return {
        badge:
          'bg-[color-mix(in_srgb,var(--el-color-primary)_12%,transparent)] text-[var(--el-color-primary)] ring-1 ring-inset ring-[color-mix(in_srgb,var(--el-color-primary)_26%,transparent)]',
        glow: 'from-[color-mix(in_srgb,var(--el-color-primary)_18%,transparent)] via-[color-mix(in_srgb,var(--el-color-primary)_8%,transparent)] to-transparent',
        line: 'bg-[var(--el-color-primary)]',
        text: 'text-[var(--el-color-primary)]',
      };
    }
    case 'success': {
      return {
        badge:
          'bg-[color-mix(in_srgb,var(--el-color-success)_12%,transparent)] text-[var(--el-color-success)] ring-1 ring-inset ring-[color-mix(in_srgb,var(--el-color-success)_26%,transparent)]',
        glow: 'from-[color-mix(in_srgb,var(--el-color-success)_18%,transparent)] via-[color-mix(in_srgb,var(--el-color-success)_8%,transparent)] to-transparent',
        line: 'bg-[var(--el-color-success)]',
        text: 'text-[var(--el-color-success)]',
      };
    }
    case 'warning': {
      return {
        badge:
          'bg-[color-mix(in_srgb,var(--el-color-warning)_12%,transparent)] text-[var(--el-color-warning)] ring-1 ring-inset ring-[color-mix(in_srgb,var(--el-color-warning)_26%,transparent)]',
        glow: 'from-[color-mix(in_srgb,var(--el-color-warning)_18%,transparent)] via-[color-mix(in_srgb,var(--el-color-warning)_8%,transparent)] to-transparent',
        line: 'bg-[var(--el-color-warning)]',
        text: 'text-[var(--el-color-warning)]',
      };
    }
    default: {
      return {
        badge:
          'bg-muted text-muted-foreground ring-1 ring-inset ring-border/80',
        glow: 'from-[color-mix(in_srgb,var(--el-text-color-secondary)_12%,transparent)] via-[color-mix(in_srgb,var(--el-text-color-secondary)_5%,transparent)] to-transparent',
        line: 'bg-[var(--el-border-color)]',
        text: 'text-muted-foreground',
      };
    }
  }
}

export function groupQuickEntriesByDomain(
  quickEntries: DashboardWorkspaceQuickEntry[],
) {
  const groups = new Map<string, DashboardWorkspaceQuickEntry[]>();
  quickEntries.forEach((entry) => {
    const current = groups.get(entry.domainId) ?? [];
    groups.set(entry.domainId, [...current, entry]);
  });

  return [...groups.entries()].map(([domainId, entries]) => ({
    domainId,
    domainTitle: entries[0]?.domainTitle ?? domainId,
    entries,
  }));
}
