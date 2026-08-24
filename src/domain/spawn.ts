import type { Entity } from "./models";

interface Point {
  x: number;
  y: number;
}

const CENTER: Point = { x: 50, y: 50 };
/** Distance minimale (en % de la largeur du terrain) pour considérer une position "libre". */
const MIN_DISTANCE_PERCENT = 9;
const RING_COUNT = 6;
const POINTS_PER_RING = 8;
const RING_STEP_PERCENT = 6;

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function isFree(candidate: Point, others: Entity[]): boolean {
  return others.every((e) => distance(candidate, e) >= MIN_DISTANCE_PERCENT);
}

/** Ramène une coordonnée dans une plage jouable, en évitant les bords extrêmes du terrain. */
function clampToField(value: number): number {
  return Math.min(95, Math.max(5, value));
}

/**
 * Cherche une position libre proche du centre du terrain (recherche en
 * anneaux concentriques), pour qu'un nouveau joueur n'apparaisse pas
 * exactement sur un joueur existant. Retombe sur le centre si le terrain
 * est trop chargé pour trouver mieux (au-delà de MAX_RECOMMENDED_PER_TEAM,
 * voir actionEditorStore.ts, un chevauchement reste possible — attendu).
 */
export function findFreeSpawnPosition(existing: Entity[]): Point {
  if (isFree(CENTER, existing)) return CENTER;

  for (let ring = 1; ring <= RING_COUNT; ring++) {
    const radius = ring * RING_STEP_PERCENT;
    for (let i = 0; i < POINTS_PER_RING; i++) {
      const angle = (2 * Math.PI * i) / POINTS_PER_RING;
      const candidate: Point = {
        x: clampToField(CENTER.x + radius * Math.cos(angle)),
        y: clampToField(CENTER.y + radius * Math.sin(angle)),
      };
      if (isFree(candidate, existing)) return candidate;
    }
  }
  return CENTER;
}
