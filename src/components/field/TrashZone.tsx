import { Circle, Group, Line, Rect } from "react-konva";

interface TrashZoneProps {
  cx: number;
  cy: number;
  radius: number;
  /** Visible seulement pendant qu'une entité est en cours de glisser-déposer. */
  active: boolean;
  /** Le pointeur survole actuellement la zone — s'apprête à supprimer au relâchement. */
  isOver: boolean;
}

const ICON_COLOR = "#ffffff";
const IDLE_BG = "#8B95A1";
const ARMED_BG = "#C0392B";

/**
 * Zone de dépôt "corbeille" affichée pendant le drag d'une entité (Phase 3+) :
 * la relâcher ici la supprime, alternative plus découvrable au bouton
 * "Supprimer" du panneau de sélection.
 */
export function TrashZone({ cx, cy, radius, active, isOver }: TrashZoneProps) {
  if (!active) return null;

  const binWidth = radius * 0.9;
  const binHeight = radius * 0.7;
  const lidY = -binHeight / 2 - 2;

  return (
    <Group x={cx} y={cy} listening={false}>
      <Circle radius={radius} fill={isOver ? ARMED_BG : IDLE_BG} opacity={0.95} />
      <Rect
        x={-binWidth / 2}
        y={-binHeight / 2}
        width={binWidth}
        height={binHeight}
        cornerRadius={1.5}
        stroke={ICON_COLOR}
        strokeWidth={2}
      />
      <Line
        points={[-binWidth / 2 - 3, lidY, binWidth / 2 + 3, lidY]}
        stroke={ICON_COLOR}
        strokeWidth={2}
      />
    </Group>
  );
}
