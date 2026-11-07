<script lang="ts">
  import { chargerCatalogue } from './lib/catalogue'
  const promesse = chargerCatalogue()
</script>

<main>
  <h1>AISearch</h1>
  {#await promesse}
    <p>Chargement du catalogue…</p>
  {:then cat}
    <p>{cat.packages.length} paquet(s) dans le catalogue.</p>
    <ul>
      {#each cat.packages as p}
        <li><strong>{p.name}</strong> ({p.type}) : {p.description}</li>
      {/each}
    </ul>
  {:catch e}
    <p>Erreur : {e.message}</p>
  {/await}
</main>
