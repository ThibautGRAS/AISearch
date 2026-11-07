import DOMPurify from 'dompurify'
import { marked, type Token, type Tokens } from 'marked'

export interface OptionsMarkdown {
  /** Retire le titre de niveau 1 en tête de document (la page a déjà son propre titre). */
  retirerTitre?: boolean
  /** Niveau de titre minimal : la page garde un seul h1 et une hiérarchie cohérente. */
  niveauMin?: number
}

/** Markdown → HTML assaini (le contenu vient de fichiers du dépôt, on ne lui fait pas confiance pour autant). */
export function rendreMarkdown(texte: string, { retirerTitre = false, niveauMin = 2 }: OptionsMarkdown = {}): string {
  const tokens = marked.lexer(texte)
  const premier = tokens.findIndex((t) => t.type !== 'space')
  if (retirerTitre && premier >= 0 && tokens[premier].type === 'heading' && (tokens[premier] as Tokens.Heading).depth === 1) {
    tokens.splice(premier, 1)
  }
  marked.walkTokens(tokens, (t: Token) => {
    if (t.type === 'heading') (t as Tokens.Heading).depth = Math.min(6, Math.max(niveauMin, (t as Tokens.Heading).depth))
  })
  const html = marked.parser(tokens, { async: false, gfm: true }) as string
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
}
