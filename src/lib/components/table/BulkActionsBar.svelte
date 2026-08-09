<script lang="ts">
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';

  let {
    selectedCount,
    onDelete,
  }: {
    selectedCount: number;
    onDelete: () => void;
  } = $props();
</script>

{#if selectedCount > 0}
  <div
    class="bg-card flex items-center gap-3 rounded-lg border px-3 py-2 shadow-sm"
  >
    <Badge variant="secondary">{selectedCount} selected</Badge>
    <Button variant="destructive" size="sm" class="gap-1.5" onclick={onDelete}>
      <Trash2Icon class="size-3.5" />
      Delete selected
    </Button>
  </div>
{/if}
