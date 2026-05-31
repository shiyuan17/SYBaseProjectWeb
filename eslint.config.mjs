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
]);
