<script lang="ts">
  import {
    assignUserRole,
    listUserRoles,
    listUsers,
    unassignUserRole,
    type UserListItem,
  } from '$lib/api/roles';
  import type { Role, UserRole } from '$lib/api/types';
  import { toast } from '$lib/stores/toast.svelte';
  import { isHttpError } from '$lib/api/errors';
  import * as Table from '$lib/components/ui/table/index.js';
  import { Checkbox } from '$lib/components/ui/checkbox/index.js';

  let { roles }: { roles: Role[] } = $props();

  let users = $state<UserListItem[]>([]);
  let userRoles = $state<UserRole[]>([]);
  let loading = $state(true);

  const cellKey = (userId: number, roleId: number) => `${userId}:${roleId}`;
  const assignmentMap = $derived(
    new Map(userRoles.map((ur) => [cellKey(ur.user_id, ur.role_id), ur.id])),
  );

  const load = async () => {
    loading = true;
    try {
      [users, userRoles] = await Promise.all([listUsers(), listUserRoles()]);
    } catch (err) {
      toast.push(
        isHttpError(err) ? err.message : 'Failed to load user roles',
        'error',
      );
    } finally {
      loading = false;
    }
  };

  $effect(() => {
    load();
  });

  const toggle = async (userId: number, roleId: number, checked: boolean) => {
    const existingId = assignmentMap.get(cellKey(userId, roleId));
    try {
      if (checked && !existingId) {
        await assignUserRole(userId, roleId);
      } else if (!checked && existingId) {
        await unassignUserRole(existingId);
      }
      await load();
    } catch (err) {
      toast.push(
        isHttpError(err) ? err.message : 'Failed to update role assignment',
        'error',
      );
    }
  };
</script>

<section class="flex flex-col gap-3">
  <h2 class="text-lg font-semibold">User roles</h2>

  {#if roles.length === 0}
    <p class="text-muted-foreground text-sm">Create a role first.</p>
  {:else if loading}
    <p class="text-muted-foreground text-sm">Loading…</p>
  {:else}
    <div class="overflow-x-auto rounded-lg border">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>User</Table.Head>
            {#each roles as role (role.id)}
              <Table.Head class="text-center">{role.name}</Table.Head>
            {/each}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each users as user (user.id)}
            <Table.Row>
              <Table.Cell>{user.username}</Table.Cell>
              {#each roles as role (role.id)}
                <Table.Cell class="text-center">
                  <Checkbox
                    checked={assignmentMap.has(cellKey(user.id, role.id))}
                    onCheckedChange={(v) =>
                      toggle(user.id, role.id, v === true)}
                    aria-label={`${user.username} has role ${role.name}`}
                  />
                </Table.Cell>
              {/each}
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </div>
  {/if}
</section>
