"""Tests de issue_vers_paquet.py : python -m unittest discover -s scripts"""
import json
import re
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import issue_vers_paquet as ivp  # noqa: E402

RACINE = Path(__file__).resolve().parent.parent

CORPS = """### Nom du paquet

redaction-rapport

### Type

skill

### À quoi sert-il ?

Aide à rédiger
un rapport structuré.

### Contenu proposé

# Rédiger un rapport

### Étape 1

Lire le brief.

### Assistants prévus

- [x] Claude
- [ ] Copilot
- [X] OpenCode

### Vérifications

- [x] Le contenu ne contient aucun secret ni donnée interne.
"""


class Base(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        shutil.copytree(RACINE / "scripts", self.tmp / "scripts", ignore=shutil.ignore_patterns("__pycache__"))
        shutil.copytree(RACINE / "packages", self.tmp / "packages")
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)


class TestAnalyse(unittest.TestCase):
    def test_sections_et_titres_markdown_conserves(self):
        s = ivp.analyser(CORPS)
        self.assertEqual(s[ivp.L_NOM], "redaction-rapport")
        self.assertEqual(s[ivp.L_TYPE], "skill")
        self.assertIn("### Étape 1", s[ivp.L_CONTENU])  # un « ### » du contenu ne coupe pas la section
        self.assertIn("Lire le brief.", s[ivp.L_CONTENU])
        self.assertEqual(ivp._assistants_coches(s[ivp.L_ASSISTANTS]), ["claude", "opencode"])

    def test_pas_de_reponse(self):
        s = ivp.analyser("### Contenu proposé\n\n_No response_\n")
        self.assertEqual(s[ivp.L_CONTENU], "")

    def test_crlf(self):
        s = ivp.analyser(CORPS.replace("\n", "\r\n"))
        self.assertEqual(s[ivp.L_NOM], "redaction-rapport")

    def test_libelles_identiques_au_formulaire(self):
        yml = (RACINE / ".github" / "ISSUE_TEMPLATE" / "proposer-un-paquet.yml").read_text(encoding="utf-8")
        libelles = re.findall(r"^\s+label: (?![A-Z][a-z]+$|Claude|Copilot|OpenCode)(.+)$", yml, flags=re.M)
        for l in ivp.LIBELLES:
            self.assertIn(f"label: {l}", yml, f"« {l} » absent du formulaire")


class TestConstruire(Base):
    def test_cree_un_paquet_valide(self):
        dossier = ivp.construire(ivp.analyser(CORPS), "ami-gh", 7, self.tmp)
        m = json.loads((dossier / "manifest.json").read_text(encoding="utf-8"))
        self.assertEqual(m["assistants"], ["claude", "opencode"])
        self.assertEqual(m["author"], "ami-gh")
        self.assertNotIn("tests", m)  # jamais de compatibilité « testée » sans essai réel
        entree = (dossier / "SKILL.md").read_text(encoding="utf-8")
        self.assertTrue(entree.startswith("---\nname: redaction-rapport"))
        ok, sortie = ivp.valider(self.tmp)
        self.assertTrue(ok, sortie)
        cat = json.loads((self.tmp / "catalog.json").read_text(encoding="utf-8"))
        self.assertIn("redaction-rapport", [p["name"] for p in cat["packages"]])

    def test_contenu_vide_genere_un_squelette(self):
        s = ivp.analyser(CORPS)
        s[ivp.L_CONTENU] = ""
        dossier = ivp.construire(s, "ami-gh", 7, self.tmp)
        self.assertIn("À rédiger", (dossier / "SKILL.md").read_text(encoding="utf-8"))
        self.assertTrue(ivp.valider(self.tmp)[0])

    def test_noms_dangereux_refuses(self):
        for nom in ["../evil", "a/b", "A-Majuscule", "x", "-debut", "fin-", "a b", "..", "nom\n### Type"]:
            s = ivp.analyser(CORPS)
            s[ivp.L_NOM] = nom
            with self.assertRaises(ivp.ErreurIssue, msg=nom):
                ivp.construire(s, "ami-gh", 1, self.tmp)
        self.assertEqual(sorted(p.name for p in (self.tmp / "packages").iterdir()),
                         sorted(p.name for p in (RACINE / "packages").iterdir()))

    def test_champs_invalides(self):
        cas = [(ivp.L_TYPE, "robot"), (ivp.L_DESC, "court"), (ivp.L_ASSISTANTS, "- [ ] Claude")]
        for cle, valeur in cas:
            s = ivp.analyser(CORPS)
            s[cle] = valeur
            with self.assertRaises(ivp.ErreurIssue, msg=cle):
                ivp.construire(s, "ami-gh", 1, self.tmp)

    def test_auteur_invalide(self):
        for auteur in ["", "a b", "x;rm -rf", "-x", "$(id)"]:
            with self.assertRaises(ivp.ErreurIssue, msg=auteur):
                ivp.construire(ivp.analyser(CORPS), auteur, 1, self.tmp)

    def test_doublon_refuse(self):
        s = ivp.analyser(CORPS)
        s[ivp.L_NOM] = "exemple-skill"
        with self.assertRaises(ivp.ErreurIssue):
            ivp.construire(s, "ami-gh", 1, self.tmp)

    def test_contenu_trop_long(self):
        s = ivp.analyser(CORPS)
        s[ivp.L_CONTENU] = "x" * (ivp.MAX_CONTENU + 1)
        with self.assertRaises(ivp.ErreurIssue):
            ivp.construire(s, "ami-gh", 1, self.tmp)


class TestContenuSensible(Base):
    def test_validation_bloque_les_donnees_sensibles(self):
        for secret in ["contact : prenom.nom@exemple.fr", "voir C:\\Users\\moi\\doc", "ghp_" + "a" * 30]:
            s = ivp.analyser(CORPS)
            s[ivp.L_CONTENU] = f"# Titre\n\n{secret}\n"
            dossier = ivp.construire(s, "ami-gh", 1, self.tmp)
            ok, sortie = ivp.valider(self.tmp)
            self.assertFalse(ok, secret)
            self.assertIn("redaction-rapport", sortie)
            shutil.rmtree(dossier)


if __name__ == "__main__":
    unittest.main()
