<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

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

<div class="flex items-center justify-between gap-3 pt-1">
  <p class="text-muted-foreground text-sm">
    Page {page} of {totalPages} ({total} row{total === 1 ? '' : 's'})
  </p>
  <div class="flex items-center gap-1.5">
    <Button
      variant="outline"
      size="icon-sm"
      disabled={page <= 1}
      onclick={() => onPageChange(page - 1)}
      aria-label="Previous page"
    >
      <ChevronLeftIcon class="size-4" />
    </Button>
    <Button
      variant="outline"
      size="icon-sm"
      disabled={page >= totalPages}
      onclick={() => onPageChange(page + 1)}
      aria-label="Next page"
    >
      <ChevronRightIcon class="size-4" />
    </Button>
  </div>
</div>
