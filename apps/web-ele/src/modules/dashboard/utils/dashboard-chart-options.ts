import type { useEcharts } from '@vben/plugins/echarts';

import type {
  DashboardChartDatum,
  DashboardRiskDistribution,
} from '../types/dashboard';
import type { DashboardChartTheme } from './dashboard-theme';

type ChartOption = Parameters<
  ReturnType<typeof useEcharts>['renderEcharts']
>[0];

function buildToneColorMap(theme: DashboardChartTheme) {
  return {
    danger: theme.danger,
    info: theme.info,
    neutral: theme.neutral,
    primary: theme.primary,
    success: theme.success,
    warning: theme.warning,
  } as const;
}

export function buildWorkspaceDistributionChartOption(
  data: DashboardChartDatum[],
  theme: DashboardChartTheme,
): ChartOption | null {
  if (data.length === 0) {
    return null;
  }

  const toneColorMap = buildToneColorMap(theme);

  return {
    color: data.map((item) => toneColorMap[item.tone] ?? theme.neutral),
    legend: {
      bottom: 0,
      textStyle: {
        color: theme.textSecondary,
      },
    },
    series: [
      {
        center: ['50%', '42%'],
        data: data.map((item) => ({
          name: item.label,
          value: item.value,
        })),
        label: {
          color: theme.textPrimary,
          formatter: '{b}',
        },
        radius: ['42%', '72%'],
        type: 'pie',
      },
    ],
    tooltip: {
      formatter: '{b}：{c} 项待办',
      trigger: 'item',
    },
  } satisfies ChartOption;
}

export function buildQualityChartOption(
  data: DashboardChartDatum[],
  theme: DashboardChartTheme,
): ChartOption | null {
  if (data.length === 0) {
    return null;
  }

  const seriesColors = [theme.success, '#22c55e', '#10b981'];

  return {
    color: seriesColors,
    legend: {
      bottom: 0,
      icon: 'circle',
      itemHeight: 8,
      itemWidth: 8,
      textStyle: {
        color: theme.textSecondary,
        fontSize: 12,
      },
    },
    series: data.map((item, index) => ({
      center: [`${22 + index * 28}%`, '45%'],
      clockwise: true,
      data: [
        {
          itemStyle: {
            color: seriesColors[index % seriesColors.length] ?? theme.success,
          },
          name: item.label,
          value: item.value,
        },
        {
          itemStyle: {
            color: theme.trackColor,
          },
          tooltip: {
            show: false,
          },
          value: Math.max(100 - item.value, 0),
        },
      ],
      hoverAnimation: false,
      label: {
        color: theme.textPrimary,
        fontSize: 18,
        fontWeight: 600,
        formatter: `${item.valueText}%`,
        position: 'center',
      },
      radius: ['58%', '75%'],
      startAngle: 90,
      type: 'pie',
    })),
    tooltip: {
      formatter: '{b}：{c}%',
      trigger: 'item',
    },
  } satisfies ChartOption;
}

export function buildWorkloadChartOption(
  data: DashboardChartDatum[],
  theme: DashboardChartTheme,
): ChartOption | null {
  if (data.length === 0) {
    return null;
  }

  return {
    grid: {
      bottom: 0,
      left: 110,
      right: 20,
      top: 24,
    },
    series: [
      {
        barMaxWidth: 18,
        data: data.map((item, index) => ({
          itemStyle: {
            borderRadius: [0, 9, 9, 0],
            color: index === 0 ? '#38bdf8' : '#a78bfa',
          },
          value: item.value,
        })),
        label: {
          color: theme.textSecondary,
          formatter: ({ dataIndex }: { dataIndex: number }) =>
            `${data[dataIndex]?.valueText ?? '0'} ${data[dataIndex]?.unit ?? ''}`,
          position: 'right',
          show: true,
        },
        type: 'bar',
      },
    ],
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      axisLabel: {
        color: theme.textTertiary,
      },
      splitLine: {
        lineStyle: {
          color: theme.trackColor,
        },
        show: true,
      },
      type: 'value',
    },
    yAxis: {
      axisLabel: {
        color: theme.textSecondary,
      },
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      data: data.map((item) => item.label),
      type: 'category',
    },
  } satisfies ChartOption;
}

export function buildRiskDistributionChartOption(
  data: DashboardRiskDistribution[],
  theme: DashboardChartTheme,
): ChartOption | null {
  if (data.length === 0) {
    return null;
  }

  const toneColorMap = buildToneColorMap(theme);

  return {
    color: data.map((item) => toneColorMap[item.tone] ?? theme.neutral),
    legend: {
      bottom: 0,
      textStyle: {
        color: theme.textSecondary,
      },
    },
    series: [
      {
        center: ['50%', '42%'],
        data: data.map((item) => ({
          name: item.label,
          value: item.value,
        })),
        label: {
          color: theme.textPrimary,
          formatter: '{b}',
        },
        radius: ['35%', '72%'],
        roseType: 'area',
        type: 'pie',
      },
    ],
    tooltip: {
      formatter: '{b}：{c} 项',
      trigger: 'item',
    },
  } satisfies ChartOption;
}
