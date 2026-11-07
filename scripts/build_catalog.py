"""Valide les paquets et génère le catalogue.

Sorties (racine du dépôt, puis copie dans site/public/) :
  - catalog.json : index léger (cartes de recherche)
  - contenu.json : textes complets (SKILL.md/AGENT.md + README), chargés à la demande
"""
import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
SCHEMA_VERSION = 1
CHAMPS = ["name", "version", "type", "author", "description", "assistants", "entry"]
TYPES = {"skill", "agent", "connecteur"}
ASSISTANTS = {"claude", "copilot", "opencode"}
RE_VERSION = re.compile(r"^\d+\.\d+\.\d+$")
RE_NOM = re.compile(r"^[a-z0-9][a-z0-9-]*$")
EXTENSIONS_TEXTE = {".md", ".json", ".txt", ".py", ".yaml", ".yml"}

# Motifs sensibles : le dépôt est public, rien de tout cela ne doit être publié.
MOTIFS_SENSIBLES = {
    "chemin Windows personnel": re.compile(r"[A-Za-z]:\\Users\\", re.I),
    "mention CETIM": re.compile(r"\bcetim\b", re.I),
    "adresse e-mail": re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+"),
    "jeton GitHub": re.compile(r"\bgh[pousr]_[A-Za-z0-9]{20,}"),
    "clé API": re.compile(r"\bsk-[A-Za-z0-9_-]{20,}"),
    "clé privée": re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----"),
}


def dates_git(dossier: Path):
    """(création, dernière modification) au format AAAA-MM-JJ, ou (None, None) hors Git."""
    def log(*args):
        r = subprocess.run(
            ["git", "log", "--format=%cs", *args, "--", str(dossier)],
            cwd=RACINE, capture_output=True, text=True,
        )
        return r.stdout.split() if r.returncode == 0 else []

    dates = log()
    return (dates[-1], dates[0]) if dates else (None, None)


def corps_markdown(texte: str) -> str:
    """Retire le front matter YAML éventuel."""
    if texte.startswith("---"):
        fin = texte.find("\n---", 3)
        if fin != -1:
            return texte[fin + 4:].lstrip()
    return texte


def extrait(texte: str, taille: int = 200) -> str:
    texte = re.sub(r"^#+\s*", "", corps_markdown(texte), flags=re.M)
    texte = re.sub(r"\s+", " ", texte).strip()
    return texte if len(texte) <= taille else texte[: taille - 1].rstrip() + "…"


def controler_sensibles(dossier: Path, erreurs: list):
    for f in dossier.rglob("*"):
        if f.is_file() and f.suffix.lower() in EXTENSIONS_TEXTE:
            texte = f.read_text(encoding="utf-8", errors="replace")
            for libelle, motif in MOTIFS_SENSIBLES.items():
                if motif.search(texte):
                    erreurs.append(f"{f.relative_to(RACINE)}: {libelle}")


def valider(d: dict, dossier: Path, erreurs: list):
    nom = dossier.name
    pre = f"packages/{nom}/manifest.json"
    for c in [c for c in CHAMPS if c not in d]:
        erreurs.append(f"{pre}: champ manquant « {c} »")
    if d.get("name") != nom:
        erreurs.append(f"{pre}: « name » ({d.get('name')}) différent du dossier ({nom})")
    if not RE_NOM.match(str(d.get("name", ""))):
        erreurs.append(f"{pre}: « name » doit être en minuscules, chiffres et tirets")
    if not RE_VERSION.match(str(d.get("version", ""))):
        erreurs.append(f"{pre}: « version » doit être au format x.y.z")
    if d.get("type") not in TYPES:
        erreurs.append(f"{pre}: « type » doit être parmi {sorted(TYPES)}")
    inconnus = set(d.get("assistants", [])) - ASSISTANTS
    if inconnus:
        erreurs.append(f"{pre}: assistants inconnus {sorted(inconnus)}")
    for t in d.get("tags", []):
        if t != t.lower():
            erreurs.append(f"{pre}: tag « {t} » doit être en minuscules")
    if "entry" in d and not (dossier / d["entry"]).exists():
        erreurs.append(f"{pre}: fichier d'entrée « {d['entry']} » introuvable")
    if not (dossier / "README.md").exists():
        erreurs.append(f"packages/{nom}: README.md manquant")


def main():
    erreurs, vus, entrees, contenus = [], set(), [], {}
    for manifeste in sorted((RACINE / "packages").glob("*/manifest.json")):
        dossier = manifeste.parent
        try:
            d = json.loads(manifeste.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            erreurs.append(f"{manifeste.relative_to(RACINE)}: JSON invalide ({e})")
            continue
        valider(d, dossier, erreurs)
        controler_sensibles(dossier, erreurs)
        if d.get("name") in vus:
            erreurs.append(f"nom en double : {d.get('name')}")
        vus.add(d.get("name"))
        if erreurs and not (dossier / d.get("entry", "")).exists():
            continue

        entree = dossier / d["entry"]
        texte_entree = entree.read_text(encoding="utf-8")
        readme = (dossier / "README.md").read_text(encoding="utf-8")
        cree, modifie = dates_git(dossier)
        tests = d.get("tests", {})  # {assistant: "AAAA-MM-JJ"} : uniquement les essais réels
        entrees.append({
            "name": d["name"],
            "version": d["version"],
            "type": d["type"],
            "author": d["author"],
            "description": d["description"],
            "tags": d.get("tags", []),
            "assistants": d["assistants"],
            "compatibilite": [{"assistant": a, "testeLe": tests.get(a)} for a in d["assistants"]],
            "extrait": extrait(texte_entree),
            "creeLe": cree,
            "modifieLe": modifie,
            "path": f"packages/{dossier.name}",
        })
        contenus[d["name"]] = {"entree": corps_markdown(texte_entree), "readme": readme}

    if erreurs:
        print("Validation échouée :")
        for e in erreurs:
            print(f"  - {e}")
        raise SystemExit(1)

    meta = {"schemaVersion": SCHEMA_VERSION, "genereLe": datetime.now(timezone.utc).isoformat(timespec="seconds")}
    catalogue = {**meta, "packages": entrees}
    contenu = {**meta, "contenus": contenus}
    for dossier_sortie in (RACINE, RACINE / "site" / "public"):
        if dossier_sortie.exists():
            for nom_fichier, data in (("catalog.json", catalogue), ("contenu.json", contenu)):
                (dossier_sortie / nom_fichier).write_text(
                    json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
                )
    print(f"{len(entrees)} paquet(s) validé(s) -> catalog.json, contenu.json")


if __name__ == "__main__":
    main()
