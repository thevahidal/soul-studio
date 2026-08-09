import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['tests/e2e/**'],
    setupFiles: ['./vitest-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      // Scoped to the pure-logic layer this project's unit tests actually
      // cover by convention (see the existing *.test.ts files) -- Svelte
      // components, stores, and vendored shadcn-svelte UI primitives are
      // either covered by the Playwright e2e suite instead or are thin
      // enough not to warrant a dedicated unit-test convention of their
      // own. Gating coverage on the full `src/lib/**` tree would mostly
      // measure files nothing here is trying to unit-test.
      include: [
        'src/lib/api/**/*.ts',
        'src/lib/metadata/**/*.ts',
        'src/lib/realtime/**/*.ts',
        'src/lib/extensions/**/*.ts',
      ],
      exclude: ['src/lib/extensions/registry.generated.ts'],
      // Set from the actual measured coverage at the time this gate was
      // added (not an aspirational target) -- a no-regression floor, with
      // a small margin below the measured numbers to absorb incidental
      // fluctuation rather than a target to write tests up to.
      thresholds: {
        statements: 79,
        branches: 80,
        functions: 74,
        lines: 80,
      },
    },
  },
});
