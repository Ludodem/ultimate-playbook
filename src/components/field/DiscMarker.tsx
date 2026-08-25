import type Konva from "konva";
import { Circle } from "react-konva";
import { findColocatedEntity } from "../../domain/disc";
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
  /** Présent seulement en mode édition. */
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
  // Décalage purement visuel (coin haut-droit) quand le disque est positionné
  // pile sur un joueur, pour ne pas recouvrir son label.
  const colocatedEntity = findColocatedEntity(disc, entities);
  const offset = colocatedEntity ? heldOffset * 0.9 : 0;

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onDragEnd?.(e.target.x(), e.target.y());
  };

  return (
    <Circle
      x={toX(disc.x) + offset}
      y={toY(disc.y) - offset}
      radius={radius}
      fill={DISC_FILL_COLOR}
      stroke={DISC_STROKE_COLOR}
      strokeWidth={1.5}
      draggable={draggable}
      onDragEnd={draggable ? handleDragEnd : undefined}
    />
  );
}
