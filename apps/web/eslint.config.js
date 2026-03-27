import { nextJsConfig } from '@workspace/eslint-config/next-js'

/** @type {import('eslint').Linter.Config} */
export default [
  ...nextJsConfig,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
]
