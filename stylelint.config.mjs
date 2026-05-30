export default {
  extends: ['@vben/stylelint-config'],
  ignoreFiles: [
    '**/.codex-artifacts/**',
    '**/.codex-temp/**',
    '**/.playwright-cli/**',
    '**/artifacts/**',
    'tests/reports/**',
  ],
  root: true,
};
