import { Circle, Group, Text } from "react-konva";
import type { Entity } from "../../domain/models";
import { ENTITY_COLORS, ENTITY_LABEL_COLOR } from "./theme";

interface EntityMarkerProps {
  entity: Entity;
  cx: number;
  cy: number;
  radius: number;
}

export function EntityMarker({ entity, cx, cy, radius }: EntityMarkerProps) {
  return (
    <Group>
      <Circle
        x={cx}
        y={cy}
        radius={radius}
        fill={ENTITY_COLORS[entity.team]}
        stroke="#ffffff"
        strokeWidth={1.5}
      />
      <Text
        x={cx - radius}
        y={cy - radius}
        width={radius * 2}
        height={radius * 2}
        text={entity.label}
        align="center"
        verticalAlign="middle"
        fontStyle="bold"
        fontSize={radius * 0.9}
        fill={ENTITY_LABEL_COLOR}
        listening={false}
      />
    </Group>
  );
}
