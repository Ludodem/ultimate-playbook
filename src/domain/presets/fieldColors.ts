import type { FieldColors } from "../models";

// Gris neutre (sol de gymnase indoor) + bleu pour l'en-but (convention indoor) :
// pratique (bon contraste avec les entités colorées) et esthétique.
// Voir docs/DATA_MODEL.md, section "Couleurs par défaut", pour la justification complète.
export const DEFAULT_FIELD_COLORS: FieldColors = {
  field: "#D9DBDE",
  endzone: "#3D6FB4",
  lines: "#4B4F58",
  outOfBounds: "#BFC2C7",
};

/**
 * Résout les couleurs effectives d'un terrain : les valeurs fournies (partielles ou
 * complètes) surchargent les valeurs par défaut. Ne jamais lire DEFAULT_FIELD_COLORS
 * directement depuis un composant de rendu — toujours passer par cette fonction.
 */
export function resolveFieldColors(colors?: Partial<FieldColors>): FieldColors {
  return { ...DEFAULT_FIELD_COLORS, ...colors };
}
