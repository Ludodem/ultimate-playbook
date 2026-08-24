import type { Disc, Entity } from "./models";

export interface Position {
  x: number;
  y: number;
}

/**
 * Résout la position effective du disque pour une frame : soit celle de son
 * porteur (`heldBy`), soit sa position libre. Renvoie `null` si ni l'un ni
 * l'autre n'est disponible (donnée incohérente/incomplète).
 */
export function resolveDiscPosition(disc: Disc, entities: Entity[]): Position | null {
  if (disc.heldBy) {
    const holder = entities.find((e) => e.id === disc.heldBy);
    if (holder) return { x: holder.x, y: holder.y };
  }
  if (disc.x != null && disc.y != null) {
    return { x: disc.x, y: disc.y };
  }
  return null;
}

const COLOCATION_EPSILON = 0.01;

/**
 * Entité dont la position coïncide (quasi-)exactement avec `position`. Sert au
 * rendu (décaler visuellement le disque pour ne pas masquer un label) plutôt
 * qu'à `disc.heldBy`, qui ne survit pas à l'interpolation entre deux frames
 * (voir buildInterpolatedFrame) mais où la coïncidence de position, elle,
 * reste vraie tout du long d'un segment "le porteur marche en tenant le disque".
 */
export function findColocatedEntity(position: Position, entities: Entity[]): Entity | undefined {
  return entities.find(
    (e) =>
      Math.abs(e.x - position.x) < COLOCATION_EPSILON &&
      Math.abs(e.y - position.y) < COLOCATION_EPSILON,
  );
}
