<script lang="ts">
  import { chargerCatalogue, chargerContenus } from './lib/catalogue'
  import { creerMoteur, type Contenus } from './lib/search'
  import type { Catalogue } from './lib/types'
  import PaquetCard from './components/PaquetCard.svelte'

  let catalogue = $state<Catalogue | null>(null)
  let contenus = $state<Contenus>({})
  let erreur = $state<string | null>(null)
  let requete = $state('')
  let champ: HTMLInputElement | undefined = $state()

  chargerCatalogue().then((c) => (catalogue = c)).catch((e) => (erreur = e.message))
  // Le texte complet est chargé ensuite : la recherche par nom marche sans attendre.
  chargerContenus().then((c) => (contenus = c)).catch(() => {})

  const moteur = $derived(catalogue ? creerMoteur(catalogue.packages, contenus) : null)
  const resultats = $derived.by(() => {
    if (!catalogue || !moteur) return []
    const parNom = new Map(catalogue.packages.map((p) => [p.name, p]))
    return moteur.chercher(requete).flatMap((r) => parNom.get(r.name) ?? [])
  })
  const tagsPopulaires = $derived.by(() => {
    const n = new Map<string, number>()
    for (const p of catalogue?.packages ?? []) for (const t of p.tags) n.set(t, (n.get(t) ?? 0) + 1)
    return [...n].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 6).map(([t]) => t)
  })

  function toucheGlobale(e: KeyboardEvent) {
    const saisie = (e.target as HTMLElement)?.matches?.('input, textarea')
    if (e.key === '/' && !saisie && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      champ?.focus()
    }
  }

  function cartes(): HTMLElement[] {
    return [...document.querySelectorAll<HTMLElement>('[data-carte]')]
  }
  function toucheChamp(e: KeyboardEvent) {
    if (e.key === 'Escape') requete = ''
    if (e.key === 'ArrowDown') { e.preventDefault(); cartes()[0]?.focus() }
  }
  function toucheCarte(e: KeyboardEvent) {
    const liste = cartes()
    const i = liste.indexOf(e.target as HTMLElement)
    if (i < 0) return
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); liste[Math.min(i + 1, liste.length - 1)].focus() }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); if (i === 0) champ?.focus(); else liste[i - 1].focus() }
    if (e.key === 'Escape') champ?.focus()
  }
</script>

<svelte:window onkeydown={toucheGlobale} />

<header class="entete">
  <h1>AISearch</h1>
  <p>Catalogue de skills, agents et connecteurs IA : construits une fois, réutilisables partout.</p>
  <div class="recherche">
    <label class="sr-only" for="q">Rechercher un paquet</label>
    <input
      id="q"
      type="search"
      bind:this={champ}
      bind:value={requete}
      onkeydown={toucheChamp}
      placeholder="Rechercher un paquet…  (touche /)"
      autocomplete="off"
    />
  </div>
</header>

<main>
  {#if erreur}
    <p class="etat" role="alert">Erreur de chargement : {erreur}</p>
  {:else if !catalogue}
    <p class="etat">Chargement du catalogue…</p>
  {:else}
    <p class="compteur" aria-live="polite">
      {#if requete.trim()}
        {resultats.length} résultat{resultats.length > 1 ? 's' : ''} sur {catalogue.packages.length}
      {:else}
        {catalogue.packages.length} paquet{catalogue.packages.length > 1 ? 's' : ''}
      {/if}
    </p>

    {#if resultats.length === 0}
      <div class="etat">
        <p><strong>Aucun résultat pour « {requete} ».</strong></p>
        <p>Vérifiez l'orthographe ou essayez un mot plus court. Quelques idées :</p>
        <ul class="suggestions">
          {#each tagsPopulaires as t}
            <li><button type="button" onclick={() => (requete = t)}>{t}</button></li>
          {/each}
        </ul>
      </div>
    {:else}
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <ul class="grille" onkeydown={toucheCarte}>
        {#each resultats as p (p.name)}
          <li><PaquetCard paquet={p} {requete} ontag={(t) => { requete = t; champ?.focus() }} /></li>
        {/each}
      </ul>
    {/if}
  {/if}
</main>

<style>
  .entete { max-width: 1100px; margin: 0 auto; padding: 3rem 1rem 1.5rem; }
  h1 { margin: 0; font-size: clamp(2rem, 5vw, 2.8rem); letter-spacing: -0.02em; }
  .entete p { color: var(--texte-doux); margin: 0.4rem 0 1.5rem; max-width: 40rem; }
  .recherche input {
    width: 100%; font: inherit; font-size: 1.1rem; padding: 0.9rem 1.2rem;
    border-radius: 99px; border: 1px solid var(--bordure);
    background: var(--surface); color: var(--texte); box-shadow: var(--ombre);
  }
  .recherche input:focus { border-color: var(--accent); }
  main { max-width: 1100px; margin: 0 auto; padding: 0 1rem 4rem; }
  .compteur { color: var(--texte-doux); font-size: 0.9rem; margin: 0 0 1rem; }
  .grille {
    list-style: none; margin: 0; padding: 0; display: grid; gap: 1rem;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
  }
  .grille > li { display: flex; }
  .grille > li > :global(*) { flex: 1; }
  .etat { text-align: center; color: var(--texte-doux); padding: 2rem 0; }
  .suggestions { list-style: none; display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; padding: 0; }
  .suggestions button {
    font: inherit; cursor: pointer; padding: 0.3rem 0.9rem; border-radius: 99px;
    border: 1px solid var(--bordure); background: var(--surface); color: var(--accent);
  }
  .suggestions button:hover { border-color: var(--accent); }
</style>
