import { test, expect } from '@playwright/test';
import { login } from './fixtures/login';

test.beforeEach(async ({ page }) => {
  await login(page);
  await page.goto('/studio/tables/books');
});

test('browses the table and sees the seeded row', async ({ page }) => {
  await expect(page.getByRole('cell', { name: 'Dune' })).toBeVisible();
});

test('creates a new row and sees it appear in the list', async ({ page }) => {
  const title = `E2E Created ${Date.now()}`;

  await page.getByRole('button', { name: '+ New row' }).click();
  await page.getByLabel('title *').fill(title);
  await page.getByLabel('authorName').fill('Test Author');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByRole('cell', { name: title })).toBeVisible();
});

test('edits an existing row', async ({ page }) => {
  const title = `E2E Edit Target ${Date.now()}`;
  const updatedTitle = `${title} (updated)`;

  await page.getByRole('button', { name: '+ New row' }).click();
  await page.getByLabel('title *').fill(title);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('cell', { name: title })).toBeVisible();

  const row = page.getByRole('row', { name: title });
  await row.getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel('title *').fill(updatedTitle);
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByRole('cell', { name: updatedTitle })).toBeVisible();
  await expect(
    page.getByRole('cell', { name: title, exact: true }),
  ).toHaveCount(0);
});

test('deletes a row', async ({ page }) => {
  const title = `E2E Delete Target ${Date.now()}`;

  await page.getByRole('button', { name: '+ New row' }).click();
  await page.getByLabel('title *').fill(title);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('cell', { name: title })).toBeVisible();

  const row = page.getByRole('row', { name: title });
  await row.getByRole('button', { name: 'Delete' }).click();
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Delete' })
    .click();

  await expect(page.getByRole('cell', { name: title })).toHaveCount(0);
});
