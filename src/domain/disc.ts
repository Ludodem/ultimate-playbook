import type { Entity } from "./models";

export interface Position {
  x: number;
  y: number;
}

const COLOCATION_EPSILON = 0.01;

/**
 * Entité dont la position coïncide (quasi-)exactement avec `position`. Sert au
 * rendu : décaler visuellement le disque pour ne pas masquer le label du
 * joueur qui vient de le recevoir, quand le coach l'a positionné exactement
 * sur lui (voir DiscMarker.tsx).
 */
export function findColocatedEntity(position: Position, entities: Entity[]): Entity | undefined {
  return entities.find(
    (e) =>
      Math.abs(e.x - position.x) < COLOCATION_EPSILON &&
      Math.abs(e.y - position.y) < COLOCATION_EPSILON,
  );
}
