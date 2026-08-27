# Roadmap — Ultimate Playbook

Ce document découpe le MVP (voir `docs/PRD.md`) en phases séquentielles, chacune en tâches actionnables par un agent (ou un humain) une par une. Chaque tâche cochée doit correspondre à un commit (ou une PR) cohérent.

Convention : cocher une case au fur et à mesure de l'avancement. Si une tâche impose un écart par rapport à `docs/ARCHITECTURE.md` ou `docs/DATA_MODEL.md`, documenter la décision dans le journal de décisions (`docs/ARCHITECTURE.md` §8) avant de continuer.

## Phase 0 — Bootstrap technique

- [x] Scaffold Vite + React + TypeScript.
- [x] Installer et configurer : `react-konva`/`konva`, `zustand`, `react-i18next`, `vitest` + Testing Library, ESLint + Prettier.
- [x] Mettre en place la structure de dossiers cible (`docs/ARCHITECTURE.md` §2).
- [x] Config `vite.config.ts` avec `base: '/ultimate-playbook/'`.
- [x] Workflow GitHub Actions : build + déploiement sur GitHub Pages au push sur `main`.
- [x] i18n : structure `src/i18n/fr.json` avec quelques clés de test, langue par défaut FR.
- [x] Page d'accueil minimale ("Ultimate Playbook" + placeholder) qui build et déploie correctement, pour valider toute la chaîne avant d'attaquer les features. _(déployée : https://ludodem.github.io/ultimate-playbook/)_

## Phase 1 — Modèle de données & presets

- [x] Implémenter les types TS de `docs/DATA_MODEL.md` (`FieldConfig`, `FieldColors`, `Entity`, `Frame`, `Disc`, `Action`) — `src/domain/models.ts`. _(Note : `Frame` a depuis été remodélisé en arbre — `parentId`/`siblingOrder`/`branchLabel` remplacent `order`, voir `docs/DATA_MODEL.md` §9 et journal de décisions `docs/ARCHITECTURE.md` §8. Correctif rétroactif prévu en tête de Phase 4.)_
- [x] Implémenter les presets de terrain (`half`, `full`, `undefined`) avec valeurs par défaut indoor + `DEFAULT_FIELD_COLORS` (gris terrain / bleu en-but / gris ardoise pour les lignes) et une fonction `resolveFieldColors` (fallback si `colors` absent) — `src/domain/presets/field.ts` et `fieldColors.ts`. _(Étendu depuis pour la marge sideline : `sidelineMarginMeters` sur `FieldConfig` + couleur `outOfBounds`, voir `docs/DATA_MODEL.md`, section "Marge sideline".)_
- [x] Implémenter les presets d'effectif : `empty`, `5v5-vertical-stack`, `5v5-horizontal-stack` — `src/domain/presets/roster.ts`.
- [x] Tests unitaires sur les presets (nombre d'entités générées, cohérence des positions dans [0,100]).

## Phase 2 — Rendu statique du terrain

- [x] Composant `Field` (Konva Stage/Layer) qui dessine le terrain selon `FieldConfig` (lignes, en-buts si applicable), responsive (resize observer) — `src/components/field/Field.tsx`. _(Étendu depuis pour gérer la marge sideline : `toX` mappe la plage `computeVisibleXRangePercent(fieldConfig)`, pas systématiquement `[0,100]`.)_
- [x] Rendu des entités (cercles colorés par équipe, label) et du disque depuis une `Frame` statique passée en props — `EntityMarker.tsx` / `DiscMarker.tsx`.
- [x] Validation manuelle : affiché un preset 5v5 stack vertical sur PC (1280px) et mobile étroit (390px) via Playwright — capture d'écran conforme (gris/bleu, orange/violet, disque bien distinct, aucun chevauchement). Ajustements apportés suite à cette validation : espacement des presets d'effectif (`roster.ts`) et décalage visuel du disque quand il est en main (pour ne pas masquer le label du porteur).

## Phase 3 — Édition des positions

- [x] Écran/panneau de démarrage d'une nouvelle action : choix du preset terrain (`half`/`full`/`undefined`, toggle marge sideline) et du preset d'effectif (`empty`/`5v5-vertical-stack`/`5v5-horizontal-stack`) — `src/components/editor/NewActionSetup.tsx`.
- [x] Drag & drop d'une entité (souris + tactile via pointer events Konva), mise à jour du store — `src/state/actionEditorStore.ts` (Zustand), câblé dans `Field.tsx` via la prop `interactive`.
- [x] Ajout / suppression d'une entité (choix de l'équipe), sans limite basse, avertissement au-delà du seuil haut recommandé (`MAX_RECOMMENDED_PER_TEAM = 15`) — `PositionEditor.tsx`.
- [x] Sélection du porteur du disque (assignation `heldBy`) ou position libre du disque (`assignDiscTo`/`freeDisc`).
- [x] Undo/redo sur les actions d'édition (pile d'historique des frames) — `past`/`future` dans le store.
- [x] Mode d'interaction alternatif pour petits écrans : sélectionner un joueur (clic/tap) puis taper une destination sur le terrain, en plus du drag classique — les deux coexistent plutôt qu'un bascule de mode.
- Validation : 33 tests unitaires (store + domaine) + parcours interactif vérifié via un script Playwright piloté (sélection, tap-to-move, ajout, drag souris, undo/redo x2, redo) — captures conformes, aucune erreur console.
- [x] Retours utilisateur post-Phase 3 : header (titre + tagline) masqué sur l'écran d'édition/lecture pour libérer l'espace mobile (affiché seulement sur l'écran de démarrage) ; zone de dépôt "corbeille" affichée pendant le drag d'une entité, alternative découvrable au bouton "Supprimer" du panneau de sélection (`TrashZone.tsx`) ; nouvelle entité positionnée sur une case libre proche du centre (`domain/spawn.ts`, recherche en anneaux concentriques) plutôt que systématiquement à (50,50).

