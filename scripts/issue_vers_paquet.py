"""Transforme une issue « Proposer un paquet » en pull request.

Entrées (variables d'environnement, jamais interpolées dans un shell) :
  ISSUE_BODY, ISSUE_NUMBER, ISSUE_AUTHOR, GH_TOKEN (+ GITHUB_REPOSITORY)
Le contenu de l'issue n'est traité que comme du texte : il est validé, écrit dans des
fichiers, puis relu par un humain dans la pull request avant toute fusion.
"""
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent

# Libellés du formulaire .github/ISSUE_TEMPLATE/proposer-un-paquet.yml (un test les compare).
L_NOM = "Nom du paquet"
L_TYPE = "Type"
L_DESC = "À quoi sert-il ?"
L_CONTENU = "Contenu proposé"
L_ASSISTANTS = "Assistants prévus"
LIBELLES = [L_NOM, L_TYPE, L_DESC, L_CONTENU, L_ASSISTANTS, "Vérifications"]

TYPES = {"skill": "SKILL.md", "agent": "AGENT.md", "connecteur": "CONNECTEUR.md"}
ASSISTANTS = {"claude": "claude", "copilot": "copilot", "opencode": "opencode"}
RE_NOM = re.compile(r"^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$")
RE_LOGIN = re.compile(r"^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$")
MAX_CONTENU = 50_000


class ErreurIssue(Exception):
    """Issue inexploitable ; le message est renvoyé à son auteur."""

    def __init__(self, messages):
        self.messages = list(messages)
        super().__init__("; ".join(self.messages))


def analyser(corps: str) -> dict:
    """Découpe le corps d'une issue de formulaire GitHub (« ### Libellé » puis valeur).

    Seuls les libellés connus ouvrent une section : un « ### » dans le contenu proposé
    (titres Markdown d'un skill) ne coupe donc pas le texte.
    """
    sections, courant = {}, None
    for ligne in corps.replace("\r\n", "\n").split("\n"):
        m = re.match(r"^### (.+?)\s*$", ligne)
        if m and m.group(1) in LIBELLES:
            courant = m.group(1)
            sections[courant] = []
        elif courant is not None:
            sections[courant].append(ligne)
    resultat = {}
    for cle, lignes in sections.items():
        valeur = "\n".join(lignes).strip()
        resultat[cle] = "" if valeur == "_No response_" else valeur
    return resultat


def _assistants_coches(texte: str) -> list:
    coches = re.findall(r"^- \[[xX]\] (.+?)\s*$", texte, flags=re.M)
    return [ASSISTANTS[c.lower()] for c in coches if c.lower() in ASSISTANTS]


