<script lang="ts">
  import * as Select from '$lib/components/ui/select/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Checkbox } from '$lib/components/ui/checkbox/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import type { SqliteColumnType } from '$lib/api/types';
  import type { ColumnDraft, FkAction } from './columnDraft';
  import { tablesStore } from '$lib/stores/tables.svelte';

  let {
    column = $bindable(),
    rowId,
    onRemove,
  }: {
    column: ColumnDraft;
    rowId: string | number;
    onRemove: () => void;
  } = $props();

  const fieldId = (field: string) => `column-${rowId}-${field}`;

  const TYPES: SqliteColumnType[] = [
    'TEXT',
    'NUMERIC',
    'INTEGER',
    'REAL',
    'BLOB',
    'BOOLEAN',
    'DATE',
    'DATETIME',
  ];
  const FK_ACTIONS: FkAction[] = [
    'CASCADE',
    'SET NULL',
    'SET DEFAULT',
    'RESTRICT',
  ];
</script>

<div class="flex flex-col gap-3 rounded-lg border p-3">
  <div class="flex flex-wrap items-end gap-3">
    <div class="grid gap-1.5">
      <Label for={fieldId('name')}>Name</Label>
      <Input
        id={fieldId('name')}
        bind:value={column.name}
        placeholder="e.g. title"
        class="w-40"
      />
    </div>

    <div class="grid gap-1.5">
      <Label for={fieldId('type')}>Type</Label>
      <Select.Root
        type="single"
        value={column.type}
        onValueChange={(v) => {
          if (v) column.type = v as SqliteColumnType;
        }}
      >
        <Select.Trigger id={fieldId('type')} class="w-32">
          {column.type}
        </Select.Trigger>
        <Select.Content>
          {#each TYPES as t (t)}
            <Select.Item value={t} label={t} />
          {/each}
        </Select.Content>
      </Select.Root>
    </div>

    <div class="grid gap-1.5">
      <Label for={fieldId('default')}>Default</Label>
      <Input id={fieldId('default')} bind:value={column.default} class="w-28" />
    </div>

    <label class="flex items-center gap-1.5 text-xs">
      <Checkbox bind:checked={column.notNull} />
      Not null
    </label>
    <label class="flex items-center gap-1.5 text-xs">
      <Checkbox bind:checked={column.unique} />
      Unique
    </label>
    <label class="flex items-center gap-1.5 text-xs">
      <Checkbox bind:checked={column.primaryKey} />
      Primary key
    </label>
    <label class="flex items-center gap-1.5 text-xs">
      <Checkbox bind:checked={column.index} />
      Index
    </label>

    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="Remove column"
      class="text-destructive hover:text-destructive ml-auto"
      onclick={onRemove}
    >
      <Trash2Icon class="size-3.5" />
    </Button>
  </div>

  <label class="flex items-center gap-1.5 text-xs">
    <Checkbox bind:checked={column.foreignKey.enabled} />
    Foreign key
  </label>

  {#if column.foreignKey.enabled}
    <div class="flex flex-wrap items-end gap-3 pl-1">
      <div class="grid gap-1.5">
        <Label for={fieldId('fk-table')}>References table</Label>
        <Select.Root
          type="single"
          value={column.foreignKey.table}
          onValueChange={(v) => {
            if (v) column.foreignKey.table = v;
          }}
        >
          <Select.Trigger id={fieldId('fk-table')} class="w-40">
            {column.foreignKey.table || 'Select table'}
          </Select.Trigger>
          <Select.Content>
            {#each tablesStore.tables as t (t.name)}
              <Select.Item value={t.name} label={t.name} />
            {/each}
          </Select.Content>
        </Select.Root>
      </div>

      <div class="grid gap-1.5">
        <Label for={fieldId('fk-column')}>Column</Label>
        <Input
          id={fieldId('fk-column')}
          bind:value={column.foreignKey.column}
          class="w-24"
        />
      </div>

      <div class="grid gap-1.5">
        <Label for={fieldId('fk-on-delete')}>On delete</Label>
        <Select.Root
          type="single"
          value={column.foreignKey.onDelete}
          onValueChange={(v) => {
            if (v) column.foreignKey.onDelete = v as FkAction;
          }}
        >
          <Select.Trigger id={fieldId('fk-on-delete')} class="w-32">
            {column.foreignKey.onDelete}
          </Select.Trigger>
          <Select.Content>
            {#each FK_ACTIONS as a (a)}
              <Select.Item value={a} label={a} />
            {/each}
          </Select.Content>
        </Select.Root>
      </div>

      <div class="grid gap-1.5">
        <Label for={fieldId('fk-on-update')}>On update</Label>
        <Select.Root
          type="single"
          value={column.foreignKey.onUpdate}
          onValueChange={(v) => {
            if (v) column.foreignKey.onUpdate = v as FkAction;
          }}
        >
          <Select.Trigger id={fieldId('fk-on-update')} class="w-32">
            {column.foreignKey.onUpdate}
          </Select.Trigger>
          <Select.Content>
            {#each FK_ACTIONS as a (a)}
              <Select.Item value={a} label={a} />
            {/each}
          </Select.Content>
        </Select.Root>
      </div>
    </div>
  {/if}
</div>