## Phase 4 — Gestion des frames & branches (timeline)

- [x] Correctif rétroactif : migrer `Frame`/`Action` du modèle `order`-based vers l'arbre (`parentId`/`siblingOrder`/`branchLabel`, voir `docs/DATA_MODEL.md` §9) dans `src/domain/models.ts`. _(La démo de la Phase 2 dans `App.tsx` avait déjà été remplacée par l'éditeur réel en Phase 3 ; rien à migrer là.)_
- [x] `src/domain/tree.ts` : fonctions pures `getChildren`, `getRootFrame`, `isForkFrame`, `resolvePath` (+ `getFrame`, `getSubtreeIds`, `computeDisplayOrder`) + 13 tests unitaires (voir `docs/ARCHITECTURE.md` §7).
- [x] Bande de vignettes représentant les frames de l'action courante ; se scinde en pistes parallèles à partir d'un embranchement, chaque piste étiquetée par son `branchLabel` — `FrameTimeline.tsx` + `BranchChain.tsx` (récursif).
- [x] Créer une nouvelle frame par duplication de la frame courante (continuation simple, un seul enfant) — `addNextFrame`, désactivé si la frame courante a déjà un enfant.
- [x] Créer une branche à partir de n'importe quelle frame ("ajouter une option depuis cette frame") : demande un `branchLabel` pour la nouvelle branche, et labellise rétroactivement l'enfant existant si le parent n'en avait qu'un jusque-là — `addBranch`, `renameBranch`.
- [x] Réordonner / supprimer une frame (au sein d'une branche) — `moveFrameUp`/`moveFrameDown` (échange avec le parent/enfant unique, désactivé si le parent est un embranchement), `deleteFrame` (supprime le sous-arbre, retombe sur le parent si la frame courante en faisait partie ; racine non supprimable). _(Pas d'action "dupliquer une frame en place" distincte : `addNextFrame`/`addBranch` couvrent déjà le besoin de dupliquer le contenu vers une nouvelle frame.)_
- [x] Annotation texte libre par frame — `setNote`.
- Validation : 17 tests unitaires supplémentaires (store, arbre) + parcours interactif vérifié via Playwright (frames en chaîne, création de 2 branches avec labellisation rétroactive, renommage, undo/redo) — captures conformes, aucune erreur console.

