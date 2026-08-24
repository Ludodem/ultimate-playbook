import type Konva from "konva";
import { useEffect, useRef, useState } from "react";
import { Layer, Line, Rect, Stage } from "react-konva";
import {
  computeEndzones,
  computeVisibleXRangePercent,
  endzoneGoalLine,
} from "../../domain/geometry";
import type { FieldConfig, Frame } from "../../domain/models";
import { resolveFieldColors } from "../../domain/presets/fieldColors";
import type { Position } from "../../domain/disc";
import { DiscCurveEditor } from "./DiscCurveEditor";
import { DiscMarker } from "./DiscMarker";
import { EntityMarker } from "./EntityMarker";
import { GhostFrame } from "./GhostFrame";
import { TrajectoryArrows } from "./TrajectoryArrows";
import { TrashZone } from "./TrashZone";

/** Édition de la courbe du disque (Phase 6, `docs/ROADMAP.md`). */
export interface DiscCurveEditing {
  fromPosition: Position;
  toPosition: Position;
  /** Sommet réel de la courbe (t=0.5), pas le point de contrôle abstrait — voir DiscCurveEditor.tsx. */
  midpoint: Position;
  onDragMove: (midpoint: Position) => void;
  onDragEnd: (midpoint: Position) => void;
}

/**
 * Callbacks d'édition (Phase 3, `docs/ROADMAP.md`). Absent = rendu statique
 * (comportement de la Phase 2, utilisé plus tard aussi par le mode lecture).
 */
export interface FieldInteractive {
  selectedEntityId: string | null;
  onEntitySelect: (id: string) => void;
  onEntityMove: (id: string, x: number, y: number) => void;
  /** Relâché sur la zone "corbeille" pendant un drag — alternative au bouton "Supprimer". */
  onEntityDelete: (id: string) => void;
  onDiscMove: (x: number, y: number) => void;
  /** Clic/tap sur une zone vide du terrain (coordonnées en %) — sert au mode
   * "sélectionner puis taper la destination" en plus du drag classique. */
  onFieldClick: (x: number, y: number) => void;
}

interface FieldProps {
  fieldConfig: FieldConfig;
  frame: Frame;
  interactive?: FieldInteractive;
  /** Frame suivante (mode lecture pas à pas, Phase 5) : si fournie, affiche les
   * flèches de trajectoire vers celle-ci. Sans effet en mode édition. */
  nextFrame?: Frame;
  /** Édition de la trajectoire courbe du disque (Phase 6), sur la frame en cours d'édition. */
  discCurveEditor?: DiscCurveEditing;
  /** Frame précédente affichée en fantôme discret pendant l'édition (voir GhostFrame.tsx). */
  ghostFrame?: Frame;
}

// Proportions des marqueurs relatives à la largeur du Stage — axe le plus
// contraignant en portrait mobile, valeurs ajustées visuellement.
const ENTITY_RADIUS_RATIO = 0.038;
const DISC_RADIUS_RATIO = 0.022;
const LINE_WIDTH = 2;

/**
 * Rendu du terrain (lignes, en-but(s)) et des entités/disque d'une frame donnée.
 * Responsive : la largeur suit celle de son conteneur, la hauteur est déduite
 * du ratio longueur/largeur du `FieldConfig` pour garder les proportions réelles.
 * Gère la marge sideline (`FieldConfig.sidelineMarginMeters`) : la plage rendue
 * sur l'axe largeur peut dépasser [0,100], voir docs/DATA_MODEL.md.
 */
