import { nextJsConfig } from '@workspace/eslint-config/next-js'
import boundaries from 'eslint-plugin-boundaries'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('eslint').Linter.Config} */
export default [
  ...nextJsConfig,

  // ── General rules ──────────────────────────────────────────────────────────
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

  // ── Architectural boundaries ────────────────────────────────────────────────
  //
  //  Layer hierarchy (can only import from layers below):
  //
  //    app  →  features  →  domains  →  shared
  //
  //  shared   : shared utilities only, no internal layer imports
  //  domains  : business/data logic — can use shared
  //  features : UI feature slices   — can use shared + domains
  //  app      : Next.js pages/routes — can use all layers
  //
  {
    plugins: { boundaries },

    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: path.resolve(__dirname, 'tsconfig.json')
        }
      },
      'boundaries/elements': [
        { type: 'shared',   pattern: ['shared/**'] },
        { type: 'domains',  pattern: ['domains/**'] },
        { type: 'features', pattern: ['features/**'] },
        { type: 'app',      pattern: ['app/**'] },
      ],
    },

    rules: {
      // Enforce one-directional dependency flow
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          rules: [
            // shared  → (nothing — external packages only)
            { from: ['shared'],   allow: [] },
            // domains → shared
            { from: ['domains'],  allow: ['shared'] },
            // features → shared, domains
            { from: ['features'], allow: ['shared', 'domains'] },
            // app → shared, domains, features
            { from: ['app'],      allow: ['shared', 'domains', 'features'] },
          ],
        },
      ],

      // External libraries generate a lot of warnings. Disabling this rule to keep logs clean.
      // Eslint will still check boundaries between your own files perfectly.
      'boundaries/no-unknown': 'off',
    },
  },
]
