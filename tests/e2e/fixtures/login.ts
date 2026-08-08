import type { Page } from '@playwright/test';
import { readSharedState } from './shared-state';

// Defaults to the shared admin superuser -- pass explicit credentials to
// log in as a different (e.g. non-superuser) user created via
// createTestUser().
export const login = async (
  page: Page,
  credentials?: { username: string; password: string },
) => {
  const state = readSharedState();
  const username = credentials?.username ?? state.adminUsername;
  const password = credentials?.password ?? state.adminPassword;
  await page.goto('/studio/login');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/tables');
};
