import type { Disc, Entity, Team } from "../models";

/**
 * Ce qu'un preset d'effectif produit : prêt à devenir la première frame
 * d'une nouvelle action (voir docs/DATA_MODEL.md §5).
 */
export interface RosterPreset {
  entities: Entity[];
  disc: Disc;
}

function entity(team: Team, label: string, x: number, y: number): Entity {
  return { id: crypto.randomUUID(), team, label, x, y };
}

/** Terrain vide, 0 joueur — point de départ pour composer un effectif libre. */
export function emptyPreset(): RosterPreset {
  return { entities: [], disc: { x: 50, y: 50 } };
}

/**
 * 5 offense (2 handlers + 3 cutters en stack vertical) face à 5 defense en
 * marquage individuel simple. Coordonnées indicatives, ajustables librement
 * par le coach une fois placées.
 */
// Décalage appliqué à un défenseur de cutter par rapport à l'attaquant qu'il
// marque : suffisamment grand pour qu'aucune paire non appariée ne se
// chevauche (les pastilles font ~7-8% de la largeur du terrain de diamètre à
// l'écran).
const MARK_DX = 14;
const MARK_DY = -3;

// Marquage d'un handler (porteur potentiel du disque) : contrairement aux
// cutters (alignés en stack, décalage surtout latéral pour ne pas se
// superposer), le défenseur d'un handler se place réellement DEVANT lui,
// entre le porteur et la direction d'attaque (y=0, voir docs/DATA_MODEL.md),
// avec un léger décalage latéral pour figurer une force. Léger décalage,
// contrairement à MARK_DX qui vise avant tout à éviter le chevauchement visuel.
const HANDLER_MARK_DX = 5;
const HANDLER_MARK_DY = 9;

// Positions ajustées à la main par l'utilisateur dans l'éditeur puis
// exportées en JSON (voir docs/ARCHITECTURE.md §8) : coordonnées littérales
// plutôt que dérivées de `MARK_DX`/`HANDLER_MARK_DY` comme avant, ce layout
// ne suit plus une règle uniforme (H2 notamment déplacé loin sur le côté
// fort, D2 marquant désormais depuis l'intérieur plutôt que l'extérieur).
export function fiveVFiveVerticalStackPreset(): RosterPreset {
  const h1 = entity("offense", "H1", 50, 79);
  const entities: Entity[] = [
    h1,
    entity("offense", "H2", 86, 96),
    entity("offense", "1", 45, 55),
    entity("offense", "2", 45, 41),
    entity("offense", "3", 45, 27),
    entity("defense", "D1", 41, 78),
    entity("defense", "D2", 79, 89),
    entity("defense", "D3", 59, 55),
    entity("defense", "D4", 59, 41),
    entity("defense", "D5", 60, 27),
  ];
  return { entities, disc: { x: h1.x, y: h1.y } };
}

/**
 * Variante avec les 3 cutters alignés horizontalement plutôt qu'en colonne.
 */
export function fiveVFiveHorizontalStackPreset(): RosterPreset {
  const h1 = entity("offense", "H1", 50, 80);
  const h2 = entity("offense", "H2", 30, 92);
  const entities: Entity[] = [
    h1,
    h2,
    entity("offense", "1", 25, 55),
    entity("offense", "2", 50, 55),
    entity("offense", "3", 75, 55),
    entity("defense", "D1", h1.x - HANDLER_MARK_DX, h1.y - HANDLER_MARK_DY),
    entity("defense", "D2", h2.x + HANDLER_MARK_DX, h2.y - HANDLER_MARK_DY),
    entity("defense", "D3", 25 + MARK_DX, 55 + MARK_DY),
    entity("defense", "D4", 50 + MARK_DX, 55 + MARK_DY),
    entity("defense", "D5", 75 + MARK_DX, 55 + MARK_DY),
  ];
  return { entities, disc: { x: h1.x, y: h1.y } };
}
