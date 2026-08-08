<script lang="ts">
  import { createTable } from '$lib/api/tables';
  import { isHttpError } from '$lib/api/errors';
  import type { CreateTableField, CreateTablePayload } from '$lib/api/types';
  import { toast } from '$lib/stores/toast.svelte';
  import { isValidIdentifier } from '$lib/metadata/tableNameValidation';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Checkbox } from '$lib/components/ui/checkbox/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import ColumnEditor from './ColumnEditor.svelte';
  import { createEmptyColumn, type ColumnDraft } from './columnDraft';

  let {
    onCreated,
    onCancel,
  }: {
    onCreated: (name: string) => void;
    onCancel: () => void;
  } = $props();

  let name = $state('');
  let autoAddCreatedAt = $state(true);
  let autoAddUpdatedAt = $state(true);
  let columns = $state<ColumnDraft[]>([createEmptyColumn()]);
  let submitting = $state(false);
  let formError = $state<string | null>(null);

  const addColumn = () => {
    columns = [...columns, createEmptyColumn()];
  };

  const removeColumn = (index: number) => {
    columns = columns.filter((_, i) => i !== index);
  };

  const validate = (): string | null => {
    if (!isValidIdentifier(name)) {
      return 'Table name must be 2-30 characters: letters, numbers, underscore, or hyphen only.';
    }
    for (const col of columns) {
      if (!isValidIdentifier(col.name)) {
        return `Column "${col.name || '(blank)'}" must be 2-30 characters: letters, numbers, underscore, or hyphen only.`;
      }
      if (
        col.foreignKey.enabled &&
        (!isValidIdentifier(col.foreignKey.table) ||
          !isValidIdentifier(col.foreignKey.column))
      ) {
        return `Column "${col.name}"'s foreign key table/column must be valid identifiers.`;
      }
    }
    return null;
  };

  const buildPayload = (): CreateTablePayload => ({
    name,
    autoAddCreatedAt,
    autoAddUpdatedAt,
    schema: columns.map((col): CreateTableField => ({
      name: col.name,
      type: col.type,
      ...(col.default ? { default: col.default } : {}),
      ...(col.notNull ? { notNull: true } : {}),
      ...(col.unique ? { unique: true } : {}),
      ...(col.primaryKey ? { primaryKey: true } : {}),
      ...(col.index ? { index: true } : {}),
      ...(col.foreignKey.enabled
        ? {
            foreignKey: {
              table: col.foreignKey.table,
              column: col.foreignKey.column,
              onDelete: col.foreignKey.onDelete,
              onUpdate: col.foreignKey.onUpdate,
            },
          }
        : {}),
    })),
  });

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    formError = validate();
    if (formError) return;

    submitting = true;
    try {
      const res = await createTable(buildPayload());
      onCreated(res.data.name);
    } catch (err) {
      toast.push(
        isHttpError(err) ? err.message : 'Failed to create table',
        'error',
      );
    } finally {
      submitting = false;
    }
  };
</script>

<form onsubmit={handleSubmit} class="flex max-w-3xl flex-col gap-6">
  <div class="grid max-w-xs gap-1.5">
    <Label for="table-name">Table name</Label>
    <Input
      id="table-name"
      bind:value={name}
      placeholder="e.g. books"
      required
    />
  </div>

  <div class="flex gap-6">
    <label class="flex items-center gap-2 text-sm">
      <Checkbox bind:checked={autoAddCreatedAt} />
      Auto-add createdAt
    </label>
    <label class="flex items-center gap-2 text-sm">
      <Checkbox bind:checked={autoAddUpdatedAt} />
      Auto-add updatedAt
    </label>
  </div>

  <div class="flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <h2 class="text-sm font-semibold">Columns</h2>
      <Button
        type="button"
        variant="outline"
        size="sm"
        class="gap-1.5"
        onclick={addColumn}
      >
        <PlusIcon class="size-3.5" />
        Add column
      </Button>
    </div>
    {#each columns as _, index (index)}
      <ColumnEditor
        bind:column={columns[index]}
        rowId={index}
        onRemove={() => removeColumn(index)}
      />
    {/each}
  </div>

  {#if formError}
    <p class="text-destructive text-sm">{formError}</p>
  {/if}

  <div class="flex items-center justify-end gap-2">
    <Button
      type="button"
      variant="outline"
      onclick={onCancel}
      disabled={submitting}
    >
      Cancel
    </Button>
    <Button type="submit" disabled={submitting}>
      {submitting ? 'Creating…' : 'Create table'}
    </Button>
  </div>
</form>
