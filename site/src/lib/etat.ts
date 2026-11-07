import type { Assistant, TypePaquet } from './types'

export type Tri = 'pertinence' | 'nom' | 'date'

export interface Etat {
  q: string
  types: TypePaquet[]
  assistants: Assistant[]
  tags: string[]
  tri: Tri
}

export const ETAT_VIDE: Etat = { q: '', types: [], assistants: [], tags: [], tri: 'pertinence' }

export type Route =
  | { page: 'liste'; etat: Etat }
  | { page: 'paquet'; nom: string }
  | { page: 'contribuer' }
  | { page: 'introuvable' }

const TYPES: TypePaquet[] = ['skill', 'agent', 'connecteur']
const ASSISTANTS: Assistant[] = ['claude', 'copilot', 'opencode']
const TRIS: Tri[] = ['pertinence', 'nom', 'date']

/** Lit un fragment d'URL (« #/?q=...&type=skill », « #/paquet/nom »…). */
export function lireRoute(hash: string): Route {
  const brut = hash.replace(/^#/, '')
  const [chemin, requete = ''] = brut.split('?', 2)
  const segments = chemin.split('/').filter(Boolean)

  if (segments.length === 0) return { page: 'liste', etat: lireEtat(new URLSearchParams(requete)) }
  if (segments[0] === 'contribuer' && segments.length === 1) return { page: 'contribuer' }
  if (segments[0] === 'paquet' && segments.length === 2) {
    try {
      return { page: 'paquet', nom: decodeURIComponent(segments[1]) }
    } catch {
      return { page: 'introuvable' }
    }
  }
  return { page: 'introuvable' }
}

function lireEtat(p: URLSearchParams): Etat {
  const tri = p.get('tri') as Tri | null
  return {
    q: p.get('q') ?? '',
    types: p.getAll('type').filter((t): t is TypePaquet => TYPES.includes(t as TypePaquet)),
    assistants: p.getAll('assistant').filter((a): a is Assistant => ASSISTANTS.includes(a as Assistant)),
    tags: p.getAll('tag').filter(Boolean),
    tri: tri && TRIS.includes(tri) ? tri : 'pertinence',
  }
}

/** Fragment d'URL de la liste ; les valeurs par défaut sont omises. */
export function hashListe(e: Etat): string {
  const p = new URLSearchParams()
  if (e.q.trim()) p.set('q', e.q)
  e.types.forEach((t) => p.append('type', t))
  e.assistants.forEach((a) => p.append('assistant', a))
  e.tags.forEach((t) => p.append('tag', t))
  if (e.tri !== 'pertinence') p.set('tri', e.tri)
  const s = p.toString()
  return s ? `#/?${s}` : '#/'
}

export function hashPaquet(nom: string): string {
  return `#/paquet/${encodeURIComponent(nom)}`
}

export function filtresActifs(e: Etat): boolean {
  return e.types.length + e.assistants.length + e.tags.length > 0
}

/** Ajoute la valeur si absente, la retire sinon. */
export function basculer<T>(liste: T[], valeur: T): T[] {
  return liste.includes(valeur) ? liste.filter((v) => v !== valeur) : [...liste, valeur]
}
