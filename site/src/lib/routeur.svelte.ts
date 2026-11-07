import { hashListe, lireRoute, type Etat, type Route } from './etat'

let route = $state<Route>(lireRoute(location.hash))

window.addEventListener('hashchange', () => {
  route = lireRoute(location.hash)
})

export const routeur = {
  get route(): Route {
    return route
  },
  /** Met à jour la liste (recherche, filtres) dans l'URL sans empiler l'historique. */
  majListe(etat: Etat) {
    history.replaceState(null, '', hashListe(etat))
    route = { page: 'liste', etat }
  },
}
