# Catalogue de paquets IA

Des skills et agents écrits une fois, installables dans plusieurs assistants (Claude, GitHub Copilot, OpenCode).

## Utiliser
```bash
git clone https://github.com/ThibautGRAS/AISearch
cd AISearch
python scripts/install.py exemple-skill --cible claude --dest /chemin/vers/mon/projet
```
Cibles : `claude`, `copilot`, `opencode`. Voir `python scripts/install.py --help`.

## Ajouter un paquet
1. Copier `packages/exemple-skill/` vers `packages/<nom>/`.
2. Adapter `manifest.json`, `SKILL.md`, `README.md`, `tests/cas.md`.
3. Lancer `python scripts/build_catalog.py`.
4. Ouvrir une branche et demander une relecture (voir `CONTRIBUTING.md`).

## Statut
Squelette initial. Les chemins d'installation par assistant n'ont pas été vérifiés en conditions réelles.
