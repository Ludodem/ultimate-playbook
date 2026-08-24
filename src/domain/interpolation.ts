import { resolveDiscPosition, type Position } from "./disc";
import type { Frame, IncomingCurves } from "./models";

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function interpolatePosition(a: Position, b: Position, t: number): Position {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

/** Courbe de Bézier quadratique à un seul point de contrôle — voir docs/DATA_MODEL.md §8. */
export function quadraticBezier(
  p0: Position,
  control: Position,
  p1: Position,
  t: number,
): Position {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * control.x + t * t * p1.x,
    y: u * u * p0.y + 2 * u * t * control.y + t * t * p1.y,
  };
}

/**
 * Sommet réel de la courbe (t=0.5) — contrairement au point de contrôle, ce
 * point est effectivement SUR la courbe. C'est lui que l'éditeur affiche/fait
 * glisser (voir DiscCurveEditor.tsx), pour que borner sa position à la zone
 * visible borne exactement ce qu'on voit, sans "amortissement" : le sommet
 * de la courbe ne s'écarte de la ligne droite que de la moitié de l'écart
 * entre le point de contrôle et le milieu du segment.
 */
export function curveMidpoint(p0: Position, control: Position, p1: Position): Position {
  return quadraticBezier(p0, control, p1, 0.5);
}

/** Point de contrôle nécessaire pour que la courbe passe exactement par `midpoint` à t=0.5 (inverse de `curveMidpoint`). */
export function controlPointForMidpoint(p0: Position, p1: Position, midpoint: Position): Position {
  return {
    x: 2 * midpoint.x - 0.5 * (p0.x + p1.x),
    y: 2 * midpoint.y - 0.5 * (p0.y + p1.y),
  };
}

/** Échantillonne la courbe en `steps` segments, pour un tracé (flèche/aperçu) fidèle à l'interpolation réelle. */
export function sampleQuadraticBezier(
  p0: Position,
  control: Position,
  p1: Position,
  steps = 24,
): Position[] {
  const points: Position[] = [];
  for (let i = 0; i <= steps; i++) {
    points.push(quadraticBezier(p0, control, p1, i / steps));
  }
  return points;
}

function interpolateWithOptionalCurve(
  a: Position,
  b: Position,
  t: number,
  control?: Position,
): Position {
  return control ? quadraticBezier(a, control, b, t) : interpolatePosition(a, b, t);
}

/**
 * Construit une frame "virtuelle" à l'instant t (0-1) entre deux frames
 * consécutives d'un même chemin, réutilisable telle quelle par `Field`
 * (mêmes types `entities`/`disc`) — voir docs/ARCHITECTURE.md §4.
 *
 * - Une entité/le disque avec une entrée dans `to.incomingCurves` suit une
 *   courbe de Bézier quadratique ; sinon interpolation en ligne droite
 *   (voir docs/DATA_MODEL.md §8 — seule la clé "disc" a une UI d'édition au MVP).
 * - Une entité ajoutée entre les deux frames (absente de `from`) apparaît
 *   directement à sa position dans `to`, sans animation d'entrée.
 * - Le disque est interpolé entre ses positions résolues (`resolveDiscPosition`)
 *   dans chaque frame, qu'il soit tenu ou libre.
 */
export function buildInterpolatedFrame(from: Frame, to: Frame, t: number): Frame {
  const fromById = new Map(from.entities.map((e) => [e.id, e]));
  const curves: IncomingCurves = to.incomingCurves ?? {};

  const entities = to.entities.map((entity) => {
    const start = fromById.get(entity.id);
    if (!start) return entity;
    const position = interpolateWithOptionalCurve(start, entity, t, curves[entity.id]);
    return { ...entity, ...position };
  });

  const discFrom = resolveDiscPosition(from.disc, from.entities);
  const discTo = resolveDiscPosition(to.disc, to.entities);
  const discPosition =
    discFrom && discTo ? interpolateWithOptionalCurve(discFrom, discTo, t, curves.disc) : discTo;

  return {
    ...to,
    entities,
    disc: discPosition ? { x: discPosition.x, y: discPosition.y } : to.disc,
  };
}
