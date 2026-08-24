import { useEffect, useRef, useState } from "react";
import { Layer, Line, Rect, Stage } from "react-konva";
import { computeEndzones, endzoneGoalLine } from "../../domain/geometry";
import type { FieldConfig, Frame } from "../../domain/models";
import { resolveFieldColors } from "../../domain/presets/fieldColors";
import { DiscMarker } from "./DiscMarker";
import { EntityMarker } from "./EntityMarker";

interface FieldProps {
  fieldConfig: FieldConfig;
  frame: Frame;
}

// Proportions des marqueurs relatives à la largeur du terrain (axe le plus
// contraignant en portrait mobile) — valeurs ajustées visuellement.
const ENTITY_RADIUS_RATIO = 0.038;
const DISC_RADIUS_RATIO = 0.022;
const LINE_WIDTH = 2;

/**
 * Rendu du terrain (lignes, en-but(s)) et des entités/disque d'une frame donnée.
 * Responsive : la largeur suit celle de son conteneur, la hauteur est déduite
 * du ratio longueur/largeur du `FieldConfig` pour garder les proportions réelles.
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

  const height = width * (fieldConfig.lengthMeters / fieldConfig.widthMeters);
  const colors = resolveFieldColors(fieldConfig.colors);
  const toX = (percent: number) => (percent / 100) * width;
  const toY = (percent: number) => (percent / 100) * height;
  const entityRadius = width * ENTITY_RADIUS_RATIO;
  const discRadius = width * DISC_RADIUS_RATIO;

  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      {width > 0 && height > 0 && (
        <Stage width={width} height={height}>
          <Layer>
            <Rect x={0} y={0} width={width} height={height} fill={colors.field} />

            {computeEndzones(fieldConfig).map((band) => (
              <Rect
                key={`${band.yStart}-${band.yEnd}`}
                x={0}
                y={toY(band.yStart)}
                width={width}
                height={toY(band.yEnd) - toY(band.yStart)}
                fill={colors.endzone}
              />
            ))}
            {computeEndzones(fieldConfig).map((band) => {
              const goalLineY = toY(endzoneGoalLine(band));
              return (
                <Line
                  key={`goal-line-${band.yStart}-${band.yEnd}`}
                  points={[0, goalLineY, width, goalLineY]}
                  stroke={colors.lines}
                  strokeWidth={LINE_WIDTH}
                />
              );
            })}

            <Rect
              x={0}
              y={0}
              width={width}
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
