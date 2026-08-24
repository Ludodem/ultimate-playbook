import type Konva from "konva";
import { Circle } from "react-konva";
import { findColocatedEntity, resolveDiscPosition } from "../../domain/disc";
import type { Disc, Entity } from "../../domain/models";
import { DISC_FILL_COLOR, DISC_STROKE_COLOR } from "./theme";

interface DiscMarkerProps {
  disc: Disc;
  entities: Entity[];
  toX: (percent: number) => number;
  toY: (percent: number) => number;
  radius: number;
  /** Rayon (px) de l'entité porteuse, pour décaler visuellement le disque quand
   * il est en main — sinon il recouvre entièrement le label du joueur. */
  heldOffset: number;
  /** Présent seulement en mode édition ; le disque n'est draggable que libre (non tenu). */
  draggable?: boolean;
  onDragEnd?: (px: number, py: number) => void;
}

export function DiscMarker({
  disc,
  entities,
  toX,
  toY,
  radius,
  heldOffset,
  draggable = false,
  onDragEnd,
}: DiscMarkerProps) {
  const position = resolveDiscPosition(disc, entities);
  if (!position) return null;

  // Décalage purement visuel (coin haut-droit), basé sur la coïncidence de
  // position plutôt que sur `disc.heldBy` : ce dernier ne survit pas à
  // l'interpolation entre deux frames (voir domain/interpolation.ts), alors
  // que la coïncidence de position, elle, reste vraie tout du long d'un
  // segment "le porteur marche en tenant le disque".
  const colocatedEntity = findColocatedEntity(position, entities);
  const offset = colocatedEntity ? heldOffset * 0.9 : 0;
  const canDrag = draggable && !disc.heldBy;

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onDragEnd?.(e.target.x(), e.target.y());
  };

  return (
    <Circle
      x={toX(position.x) + offset}
      y={toY(position.y) - offset}
      radius={radius}
      fill={DISC_FILL_COLOR}
      stroke={DISC_STROKE_COLOR}
      strokeWidth={1.5}
      draggable={canDrag}
      onDragEnd={canDrag ? handleDragEnd : undefined}
    />
  );
}
