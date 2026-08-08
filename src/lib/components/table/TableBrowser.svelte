<script lang="ts">
  import { deleteRow, insertRow, listRows, updateRow } from '$lib/api/rows';
  import { getTableSchema } from '$lib/api/tables';
  import type { Row } from '$lib/api/types';
  import { isHttpError } from '$lib/api/errors';
  import { toast } from '$lib/stores/toast.svelte';
  import { displayLabel } from '$lib/metadata/displayValue';
  import {
    schemaToForm,
    type FieldDescriptor,
  } from '$lib/metadata/schemaToForm';
  import { SvelteSet } from 'svelte/reactivity';
  import * as Table from '$lib/components/ui/table/index.js';
  import * as Sheet from '$lib/components/ui/sheet/index.js';
  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Checkbox } from '$lib/components/ui/checkbox/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
  import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
  import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
  import BulkActionsBar from './BulkActionsBar.svelte';
  import FilterBar, { type DraftFilter } from './FilterBar.svelte';
  import Pagination from './Pagination.svelte';
  import RowForm from './RowForm.svelte';

  let { tableName }: { tableName: string } = $props();

  let fields = $state<FieldDescriptor[]>([]);
  let rows = $state<Row[]>([]);
  let total = $state(0);
  let loading = $state(true);

  let page = $state(1);
  const limit = 10;
  let search = $state('');
  let filters = $state<DraftFilter[]>([]);
  let ordering = $state<string | undefined>(undefined);

  // SvelteSet is reactive on its own (add/delete/clear) -- no $state wrap.
  const selected = new SvelteSet<unknown>();
  let formMode = $state<'create' | 'edit' | null>(null);
  let editingRow = $state<Row | null>(null);
  let submitting = $state(false);

  let deleteTarget = $state<Row | 'bulk' | null>(null);
  let deleteDialogOpen = $state(false);

  const pkField = $derived(fields.find((f) => f.isPrimaryKey)?.name ?? 'id');
  const fkColumns = $derived(
    fields.filter((f) => f.foreignKey).map((f) => f.name),
  );

  const errorMessage = (err: unknown) =>
    isHttpError(err) ? err.message : 'Something went wrong';

  const loadSchema = async () => {
    const res = await getTableSchema(tableName);
    fields = schemaToForm(res.data, res.foreignKeys);
  };

  const loadRows = async () => {
    loading = true;
    try {
      const res = await listRows(tableName, {
        page,
        limit,
        search: search || undefined,
        filters: filters.length ? filters : undefined,
        ordering,
        extend: fkColumns.length ? fkColumns : undefined,
      });
      rows = res.data;
      total = res.total;
      selected.clear();
    } catch (err) {
      toast.push(errorMessage(err), 'error');
    } finally {
      loading = false;
    }
  };

  $effect(() => {
    // re-run whenever the table changes
    void tableName;
    page = 1;
    search = '';
    filters = [];
    ordering = undefined;
    formMode = null;
    (async () => {
      try {
        await loadSchema();
        await loadRows();
      } catch (err) {
        toast.push(errorMessage(err), 'error');
      }
    })();
  });

  const applyFilters = () => {
    page = 1;
    loadRows();
  };

  const toggleSort = (fieldName: string) => {
    if (ordering === fieldName) {
      ordering = `-${fieldName}`;
    } else if (ordering === `-${fieldName}`) {
      ordering = undefined;
    } else {
      ordering = fieldName;
    }
    loadRows();
  };

  const goToPage = (next: number) => {
    page = next;
    loadRows();
  };

  const toggleSelect = (pk: unknown) => {
    if (selected.has(pk)) {
      selected.delete(pk);
    } else {
      selected.add(pk);
    }
  };

  const toggleSelectAll = () => {
    if (selected.size === rows.length) {
      selected.clear();
    } else {
      selected.clear();
      rows.forEach((row) => selected.add(row[pkField]));
    }
  };

  const openCreate = () => {
    editingRow = null;
    formMode = 'create';
  };

  const openEdit = (row: Row) => {
    editingRow = row;
    formMode = 'edit';
  };

  const closeForm = () => {
    formMode = null;
    editingRow = null;
  };

  const handleSubmit = async (values: Row) => {
    submitting = true;
    try {
      if (formMode === 'create') {
        await insertRow(tableName, values);
        toast.push('Row created', 'success');
      } else if (formMode === 'edit' && editingRow) {
        await updateRow(
          tableName,
          editingRow[pkField] as string | number,
          values,
        );
        toast.push('Row updated', 'success');
      }
      closeForm();
      await loadRows();
    } catch (err) {
      toast.push(errorMessage(err), 'error');
    } finally {
      submitting = false;
    }
  };

  const requestDeleteOne = (row: Row) => {
    deleteTarget = row;
    deleteDialogOpen = true;
  };

  const requestBulkDelete = () => {
    deleteTarget = 'bulk';
    deleteDialogOpen = true;
  };

  const confirmDelete = async () => {
    if (deleteTarget === 'bulk') {
      try {
        await deleteRow(tableName, Array.from(selected).join(','));
        toast.push('Rows deleted', 'success');
        await loadRows();
      } catch (err) {
        toast.push(errorMessage(err), 'error');
      }
    } else if (deleteTarget) {
      try {
        await deleteRow(tableName, deleteTarget[pkField] as string | number);
        toast.push('Row deleted', 'success');
        await loadRows();
      } catch (err) {
        toast.push(errorMessage(err), 'error');
      }
    }
    deleteTarget = null;
  };

  const cellDisplay = (row: Row, field: FieldDescriptor): string => {
    if (field.foreignKey) {
      const related = row[`${field.name}_data`] as Row | undefined;
      if (related) {
        return displayLabel(related, [field.foreignKey.column]);
      }
    }
    const value = row[field.name];
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };
</script>

