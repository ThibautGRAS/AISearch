<script lang="ts">
  import { chargerCatalogue, chargerContenus, type DonneesContenu } from './lib/catalogue'
  import { ETAT_VIDE, hashListe } from './lib/etat'
  import { routeur } from './lib/routeur.svelte'
  import { theme } from './lib/theme.svelte'
  import type { Catalogue } from './lib/types'
  import PageContribuer from './components/PageContribuer.svelte'
  import PageDetail from './components/PageDetail.svelte'
  import PageIntrouvable from './components/PageIntrouvable.svelte'
  import PageListe from './components/PageListe.svelte'
  import { DEPOT } from './lib/config'

  let catalogue = $state<Catalogue | null>(null)
  let contenu = $state<DonneesContenu | null>(null)
  let erreur = $state<string | null>(null)

  chargerCatalogue().then((c) => (catalogue = c)).catch((e) => (erreur = e.message))
  // Le texte complet est chargé ensuite : la recherche par nom marche sans attendre.
  chargerContenus().then((c) => (contenu = c)).catch(() => {})

  const route = $derived(routeur.route)
  const paquet = $derived(route.page === 'paquet' ? catalogue?.packages.find((p) => p.name === route.nom) : undefined)

  $effect(() => {
    const base = 'AISearch'
    if (route.page === 'paquet') document.title = `${route.nom} — ${base}`
    else if (route.page === 'contribuer') document.title = `Contribuer — ${base}`
    else if (route.page === 'introuvable') document.title = `Introuvable — ${base}`
    else document.title = `${base} — catalogue de paquets IA`
  })
</script>

<header class="entete">
  <div class="conteneur barre">
    <a class="marque" href={hashListe(ETAT_VIDE)}>
      <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="var(--accent)" />
        <circle cx="14" cy="14" r="6" fill="none" stroke="var(--sur-accent)" stroke-width="2.4" />
        <path d="m19 19 5 5" stroke="var(--sur-accent)" stroke-width="2.4" stroke-linecap="round" />
      </svg>
      AISearch
    </a>
    <nav aria-label="Navigation principale">
      <a class="lien-catalogue" href={hashListe(ETAT_VIDE)}>Catalogue</a>
      <a href="#/contribuer">Contribuer</a>
      <a href={DEPOT} rel="noopener">GitHub ↗</a>
      <button
        type="button"
        class="theme"
        onclick={() => theme.basculer()}
        aria-label={theme.actuel === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'}
        title={theme.actuel === 'dark' ? 'Thème clair' : 'Thème sombre'}
      >
        {#if theme.actuel === 'dark'}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        {:else}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
          </svg>
        {/if}
      </button>
    </nav>
  </div>
</header>

<main class="conteneur">
  {#if erreur}
    <p class="etat" role="alert">Erreur de chargement : {erreur}</p>
  {:else if !catalogue}
    <p class="etat">Chargement du catalogue…</p>
  {:else if route.page === 'liste'}
    <PageListe {catalogue} contenus={contenu?.contenus ?? {}} etat={route.etat} onetat={(e) => routeur.majListe(e)} />
  {:else if route.page === 'paquet'}
    {#if paquet}
      <PageDetail {paquet} {catalogue} contenus={contenu?.contenus ?? {}} contenuCharge={contenu !== null} />
    {:else}
      <PageIntrouvable message={`Aucun paquet nommé « ${route.nom} ».`} />
    {/if}
  {:else if route.page === 'contribuer'}
    <PageContribuer texte={contenu?.contribuer ?? ''} charge={contenu !== null} />
  {:else}
    <PageIntrouvable />
  {/if}
</main>

<footer class="pied">
  <div class="conteneur">
    Catalogue open source · <a href={DEPOT} rel="noopener">code et paquets sur GitHub</a>
  </div>
</footer>

<style>
  .conteneur { max-width: 1100px; margin: 0 auto; padding: 0 1rem; }
  .entete { border-bottom: 1px solid var(--bordure); background: color-mix(in srgb, var(--bg) 80%, transparent); backdrop-filter: blur(8px); position: sticky; top: 0; z-index: 10; }
  .barre { display: flex; align-items: center; justify-content: space-between; height: 3.5rem; gap: 1rem; }
  .marque { display: inline-flex; align-items: center; gap: 0.6rem; font-weight: 700; font-size: 1.1rem; color: var(--texte); text-decoration: none; }
  nav { display: flex; align-items: center; gap: 1.1rem; font-size: 0.92rem; }
  nav a { color: var(--texte-doux); text-decoration: none; white-space: nowrap; }
  nav a:hover { color: var(--accent); }
  .theme { display: inline-flex; background: none; border: 1px solid var(--bordure); color: var(--texte); border-radius: 99px; padding: 0.35rem; cursor: pointer; }
  .theme:hover { border-color: var(--accent); color: var(--accent); }
  main { min-height: 100vh; min-height: 100svh; }
  .etat { text-align: center; color: var(--texte-doux); padding: 4rem 0; }
  .pied { border-top: 1px solid var(--bordure); padding: 1.5rem 0; color: var(--texte-doux); font-size: 0.88rem; }
  @media (max-width: 560px) { nav { gap: 0.8rem; font-size: 0.85rem; } .lien-catalogue { display: none; } }
</style>
