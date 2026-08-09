<script lang="ts">
  import { session } from '$lib/stores/session.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { isHttpError } from '$lib/api/errors';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Button } from '$lib/components/ui/button/index.js';

  let username = $state('');
  let password = $state('');
  let submitting = $state(false);

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    submitting = true;
    try {
      await session.login(username, password);
    } catch (err) {
      toast.push(isHttpError(err) ? err.message : 'Login failed', 'error');
    } finally {
      submitting = false;
    }
  };
</script>

<svelte:head>
  <title>Log in — Soul Studio</title>
</svelte:head>

<Card.Root class="w-full max-w-sm">
  <Card.Header>
    <div
      class="bg-primary text-primary-foreground mb-2 flex size-9 items-center justify-center rounded-md text-base font-bold"
    >
      S
    </div>
    <Card.Title class="text-xl">Soul Studio</Card.Title>
    <Card.Description>Sign in to browse and manage your data.</Card.Description>
  </Card.Header>
  <Card.Content>
    <form onsubmit={handleSubmit} class="grid gap-4">
      <div class="grid gap-1.5">
        <Label for="username">Username</Label>
        <Input
          id="username"
          type="text"
          bind:value={username}
          autocomplete="username"
          required
        />
      </div>
      <div class="grid gap-1.5">
        <Label for="password">Password</Label>
        <Input
          id="password"
          type="password"
          bind:value={password}
          autocomplete="current-password"
          required
        />
      </div>
      <Button type="submit" disabled={submitting} class="mt-1 w-full">
        {submitting ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  </Card.Content>
</Card.Root>
