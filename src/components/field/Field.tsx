import { useEffect, useRef, useState } from "react";
import { Layer, Line, Rect, Stage } from "react-konva";
import {
  computeEndzones,
  computeVisibleXRangePercent,
  endzoneGoalLine,
} from "../../domain/geometry";
import type { FieldConfig, Frame } from "../../domain/models";
import { resolveFieldColors } from "../../domain/presets/fieldColors";
import { DiscMarker } from "./DiscMarker";
import { EntityMarker } from "./EntityMarker";

interface FieldProps {
  fieldConfig: FieldConfig;
  frame: Frame;
}

// Proportions des marqueurs relatives à la largeur *en jeu* du terrain (pas à
// la largeur totale du Stage, qui inclut la marge sideline éventuelle) — axe
// le plus contraignant en portrait mobile, valeurs ajustées visuellement.
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
export function Field({ fieldConfig, frame }: FieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

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

  const range = computeVisibleXRangePercent(fieldConfig);
  const rangeSpanPercent = range.max - range.min;
  // Largeur du terrain "en jeu" (hors marge sideline), en px.
  const fieldWidthPx = width * (100 / rangeSpanPercent);
  const height = fieldWidthPx * (fieldConfig.lengthMeters / fieldConfig.widthMeters);
  const colors = resolveFieldColors(fieldConfig.colors);
  const toX = (percent: number) => ((percent - range.min) / rangeSpanPercent) * width;
  const toY = (percent: number) => (percent / 100) * height;
  const entityRadius = fieldWidthPx * ENTITY_RADIUS_RATIO;
  const discRadius = fieldWidthPx * DISC_RADIUS_RATIO;
  const fieldLeft = toX(0);
  const fieldRight = toX(100);

  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      {width > 0 && height > 0 && (
        <Stage width={width} height={height}>
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

            {frame.entities.map((entity) => (
              <EntityMarker
                key={entity.id}
                entity={entity}
                cx={toX(entity.x)}
                cy={toY(entity.y)}
                radius={entityRadius}
              />
            ))}

            <DiscMarker
              disc={frame.disc}
              entities={frame.entities}
              toX={toX}
              toY={toY}
              radius={discRadius}
              heldOffset={entityRadius}
            />
          </Layer>
        </Stage>
      )}
    </div>
  );
}
