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

/** Plage (en %) de l'axe largeur à rendre à l'écran. */
export interface VisibleRange {
  min: number;
  max: number;
}

/**
 * Plage visible sur l'axe largeur, incluant la marge sideline éventuelle
 * (voir docs/DATA_MODEL.md, section "Marge sideline"). `{ min: 0, max: 100 }`
 * quand `sidelineMarginMeters` est absent/0 — comportement inchangé par défaut.
 *
 * Une seule sideline visible (celle du côté x=100), pas les deux : plutôt que
 * d'étendre la plage symétriquement (ce qui rétrécirait tout à l'écran pour
 * tenir dans la même largeur de conteneur), l'étendue reste toujours de 100
 * points de pourcentage — juste décalée. La marge "coûte" donc une tranche
 * équivalente prise sur le bord opposé du terrain (x proche de 0, hors-champ),
 * pas une réduction de la taille des entités/du terrain affiché.
 */
export function computeVisibleXRangePercent(fieldConfig: FieldConfig): VisibleRange {
  if (!fieldConfig.sidelineMarginMeters) {
    return { min: 0, max: 100 };
  }
  const marginPercent = (fieldConfig.sidelineMarginMeters / fieldConfig.widthMeters) * 100;
  return { min: marginPercent, max: 100 + marginPercent };
}
