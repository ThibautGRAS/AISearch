import type { Etat } from './etat'
import type { Assistant, Paquet, TypePaquet } from './types'

/**
 * Types et assistants : un paquet doit correspondre à l'une des valeurs choisies (OU).
 * Tags : un paquet doit porter tous les tags choisis (ET), pour réduire la liste.
 */
export function appliquerFiltres(paquets: Paquet[], e: Etat): Paquet[] {
  return paquets.filter(
    (p) =>
      (e.types.length === 0 || e.types.includes(p.type)) &&
      (e.assistants.length === 0 || p.assistants.some((a) => e.assistants.includes(a))) &&
      e.tags.every((t) => p.tags.includes(t)),
  )
}

/** `paquets` doit déjà être dans l'ordre de pertinence ; les autres tris le réordonnent. */
export function trier(paquets: Paquet[], tri: Etat['tri']): Paquet[] {
  const copie = [...paquets]
  if (tri === 'nom') return copie.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  if (tri === 'date') {
    return copie.sort((a, b) => {
      const da = a.modifieLe ?? ''
      const db = b.modifieLe ?? ''
      return da === db ? a.name.localeCompare(b.name, 'fr') : da < db ? 1 : -1
    })
  }
  return copie
}

export interface Facettes {
  types: Map<TypePaquet, number>
  assistants: Map<Assistant, number>
  tags: Map<string, number>
}

/** Effectifs sur l'ensemble de paquets donné (ici : les résultats de la recherche texte). */
export function facettes(paquets: Paquet[]): Facettes {
  const f: Facettes = { types: new Map(), assistants: new Map(), tags: new Map() }
  const inc = <K>(m: Map<K, number>, k: K) => m.set(k, (m.get(k) ?? 0) + 1)
  for (const p of paquets) {
    inc(f.types, p.type)
    p.assistants.forEach((a) => inc(f.assistants, a))
    p.tags.forEach((t) => inc(f.tags, t))
  }
  return f
}

/** Paquets partageant au moins un tag, les plus proches d'abord. */
export function paquetsProches(cible: Paquet, tous: Paquet[], max = 3): Paquet[] {
  return tous
    .filter((p) => p.name !== cible.name)
    .map((p) => ({ p, communs: p.tags.filter((t) => cible.tags.includes(t)).length }))
    .filter((x) => x.communs > 0)
    .sort((a, b) => b.communs - a.communs || a.p.name.localeCompare(b.p.name, 'fr'))
    .slice(0, max)
    .map((x) => x.p)
}
