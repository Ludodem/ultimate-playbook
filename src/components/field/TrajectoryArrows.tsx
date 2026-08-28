import { Arrow } from "react-konva";
import { sampleQuadraticBezier } from "../../domain/interpolation";
import type { Frame } from "../../domain/models";
import { DISC_ARROW_COLOR, PLAYER_ARROW_COLOR } from "./theme";

interface TrajectoryArrowsProps {
  frame: Frame;
  nextFrame: Frame;
  toX: (widthPercent: number, lengthPercent: number) => number;
  toY: (widthPercent: number, lengthPercent: number) => number;
}

/**
 * Flèches indiquant la trajectoire vers la frame suivante en mode lecture pas
 * à pas (Phase 5) : une flèche pleine par joueur **offense** en mouvement
 * (les défenseurs n'en ont pas — l'outil est pensé pour des plays d'attaque,
 * les flèches défense n'ajoutaient que du bruit visuel, retour utilisateur
 * direct voir docs/ARCHITECTURE.md §8), une flèche pointillée pour le disque
 * — voir docs/PRD.md §4.4.
 */
export function TrajectoryArrows({ frame, nextFrame, toX, toY }: TrajectoryArrowsProps) {
  const currentById = new Map(frame.entities.map((e) => [e.id, e]));

  const playerArrows = nextFrame.entities
    .filter((entity) => entity.team === "offense")
    .flatMap((next) => {
      const current = currentById.get(next.id);
      if (!current || (current.x === next.x && current.y === next.y)) return [];
      return [
        <Arrow
          key={next.id}
          points={[
            toX(current.x, current.y),
            toY(current.x, current.y),
            toX(next.x, next.y),
            toY(next.x, next.y),
          ]}
          stroke={PLAYER_ARROW_COLOR}
          fill={PLAYER_ARROW_COLOR}
          strokeWidth={2}
          pointerLength={8}
          pointerWidth={8}
          listening={false}
        />,
      ];
    });

  const discFrom = frame.disc;
  const discTo = nextFrame.disc;
  const showDiscArrow = discFrom.x !== discTo.x || discFrom.y !== discTo.y;
  const discControlPoint = nextFrame.incomingCurves?.disc;

  // Trajectoire réelle (voir docs/DATA_MODEL.md §8) : courbe si un point de
  // contrôle est défini pour ce segment, sinon ligne droite (2 points).
  const discPoints = discControlPoint
    ? sampleQuadraticBezier(discFrom, discControlPoint, discTo, 24).flatMap((p) => [
        toX(p.x, p.y),
        toY(p.x, p.y),
      ])
    : [
        toX(discFrom.x, discFrom.y),
        toY(discFrom.x, discFrom.y),
        toX(discTo.x, discTo.y),
        toY(discTo.x, discTo.y),
      ];

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
