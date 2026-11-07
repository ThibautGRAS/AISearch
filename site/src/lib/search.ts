import MiniSearch from 'minisearch'
import type { Paquet } from './types'

/** Textes complets d'un paquet (contenu.json). */
export type Contenus = Record<string, { entree: string; readme: string }>

export interface Resultat {
  name: string
  score: number
  /** Termes de l'index qui ont correspondu (pour la surbrillance). */
  termes: string[]
}

const MOTS_VIDES = new Set([
  'le', 'la', 'les', 'l', 'un', 'une', 'des', 'du', 'de', 'd', 'et', 'ou', 'en',
  'au', 'aux', 'a', 'ce', 'ces', 'cet', 'cette', 'son', 'sa', 'ses', 'sur', 'dans',
  'par', 'pour', 'qui', 'que', 'qu', 'est', 'sont', 'se', 's', 'y', 'il', 'elle',
])

/** Minuscules, sans accents. */
export function normaliser(texte: string): string {
  return texte.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

/** Pluriels simples : « traductions » → « traduction ». */
function racine(mot: string): string {
  if (mot.length > 3 && /[sx]$/.test(mot) && !mot.endsWith('ss')) return mot.slice(0, -1)
  return mot
}

/** Appliqué à l'indexation ET à la requête. Renvoie null pour un mot vide. */
export function traiterTerme(terme: string): string | null {
  const mot = normaliser(terme)
  if (!mot || MOTS_VIDES.has(mot)) return null
  return racine(mot)
}

interface Doc {
  id: string
  name: string
  tags: string
  description: string
  texte: string
}

export interface Moteur {
  chercher(requete: string): Resultat[]
}

export function creerMoteur(paquets: Paquet[], contenus: Contenus = {}): Moteur {
  const index = new MiniSearch<Doc>({
    fields: ['name', 'tags', 'description', 'texte'],
    idField: 'id',
    processTerm: (t) => traiterTerme(t),
    searchOptions: {
      boost: { name: 5, tags: 3, description: 2, texte: 1 },
      prefix: true,
      fuzzy: 0.2,
      processTerm: (t) => traiterTerme(t),
    },
  })

  index.addAll(
    paquets.map((p) => ({
      id: p.name,
      name: p.name.replace(/-/g, ' '),
      tags: p.tags.join(' '),
      description: p.description,
      texte: [contenus[p.name]?.entree, contenus[p.name]?.readme].filter(Boolean).join('\n'),
    })),
  )

  const alphabetique = [...paquets].sort((a, b) => a.name.localeCompare(b.name, 'fr'))

  return {
    chercher(requete) {
      if (!requete.trim()) return alphabetique.map((p) => ({ name: p.name, score: 0, termes: [] }))
      // Tous les mots d'abord ; si rien, au moins un mot.
      let res = index.search(requete, { combineWith: 'AND' })
      if (res.length === 0) res = index.search(requete, { combineWith: 'OR' })
      return res.map((r) => ({ name: r.id as string, score: r.score, termes: r.terms }))
    },
  }
}

export interface Segment {
  texte: string
  surligne: boolean
}

/** Découpe un texte en segments, en marquant les mots qui correspondent à la requête. */
export function surligner(texte: string, requete: string): Segment[] {
  const termes = requete
    .split(/[^\p{L}\p{N}]+/u)
    .map(traiterTerme)
    .filter((t): t is string => t !== null)
  if (termes.length === 0) return [{ texte, surligne: false }]

  const segments: Segment[] = []
  for (const morceau of texte.split(/([\p{L}\p{N}]+)/u)) {
    if (!morceau) continue
    const mot = traiterTerme(morceau)
    const correspond = mot !== null && termes.some((t) => mot.startsWith(t))
    const dernier = segments[segments.length - 1]
    if (dernier && dernier.surligne === correspond) dernier.texte += morceau
    else segments.push({ texte: morceau, surligne: correspond })
  }
  return segments
}