export function Field({
  fieldConfig,
  frame,
  interactive,
  nextFrame,
  discCurveEditor,
  ghostFrame,
}: FieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [dragState, setDragState] = useState<{ entityId: string; isOverTrash: boolean } | null>(
    null,
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // La plage visible fait toujours exactement 100 points de pourcentage (voir
  // computeVisibleXRangePercent) : la marge sideline décale la fenêtre plutôt
  // que de l'élargir, donc `width` représente déjà "100% de terrain" que la
  // marge soit active ou non — ni le terrain ni les entités ne rétrécissent.
  const range = computeVisibleXRangePercent(fieldConfig);
  const rangeSpanPercent = range.max - range.min;
  const height = width * (fieldConfig.lengthMeters / fieldConfig.widthMeters);
  const colors = resolveFieldColors(fieldConfig.colors);
  const toX = (percent: number) => ((percent - range.min) / rangeSpanPercent) * width;
  const toY = (percent: number) => (percent / 100) * height;
  const fromX = (px: number) => range.min + (px / width) * rangeSpanPercent;
  const fromY = (py: number) => (py / height) * 100;
  const entityRadius = width * ENTITY_RADIUS_RATIO;
  const discRadius = width * DISC_RADIUS_RATIO;
  const fieldLeft = toX(0);
  const fieldRight = toX(100);

  // Zone "corbeille" affichée en coin supérieur droit du Stage pendant un drag
  // (coordonnées écran, indépendantes de la marge sideline éventuelle).
  const trashRadius = entityRadius * 1.4;
  const trashCenter = { x: width - trashRadius - 10, y: trashRadius + 10 };
  const isOverTrash = (px: number, py: number) =>
    Math.hypot(px - trashCenter.x, py - trashCenter.y) <= trashRadius;

  const handleStageClick = (e: Konva.KonvaEventObject<Event>) => {
    if (!interactive) return;
    const pos = e.target.getStage()?.getPointerPosition();
    if (pos) interactive.onFieldClick(fromX(pos.x), fromY(pos.y));
  };

  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      {width > 0 && height > 0 && (
        <Stage width={width} height={height} onClick={handleStageClick} onTap={handleStageClick}>
          <Layer>
            {/* Fond hors-ligne : recouvert par le rectangle terrain ci-dessous quand aucune marge n'est réservée. */}
            <Rect x={0} y={0} width={width} height={height} fill={colors.outOfBounds} />
            <Rect
              x={fieldLeft}
              y={0}
              width={fieldRight - fieldLeft}
              height={height}
              fill={colors.field}
            />

            {computeEndzones(fieldConfig).map((band) => (
              <Rect
                key={`${band.yStart}-${band.yEnd}`}
                x={fieldLeft}
                y={toY(band.yStart)}
                width={fieldRight - fieldLeft}
                height={toY(band.yEnd) - toY(band.yStart)}
                fill={colors.endzone}
              />
            ))}
            {computeEndzones(fieldConfig).map((band) => {
              const goalLineY = toY(endzoneGoalLine(band));
              return (
                <Line
                  key={`goal-line-${band.yStart}-${band.yEnd}`}
                  points={[fieldLeft, goalLineY, fieldRight, goalLineY]}
                  stroke={colors.lines}
                  strokeWidth={LINE_WIDTH}
                />
              );
            })}

            <Rect
              x={fieldLeft}
              y={0}
              width={fieldRight - fieldLeft}
              height={height}
              stroke={colors.lines}
              strokeWidth={LINE_WIDTH}
            />

            {ghostFrame && (
              <GhostFrame
                frame={ghostFrame}
                toX={toX}
                toY={toY}
                entityRadius={entityRadius}
                discRadius={discRadius}
              />
            )}

            {frame.entities.map((entity) => (
              <EntityMarker
                key={entity.id}
                entity={entity}
                cx={toX(entity.x)}
                cy={toY(entity.y)}
                radius={entityRadius}
                isSelected={interactive?.selectedEntityId === entity.id}
                draggable={Boolean(interactive)}
                onSelect={interactive ? () => interactive.onEntitySelect(entity.id) : undefined}
                onDragStart={
                  interactive
                    ? () => setDragState({ entityId: entity.id, isOverTrash: false })
                    : undefined
                }
                onDragMove={
                  interactive
                    ? (px, py) =>
                        setDragState({ entityId: entity.id, isOverTrash: isOverTrash(px, py) })
                    : undefined
                }
                onDragEnd={
                  interactive
                    ? (px, py) => {
                        const droppedOnTrash = isOverTrash(px, py);
                        setDragState(null);
                        if (droppedOnTrash) {
                          interactive.onEntityDelete(entity.id);
                        } else {
                          interactive.onEntityMove(entity.id, fromX(px), fromY(py));
                        }
                      }
                    : undefined
                }
              />
            ))}

            <DiscMarker
              disc={frame.disc}
              entities={frame.entities}
              toX={toX}
              toY={toY}
              radius={discRadius}
              heldOffset={entityRadius}
              draggable={Boolean(interactive)}
              onDragEnd={
                interactive ? (px, py) => interactive.onDiscMove(fromX(px), fromY(py)) : undefined
              }
            />

            <TrashZone
              cx={trashCenter.x}
              cy={trashCenter.y}
              radius={trashRadius}
              active={dragState !== null}
              isOver={dragState?.isOverTrash ?? false}
            />

            {nextFrame && (
              <TrajectoryArrows frame={frame} nextFrame={nextFrame} toX={toX} toY={toY} />
            )}

            {discCurveEditor && (
              <DiscCurveEditor
                {...discCurveEditor}
                toX={toX}
                toY={toY}
                fromX={fromX}
                fromY={fromY}
                minX={range.min}
                maxX={range.max}
                radius={discRadius * 1.3}
              />
            )}
          </Layer>
        </Stage>
      )}
    </div>
  );
}
