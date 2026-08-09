<script lang="ts">
  import { resolve } from '$app/paths';
  import Table2Icon from '@lucide/svelte/icons/table-2';
  import { tablesStore } from '$lib/stores/tables.svelte';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';

  tablesStore.ensureLoaded();
</script>

<svelte:head>
  <title>Tables — Soul Studio</title>
</svelte:head>

<h1 class="mb-6 text-2xl font-semibold tracking-tight">Tables</h1>

{#if tablesStore.status === 'loading' || tablesStore.status === 'idle'}
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
    {#each Array(8) as _, i (i)}
      <Skeleton class="h-16 w-full rounded-lg" />
    {/each}
  </div>
{:else if tablesStore.status === 'forbidden'}
  <p class="text-muted-foreground text-sm">Only superusers can list tables.</p>
{:else if tablesStore.status === 'error'}
  <p class="text-destructive text-sm">{tablesStore.errorMessage}</p>
{:else if tablesStore.tables.length === 0}
  <p class="text-muted-foreground text-sm">No tables yet.</p>
{:else}
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
    {#each tablesStore.tables as table (table.name)}
      <a
        href={resolve('/tables/[name]', { name: table.name })}
        class="hover:border-primary/50 hover:bg-accent/50 flex items-center gap-2.5 rounded-lg border p-4 text-sm font-medium transition-colors"
      >
        <Table2Icon class="text-muted-foreground size-4 shrink-0" />
        <span class="truncate">{table.name}</span>
      </a>
    {/each}
  </div>
{/if}
