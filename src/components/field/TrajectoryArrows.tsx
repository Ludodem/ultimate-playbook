import { Arrow } from "react-konva";
import { resolveDiscPosition } from "../../domain/disc";
import { sampleQuadraticBezier } from "../../domain/interpolation";
import type { Frame } from "../../domain/models";
import { DISC_ARROW_COLOR, PLAYER_ARROW_COLOR } from "./theme";

interface TrajectoryArrowsProps {
  frame: Frame;
  nextFrame: Frame;
  toX: (percent: number) => number;
  toY: (percent: number) => number;
}

/**
 * Flèches indiquant la trajectoire vers la frame suivante en mode lecture pas
 * à pas (Phase 5) : une flèche pleine par joueur en mouvement, une flèche
 * pointillée pour le disque — voir docs/PRD.md §4.4.
 */
export function TrajectoryArrows({ frame, nextFrame, toX, toY }: TrajectoryArrowsProps) {
  const currentById = new Map(frame.entities.map((e) => [e.id, e]));

  const playerArrows = nextFrame.entities.flatMap((next) => {
    const current = currentById.get(next.id);
    if (!current || (current.x === next.x && current.y === next.y)) return [];
    return [
      <Arrow
        key={next.id}
        points={[toX(current.x), toY(current.y), toX(next.x), toY(next.y)]}
        stroke={PLAYER_ARROW_COLOR}
        fill={PLAYER_ARROW_COLOR}
        strokeWidth={2}
        pointerLength={8}
        pointerWidth={8}
        listening={false}
      />,
    ];
  });

  const discFrom = resolveDiscPosition(frame.disc, frame.entities);
  const discTo = resolveDiscPosition(nextFrame.disc, nextFrame.entities);
  const showDiscArrow = discFrom && discTo && (discFrom.x !== discTo.x || discFrom.y !== discTo.y);
  const discControlPoint = nextFrame.incomingCurves?.disc;

  // Trajectoire réelle (voir docs/DATA_MODEL.md §8) : courbe si un point de
  // contrôle est défini pour ce segment, sinon ligne droite (2 points).
  const discPoints =
    discFrom && discTo
      ? discControlPoint
        ? sampleQuadraticBezier(discFrom, discControlPoint, discTo, 24).flatMap((p) => [
            toX(p.x),
            toY(p.y),
          ])
        : [toX(discFrom.x), toY(discFrom.y), toX(discTo.x), toY(discTo.y)]
      : [];

  return (
    <>
      {playerArrows}
      {showDiscArrow && (
        <Arrow
          points={discPoints}
          stroke={DISC_ARROW_COLOR}
          fill={DISC_ARROW_COLOR}
          strokeWidth={2}
          dash={[6, 4]}
          pointerLength={8}
          pointerWidth={8}
          listening={false}
        />
      )}
    </>
  );
}