## Phase 5 — Mode lecture (Play)

- [x] Fonction pure d'interpolation entre deux frames (`src/domain/interpolation.ts`) + tests unitaires — `buildInterpolatedFrame` (renvoie une vraie `Frame`, directement réutilisable par `Field` sans code de rendu spécifique au mode lecture).
- [x] Mode "pas à pas" : navigation précédent/suivant ; à un embranchement, choix inline entre les `branchLabel` disponibles au lieu d'un bouton "suivant" unique — `StepPlayback.tsx`. Avancer ("suivant" ou un choix de branche) anime la transition (même logique d'interpolation que le mode fluide, sur un seul segment) plutôt qu'un saut immédiat ; revenir en arrière reste instantané.
- [x] Mode "fluide" : lecture animée avec `requestAnimationFrame`, vitesse réglable ; s'il y a des branches, sélection d'un chemin complet (via `resolvePath`) avant de lancer la lecture — `FluidPlayback.tsx`.
- [x] Affichage des flèches de trajectoire entre deux frames consécutives (distinction course de joueur / passe de disque) — `TrajectoryArrows.tsx`, en mode pas à pas uniquement (masquées pendant une animation en cours).
- Correctif au passage : le décalage visuel du disque tenu (pour ne pas masquer le label du porteur) était basé sur `disc.heldBy`, qui ne survit pas à l'interpolation entre deux frames — rebasé sur la coïncidence de position (`findColocatedEntity`), qui reste vraie tout du long d'un segment où le porteur se déplace en tenant le disque.
- Validation : tests unitaires (interpolation, timing, coïncidence de position) + parcours interactif vérifié via Playwright (pas à pas avec flèches, embranchement, mode fluide avec choix de chemin, vitesse, mi-animation, fin) — aucune erreur console.

## Phase 6 — Trajectoire courbe du disque

Fait partie du périmètre MVP (voir `docs/PRD.md` §4.5) mais s'implémente comme une couche indépendante par-dessus la Phase 5 : le MVP reste pleinement fonctionnel (en ligne droite) sans cette phase, elle peut donc être livrée séparément/plus tard sans bloquer le reste.

