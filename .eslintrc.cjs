module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended'
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'postcss.config.js', 'tailwind.config.js'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
  plugins: ['react-refresh', 'prettier'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'prettier/prettier': 'error',
    'no-var': 'off', // Disable for declaration files
    'prefer-const': 'off', // Disable for declaration files
  },
  overrides: [
    {
      files: ['src/types/speech.d.ts'],
      rules: {
        'no-var': 'off',
        'prefer-const': 'off',
        '@typescript-eslint/no-explicit-any': 'off', // Temporarily disable for this file
      },
    },
  ],
}