// Flat config for ESLint v9+
import js from '@eslint/js';
import react from 'eslint-plugin-react';

export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  react.configs.flat.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        document: 'readonly',
        window: 'readonly',
        fetch: 'readonly',
        indexedDB: 'readonly',
        IDBKeyRange: 'readonly',
      },
    },
    settings: { react: { version: '18.0' } },
    rules: {
      'no-var': 'error',
      'prefer-const': 'error',
      semi: ['error', 'always'],
      'no-with': 'error',
      'no-new-wrappers': 'error',
      'no-inner-declarations': 'error',
      'no-implicit-globals': 'error',
      'react/prop-types': 'off',
    },
  },
];


