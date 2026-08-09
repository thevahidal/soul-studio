import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  // globalSetup starts exactly one shared Soul backend + Studio server for
  // the whole run (not per-worker) -- `fullyParallel: false` alone only
  // serializes tests *within* a file, but different spec files still run
  // concurrently across workers by default, which raced auth.spec.ts's
  // login/logout against rows-crud.spec.ts's session on the same shared
  // backend and intermittently logged rows-crud's page out mid-test.
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  // globalSetup owns starting both the ephemeral Soul backend and the
  // Studio dev server itself (see tests/e2e/global-setup.ts) -- not using
  // Playwright's built-in `webServer` option, since that config is static
  // and evaluated before any setup code runs, but the backend's port is
  // only known after a dynamic free-port pick.
  globalSetup: './tests/e2e/global-setup.ts',
  use: {
    // Deliberately no `/studio` path segment here: a leading-slash path
    // passed to page.goto() (e.g. '/login') replaces baseURL's entire path
    // per WHATWG URL resolution rather than appending to it, so a baseURL
    // of '.../studio' would silently strip itself on every navigation.
    // Specs include the `/studio` prefix explicitly instead.
    baseURL: 'http://localhost:3100',
    trace: 'retain-on-failure',
  },
});
