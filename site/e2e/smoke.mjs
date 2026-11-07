// Test de bout en bout : construit le site, le sert, le pilote dans un vrai navigateur.
// Usage : node e2e/smoke.mjs [--navigateur=msedge|chrome] [--captures]
// Nécessite Edge ou Chrome installé (aucun navigateur n'est téléchargé).
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'

const args = process.argv.slice(2)
const canal = (args.find((a) => a.startsWith('--navigateur=')) ?? '--navigateur=msedge').split('=')[1]
const captures = args.includes('--captures')
const PORT = 4173
const BASE = `http://localhost:${PORT}/AISearch/`

const serveur = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  shell: true, stdio: 'ignore',
})
const arreter = () =>
  process.platform === 'win32'
    ? spawn('taskkill', ['/pid', String(serveur.pid), '/t', '/f'], { stdio: 'ignore' })
    : serveur.kill()

async function attendreServeur() {
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(BASE)).ok) return } catch { /* pas encore prêt */ }
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new Error('serveur de prévisualisation injoignable')
}

const resultats = []
async function etape(nom, fn) {
  try { await fn(); resultats.push([true, nom]); console.log(`  ok   ${nom}`) }
  catch (e) { resultats.push([false, nom]); console.log(`  ECHEC ${nom}\n        ${e.message.split('\n')[0]}`) }
}

