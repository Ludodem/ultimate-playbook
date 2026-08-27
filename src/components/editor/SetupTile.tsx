import type { ReactNode } from "react";

interface SetupTileProps {
  icon: ReactNode;
  label: string;
  selected: boolean;
  onClick: () => void;
}

/** Grosse tuile cliquable avec icône (Phase 9, docs/PRD.md §4.9) — remplace
 * les boutons radio de l'écran de création, utilisée à l'identique pour le
 * choix du terrain et celui de l'effectif. */
export function SetupTile({ icon, label, selected, onClick }: SetupTileProps) {
  return (
    <button
      type="button"
      className={`setup-tile${selected ? " is-selected" : ""}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      <span className="setup-tile-icon">{icon}</span>
      <span className="setup-tile-label">{label}</span>
    </button>
  );
}
