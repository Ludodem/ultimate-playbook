import { resolveDiscPosition, type Position } from "./disc";
import type { Frame } from "./models";

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function interpolatePosition(a: Position, b: Position, t: number): Position {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

/**
 * Construit une frame "virtuelle" à l'instant t (0-1) entre deux frames
 * consécutives d'un même chemin, réutilisable telle quelle par `Field`
 * (mêmes types `entities`/`disc`) — voir docs/ARCHITECTURE.md §4.
 *
 * - Une entité présente dans les deux frames est interpolée en ligne droite
 *   (courbe de Bézier réservée au disque, Phase 6, voir docs/DATA_MODEL.md §8).
 * - Une entité ajoutée entre les deux frames (absente de `from`) apparaît
 *   directement à sa position dans `to`, sans animation d'entrée.
 * - Le disque est interpolé entre ses positions résolues (`resolveDiscPosition`)
 *   dans chaque frame, qu'il soit tenu ou libre.
 */
export function buildInterpolatedFrame(from: Frame, to: Frame, t: number): Frame {
  const fromById = new Map(from.entities.map((e) => [e.id, e]));

  const entities = to.entities.map((entity) => {
    const start = fromById.get(entity.id);
    if (!start) return entity;
    const position = interpolatePosition(start, entity, t);
    return { ...entity, ...position };
  });

  const discFrom = resolveDiscPosition(from.disc, from.entities);
  const discTo = resolveDiscPosition(to.disc, to.entities);
  const discPosition = discFrom && discTo ? interpolatePosition(discFrom, discTo, t) : discTo;

  return {
    ...to,
    entities,
    disc: discPosition ? { x: discPosition.x, y: discPosition.y } : to.disc,
  };
}
