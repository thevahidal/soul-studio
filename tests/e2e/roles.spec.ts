import { test, expect } from '@playwright/test';
import { login } from './fixtures/login';
import { createTestUser } from './fixtures/create-user';

test('superuser can create a role, grant a permission, and assign it to a user', async ({
  page,
}) => {
  const roleName = `e2e-role-${Date.now()}`;
  await login(page);

  await page.getByRole('link', { name: 'Roles', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Roles', exact: true, level: 1 }),
  ).toBeVisible();

  await page.getByPlaceholder('New role name').fill(roleName);
  await page.getByRole('button', { name: 'Add role' }).click();
  await expect(page.getByText(roleName)).toBeVisible();

  // Grant read on the _users table for the new role in the permissions grid.
  const usersReadCheckbox = page.getByRole('checkbox', {
    name: `${roleName} read on _users`,
    exact: true,
  });
  await usersReadCheckbox.check();
  await expect(usersReadCheckbox).toBeChecked();

  // Assign the role to the seeded admin user.
  const adminRoleCheckbox = page.getByRole('checkbox', {
    name: `admin has role ${roleName}`,
    exact: true,
  });
  await adminRoleCheckbox.check();
  await expect(adminRoleCheckbox).toBeChecked();
});

test('non-superuser has "Roles" hidden from nav and is denied creating a role directly', async ({
  page,
}) => {
  const username = `nonsuper_roles_${Date.now()}`;
  const password = 'Str0ngTestPw!1';
  await createTestUser(username, password);

  await login(page, { username, password });
  await expect(
    page.getByRole('link', { name: 'Roles', exact: true }),
  ).toHaveCount(0);

  await page.goto('/studio/roles');
  // The default role grants read (but not create) on _roles, so the page
  // itself loads instead of 403ing outright -- only the write fails.
  await expect(
    page.getByRole('heading', { name: 'Roles', exact: true, level: 1 }),
  ).toBeVisible();

  await page
    .getByPlaceholder('New role name')
    .fill(`nonsuper-role-${Date.now()}`);
  await page.getByRole('button', { name: 'Add role' }).click();

  await expect(page.getByText('Not authorized')).toBeVisible();
});