let navigateur
try {
  await attendreServeur()
  navigateur = await chromium.launch({ channel: canal })
  const ctx = await navigateur.newContext({ viewport: { width: 1280, height: 900 }, locale: 'fr-FR', colorScheme: 'light' })
  const page = await ctx.newPage()
  const erreursConsole = []
  page.on('console', (m) => m.type() === 'error' && erreursConsole.push(m.text()))
  page.on('pageerror', (e) => erreursConsole.push(e.message))
  const cartes = () => page.locator('article.carte')
  const compteur = () => page.locator('.compteur')
  const capture = async (nom) => { if (captures) { await page.waitForTimeout(500); mkdirSync('e2e/captures', { recursive: true }); await page.screenshot({ path: `e2e/captures/${nom}.png`, fullPage: true }) } }

  console.log(`Navigateur : ${canal} — ${BASE}`)
  await page.goto(BASE)
  await cartes().first().waitFor()
  // Laisse le contenu complet (contenu.json) se charger avant les recherches.
  await page.waitForLoadState('networkidle')

  await etape('la page d\'accueil affiche tous les paquets', async () => {
    const n = await cartes().count()
    assert.ok(n >= 3, `${n} cartes`)
    assert.match(await page.locator('h1').first().innerText(), /survivent aux outils/)
  })

  await etape('la recherche filtre, surligne et met à jour l\'URL', async () => {
    await page.fill('#q', 'relec')
    await page.waitForFunction(() => document.querySelectorAll('article.carte').length === 1)
    assert.match(await compteur().innerText(), /1 résultat sur/)
    assert.match(page.url(), /#\/\?q=relec/)
    await page.fill('#q', 'agent')
    await page.waitForFunction(() => document.querySelectorAll('article.carte mark').length > 0)
    await page.fill('#q', 'relec')
    await page.waitForFunction(() => document.querySelectorAll('article.carte').length === 1)
  })

  await etape('recharger l\'URL restitue la même vue', async () => {
    await page.reload()
    await cartes().first().waitFor()
    assert.equal(await page.inputValue('#q'), 'relec')
    assert.equal(await cartes().count(), 1)
  })

  await etape('recherche insensible aux accents et aux fautes', async () => {
    await page.fill('#q', 'synthese')
    await page.waitForFunction(() => document.querySelector('article.carte h2')?.textContent?.includes('exemple-skill'))
    await page.fill('#q', 'traducton')
    await page.waitForFunction(() => document.querySelector('article.carte h2')?.textContent?.includes('traduction'))
  })

  await etape('aucun résultat : message et réinitialisation', async () => {
    await page.fill('#q', 'zzqxwv')
    await page.locator('.vide').waitFor()
    await page.getByRole('button', { name: 'Tout réinitialiser' }).click()
    await page.waitForFunction(() => document.querySelectorAll('article.carte').length >= 3)
    assert.equal(await page.inputValue('#q'), '')
  })

  await etape('filtre de type, puis réinitialisation', async () => {
    await page.locator('.filtres .puce', { hasText: 'Agents' }).click()
    await page.waitForFunction(() => document.querySelectorAll('article.carte').length === 1)
    assert.match(page.url(), /type=agent/)
    await page.getByRole('button', { name: 'Réinitialiser les filtres' }).click()
    await page.waitForFunction(() => document.querySelectorAll('article.carte').length >= 3)
  })

  await etape('filtre de tag depuis une carte (ET)', async () => {
    await page.locator('article.carte .tags button', { hasText: '#traduction' }).first().click()
    await page.waitForFunction(() => document.querySelectorAll('article.carte').length === 1)
    assert.match(page.url(), /tag=traduction/)
    await page.getByRole('button', { name: 'Réinitialiser les filtres' }).click()
  })

  await etape('tri par nom', async () => {
    await page.selectOption('.tri select', 'nom')
    const noms = await page.locator('article.carte h2').allInnerTexts()
    assert.deepEqual(noms, [...noms].sort((a, b) => a.localeCompare(b, 'fr')))
    assert.match(page.url(), /tri=nom/)
    await page.selectOption('.tri select', 'pertinence')
  })

  await etape('raccourci « / » et touche Échap', async () => {
    await page.locator('h1').first().click()
    await page.keyboard.press('/')
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'q')
    await page.keyboard.type('agent')
    await page.keyboard.press('Escape')
    assert.equal(await page.inputValue('#q'), '')
  })

  await etape('navigation clavier : bas depuis la barre, flèches entre cartes', async () => {
    await page.focus('#q')
    await page.keyboard.press('ArrowDown')
    assert.equal(await page.evaluate(() => document.activeElement?.hasAttribute('data-carte-lien')), true)
    const premier = await page.evaluate(() => document.activeElement?.textContent)
    await page.keyboard.press('ArrowDown')
    const second = await page.evaluate(() => document.activeElement?.textContent)
    assert.notEqual(premier, second)
    await page.keyboard.press('ArrowUp')
    await page.keyboard.press('ArrowUp')
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'q')
  })

  await capture('liste')

  await etape('page de détail : contenu, installation, sources', async () => {
    await page.locator('article.carte h2 a', { hasText: 'exemple-agent-revue' }).click()
    await page.locator('article > header h1', { hasText: 'exemple-agent-revue' }).waitFor()
    assert.equal(await page.locator('h1').count(), 1, 'un seul h1 par page')
    assert.match(page.url(), /#\/paquet\/exemple-agent-revue/)
    await page.locator('.markdown').first().waitFor()
    assert.ok(await page.locator('.markdown li').count() > 0, 'markdown non rendu')
    assert.match(await page.locator('.commande code').first().innerText(), /install\.py exemple-agent-revue --cible claude/)
    assert.ok(await page.locator('a[href*="github.com/ThibautGRAS/AISearch/tree/main/packages/exemple-agent-revue"]').count() === 1)
    assert.ok(await page.locator('.proches li').count() >= 1, 'pas de paquet proche')
  })

  await etape('le markdown est assaini (aucun script injecté)', async () => {
    assert.equal(await page.locator('.markdown script').count(), 0)
    assert.equal(await page.locator('.markdown [onerror], .markdown [onclick]').count(), 0)
  })

  await capture('detail')

  await etape('retour arrière vers la liste', async () => {
    await page.goBack()
    await cartes().first().waitFor()
  })

  await etape('route inconnue et paquet inexistant : page 404', async () => {
    await page.goto(`${BASE}#/paquet/nexiste-pas`)
    await page.getByText('Aucun paquet nommé').waitFor()
    await page.goto(`${BASE}#/nimporte-quoi`)
    await page.getByRole('heading', { name: 'Introuvable' }).waitFor()
  })

  await etape('page Contribuer', async () => {
    await page.goto(`${BASE}#/contribuer`)
    await page.getByRole('heading', { name: 'Contribuer', level: 1 }).waitFor()
    await page.locator('.markdown').waitFor()
    assert.equal(await page.locator('h1').count(), 1, 'un seul h1 par page')
  })

  await etape('bascule du thème sombre', async () => {
    await page.goto(BASE)
    await page.locator('.theme').click()
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark')
    await capture('liste-sombre')
    await page.locator('.theme').click()
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'light')
  })

  await etape('mobile (375 px) : pas de défilement horizontal', async () => {
    await page.setViewportSize({ width: 375, height: 800 })
    for (const hash of ['', '#/paquet/exemple-skill', '#/contribuer']) {
      await page.goto(`${BASE}${hash}`)
      await page.waitForLoadState('networkidle')
      const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }))
      assert.ok(sw <= iw, `${hash || 'liste'} : scrollWidth ${sw} > ${iw}`)
    }
    await page.goto(BASE)
    await page.waitForLoadState('networkidle')
    await capture('liste-mobile')
  })

  await etape('aucune erreur dans la console', async () => {
    assert.deepEqual(erreursConsole, [])
  })

  const echecs = resultats.filter(([ok]) => !ok).length
  console.log(`\n${resultats.length - echecs}/${resultats.length} étapes réussies`)
  process.exitCode = echecs ? 1 : 0
} catch (e) {
  console.error('Erreur fatale :', e.message)
  process.exitCode = 1
} finally {
  await navigateur?.close()
  arreter()
}
