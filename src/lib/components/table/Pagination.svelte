<script lang="ts">
  let {
    page,
    limit,
    total,
    onPageChange,
  }: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
  } = $props();

  const totalPages = $derived(Math.max(1, Math.ceil(total / limit)));
</script>

<div class="pagination">
  <button disabled={page <= 1} onclick={() => onPageChange(page - 1)}>
    Prev
  </button>
  <span>Page {page} of {totalPages} ({total} rows)</span>
  <button disabled={page >= totalPages} onclick={() => onPageChange(page + 1)}>
    Next
  </button>
</div>

<style>
  .pagination {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0.75rem;
  }
</style>
