<script lang="ts">
  import { basculer, ETAT_VIDE, filtresActifs, type Etat, type Tri } from '../lib/etat'
  import { appliquerFiltres, facettes, trier } from '../lib/filtres'
  import { creerMoteur, type Contenus } from '../lib/search'
  import type { Assistant, Catalogue, TypePaquet } from '../lib/types'
  import PaquetCard from './PaquetCard.svelte'
  import TypeIcon from './TypeIcon.svelte'

  let { catalogue, contenus, etat, onetat }: {
    catalogue: Catalogue
    contenus: Contenus
    etat: Etat
    onetat: (e: Etat) => void
  } = $props()

  let champ: HTMLInputElement | undefined = $state()
  let tousLesTags = $state(false)

  const libelleType: Record<TypePaquet, string> = { skill: 'Skills', agent: 'Agents', connecteur: 'Connecteurs' }
  const libelleAssistant: Record<Assistant, string> = { claude: 'Claude', copilot: 'Copilot', opencode: 'OpenCode' }
  const TAGS_VISIBLES = 12

  const moteur = $derived(creerMoteur(catalogue.packages, contenus))
  const parNom = $derived(new Map(catalogue.packages.map((p) => [p.name, p])))
  // Recherche texte seule : sert aussi aux effectifs des filtres.
  const trouves = $derived(moteur.chercher(etat.q).flatMap((r) => parNom.get(r.name) ?? []))
  const resultats = $derived(trier(appliquerFiltres(trouves, etat), etat.tri))
  const fac = $derived(facettes(trouves))

  const tagsAffiches = $derived.by(() => {
    const tous = [...fac.tags].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'fr')).map(([t]) => t)
    // Les tags choisis restent visibles même s'ils n'ont plus de résultat.
    const base = tousLesTags ? tous : tous.slice(0, TAGS_VISIBLES)
    return [...new Set([...etat.tags, ...base])]
  })
  const nbTagsCaches = $derived(fac.tags.size - TAGS_VISIBLES)

  const stats = $derived.by(() => {
    const n = new Map<TypePaquet, number>()
    for (const p of catalogue.packages) n.set(p.type, (n.get(p.type) ?? 0) + 1)
    return (['skill', 'agent', 'connecteur'] as TypePaquet[]).filter((t) => n.has(t)).map((t) => ({ t, n: n.get(t)! }))
  })

  const maj = (p: Partial<Etat>) => onetat({ ...etat, ...p })

  function toucheGlobale(e: KeyboardEvent) {
    const saisie = (e.target as HTMLElement)?.matches?.('input, textarea, select')
    if (e.key === '/' && !saisie && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      champ?.focus()
    }
  }
  const liens = () => [...document.querySelectorAll<HTMLElement>('[data-carte-lien]')]
  function toucheChamp(e: KeyboardEvent) {
    if (e.key === 'Escape') maj({ q: '' })
    if (e.key === 'ArrowDown') { e.preventDefault(); liens()[0]?.focus() }
  }
  function toucheGrille(e: KeyboardEvent) {
    const l = liens()
    const i = l.indexOf(e.target as HTMLElement)
    if (i < 0) return
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); l[Math.min(i + 1, l.length - 1)].focus() }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); if (i === 0) champ?.focus(); else l[i - 1].focus() }
    if (e.key === 'Escape') champ?.focus()
  }
</script>

<svelte:window onkeydown={toucheGlobale} />

