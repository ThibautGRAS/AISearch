<script lang="ts">
  import { DEPOT } from '../lib/config'
  import { ETAT_VIDE, hashListe } from '../lib/etat'
  import { rendreMarkdown } from '../lib/markdown'

  let { texte, charge }: { texte: string; charge: boolean } = $props()
  const html = $derived(rendreMarkdown(texte, { retirerTitre: true, niveauMin: 2 }))
</script>

<nav class="fil"><a href={hashListe(ETAT_VIDE)}>← Catalogue</a></nav>

<h1>Contribuer</h1>
<p class="intro">
  Ajouter un paquet suit toujours le même chemin : un dossier dans <code>packages/</code>, un manifeste,
  une relecture. Les sources et le guide complet sont dans
  <a href={DEPOT} rel="noopener">le dépôt GitHub ↗</a>.
</p>

<ol class="etapes">
  <li>Copier <code>packages/exemple-skill/</code> vers <code>packages/&lt;nom&gt;/</code>.</li>
  <li>Adapter <code>manifest.json</code>, le fichier du paquet, le README et <code>tests/cas.md</code>.</li>
  <li>Lancer <code>python scripts/build_catalog.py</code> : il refuse un manifeste invalide ou un contenu sensible.</li>
  <li>Ouvrir une branche et demander une relecture.</li>
</ol>

<p>
  <a class="bouton" href={`${DEPOT}/issues/new?template=proposer-un-paquet.yml`} rel="noopener">Proposer un paquet ↗</a>
  <span class="intro">Un formulaire GitHub, sans rien installer.</span>
</p>

{#if !charge}
  <p class="intro">Chargement de la checklist…</p>
{:else if texte}
  <div class="markdown carte">{@html html}</div>
{/if}

<style>
  .fil { padding: 1.5rem 0 0.5rem; }
  .fil a { text-decoration: none; }
  h1 { font-size: clamp(1.8rem, 5vw, 2.4rem); margin: 0.5rem 0; letter-spacing: -0.02em; }
  .intro { color: var(--texte-doux); max-width: 44rem; }
  .etapes { max-width: 44rem; padding-left: 1.3rem; }
  .etapes li { margin-bottom: 0.4rem; }
  .bouton { display: inline-block; margin-right: 0.8rem; padding: 0.55rem 1.2rem; border-radius: 99px; background: var(--accent); color: var(--sur-accent); text-decoration: none; font-weight: 600; }
  code { background: var(--code-bg); padding: 0.1rem 0.35rem; border-radius: 5px; font-size: 0.9em; }
  .carte { background: var(--surface); border: 1px solid var(--bordure); border-radius: var(--rayon); padding: 1rem 1.3rem; box-shadow: var(--ombre); max-width: 44rem; margin-bottom: 4rem; }
</style>
