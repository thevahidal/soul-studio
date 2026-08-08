<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { session } from '$lib/stores/session.svelte';
  import { toast } from '$lib/stores/toast.svelte';
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
  <p class="app-main">Loading…</p>
{:else}
  {#if session.isAuthenticated}
    <nav class="app-nav">
      <a href={resolve('/tables')}>Tables</a>
      <span style="flex: 1"></span>
      {#if session.username}<span>{session.username}</span>{/if}
      <button onclick={() => session.logout()}>Log out</button>
    </nav>
  {/if}
  <main class="app-main">
    {@render children()}
  </main>
{/if}

<div class="toasts">
  {#each toast.toasts as t (t.id)}
    <div class="toast toast-{t.variant}">{t.message}</div>
  {/each}
</div>
