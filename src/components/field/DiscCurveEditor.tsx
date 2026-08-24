import type Konva from "konva";
import { Circle, Line } from "react-konva";
import type { Position } from "../../domain/disc";
import { controlPointForMidpoint, sampleQuadraticBezier } from "../../domain/interpolation";
import { DISC_ARROW_COLOR, DISC_FILL_COLOR, DISC_STROKE_COLOR } from "./theme";

interface DiscCurveEditorProps {
  /** Position résolue du disque sur la frame précédente (le "fantôme"). */
  fromPosition: Position;
  /** Position résolue du disque sur la frame courante. */
  toPosition: Position;
  /** Sommet réel de la courbe (t=0.5) — voir domain/interpolation.ts `curveMidpoint`. */
  midpoint: Position;
  toX: (percent: number) => number;
  toY: (percent: number) => number;
  fromX: (px: number) => number;
  fromY: (py: number) => number;
  /** Plage draggable sur l'axe largeur (inclut la marge sideline si activée). */
  minX: number;
  maxX: number;
  radius: number;
  onDragMove: (midpoint: Position) => void;
  onDragEnd: (midpoint: Position) => void;
}

const MIN_Y = 0;
const MAX_Y = 100;

/**
 * Édition de la trajectoire courbe du disque (Phase 6, docs/ROADMAP.md) :
 * disque "fantôme" à sa position sur la frame précédente, courbe pointillée
 * jusqu'à sa position actuelle, poignée draggable sur le sommet réel de la
 * courbe (pas le point de contrôle abstrait — voir `curveMidpoint`), bornée à
 * la zone visible pour ne jamais devenir invisible pendant le glisser tout en
 * gardant l'amplitude de courbure maximale atteignable dans cette zone.
 */
export function DiscCurveEditor({
  fromPosition,
  toPosition,
  midpoint,
  toX,
  toY,
  fromX,
  fromY,
  minX,
  maxX,
  radius,
  onDragMove,
  onDragEnd,
}: DiscCurveEditorProps) {
  const controlPoint = controlPointForMidpoint(fromPosition, toPosition, midpoint);
  const points = sampleQuadraticBezier(fromPosition, controlPoint, toPosition, 24).flatMap((p) => [
    toX(p.x),
    toY(p.y),
  ]);

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const clampToVisibleField = (point: Position): Position => ({
    x: clamp(point.x, minX, maxX),
    y: clamp(point.y, MIN_Y, MAX_Y),
  });

  const toFieldPoint = (e: Konva.KonvaEventObject<DragEvent>): Position =>
    clampToVisibleField({ x: fromX(e.target.x()), y: fromY(e.target.y()) });

  // Contraint la position du nœud Konva lui-même pendant le drag (et pas
  // seulement la valeur qu'on stocke ensuite) : sans ça, le handle suivrait le
  // pointeur au-delà des bords et disparaîtrait visuellement avant que React
  // n'ait l'occasion de le ramener dans les clous au prochain rendu.
  const dragBoundFunc = function (this: Konva.Node, pos: { x: number; y: number }) {
    const clamped = clampToVisibleField({ x: fromX(pos.x), y: fromY(pos.y) });
    return { x: toX(clamped.x), y: toY(clamped.y) };
  };

  return (
    <>
      <Line
        points={points}
        stroke={DISC_ARROW_COLOR}
        strokeWidth={2}
        dash={[6, 4]}
        listening={false}
      />
      <Circle
        x={toX(fromPosition.x)}
        y={toY(fromPosition.y)}
        radius={radius}
        fill={DISC_FILL_COLOR}
        stroke={DISC_STROKE_COLOR}
        strokeWidth={1.5}
        opacity={0.45}
        listening={false}
      />
      <Circle
        x={toX(midpoint.x)}
        y={toY(midpoint.y)}
        radius={radius * 0.85}
        fill={DISC_ARROW_COLOR}
        stroke="#ffffff"
        strokeWidth={1.5}
        draggable
        dragBoundFunc={dragBoundFunc}
        onDragMove={(e) => onDragMove(toFieldPoint(e))}
        onDragEnd={(e) => onDragEnd(toFieldPoint(e))}
      />
    </>
  );
}
