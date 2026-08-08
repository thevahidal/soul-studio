import { test, expect } from '@playwright/test';
import { login } from './fixtures/login';
import { readSharedState } from './fixtures/shared-state';

// Two separate browser *contexts* (not two tabs sharing one context) --
// each gets its own cookie jar, so each has to log in independently, and
// each drives its own real WebSocket subscription against the shared
// ephemeral backend.
test('a row created in one browser context appears live in another without a reload', async ({
  browser,
}) => {
  const state = readSharedState();
  const title = `E2E Realtime Insert ${Date.now()}`;

  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  try {
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();
    await login(pageA);
    await login(pageB);

    await pageA.goto(`/studio/tables/${state.seedTable}`);
    // pageB renders its snapshot of the table *before* the insert happens.
    await pageB.goto(`/studio/tables/${state.seedTable}`);

    await pageA.getByRole('button', { name: '+ New row' }).click();
    await pageA.getByLabel('title *').fill(title);
    await pageA.getByRole('button', { name: 'Save' }).click();
    await expect(pageA.getByRole('cell', { name: title })).toBeVisible();

    // No reload/navigation on pageB from here -- this only passes if the
    // WS broadcast merged the new row into the already-rendered table.
    await expect(pageB.getByRole('cell', { name: title })).toBeVisible();
  } finally {
    await contextA.close();
    await contextB.close();
  }
});

test('a row updated in one browser context updates live in another', async ({
  browser,
}) => {
  const state = readSharedState();
  const title = `E2E Realtime Update ${Date.now()}`;
  const updatedTitle = `${title} (updated)`;

  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  try {
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();
    await login(pageA);
    await login(pageB);

    await pageA.goto(`/studio/tables/${state.seedTable}`);
    await pageA.getByRole('button', { name: '+ New row' }).click();
    await pageA.getByLabel('title *').fill(title);
    await pageA.getByRole('button', { name: 'Save' }).click();
    await expect(pageA.getByRole('cell', { name: title })).toBeVisible();

    await pageB.goto(`/studio/tables/${state.seedTable}`);
    await expect(pageB.getByRole('cell', { name: title })).toBeVisible();

    const row = pageA.getByRole('row', { name: title });
    await row.getByRole('button', { name: 'Edit' }).click();
    await pageA.getByLabel('title *').fill(updatedTitle);
    await pageA.getByRole('button', { name: 'Save' }).click();

    await expect(pageB.getByRole('cell', { name: updatedTitle })).toBeVisible();
  } finally {
    await contextA.close();
    await contextB.close();
  }
});

test('a row deleted in one browser context disappears live in another', async ({
  browser,
}) => {
  const state = readSharedState();
  const title = `E2E Realtime Delete ${Date.now()}`;

  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  try {
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();
    await login(pageA);
    await login(pageB);

    await pageA.goto(`/studio/tables/${state.seedTable}`);
    await pageA.getByRole('button', { name: '+ New row' }).click();
    await pageA.getByLabel('title *').fill(title);
    await pageA.getByRole('button', { name: 'Save' }).click();
    await expect(pageA.getByRole('cell', { name: title })).toBeVisible();

    await pageB.goto(`/studio/tables/${state.seedTable}`);
    await expect(pageB.getByRole('cell', { name: title })).toBeVisible();

    const row = pageA.getByRole('row', { name: title });
    await row.getByRole('button', { name: 'Delete' }).click();
    await pageA
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Delete' })
      .click();
    await expect(pageA.getByRole('cell', { name: title })).toHaveCount(0);

    await expect(pageB.getByRole('cell', { name: title })).toHaveCount(0);
  } finally {
    await contextA.close();
    await contextB.close();
  }
});
