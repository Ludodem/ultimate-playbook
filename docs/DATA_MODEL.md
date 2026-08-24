# Modèle de données — Ultimate Playbook

Toutes les coordonnées sont exprimées en **pourcentage (0–100) de la largeur/longueur du terrain**, jamais en pixels, pour un rendu responsive indépendant de la taille d'écran.

## 1. Terrain (`FieldConfig`)

```ts
type FieldType = "half" | "full" | "undefined";

interface FieldConfig {
  type: FieldType;
  lengthMeters: number;   // longueur totale du terrain représenté
  widthMeters: number;    // largeur du terrain
  endzoneMeters?: number; // profondeur de l'en-but, absent si type === "undefined"
}
```

Valeurs par défaut suggérées (indoor, modifiables par l'utilisateur) :

| Preset               | length | width | endzone |
|----------------------|--------|-------|---------|
| `half` (défaut)       | 30     | 18    | 8       |
| `full`                | 60     | 18    | 8       |
| `undefined`           | 20     | 18    | —       |

> Ces valeurs sont indicatives pour un gymnase standard ; à ajuster lors de l'implémentation si besoin. Elles doivent rester des constantes de configuration facilement modifiables, pas des valeurs éparpillées dans le code.

## 2. Entités (`Entity`)

```ts
type Team = "offense" | "defense";

interface Entity {
  id: string;        // uuid stable sur toute l'action (une entité = un joueur qui persiste frame après frame)
  team: Team;
  label: string;      // ex: "1", "H1", "D3" — libre
  x: number;          // 0-100, position sur la largeur
  y: number;          // 0-100, position sur la longueur
  hasDisc?: boolean;  // au plus une entité à true par frame
}
```

Règles :
- Le disque n'est **pas** une entité de la liste `entities` : c'est un objet séparé au niveau de la frame (voir §3), qui peut soit être lié à une entité (`heldBy`), soit avoir une position libre (passe en vol).
- Le nombre d'entités par équipe n'est pas plafonné techniquement, mais l'UI doit avertir/limiter au-delà d'un seuil raisonnable (suggestion : 15 par équipe) pour rester lisible.
- Les `id` des entités restent stables à travers toutes les frames d'une même action (permet d'interpoler la trajectoire d'un joueur donné entre deux frames).

## 3. Frame (`Frame`)

```ts
interface Disc {
  heldBy?: string;  // id d'une Entity, si le disque est en main
  x?: number;       // position libre si heldBy est absent (0-100)
  y?: number;
}

interface Frame {
  id: string;
  order: number;          // position dans la séquence (0-based)
  note?: string;           // annotation libre affichée pendant l'édition et la lecture
  transitionMs?: number;   // durée de l'interpolation DEPUIS la frame précédente en mode "fluide" (défaut si absent : valeur globale de l'action)
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
  tags: string[];               // libre, ex: ["stack vertical", "iso"] — utilisé par la future bibliothèque
  fieldConfig: FieldConfig;
  defaultTransitionMs: number;  // durée par défaut d'une transition en mode fluide (ex: 1200)
  frames: Frame[];               // toujours >= 1
  createdAt: string;             // ISO 8601
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
  isPlaying: boolean;     // pertinent seulement en mode "fluid"
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
  x: number; // 0-100, coordonnées relatives comme toutes les positions du modèle
  y: number;
}

type IncomingCurves = Record<string /* id d'entité, ou "disc" */, CurveControlPoint>;
```

- Absence d'entrée pour une clé donnée = interpolation en ligne droite (comportement inchangé).
- **MVP** : seule la clé `"disc"` est exposée dans l'UI d'édition (voir `docs/PRD.md` §4.5). Le mécanisme pour les entités/joueurs existe dans le modèle mais reste sans UI tant que ce n'est pas priorisé.
- L'affordance d'édition ne doit être proposée que lorsque la position du disque diffère réellement entre la frame N et la frame N+1 (sinon rien à courber).

### Impact sur l'interpolation

En mode "fluide", pour chaque segment et chaque entité/disque :
- pas d'entrée dans `incomingCurves` → interpolation linéaire (`lerp`), comportement actuel.
- entrée présente → `quadraticBezier(P0, controlPoint, P1, t)` à la place du `lerp`, uniquement pour cette entité/le disque sur ce segment (voir `docs/ARCHITECTURE.md` §4).

Le mode "pas à pas" n'est pas concerné : il n'affiche que les positions aux frames, jamais l'intérieur d'un segment.
