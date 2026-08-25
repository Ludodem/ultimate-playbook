// Modèle de données du domaine — voir docs/DATA_MODEL.md pour la spec complète.
// Ces types sont indépendants de React/Konva : ils décrivent uniquement les données.

export type FieldType = "half" | "full" | "undefined";

export interface FieldColors {
  /** Couleur de la zone de jeu hors en-but. */
  field: string;
  /** Couleur de l'en-but, ignorée si type === "undefined". */
  endzone: string;
  /** Couleur des lignes de délimitation. */
  lines: string;
  /** Couleur de la marge sideline, visible seulement si sidelineMarginMeters > 0. */
  outOfBounds: string;
}

export interface FieldConfig {
  type: FieldType;
  /** Longueur totale du terrain représenté, en mètres. */
  lengthMeters: number;
  /** Largeur du terrain, en mètres. */
  widthMeters: number;
  /** Profondeur de l'en-but, en mètres. Absent si type === "undefined". */
  endzoneMeters?: number;
  /**
   * Marge hors-ligne à réserver de chaque côté (sidelines), en mètres.
   * 0/absent = aucune marge (défaut) : la vue reste cadrée pile sur le terrain.
   * Voir docs/DATA_MODEL.md, section "Marge sideline".
   */
  sidelineMarginMeters?: number;
  /** Couleurs personnalisées ; absent = valeurs par défaut (voir presets/fieldColors.ts). */
  colors?: FieldColors;
}

export type Team = "offense" | "defense";

export interface Entity {
  /** Identifiant stable sur toute l'action (une entité = un joueur qui persiste frame après frame). */
  id: string;
  team: Team;
  /** Libellé affiché, ex: "1", "H1", "D3" — libre. */
  label: string;
  /** Position en % de la largeur du terrain ; peut sortir de [0,100] pour une position hors-ligne (sideline). */
  x: number;
  /** Position en % de la longueur du terrain (0-100). */
  y: number;
}

/**
 * Position du disque, toujours libre (pas d'attache à un joueur — voir
 * `docs/ARCHITECTURE.md` §8) : positionné par glisser-déposer direct sur le terrain.
 */
export interface Disc {
  /** Peut sortir de [0,100] (sideline), comme les positions des entités. */
  x: number;
  y: number;
}

export interface CurveControlPoint {
  /** 0-100, coordonnées relatives comme toutes les positions du modèle. */
  x: number;
  y: number;
}

/** Clé = id d'entité, ou "disc" pour le disque. Voir docs/DATA_MODEL.md §8. */
export type IncomingCurves = Record<string, CurveControlPoint>;

export interface Frame {
  id: string;
  /** Frame précédente dans l'arbre ; null uniquement pour LA frame racine. Voir docs/DATA_MODEL.md §9. */
  parentId: string | null;
  /** Position parmi les frames partageant le même parentId (ordre des branches à un embranchement). */
  siblingOrder: number;
  /** Nom court de cette branche (ex. "Autour", "Strike") ; obligatoire si le parent a plus d'un enfant. */
  branchLabel?: string;
  /** Annotation libre affichée pendant l'édition et la lecture. */
  note?: string;
  /** Durée de l'interpolation DEPUIS la frame précédente en mode "fluide". */
  transitionMs?: number;
  entities: Entity[];
  disc: Disc;
  /** Courbure optionnelle du/des segment(s) arrivant depuis la frame précédente. */
  incomingCurves?: IncomingCurves;
}

export interface Action {
  id: string;
  schemaVersion: 1;
  name: string;
  /** Libre, ex: ["stack vertical", "iso"] — utilisé par la future bibliothèque. */
  tags: string[];
  fieldConfig: FieldConfig;
  /** Durée par défaut d'une transition en mode fluide (ex: 1200). */
  defaultTransitionMs: number;
  /** Arbre à plat (voir docs/DATA_MODEL.md §9) ; toujours >= 1 ; exactement une frame avec parentId === null. */
  frames: Frame[];
  /** ISO 8601 */
  createdAt: string;
  updatedAt: string;
}
