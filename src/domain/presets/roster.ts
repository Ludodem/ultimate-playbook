import type { Disc, Entity, Team } from "../models";

/**
 * Ce qu'un preset d'effectif produit : prêt à devenir la première frame
 * d'une nouvelle action (voir docs/DATA_MODEL.md §5).
 */
export interface RosterPreset {
  entities: Entity[];
  disc: Disc;
}

function entity(team: Team, label: string, x: number, y: number, hasDisc = false): Entity {
  return {
    id: crypto.randomUUID(),
    team,
    label,
    x,
    y,
    ...(hasDisc ? { hasDisc: true } : {}),
  };
}

/** Terrain vide, 0 joueur — point de départ pour composer un effectif libre. */
export function emptyPreset(): RosterPreset {
  return { entities: [], disc: { x: 50, y: 50 } };
}

function discOnHolder(entities: Entity[]): Disc {
  const holder = entities.find((e) => e.hasDisc);
  if (!holder) {
    throw new Error("Roster preset must designate exactly one disc holder");
  }
  return { heldBy: holder.id, x: holder.x, y: holder.y };
}

/**
 * 5 offense (2 handlers + 3 cutters en stack vertical) face à 5 defense en
 * marquage individuel simple (léger décalage vers le large côté force).
 * Coordonnées indicatives, ajustables librement par le coach une fois placées.
 */
// Décalage appliqué à chaque défenseur par rapport à l'attaquant qu'il marque :
// suffisamment grand pour qu'aucune paire non appariée ne se chevauche (les
// pastilles font ~7-8% de la largeur du terrain de diamètre à l'écran).
const MARK_DX = 14;
const MARK_DY = -3;

export function fiveVFiveVerticalStackPreset(): RosterPreset {
  const entities: Entity[] = [
    entity("offense", "H1", 50, 80, true),
    entity("offense", "H2", 30, 92),
    entity("offense", "1", 50, 55),
    entity("offense", "2", 50, 43),
    entity("offense", "3", 50, 31),
    entity("defense", "D1", 50 + MARK_DX, 80 + MARK_DY),
    entity("defense", "D2", 30 + MARK_DX, 92 + MARK_DY),
    entity("defense", "D3", 50 + MARK_DX, 55 + MARK_DY),
    entity("defense", "D4", 50 + MARK_DX, 43 + MARK_DY),
    entity("defense", "D5", 50 + MARK_DX, 31 + MARK_DY),
  ];
  return { entities, disc: discOnHolder(entities) };
}

/**
 * Variante avec les 3 cutters alignés horizontalement plutôt qu'en colonne.
 */
export function fiveVFiveHorizontalStackPreset(): RosterPreset {
  const entities: Entity[] = [
    entity("offense", "H1", 50, 80, true),
    entity("offense", "H2", 30, 92),
    entity("offense", "1", 25, 55),
    entity("offense", "2", 50, 55),
    entity("offense", "3", 75, 55),
    entity("defense", "D1", 50 + MARK_DX, 80 + MARK_DY),
    entity("defense", "D2", 30 + MARK_DX, 92 + MARK_DY),
    entity("defense", "D3", 25 + MARK_DX, 55 + MARK_DY),
    entity("defense", "D4", 50 + MARK_DX, 55 + MARK_DY),
    entity("defense", "D5", 75 + MARK_DX, 55 + MARK_DY),
  ];
  return { entities, disc: discOnHolder(entities) };
}
