import type { Frame } from "./models";

/** Voir docs/DATA_MODEL.md §9 et docs/ARCHITECTURE.md §7. */

/** L'unique frame avec parentId === null. */
export function getRootFrame(frames: Frame[]): Frame | undefined {
  return frames.find((f) => f.parentId === null);
}

export function getFrame(frames: Frame[], id: string): Frame | undefined {
  return frames.find((f) => f.id === id);
}

/** Enfants directs d'une frame, triés par siblingOrder. */
export function getChildren(frames: Frame[], parentId: string): Frame[] {
  return frames
    .filter((f) => f.parentId === parentId)
    .sort((a, b) => a.siblingOrder - b.siblingOrder);
}

/** Un embranchement = une frame avec plus d'un enfant. */
export function isForkFrame(frames: Frame[], frameId: string): boolean {
  return getChildren(frames, frameId).length > 1;
}

/** Une frame et tous ses descendants (elle incluse), utile pour une suppression en cascade. */
export function getSubtreeIds(frames: Frame[], rootId: string): string[] {
  const ids = [rootId];
  for (const child of getChildren(frames, rootId)) {
    ids.push(...getSubtreeIds(frames, child.id));
  }
  return ids;
}

export interface CurrentPathView {
  /** Chemin continu passant par la frame courante, sans ambiguïté : tous les
   * ancêtres jusqu'à la racine (remonter via `parentId` ne bifurque jamais),
   * puis les descendants tant qu'il n'y a qu'un seul enfant à chaque étape. */
  chain: Frame[];
  /** Options du premier embranchement rencontré juste après la fin de `chain`
   * (tableau vide si `chain` se termine sur une feuille ou sur la frame
   * courante elle-même sans enfant). */
  forkOptions: Frame[];
}

/**
 * Vue compacte "où en est-on dans l'arbre" pour la barre Frames (voir
 * docs/PRD.md §4.8) : pas tout l'arbre, seulement le chemin qui passe par la
 * frame courante, étendu au maximum sans ambiguïté dans les deux sens.
 * Naviguer vers une autre branche déjà explorée se fait en deux temps
 * (remonter jusqu'à l'embranchement, puis choisir l'autre option) plutôt
 * qu'en un raccourci direct — compromis délibéré pour garder cette barre
 * toujours visible sans jamais afficher tout l'arbre.
 */
export function computeCurrentPathView(
  frames: Frame[],
  currentFrameId: string | null,
): CurrentPathView {
  const current = currentFrameId ? getFrame(frames, currentFrameId) : undefined;
  if (!current) return { chain: [], forkOptions: [] };

  const ancestors: Frame[] = [];
  let cursor = current;
  while (cursor.parentId !== null) {
    const parent = getFrame(frames, cursor.parentId);
    if (!parent) break;
    ancestors.unshift(parent);
    cursor = parent;
  }

  const descendants: Frame[] = [];
  let tail = current;
  for (;;) {
    const children = getChildren(frames, tail.id);
    if (children.length !== 1) break;
    descendants.push(children[0]);
    tail = children[0];
  }

  const tailChildren = getChildren(frames, tail.id);
  return {
    chain: [...ancestors, current, ...descendants],
    forkOptions: tailChildren.length > 1 ? tailChildren : [],
  };
}

/**
 * Résout un chemin complet de la racine à une feuille (ou au premier
 * embranchement sans choix fourni), en suivant `choices` (clé = id de la
 * frame-embranchement, valeur = id de l'enfant choisi) à chaque fork.
 */
export function resolvePath(frames: Frame[], choices: Record<string, string> = {}): Frame[] {
  const root = getRootFrame(frames);
  if (!root) return [];

  const path: Frame[] = [root];
  let current = root;
  for (;;) {
    const children = getChildren(frames, current.id);
    if (children.length === 0) break;
    const next =
      children.length === 1 ? children[0] : children.find((c) => c.id === choices[current.id]);
    if (!next) break;
    path.push(next);
    current = next;
  }
  return path;
}
