<script lang="ts">
  import type { Row } from '$lib/api/types';
  import type { FieldDescriptor } from '$lib/metadata/schemaToForm';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import FieldInput from './FieldInput.svelte';

  let {
    tableName,
    fields,
    initialValues = {},
    mode,
    submitting = false,
    onSubmit,
    onCancel,
  }: {
    tableName: string;
    fields: FieldDescriptor[];
    initialValues?: Row;
    mode: 'create' | 'edit';
    submitting?: boolean;
    onSubmit: (values: Row) => void;
    onCancel: () => void;
  } = $props();

  // Deliberately only captures the initial value: the caller (TableBrowser)
  // wraps this component in {#key editingRow} so it fully remounts when the
  // edit target changes, rather than this needing to be reactive itself.
  // svelte-ignore state_referenced_locally
  let values = $state<Row>({ ...initialValues });

  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    onSubmit(values);
  };
</script>

<form onsubmit={handleSubmit} class="flex h-full flex-col">
  <div class="flex-1 space-y-4 overflow-y-auto px-4 py-4">
    {#each fields as field (field.name)}
      <div class="grid gap-1.5">
        <Label for={`field-${field.name}`}
          >{field.name}{field.required ? ' *' : ''}</Label
        >
        <FieldInput
          id={`field-${field.name}`}
          {tableName}
          {field}
          bind:value={values[field.name]}
          disabled={mode === 'edit' && field.isPrimaryKey}
        />
      </div>
    {/each}
  </div>
  <div class="flex items-center justify-end gap-2 border-t px-4 py-3">
    <Button
      type="button"
      variant="outline"
      onclick={onCancel}
      disabled={submitting}
    >
      Cancel
    </Button>
    <Button type="submit" disabled={submitting}>
      {submitting ? 'Saving…' : 'Save'}
    </Button>
  </div>
</form>
