# Architecture — Ultimate Playbook

## 1. Stack technique

| Domaine          | Choix                        | Justification                                                                                                                                           |
| ---------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build tool       | **Vite**                     | Démarrage rapide, config simple, bon support GitHub Pages via `base`.                                                                                   |
| UI               | **React 18 + TypeScript**    | Écosystème large, typage utile pour un modèle de données structuré (frames, entités).                                                                   |
| Rendu terrain    | **Konva.js** (`react-konva`) | Gère nativement drag & drop, pointer events (souris + tactile), animation/tween — correspond exactement au besoin (édition + lecture pas-à-pas/fluide). |
| State management | **Zustand**                  | Léger, suffisant pour l'état d'édition + bibliothèque locale, pas besoin de Redux.                                                                      |
| i18n             | **react-i18next**            | Structure en place dès le MVP (FR complet, EN en fallback FR), voir PRD §4.6.                                                                           |
| Tests unitaires  | **Vitest** + Testing Library | Cohérent avec Vite, rapide.                                                                                                                             |
| Lint / format    | **ESLint + Prettier**        | Standard.                                                                                                                                               |
| Hébergement MVP  | **GitHub Pages**             | Statique, gratuit, suffisant tant qu'il n'y a pas de backend.                                                                                           |

Aucun backend au MVP (voir `docs/PRD.md` §4.5). L'architecture doit rester **agnostique de l'hébergement** : pas de dépendance à une spécificité GitHub Pages dans le code applicatif (le `base` path et le workflow de déploiement sont isolés dans la config Vite / CI, pas dans le code métier), pour permettre une migration facile vers Netlify/Vercel/Supabase Hosting plus tard.

## 2. Structure de projet (cible)

```
ultimate-playbook/
├── docs/                      # ce dossier — spécifications
├── public/
├── src/
│   ├── domain/                # modèles TS + logique pure (pas de dépendance React)
│   │   ├── models.ts          # Action, Frame, Entity, FieldConfig, Disc...
│   │   ├── presets/            # terrain (dimensions + couleurs par défaut) et effectif (5v5 stack V/H, empty...)
│   │   └── interpolation.ts   # calcul des positions interpolées entre 2 frames
│   ├── state/                 # stores Zustand
│   │   ├── actionEditorStore.ts
│   │   └── libraryStore.ts    # persistance locale des actions sauvegardées
│   ├── components/
│   │   ├── field/              # rendu Konva du terrain + entités
│   │   ├── editor/              # UI d'édition (timeline de frames, panneau d'ajout de joueur...)
│   │   └── playback/            # contrôles de lecture (pas à pas / fluide, vitesse)
│   ├── i18n/
│   │   └── fr.json
│   ├── pages/                  # écrans (édition, lecture) si routing simple nécessaire
│   ├── App.tsx
│   └── main.tsx
├── docs/ROADMAP.md
├── CLAUDE.md
├── vite.config.ts
└── package.json
```

## 3. Rendu du terrain (approche technique)

- Un `Stage` Konva dimensionné via un conteneur responsive (observation du `ResizeObserver` du parent), qui calcule un ratio pixels/pourcentage à chaque redimensionnement.
- Le terrain (lignes, en-buts) est dessiné à partir de `FieldConfig` (proportions **et couleurs**, jamais de valeurs en dur dans les composants) : `resolveFieldColors(config.colors)` retourne les couleurs personnalisées si présentes, sinon `DEFAULT_FIELD_COLORS` (gris terrain / bleu en-but / gris ardoise pour les lignes — voir `docs/DATA_MODEL.md`).
- Chaque `Entity` est un `Circle` Konva draggable ; le `Disc` un `Circle` plus petit, draggable seulement si non lié à un joueur (`heldBy` absent).
- Les flèches de trajectoire (mode lecture) sont calculées à partir de deux frames consécutives : ligne droite au MVP (voir PRD, courbes bézier en post-MVP).

## 4. Interpolation (mode fluide)

- Fonction pure `interpolate(frameA, frameB, t: number): Frame` dans `src/domain/interpolation.ts`, indépendante de React/Konva → testable unitairement.
- Le contrôleur de lecture pilote `t` via `requestAnimationFrame`, en respectant `transitionMs` (par frame) et `speedMultiplier`.
- Pour chaque entité/disque du segment, `interpolate` choisit entre deux fonctions selon la présence d'une entrée dans `frameB.incomingCurves` (voir `docs/DATA_MODEL.md` §8) :
  - `lerp(p0, p1, t)` — comportement par défaut, ligne droite.
  - `quadraticBezier(p0, controlPoint, p1, t)` — utilisée uniquement pour l'entité/le disque concerné par une entrée `incomingCurves`, sans affecter les autres entités du même segment.
- Ces deux fonctions vivent aussi dans `src/domain/interpolation.ts`, pures et testées indépendamment.

## 5. Persistance

