# CLAUDE.md — Instructions pour les agents IA

Ce fichier guide tout agent (Claude ou autre) qui implémente ce projet. Lis-le avant toute modification de code.

## Contexte du projet

Application web (Ultimate Frisbee) permettant d'éditer et de rejouer des actions tactiques sous forme de séquences de positions ("frames"). Voir en priorité :

1. `docs/PRD.md` — ce qu'il faut construire et pourquoi (scope MVP, hors-scope).
2. `docs/DATA_MODEL.md` — les structures de données exactes à utiliser.
3. `docs/ARCHITECTURE.md` — stack technique, structure de dossiers, décisions déjà prises.
4. `docs/ROADMAP.md` — le découpage en tâches ; travaille phase par phase, dans l'ordre, sauf indication contraire de l'utilisateur.

Ne redécide pas des points déjà tranchés dans ces documents (stack, modèle de données, choix du modèle keyframes) sans en discuter explicitement — ce sont des décisions produit déjà validées.

## Conventions

- **Code** (variables, fonctions, commentaires techniques, noms de fichiers) : **en anglais**.
- **Contenu utilisateur** (textes affichés dans l'UI) : **en français**, via `react-i18next` (clés d'i18n en anglais, valeurs en français). Ne jamais coder un texte affiché en dur dans un composant — toujours passer par une clé i18n, même au MVP.
- **Documentation du projet** (`README.md`, `docs/*.md`) : en français.
- Types stricts : TypeScript en mode strict, pas de `any` sauf cas exceptionnel justifié en commentaire.
- Logique métier pure (interpolation, presets, validation) séparée de React/Konva dans `src/domain/`, testable sans monter de composant.

## Workflow attendu

1. Avant d'implémenter une tâche de `docs/ROADMAP.md`, relire la section correspondante de `docs/PRD.md` et `docs/DATA_MODEL.md`.
2. Implémenter une tâche à la fois (pas plusieurs cases de la roadmap en un seul commit si évitable).
3. Cocher la case correspondante dans `docs/ROADMAP.md` une fois la tâche terminée et vérifiée.
4. Si une tâche impose de dévier des documents existants (modèle de données, stack, structure), consigner la décision et sa raison dans `docs/ARCHITECTURE.md` §7 (journal de décisions) avant de merger.
5. Ajouter/maintenir des tests unitaires pour toute logique dans `src/domain/` (interpolation, presets, validation d'import JSON).

## Contraintes non négociables (MVP)

- **Pas de backend.** Persistance = localStorage/IndexedDB + export/import JSON (voir `docs/DATA_MODEL.md` §6).
- **Pas de dépendance à GitHub Pages dans le code applicatif** — les spécificités d'hébergement restent confinées à `vite.config.ts` et au workflow CI, pour permettre une migration facile vers un autre hébergeur.
- **Responsive obligatoire** : toute UI ajoutée doit être vérifiée mentalement (ou testée) sur PC, tablette et smartphone.
- Le modèle d'action est **keyframes/snapshots**, pas un enregistrement de mouvement en temps réel (décision produit actée, voir `docs/ARCHITECTURE.md` §7).

## Commandes utiles (à mettre à jour une fois le projet scaffoldé en Phase 0)

```
npm install        # installation des dépendances
npm run dev         # serveur de dev local
npm run build        # build de production
npm run test         # tests unitaires (Vitest)
npm run lint         # ESLint
```
