import { defineConfig } from '@vben/eslint-config';

export default defineConfig([
  {
    ignores: [
      '**/tests/reports/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/.playwright-cli/**',
      '**/.codex-artifacts/**',
      '**/.codex-temp/**',
      '**/artifacts/**',
      '**/apps/**/dist/**',
      '**/dist.zip',
    ],
  },
  {
    files: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      'import/consistent-type-specifier-style': 'off',
      'import/first': 'off',
      'jest/prefer-lowercase-title': 'off',
      'vue/one-component-per-file': 'off',
      'vue/require-prop-types': 'off',
    },
  },
  {
    files: [
      'apps/web-ele/src/modules/dashboard/api/dashboard-service.ts',
      'apps/web-ele/src/modules/dashboard/components/DashboardHeroMetricCard.vue',
      'apps/web-ele/src/modules/dashboard/views/AnalyticsOverviewView.vue',
      'apps/web-ele/src/modules/notification-center/views/NotificationCenterView.vue',
      'apps/web-ele/src/modules/operation-support/views/ArchiveManagementView.vue',
      'apps/web-ele/src/modules/technical-workflow/components/GrossingProcessDialog.vue',
      'apps/web-ele/src/modules/technical-workflow/utils/workstation.ts',
      'apps/web-ele/src/modules/technical-workflow/views/ReworkWorkstationView.test.ts',
      'apps/web-ele/src/modules/technical-workflow/views/TechnicalTasksView.vue',
      'apps/web-ele/src/modules/technical-workflow/views/TechnicalTrackingView.vue',
      'apps/web-ele/src/modules/technical-workflow/views/TechnicalWorkflowEntryView.vue',
      'apps/web-ele/src/router/routes/keep-alive.ts',
    ],
    rules: {
      'unicorn/no-nested-ternary': 'off',
      'vue/html-closing-bracket-newline': 'off',
    },
  },
]);
