<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import TableBrowser from '$lib/components/table/TableBrowser.svelte';

  // `$app/state`'s `page.params` is typed loosely; this route's file path
  // (`[name]/+page.svelte`) guarantees the segment is always present here.
  const tableName = $derived(page.params.name!);
</script>

<svelte:head>
  <title>{tableName} — Soul Studio</title>
</svelte:head>

<p><a href={resolve('/tables')}>&larr; Tables</a></p>
<h1>{tableName}</h1>

<TableBrowser {tableName} />
