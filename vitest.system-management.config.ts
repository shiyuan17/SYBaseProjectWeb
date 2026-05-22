import { defineConfig, mergeConfig } from 'vitest/config';

import baseConfig from './vitest.config';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: ['apps/web-ele/src/modules/system-management/**/*.test.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        reportsDirectory: 'tests/reports/system-management/frontend/coverage',
        clean: true,
        include: ['apps/web-ele/src/modules/system-management/api/**/*.ts'],
        exclude: ['**/*.test.ts'],
      },
    },
  }),
);
