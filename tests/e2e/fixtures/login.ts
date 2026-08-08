import type { Page } from '@playwright/test';
import { readSharedState } from './shared-state';

export const login = async (page: Page) => {
  const state = readSharedState();
  await page.goto('/studio/login');
  await page.getByLabel('Username').fill(state.adminUsername);
  await page.getByLabel('Password').fill(state.adminPassword);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/tables');
};
