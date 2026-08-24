# Roadmap — Ultimate Playbook

Ce document découpe le MVP (voir `docs/PRD.md`) en phases séquentielles, chacune en tâches actionnables par un agent (ou un humain) une par une. Chaque tâche cochée doit correspondre à un commit (ou une PR) cohérent.

Convention : cocher une case au fur et à mesure de l'avancement. Si une tâche impose un écart par rapport à `docs/ARCHITECTURE.md` ou `docs/DATA_MODEL.md`, documenter la décision dans le journal de décisions (`docs/ARCHITECTURE.md` §7) avant de continuer.

## Phase 0 — Bootstrap technique

- [x] Scaffold Vite + React + TypeScript.
- [x] Installer et configurer : `react-konva`/`konva`, `zustand`, `react-i18next`, `vitest` + Testing Library, ESLint + Prettier.
- [x] Mettre en place la structure de dossiers cible (`docs/ARCHITECTURE.md` §2).
- [x] Config `vite.config.ts` avec `base: '/ultimate-playbook/'`.
- [x] Workflow GitHub Actions : build + déploiement sur GitHub Pages au push sur `main`.
- [x] i18n : structure `src/i18n/fr.json` avec quelques clés de test, langue par défaut FR.
- [x] Page d'accueil minimale ("Ultimate Playbook" + placeholder) qui build et déploie correctement, pour valider toute la chaîne avant d'attaquer les features. *(déployée : https://ludodem.github.io/ultimate-playbook/)*

## Phase 1 — Modèle de données & presets

- [ ] Implémenter les types TS de `docs/DATA_MODEL.md` (`FieldConfig`, `Entity`, `Frame`, `Disc`, `Action`).
- [ ] Implémenter les presets de terrain (`half`, `full`, `undefined`) avec valeurs par défaut indoor.
- [ ] Implémenter les presets d'effectif : `empty`, `5v5-vertical-stack`, `5v5-horizontal-stack`.
- [ ] Tests unitaires sur les presets (nombre d'entités générées, cohérence des positions dans [0,100]).

## Phase 2 — Rendu statique du terrain

- [ ] Composant `Field` (Konva Stage/Layer) qui dessine le terrain selon `FieldConfig` (lignes, en-buts si applicable), responsive (resize observer).
- [ ] Rendu des entités (cercles colorés par équipe, label) et du disque depuis une `Frame` statique passée en props.
- [ ] Validation manuelle : afficher un preset 5v5 stack vertical sur PC + émulateur mobile/tablette.

## Phase 3 — Édition des positions

- [ ] Drag & drop d'une entité (souris + tactile via pointer events), mise à jour du store.
- [ ] Ajout / suppression d'une entité (choix de l'équipe), sans limite basse, avertissement au-delà du seuil haut recommandé.
- [ ] Sélection du porteur du disque (assignation `heldBy`) ou position libre du disque.
- [ ] Undo/redo sur les actions d'édition (pile d'historique des frames).
- [ ] Mode d'interaction alternatif pour petits écrans (sélectionner puis taper la destination, en plus du drag classique).

## Phase 4 — Gestion des frames (timeline)

- [ ] Bande de vignettes représentant les frames de l'action courante.
- [ ] Créer une nouvelle frame par duplication de la frame courante.
- [ ] Réordonner / dupliquer / supprimer une frame.
- [ ] Annotation texte libre par frame.

## Phase 5 — Mode lecture (Play)

- [ ] Fonction pure d'interpolation entre deux frames (`src/domain/interpolation.ts`) + tests unitaires.
- [ ] Mode "pas à pas" : navigation précédent/suivant.
- [ ] Mode "fluide" : lecture animée avec `requestAnimationFrame`, vitesse réglable.
- [ ] Affichage des flèches de trajectoire entre deux frames consécutives (distinction course de joueur / passe de disque).

## Phase 6 — Trajectoire courbe du disque

Fait partie du périmètre MVP (voir `docs/PRD.md` §4.5) mais s'implémente comme une couche indépendante par-dessus la Phase 5 : le MVP reste pleinement fonctionnel (en ligne droite) sans cette phase, elle peut donc être livrée séparément/plus tard sans bloquer le reste.

- [ ] Étendre le modèle `Frame` avec `incomingCurves` (voir `docs/DATA_MODEL.md` §8).
- [ ] Fonctions pures `lerp` et `quadraticBezier` dans `src/domain/interpolation.ts` + tests unitaires, et bascule de `interpolate` entre les deux selon la présence d'une entrée `incomingCurves` pour l'entité/le disque concerné.
- [ ] UI d'édition : affichage du disque "fantôme" de la frame précédente relié par une ligne pointillée à sa position sur la frame courante, avec une poignée de contrôle draggable au milieu (identique à l'interaction de déplacement d'une entité).
- [ ] L'affordance de courbure n'apparaît que si la position du disque change réellement entre les deux frames.
- [ ] Bouton de réinitialisation ("trajectoire rectiligne") qui supprime l'entrée `incomingCurves.disc`.
- [ ] Mise à jour du rendu des flèches de trajectoire (mode lecture) pour dessiner la courbe réelle (Bézier) plutôt qu'une ligne droite quand un point de contrôle est défini.

## Phase 7 — Persistance locale

- [ ] `libraryStore` : sauvegarde/chargement des actions en localStorage (clé namespacée, voir `docs/DATA_MODEL.md` §6).
- [ ] Export d'une action en fichier JSON téléchargeable.
- [ ] Import d'un fichier JSON avec validation de schéma (`schemaVersion`, champs obligatoires) et message d'erreur clair si invalide.
- [ ] Test de non-régression : créer une action, recharger la page, vérifier qu'elle est toujours présente.

## Phase 8 — Responsive & polish tactile

- [ ] Vérification et ajustement de l'UI sur les trois formats cibles (PC, tablette, smartphone).
- [ ] Tailles de cibles tactiles suffisantes (boutons, poignées de drag).
- [ ] Passage en revue des critères de succès du MVP (`docs/PRD.md` §7).

---

## Post-MVP (hors périmètre immédiat — à re-découper en phases le moment venu)

- Bibliothèque hiérarchisée d'actions (dossiers + tags, recherche/filtre).
- Duplication d'une action existante comme point de départ d'une variante.
- Mode présentation plein écran (déroulé de plusieurs actions à la suite).
- Export PNG/PDF d'une frame ou de l'action complète ; export GIF/vidéo de l'animation.
- Partage en lecture seule via lien (nécessite un backend, ex. Supabase).
- Annotations libres façon "télé-strator" (flèches/zones à main levée).
- Trajectoires courbes pour les **déplacements de joueurs** (le mécanisme `incomingCurves` est déjà générique, cf. `docs/DATA_MODEL.md` §8 — seule l'UI d'édition pour les joueurs reste à faire ; la trajectoire courbe du disque est en Phase 6, dans le MVP).
- PWA (installable, utilisable hors-ligne) — pertinent tôt vu l'usage "bord de terrain", à réévaluer en priorité juste après le MVP plutôt qu'en fin de liste.
