<script lang="ts">
  import { createRole, deleteRole } from '$lib/api/roles';
  import type { Role } from '$lib/api/types';
  import { toast } from '$lib/stores/toast.svelte';
  import { isHttpError } from '$lib/api/errors';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';

  let {
    roles,
    onChanged,
  }: {
    roles: Role[];
    onChanged: () => void;
  } = $props();

  let newRoleName = $state('');
  let submitting = $state(false);
  let deleteTarget = $state<Role | null>(null);

  const errorMessage = (err: unknown) =>
    isHttpError(err) ? err.message : 'Something went wrong';

  const handleCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    if (!newRoleName.trim()) return;
    submitting = true;
    try {
      await createRole(newRoleName.trim());
      newRoleName = '';
      toast.push('Role created', 'success');
      onChanged();
    } catch (err) {
      toast.push(errorMessage(err), 'error');
    } finally {
      submitting = false;
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRole(deleteTarget.id);
      toast.push('Role deleted', 'success');
      onChanged();
    } catch (err) {
      toast.push(errorMessage(err), 'error');
    }
    deleteTarget = null;
  };
</script>

<section class="flex flex-col gap-3">
  <h2 class="text-lg font-semibold">Roles</h2>

  <form onsubmit={handleCreate} class="flex max-w-sm gap-2">
    <label class="sr-only" for="new-role-name">New role name</label>
    <Input
      id="new-role-name"
      bind:value={newRoleName}
      placeholder="New role name"
    />
    <Button type="submit" disabled={submitting}>Add role</Button>
  </form>

  {#if roles.length === 0}
    <p class="text-muted-foreground text-sm">No roles yet.</p>
  {:else}
    <ul class="flex max-w-sm flex-col gap-1">
      {#each roles as role (role.id)}
        <li
          class="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
        >
          <span>{role.name}</span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete role ${role.name}`}
            class="text-destructive hover:text-destructive"
            onclick={() => (deleteTarget = role)}
          >
            <Trash2Icon class="size-3.5" />
          </Button>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<AlertDialog.Root
  open={deleteTarget !== null}
  onOpenChange={(open) => {
    if (!open) deleteTarget = null;
  }}
>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Delete role "{deleteTarget?.name}"?</AlertDialog.Title>
      <AlertDialog.Description>
        This action cannot be undone.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action
        class="bg-destructive hover:bg-destructive/90 text-white"
        onclick={confirmDelete}
      >
        Delete
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
