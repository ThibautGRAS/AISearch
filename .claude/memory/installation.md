# Installation et état — MAI / AISearch

## Environnement (relevé le 2026-11-07)
- Python 3.11.6, Node 24.19.0, npm 11.17.0 (CI : Node 22, Python 3.11).
- `gh` (GitHub CLI) non installé : pas de création de dépôt ni de réglage Pages en ligne de commande.
- Navigateurs pour les tests : Edge (`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`) et Chrome, déjà installés.
- Dépôt : https://github.com/ThibautGRAS/AISearch (public), branche `main`.

## Dépendances du site (`site/`)
Vite 8, Svelte 5, TypeScript 6 (le 7 est incompatible avec svelte-check), MiniSearch 7, marked 18, DOMPurify 3, Vitest 5, playwright-core 1.65 (pilote Edge/Chrome installés, rien de téléchargé).

## Mesures relevées (Lighthouse 12, Chrome, serveur de prévisualisation local, 2026-11-07)
- Mobile : performance 100, accessibilité 100, bonnes pratiques 100, SEO 100 (LCP 1,7 s, CLS 0,018).
- Bureau : mesuré avant correction du décalage de mise en page (performance 96) ; non remesuré depuis.
- Mesures sur le build local, pas sur le site publié.

## Pièges rencontrés
- `vite preview` n'utilise pas `command === 'build'` : la base `/AISearch/` doit aussi s'appliquer quand `isPreview` est vrai.
- Les fichiers Markdown des paquets ont leur propre `# titre` : le rendu le retire ou le rétrograde pour garder un seul `h1` par page.
- Dans les README de paquets, mettre les `<placeholders>` entre accents graves, sinon le Markdown les prend pour du HTML.
- Pied de page qui sautait pendant le chargement (CLS 0,9) : `main` réserve la hauteur de l'écran.

## Reste à faire côté utilisateur
- Réglage Actions : « Allow GitHub Actions to create and approve pull requests » (Settings → Actions → General), pour que l'Action issue → paquet ouvre la PR seule.
- Essai réel de l'Action issue → paquet : jamais exécutée sur GitHub (seuls les tests Python locaux ont tourné) ; elle crée une branche et une PR publiques.
- Activer GitHub Pages (Settings → Pages → Source : GitHub Actions).
- Choisir une licence.
- Fournir de vrais paquets (le script de validation bloque e-mails, chemins personnels et secrets).
