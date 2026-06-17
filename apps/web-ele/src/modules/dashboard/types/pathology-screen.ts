export interface PathologyScreenMetricCard {
  label: string;
  value: string;
}

export interface PathologyScreenBarGroup {
  darkValue: string;
  label: string;
  lightValue: string;
  tealValue?: string;
}

export interface PathologyScreenRateItem {
  label: string;
  value: string;
}

export interface PathologyScreenReportTypeItem {
  label: string;
  value: string;
}

export interface PathologyScreenStageNode {
  label: string;
  value: string;
  x: number;
  y: number;
}

export interface PathologyScreenWorkloadRow {
  january: string;
  label: string;
  february: string;
  ratio: string;
  ratioTone: 'down' | 'neutral' | 'up';
}

export interface PathologyScreenStaffMetric {
  accentValue: string;
  label: string;
  value: string;
}

export interface PathologyScreenGaugeItem {
  label: string;
  value: number;
  year: string;
}

export interface PathologyScreenSummary {
  bottomLeftBars: PathologyScreenBarGroup[];
  bottomRightBars: PathologyScreenBarGroup[];
  bottomRightLegend: string[];
  centerMetrics: PathologyScreenMetricCard[];
  centerStageNodes: PathologyScreenStageNode[];
  reportTypes: PathologyScreenReportTypeItem[];
  reportTypesSummary: {
    totalKinds: string;
    totalWorkload: string;
  };
  rightTableRows: PathologyScreenWorkloadRow[];
  staffGauges: PathologyScreenGaugeItem[];
  staffMetrics: PathologyScreenStaffMetric[];
  title: string;
  topLeftBars: PathologyScreenBarGroup[];
  topLeftLegend: string[];
  topLeftRateItems: PathologyScreenRateItem[];
  topRightRateItems: PathologyScreenRateItem[];
}
