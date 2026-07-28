import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';
import unusedImports from 'eslint-plugin-unused-imports';

// ESLint 9 flat config. eslint-config-next 16 requires ESLint >=9 and `next lint`
// was removed in Next 16, so this replaces .eslintrc.json + .eslintignore. The
// rule set is carried over verbatim; eslint-config-next 16's native flat configs
// are composed directly (FlatCompat crashes on the react plugin's circular object).
const eslintConfig = [
  {
    // Translated from the former .eslintignore (flat config ignores it).
    ignores: [
      '.next/**',
      'out/**',
      'dist/**',
      'build/**',
      'node_modules/**',
      'coverage/**',
      '.cache/**',
      '.turbo/**',
      'scripts/**/*.js',
      'scripts/**/*.ts',
      'src/scripts/**/*.js',
      'src/scripts/**/*.ts',
      'next.config.js',
      '*.config.js',
      '*.config.ts',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    // unused-imports lives in its own object so its plugin is registered without
    // scoping the react/@next/@typescript-eslint rule references below (which
    // resolve against the plugins the next flat configs register globally).
    plugins: { 'unused-imports': unusedImports },
    rules: {
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Scoped to the same code files eslint-config-next registers react/@next/@typescript-eslint/import
    // for, so those rule references resolve to a registered plugin.
    files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'],
    settings: { react: { version: 'detect' } },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      // Code quality rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      // React rules
      'react/no-unescaped-entities': 'off',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/display-name': 'off',
      'react/jsx-key': 'error',
      'react/jsx-no-target-blank': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/no-danger-with-children': 'error',
      'react/no-deprecated': 'error',
      'react/no-direct-mutation-state': 'error',
      'react/no-is-mounted': 'error',
      'react/no-render-return-value': 'error',
      'react/no-string-refs': 'error',
      'react/no-unknown-property': 'error',
      'react/require-render-return': 'error',
      // Next.js rules
      '@next/next/no-html-link-for-pages': 'off',
      // Import rules
      'import/no-unresolved': 'off',
      'import/no-duplicates': 'off',
      // General code quality
      eqeqeq: ['error', 'always'],
      curly: 'warn',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Identifier[name=/[Cc]ampaign/]',
          message:
            "CLAUDE.md bans 'Campaign' terminology — use 'Project' instead. The canonical entity name is in ENTITY_REGISTRY.project.",
        },
        {
          selector: 'Identifier[name=/[Cc]rowdfund/]',
          message:
            "CLAUDE.md bans 'crowdfund' terminology — use 'fund' / 'funding' / 'project' instead.",
        },
        {
          selector:
            'Literal[value=/dark:(?:bg|text|border|ring|from|to|via|fill|stroke)-(?:gray|slate|zinc|neutral|stone)-\\d+/]',
          message:
            'Raw Tailwind gray in dark: variant — use a semantic token (bg-muted, bg-border, border, text-foreground, text-muted-foreground, etc.). See globals.css :root for available tokens. Add eslint-disable-next-line with a reason comment if this is an intentional design exception.',
        },
        {
          selector: 'Literal[value=/dark:(?:bg|text|border|ring)-\\[#[0-9a-fA-F]+\\]/]',
          message:
            'Arbitrary hex color in dark: variant — define a CSS custom property in globals.css and use a semantic Tailwind class instead.',
        },
        {
          selector: 'Literal[value=/\\btext-\\[10px\\]/]',
          message:
            "Arbitrary text-[10px] — use the text-2xs token (10px, defined in tailwind.config.ts). It exists for exactly this; don't bypass it.",
        },
        {
          // Close the keystroke-hijack class (2026-07 dogfood): a global keyboard
          // shortcut's "is the user typing?" guard must inspect the COMPOSED path
          // leaf, not e.target. When a keystroke crosses a shadow-DOM boundary
          // (e.g. the embedded FleetCrown feedback widget), e.target is retargeted
          // to the shadow host, so the guard misreads a text field as "not typing"
          // and the shortcut fires and eats the keystroke. Pass e.composedPath()[0].
          selector:
            "CallExpression[callee.name='isTypingTarget'] > MemberExpression.arguments[property.name='target']",
          message:
            'Pass the composed-path leaf to isTypingTarget (e.composedPath()[0] ?? e.target), not a bare e.target — a bare .target is shadow-DOM-blind and reintroduces the keystroke-hijack bug.',
        },
      ],
      // Lock @deprecated count at 0.
      'no-warning-comments': ['error', { terms: ['@deprecated'], location: 'anywhere' }],
      // eslint-plugin-react-hooks v6 (bundled with Next 16's eslint-config-next) adds
      // React-Compiler-era rules absent from the Next 15 config; adopting them across
      // this codebase is a dedicated refactor, out of scope for the framework upgrade.
      // Deferred — rules-of-hooks and exhaustive-deps (below) stay enabled.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/error-boundaries': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/purity': 'off',
    },
  },
  {
    // Prevent direct formatSats usage in components - must use useDisplayCurrency hook.
    files: ['src/components/**/*.{ts,tsx}', 'src/app/**/*.{ts,tsx}'],
    ignores: ['**/hooks/**', '**/*.test.*', '**/*.spec.*'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/services/currency',
              importNames: ['formatSats'],
              message:
                "Use useDisplayCurrency().formatAmount() for user-facing amounts. formatSats ignores user's currency preference.",
            },
            {
              name: '@/utils/currency',
              importNames: ['formatSats'],
              message:
                "Use useDisplayCurrency().formatAmount() for user-facing amounts. formatSats ignores user's currency preference.",
            },
            {
              name: '@/services/mempool',
              importNames: ['formatSats'],
              message:
                "Use useDisplayCurrency().formatAmount() for user-facing amounts. formatSats ignores user's currency preference.",
            },
            {
              name: '@/services/projects/support/helpers',
              importNames: ['formatSats'],
              message:
                "Use useDisplayCurrency().formatAmount() for user-facing amounts. formatSats ignores user's currency preference.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-expect-error': 'allow-with-description',
          'ts-ignore': 'allow-with-description',
          'ts-nocheck': true,
          'ts-check': false,
        },
      ],
    },
  },
];

export default eslintConfig;
