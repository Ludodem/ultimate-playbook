# Modèle de données — Ultimate Playbook

Toutes les coordonnées sont exprimées en **pourcentage de la largeur/longueur du terrain**, jamais en pixels, pour un rendu responsive indépendant de la taille d'écran. `0` et `100` désignent toujours les lignes de touche/de fond réelles du terrain — une position sur l'axe largeur (`x`) peut néanmoins sortir de `[0,100]` pour représenter un déplacement hors-ligne (sideline), voir §1 "Marge sideline".

## 1. Terrain (`FieldConfig`)

```ts
type FieldType = "half" | "full" | "undefined";

interface FieldColors {
  field: string; // couleur de la zone de jeu hors en-but (hex)
  endzone: string; // couleur de l'en-but, ignorée si type === "undefined"
  lines: string; // couleur des lignes de délimitation
  outOfBounds: string; // couleur de la marge sideline, visible seulement si sidelineMarginMeters > 0
}

interface FieldConfig {
  type: FieldType;
  lengthMeters: number; // longueur totale du terrain représenté
  widthMeters: number; // largeur du terrain
  endzoneMeters?: number; // profondeur de l'en-but, absent si type === "undefined"
  /** Marge hors-ligne à réserver de chaque côté (sidelines), en mètres. 0/absent = aucune (défaut) — voir "Marge sideline" ci-dessous. */
  sidelineMarginMeters?: number;
  colors?: FieldColors; // absent = valeurs par défaut (voir ci-dessous)
}
```

Valeurs par défaut suggérées (indoor, modifiables par l'utilisateur) :

| Preset          | length | width | endzone |
| --------------- | ------ | ----- | ------- |
| `half` (défaut) | 30     | 18    | 8       |
| `full`          | 60     | 18    | 8       |
| `undefined`     | 20     | 18    | —       |

> Ces valeurs sont indicatives pour un gymnase standard ; à ajuster lors de l'implémentation si besoin. Elles doivent rester des constantes de configuration facilement modifiables, pas des valeurs éparpillées dans le code.

### Couleurs par défaut

| Élément    | Couleur                        | Justification                                                                                                  |
| ---------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Terrain    | `#D9DBDE` (gris clair)         | Évoque un sol de gymnase indoor, neutre : ne fait pas concurrence visuelle aux pastilles colorées des joueurs. |
| En-but     | `#3D6FB4` (bleu)               | Convention courante en indoor (zones colorées), bon contraste avec le gris du terrain.                         |
| Lignes     | `#4B4F58` (gris ardoise foncé) | Lisible à la fois sur le gris clair et sur le bleu de l'en-but.                                                |
| Hors-ligne | `#BFC2C7` (gris plus soutenu)  | Distinct du gris du terrain sans être criard ; signale "vous êtes sorti" sans détourner l'attention.           |

Ces valeurs sont le **défaut appliqué quand `colors` est absent** d'un `FieldConfig` — jamais codées en dur dans les composants de rendu. Aucune UI de personnalisation n'est prévue pour le MVP (voir `docs/ROADMAP.md`, post-MVP), mais le modèle de données la supporte dès maintenant : changer les couleurs d'une action ne nécessite aucune migration de schéma.

### Marge sideline

Certains plays ont besoin qu'une entité ou le disque sorte visiblement du terrain (ex. un around qui contourne la marque par l'extérieur de la ligne de touche, un "long de ligne"). Plutôt qu'un système de coordonnées séparé, on autorise `x` à sortir de `[0,100]` (toujours dans la même unité : % de `widthMeters`), et `sidelineMarginMeters` indique à l'affichage combien d'espace hors-ligne réserver visuellement de chaque côté.

