module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true, jest: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'prettier',
  ],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['react'],
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
  settings: { react: { version: '18.0' } },
};


