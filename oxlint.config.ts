import { defineConfig } from '@vben/oxlint-config';

const testFiles = [
  '**/*.spec.ts',
  '**/*.spec.tsx',
  '**/*.test.ts',
  '**/*.test.tsx',
];

export default defineConfig({
  ignorePatterns: [
    '**/.playwright-cli/**',
    '**/.codex-artifacts/**',
    '**/.codex-temp/**',
    '**/artifacts/**',
  ],
  overrides: [
    {
      files: testFiles,
      rules: {
        '@typescript-eslint/no-non-null-assertion': 'off',
        'import/consistent-type-specifier-style': 'off',
        'import/first': 'off',
        'jest/prefer-lowercase-title': 'off',
      },
    },
  ],
});
