import { describe, expect, it } from 'vitest'
import { basculer, ETAT_VIDE, hashListe, hashPaquet, lireRoute, type Etat } from './etat'
import { appliquerFiltres, facettes, paquetsProches, trier } from './filtres'
import type { Paquet } from './types'

function paquet(name: string, type: Paquet['type'], tags: string[], assistants: Paquet['assistants'], modifieLe: string | null = null): Paquet {
  return {
    name, type, tags, assistants, modifieLe,
    description: '', version: '1.0.0', author: 't', extrait: '', creeLe: null, path: name,
    compatibilite: assistants.map((assistant) => ({ assistant, testeLe: null })),
  }
}

const A = paquet('alpha', 'skill', ['rapport', 'redaction'], ['claude', 'copilot'], '2026-01-10')
const B = paquet('beta', 'agent', ['rapport'], ['claude'], '2026-03-01')
const C = paquet('gamma', 'skill', ['langue'], ['opencode'], null)
const tous = [A, B, C]

describe('URL ↔ état', () => {
  it('aller-retour sans perte', () => {
    const e: Etat = { q: 'rédaction & rapport', types: ['skill'], assistants: ['claude', 'opencode'], tags: ['a b', 'c'], tri: 'date' }
    const r = lireRoute(hashListe(e))
    expect(r).toEqual({ page: 'liste', etat: e })
  })
  it('état vide : fragment minimal', () => {
    expect(hashListe(ETAT_VIDE)).toBe('#/')
    expect(lireRoute('')).toEqual({ page: 'liste', etat: ETAT_VIDE })
  })
  it('ignore les valeurs invalides', () => {
    const r = lireRoute('#/?type=nimporte&assistant=x&tri=zzz')
    expect(r).toEqual({ page: 'liste', etat: ETAT_VIDE })
  })
  it('routes de page', () => {
    expect(lireRoute(hashPaquet('mon paquet'))).toEqual({ page: 'paquet', nom: 'mon paquet' })
    expect(lireRoute('#/contribuer')).toEqual({ page: 'contribuer' })
    expect(lireRoute('#/inconnu')).toEqual({ page: 'introuvable' })
    expect(lireRoute('#/paquet/%E0%A4%A')).toEqual({ page: 'introuvable' })
  })
  it('basculer ajoute puis retire', () => {
    expect(basculer(['a'], 'b')).toEqual(['a', 'b'])
    expect(basculer(['a', 'b'], 'a')).toEqual(['b'])
  })
})

describe('filtres', () => {
  it('sans filtre : tout passe', () => {
    expect(appliquerFiltres(tous, ETAT_VIDE)).toHaveLength(3)
  })
  it('types : OU', () => {
    expect(appliquerFiltres(tous, { ...ETAT_VIDE, types: ['agent', 'skill'] })).toHaveLength(3)
    expect(appliquerFiltres(tous, { ...ETAT_VIDE, types: ['agent'] })).toEqual([B])
  })
  it('assistants : OU', () => {
    expect(appliquerFiltres(tous, { ...ETAT_VIDE, assistants: ['copilot', 'opencode'] })).toEqual([A, C])
  })
  it('tags : ET', () => {
    expect(appliquerFiltres(tous, { ...ETAT_VIDE, tags: ['rapport'] })).toEqual([A, B])
    expect(appliquerFiltres(tous, { ...ETAT_VIDE, tags: ['rapport', 'redaction'] })).toEqual([A])
  })
  it('facettes combinées', () => {
    expect(appliquerFiltres(tous, { ...ETAT_VIDE, types: ['skill'], tags: ['rapport'] })).toEqual([A])
  })
})

describe('tri', () => {
  it('pertinence : conserve l\'ordre reçu', () => {
    expect(trier([C, A, B], 'pertinence')).toEqual([C, A, B])
  })
  it('nom', () => {
    expect(trier([C, B, A], 'nom')).toEqual([A, B, C])
  })
  it('date : plus récent d\'abord, sans date à la fin', () => {
    expect(trier([A, C, B], 'date')).toEqual([B, A, C])
  })
})

describe('facettes et proches', () => {
  it('effectifs', () => {
    const f = facettes(tous)
    expect(f.types.get('skill')).toBe(2)
    expect(f.assistants.get('claude')).toBe(2)
    expect(f.tags.get('rapport')).toBe(2)
  })
  it('paquets proches par tags communs', () => {
    expect(paquetsProches(A, tous)).toEqual([B])
    expect(paquetsProches(C, tous)).toEqual([])
  })
})