- `libraryStore.ts` encapsule toute la lecture/écriture localStorage (voir `docs/DATA_MODEL.md` §6) : aucun composant ne doit accéder à `localStorage` directement.
- Export/Import JSON : fonctions pures de sérialisation/validation, réutilisables telles quelles si un backend est ajouté plus tard (le format d'échange ne change pas).

## 6. Déploiement (GitHub Pages)

- GitHub Actions : build Vite (`base: '/ultimate-playbook/'`) sur push sur `main`, déploiement via `actions/deploy-pages` (ou `peaceiris/actions-gh-pages`).
- Le `base` path et toute config d'hébergement vivent uniquement dans `vite.config.ts` / le workflow CI — jamais codés en dur ailleurs dans l'app (voir principe d'agnosticisme d'hébergement ci-dessus).

## 7. Arborescence de frames (branches)

Voir `docs/DATA_MODEL.md` §9 pour le modèle de données (un arbre, pas une liste). Côté code :

- `src/domain/tree.ts` (pur, testé, indépendant de React/Konva) : `getChildren(frames, parentId)`, `getRootFrame(frames)`, `isForkFrame(frames, frameId)` (plus d'un enfant), `resolvePath(frames, choices)` — suit l'arbre depuis la racine en résolvant chaque embranchement via une map `{ frameId d'embranchement → id de l'enfant choisi }`.
- Éditeur (Phase 4) : deux actions distinctes dans l'UI — "frame suivante" (continuation simple, crée un unique enfant) vs "ajouter une option depuis cette frame" (crée un second enfant, `branchLabel` obligatoire ; si le parent n'avait qu'un seul enfant jusque-là, celui-ci doit être labellisé rétroactivement au moment où le fork est créé, puisqu'un parent à plusieurs enfants exige un `branchLabel` sur chacun). La timeline se scinde visuellement en pistes parallèles à partir d'un embranchement (façon graphe de commits), chaque piste étiquetée par son `branchLabel`, plutôt qu'une simple bande linéaire — composant sensiblement plus complexe qu'un filmstrip.
- Lecture (Phase 5) : pas à pas → choix inline entre les `branchLabel` disponibles à un embranchement (au lieu d'un bouton "suivant" unique) ; fluide → sélection d'un chemin complet via `resolvePath` avant de lancer l'animation, jamais d'interruption en cours de lecture.

## 8. Journal de décisions

À compléter au fil du projet (format court : date, décision, raison). Sert de mémoire pour les agents qui reprennent le projet plus tard.

- **2026-08-24** — Choix du modèle d'action par **keyframes/snapshots** plutôt qu'un mode "enregistrement" en temps réel : plus simple à éditer, correspond nativement au besoin de lecture pas-à-pas, et rend l'interpolation fluide triviale à calculer.
- **2026-08-24** — Konva/react-konva retenu plutôt que SVG "à la main" ou Canvas brut : gère drag & drop, tactile et animation nativement, évite de réimplémenter ces briques.
- **2026-08-24** — Pas de backend au MVP : persistance locale + export/import JSON, pour rester déployable en statique pur (GitHub Pages) et utilisable hors-ligne.
- **2026-08-24** — Trajectoire courbe du disque intégrée au périmètre MVP (déplacée depuis le hors-scope), modélisée par un point de contrôle de Bézier quadratique par segment plutôt qu'une cubique ou un dessin libre : la contrainte "facile à éditer" prime, et un seul point réutilise l'interaction de drag déjà présente sur les entités. Structure générique (`incomingCurves`, cf. `docs/DATA_MODEL.md` §8) pour pouvoir étendre aux joueurs plus tard sans migration. Implémentation isolée en Phase 6 de `docs/ROADMAP.md`, indépendante du reste du MVP.
- **2026-08-24** — Couleurs par défaut du terrain fixées à gris (`#D9DBDE`) + bleu en-but (`#3D6FB4`) + lignes gris ardoise (`#4B4F58`) : neutre pour le terrain (ne concurrence pas les entités colorées), convention indoor pour l'en-but. Stockées comme un objet `colors?` optionnel sur `FieldConfig` avec fallback vers `DEFAULT_FIELD_COLORS`, pour rester configurables sans changement de schéma même si l'UI de personnalisation n'arrive qu'après le MVP.
- **2026-08-24** — `Action.frames` remodélisé en **arbre** (`parentId`/`siblingOrder`/`branchLabel` plutôt qu'un simple `order`) pour supporter les plays à embranchements (ex. sortie de ligne avec choix around/strike), un cas jugé courant et non un edge case. Fusion de branches (DAG) explicitement exclue : un arbre pur reste beaucoup plus simple à éditer et à lire. Décidé avant toute persistance/export réel, donc pas de migration nécessaire (schéma révisé directement, `schemaVersion` inchangé). Contrairement à la trajectoire courbe du disque, ce changement touche le schéma central dès la Phase 1/2 déjà codées ; un correctif rétroactif de `src/domain/models.ts` et de la démo Phase 2 est nécessaire avant d'attaquer la Phase 4 (voir `docs/ROADMAP.md`).
