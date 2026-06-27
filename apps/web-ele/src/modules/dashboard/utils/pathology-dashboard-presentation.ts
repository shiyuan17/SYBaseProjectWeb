import type {
  PathologyScreenDashboardResponse,
  PathologyScreenMetricCard,
  PathologyScreenMetricItem,
  PathologyScreenStatus,
} from '../types/pathology-screen';

export interface PathologyDashboardStageNode
  extends PathologyScreenMetricItem {
  x: number;
  y: number;
}

export function buildPathologyDashboardSummaryTitleParts(brandName: string) {
  const parts = brandName.split('病理');
  if (parts.length < 2) {
    return {
      prefix: brandName,
      suffix: '数据驾驶舱',
    };
  }
  return {
    prefix: `${parts[0]}病理`,
    suffix: `${parts.slice(1).join('病理')}数据驾驶舱`,
  };
}

export function buildPathologyDashboardSummaryCards(
  dashboard: PathologyScreenDashboardResponse,
) {
  return [
    dashboard.summaryCards.annualCaseTotal,
    dashboard.summaryCards.lastMonthCaseTotal,
    dashboard.summaryCards.lastMonthReportTimelinessRate,
  ] satisfies PathologyScreenMetricCard[];
}

export function buildPathologyDashboardStageNodes(
  dashboard: PathologyScreenDashboardResponse,
) {
  const positions = [
    { x: 212, y: 212 },
    { x: 430, y: 142 },
    { x: 620, y: 142 },
    { x: 798, y: 212 },
  ];

  return dashboard.lastMonthWorkload.items.map((item, index) => ({
    ...item,
    x: positions[index]?.x ?? 500,
    y: positions[index]?.y ?? 212,
  })) satisfies PathologyDashboardStageNode[];
}

export function buildPathologyDashboardPartialNotes(
  dashboard: PathologyScreenDashboardResponse,
) {
  const notes = new Map<string, string>();

  const collectMetric = (
    metric: PathologyScreenMetricCard | PathologyScreenMetricItem,
  ) => {
    if (metric.status === 'PARTIAL' || metric.status === 'UNAVAILABLE') {
      notes.set(
        metric.label,
        metric.sourceNote ?? `${metric.label} 当前仅提供部分数据。`,
      );
    }
  };

  const collectSection = <
    T extends {
      items: unknown[];
      sourceNote: null | string;
      status: PathologyScreenStatus;
    },
  >(
    title: string,
    section: T,
  ) => {
    if (section.status === 'PARTIAL' || section.status === 'UNAVAILABLE') {
      notes.set(title, section.sourceNote ?? `${title} 当前仅提供部分数据。`);
    }

    for (const item of section.items) {
      if (item && typeof item === 'object' && 'status' in item) {
        collectMetric(item as PathologyScreenMetricItem);
      }
      if (
        item &&
        typeof item === 'object' &&
        'metrics' in item &&
        Array.isArray(item.metrics)
      ) {
        for (const metric of item.metrics) {
          collectMetric(metric);
        }
      }
    }
  };

  collectMetric(dashboard.summaryCards.lastMonthReportTimelinessRate);
  collectSection('签发报告修改率', dashboard.reportRevisionRateTrend);
  collectSection('技术组指标合格率', dashboard.technicalQualificationRates);
  collectSection('诊断工作量统计', dashboard.diagnosisWorkloadRows);
  collectSection('近三年各技术指标合格率', dashboard.threeYearTechnicalRates);
  collectSection('上月工作量', dashboard.lastMonthWorkload);
  collectSection(
    '近三年报告及时/诊断符合率',
    dashboard.threeYearReportQualityRates,
  );
  collectSection('报告及时诊断符合率', dashboard.overallComplianceRates);

  if (
    dashboard.structuredReportSummary.status === 'PARTIAL' ||
    dashboard.structuredReportSummary.status === 'UNAVAILABLE'
  ) {
    notes.set(
      '结构化报告展示',
      dashboard.structuredReportSummary.sourceNote ??
        '结构化报告统计当前仅提供部分数据。',
    );
  }

  return [...notes.entries()].map(([label, note]) => `${label}：${note}`);
}

export function displayPathologyMetricValue(value: string) {
  return value?.trim() ? value : '--';
}

export function buildPathologyRatioClass(value: string) {
  if (value.startsWith('-')) {
    return 'text-[#91a9cc]';
  }
  if (value.startsWith('↓')) {
    return 'text-[#ff6f84]';
  }
  return 'text-[#63f3c2]';
}

export function buildPathologyStatusClass(status: PathologyScreenStatus) {
  if (status === 'PARTIAL') {
    return 'screen-status screen-status--partial';
  }
  if (status === 'UNAVAILABLE') {
    return 'screen-status screen-status--unavailable';
  }
  return 'screen-status';
}

export function buildPathologyStageNodeStyle(node: {
  x: number;
  y: number;
}) {
  const centeredX = 500 + (node.x - 500) * 0.82;
  const centeredY = 26 + node.y * 0.86;

  return {
    left: `${(centeredX / 1000) * 100}%`,
    top: `${(centeredY / 350) * 100}%`,
  };
}