- **Défaut `0`** : aucun changement pour les actions qui n'en ont pas besoin — la vue reste cadrée pile sur le terrain, sans perte d'espace ni de lisibilité.
- Plage visible en % (utilisée par le rendu, voir `docs/ARCHITECTURE.md` §3) : `[-marginPercent, 100 + marginPercent]`, avec `marginPercent = (sidelineMarginMeters / widthMeters) * 100`.
- Un seul système de coordonnées, toujours ancré sur le terrain réel : `x=0`/`x=100` ne changent jamais de sens selon que la marge est activée ou non — un export JSON reste donc non-ambigu indépendamment du réglage d'affichage.
- Limité à l'axe largeur (sidelines) pour le MVP ; pas de marge équivalente sur l'axe longueur (au-delà d'un en-but ou de sa propre ligne de fond).
- Cette même plage visible s'applique au point de contrôle d'une trajectoire courbe (§8) : activer la marge sideline donne aussi de la place pour "bend" une passe plus fort, sans mécanisme séparé.

## 2. Entités (`Entity`)

```ts
type Team = "offense" | "defense";

interface Entity {
  id: string; // uuid stable sur toute l'action (une entité = un joueur qui persiste frame après frame)
  team: Team;
  label: string; // ex: "1", "H1", "D3" — libre
  x: number; // % de la largeur ; peut sortir de [0,100] pour une position hors-ligne (sideline), voir §1
  y: number; // 0-100, position sur la longueur
  hasDisc?: boolean; // au plus une entité à true par frame
}
```

Règles :

- Le disque n'est **pas** une entité de la liste `entities` : c'est un objet séparé au niveau de la frame (voir §3), qui peut soit être lié à une entité (`heldBy`), soit avoir une position libre (passe en vol).
- Le nombre d'entités par équipe n'est pas plafonné techniquement, mais l'UI doit avertir/limiter au-delà d'un seuil raisonnable (suggestion : 15 par équipe) pour rester lisible.
- Les `id` des entités restent stables à travers toutes les frames d'une même action (permet d'interpoler la trajectoire d'un joueur donné entre deux frames).

## 3. Frame (`Frame`)

```ts
interface Disc {
  heldBy?: string; // id d'une Entity, si le disque est en main
  x?: number; // position libre si heldBy est absent ; peut sortir de [0,100], voir §1 "Marge sideline"
  y?: number;
}

interface Frame {
  id: string;
  parentId: string | null; // frame précédente dans l'arbre ; null uniquement pour LA frame racine — voir §9
  siblingOrder: number; // position parmi les frames partageant le même parentId (ordre des branches à un embranchement)
  branchLabel?: string; // nom court de cette branche (ex. "Autour", "Strike") ; obligatoire si le parent a plus d'un enfant — voir §9
  note?: string; // annotation libre affichée pendant l'édition et la lecture
  transitionMs?: number; // durée de l'interpolation DEPUIS la frame précédente en mode "fluide" (défaut si absent : valeur globale de l'action)
  entities: Entity[];
  disc: Disc;
  incomingCurves?: IncomingCurves; // courbure optionnelle du/des segment(s) arrivant depuis la frame précédente — voir §8
}
```

## 4. Action (`Action`)

```ts
interface Action {
  id: string;
  schemaVersion: 1;
  name: string;
  tags: string[]; // libre, ex: ["stack vertical", "iso"] — utilisé par la future bibliothèque
  fieldConfig: FieldConfig;
  defaultTransitionMs: number; // durée par défaut d'une transition en mode fluide (ex: 1200)
  frames: Frame[]; // arbre à plat (voir §9) ; toujours >= 1 ; exactement une frame avec parentId === null
  createdAt: string; // ISO 8601
  updatedAt: string;
}
```

## 5. Presets d'effectif

Les presets ne sont pas stockés comme un type de donnée à part : ce sont des **générateurs de frame initiale** (fonctions pures côté code), pas une entité persistée. Un preset produit une liste d'`Entity[]` + un `Disc` prêts à devenir la première frame d'une nouvelle action.

Presets MVP :

- `5v5-vertical-stack` : 5 offense (2 handlers + 3 stack), 5 defense en miroir simple, disque chez un handler.
- `5v5-horizontal-stack` : variante horizontale du même principe.
- `empty` : terrain vide, 0 joueur — point de départ pour composer un effectif libre (drill à 3, sans défense, etc.).

Les coordonnées exactes de chaque preset sont un détail d'implémentation (Phase 1 de `docs/ROADMAP.md`), à définir/ajuster visuellement lors du développement plutôt que figées ici.

## 6. Stockage local

- Clé de stockage : namespace dédié (ex. `ultimate-playbook:actions`) contenant un dictionnaire `{ [actionId]: Action }`.
- Le champ `schemaVersion` permet d'écrire des migrations si le modèle évolue après le MVP.
- Export JSON = sérialisation directe d'un objet `Action` (un fichier = une action). Import = validation du schéma (au moins la présence des champs obligatoires et de `schemaVersion`) avant intégration.

## 7. État de lecture (Play mode) — non persisté

Purement local à l'UI, ne fait pas partie du modèle `Action` sauvegardé :

```ts
interface PlaybackState {
  mode: "step" | "fluid";
  currentFrameIndex: number;
  isPlaying: boolean; // pertinent seulement en mode "fluid"
  speedMultiplier: number; // ex: 1 = vitesse normale, 0.5 = deux fois plus lent
}
```

## 8. Courbure de trajectoire (segments)

Par défaut, un segment (transition entre deux frames consécutives) est interpolé en **ligne droite** en mode "fluide". Pour certains cas (un lancer courbe — blade, hammer, huck avec arc), on veut pouvoir définir explicitement une trajectoire courbe **sur ce segment précis**, sans que ça affecte les autres segments de l'action.

### Principe

- La courbure est une propriété de la **transition**, pas d'une frame isolée : elle décrit comment on va de la position à la frame N à la position à la frame N+1. On la stocke sur la frame d'arrivée (N+1), par cohérence avec `transitionMs` qui suit déjà cette convention.
- Modélisée par une courbe de **Bézier quadratique à un seul point de contrôle** — suffisant pour l'immense majorité des trajectoires réelles (une seule inflexion), et surtout beaucoup plus simple à éditer qu'une cubique à deux poignées : l'interaction reste "glisser un point", identique au déplacement d'une entité.
- Le champ est une map générique par id d'entité (clé spéciale `"disc"` pour le disque), pour pouvoir réutiliser exactement le même mécanisme plus tard sur des courses de joueurs (item post-MVP, cf. `docs/PRD.md` §5) sans changer le schéma.

```ts
interface CurveControlPoint {
  x: number; // coordonnées relatives comme toutes les positions du modèle ; peut sortir de [0,100] (voir §1 "Marge sideline")
  y: number;
}

type IncomingCurves = Record<string /* id d'entité, ou "disc" */, CurveControlPoint>;
```

- Absence d'entrée pour une clé donnée = interpolation en ligne droite (comportement inchangé).
- **MVP** : seule la clé `"disc"` est exposée dans l'UI d'édition (voir `docs/PRD.md` §4.5). Le mécanisme pour les entités/joueurs existe dans le modèle mais reste sans UI tant que ce n'est pas priorisé.
- L'affordance d'édition ne doit être proposée que lorsque la position du disque diffère réellement entre la frame N et la frame N+1 (sinon rien à courber).
- Le point de contrôle stocké (`CurveControlPoint`) n'est jamais borné dans le modèle, et sa valeur peut se retrouver largement hors de la zone visible — c'est attendu, pas un bug : une bézier quadratique ne tire la courbe qu'à mi-chemin vers son point de contrôle (le sommet réel à t=0.5 ne s'écarte de la ligne droite que de **la moitié** de l'écart entre le point de contrôle et le milieu du segment). Pour cette raison, l'éditeur ne fait **pas** glisser directement ce point de contrôle : il fait glisser le **sommet réel de la courbe** (`curveMidpoint`, la position effectivement visible à t=0.5), et calcule le point de contrôle correspondant (`controlPointForMidpoint`, l'inverse exact) au relâchement. Borner le sommet à la zone visible (`[0,100]` par défaut, étendue par `sidelineMarginMeters` si activé — voir §1) borne alors exactement ce qu'on voit, sans jamais sous-délivrer ni faire disparaître la poignée pendant le glisser.

### Impact sur l'interpolation

En mode "fluide", pour chaque segment et chaque entité/disque :

- pas d'entrée dans `incomingCurves` → interpolation linéaire (`lerp`), comportement actuel.
- entrée présente → `quadraticBezier(P0, controlPoint, P1, t)` à la place du `lerp`, uniquement pour cette entité/le disque sur ce segment (voir `docs/ARCHITECTURE.md` §4).

Le mode "pas à pas" n'est pas concerné : il n'affiche que les positions aux frames, jamais l'intérieur d'un segment.

## 9. Branches (arbre de frames)

Une action n'est pas toujours une simple séquence : un play peut comporter un point de décision avec plusieurs continuations possibles (ex. une sortie de ligne où le porteur choisit entre un around sur son soutien ou une passe dans la course d'un strike). `frames` est donc modélisé comme un **arbre**, pas une liste ordonnée : chaque frame connaît sa frame précédente (`parentId`), et une frame peut avoir plusieurs enfants (un embranchement).

### Principe

- **Racine** : l'unique frame avec `parentId === null`. Pas de champ `rootFrameId` séparé sur `Action` — pour éviter une source de vérité dupliquée à garder synchronisée, la racine se déduit en scannant `frames`.
- **Continuation simple** : un parent avec un seul enfant — comportement par défaut, équivalent à une liste ordonnée classique. `branchLabel` est alors sans objet sur cet enfant.
- **Embranchement** : un parent avec plusieurs enfants — chaque enfant DOIT porter un `branchLabel` (ex. "Autour", "Strike"), affiché comme onglet dans l'éditeur et comme choix en mode lecture pas à pas.
- `siblingOrder` ordonne les enfants entre eux (ordre d'affichage des branches à un embranchement ; sans effet particulier hors embranchement).

### Non-objectif explicite : pas de fusion de branches

Le modèle reste un **arbre pur** (chaque frame a exactement un parent), jamais un graphe. Deux branches ne peuvent pas reconverger vers une frame partagée : si la fin d'un play est commune à plusieurs options, elle est dupliquée dans chaque branche plutôt que reliée. Un peu plus d'édition en échange d'un modèle mental et d'une UI de lecture beaucoup plus simples (pas d'ambiguïté sur "d'où vient-on" en arrivant sur une frame).

### Impact sur la lecture (Play)

- **Pas à pas** : arrivé sur une frame à plusieurs enfants, "suivant" devient un choix entre les `branchLabel` disponibles plutôt qu'un bouton unique.
- **Fluide** : le choix se fait **avant** de lancer la lecture (sélection d'un chemin complet racine → feuille, résolu embranchement par embranchement), pour ne jamais interrompre une animation en cours.

Logique pure associée : voir `docs/ARCHITECTURE.md` §7.
