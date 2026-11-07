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
