<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { session } from '$lib/stores/session.svelte';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { Toaster } from '$lib/components/ui/sonner/index.js';
  import AppSidebar from '$lib/components/AppSidebar.svelte';
  import '../app.css';

  let { children } = $props();

  onMount(() => {
    session.bootstrap();
  });

  $effect(() => {
    if (session.status === 'unknown') return;

    const isLoginRoute = page.url.pathname === resolve('/login');

    if (session.status === 'anonymous' && !isLoginRoute) {
      goto(resolve('/login'));
    } else if (session.status === 'authenticated' && isLoginRoute) {
      goto(resolve('/tables'));
    }
  });
</script>

{#if session.status === 'unknown'}
  <div class="flex min-h-svh items-center justify-center">
    <p class="text-muted-foreground text-sm">Loading…</p>
  </div>
{:else if session.isAuthenticated}
  <Sidebar.Provider>
    <AppSidebar />
    <Sidebar.Inset>
      <header class="flex h-12 shrink-0 items-center gap-2 border-b px-3">
        <Sidebar.Trigger />
      </header>
      <div class="flex-1 overflow-auto p-6">
        {@render children()}
      </div>
    </Sidebar.Inset>
  </Sidebar.Provider>
{:else}
  <div class="flex min-h-svh items-center justify-center p-6">
    {@render children()}
  </div>
{/if}

<Toaster richColors closeButton />
