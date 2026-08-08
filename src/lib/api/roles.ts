import { deleteRow, insertRow, listRows, updateRow } from './rows';
import type { Role, RolePermission, UserRole } from './types';

// No dedicated backend endpoints for any of this -- roles/permissions are
// generic CRUD over three reserved tables (see soul/src/db/schema.js),
// composed here into one coherent domain module.
const ROLES_TABLE = '_roles';
const ROLES_PERMISSIONS_TABLE = '_roles_permissions';
const USERS_ROLES_TABLE = '_users_roles';
const USERS_TABLE = '_users';

export interface UserListItem {
  id: number;
  username: string;
}

export const listRoles = async (): Promise<Role[]> => {
  const res = await listRows(ROLES_TABLE, { limit: 1000 });
  return res.data as unknown as Role[];
};

export const createRole = (name: string) => insertRow(ROLES_TABLE, { name });

export const deleteRole = (id: number) => deleteRow(ROLES_TABLE, id);

export const listUsers = async (): Promise<UserListItem[]> => {
  const res = await listRows(USERS_TABLE, { limit: 1000 });
  return res.data as unknown as UserListItem[];
};

export const listRolePermissions = async (): Promise<RolePermission[]> => {
  const res = await listRows(ROLES_PERMISSIONS_TABLE, { limit: 10000 });
  return res.data as unknown as RolePermission[];
};

export interface RolePermissionInput {
  roleId: number;
  tableName: string;
  create: 0 | 1;
  read: 0 | 1;
  update: 0 | 1;
  delete: 0 | 1;
}

// Respects the `(role_id, table_name)` unique constraint on
// _roles_permissions -- upserts by first checking whether a row already
// exists for this cell, since the backend has no ON CONFLICT/upsert verb.
export const upsertRolePermission = async (
  input: RolePermissionInput,
): Promise<void> => {
  const existing = await listRows(ROLES_PERMISSIONS_TABLE, {
    filters: [
      { field: 'role_id', operator: 'eq', value: input.roleId },
      { field: 'table_name', operator: 'eq', value: input.tableName },
    ],
    limit: 1,
  });

  const fields = {
    role_id: input.roleId,
    table_name: input.tableName,
    create: input.create,
    read: input.read,
    update: input.update,
    delete: input.delete,
  };

  if (existing.data.length > 0) {
    await updateRow(
      ROLES_PERMISSIONS_TABLE,
      existing.data[0].id as number,
      fields,
    );
  } else {
    await insertRow(ROLES_PERMISSIONS_TABLE, fields);
  }
};

export const listUserRoles = async (): Promise<UserRole[]> => {
  const res = await listRows(USERS_ROLES_TABLE, { limit: 10000 });
  return res.data as unknown as UserRole[];
};

export const assignUserRole = (userId: number, roleId: number) =>
  insertRow(USERS_ROLES_TABLE, { user_id: userId, role_id: roleId });

export const unassignUserRole = (userRoleRowId: number) =>
  deleteRow(USERS_ROLES_TABLE, userRoleRowId);
