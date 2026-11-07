# Contribuer

## Flux
- Toute modification de `main` passe par une pull request (depuis un fork ou une branche) ; chaque fusion republie le site.
- Sans Git : l'onglet *Issues* propose un formulaire « Proposer un paquet ».
- Une branche par paquet ou changement, relue par l'autre personne avant fusion.
- Versionnage `MAJEUR.MINEUR.CORRECTIF` dans `manifest.json`, changement noté dans le README du paquet.

## Checklist de revue
- [ ] Aucun secret, jeton, chemin personnel.
- [ ] `manifest.json` complet (nom, version, type, auteur, description, assistants).
- [ ] Description claire : quand utiliser le paquet, quand ne pas l'utiliser.
- [ ] Au moins un cas d'essai dans `tests/` et un exemple d'usage dans le README.
- [ ] Testé sur au moins un assistant ; ne pas déclarer un assistant compatible sans l'avoir essayé.
- [ ] `catalog.json` régénéré.
