<script lang="ts">
  import { URL_SOURCES } from '../lib/config'
  import { hashListe, hashPaquet, ETAT_VIDE } from '../lib/etat'
  import { paquetsProches } from '../lib/filtres'
  import { rendreMarkdown } from '../lib/markdown'
  import type { Contenus } from '../lib/search'
  import type { Catalogue, Paquet } from '../lib/types'
  import TypeIcon from './TypeIcon.svelte'

  let { paquet, catalogue, contenus, contenuCharge }: {
    paquet: Paquet
    catalogue: Catalogue
    contenus: Contenus
    contenuCharge: boolean
  } = $props()

  const libelleType = { skill: 'Skill', agent: 'Agent', connecteur: 'Connecteur' }
  const libelleAssistant = { claude: 'Claude', copilot: 'Copilot', opencode: 'OpenCode' }

  const texte = $derived(contenus[paquet.name])
  const htmlEntree = $derived(texte ? rendreMarkdown(texte.entree, { niveauMin: 3 }) : '')
  const htmlReadme = $derived(texte ? rendreMarkdown(texte.readme, { retirerTitre: true, niveauMin: 3 }) : '')
  const proches = $derived(paquetsProches(paquet, catalogue.packages))
  const commande = (a: string) => `python scripts/install.py ${paquet.name} --cible ${a} --dest <dossier-du-projet>`

  let copie = $state<string | null>(null)
  async function copier(a: string) {
    try {
      await navigator.clipboard.writeText(commande(a))
      copie = a
      setTimeout(() => (copie = null), 1800)
    } catch {
      copie = null
    }
  }
  const date = (d: string | null) => d ?? '—'
</script>

<nav class="fil" aria-label="Fil d'Ariane">
  <a href={hashListe(ETAT_VIDE)}>← Catalogue</a>
</nav>

<article>
  <header>
    <p class="type"><TypeIcon type={paquet.type} taille={16} /> {libelleType[paquet.type]} · v{paquet.version}</p>
    <h1>{paquet.name}</h1>
    <p class="desc">{paquet.description}</p>
    <ul class="tags">
      {#each paquet.tags as t}
        <li><a href={hashListe({ ...ETAT_VIDE, tags: [t] })}>#{t}</a></li>
      {/each}
    </ul>
  </header>

  <div class="colonnes">
    <div class="principal">
      <section>
        <h2>Installer</h2>
        <p class="aide">Depuis un clone du dépôt, une commande par assistant :</p>
        {#each paquet.assistants as a}
          <div class="commande">
            <code>{commande(a)}</code>
            <button type="button" onclick={() => copier(a)} aria-label={`Copier la commande pour ${libelleAssistant[a]}`}>
              {copie === a ? 'Copié ✓' : `Copier · ${libelleAssistant[a]}`}
            </button>
          </div>
        {/each}
      </section>

      {#if !contenuCharge}
        <p class="aide">Chargement du contenu…</p>
      {:else if texte}
        <section>
          <h2>Contenu du paquet</h2>
          <div class="markdown carte">{@html htmlEntree}</div>
        </section>
        <section>
          <h2>À propos</h2>
          <div class="markdown carte">{@html htmlReadme}</div>
        </section>
      {/if}
    </div>

    <aside>
      <h2>Informations</h2>
      <dl>
        <dt>Auteur</dt><dd>{paquet.author}</dd>
        <dt>Créé le</dt><dd>{date(paquet.creeLe)}</dd>
        <dt>Mis à jour le</dt><dd>{date(paquet.modifieLe)}</dd>
        <dt>Compatibilité</dt>
        <dd>
          <ul class="compat">
            {#each paquet.compatibilite as c}
              <li>
                {libelleAssistant[c.assistant]} :
                {#if c.testeLe}<span class="ok">testé le {c.testeLe}</span>{:else}<span class="non">jamais testé</span>{/if}
              </li>
            {/each}
          </ul>
        </dd>
      </dl>
      <p><a href={URL_SOURCES(paquet.path)} rel="noopener">Voir les sources sur GitHub ↗</a></p>

      {#if proches.length}
        <h2>Paquets proches</h2>
        <ul class="proches">
          {#each proches as p}
            <li><a href={hashPaquet(p.name)}>{p.name}</a><span>{p.description}</span></li>
          {/each}
        </ul>
      {/if}
    </aside>
  </div>
</article>

<style>
  .fil { padding: 1.5rem 0 0.5rem; }
  .fil a { text-decoration: none; font-size: 0.95rem; }
  header { padding: 0.5rem 0 1.5rem; }
  .type { display: inline-flex; align-items: center; gap: 0.4rem; color: var(--accent); font-weight: 600; font-size: 0.9rem; margin: 0; }
  h1 { margin: 0.3rem 0; font-size: clamp(1.8rem, 5vw, 2.5rem); letter-spacing: -0.02em; word-break: break-word; }
  .desc { color: var(--texte-doux); font-size: 1.1rem; margin: 0 0 0.8rem; max-width: 46rem; }
  .tags { list-style: none; display: flex; flex-wrap: wrap; gap: 0.4rem; padding: 0; margin: 0; }
  .tags a { text-decoration: none; background: var(--accent-doux); padding: 0.15rem 0.7rem; border-radius: 99px; font-size: 0.85rem; }
  .colonnes { display: grid; gap: 2rem; grid-template-columns: minmax(0, 1fr); padding-bottom: 4rem; }
  @media (min-width: 900px) { .colonnes { grid-template-columns: minmax(0, 1fr) 20rem; } }
  h2 { font-size: 1.15rem; margin: 1.5rem 0 0.7rem; }
  .principal > section:first-child h2, aside h2:first-child { margin-top: 0; }
  .aide { color: var(--texte-doux); margin: 0 0 0.6rem; font-size: 0.95rem; }
  .commande { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
  .commande code { flex: 1 1 18rem; background: var(--code-bg); padding: 0.6rem 0.8rem; border-radius: 10px; font-size: 0.85rem; overflow-x: auto; white-space: nowrap; }
  .commande button {
    font: inherit; font-size: 0.85rem; padding: 0.45rem 0.9rem; border-radius: 99px; cursor: pointer;
    border: 1px solid var(--accent); background: var(--accent); color: var(--sur-accent);
  }
  .carte { background: var(--surface); border: 1px solid var(--bordure); border-radius: var(--rayon); padding: 1rem 1.3rem; box-shadow: var(--ombre); }
  aside { align-self: start; background: var(--surface); border: 1px solid var(--bordure); border-radius: var(--rayon); padding: 1.2rem 1.3rem; box-shadow: var(--ombre); }
  dl { display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1rem; margin: 0 0 1rem; font-size: 0.92rem; }
  dt { color: var(--texte-doux); }
  dd { margin: 0; }
  .compat { list-style: none; padding: 0; margin: 0; }
  .ok { color: var(--accent); }
  .non { color: var(--texte-doux); }
  .proches { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.7rem; }
  .proches li { display: grid; }
  .proches span { color: var(--texte-doux); font-size: 0.85rem; }
</style>
