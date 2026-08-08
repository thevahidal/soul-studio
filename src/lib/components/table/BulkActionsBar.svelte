<script lang="ts">
  let {
    selectedCount,
    onDelete,
  }: {
    selectedCount: number;
    onDelete: () => void;
  } = $props();
</script>

{#if selectedCount > 0}
  <div class="bulk-actions">
    <span>{selectedCount} selected</span>
    <button onclick={onDelete}>Delete selected</button>
  </div>
{/if}

<style>
  .bulk-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }
</style>
