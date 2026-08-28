/** Icônes SVG pour les boutons d'action du menu secondaire et de la barre
 * Étapes — même convention que `SetupIcons.tsx` (inline, `currentColor`). */

export function PlayerPlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3.5" fill="currentColor" />
      <path d="M2 20c0-4.5 3.5-7 7-7s7 2.5 7 7" fill="currentColor" />
      <path d="M18 9v6M15 12h6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="6" y="9" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
