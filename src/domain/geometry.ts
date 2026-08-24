import type { FieldConfig } from "./models";

/** Bande d'en-but exprimée en % de la longueur du terrain (axe y). */
export interface EndzoneBand {
  yStart: number;
  yEnd: number;
}

/**
 * Renvoie les en-buts à dessiner (0, 1 ou 2 selon le type de terrain) sous
 * forme de bandes en % de la longueur — l'attaque progresse vers y=0
 * (convention utilisée par les presets d'effectif, voir docs/DATA_MODEL.md).
 */
export function computeEndzones(fieldConfig: FieldConfig): EndzoneBand[] {
  if (fieldConfig.type === "undefined" || !fieldConfig.endzoneMeters) {
    return [];
  }
  const depthPercent = (fieldConfig.endzoneMeters / fieldConfig.lengthMeters) * 100;
  const bands: EndzoneBand[] = [{ yStart: 0, yEnd: depthPercent }];
  if (fieldConfig.type === "full") {
    bands.push({ yStart: 100 - depthPercent, yEnd: 100 });
  }
  return bands;
}

/** Position (en %) de la ligne d'en-but à dessiner pour une bande donnée. */
export function endzoneGoalLine(band: EndzoneBand): number {
  return band.yStart === 0 ? band.yEnd : band.yStart;
}
