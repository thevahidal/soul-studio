<script lang="ts">
  import type { Row } from '$lib/api/types';
  import type { FieldDescriptor } from '$lib/metadata/schemaToForm';
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

<form onsubmit={handleSubmit} class="row-form">
  {#each fields as field (field.name)}
    <label>
      {field.name}{field.required ? ' *' : ''}
      <FieldInput
        {tableName}
        {field}
        bind:value={values[field.name]}
        disabled={mode === 'edit' && field.isPrimaryKey}
      />
    </label>
  {/each}
  <div class="row-form-actions">
    <button type="submit" disabled={submitting}>
      {submitting ? 'Saving…' : 'Save'}
    </button>
    <button type="button" onclick={onCancel} disabled={submitting}>
      Cancel
    </button>
  </div>
</form>

<style>
  .row-form {
    display: grid;
    gap: 0.6rem;
    max-width: 24rem;
  }

  .row-form label {
    display: grid;
    gap: 0.25rem;
  }

  .row-form-actions {
    display: flex;
    gap: 0.5rem;
  }
</style>