- [x] Étendre le modèle `Frame` avec `incomingCurves` (voir `docs/DATA_MODEL.md` §8) — déjà présent dans `src/domain/models.ts` depuis la conception initiale.
- [x] Fonctions pures `lerp`/`quadraticBezier`/`sampleQuadraticBezier` dans `src/domain/interpolation.ts` + tests unitaires, et bascule de `buildInterpolatedFrame` entre les deux selon la présence d'une entrée `incomingCurves` pour l'entité/le disque concerné (générique — seul le disque a une UI au MVP).
- [x] UI d'édition : disque "fantôme" (semi-transparent) à sa position sur la frame précédente, courbe pointillée jusqu'à sa position actuelle, poignée de contrôle draggable — `DiscCurveEditor.tsx`, intégré à `Field` via la nouvelle prop `discCurveEditor`.
- [x] L'affordance de courbure n'apparaît que si la position du disque change réellement entre les deux frames — calculé dans `PositionEditor.tsx` (`discMoved`).
- [x] Bouton de réinitialisation ("trajectoire rectiligne") qui supprime l'entrée `incomingCurves.disc` — `setDiscCurveControlPoint(null)`, affiché seulement quand une courbe est effectivement stockée.
- [x] Mise à jour du rendu des flèches de trajectoire (mode lecture) pour dessiner la courbe réelle (Bézier) plutôt qu'une ligne droite quand un point de contrôle est défini — `TrajectoryArrows.tsx`.
- Note d'implémentation : le point de contrôle par défaut (avant tout drag) est le milieu du segment, ce qui produit mathématiquement une ligne droite identique au `lerp` — donc rien à activer/désactiver explicitement, l'affordance apparaît et se comporte "en ligne droite" tant qu'on ne fait pas glisser la poignée.
- Correctif post-retour utilisateur : la poignée ne fait pas glisser le point de contrôle brut de la bézier (qui doit être placé **deux fois plus loin** que l'effet visuel recherché, donc sort vite de l'écran et devient invisible) mais le **sommet réel de la courbe** (`curveMidpoint`, à t=0.5), avec le point de contrôle correspondant calculé à la volée (`controlPointForMidpoint`, inverse exact). Le sommet est borné à la zone visible du terrain (`dragBoundFunc` Konva, pas de rebond post-rendu) — la poignée ne disparaît plus, sans perdre d'amplitude de courbure atteignable.
- [x] Retours utilisateur post-Phase 6 :
  - **Marge sideline revue** : n'affiche plus qu'une seule sideline (côté x=100) au lieu des deux — la plage visible est décalée plutôt qu'élargie (`computeVisibleXRangePercent`, toujours 100 points de pourcentage d'étendue), donc la taille du terrain/des entités ne dépend plus du réglage de marge (avant : tout rétrécissait pour faire tenir marge des deux côtés + terrain dans le même conteneur). Le bord opposé du terrain sort simplement du cadre visible.
  - **Frame précédente en fantôme pendant l'édition** : `GhostFrame.tsx` affiche toutes les entités + le disque de la frame précédente à opacité réduite (30%), non interactifs, superposés à la frame en cours d'édition — voir immédiatement ce qui a changé sans confusion avec la frame courante. Remplace l'ancien disque fantôme spécifique à `DiscCurveEditor` (désormais redondant, retiré). Activé par défaut, avec une case à cocher pour le désactiver (visible seulement quand une frame précédente existe).

## Phase 7 — Persistance locale

