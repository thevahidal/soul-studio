import { test, expect } from '@playwright/test';
import { login } from './fixtures/login';
import { createTestUser } from './fixtures/create-user';

test('superuser can create a table and then delete it', async ({ page }) => {
  const tableName = `e2e_table_${Date.now()}`;
  await login(page);

  await page.getByRole('link', { name: 'New table' }).click();
  await page.getByLabel('Table name').fill(tableName);
  await page.getByLabel('Name', { exact: true }).fill('title');
  await page.getByRole('button', { name: 'Create table' }).click();

  await expect(page).toHaveURL(new RegExp(`/tables/${tableName}$`));
  await expect(
    page.getByRole('heading', { name: tableName, exact: true }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Delete table' }).click();
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Delete table' })
    .click();

  await expect(page).toHaveURL(/\/tables$/);
});

test('shows a readable error when creating a table with a reserved name', async ({
  page,
}) => {
  await login(page);
  await page.goto('/studio/tables/new');
  await page.getByLabel('Table name').fill('_users');
  await page.getByLabel('Name', { exact: true }).fill('title');
  await page.getByRole('button', { name: 'Create table' }).click();

  await expect(page.getByText(/reserved/i)).toBeVisible();
});

test('non-superuser has "New table" hidden from nav and is denied creating one directly', async ({
  page,
}) => {
  const username = `nonsuper_tables_${Date.now()}`;
  const password = 'Str0ngTestPw!1';
  await createTestUser(username, password);

  await login(page, { username, password });
  await expect(page.getByRole('link', { name: 'New table' })).toHaveCount(0);

  // Table list/create has no `:name` route param, so Soul always denies
  // non-superusers there regardless of role permissions -- see
  // soul/src/services/authService.js's hasTablePermission.
  await page.goto('/studio/tables/new');
  await page.getByLabel('Table name').fill(`nonsuper_table_${Date.now()}`);
  await page.getByLabel('Name', { exact: true }).fill('title');
  await page.getByRole('button', { name: 'Create table' }).click();

  await expect(page.getByText('Not authorized')).toBeVisible();
});
