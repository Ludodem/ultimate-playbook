import { Circle } from "react-konva";
import { resolveDiscPosition } from "../../domain/disc";
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
}

export function DiscMarker({ disc, entities, toX, toY, radius, heldOffset }: DiscMarkerProps) {
  const position = resolveDiscPosition(disc, entities);
  if (!position) return null;

  // Décalage purement visuel (coin haut-droit du porteur) : la position
  // logique du disque, utilisée pour l'interpolation, reste celle du porteur
  // (voir resolveDiscPosition / docs/DATA_MODEL.md).
  const offset = disc.heldBy ? heldOffset * 0.9 : 0;

  return (
    <Circle
      x={toX(position.x) + offset}
      y={toY(position.y) - offset}
      radius={radius}
      fill={DISC_FILL_COLOR}
      stroke={DISC_STROKE_COLOR}
      strokeWidth={1.5}
    />
  );
}