- [x] `libraryStore` : sauvegarde/chargement des actions en localStorage (clé namespacée, voir `docs/DATA_MODEL.md` §6) — `src/state/libraryStore.ts` (dictionnaire `{ [actionId]: Action }` sous `ultimate-playbook:actions`, + pointeur `ultimate-playbook:last-action-id` pour la reprise automatique).
- [x] Export d'une action en fichier JSON téléchargeable — bouton dans `PositionEditor.tsx` (`handleExport`), nom de fichier dérivé du nom de l'action (`actionFileName`, `src/domain/action.ts`).
- [x] Import d'un fichier JSON avec validation de schéma (`schemaVersion`, champs obligatoires) et message d'erreur clair si invalide — bouton dans `NewActionSetup.tsx`, validation via `validateAction` (`src/domain/action.ts`) qui vérifie chaque champ requis (dont l'unicité de la frame racine) et renvoie un message d'erreur explicite sinon.
- [x] Test de non-régression : créer une action, recharger la page, vérifier qu'elle est toujours présente — sauvegarde automatique (pas de bouton "Enregistrer" dédié) : `actionEditorStore` s'abonne à ses propres changements et réécrit l'action dans `libraryStore` dès que `frames`/`fieldConfig`/`actionName`/`tags`/`defaultTransitionMs` changent ; `App.tsx` recharge la dernière action active (`getLastActiveActionId`) au montage. Vérifié manuellement (voir aussi tests unitaires `domain/action.test.ts` et `state/libraryStore.test.ts`).
- Note d'implémentation : `actionEditorStore` ne modélisait jusqu'ici que `fieldConfig`/`frames` (pas d'`id`/`name`/`tags`/`defaultTransitionMs`/`createdAt`/`updatedAt`) — étendu pour porter ces métadonnées d'`Action`, avec `start()` qui prend désormais un nom, `loadAction()` (reprise/import) et `resetToSetup()` ("Nouvelle action", n'efface pas l'action de la bibliothèque, la désactive juste comme action active). Pas de bibliothèque/liste d'actions au MVP (post-MVP) : une seule action "active" à la fois, reprise automatiquement au chargement.

## Phase 8 — Responsive & polish tactile

Découpage issu des retours utilisateur post-Phase 7 (terrain trop petit sur mobile, disque "tenu" confus, placement par défaut du marquage handler incorrect).

- [x] Terrain plein écran (mobile **et** desktop), UX repensée à partir d'une maquette et d'une spécification écrite (`docs/PRD.md` §4.8) après plusieurs itérations infructueuses — voir journal de décisions `docs/ARCHITECTURE.md` §8 pour l'historique complet. Version retenue :
  - Le terrain occupe tout l'espace disponible en continu (`.field-stage`, `flex: 1` dans la colonne de `.editor`), sans jamais être partagé ni recouvert par un panneau permanent.
  - La barre **Frames** (`FrameTimeline.tsx`) a un espace dédié en bas (jamais posée par-dessus le terrain) : chemin courant depuis la racine (`computeCurrentPathView`, `src/domain/tree.ts`) + options d'un embranchement + bouton "+" pour enchaîner la frame suivante. Les actions moins fréquentes (créer une branche, renommer, réordonner, supprimer, note) sont dans le menu ⋯ (`FrameActionsMenu.tsx`).
  - Deux pastilles flottantes toujours visibles, translucides : Éditer/Jouer (haut-gauche) et le menu ⋯ (haut-droite, secondaire : nom de l'action, export, nouvelle action, ajout de joueur, undo/redo, frame fantôme). Le menu, une fois ouvert, est un vrai panneau opaque avec voile d'arrière-plan (transitoire, donc sans risque de recouvrir durablement un joueur).
  - Sélectionner un joueur (tap sans glisser) ne fait plus apparaître de panneau : simple surlignage (déjà géré par `EntityMarker`), un second tap désélectionne.
  - Le mode Jouer suit le même principe : pastille Pas à pas/Fluide (haut-droite, remplace le menu ⋯ qui n'a pas lieu d'être en lecture), contrôles de lecture en barre dédiée en bas (`.playback-dock`).
- [x] Passe de design visuel ("clean et moderne", retour utilisateur) : jetons de design (`--accent`, `--surface`, `--radius`, `--shadow-*`) dans `src/index.css`, boutons/panneaux à coins arrondis avec ombre légère, bouton principal (`.primary`) sur les CTA clés ("Commencer"), palette bleu/gris neutre cohérente en clair et sombre.
- [x] Disque toujours en position libre (suppression du concept "tenu par un joueur" — `Disc.heldBy`/`Entity.hasDisc` — et des boutons "Donner le disque"/"Libérer le disque" associés) ; positionnement uniquement par glisser-déposer direct. Écart par rapport à `docs/DATA_MODEL.md` tel qu'écrit initialement — voir journal de décisions `docs/ARCHITECTURE.md` §8.
- [x] Correction du placement par défaut du défenseur marquant un handler dans les presets d'effectif (`fiveVFiveVerticalStackPreset`/`fiveVFiveHorizontalStackPreset`) : devant lui (côté terrain d'attaque), pas simplement décalé sur le côté comme pour les cutters — voir `docs/ARCHITECTURE.md` §8.
- [x] Retours utilisateur post-refonte de l'écran d'édition :
  - **Note de frame en mode lecture** : affichée dans un bandeau translucide/flouté ancré en bas du terrain (`.field-banner-stack-bottom`), pas dans le dock opaque des contrôles — en lecture rien n'est cliquable sur le terrain, donc pas de risque à la poser en overlay (contrairement à l'édition). Ajoutée au mode fluide, qui ne l'affichait pas auparavant. Les deux modes utilisent `displayFrame.note` (la frame interpolée/résolue affichée), pas `currentFrame.note`, pour rester cohérents pendant une transition.
  - **Créer une branche depuis la barre Frames** : un second bouton ("+ Ajouter une option", contour en pointillé pour le distinguer visuellement du "+" plein), à côté du "+" d'ajout de frame simple, ouvre le même petit formulaire (nom + valider/annuler) directement dans la barre — plus besoin de passer par le menu ⋯. Retirée du menu ⋯ (`FrameActionsMenu.tsx`) pour n'avoir qu'un seul chemin vers cette action.
  - **Embranchements peu clairs dans la barre Frames** ("on comprend pas où sont les branches, sur laquelle on est") : `computeCurrentPathView` (`src/domain/tree.ts`) renvoie désormais une liste de segments (`frame` | `branch`) plutôt qu'un chemin plat + options finales — un segment `branch` apparaît à chaque branche traversée par le chemin affiché, qu'elle soit avant, à, ou après la frame courante (pas seulement quand on se trouve pile dessus, la limite notée à l'itération précédente). Chaque branche a une couleur dédiée (palette de 4 teintes cyclique par rang de sibling, `--branch-0..3`), pleine pour celle sur le chemin (celle qu'on a empruntée), en contour pour les autres (tappables pour basculer). Le libellé "Frames" affiche aussi le nom de la branche courante (ex. "FRAMES · STRIKE") pour rester lisible sans avoir à repérer les couleurs.
  - **Deuxième retour après essai** ("les boutons de branche et de frame ont la même forme et la même couleur ; pas de feedback à la création de la première branche") : trois correctifs distincts.
    1. `.branch-pill` prend une forme de capsule (`border-radius: 999px`, italique) nettement différente du carré arrondi de `.frame-chip`, pour que les deux niveaux d'info (quelle branche / quelle frame) ne se confondent plus visuellement.
    2. La palette `--branch-0..3` ne contient plus de bleu : `--accent` (bleu) signifiait déjà "frame courante" ailleurs dans la barre (`.frame-chip.is-current`, `.chip-add`), donc la première branche avec une couleur de palette bleue était indiscernable de ce bleu-là.
    3. `computeCurrentPathView` affiche désormais un segment `branch` dès qu'une frame a un `branchLabel`, même seule (pas seulement à partir de 2 options) — sinon créer la toute première branche ne produisait aucun changement visible tant qu'une deuxième option n'existait pas. Les frames qui suivent une branche (jusqu'à la prochaine) héritent aussi de sa couleur (léger fond teinté + liseré sur `.frame-chip`), pour qu'on voie d'un coup d'œil "ces frames appartiennent à cette branche".
- [x] Orientation portrait/paysage du terrain (`docs/PRD.md` §4.8bis), réglage manuel dans le menu ⋯, disponible aussi sur PC — voir `docs/ARCHITECTURE.md` §8 pour le détail du refactor de géométrie (`domain/geometry.ts` : `projectToScreen`/`unprojectFromScreen`/`projectRect`/`fitFieldStageSize`/`widthAxisPixelSpan`, tous purs et testés). Non persisté : repart en portrait à chaque rechargement (`orientation` dans `actionEditorStore.ts`, hors du modèle `Action`).
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
- Personnalisation des couleurs du terrain via l'UI (le modèle de données le permet déjà par défaut, cf. `FieldConfig.colors`).
- PWA (installable, utilisable hors-ligne) — pertinent tôt vu l'usage "bord de terrain", à réévaluer en priorité juste après le MVP plutôt qu'en fin de liste.
- Réutilisation d'une branche/d'une fin de play entre plusieurs actions (référence cross-actions plutôt que duplication) — explicitement écarté du MVP, voir `docs/DATA_MODEL.md` §9.
