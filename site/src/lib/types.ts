export type TypePaquet = 'skill' | 'agent' | 'connecteur'
export type Assistant = 'claude' | 'copilot' | 'opencode'

export interface Compatibilite {
  assistant: Assistant
  /** Date du dernier test réel (AAAA-MM-JJ), null si jamais testé. */
  testeLe: string | null
}

export interface Paquet {
  name: string
  version: string
  type: TypePaquet
  author: string
  description: string
  tags: string[]
  assistants: Assistant[]
  compatibilite: Compatibilite[]
  extrait: string
  creeLe: string | null
  modifieLe: string | null
  path: string
  /** Chemin relatif de l'archive .zip du paquet. */
  archive?: string
}

export interface Catalogue {
  schemaVersion: number
  genereLe: string
  packages: Paquet[]
}
