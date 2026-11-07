<script lang="ts">
  import type { TypePaquet } from '../lib/types'
  let { type, taille = 18 }: { type: TypePaquet; taille?: number } = $props()
</script>

<svg
  width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
>
  {#if type === 'skill'}
    <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
  {:else if type === 'agent'}
    <rect x="4" y="8" width="16" height="12" rx="3" />
    <circle cx="9" cy="14" r="1.2" />
    <circle cx="15" cy="14" r="1.2" />
    <path d="M12 8V4" />
  {:else}
    <path d="M9 7V3M15 7V3M6 7h12v4a6 6 0 0 1-12 0zM12 17v4" />
  {/if}
</svg>
