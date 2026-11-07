"""Régénère catalog.json à partir des manifest.json de packages/."""
import json
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
CHAMPS = ["name", "version", "type", "author", "description", "assistants"]


def main():
    paquets = []
    for manifeste in sorted((RACINE / "packages").glob("*/manifest.json")):
        donnees = json.loads(manifeste.read_text(encoding="utf-8"))
        manquants = [c for c in CHAMPS if c not in donnees]
        if manquants:
            raise SystemExit(f"{manifeste}: champs manquants {manquants}")
        donnees["path"] = f"packages/{manifeste.parent.name}"
        paquets.append(donnees)
    sortie = RACINE / "catalog.json"
    sortie.write_text(json.dumps({"packages": paquets}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(paquets)} paquet(s) -> {sortie.name}")


if __name__ == "__main__":
    main()
