<script lang="ts">
  import { surligner } from '../lib/search'
  let { texte, requete }: { texte: string; requete: string } = $props()
  const segments = $derived(surligner(texte, requete))
</script>

{#each segments as s}{#if s.surligne}<mark>{s.texte}</mark>{:else}{s.texte}{/if}{/each}

<style>
  mark { background: var(--marque); color: inherit; border-radius: 3px; padding: 0 2px; }
</style>
