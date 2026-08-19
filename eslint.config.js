import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  // Global ignores. Must be its own entry — `ignores` alongside `files` is
  // scoped to that block only, so build output would otherwise still be linted.
  {
    ignores: [
      'dist/**',
      'dev-dist/**',
      'public/games/**',   // generated, self-contained Scratch bundles
      '.claude/**',        // agent worktrees hold a stale copy of the repo
    ],
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      // This is a plain-JS project with no PropTypes anywhere; the rule flagged
      // every component in the repo, which left `npm run lint` permanently red
      // and therefore useless. Types would come from TypeScript, not PropTypes.
      'react/prop-types': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
]
