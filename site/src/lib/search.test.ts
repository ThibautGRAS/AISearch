import { describe, expect, it } from 'vitest'
import { creerMoteur, normaliser, surligner, traiterTerme, type Contenus } from './search'
import type { Paquet } from './types'

function paquet(name: string, description: string, tags: string[], type: Paquet['type'] = 'skill'): Paquet {
  return {
    name, description, tags, type,
    version: '0.1.0', author: 'test', assistants: ['claude'],
    compatibilite: [{ assistant: 'claude', testeLe: null }],
    extrait: '', creeLe: null, modifieLe: null, path: `packages/${name}`,
  }
}

const paquets = [
  paquet('redaction-rapport', 'Rédiger un rapport technique structuré.', ['rapport', 'redaction']),
  paquet('traduction-fr-en', 'Traduit un texte du français vers l\'anglais.', ['traduction', 'langue']),
  paquet('revue-document', 'Relit un document et signale les incohérences.', ['relecture', 'qualite'], 'agent'),
  paquet('synthese', 'Synthétise un texte en cinq points.', ['resume']),
]

const contenus: Contenus = {
  synthese: { entree: 'Produire des puces courtes à partir du texte.', readme: '' },
  'revue-document': { entree: 'Vérifier les chiffres contradictoires.', readme: '' },
}

const moteur = creerMoteur(paquets, contenus)
const premier = (q: string) => moteur.chercher(q)[0]?.name

describe('normalisation', () => {
  it('retire accents et casse', () => {
    expect(normaliser('Rédaction ÉTÉ')).toBe('redaction ete')
  })
  it('écarte les mots vides et les pluriels simples', () => {
    expect(traiterTerme('de')).toBeNull()
    expect(traiterTerme('Traductions')).toBe('traduction')
    expect(traiterTerme('cas')).toBe('cas')
  })
})

describe('recherche', () => {
  it('« redaction » trouve « rédaction »', () => {
    expect(premier('redaction')).toBe('redaction-rapport')
  })
  it('insensible aux accents dans l\'autre sens', () => {
    expect(premier('rédaction')).toBe('redaction-rapport')
    expect(premier('synthèse')).toBe('synthese')
  })
  it('tolère une faute de frappe légère', () => {
    expect(premier('traducton')).toBe('traduction-fr-en')
  })
  it('recherche par préfixe', () => {
    expect(premier('relec')).toBe('revue-document')
  })
  it('pluriel et singulier équivalents', () => {
    expect(premier('rapports')).toBe('redaction-rapport')
  })
  it('cherche dans le contenu complet', () => {
    expect(premier('contradictoires')).toBe('revue-document')
  })
  it('le nom pèse plus que le contenu', () => {
    expect(premier('synthese')).toBe('synthese')
  })
  it('plusieurs mots : tous requis d\'abord', () => {
    expect(moteur.chercher('rapport technique').map((r) => r.name)).toEqual(['redaction-rapport'])
  })
  it('repli sur au moins un mot', () => {
    expect(moteur.chercher('rapport anglais').length).toBeGreaterThan(1)
  })
  it('requête vide : tout le catalogue, trié', () => {
    const noms = moteur.chercher('  ').map((r) => r.name)
    expect(noms).toEqual([...noms].sort((a, b) => a.localeCompare(b, 'fr')))
    expect(noms).toHaveLength(paquets.length)
  })
  it('aucun résultat pour du charabia', () => {
    expect(moteur.chercher('zzqxwv')).toEqual([])
  })
})

describe('surbrillance', () => {
  it('marque les mots trouvés, accents ignorés', () => {
    const segs = surligner('Rédiger un rapport technique', 'redaction rapport')
    expect(segs.filter((s) => s.surligne).map((s) => s.texte)).toEqual(['rapport'])
  })
  it('reconstitue le texte à l\'identique', () => {
    const t = 'Traduit un texte du français vers l\'anglais.'
    expect(surligner(t, 'texte').map((s) => s.texte).join('')).toBe(t)
  })
  it('requête vide : un seul segment non surligné', () => {
    expect(surligner('abc', '')).toEqual([{ texte: 'abc', surligne: false }])
  })
})
