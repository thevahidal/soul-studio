<script lang="ts">
  import type { FilterOperator, RowFilter } from '$lib/api/types';
  import type { FieldDescriptor } from '$lib/metadata/schemaToForm';

  // Filter values are always typed as strings while being edited in this
  // form -- rows.ts's serializeFilters() accepts any `value: unknown` and
  // stringifies scalars, so this is a safe, narrower view of RowFilter.
  export interface DraftFilter extends Omit<RowFilter, 'value'> {
    value: string;
  }

  let {
    fields,
    search = $bindable(''),
    filters = $bindable<DraftFilter[]>([]),
    onApply,
  }: {
    fields: FieldDescriptor[];
    search?: string;
    filters?: DraftFilter[];
    onApply: () => void;
  } = $props();

  const operators: FilterOperator[] = [
    'eq',
    'lt',
    'gt',
    'lte',
    'gte',
    'neq',
    'null',
    'notnull',
  ];

  const addFilter = () => {
    filters = [
      ...filters,
      { field: fields[0]?.name ?? '', operator: 'eq', value: '' },
    ];
  };

  const removeFilter = (index: number) => {
    filters = filters.filter((_, i) => i !== index);
  };

  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    onApply();
  };
</script>

<form onsubmit={handleSubmit} class="filter-bar">
  <input type="text" placeholder="Search…" bind:value={search} />

  {#each filters as filter, index (index)}
    <span class="filter-row">
      <select bind:value={filter.field}>
        {#each fields as field (field.name)}
          <option value={field.name}>{field.name}</option>
        {/each}
      </select>
      <select bind:value={filter.operator}>
        {#each operators as op (op)}
          <option value={op}>{op}</option>
        {/each}
      </select>
      {#if filter.operator !== 'null' && filter.operator !== 'notnull'}
        <input type="text" bind:value={filter.value} />
      {/if}
      <button type="button" onclick={() => removeFilter(index)}>×</button>
    </span>
  {/each}

  <button type="button" onclick={addFilter}>+ Filter</button>
  <button type="submit">Apply</button>
</form>

<style>
  .filter-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .filter-row {
    display: inline-flex;
    gap: 0.25rem;
  }
</style>
