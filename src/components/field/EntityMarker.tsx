import type Konva from "konva";
import { Circle, Group, Text } from "react-konva";
import type { Entity } from "../../domain/models";
import { ENTITY_COLORS, ENTITY_LABEL_COLOR, SELECTION_STROKE_COLOR } from "./theme";

interface EntityMarkerProps {
  entity: Entity;
  cx: number;
  cy: number;
  radius: number;
  isSelected?: boolean;
  /** Présent seulement en mode édition (voir Field.tsx `interactive`). */
  draggable?: boolean;
  onSelect?: () => void;
  onDragEnd?: (px: number, py: number) => void;
}

export function EntityMarker({
  entity,
  cx,
  cy,
  radius,
  isSelected = false,
  draggable = false,
  onSelect,
  onDragEnd,
}: EntityMarkerProps) {
  const handleSelect = (e: Konva.KonvaEventObject<Event>) => {
    e.cancelBubble = true; // évite de déclencher aussi le clic "fond du terrain"
    onSelect?.();
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onDragEnd?.(e.target.x(), e.target.y());
  };

  return (
    <Group>
      <Circle
        x={cx}
        y={cy}
        radius={radius}
        fill={ENTITY_COLORS[entity.team]}
        stroke={isSelected ? SELECTION_STROKE_COLOR : "#ffffff"}
        strokeWidth={isSelected ? 3 : 1.5}
        draggable={draggable}
        onClick={handleSelect}
        onTap={handleSelect}
        onDragEnd={handleDragEnd}
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
