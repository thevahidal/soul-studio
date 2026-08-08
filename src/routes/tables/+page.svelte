<script lang="ts">
  import { resolve } from '$app/paths';
  import { listTables } from '$lib/api/tables';
  import type { TableListItem } from '$lib/api/types';
  import { isHttpError } from '$lib/api/errors';

  let tables = $state<TableListItem[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  $effect(() => {
    listTables()
      .then((res) => {
        tables = res.data;
      })
      .catch((err) => {
        // Table list/create have no `:name` route param, so Soul's
        // permission check always denies non-superusers here -- see
        // soul/src/middlewares/auth.js. This is a documented backend
        // limitation, not something this page can work around.
        error =
          isHttpError(err) && err.status === 403
            ? 'Only superusers can list tables.'
            : isHttpError(err)
              ? err.message
              : 'Failed to load tables.';
      })
      .finally(() => {
        loading = false;
      });
  });
</script>

<svelte:head>
  <title>Tables — Soul Studio</title>
</svelte:head>

<h1>Tables</h1>

{#if loading}
  <p>Loading…</p>
{:else if error}
  <p>{error}</p>
{:else if tables.length === 0}
  <p>No tables yet.</p>
{:else}
  <ul>
    {#each tables as table (table.name)}
      <li>
        <a href={resolve('/tables/[name]', { name: table.name })}>
          {table.name}
        </a>
      </li>
    {/each}
  </ul>
{/if}
