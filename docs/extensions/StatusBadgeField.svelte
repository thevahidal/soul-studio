<script lang="ts">
  // Every field-renderer component gets this exact prop shape -- see
  // FieldRendererProps in src/lib/extensions/types.ts.
  let {
    value,
    onchange,
    disabled = false,
  }: {
    value: unknown;
    onchange: (value: unknown) => void;
    disabled?: boolean;
  } = $props();

  const STATUSES = ['open', 'in_progress', 'resolved'] as const;
</script>

<select
  value={value ?? 'open'}
  {disabled}
  onchange={(e) => onchange(e.currentTarget.value)}
>
  {#each STATUSES as status (status)}
    <option value={status}>{status}</option>
  {/each}
</select>
