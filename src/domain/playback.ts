import type { Frame } from "./models";

/** Voir docs/DATA_MODEL.md §4 (Action.defaultTransitionMs) — valeur indicative
 * réutilisée ici tant que l'export/persistance d'Action n'existe pas (Phase 7). */
export const DEFAULT_TRANSITION_MS = 1200;

/** Durée (ms) de la transition arrivant sur `frame` en mode fluide. */
export function resolveTransitionMs(frame: Frame): number {
  return frame.transitionMs ?? DEFAULT_TRANSITION_MS;
}
