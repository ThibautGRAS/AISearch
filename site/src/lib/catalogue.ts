import type { Catalogue } from './types'

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
