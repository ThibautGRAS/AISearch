<script lang="ts">
  import { ETAT_VIDE, hashListe } from '../lib/etat'
  let { message = 'Cette page n\'existe pas.' }: { message?: string } = $props()
</script>

<section class="introuvable">
  <p class="code">404</p>
  <h1>Introuvable</h1>
  <p>{message}</p>
  <a class="bouton" href={hashListe(ETAT_VIDE)}>Retour au catalogue</a>
</section>

<style>
  .introuvable { text-align: center; padding: 5rem 0; }
  .code { font-size: 4rem; font-weight: 700; margin: 0; color: var(--accent); letter-spacing: -0.04em; }
  h1 { margin: 0 0 0.5rem; }
  p { color: var(--texte-doux); }
  .bouton { display: inline-block; margin-top: 1rem; padding: 0.6rem 1.3rem; border-radius: 99px; background: var(--accent); color: var(--sur-accent); text-decoration: none; }
</style>
