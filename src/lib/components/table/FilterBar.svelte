<script lang="ts">
  import type { FilterOperator, RowFilter } from '$lib/api/types';
  import type { FieldDescriptor } from '$lib/metadata/schemaToForm';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import SearchIcon from '@lucide/svelte/icons/search';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import XIcon from '@lucide/svelte/icons/x';

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
    onApply();
  };

  const removeFilter = (index: number) => {
    filters = filters.filter((_, i) => i !== index);
    onApply();
  };

  const handleSearchSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    onApply();
  };
</script>

<div class="flex flex-wrap items-center gap-2">
  <form onsubmit={handleSearchSubmit} class="relative">
    <SearchIcon
      class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
    />
    <Input
      type="text"
      placeholder="Search…"
      bind:value={search}
      class="h-8 w-56 pl-8"
    />
  </form>

  {#each filters as filter, index (index)}
    <Badge variant="secondary" class="gap-1.5 py-1.5 pl-2.5 pr-1.5 font-normal">
      <Select.Root
        type="single"
        value={filter.field}
        onValueChange={(v) => {
          filter.field = v ?? filter.field;
          onApply();
        }}
      >
        <Select.Trigger class="h-6 border-none bg-transparent px-1 shadow-none">
          {filter.field}
        </Select.Trigger>
        <Select.Content>
          {#each fields as field (field.name)}
            <Select.Item value={field.name} label={field.name} />
          {/each}
        </Select.Content>
      </Select.Root>

      <Select.Root
        type="single"
        value={filter.operator}
        onValueChange={(v) => {
          filter.operator = (v as FilterOperator) ?? filter.operator;
          onApply();
        }}
      >
        <Select.Trigger class="h-6 border-none bg-transparent px-1 shadow-none">
          {filter.operator}
        </Select.Trigger>
        <Select.Content>
          {#each operators as op (op)}
            <Select.Item value={op} label={op} />
          {/each}
        </Select.Content>
      </Select.Root>

      {#if filter.operator !== 'null' && filter.operator !== 'notnull'}
        <input
          type="text"
          bind:value={filter.value}
          onchange={onApply}
          class="placeholder:text-muted-foreground h-6 w-20 border-none bg-transparent px-1 text-xs outline-none"
          placeholder="value"
        />
      {/if}

      <button
        type="button"
        onclick={() => removeFilter(index)}
        aria-label="Remove filter"
        class="hover:bg-muted-foreground/20 -mr-1 flex size-4 items-center justify-center rounded-full"
      >
        <XIcon class="size-3" />
      </button>
    </Badge>
  {/each}

  <Button variant="ghost" size="sm" class="h-8 gap-1.5" onclick={addFilter}>
    <PlusIcon class="size-3.5" />
    Filter
  </Button>
</div>
