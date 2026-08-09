<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import TableCreateForm from '$lib/components/tables/TableCreateForm.svelte';
  import { tablesStore } from '$lib/stores/tables.svelte';
  import { toast } from '$lib/stores/toast.svelte';

  const handleCreated = async (name: string) => {
    toast.push('Table created', 'success');
    await tablesStore.reload();
    goto(resolve('/tables/[name]', { name }));
  };

  const handleCancel = () => {
    goto(resolve('/tables'));
  };
</script>

<svelte:head>
  <title>New table — Soul Studio</title>
</svelte:head>

<h1 class="mb-6 text-2xl font-semibold tracking-tight">New table</h1>

<TableCreateForm onCreated={handleCreated} onCancel={handleCancel} />
