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

  const handleDeleteOne = async (row: Row) => {
    if (!confirm('Delete this row?')) return;
    try {
      await deleteRow(tableName, row[pkField] as string | number);
      toast.push('Row deleted', 'success');
      await loadRows();
    } catch (err) {
      toast.push(errorMessage(err), 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} row(s)?`)) return;
    try {
      await deleteRow(tableName, Array.from(selected).join(','));
      toast.push('Rows deleted', 'success');
      await loadRows();
    } catch (err) {
      toast.push(errorMessage(err), 'error');
    }
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

<div class="table-browser">
  {#if fields.length > 0}
    <FilterBar {fields} bind:search bind:filters onApply={applyFilters} />
  {/if}

  <div class="toolbar">
    <button onclick={openCreate}>+ New row</button>
  </div>

  <BulkActionsBar selectedCount={selected.size} onDelete={handleBulkDelete} />

  {#if formMode}
    <div class="form-panel">
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
    </div>
  {/if}

  {#if loading}
    <p>Loading…</p>
  {:else if rows.length === 0}
    <p>No rows.</p>
  {:else}
    <table>
      <thead>
        <tr>
          <th>
            <input
              type="checkbox"
              checked={selected.size > 0 && selected.size === rows.length}
              onchange={toggleSelectAll}
            />
          </th>
          {#each fields as field (field.name)}
            <th>
              <button type="button" onclick={() => toggleSort(field.name)}>
                {field.name}
                {#if ordering === field.name}↑{:else if ordering === `-${field.name}`}↓{/if}
              </button>
            </th>
          {/each}
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each rows as row (row[pkField])}
          <tr>
            <td>
              <input
                type="checkbox"
                checked={selected.has(row[pkField])}
                onchange={() => toggleSelect(row[pkField])}
              />
            </td>
            {#each fields as field (field.name)}
              <td>{cellDisplay(row, field)}</td>
            {/each}
            <td>
              <button type="button" onclick={() => openEdit(row)}>Edit</button>
              <button type="button" onclick={() => handleDeleteOne(row)}>
                Delete
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>

    <Pagination {page} {limit} {total} onPageChange={goToPage} />
  {/if}
</div>

<style>
  .toolbar {
    margin-bottom: 0.75rem;
  }

  .form-panel {
    border: 1px solid var(--divider);
    border-radius: 4px;
    padding: 1rem;
    margin-bottom: 1rem;
  }
</style>
