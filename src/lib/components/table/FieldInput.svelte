<script lang="ts">
  import { listRows } from '$lib/api/rows';
  import type { Row } from '$lib/api/types';
  import { registry } from '$lib/extensions/registry';
  import {
    fromDatetimeLocalInputValue,
    toDateInputValue,
    toDatetimeLocalInputValue,
  } from '$lib/metadata/dateInputFormat';
  import { displayLabel } from '$lib/metadata/displayValue';
  import { resolveFieldRenderer } from '$lib/metadata/fieldWidgets';
  import type { FieldDescriptor } from '$lib/metadata/schemaToForm';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Checkbox } from '$lib/components/ui/checkbox/index.js';
  import * as Select from '$lib/components/ui/select/index.js';

  let {
    tableName,
    field,
    value = $bindable(),
    disabled = false,
    id,
  }: {
    tableName: string;
    field: FieldDescriptor;
    value: unknown;
    disabled?: boolean;
    id?: string;
  } = $props();

  const renderer = $derived(resolveFieldRenderer(tableName, field, registry));

  let relationOptions = $state<Row[]>([]);
  const relationValueKey = $derived(field.foreignKey?.column ?? 'id');
  const NONE = '__none__';

  const relationSelectValue = $derived(
    value === null || value === undefined ? NONE : String(value),
  );

  const setRelationValue = (next: string | undefined) => {
    if (!next || next === NONE) {
      value = null;
      return;
    }
    const match = relationOptions.find(
      (option) => String(option[relationValueKey]) === next,
    );
    value = match ? match[relationValueKey] : next;
  };

  const relationTriggerLabel = $derived.by(() => {
    if (relationSelectValue === NONE) return '—';
    const match = relationOptions.find(
      (option) => String(option[relationValueKey]) === relationSelectValue,
    );
    return match ? displayLabel(match, [relationValueKey]) : String(value);
  });

  $effect(() => {
    const fk = field.foreignKey;
    if (renderer.source !== 'builtin' || renderer.kind !== 'relation' || !fk) {
      return;
    }
    let cancelled = false;
    listRows(fk.table, { limit: 50 })
      .then((res) => {
        if (!cancelled) relationOptions = res.data;
      })
      .catch(() => {
        if (!cancelled) relationOptions = [];
      });
    return () => {
      cancelled = true;
    };
  });
</script>

{#if renderer.source === 'plugin'}
  <renderer.component {value} {disabled} onchange={(next) => (value = next)} />
{:else if renderer.kind === 'text'}
  <Input {id} type="text" bind:value={value as string} {disabled} />
{:else if renderer.kind === 'number'}
  <Input {id} type="number" bind:value={value as number} {disabled} />
{:else if renderer.kind === 'checkbox'}
  <Checkbox
    {id}
    checked={value === true}
    onCheckedChange={(next) => (value = next)}
    {disabled}
  />
{:else if renderer.kind === 'date'}
  <Input
    {id}
    type="date"
    value={toDateInputValue(value)}
    oninput={(e) => (value = e.currentTarget.value)}
    {disabled}
  />
{:else if renderer.kind === 'datetime'}
  <Input
    {id}
    type="datetime-local"
    value={toDatetimeLocalInputValue(value)}
    oninput={(e) =>
      (value = fromDatetimeLocalInputValue(e.currentTarget.value))}
    {disabled}
  />
{:else if renderer.kind === 'blob-readonly'}
  <span class="text-muted-foreground text-sm italic">(binary data)</span>
{:else if renderer.kind === 'relation'}
  <Select.Root
    type="single"
    value={relationSelectValue}
    onValueChange={setRelationValue}
    {disabled}
  >
    <Select.Trigger {id} class="w-full">
      {relationTriggerLabel}
    </Select.Trigger>
    <Select.Content>
      <Select.Item value={NONE} label="—" />
      {#each relationOptions as option (option[relationValueKey])}
        <Select.Item
          value={String(option[relationValueKey])}
          label={displayLabel(option, [relationValueKey])}
        />
      {/each}
    </Select.Content>
  </Select.Root>
{/if}
