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

/**
 * Numérotation d'affichage stable (parcours préfixe depuis la racine, enfants
 * dans l'ordre de siblingOrder). Sert à identifier une frame dans la timeline
 * sans dépendre d'un index de tableau brut.
 */
export function computeDisplayOrder(frames: Frame[]): Map<string, number> {
  const order = new Map<string, number>();
  let counter = 1;

  function visit(id: string) {
    order.set(id, counter++);
    for (const child of getChildren(frames, id)) visit(child.id);
  }

  const root = getRootFrame(frames);
  if (root) visit(root.id);
  return order;
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