def construire(sections: dict, auteur: str, numero: int, racine: Path = RACINE) -> Path:
    """Écrit packages/<nom>/ ; lève ErreurIssue si l'issue est incomplète ou invalide."""
    erreurs = []
    nom = sections.get(L_NOM, "").strip()
    type_ = sections.get(L_TYPE, "").strip().lower()
    description = re.sub(r"\s+", " ", sections.get(L_DESC, "")).strip()
    contenu = sections.get(L_CONTENU, "").strip()
    assistants = _assistants_coches(sections.get(L_ASSISTANTS, ""))

    if not RE_NOM.match(nom):
        erreurs.append(f"Nom invalide : « {nom[:60]} » (3 à 50 caractères, minuscules, chiffres et tirets).")
    if type_ not in TYPES:
        erreurs.append(f"Type invalide : « {type_[:30]} » (skill, agent ou connecteur).")
    if len(description) < 10:
        erreurs.append("La description est trop courte (au moins 10 caractères).")
    if not assistants:
        erreurs.append("Cochez au moins un assistant.")
    if len(contenu) > MAX_CONTENU:
        erreurs.append(f"Le contenu dépasse {MAX_CONTENU} caractères.")
    if not RE_LOGIN.match(auteur or ""):
        erreurs.append("Identifiant d'auteur inexploitable.")
    if not erreurs and (racine / "packages" / nom).exists():
        erreurs.append(f"Un paquet nommé « {nom} » existe déjà.")
    if erreurs:
        raise ErreurIssue(erreurs)

    fichier = TYPES[type_]
    if not contenu:
        contenu = f"# {nom}\n\nÀ rédiger : {description}\n"
    if not contenu.startswith("---"):
        contenu = f"---\nname: {nom}\ndescription: {json.dumps(description, ensure_ascii=False)}\n---\n\n{contenu}\n"
    elif not contenu.endswith("\n"):
        contenu += "\n"

    dossier = racine / "packages" / nom
    (dossier / "tests").mkdir(parents=True)
    manifeste = {
        "name": nom,
        "version": "0.1.0",
        "type": type_,
        "author": auteur,
        "description": description[:300],
        "tags": ["propose"],
        "assistants": assistants,
        "entry": fichier,
    }
    (dossier / "manifest.json").write_text(json.dumps(manifeste, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (dossier / fichier).write_text(contenu, encoding="utf-8")
    (dossier / "README.md").write_text(
        f"# {nom}\n\n{description}\n\n## Historique\n"
        f"- 0.1.0 : proposé via l'issue #{numero} par {auteur}. Non testé : à vérifier à la relecture.\n",
        encoding="utf-8",
    )
    (dossier / "tests" / "cas.md").write_text(
        "# Cas d'essai\n\nÀ compléter à la relecture (au moins un cas, puis consigner le résultat d'un essai réel).\n",
        encoding="utf-8",
    )
    return dossier


def valider(racine: Path = RACINE):
    """Lance la validation du catalogue (formats, doublons, contenus sensibles)."""
    r = subprocess.run(
        [sys.executable, str(racine / "scripts" / "build_catalog.py")],
        capture_output=True, text=True, encoding="utf-8", errors="replace",
    )
    return r.returncode == 0, (r.stdout + r.stderr).strip()


# --- Partie GitHub (non exécutée par les tests) -------------------------------------

def _run(*args, check=True, **kw):
    return subprocess.run(list(args), check=check, text=True, encoding="utf-8", **kw)


def _commenter(numero, texte):
    _run("gh", "issue", "comment", str(numero), "--body", texte)


def main():
    corps = os.environ.get("ISSUE_BODY", "")
    numero = int(os.environ["ISSUE_NUMBER"])
    auteur = os.environ.get("ISSUE_AUTHOR", "")
    depot = os.environ.get("GITHUB_REPOSITORY", "ThibautGRAS/AISearch")

    try:
        sections = analyser(corps)
        dossier = construire(sections, auteur, numero)
    except ErreurIssue as e:
        _commenter(numero, "Je n'ai pas pu créer le paquet :\n\n" + "\n".join(f"- {m}" for m in e.messages)
                   + "\n\nModifiez l'issue ou ouvrez-en une nouvelle avec le formulaire.")
        print("Issue refusée :", e)
        return 0

    nom = dossier.name
    ok, sortie = valider()
    if not ok:
        shutil.rmtree(dossier)
        _commenter(numero, "Le paquet n'a pas passé la validation automatique :\n\n```\n" + sortie[-1500:]
                   + "\n```\n\nCorrigez le contenu (aucun e-mail, chemin personnel ou secret n'est accepté) puis rouvrez une issue.")
        print("Validation échouée :", sortie)
        return 0

    branche = f"paquet/{nom}-issue-{numero}"
    _run("git", "config", "user.name", "github-actions[bot]")
    _run("git", "config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com")
    _run("git", "checkout", "-b", branche)
    _run("git", "add", f"packages/{nom}")
    _run("git", "commit", "-m", f"Ajoute le paquet {nom} (issue #{numero})")
    _run("git", "push", "origin", branche)

    titre = f"Ajouter le paquet {nom}"
    corps_pr = (f"Créée automatiquement depuis l'issue #{numero} (auteur : @{auteur}).\n\n"
                "À relire avant fusion : contenu, description, absence de données internes, essai réel dans un assistant.\n\n"
                f"Ferme #{numero}")
    pr = _run("gh", "pr", "create", "--base", "main", "--head", branche, "--title", titre, "--body", corps_pr,
              check=False, capture_output=True)
    if pr.returncode == 0:
        _commenter(numero, f"Merci ! J'ai préparé le paquet `{nom}` : {pr.stdout.strip()}\nIl sera relu avant d'apparaître dans le catalogue.")
    else:
        lien = f"https://github.com/{depot}/compare/main...{branche.replace('/', '%2F')}?expand=1"
        _commenter(numero, f"J'ai préparé la branche `{branche}` avec le paquet `{nom}`, mais je n'ai pas pu ouvrir la pull request "
                           f"automatiquement (réglage « Allow GitHub Actions to create pull requests » désactivé ?). "
                           f"Ouvrez-la ici : {lien}")
        print("PR non créée :", pr.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
