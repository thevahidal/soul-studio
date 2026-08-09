import { test, expect } from '@playwright/test';
import { login } from './fixtures/login';
import { readSharedState } from './fixtures/shared-state';

// The plugin itself is written into _studio_extensions/ by
// fixtures/seed-plugin.ts, *before* the Studio dev server starts (see
// global-setup.ts) -- this proves the registry is consumed end-to-end by
// the real UI, not just unit-tested against buildRegistry() in isolation.
test('a plugin dropped in _studio_extensions/ shows up in nav, field rendering, and row actions', async ({
  page,
}) => {
  const state = readSharedState();
  await login(page);

  await expect(
    page.getByRole('link', { name: 'E2E Plugin Nav' }),
  ).toBeVisible();

  await page.goto(`/studio/tables/${state.pluginTable}`);
  const row = page.getByRole('row', { name: 'Plugin demo row' });
  await expect(
    row.getByRole('button', { name: 'E2E Row Action' }),
  ).toBeVisible();

  await row.getByRole('button', { name: 'Edit' }).click();
  await expect(page.getByTestId('e2e-plugin-field')).toBeVisible();
});
