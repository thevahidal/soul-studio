import { defineConfig } from '@playwright/test';

// e2e specs land starting Phase 2 of the rebuild (see soul-studio's
// project plan) -- this config exists now so `npm run test:e2e` and the
// CI job are wired up ahead of the first real spec landing.
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:3000/studio',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000/studio',
    reuseExistingServer: !process.env.CI,
  },
});
