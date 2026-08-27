/**
 * Petit set d'icônes SVG dédiées pour l'écran de création (Phase 9,
 * docs/PRD.md §4.9) : `currentColor` partout pour hériter la couleur de la
 * tuile (`.setup-tile`), donc aucun style à dupliquer pour l'état
 * sélectionné/survolé. Vocabulaire visuel volontairement réutilisé du terrain
 * réel (bande d'en-but, cercles de joueur) plutôt qu'un set d'icônes
 * générique — reconnaissable au premier coup d'œil.
 */

export function HalfFieldIcon() {
  return (
    <svg viewBox="0 0 32 44" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="28" height="40" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="2" y="2" width="28" height="10" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

export function FullFieldIcon() {
  return (
    <svg viewBox="0 0 32 44" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="28" height="40" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="2" y="2" width="28" height="8" fill="currentColor" opacity="0.35" />
      <rect x="2" y="34" width="28" height="8" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

export function SidelineFieldIcon() {
  return (
    <svg viewBox="0 0 32 44" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="22" height="40" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="2" y="2" width="22" height="10" fill="currentColor" opacity="0.35" />
      <rect
        x="25"
        y="2"
        width="5"
        height="40"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="3 2"
      />
    </svg>
  );
}

export function VerticalStackIcon() {
  return (
    <svg viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <circle cx="22" cy="7" r="4" fill="currentColor" />
      <circle cx="22" cy="17.5" r="4" fill="currentColor" />
      <circle cx="22" cy="28" r="4" fill="currentColor" />
      <circle cx="22" cy="38.5" r="4" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

export function HorizontalStackIcon() {
  return (
    <svg viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <circle cx="7" cy="22" r="4" fill="currentColor" />
      <circle cx="17.5" cy="22" r="4" fill="currentColor" />
      <circle cx="28" cy="22" r="4" fill="currentColor" />
      <circle cx="38.5" cy="22" r="4" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

export function EmptyRosterIcon() {
  return (
    <svg viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <circle cx="22" cy="22" r="14" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
    </svg>
  );
}
