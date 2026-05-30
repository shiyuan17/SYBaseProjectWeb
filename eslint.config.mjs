import { defineConfig } from '@vben/eslint-config';

export default defineConfig([
  {
    ignores: [
      '**/tests/reports/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/apps/**/dist/**',
      '**/dist.zip',
    ],
  },
]);
