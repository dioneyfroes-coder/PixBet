import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  js.configs.recommended,
  ...compat.config({
    env: {
      browser: true,
      es2021: true,
      node: true,
    },
    extends: [
      'plugin:@typescript-eslint/recommended',
      'plugin:react/recommended',
      'plugin:react-hooks/recommended',
      'plugin:jsx-a11y/recommended',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaFeatures: { jsx: true },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    settings: { react: { version: 'detect' } },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'no-empty-pattern': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
    ignorePatterns: ['node_modules/', '.react-router/', 'public/', 'build/', 'coverage/'],
    overrides: [
      {
        files: ['*.ts', '*.tsx'],
        parserOptions: { project: './tsconfig.json' },
        rules: {},
      },
      // Allow scripts and tooling to call fetch directly.
      {
        files: ['scripts/**', 'scripts/*'],
        rules: {
          'no-restricted-syntax': 'off',
        },
      },
    ],
  }),
];
