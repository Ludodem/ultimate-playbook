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

/**
 * Orientation d'affichage du terrain (voir docs/PRD.md §4.8bis) : `portrait`
 * (par défaut, historique) fait progresser l'attaque de bas en haut ;
 * `landscape` la fait progresser de gauche à droite, en tournant le rendu de
 * 90°. Volontairement absente de `FieldConfig`/`Action` — c'est une
 * préférence d'affichage de session, jamais persistée (voir
 * `state/actionEditorStore.ts`).
 */
export type FieldOrientation = "portrait" | "landscape";

/** Point écran (pixels du Stage Konva). */
export interface ScreenPoint {
  x: number;
  y: number;
}

/**
 * Convertit un point du modèle (`widthPercent` = axe largeur, `visibleRange`
 * compris ; `lengthPercent` = axe longueur, 0-100) en pixel écran. En
 * portrait, l'axe largeur pilote X et l'axe longueur pilote Y ; en landscape,
 * l'inverse (et l'attaque, qui progresse vers longueur=0, va donc vers la
 * droite : `1 - lFrac`). Une rotation de 90° reste toujours alignée aux axes
 * (jamais de biais), donc chaque axe écran ne dépend jamais que d'un seul axe
 * du modèle.
 */
export function projectToScreen(
  widthPercent: number,
  lengthPercent: number,
  stageWidth: number,
  stageHeight: number,
  visibleRange: VisibleRange,
  orientation: FieldOrientation,
): ScreenPoint {
  const span = visibleRange.max - visibleRange.min;
  const wFrac = (widthPercent - visibleRange.min) / span;
  const lFrac = lengthPercent / 100;
  return orientation === "landscape"
    ? { x: stageWidth * (1 - lFrac), y: stageHeight * wFrac }
    : { x: stageWidth * wFrac, y: stageHeight * lFrac };
}

/** Modèle du point du modèle (résultat inverse de `projectToScreen`). */
export interface ModelPoint {
  widthPercent: number;
  lengthPercent: number;
}

/** Inverse de `projectToScreen` : pixel écran -> point du modèle. */
export function unprojectFromScreen(
  screenX: number,
  screenY: number,
  stageWidth: number,
  stageHeight: number,
  visibleRange: VisibleRange,
  orientation: FieldOrientation,
): ModelPoint {
  const span = visibleRange.max - visibleRange.min;
  if (orientation === "landscape") {
    return {
      widthPercent: visibleRange.min + (screenY / stageHeight) * span,
      lengthPercent: (1 - screenX / stageWidth) * 100,
    };
  }
  return {
    widthPercent: visibleRange.min + (screenX / stageWidth) * span,
    lengthPercent: (screenY / stageHeight) * 100,
  };
}

/** Rectangle écran (toujours aligné aux axes) couvrant une zone du modèle
 * donnée par une plage sur chaque axe — les deux coins fournis n'ont pas
 * besoin d'être "min avant max", le résultat est normalisé. */
export function projectRect(
  width1: number,
  length1: number,
  width2: number,
  length2: number,
  stageWidth: number,
  stageHeight: number,
  visibleRange: VisibleRange,
  orientation: FieldOrientation,
): { x: number; y: number; width: number; height: number } {
  const p1 = projectToScreen(width1, length1, stageWidth, stageHeight, visibleRange, orientation);
  const p2 = projectToScreen(width2, length2, stageWidth, stageHeight, visibleRange, orientation);
  return {
    x: Math.min(p1.x, p2.x),
    y: Math.min(p1.y, p2.y),
    width: Math.abs(p2.x - p1.x),
    height: Math.abs(p2.y - p1.y),
  };
}

/**
 * Dimensions du Stage pour tenir dans un conteneur donné (largeur ET hauteur,
 * comme `object-fit: contain`), en respectant les proportions réelles du
 * terrain selon l'orientation — voir `components/field/Field.tsx`.
 */
export function fitFieldStageSize(
  containerWidth: number,
  containerHeight: number,
  fieldConfig: FieldConfig,
  orientation: FieldOrientation,
): { width: number; height: number } {
  const aspectRatio = fieldConfig.lengthMeters / fieldConfig.widthMeters;
  let width = containerWidth;
  let height = orientation === "landscape" ? width / aspectRatio : width * aspectRatio;
  if (containerHeight > 0 && height > containerHeight) {
    height = containerHeight;
    width = orientation === "landscape" ? height * aspectRatio : height / aspectRatio;
  }
  return { width, height };
}

/**
 * Étendue en pixels de l'axe largeur à l'écran, quelle que soit l'orientation
 * — sert de référence commune pour dimensionner marqueurs/rayons de façon
 * cohérente entre portrait et landscape (l'axe largeur pilote la hauteur du
 * Stage en landscape, sa largeur en portrait).
 */
export function widthAxisPixelSpan(
  stageWidth: number,
  stageHeight: number,
  orientation: FieldOrientation,
): number {
  return orientation === "landscape" ? stageHeight : stageWidth;
}
