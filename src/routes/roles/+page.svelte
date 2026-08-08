<script lang="ts">
  import { listRoles } from '$lib/api/roles';
  import type { Role } from '$lib/api/types';
  import { isHttpError } from '$lib/api/errors';
  import RolesList from '$lib/components/roles/RolesList.svelte';
  import PermissionsGrid from '$lib/components/roles/PermissionsGrid.svelte';
  import UserRolesAssignment from '$lib/components/roles/UserRolesAssignment.svelte';

  type Status = 'idle' | 'loading' | 'loaded' | 'forbidden' | 'error';

  let roles = $state<Role[]>([]);
  let status = $state<Status>('idle');
  let errorMessage = $state<string | null>(null);

  const loadRoles = async () => {
    status = 'loading';
    try {
      roles = await listRoles();
      status = 'loaded';
    } catch (err) {
      if (isHttpError(err) && err.status === 403) {
        status = 'forbidden';
      } else {
        errorMessage = isHttpError(err) ? err.message : 'Failed to load roles.';
        status = 'error';
      }
    }
  };

  $effect(() => {
    loadRoles();
  });
</script>

<svelte:head>
  <title>Roles — Soul Studio</title>
</svelte:head>

<h1 class="mb-6 text-2xl font-semibold tracking-tight">Roles</h1>

{#if status === 'loading' || status === 'idle'}
  <p class="text-muted-foreground text-sm">Loading…</p>
{:else if status === 'forbidden'}
  <p class="text-muted-foreground text-sm">
    You don't have permission to manage roles.
  </p>
{:else if status === 'error'}
  <p class="text-destructive text-sm">{errorMessage}</p>
{:else}
  <div class="flex flex-col gap-10">
    <RolesList {roles} onChanged={loadRoles} />
    <PermissionsGrid {roles} />
    <UserRolesAssignment {roles} />
  </div>
{/if}
