"""Installe un paquet du catalogue vers un assistant.

Les chemins de TARGETS sont des hypothèses, à vérifier avant usage réel.
"""
import argparse
import json
import shutil
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent

# cible -> (dossier relatif dans le projet, mode)
#   "dossier" : copie le paquet dans <dossier>/<nom>/
#   "fichier" : copie le fichier d'entrée vers <dossier>/<nom><suffixe>
TARGETS = {
    "claude": (".claude/skills", "dossier", ""),
    "copilot": (".github/prompts", "fichier", ".prompt.md"),
    "opencode": (".opencode/agent", "fichier", ".md"),
}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("paquet")
    p.add_argument("--cible", required=True, choices=sorted(TARGETS))
    p.add_argument("--dest", default=".", help="racine du projet cible (défaut : dossier courant)")
    a = p.parse_args()

    src = RACINE / "packages" / a.paquet
    manifeste = src / "manifest.json"
    if not manifeste.exists():
        raise SystemExit(f"Paquet introuvable : {a.paquet}")
    info = json.loads(manifeste.read_text(encoding="utf-8"))
    if a.cible not in info.get("assistants", []):
        raise SystemExit(f"{a.paquet} ne déclare pas la cible {a.cible}")

    dossier, mode, suffixe = TARGETS[a.cible]
    base = Path(a.dest) / dossier
    base.mkdir(parents=True, exist_ok=True)
    if mode == "dossier":
        cible = base / a.paquet
        shutil.copytree(src, cible, dirs_exist_ok=True)
    else:
        cible = base / f"{a.paquet}{suffixe}"
        shutil.copyfile(src / info["entry"], cible)
    print(f"Installé : {cible}")


if __name__ == "__main__":
    main()
