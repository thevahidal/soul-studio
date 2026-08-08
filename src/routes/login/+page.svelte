<script lang="ts">
  import { session } from '$lib/stores/session.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { isHttpError } from '$lib/api/errors';

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

<form
  onsubmit={handleSubmit}
  style="max-width: 20rem; display: grid; gap: 0.75rem;"
>
  <h1>Soul Studio</h1>
  <label style="display: grid; gap: 0.25rem;">
    Username
    <input type="text" bind:value={username} autocomplete="username" required />
  </label>
  <label style="display: grid; gap: 0.25rem;">
    Password
    <input
      type="password"
      bind:value={password}
      autocomplete="current-password"
      required
    />
  </label>
  <button type="submit" disabled={submitting}>
    {submitting ? 'Signing in…' : 'Sign in'}
  </button>
</form>
