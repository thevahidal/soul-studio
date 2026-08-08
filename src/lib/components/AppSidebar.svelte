<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import Table2Icon from '@lucide/svelte/icons/table-2';
  import SearchIcon from '@lucide/svelte/icons/search';
  import LogOutIcon from '@lucide/svelte/icons/log-out';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { tablesStore } from '$lib/stores/tables.svelte';
  import { session } from '$lib/stores/session.svelte';

  let search = $state('');

  tablesStore.ensureLoaded();

  const activeTable = $derived(page.params.name);
  const filteredTables = $derived(
    tablesStore.tables.filter((t) =>
      t.name.toLowerCase().includes(search.toLowerCase()),
    ),
  );
</script>

<Sidebar.Root>
  <Sidebar.Header class="gap-3 px-3 pt-3">
    <a
      href={resolve('/tables')}
      class="flex items-center gap-2 px-1 text-sm font-semibold tracking-tight"
    >
      <span
        class="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md text-xs font-bold"
      >
        S
      </span>
      Soul Studio
    </a>
    {#if tablesStore.status === 'loaded'}
      <div class="relative px-1">
        <SearchIcon
          class="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2"
        />
        <Input
          bind:value={search}
          placeholder="Find a table…"
          class="h-8 pl-8"
        />
      </div>
    {/if}
  </Sidebar.Header>

  <Sidebar.Content>
    <Sidebar.Group>
      <Sidebar.GroupLabel>Tables</Sidebar.GroupLabel>
      <Sidebar.GroupContent>
        {#if tablesStore.status === 'loading' || tablesStore.status === 'idle'}
          <div class="flex flex-col gap-2 px-2 py-1">
            {#each Array(5) as _, i (i)}
              <Skeleton class="h-7 w-full" />
            {/each}
          </div>
        {:else if tablesStore.status === 'forbidden'}
          <p class="text-muted-foreground px-2 py-1 text-xs">
            Only superusers can list tables.
          </p>
        {:else if tablesStore.status === 'error'}
          <p class="text-destructive px-2 py-1 text-xs">
            {tablesStore.errorMessage}
          </p>
        {:else if filteredTables.length === 0}
          <p class="text-muted-foreground px-2 py-1 text-xs">
            {tablesStore.tables.length === 0 ? 'No tables yet.' : 'No matches.'}
          </p>
        {:else}
          <Sidebar.Menu>
            {#each filteredTables as table (table.name)}
              <Sidebar.MenuItem>
                <Sidebar.MenuButton isActive={table.name === activeTable}>
                  {#snippet child({ props })}
                    <a
                      href={resolve('/tables/[name]', { name: table.name })}
                      {...props}
                    >
                      <Table2Icon />
                      <span>{table.name}</span>
                    </a>
                  {/snippet}
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
            {/each}
          </Sidebar.Menu>
        {/if}
      </Sidebar.GroupContent>
    </Sidebar.Group>
  </Sidebar.Content>

  <Sidebar.Footer class="gap-2 px-3 pb-3">
    {#if session.username}
      <div class="flex items-center justify-between gap-2 px-1">
        <span class="truncate text-sm font-medium">{session.username}</span>
        <Button
          variant="ghost"
          size="sm"
          class="text-muted-foreground h-7 gap-1.5 px-2"
          onclick={() => session.logout()}
        >
          <LogOutIcon class="size-3.5" />
          Log out
        </Button>
      </div>
    {/if}
  </Sidebar.Footer>
</Sidebar.Root>
