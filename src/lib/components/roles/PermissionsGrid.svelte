<script lang="ts">
  import { listRolePermissions, upsertRolePermission } from '$lib/api/roles';
  import type { Role, RolePermission } from '$lib/api/types';
  import { tablesStore } from '$lib/stores/tables.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { isHttpError } from '$lib/api/errors';
  import * as Table from '$lib/components/ui/table/index.js';
  import { Checkbox } from '$lib/components/ui/checkbox/index.js';

  let { roles }: { roles: Role[] } = $props();

  tablesStore.ensureLoaded();

  const PERMISSION_FIELDS = ['create', 'read', 'update', 'delete'] as const;
  type PermissionField = (typeof PERMISSION_FIELDS)[number];

  let permissions = $state<RolePermission[]>([]);
  let loading = $state(true);

  const cellKey = (roleId: number, tableName: string) =>
    `${roleId}:${tableName}`;
  const permissionMap = $derived(
    new Map(permissions.map((p) => [cellKey(p.role_id, p.table_name), p])),
  );

  const load = async () => {
    loading = true;
    try {
      permissions = await listRolePermissions();
    } catch (err) {
      toast.push(
        isHttpError(err) ? err.message : 'Failed to load permissions',
        'error',
      );
    } finally {
      loading = false;
    }
  };

  $effect(() => {
    load();
  });

  const toggle = async (
    role: Role,
    tableName: string,
    field: PermissionField,
    checked: boolean,
  ) => {
    const existing = permissionMap.get(cellKey(role.id, tableName));
    try {
      await upsertRolePermission({
        roleId: role.id,
        tableName,
        create: existing?.create ?? 0,
        read: existing?.read ?? 0,
        update: existing?.update ?? 0,
        delete: existing?.delete ?? 0,
        [field]: checked ? 1 : 0,
      });
      await load();
    } catch (err) {
      toast.push(
        isHttpError(err) ? err.message : 'Failed to update permission',
        'error',
      );
    }
  };
</script>

<section class="flex flex-col gap-3">
  <h2 class="text-lg font-semibold">Permissions</h2>

  {#if roles.length === 0}
    <p class="text-muted-foreground text-sm">Create a role first.</p>
  {:else if loading}
    <p class="text-muted-foreground text-sm">Loading…</p>
  {:else}
    <div class="overflow-x-auto rounded-lg border">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>Table</Table.Head>
            {#each roles as role (role.id)}
              <Table.Head class="text-center">{role.name}</Table.Head>
            {/each}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each tablesStore.tables as t (t.name)}
            <Table.Row>
              <Table.Cell class="font-mono text-xs">{t.name}</Table.Cell>
              {#each roles as role (role.id)}
                <Table.Cell>
                  <div class="flex justify-center gap-2">
                    {#each PERMISSION_FIELDS as field (field)}
                      <label
                        class="flex flex-col items-center gap-0.5 text-[10px] uppercase"
                        title={field}
                      >
                        <Checkbox
                          checked={(permissionMap.get(
                            cellKey(role.id, t.name),
                          )?.[field] ?? 0) === 1}
                          onCheckedChange={(v) =>
                            toggle(role, t.name, field, v === true)}
                          aria-label={`${role.name} ${field} on ${t.name}`}
                        />
                        {field[0]}
                      </label>
                    {/each}
                  </div>
                </Table.Cell>
              {/each}
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </div>
  {/if}
</section>
