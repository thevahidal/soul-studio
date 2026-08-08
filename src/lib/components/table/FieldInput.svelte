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

  let {
    tableName,
    field,
    value = $bindable(),
    disabled = false,
  }: {
    tableName: string;
    field: FieldDescriptor;
    value: unknown;
    disabled?: boolean;
  } = $props();

  const renderer = $derived(resolveFieldRenderer(tableName, field, registry));

  let relationOptions = $state<Row[]>([]);
  const relationValueKey = $derived(field.foreignKey?.column ?? 'id');

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
  <input type="text" bind:value {disabled} />
{:else if renderer.kind === 'number'}
  <input type="number" bind:value {disabled} />
{:else if renderer.kind === 'checkbox'}
  <input type="checkbox" bind:checked={value as boolean} {disabled} />
{:else if renderer.kind === 'date'}
  <input
    type="date"
    value={toDateInputValue(value)}
    oninput={(e) => (value = e.currentTarget.value)}
    {disabled}
  />
{:else if renderer.kind === 'datetime'}
  <input
    type="datetime-local"
    value={toDatetimeLocalInputValue(value)}
    oninput={(e) =>
      (value = fromDatetimeLocalInputValue(e.currentTarget.value))}
    {disabled}
  />
{:else if renderer.kind === 'blob-readonly'}
  <span class="text-muted">(binary data)</span>
{:else if renderer.kind === 'relation'}
  <select bind:value {disabled}>
    <option value={null}>—</option>
    {#each relationOptions as option (option[relationValueKey])}
      <option value={option[relationValueKey]}>
        {displayLabel(option, [relationValueKey])}
      </option>
    {/each}
  </select>
{/if}
