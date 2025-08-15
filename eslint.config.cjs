// Flat config for ESLint v9
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');

module.exports = [
  {
    files: ['src/**/*.{ts,tsx,js,jsx}'],
    ignores: ['node_modules/**', 'dist/**', '.vscode/**'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        project: ['./tsconfig.json'],
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    // keep a concise, safe rule set (we avoid spreading plugin configs to prevent
    // incompatibilities with the flat config format)
    rules: {
      // TypeScript
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      // React
      'react/react-in-jsx-scope': 'off',
      // Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // stylistic
      'no-console': 'warn',
    },
    
    settings: {
      react: { version: 'detect' },
    },
  },
];
