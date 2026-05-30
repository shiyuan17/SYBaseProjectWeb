import type { DashboardChartTheme } from './dashboard-theme';

import { describe, expect, it } from 'vitest';

import {
  buildQualityChartOption,
  buildRiskDistributionChartOption,
  buildWorkloadChartOption,
  buildWorkspaceDistributionChartOption,
} from './dashboard-chart-options';

const theme: DashboardChartTheme = {
  danger: '#dc2626',
  info: '#2563eb',
  neutral: '#64748b',
  primary: '#0f766e',
  success: '#059669',
  textPrimary: '#0f172a',
  textSecondary: '#334155',
  textTertiary: '#64748b',
  trackColor: 'rgba(148, 163, 184, 0.22)',
  warning: '#d97706',
};

describe('dashboard chart options', () => {
  it('returns null for empty chart data', () => {
    expect(buildWorkspaceDistributionChartOption([], theme)).toBeNull();
    expect(buildQualityChartOption([], theme)).toBeNull();
    expect(buildWorkloadChartOption([], theme)).toBeNull();
    expect(buildRiskDistributionChartOption([], theme)).toBeNull();
  });

  it('builds workspace distribution option with tone-based colors', () => {
    const option = buildWorkspaceDistributionChartOption(
      [
        {
          id: 'specimen',
          label: '临床送检',
          tone: 'info',
          value: 4,
          valueText: '4',
        },
      ],
      theme,
    );

    expect(option).toMatchObject({
      color: [theme.info],
      series: [
        {
          data: [
            {
              name: '临床送检',
              value: 4,
            },
          ],
        },
      ],
    });
  });

  it('builds analytics chart options with expected labels and tooltip settings', () => {
    const qualityOption = buildQualityChartOption(
      [
        {
          id: 'quality',
          label: '标本合格率',
          tone: 'success',
          unit: '%',
          value: 98,
          valueText: '98',
        },
      ],
      theme,
    );
    const workloadOption = buildWorkloadChartOption(
      [
        {
          id: 'workload',
          label: '切片',
          tone: 'primary',
          unit: '项',
          value: 36,
          valueText: '36',
        },
      ],
      theme,
    );
    const riskOption = buildRiskDistributionChartOption(
      [
        {
          id: 'risk',
          label: '超时报告',
          severity: 'danger',
          tone: 'danger',
          unit: '项',
          value: 3,
          valueText: '3',
        },
      ],
      theme,
    );

    expect(qualityOption?.series).toHaveLength(1);
    expect(workloadOption?.yAxis).toMatchObject({
      data: ['切片'],
      type: 'category',
    });
    expect(riskOption).toMatchObject({
      color: [theme.danger],
      tooltip: {
        trigger: 'item',
      },
    });
  });
});
