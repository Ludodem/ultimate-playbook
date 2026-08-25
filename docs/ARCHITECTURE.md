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

- Un `Stage` Konva dimensionné via un conteneur responsive (observation du `ResizeObserver` du parent), qui calcule un ratio pixels/pourcentage à chaque redimensionnement. Le `Stage` tient dans l'espace disponible en largeur **et** en hauteur (comme `object-fit: contain`, voir §8) : si le conteneur a une hauteur définie (ex. `.field-stage` dans une colonne flex) et que la hauteur "dérivée de la largeur" la dépasserait, la largeur est recalculée à partir de la hauteur disponible à la place.
- Le terrain (lignes, en-buts) est dessiné à partir de `FieldConfig` (proportions **et couleurs**, jamais de valeurs en dur dans les composants) : `resolveFieldColors(config.colors)` retourne les couleurs personnalisées si présentes, sinon `DEFAULT_FIELD_COLORS` (gris terrain / bleu en-but / gris ardoise pour les lignes / gris soutenu hors-ligne — voir `docs/DATA_MODEL.md`).
- **Marge sideline** (voir `docs/DATA_MODEL.md`, section "Marge sideline") : `computeVisibleXRangePercent(fieldConfig)` (dans `src/domain/geometry.ts`) renvoie la plage `{ min, max }` en % à rendre sur l'axe largeur — toujours une étendue de 100 points de pourcentage, décalée (`{marginPercent, 100+marginPercent}`) plutôt qu'élargie quand `sidelineMarginMeters > 0`, pour n'afficher qu'une seule sideline (celle du côté x=100). `toX` mappe cette plage — et non plus systématiquement `[0,100]` — sur la largeur du `Stage` ; le rectangle terrain, les en-buts et le contour de lignes sont dessinés sur `[toX(0), toX(100)]` uniquement (partiellement hors-canvas côté x=0 quand la marge est active), la zone hors-ligne (`colors.outOfBounds`) occupant le reste du canvas. Comme l'étendue de la plage reste toujours 100, `toX`/`toY` gardent la même échelle qu'en l'absence de marge : le rayon des entités/du disque (calculé par rapport à `width`, la largeur totale du `Stage`) ne dépend donc jamais du réglage de marge.
- Chaque `Entity` est un `Circle` Konva draggable ; le `Disc` un `Circle` plus petit, toujours draggable (position toujours libre — voir §8).
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
- **2026-08-24** — Marge sideline modélisée comme une **extension de la plage de coordonnées existante** (`x` peut sortir de `[0,100]`) plutôt qu'un système de coordonnées ou une vue alternative séparée : `x=0`/`x=100` gardent toujours le même sens (les lignes de touche réelles), donc un export JSON reste non-ambigu quel que soit le réglage d'affichage. `sidelineMarginMeters` (défaut `0`, aucun changement pour les actions qui n'en ont pas besoin) contrôle uniquement combien de cette plage étendue le rendu réserve visuellement. Cette même plage sert aussi de zone "draggable" pour le point de contrôle d'une trajectoire courbe (§8 de `docs/DATA_MODEL.md`), sans mécanisme séparé.
- **2026-08-24** — `Action.frames` remodélisé en **arbre** (`parentId`/`siblingOrder`/`branchLabel` plutôt qu'un simple `order`) pour supporter les plays à embranchements (ex. sortie de ligne avec choix around/strike), un cas jugé courant et non un edge case. Fusion de branches (DAG) explicitement exclue : un arbre pur reste beaucoup plus simple à éditer et à lire. Décidé avant toute persistance/export réel, donc pas de migration nécessaire (schéma révisé directement, `schemaVersion` inchangé). Contrairement à la trajectoire courbe du disque, ce changement touche le schéma central dès la Phase 1/2 déjà codées ; un correctif rétroactif de `src/domain/models.ts` et de la démo Phase 2 est nécessaire avant d'attaquer la Phase 4 (voir `docs/ROADMAP.md`).
- **2026-08-25** — Marge sideline revue après retour utilisateur : la première version étendait la plage visible symétriquement des deux côtés, ce qui rétrécissait tout le rendu (terrain + entités) pour tenir dans la même largeur de conteneur — jugé "stupide" (un play "longue ligne" ne concerne qu'un seul bord). Remplacé par une plage **décalée** plutôt qu'élargie (`[marginPercent, 100+marginPercent]`, toujours 100 points de pourcentage d'étendue) : une seule sideline visible, taille des entités/du terrain inchangée quel que soit le réglage, au prix d'un bord opposé du terrain qui sort du cadre visible (compromis jugé approprié vu l'usage ciblé). Le point de contrôle d'une trajectoire courbe (§7, `docs/DATA_MODEL.md` §8) profite du même changement sans modification supplémentaire.
- **2026-08-25** — `Disc.heldBy`/`Entity.hasDisc` retirés du modèle (Phase 8) : à l'usage, aucun joueur ne se déplace disque en main à l'Ultimate (le porteur est toujours à l'arrêt), donc "attacher" le disque à une entité n'apportait qu'un confort marginal (suivre la position si l'entité est repositionnée) contre un vrai coût UX — le disque tenu n'était pas draggable tant qu'on ne cliquait pas sur "Libérer le disque" (`!disc.heldBy` dans `DiscMarker.tsx`), ce qui créait un état bloquant confus. Le disque est désormais **toujours en position libre** (`Disc = { x: number; y: number }`, plus jamais optionnel), positionné uniquement par glisser-déposer direct ; les boutons "Donner le disque"/"Libérer le disque" et les actions `assignDiscTo`/`freeDisc` du store sont supprimés. Le décalage visuel du disque "en main" (pour ne pas masquer le label du porteur) continue de fonctionner sans changement : il était déjà basé sur la coïncidence de position (`findColocatedEntity`, voir la note Phase 5 ci-dessus) plutôt que sur `heldBy`. Écart par rapport à `docs/DATA_MODEL.md` tel qu'écrit initialement (mis à jour en conséquence) ; pas de migration prévue pour les actions déjà sauvegardées en localStorage avec un disque "tenu" — elles se rechargent (le champ `heldBy` orphelin est simplement ignoré), mais peuvent nécessiter de repositionner le disque manuellement sur ces frames.
- **2026-08-25** — Placement par défaut du défenseur d'un handler (`D1`/`D2` dans les presets d'effectif) corrigé : l'ancien décalage uniforme (`MARK_DX`/`MARK_DY`, pensé pour éviter le chevauchement visuel des cutters alignés en stack) plaçait le marqueur simplement "à côté" du handler à la même profondeur, ce qui ne correspond pas à un marquage réaliste. Un marqueur sur le porteur/futur porteur se place devant lui, entre lui et la direction d'attaque (`y=0`), avec un léger décalage latéral pour figurer une force — nouvelles constantes dédiées `HANDLER_MARK_DX`/`HANDLER_MARK_DY` dans `src/domain/presets/roster.ts`, distinctes de celles des cutters.
- **2026-08-25** — Plan initial pour le "terrain plein écran mobile" (Phase 8) revu après un essai visuel : l'idée de départ (toolbar d'ajout de joueur en boutons **flottants directement sur le canvas**, à la façon d'une palette d'outils) a été abandonnée dès la première capture d'écran — une toolbar à fond opaque posée sur le terrain masquait entièrement les joueurs situés dessous, ce qui est inacceptable pour un outil dont l'usage central est de lire/positionner précisément des joueurs. Remplacé par une approche plus sûre : le "overlay" se fait au niveau de la mise en page (colonne flex `100dvh`, chrome secondaire replié/compacté, aucun scroll de page) plutôt qu'au niveau du rendu (rien n'est jamais peint par-dessus le dessin du terrain lui-même). Le menu ☰ (nom/export/nouvelle action) reste, lui, un vrai dropdown en overlay au-dessus du terrain — validé sans problème car il ne s'affiche que ponctuellement, sur demande explicite.
- **2026-08-25** — Correctif critique post-déploiement : la mise en page "plein écran mobile" ci-dessus avait été validée avec un viewport Playwright de test **artificiellement haut** (844px — la hauteur totale théorique de l'écran, sans tenir compte de la barre d'adresse du navigateur), au lieu de la hauteur réellement visible (~660-730px sur un téléphone réel, adresse visible). Retour utilisateur immédiat : "interface complètement pétée", terrain minuscule, aucun scroll possible. Cause racine : `Field.tsx` dérivait systématiquement sa hauteur de sa largeur (`height = width × ratio`), sans jamais tenir compte de l'espace vertical réellement disponible — sur un vrai écran de téléphone, un terrain en demi-largeur de portrait (ratio ~1.67) réclame ~620px de haut à lui seul, largement plus que ce qu'il restait une fois la timeline de frames et la toolbar décomptées, forçant un scroll interne caché dans `.field-stage` (donc invisible/non découvrable pour l'utilisateur). Corrigé à la racine plutôt qu'en rustine CSS : `Field.tsx` dimensionne désormais le `Stage` pour tenir dans l'espace disponible en largeur **et** en hauteur (`object-fit: contain`), en repliant la largeur si la hauteur dérivée dépasserait le conteneur ; `.editor` devient une "app shell" plein écran unique (`height:100dvh`, colonne flex) appliquée à **toutes** les tailles d'écran plutôt que juste sous une media query mobile — supprime la duplication de mise en page desktop/mobile qui avait initialement masqué le problème. Leçon retenue : toujours valider un layout "plein écran mobile" avec un viewport Playwright réaliste (`devices["iPhone 13"]` etc., hauteur visible barre d'adresse comprise), jamais avec la hauteur d'écran brute.
- **2026-08-25** — Passe de design visuel ("clean et moderne", retour utilisateur direct) : introduction de jetons de design CSS (`--accent`, `--surface`, `--border`, `--radius*`, `--shadow*`) dans `src/index.css`, remplacement des couleurs codées en dur (jaune/or `#f2c94c`, gris divers) par cette palette cohérente (bleu `--accent`) déclinée clair/sombre, coins arrondis + ombre légère sur les panneaux (menu, sélection, timeline) et les boutons, variante `.primary` pour le bouton d'action principal ("Commencer"). Portée volontairement limitée au chrome UI (boutons, panneaux, formulaires) : les couleurs du terrain/des entités (`theme.ts`, `presets/fieldColors.ts`) ne sont pas concernées, elles répondent à un besoin de lisibilité tactique distinct.
