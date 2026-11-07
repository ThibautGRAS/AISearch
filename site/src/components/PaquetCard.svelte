<script lang="ts">
  import { hashPaquet } from '../lib/etat'
  import type { Paquet } from '../lib/types'
  import Surbrillance from './Surbrillance.svelte'
  import TypeIcon from './TypeIcon.svelte'

  let { paquet, requete, tagsActifs, ontag }: {
    paquet: Paquet
    requete: string
    tagsActifs: string[]
    ontag: (tag: string) => void
  } = $props()

  const libelleType = { skill: 'Skill', agent: 'Agent', connecteur: 'Connecteur' }
  const libelleAssistant = { claude: 'Claude', copilot: 'Copilot', opencode: 'OpenCode' }
</script>

<article class="carte">
  <header>
    <span class="type"><TypeIcon type={paquet.type} taille={14} /> {libelleType[paquet.type]}</span>
    <span class="version">v{paquet.version}</span>
  </header>
  <h2>
    <a href={hashPaquet(paquet.name)} data-carte-lien><Surbrillance texte={paquet.name} {requete} /></a>
  </h2>
  <p class="desc"><Surbrillance texte={paquet.description} {requete} /></p>
  <ul class="tags" aria-label="Tags">
    {#each paquet.tags as tag}
      <li>
        <button type="button" aria-pressed={tagsActifs.includes(tag)} onclick={() => ontag(tag)}>#{tag}</button>
      </li>
    {/each}
  </ul>
  <footer>
    {#each paquet.compatibilite as c}
      <span
        class="pastille"
        class:teste={c.testeLe}
        title={c.testeLe ? `Testé le ${c.testeLe}` : 'Déclaré compatible, jamais testé'}
      >
        {libelleAssistant[c.assistant]}{c.testeLe ? ' ✓' : ''}
      </span>
    {/each}
  </footer>
</article>

<style>
  .carte {
    position: relative; display: flex; flex-direction: column; gap: 0.5rem;
    background: var(--surface); border: 1px solid var(--bordure);
    border-radius: var(--rayon); padding: 1.1rem 1.2rem; box-shadow: var(--ombre);
    transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  }
  .carte:hover, .carte:focus-within { border-color: var(--accent); transform: translateY(-2px); box-shadow: var(--ombre-haute); }
  header { display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; }
  .type {
    display: inline-flex; align-items: center; gap: 0.3rem;
    background: var(--accent-doux); color: var(--accent);
    padding: 0.15rem 0.65rem 0.15rem 0.5rem; border-radius: 99px; font-weight: 600;
  }
  .version { color: var(--texte-doux); }
  h2 { margin: 0; font-size: 1.1rem; word-break: break-word; }
  h2 a { color: inherit; text-decoration: none; }
  /* Toute la carte est cliquable, sauf les tags (au-dessus). */
  h2 a::after { content: ''; position: absolute; inset: 0; border-radius: var(--rayon); }
  .desc { margin: 0; color: var(--texte-doux); font-size: 0.95rem; flex: 1; }
  .tags { list-style: none; display: flex; flex-wrap: wrap; gap: 0.25rem; padding: 0; margin: 0; position: relative; z-index: 1; }
  .tags button {
    font: inherit; font-size: 0.8rem; color: var(--accent); background: none;
    border: 0; padding: 0.15rem 0.4rem; cursor: pointer; border-radius: 6px;
  }
  .tags button:hover { background: var(--accent-doux); }
  .tags button[aria-pressed='true'] { background: var(--accent); color: var(--sur-accent); }
  footer { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.2rem; }
  .pastille {
    font-size: 0.75rem; padding: 0.1rem 0.55rem; border-radius: 99px;
    border: 1px dashed var(--bordure); color: var(--texte-doux);
  }
  .pastille.teste { border-style: solid; border-color: var(--accent); color: var(--accent); }
</style>