<div class="flex flex-col gap-4">
  <div class="flex items-center justify-between gap-3">
    <div class="flex items-center gap-2">
      <h1 class="text-2xl font-semibold tracking-tight">{tableName}</h1>
      {#if !loading}
        <Badge variant="secondary">{total} row{total === 1 ? '' : 's'}</Badge>
      {/if}
    </div>
    <Button onclick={openCreate}>+ New row</Button>
  </div>

  {#if fields.length > 0}
    <FilterBar {fields} bind:search bind:filters onApply={applyFilters} />
  {/if}

  <BulkActionsBar selectedCount={selected.size} onDelete={requestBulkDelete} />

  {#if loading}
    <div class="flex flex-col gap-2">
      {#each Array(5) as _, i (i)}
        <Skeleton class="h-9 w-full" />
      {/each}
    </div>
  {:else if rows.length === 0}
    <p class="text-muted-foreground py-8 text-center text-sm">No rows.</p>
  {:else}
    <div class="rounded-lg border">
      <Table.Root>
        <Table.Header>
          <Table.Row class="hover:bg-transparent">
            <Table.Head class="w-10">
              <Checkbox
                checked={selected.size > 0 && selected.size === rows.length}
                indeterminate={selected.size > 0 && selected.size < rows.length}
                onCheckedChange={toggleSelectAll}
                aria-label="Select all rows"
              />
            </Table.Head>
            {#each fields as field (field.name)}
              <Table.Head>
                <button
                  type="button"
                  onclick={() => toggleSort(field.name)}
                  class="hover:text-foreground flex items-center gap-1 font-medium"
                >
                  {field.name}
                  {#if ordering === field.name}
                    <ArrowUpIcon class="size-3.5" />
                  {:else if ordering === `-${field.name}`}
                    <ArrowDownIcon class="size-3.5" />
                  {:else}
                    <ChevronsUpDownIcon class="size-3.5 opacity-40" />
                  {/if}
                </button>
              </Table.Head>
            {/each}
            <Table.Head class="w-20 text-right">Actions</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each rows as row (row[pkField])}
            <Table.Row>
              <Table.Cell>
                <Checkbox
                  checked={selected.has(row[pkField])}
                  onCheckedChange={() => toggleSelect(row[pkField])}
                  aria-label="Select row"
                />
              </Table.Cell>
              {#each fields as field (field.name)}
                <Table.Cell class="font-mono text-xs">
                  {cellDisplay(row, field)}
                </Table.Cell>
              {/each}
              <Table.Cell>
                <div class="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Edit"
                    onclick={() => openEdit(row)}
                  >
                    <PencilIcon class="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete"
                    class="text-destructive hover:text-destructive"
                    onclick={() => requestDeleteOne(row)}
                  >
                    <Trash2Icon class="size-3.5" />
                  </Button>
                </div>
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </div>

    <Pagination {page} {limit} {total} onPageChange={goToPage} />
  {/if}
</div>

<Sheet.Root
  open={formMode !== null}
  onOpenChange={(open) => {
    if (!open) closeForm();
  }}
>
  <Sheet.Content class="flex w-full flex-col gap-0 p-0 sm:max-w-md">
    <Sheet.Header class="border-b px-4 py-3">
      <Sheet.Title>{formMode === 'create' ? 'New row' : 'Edit row'}</Sheet.Title
      >
      <Sheet.Description>
        {tableName}
      </Sheet.Description>
    </Sheet.Header>
    {#if formMode}
      {#key editingRow}
        <RowForm
          {tableName}
          {fields}
          mode={formMode}
          initialValues={editingRow ?? {}}
          {submitting}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      {/key}
    {/if}
  </Sheet.Content>
</Sheet.Root>

<AlertDialog.Root bind:open={deleteDialogOpen}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>
        {deleteTarget === 'bulk'
          ? `Delete ${selected.size} row(s)?`
          : 'Delete this row?'}
      </AlertDialog.Title>
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
