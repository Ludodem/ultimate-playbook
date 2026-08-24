import type { FieldConfig, FieldType } from "../models";
import { DEFAULT_FIELD_COLORS } from "./fieldColors";

// Dimensions indicatives pour un gymnase indoor standard (voir docs/DATA_MODEL.md §1).
// Restent des constantes ajustables ici, jamais dupliquées ailleurs dans le code.
const FIELD_DIMENSIONS: Record<FieldType, Omit<FieldConfig, "colors">> = {
  half: { type: "half", lengthMeters: 30, widthMeters: 18, endzoneMeters: 8 },
  full: { type: "full", lengthMeters: 60, widthMeters: 18, endzoneMeters: 8 },
  undefined: { type: "undefined", lengthMeters: 20, widthMeters: 18 },
};

/** Terrain par défaut proposé au MVP (voir docs/PRD.md §4.1). */
export const DEFAULT_FIELD_TYPE: FieldType = "half";

/**
 * Marge sideline appliquée quand le coach active l'option "long de ligne"
 * (voir docs/DATA_MODEL.md, section "Marge sideline"). Valeur indicative,
 * ajustable ; désactivée par défaut (getFieldPreset ne l'applique pas).
 */
export const DEFAULT_SIDELINE_MARGIN_METERS = 4;

export function getFieldPreset(type: FieldType): FieldConfig {
  return { ...FIELD_DIMENSIONS[type], colors: DEFAULT_FIELD_COLORS };
}