<section class="hero">
  <h1>Des agents et skills <span>qui survivent aux outils</span></h1>
  <p>
    Un paquet est construit une fois, relu, puis installé dans l'assistant de votre choix :
    Claude, GitHub Copilot, OpenCode…
  </p>
  <ul class="stats" aria-label="Contenu du catalogue">
    <li><strong>{catalogue.packages.length}</strong> paquet{catalogue.packages.length > 1 ? 's' : ''}</li>
    {#each stats as s}
      <li><TypeIcon type={s.t} taille={15} /> <strong>{s.n}</strong> {libelleType[s.t].toLowerCase()}</li>
    {/each}
  </ul>
  <div class="recherche">
    <label class="sr-only" for="q">Rechercher un paquet</label>
    <input
      id="q"
      type="search"
      bind:this={champ}
      value={etat.q}
      oninput={(e) => maj({ q: e.currentTarget.value })}
      onkeydown={toucheChamp}
      placeholder="Rechercher un paquet…  (touche /)"
      autocomplete="off"
    />
  </div>
</section>

<section class="filtres" aria-label="Filtres">
  <div class="groupe">
    <span class="titre">Type</span>
    {#each fac.types as [t, n]}
      <button type="button" class="puce" aria-pressed={etat.types.includes(t)} onclick={() => maj({ types: basculer(etat.types, t) })}>
        <TypeIcon type={t} taille={14} /> {libelleType[t]} <small>{n}</small>
      </button>
    {/each}
  </div>
  <div class="groupe">
    <span class="titre">Assistant</span>
    {#each fac.assistants as [a, n]}
      <button type="button" class="puce" aria-pressed={etat.assistants.includes(a)} onclick={() => maj({ assistants: basculer(etat.assistants, a) })}>
        {libelleAssistant[a]} <small>{n}</small>
      </button>
    {/each}
  </div>
  <div class="groupe">
    <span class="titre">Tags</span>
    {#each tagsAffiches as t}
      <button type="button" class="puce" aria-pressed={etat.tags.includes(t)} onclick={() => maj({ tags: basculer(etat.tags, t) })}>
        #{t} <small>{fac.tags.get(t) ?? 0}</small>
      </button>
    {/each}
    {#if nbTagsCaches > 0}
      <button type="button" class="lien" onclick={() => (tousLesTags = !tousLesTags)}>
        {tousLesTags ? 'Voir moins' : `Voir tous (+${nbTagsCaches})`}
      </button>
    {/if}
  </div>
</section>

<div class="barre">
  <p class="compteur" aria-live="polite">
    {#if etat.q.trim() || filtresActifs(etat)}
      {resultats.length} résultat{resultats.length > 1 ? 's' : ''} sur {catalogue.packages.length}
    {:else}
      {catalogue.packages.length} paquet{catalogue.packages.length > 1 ? 's' : ''}
    {/if}
  </p>
  {#if filtresActifs(etat)}
    <button type="button" class="lien" onclick={() => maj({ types: [], assistants: [], tags: [] })}>
      Réinitialiser les filtres
    </button>
  {/if}
  <label class="tri">
    Trier par
    <select value={etat.tri} onchange={(e) => maj({ tri: e.currentTarget.value as Tri })}>
      <option value="pertinence">Pertinence</option>
      <option value="nom">Nom</option>
      <option value="date">Dernière mise à jour</option>
    </select>
  </label>
</div>

{#if resultats.length === 0}
  <div class="vide">
    <p><strong>Aucun résultat{etat.q.trim() ? ` pour « ${etat.q} »` : ''}.</strong></p>
    <p>Vérifiez l'orthographe, essayez un mot plus court ou retirez un filtre.</p>
    <button type="button" class="puce" onclick={() => onetat(ETAT_VIDE)}>Tout réinitialiser</button>
  </div>
{:else}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <ul class="grille" onkeydown={toucheGrille}>
    {#each resultats as p (p.name)}
      <li>
        <PaquetCard
          paquet={p}
          requete={etat.q}
          tagsActifs={etat.tags}
          ontag={(t) => maj({ tags: basculer(etat.tags, t) })}
        />
      </li>
    {/each}
  </ul>
{/if}

<style>
  .hero { padding: 2.5rem 0 1.2rem; }
  h1 { margin: 0; font-size: clamp(1.9rem, 5vw, 2.9rem); line-height: 1.1; letter-spacing: -0.025em; max-width: 18ch; }
  h1 span { color: var(--accent); }
  .hero p { color: var(--texte-doux); margin: 0.8rem 0 1rem; max-width: 40rem; font-size: 1.05rem; }
  .stats { list-style: none; display: flex; flex-wrap: wrap; gap: 0.5rem 1.2rem; padding: 0; margin: 0 0 1.4rem; color: var(--texte-doux); font-size: 0.9rem; }
  .stats li { display: inline-flex; align-items: center; gap: 0.35rem; }
  .stats strong { color: var(--texte); }
  .recherche input {
    width: 100%; font: inherit; font-size: 1.1rem; padding: 0.95rem 1.3rem;
    border-radius: 99px; border: 1px solid var(--bordure);
    background: var(--surface); color: var(--texte); box-shadow: var(--ombre);
  }
  .recherche input:focus { border-color: var(--accent); }

  .filtres { display: grid; gap: 0.6rem; margin: 1.2rem 0 0.4rem; }
  .groupe { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem; }
  .titre { font-size: 0.8rem; font-weight: 600; color: var(--texte-doux); min-width: 5.5rem; text-transform: uppercase; letter-spacing: 0.04em; }
  .puce {
    display: inline-flex; align-items: center; gap: 0.35rem; font: inherit; font-size: 0.85rem;
    padding: 0.3rem 0.8rem; border-radius: 99px; cursor: pointer;
    border: 1px solid var(--bordure); background: var(--surface); color: var(--texte);
    transition: background 0.12s ease, border-color 0.12s ease;
  }
  .puce small { color: var(--texte-doux); }
  .puce:hover { border-color: var(--accent); }
  .puce[aria-pressed='true'] { background: var(--accent); border-color: var(--accent); color: var(--sur-accent); }
  .puce[aria-pressed='true'] small { color: inherit; opacity: 0.8; }
  .lien { font: inherit; font-size: 0.85rem; background: none; border: 0; color: var(--accent); cursor: pointer; text-decoration: underline; padding: 0.2rem 0.3rem; }

  .barre { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 1.2rem; margin: 1rem 0; }
  .compteur { color: var(--texte-doux); font-size: 0.9rem; margin: 0; margin-right: auto; }
  .tri { font-size: 0.85rem; color: var(--texte-doux); display: inline-flex; align-items: center; gap: 0.5rem; }
  .tri select { font: inherit; padding: 0.3rem 0.5rem; border-radius: 8px; border: 1px solid var(--bordure); background: var(--surface); color: var(--texte); }

  .grille {
    list-style: none; margin: 0; padding: 0; display: grid; gap: 1rem;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
  }
  .grille > li { display: flex; animation: apparition 0.3s ease both; }
  .grille > li > :global(*) { flex: 1; }
  @keyframes apparition { from { opacity: 0; transform: translateY(6px); } }
  .vide { text-align: center; color: var(--texte-doux); padding: 2.5rem 0; }
</style>
