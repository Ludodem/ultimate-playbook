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

// Le marqueur du porteur du disque (D1) force à GAUCHE — donc décalé à
// gauche de H1 — délibérément à l'opposé des défenseurs du stack (décalés à
// droite, `MARK_DX` positif) : une force cohérente sur tout l'effectif
// pousserait tous les défenseurs du même côté, pas seulement celui du
// porteur. Retour utilisateur direct, voir docs/ARCHITECTURE.md §8.
export function fiveVFiveVerticalStackPreset(): RosterPreset {
  const h1 = entity("offense", "H1", 50, 80);
  const h2 = entity("offense", "H2", 30, 92);
  const entities: Entity[] = [
    h1,
    h2,
    entity("offense", "1", 50, 55),
    entity("offense", "2", 50, 43),
    entity("offense", "3", 50, 31),
    entity("defense", "D1", h1.x - HANDLER_MARK_DX, h1.y - HANDLER_MARK_DY),
    entity("defense", "D2", h2.x + HANDLER_MARK_DX, h2.y - HANDLER_MARK_DY),
    entity("defense", "D3", 50 + MARK_DX, 55 + MARK_DY),
    entity("defense", "D4", 50 + MARK_DX, 43 + MARK_DY),
    entity("defense", "D5", 50 + MARK_DX, 31 + MARK_DY),
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
