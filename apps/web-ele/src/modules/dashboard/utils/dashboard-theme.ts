export interface DashboardChartTheme {
  danger: string;
  info: string;
  neutral: string;
  primary: string;
  success: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  trackColor: string;
  warning: string;
}

function readCssVar(name: string, fallback: string) {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const value = window.getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();

  return value || fallback;
}

export function getDashboardChartTheme(isDark: boolean): DashboardChartTheme {
  return {
    danger: readCssVar('--el-color-danger', isDark ? '#f87171' : '#dc2626'),
    info: readCssVar('--el-color-info', isDark ? '#60a5fa' : '#2563eb'),
    neutral: readCssVar('--el-text-color-secondary', isDark ? '#94a3b8' : '#64748b'),
    primary: readCssVar('--el-color-primary', isDark ? '#60a5fa' : '#2563eb'),
    success: readCssVar('--el-color-success', isDark ? '#34d399' : '#059669'),
    textPrimary: readCssVar('--el-text-color-primary', isDark ? '#f8fafc' : '#0f172a'),
    textSecondary: readCssVar(
      '--el-text-color-regular',
      isDark ? '#cbd5e1' : '#334155',
    ),
    textTertiary: readCssVar(
      '--el-text-color-secondary',
      isDark ? '#94a3b8' : '#64748b',
    ),
    trackColor: readCssVar(
      '--el-border-color-lighter',
      isDark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(148, 163, 184, 0.22)',
    ),
    warning: readCssVar('--el-color-warning', isDark ? '#fbbf24' : '#d97706'),
  };
}
