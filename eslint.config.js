import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'build/**',
      '.svelte-kit/**',
      'package/**',
      '_studio_extensions/**',
      'src/lib/extensions/registry.generated.ts',
      'playwright-report/**',
      'test-results/**',
      'coverage/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...svelte.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    // `.svelte.ts`/`.svelte.js` module files (the Svelte 5/SvelteKit
    // convention for rune-powered stores outside components, see
    // src/lib/stores/*.svelte.ts) are parsed by svelte-eslint-parser too,
    // same as `.svelte` files -- both need the TS sub-parser wired in
    // explicitly or TS syntax inside them fails to parse.
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    files: ['**/*.{test,spec}.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  eslintConfigPrettier,
);
