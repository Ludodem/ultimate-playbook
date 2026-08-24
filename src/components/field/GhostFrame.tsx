import { Circle, Group, Text } from "react-konva";
import { resolveDiscPosition } from "../../domain/disc";
import type { Frame } from "../../domain/models";
import { DISC_FILL_COLOR, DISC_STROKE_COLOR, ENTITY_COLORS, ENTITY_LABEL_COLOR } from "./theme";

interface GhostFrameProps {
  frame: Frame;
  toX: (percent: number) => number;
  toY: (percent: number) => number;
  entityRadius: number;
  discRadius: number;
}

const GHOST_OPACITY = 0.3;

/**
 * Aperçu "fantôme" de la frame précédente pendant l'édition de la frame
 * courante : discret (opacité réduite) et non interactif, pour voir
 * immédiatement ce qui a changé sans polluer la lecture de la frame en cours.
 */
export function GhostFrame({ frame, toX, toY, entityRadius, discRadius }: GhostFrameProps) {
  const discPosition = resolveDiscPosition(frame.disc, frame.entities);

  return (
    <Group opacity={GHOST_OPACITY} listening={false}>
      {frame.entities.map((entity) => (
        <Group key={entity.id} x={toX(entity.x)} y={toY(entity.y)}>
          <Circle
            radius={entityRadius}
            fill={ENTITY_COLORS[entity.team]}
            stroke="#ffffff"
            strokeWidth={1.5}
          />
          <Text
            x={-entityRadius}
            y={-entityRadius}
            width={entityRadius * 2}
            height={entityRadius * 2}
            text={entity.label}
            align="center"
            verticalAlign="middle"
            fontStyle="bold"
            fontSize={entityRadius * 0.9}
            fill={ENTITY_LABEL_COLOR}
          />
        </Group>
      ))}

      {discPosition && (
        <Circle
          x={toX(discPosition.x)}
          y={toY(discPosition.y)}
          radius={discRadius}
          fill={DISC_FILL_COLOR}
          stroke={DISC_STROKE_COLOR}
          strokeWidth={1.5}
        />
      )}
    </Group>
  );
}
