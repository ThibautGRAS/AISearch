import type { Catalogue } from './types'
import type { Contenus } from './search'

export const SCHEMA_ATTENDU = 1

export async function chargerCatalogue(): Promise<Catalogue> {
  const rep = await fetch(`${import.meta.env.BASE_URL}catalog.json`)
  if (!rep.ok) throw new Error(`catalog.json introuvable (${rep.status})`)
  const cat = (await rep.json()) as Catalogue
  if (cat.schemaVersion !== SCHEMA_ATTENDU) {
    throw new Error(`Schéma ${cat.schemaVersion} inattendu (attendu ${SCHEMA_ATTENDU})`)
  }
  return cat
}

export async function chargerContenus(): Promise<Contenus> {
  const rep = await fetch(`${import.meta.env.BASE_URL}contenu.json`)
  if (!rep.ok) throw new Error(`contenu.json introuvable (${rep.status})`)
  const data = (await rep.json()) as { schemaVersion: number; contenus: Contenus }
  if (data.schemaVersion !== SCHEMA_ATTENDU) throw new Error('Schéma de contenu inattendu')
  return data.contenus
}
