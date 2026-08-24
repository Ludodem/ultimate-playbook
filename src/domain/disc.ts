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
