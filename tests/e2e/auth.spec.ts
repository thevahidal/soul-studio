import { test, expect } from '@playwright/test';
import { login } from './fixtures/login';

test('logs in and lands on the table list', async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(/\/tables$/);
  await expect(page.getByRole('heading', { name: 'Tables' })).toBeVisible();
});

test('shows an error for invalid credentials and stays on the login page', async ({
  page,
}) => {
  await page.goto('/studio/login');
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('definitely-wrong-password');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText(/Invalid username or password/i)).toBeVisible();
});

test('persists the session across a reload', async ({ page }) => {
  await login(page);
  await page.reload();
  await expect(page).toHaveURL(/\/tables$/);
});

test('logs out and returns to the login page', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: 'Log out' }).click();

  await expect(page).toHaveURL(/\/login$/);

  // logging out actually revoked the session server-side, not just
  // navigated client-side -- a reload should not silently re-authenticate.
  await page.reload();
  await expect(page).toHaveURL(/\/login$/);
});
