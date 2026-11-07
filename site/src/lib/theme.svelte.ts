type Mode = 'light' | 'dark'

function lire(): Mode | null {
  try {
    const v = localStorage.getItem('aisearch-theme')
    return v === 'light' || v === 'dark' ? v : null
  } catch {
    return null
  }
}

function systeme(): Mode {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

let explicite = $state<Mode | null>(lire())
if (explicite) document.documentElement.dataset.theme = explicite

export const theme = {
  get actuel(): Mode {
    return explicite ?? systeme()
  },
  basculer() {
    const suivant: Mode = this.actuel === 'dark' ? 'light' : 'dark'
    explicite = suivant
    document.documentElement.dataset.theme = suivant
    try {
      localStorage.setItem('aisearch-theme', suivant)
    } catch {
      /* stockage indisponible : le choix reste valable pour la session */
    }
  },
}
