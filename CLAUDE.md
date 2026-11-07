# MAI — catalogue de paquets IA (skills, agents, connecteurs)

Dépôt distant : https://github.com/ThibautGRAS/AISearch

## Principe
Un paquet est écrit une fois en contenu neutre (Markdown), puis installé vers l'assistant voulu (Claude, Copilot, OpenCode) par `scripts/install.py`.

## Structure
- `packages/<nom>/` : `manifest.json`, `SKILL.md` (ou `AGENT.md`), `README.md`, `tests/`.
- `catalog.json` : index généré par `scripts/build_catalog.py`, ne pas éditer à la main.
- `scripts/` : installation et génération du catalogue (Python standard, sans dépendance).

## Règles
- Réponses et notes en français.
- Aucun secret dans les paquets.
- Les chemins d'installation par assistant (`TARGETS` dans `install.py`) sont des hypothèses à vérifier avant de les déclarer valides.
- Relancer `python scripts/build_catalog.py` après tout ajout ou changement de manifeste.

## Site (`site/`)
Interface de recherche : Vite + Svelte 5 + TypeScript 6 (TypeScript 7 incompatible avec svelte-check), MiniSearch pour la recherche.
- `npm run dev` / `npm run build` / `npm run check` dans `site/`.
- `build_catalog.py` copie `catalog.json` et `contenu.json` dans `site/public/` (copies non versionnées).
- Le script refuse les manifestes invalides et tout motif sensible (dépôt public).
- `npm test` (unitaires), `npm run e2e` (navigateur réel, Edge ou Chrome installé), `npm run check` (types).
- Déploiement : `.github/workflows/publier-site.yml` (GitHub Pages, source « GitHub Actions » à activer à la main dans les réglages du dépôt).
- Pièges et mesures : `.claude/memory/installation.md`.
