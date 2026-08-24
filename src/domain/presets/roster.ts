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
export function fiveVFiveVerticalStackPreset(): RosterPreset {
  const entities: Entity[] = [
    entity("offense", "H1", 50, 85, true),
    entity("offense", "H2", 35, 90),
    entity("offense", "1", 50, 55),
    entity("offense", "2", 50, 45),
    entity("offense", "3", 50, 35),
    entity("defense", "D1", 56, 85),
    entity("defense", "D2", 41, 90),
    entity("defense", "D3", 56, 55),
    entity("defense", "D4", 56, 45),
    entity("defense", "D5", 56, 35),
  ];
  return { entities, disc: discOnHolder(entities) };
}

/**
 * Variante avec les 3 cutters alignés horizontalement plutôt qu'en colonne.
 */
export function fiveVFiveHorizontalStackPreset(): RosterPreset {
  const entities: Entity[] = [
    entity("offense", "H1", 50, 85, true),
    entity("offense", "H2", 35, 90),
    entity("offense", "1", 25, 55),
    entity("offense", "2", 50, 55),
    entity("offense", "3", 75, 55),
    entity("defense", "D1", 56, 85),
    entity("defense", "D2", 41, 90),
    entity("defense", "D3", 31, 55),
    entity("defense", "D4", 56, 55),
    entity("defense", "D5", 81, 55),
  ];
  return { entities, disc: discOnHolder(entities) };
}
